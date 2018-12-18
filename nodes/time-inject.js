/********************************************
 * within-time-switch:
 *********************************************/
"use strict";
const util = require('util');

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const cron = require("cron");

module.exports = function (RED) {
    "use strict";

    function getScheduleTime(time, limit) {
        var now = new Date();
        var millis = time.getTime() - now.getTime();
        if (limit) {
            while (millis < limit) {
                millis += 86400000; //24h
            }
        }
        return millis;
    }

    function getPayload(node, msg, msgProperty, type, value, offset, days) {
        if (type == null || type === "none" || type === "" || (typeof type === 'undefined')) {
            if (value === "") {
                msg[msgProperty] = Date.now();
            } else {
                msg[msgProperty] = value;
            }
        } else if (type === "pdsCalcData") {
            msg[msgProperty] = node.positionConfig.getSunCalc(msg.ts);
        } else if (type === "pdmCalcData") {
            msg[msgProperty] = node.positionConfig.getMoonCalc(msg.ts);
        } else if (type === "entered" || type === "pdsTime" || type === "pdmTime" || (type === "date" && offset && offset !== 0)) {
            msg[msgProperty] = node.positionConfig.getTimeProp(node, msg, type, value, offset, 1, days);
            if (!msg[msgProperty].error) {
                let delay = getScheduleTime(msg[msgProperty].value, (type === "date") ? 10 : undefined);

                msg[msgProperty].timeStr = msg[msgProperty].value.toLocaleString();
                msg[msgProperty].timeUTCStr = msg[msgProperty].value.toUTCString();
                msg[msgProperty].delay = delay;
                msg[msgProperty].delaySec = Math.round(delay / 1000);
                msg[msgProperty].delayMin = Math.round(delay / 60000);
            }
        } else {
            msg[msgProperty] = RED.util.evaluateNodeProperty(value, type, node, msg);
        }
        return msg;
    }

    function timeInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        //this.debug('initialize timeInjectNode ' + util.inspect(config));

        this.payload = config.payload || '';
        this.payloadType = config.payloadType || 'none';
        this.topic = config.topic;

        this.time = config.time;
        this.timeType = config.timeType || 'none';
        this.timeDays = config.timeDays;
        this.offset = config.offset || 0;
        this.offsetMultiplier = config.offsetMultiplier || 60;

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.timeAlt = config.timeAlt || '';
        this.timeAltType = config.timeAltType || 'none';
        this.timeAltOffset = config.timeAltOffset || 0;
        this.timeAltOffsetMultiplier = config.timeAltOffsetMultiplier || 60;

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.once = config.once;
        this.onceDelay = (config.onceDelay || 0.1) * 1000;

        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        this.nextTimeData = null;
        this.nextTimeAltData = null;
        var node = this;

        function doCreateTimeout(node, msg) {
            let errorStatus = '';
            let isAltFirst = false;
            let isFixedTime = true;
            node.nextTime = null;
            node.nextTimeAlt = null;

            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }

            if (node.timeType !== 'none' && node.positionConfig) {
                //(srcNode, msg, vType, value, offset, next, days)
                //node.nextTime = hlp.getTimeProp(node, node.timeType, node.time, node.offset * node.offsetMultiplier, 1);
                node.nextTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeType, node.time, node.offset * node.offsetMultiplier, 1, node.timeDays);
                if (node.nextTimeData.error) {
                    errorStatus = "could not evaluate time";
                    node.error(node.nextTimeData.error);
                    node.debug(util.inspect(node.nextTimeData));
                    //console.log('1');
                    node.nextTime = null;
                    isFixedTime = false;
                } else {
                    node.nextTime = node.nextTimeData.value;
                    isFixedTime = node.nextTimeData.fix;
                }
            }
            //console.log(util.inspect(node.nextTimeData));

            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                node.nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, node.timeAltType, node.timeAlt, node.timeAltOffset * node.timeAltOffsetMultiplier, 1, node.timeDays);
                if (node.nextTimeAltData.error) {
                    errorStatus = "could not evaluate alternate time";
                    node.error(node.nextTimeAltData.error);
                    //console.log('2');
                    node.nextTimeAlt = null;
                    isFixedTime = false;
                } else {
                    node.nextTimeAlt = node.nextTimeAltData.value;
                    isFixedTime = isFixedTime && node.nextTimeAltData.fix;
                }
            }
            if (node.nextTime && !errorStatus) {
                if (!(node.nextTime instanceof Date) || node.nextTime === 'Invalid Date' || isNaN(node.nextTime)) {
                    //node.debug(node.nextTime);
                    hlp.errorHandler(this, new Error('Invalid Date'), 'Invalid time format', 'internal error!');
                    return;
                }
                let millis = getScheduleTime(node.nextTime, 10);
                //node.debug('timeout ' + node.nextTime + ' is in ' + millis + 'ms');
                let isAlt = (node.nextTimeAlt);
                if (isAlt) {
                    let millisAlt = getScheduleTime(node.nextTimeAlt, 10);
                    if (millisAlt < millis) {
                        millis = millisAlt;
                        isAltFirst = true;
                    }
                }
                node.timeOutObj = setTimeout((isAlt, isAltFirst) => {
                    let msg = {
                        type: 'start',
                        timeData: {}
                    };
                    node.timeOutObj = null;
                    let useAlternateTime = false;
                    if (isAlt) {
                        let needsRecalc = false;
                        try {
                            let res = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
                            useAlternateTime = ((res == true) || (res == 'true'));
                            needsRecalc = (isAltFirst && !useAlternateTime) || (!isAltFirst && useAlternateTime);
                        } catch (err) {
                            needsRecalc = isAltFirst;
                            hlp.errorHandler(node, err, RED._("time-inject.errors.invalid-property-type", {
                                type: node.propertyType,
                                value: node.property
                            }));
                            node.log(util.inspect(err));
                        }
                        if (needsRecalc) {
                            try {
                                doCreateTimeout(node, msg);
                            } catch (err) {
                                hlp.errorHandler(node, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
                            }
                            return;
                        }
                    }
                    if (useAlternateTime && node.nextTimeAltData) {
                        msg.timeData = node.nextTimeAltData;
                    } else if (node.nextTimeData) {
                        msg.timeData = node.nextTimeData;
                    }
                    //node.debug('redo doCreateTimeout');
                    node.emit("input", msg);
                }, millis, isAlt, isAltFirst);
            }

            if (!isFixedTime && !node.intervalObj) {
                node.intervalObj = setInterval(() => {
                    //node.debug('retrigger timecalc');
                    doCreateTimeout(node, msg);
                }, node.recalcTime);
            } else if (isFixedTime && node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }

            if (errorStatus) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: errorStatus + ((node.intervalObj) ? ' 🖩' : '')
                });
            } else if (node.nextTimeAlt && node.timeOutObj) {
                if (isAltFirst) {
                    node.status({
                        fill: "green",
                        shape: "ring",
                        text: node.nextTimeAlt.toLocaleString() + ' / ' + node.nextTime.toLocaleTimeString()
                    });
                } else {
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: node.nextTime.toLocaleString() + ' / ' + node.nextTimeAlt.toLocaleTimeString()
                    });
                }
            } else if (node.nextTime && node.timeOutObj) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: node.nextTime.toLocaleString()
                });
            } else {
                node.status({});
            }
        }

        this.on('close', function () {
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
            }
            if (node.intervalObj) {
                clearInterval(node.intervalObj);
            }
            // tidy up any state
        });

        this.on('input', msg => {
            try {
                doCreateTimeout(node, msg);
                node.debug('input ' + util.inspect(msg));
                msg.topic = this.topic;

                msg = getPayload(this, msg, 'payload', this.payloadType, this.payload);
                if (!msg.payload) {
                    throw new error("could not evaluate " + this.payloadType + '.' + this.payload);
                } else if (msg.payload.error) {
                    throw new error('error on getting payload: ' + msg.payload.error);
                }
                this.debug(config.addPayload1Type);
                this.debug(config.addPayload1);
                this.debug(config.addPayload1ValueType);
                this.debug(config.addPayload1Value);
                if (config.addPayload1Type === 'msgProperty' && config.addPayload1) {
                    msg = getPayload(this, msg, config.addPayload1, config.addPayload1ValueType, config.addPayload1Value, config.addPayload1Offset, config.addPayload1Days);
                    if (msg[config.addPayload1].error) {
                        this.error('error on getting additional payload 1: ' + msg[config.addPayload1].error);
                    }
                }

                if (config.addPayload2Type === 'msgProperty' && config.addPayload2) {
                    msg = getPayload(this, msg, config.addPayload2, config.addPayload2ValueType, config.addPayload2Value, config.addPayload2Offset, config.addPayload2Days);
                    if (msg[config.addPayload2].error) {
                        this.error('error on getting additional payload 1: ' + msg[config.addPayload2].error);
                    }
                }
                node.send(msg);
            } catch (err) {
                hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
            }
        });

        try {
            if (this.once) {
                this.onceTimeout = setTimeout(function () {
                    node.emit("input", {
                        type: 'once'
                    });
                    doCreateTimeout(node, undefined);
                }, this.onceDelay);
            } else {
                doCreateTimeout(node, undefined);
            }
        } catch (err) {
            hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
        }
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};