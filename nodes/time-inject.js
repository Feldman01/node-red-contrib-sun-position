/********************************************
 * time-inject:
 *********************************************/
'use strict';

const util = require('util');
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const cron = require('cron');

module.exports = function (RED) {
    'use strict';

    function tsSetAddProp(node, msg, type, name, valueType, value, format, offset, offsetType, multiplier, days) {
        // node.debug(`tsSetAddProp  ${msg}, ${type}, ${name}, ${valueType}, ${value}, ${format}, ${offset}, ${offsetType}, ${multiplier}, ${days}`);
        if (type !== 'none') {
            const res = node.positionConfig.getOutDataProp(node, msg, valueType, value, format, offset, offsetType, multiplier, days);
            if (res === null || (typeof res === 'undefined')) {
                throw new Error('could not evaluate ' + valueType + '.' + value);
            } else if (res.error) {
                this.error('error on getting additional payload 1: ' + res.error);
            } else if (type === 'msgPayload') {
                msg.payload = res;
            } else if (type === 'msgTs') {
                msg.ts = res;
            } else if (type === 'msgLc') {
                msg.lc = res;
            } else if (type === 'msgValue') {
                msg.value = res;
            } else if (type === 'msgDelay') {
                msg.delay = res;
            } else if (type === 'msgOnTime') {
                msg.onTime = res;
            } else if (type === 'msgRampTime') {
                msg.rampTime = res;
            } else if (type === 'msg') {
                RED.util.setMessageProperty(msg, name, res);
            } else if ((type === 'flow' || type === 'global')) {
                const contextKey = RED.util.parseContextStore(name);
                node.context()[type].set(contextKey.key, res, contextKey.store);
            }
        }
    }

    function timeInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize timeInjectNode ' + util.inspect(config));
        this.cronjob = null;
        this.time = config.time;
        this.timeType = config.timeType || 'none';
        this.timeDays = config.timeDays;
        this.timeAltDays = config.timeAltDays;
        this.offset = config.offset || config.timeOffset || 0;
        this.offsetType = config.offsetType;
        if (!this.offsetType) { this.offsetType = ((this.offset === 0) ? 'none' : 'num'); }
        this.offsetMultiplier = config.offsetMultiplier || config.timeOffsetMultiplier || 60;

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.timeAlt = config.timeAlt || '';
        this.timeAltType = config.timeAltType || 'none';
        this.timeAltOffset = config.timeAltOffset || 0;
        this.timeAltOffsetType = config.timeAltOffsetType;
        if (!this.timeAltOffsetType) { this.timeAltOffsetType = ((this.timeAltOffset === 0) ? 'none' : 'num'); }
        this.timeAltOffsetMultiplier = config.timeAltOffsetMultiplier || 60;

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        this.nextTimeData = null;
        this.nextTimeAltData = null;
        const node = this;

        function doCreateTimeout(node, _onInit) {
            let errorStatus = '';
            let isAltFirst = false;
            let isFixedTime = true;
            node.nextTime = null;
            node.nextTimeAlt = null;

            if (node.cronjob) {
                node.cronjob.stop();
                node.cronjob = null;
            }

            if (node.timeType !== 'none' && node.positionConfig) {
                node.nextTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeType, node.time, node.offset, node.offsetType, node.offsetMultiplier, 1, node.timeDays);
                if (node.nextTimeData.error) {
                    errorStatus = 'could not evaluate time';
                    node.nextTime = null;
                    isFixedTime = false;
                    if (_onInit === true) {
                        return { state:'error', done: false, statusMsg: errorStatus, errorMsg: node.nextTimeData.error};
                    }
                    node.error(node.nextTimeData.error);
                    node.debug('nextTimeData ' + util.inspect(node.nextTimeData));
                } else {
                    node.nextTime = node.nextTimeData.value;
                    isFixedTime = node.nextTimeData.fix;
                }
            }

            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                // (_srcNode, msg, vType, value, offset, offsetType, multiplier, next, days)
                node.nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, node.timeAltType, node.timeAlt, node.timeAltOffset, node.timeAltOffsetType, node.timeAltOffsetMultiplier, 1, node.timeAltDays);
                if (node.nextTimeAltData.error) {
                    errorStatus = 'could not evaluate alternate time';
                    node.nextTimeAlt = null;
                    isFixedTime = false;
                    if (_onInit === true) {
                        return { state:'error', done: false, statusMsg: errorStatus, errorMsg: node.nextTimeAltData.error};
                    }
                    node.error(node.nextTimeAltData.error);
                    node.debug('nextTimeAltData: ' + util.inspect(node.nextTimeAltData));
                } else {
                    node.nextTimeAlt = node.nextTimeAltData.value;
                    isFixedTime = isFixedTime && node.nextTimeAltData.fix;
                }
            }

            if ((node.nextTime !== null) && (errorStatus === '')) {
                if (!(node.nextTime instanceof Date) || node.nextTime === 'Invalid Date' || isNaN(node.nextTime)) {
                    hlp.handleError(this, 'Invalid time format', undefined, 'internal error!');
                    return { state:'error', done: false, statusMsg: 'internal error!', errorMsg: 'Invalid time format'};
                }

                let nextTime = node.nextTime;
                const isAlt = (node.nextTimeAlt);
                if (isAlt) {
                    if (nextTime < node.nextTimeAlt) {
                        nextTime = node.nextTimeAlt;
                        isAltFirst = true;
                    }
                }
                node.cronjob = new cron.CronJob(nextTime, () => {
                    const msg = {
                        type: 'start',
                        timeData: {}
                    };
                    node.cronjob.stop();
                    node.cronjob = null;
                    let useAlternateTime = false;
                    if (isAlt) {
                        let needsRecalc = false;
                        try {
                            const res = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
                            useAlternateTime = hlp.isTrue(res);
                            needsRecalc = (isAltFirst && !useAlternateTime) || (!isAltFirst && useAlternateTime);
                        } catch (err) {
                            needsRecalc = isAltFirst;
                            hlp.handleError(node, RED._('time-inject.errors.invalid-property-type', {
                                type: node.propertyType,
                                value: node.property
                            }),  err);
                        }

                        if (needsRecalc) {
                            try {
                                node.debug('needsRecalc');
                                doCreateTimeout(node);
                            } catch (err) {
                                node.error(err.message);
                                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                                node.status({
                                    fill: 'red',
                                    shape: 'ring',
                                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                                });
                            }
                            return { state:'recalc', done: true };
                        }
                    }

                    if (useAlternateTime && node.nextTimeAltData) {
                        msg.timeData = node.nextTimeAltData;
                    } else if (node.nextTimeData) {
                        msg.timeData = node.nextTimeData;
                    }
                    node.emit('input', msg);
                }, null, true);
            }

            if (!isFixedTime && !node.intervalObj && (_onInit !== true)) {
                node.intervalObj = setInterval(() => {
                    node.debug('retriggered');
                    doCreateTimeout(node);
                }, node.recalcTime);
            } else if (isFixedTime && node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }

            if ((errorStatus !== '')) {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: errorStatus + ((node.intervalObj) ? ' ↺🖩' : '')
                });
                return { state:'error', done: false, statusMsg: errorStatus, errorMsg: errorStatus };
            // if an error occurred, will retry in 10 minutes. This will prevent errors on initialization.
            } else if (node.nextTimeAlt && node.cronjob) {
                if (isAltFirst) {
                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: node.nextTimeAlt.toLocaleString() + ' / ' + node.nextTime.toLocaleTimeString()
                    });
                } else {
                    node.status({
                        fill: 'green',
                        shape: 'dot',
                        text: node.nextTime.toLocaleString() + ' / ' + node.nextTimeAlt.toLocaleTimeString()
                    });
                }
            } else if (node.nextTime && node.cronjob) {
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: node.nextTime.toLocaleString()
                });
            } else {
                node.status({});
            }
            return { state:'ok', done: true };
        }

        this.on('close', () => {
            if (node.cronjob) {
                node.cronjob.stop();
                node.cronjob = null;
            }

            if (node.intervalObj) {
                clearInterval(node.intervalObj);
            }
            // tidy up any state
        });

        this.on('input', msg => {
            try {
                msg._srcid = node.id;
                node.debug('input ');
                doCreateTimeout(node);
                msg.topic = config.topic;
                if (!node.positionConfig) {
                    throw new Error('configuration missing!');
                }
                const value = node.positionConfig.getOutDataProp(node, msg, config.payloadType, config.payload,  config.payloadTimeFormat, node.payloadOffset, config.payloadOffsetType, config.payloadOffsetMultiplier);
                if (value === null || (typeof value === 'undefined')) {
                    throw new Error('could not evaluate ' + config.payloadType + '.' + config.payload);
                } else if (value.error) {
                    throw new Error('could not getting payload: ' + value.error);
                } else {
                    msg.payload = value;
                }

                tsSetAddProp(this, msg, config.addPayload1Type, config.addPayload1, config.addPayload1ValueType, config.addPayload1Value,
                    config.addPayload1Format, config.addPayload1Offset, config.addPayload1OffsetType, config.addPayload1OffsetMultiplier, config.addPayload1Days);
                tsSetAddProp(this, msg, config.addPayload2Type, config.addPayload2, config.addPayload2ValueType, config.addPayload2Value,
                    config.addPayload2Format, config.addPayload2Offset, config.addPayload2OffsetType, config.addPayload2OffsetMultiplier, config.addPayload2Days);
                tsSetAddProp(this, msg, config.addPayload3Type, config.addPayload3, config.addPayload3ValueType, config.addPayload3Value,
                    config.addPayload3Format, config.addPayload3Offset, config.addPayload3OffsetType, config.addPayload3OffsetMultiplier, config.addPayload3Days);

                node.send(msg);
            } catch (err) {
                node.error(err.message);
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
            }
        });

        node.status({});
        try {
            if (config.once) {
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: RED._('time-inject.message.onceDelay', { seconds: (config.onceDelay || 0.1)})
                });

                config.onceTimeout = setTimeout(() => {
                    node.emit('input', {
                        type: 'once'
                    });
                    doCreateTimeout(node);
                }, (config.onceDelay || 0.1) * 1000);
                return;
            }

            const createTO = doCreateTimeout(node, true);
            if (createTO.done !== true) {
                if (createTO.errorMsg) {
                    node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', { message: createTO.errorMsg, time: 6}));
                }
                setTimeout(() => {
                    try {
                        doCreateTimeout(node);
                    } catch (err) {
                        node.error(err.message);
                        node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                        node.status({
                            fill: 'red',
                            shape: 'ring',
                            text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                        });
                    }
                }, 360000); // 6 Minuten
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-init', { message: createTO.statusMsg, time: '6min'})
                });
            }
        } catch (err) {
            node.error(err.message);
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.status({
                fill: 'red',
                shape: 'ring',
                text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
            });
        }
    }

    RED.nodes.registerType('time-inject', timeInjectNode);

    RED.httpAdmin.get('/sun-position/js/*', RED.auth.needsPermission('sun-position.read'), (req,res) => {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });

    RED.httpAdmin.post('/time-inject/:id', RED.auth.needsPermission('time-inject.write'), (req,res) => {
        const node = RED.nodes.getNode(req.params.id);
        if (node !== null) {
            try {
                node.receive();
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._('node-red:inject.failed',{error:err.toString()}));
            }
        } else {
            res.sendStatus(404);
        }
    });
};