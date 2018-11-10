/********************************************
 * sun-position:
 *********************************************/
"use strict";

const sunCalc = require('suncalc');

module.exports = {
    errorHandler,
    compareAzimuth,
    calcTimeValue,
    getTimeOfText,
    getOnlyTime,
    getNodeId
};

/*******************************************************************************************************/
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

/*******************************************************************************************************/
/* exported functions                                                                                  */
/*******************************************************************************************************/
function getNodeId(node) {
    //node.debug(node.debug(JSON.stringify(srcNode, Object.getOwnPropertyNames(srcNode))));
    return '[' + node.type + ((node.name) ? '/' + node.name + ':' : ':') + node.id + ']';
}
/*******************************************************************************************************/
function errorHandler(node, err, messageText, stateText) {
    if (!err) {
        return true;
    }
    if (err.message) {
        let msg = err.message.toLowerCase();
        messageText += ':' + err.message;
    } else {
        messageText += '! (No error message given!)';
    }

    if (node) {
        node.error(messageText);
        node.debug(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        node.status({
            fill: "red",
            shape: "ring",
            text: stateText
        });
    } else if (console) {
        console.error(messageText);
        console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
    return false;
};
/*******************************************************************************************************/
function getOnlyTime(date) {
    return date.getSeconds() + date.getMinutes() * 60 + date.getHours() * 3600;
}
/*******************************************************************************************************/
/*function compareAzimuth(obj, name, azimuth, low, high, old) {
    if (typeof low !== 'undefined' && low !== '' && !isNaN(low)) {
        if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
            if (high > low) {
                obj[name] = (azimuth > low) && (azimuth < high);
            } else {
                obj[name] = (azimuth > low) || (azimuth < high);
            }
        } else {
            obj[name] = (azimuth > low);
        }
        return obj[name] != old[name];
    } else if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
        obj[name] = (azimuth < high);
        return obj[name] != old[name];
    }
    return false;
}; */
function compareAzimuth(azimuth, low, high) {
    if (typeof low !== 'undefined' && low !== '' && !isNaN(low) && low >= 0) {
        if (typeof high !== 'undefined' && high !== '' && !isNaN(high) && high >= 0) {
            if (high > low) {
                return (azimuth > low) && (azimuth < high);
            } else {
                return (azimuth > low) || (azimuth < high);
            }
        } else {
            return (azimuth > low);
        }
    } else if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
        return  (azimuth < high);
    }
    return false;
};
/*******************************************************************************************************/
function calcTimeValue(d, offset, next, days) {
    if (offset && !isNaN(offset) && offset !== 0) {
        result = new Date(result.getTime() + offset * 1000);
    }
    if (next && !isNaN(next)) {
        let now = new Date();
        d.setMilliseconds(0);
        now.setMilliseconds(0);
        if (d.getTime() <= (now.getTime())) {
            d = d.addDays(Number(next));
        }
    }
    if (days && (days !== '*') && (days !== '')) {
        let daystart = d.getDay();
        let dayx = 0;
        let daypos = daystart;
        while (days.indexOf(daypos) === -1) {
            dayx += 1;
            if ((daystart + dayx) > 6) {
                daypos = (daystart * -1) + dayx - 1;
            } else {
                daypos = daystart + dayx;
            }
            if (dayx > 6) {
                dayx = -1;
                break;
            }
        }
        if (dayx > 0) {
            d = d.addDays(dayx);
        }
    }
    return d;
}
/*******************************************************************************************************/
function getTimeOfText(t, offset, next, days) {
    let d = new Date();
    if (t) {
        let matches = t.match(/(0[0-9]|1[0-9]|2[0-3]|[0-9])(?::([0-5][0-9]|[0-9]))?(?::([0-5][0-9]|[0-9]))?\s*(p?)/);
        if (matches) {
            d.setHours(parseInt(matches[1]) + (matches[4] ? 12 : 0));
            d.setMinutes(parseInt(matches[2]) || 0);
            d.setSeconds(parseInt(matches[3]) || 0);
            d.setMilliseconds(0);
        }
    }
    calcTimeValue(d, offset, next, days)
    return d;
};
/*******************************************************************************************************/