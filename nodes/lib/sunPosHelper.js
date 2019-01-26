/* sunPosHelper.js */

/********************************************
 * sun-position:
 *********************************************/
'use strict';
const util = require('util');

module.exports = {
    isTrue,
    isFalse,
    handleError,
    getComperableDateFormat,
    parseComperableDateFormat,
    getComperableDateFormat2,
    parseComperableDateFormat2,
    getTimeDiff,
    compareAzimuth,
    addOffset,
    calcDayOffset,
    calcTimeValue,
    calcTimeValueUTC,
    getTimeOfText,
    getDateOfText,
    // getTimeOfTextUTC,
    // getDateOfTextUTC,
    getTimeNumber,
    getNodeId,
    formatDate,
    getFormatedDateOut,
    parseDate,
    parseArray,
    parseDateTime,
    parseDateFromFormat
};

/*******************************************************************************************************/
/* Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setUTCDate(date.getUTCDate() + days);
    return date;
} */

/*******************************************************************************************************/
/* exported functions                                                                                  */
/*******************************************************************************************************/
/**
 * returns **true** if the parameter value is a valid boolean value for **true**
 * @param {*} val a parameter which should be checkd if  it is a valid true boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **true**
 */
function isTrue(val) {
    val = (val+'').toLowerCase();
    return (val === 'true' || val === 'yes' || val === 'on' || val === 'ja' || val === '1' || (!isNaN(val) && (Number(val) > 0)));
}

/**
 * returns **true** if the parameter value is a valid boolean value for **false**
 * @param {*} val a parameter which should be checkd if  it is a valid false boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **false**
 */
function isFalse(val) {
    val = (val+'').toLowerCase();
    return (val === 'false' || val === 'no' || val === 'off' || val === 'nein' || val === '0' || (!isNaN(val) && (Number(val) <= 0)));
}

/*******************************************************************************************************/
function getNodeId(node) {
    // node.debug(node.debug(util.inspect(srcNode, Object.getOwnPropertyNames(srcNode))));
    return '[' + node.type + ((node.name) ? '/' + node.name + ':' : ':') + node.id + ']';
}
/*******************************************************************************************************/
function handleError(node, messageText, err, stateText) {
    if (!err) {
        err = new Error(messageText);
    } else {
        if (messageText && err.message) {
            messageText += ':' + err.message;
        } else if (err.message) {
            messageText = err.message;
        }
    }

    if (node && messageText) {
        node.error(messageText);
        node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        node.status({
            fill: 'red',
            shape: 'ring',
            text: (stateText) ? stateText : messageText
        });
    } else if (console) {
        console.error(messageText);
        console.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        console.trace();
    }
}
/*******************************************************************************************************/
/**
 * cratetes a string with two digets
 * @param {number} n number to format
 * @returns {string} number with minimum two digets
 */
function pad2(n) { // always returns a string
    return (n < 0 || n > 9 ? '' : '0') + n;
}

/**
 * gets a comparable date Format
 * @param {Date} date - Date to format
 * @return {string} number in Format YYYYMMDDHHMMSS
 */
function getComperableDateFormat(date) {
    return Number(date.getFullYear() +
        pad2(date.getMonth() + 1) +
        pad2(date.getDate()) +
        pad2(date.getHours()) +
        pad2(date.getMinutes()) +
        pad2(date.getSeconds()));
}

/*******************************************************************************************************/
/**
 * gets a date from a comparable date Format
 * @param {number} date - number or string in Format YYYYMMDDHHMMSS
 * @return {Date} date of the number
 */
function parseComperableDateFormat(date) {
    date = String(date);
    const year = date.substr(0, 4);
    const month = date.substr(4, 2);
    const day = date.substr(6, 2);
    const hours = date.substr(8, 2);
    const mins = date.substr(10, 2);
    const secs = date.substr(12, 2);
    const mss = date.substr(14);
    return new Date(year, month, day, hours, mins, secs, mss);
}

/*******************************************************************************************************/
/**
 * gets a comparable date Format
 * @param {Date} date - Date to format
 * @return {string} number in Format YYYYMMDD.HHMMSS
 */
function getComperableDateFormat2(date) {
    return Number(date.getFullYear() +
        pad2(date.getMonth() + 1) +
        pad2(date.getDate()) + '.' +
        pad2(date.getHours()) +
        pad2(date.getMinutes()) +
        pad2(date.getSeconds()));
}

/*******************************************************************************************************/
/**
 * gets a date from a comparable date Format
 * @param {number} date - number or string in Format YYYYMMDD.HHMMSS or YYYYMMDDTHHMMSS
 * @return {Date} date of the number
 */
function parseComperableDateFormat2(date) {
    date = String(date);
    const year = date.substr(0, 4);
    const month = date.substr(4, 2);
    const day = date.substr(6, 2);
    const hours = date.substr(9, 2);
    const mins = date.substr(11, 2);
    const secs = date.substr(13, 2);
    const mss = date.substr(15);
    return new Date(year, month, day, hours, mins, secs, mss);
}

/*******************************************************************************************************/
function getTimeNumber(date) {
    return date.getUTCMilliseconds() + date.getUTCSeconds() + date.getUTCMinutes() * 60 + date.getUTCHours() * 3600;
}

/*******************************************************************************************************/
/* function compareAzimuth(obj, name, azimuth, low, high, old) {
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
            }

            return (azimuth > low) || (azimuth < high);
        }

        return (azimuth > low);
    }

    if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
        return (azimuth < high);
    }

    return false;
}

/*******************************************************************************************************/
function addOffset(d, offset) {
    if (offset && !isNaN(offset) && offset !== 0) {
        return new Date(d.getTime() + offset * 1000); // - does not work
    }

    return d;
}

/*******************************************************************************************************/
function calcDayOffset(days, daystart) {
    let dayx = 0;
    let daypos = daystart;
    while (days.indexOf(daypos) === -1) {
        dayx += 1;
        if ((daystart + dayx) > 6) {
            daystart = (dayx * -1);
        }

        daypos = daystart + dayx;

        if (dayx > 7) {
            dayx = -1;
            break;
        }
    }

    return dayx;
}

/*******************************************************************************************************/
function calcTimeValue(d, offset, next, days) {
    // console.debug('calcTimeValue d=' + d + ' offset=' + offset + ' next=' + next + ' days=' + days);
    d = addOffset(d, offset);
    if (next && !isNaN(next)) {
        const now = new Date();
        d.setMilliseconds(0);
        now.setMilliseconds(600); // security
        const cmp = now.getTime();
        if (d.getTime() <= cmp) {
            d.setDate(d.getDate() + Number(next));
            // d = d.addDays(Number(next));
        }
    }

    if (days && (days !== '*') && (days !== '')) {
        const dayx = calcDayOffset(days, d.getDay());
        if (dayx > 0) {
            d.setDate(d.getDate() + dayx);
            // d = d.addDays(dayx);
        }
    }

    return d;
}

/*******************************************************************************************************/
function calcTimeValueUTC(d, offset, next, days) {
    // console.debug('calcTimeValueUTC d=' + d + ' offset=' + offset + ' next=' + next + ' days=' + days);
    d = addOffset(d, offset);
    if (next && !isNaN(next)) {
        const now = new Date();
        d.setUTCMilliseconds(0);
        now.setUTCMilliseconds(600); // security
        const cmp = now.getTime();
        if (d.getTime() <= cmp) {
            d.setUTCDate(d.getUTCDate() + Number(next));
            // d = d.addDays(Number(next));
        }
    }

    if (days && (days !== '*') && (days !== '')) {
        const dayx = calcDayOffset(days, d.getUTCDay());
        if (dayx > 0) {
            d.setUTCDate(d.getUTCDate() + dayx);
            // d = d.addDays(dayx);
        }
    }

    return d;
}

/*******************************************************************************************************/
function getTimeOfText(t, offset, next, days, date) {
    // console.debug('getTimeOfText t=' + t + ' offset=' + offset + ' next=' + next + ' days=' + days);
    const d = date || new Date();
    if (t && (t.indexOf('.') === -1) && (t.indexOf('-') === -1)) {
        const matches = t.match(/(0\d|1\d|2[0-3]|\d)(?::([0-5]\d|\d))(?::([0-5]\d|\d))?\s*(p?)/);
        if (matches) {
            d.setHours((parseInt(matches[1]) + (matches[4] ? 12 : 0)),
                (parseInt(matches[2]) || 0),
                (parseInt(matches[3]) || 0), 0);
        } else {
            return null;
        }

        return calcTimeValue(d, offset, next, days);
    }

    return null;
}

/*******************************************************************************************************/
function getDateOfText(date, offset, next, days) {
    if (date === null) {
        throw new Error('Could not evaluate as a valid Date or time. Value is null!');
    }

    if (typeof date === 'object') {
        if (date.hasOwnProperty('now')) {
            date = date.now;
        } else if (date.hasOwnProperty('date')) {
            date = date.date;
        } else if (date.hasOwnProperty('time')) {
            date = date.time;
        } else if (date.hasOwnProperty('ts')) {
            date = date.ts;
        } else if (date.hasOwnProperty('lc')) {
            date = date.lc;
        } else if (date.hasOwnProperty('value')) {
            date = date.lc;
        } else if (date.hasOwnProperty('payload')) {
            date = date.payload;
        } else if (date.hasOwnProperty('date')) {
            date = date.date;
        } else if (date.hasOwnProperty('timeStamp')) {
            date = date.timeStamp;
        } else if (date.hasOwnProperty('created')) {
            date = date.created;
        } else if (date.hasOwnProperty('changed')) {
            date = date.changed;
        } else {
            date = String(date);
        }
    }

    const re = /^(0\d|\d|1\d|2[0-3])(?::([0-5]\d|\d))?(?::([0-5]\d|\d))?\s*(pm?)?$/;
    if (re.test(String(date))) {
        const result = getTimeOfText(String(date), offset, next, days);
        if (result !== null) {
            return result;
        }
    }

    if (!isNaN(date)) {
        date = Number(date);
    }

    const dto = new Date(date);
    if (dto !== 'Invalid Date' && !isNaN(dto)) {
        return calcTimeValue(dto, offset, next, days);
    }

    if (typeof date === 'string') {
        let res = parseDateTime(date, true);
        if (res === null) {
            res = parseDate(date, true);
        }
        if (res === null) {
            res = parseArray(date, dateFormat.parseTimes);
        }
        return res;
    }
    throw new Error('could not evaluate ' + String(date) + ' as a valid Date or time.');
}
/*******************************************************************************************************/
/*
function getTimeOfTextUTC(t, tzOffset, offset, next, days, date) {
    //console.debug('getTimeOfTextUTC t=' + t + ' tzOffset=' + tzOffset + ' offset=' + offset + ' next=' + next + ' days=' + days);
    let d = date || new Date();
    if (t && (t.indexOf('.') === -1) && (t.indexOf('-') === -1)) {
        let matches = t.match(/(0[0-9]|1[0-9]|2[0-3]|[0-9])(?::([0-5][0-9]|[0-9]))(?::([0-5][0-9]|[0-9]))?\s*(p?)/);
        if (matches) {
            d.setHours((parseInt(matches[1]) + (matches[4] ? 12 : 0)),
                (parseInt(matches[2]) || 0) + (tzOffset || 0),
                (parseInt(matches[3]) || 0), 0);
            //console.log(d);
        } else {
            return null;
        }
        return calcTimeValueUTC(d, offset, next, days)
    }
    return null;
};
/*******************************************************************************************************/
/*
function getDateOfTextUTC(date, tzOffset, offset, next, days) {
    if (!isNaN(date)) {
        date = Number(date);
    }
    let dto = new Date(date);
    if (dto !== "Invalid Date" && !isNaN(dto)) {
        return calcTimeValueUTC(dto, offset, next, days);
    } else {
        let result = getTimeOfTextUTC(String(date), tzOffset, offset, next, days);
        if (result != null) {
            return result;
        }
    }
    throw new Error("could not evaluate " + String(date) + ' as a valid Date or time.');
};/** **/

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 *
 * http://blog.stevenlevithan.com/archives/date-time-format
 * http://stevenlevithan.com/assets/misc/date.format.js
 */

// Regexes and supporting functions are cached through closure

const dateFormat = (function () {
    const token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;

    const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;

    const timezoneClip = /[^-+\dA-Z]/g;

    const pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) {
            val = '0' + val;
        }

        return val;
    };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        const dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length === 1 && Object.prototype.toString.call(date) === '[object String]' && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        const now = new Date();
        date = date ? new Date(date) : now;
        const dayDiff = (date.getDate() - now.getDate());
        if (isNaN(date)) {
            throw new SyntaxError('invalid date');
        }

        mask = String(dF.masks[mask] || mask || dF.masks.default);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) === 'UTC:') {
            mask = mask.slice(4);
            utc = true;
        }

        const _ = utc ? 'getUTC' : 'get';

        const d = date[_ + 'Date']();

        const D = date[_ + 'Day']();

        const M = date[_ + 'Month']();

        const y = date[_ + 'FullYear']();

        const H = date[_ + 'Hours']();

        const m = date[_ + 'Minutes']();

        const s = date[_ + 'Seconds']();

        const L = date[_ + 'Milliseconds']();

        const o = utc ? 0 : date.getTimezoneOffset();

        const flags = {
            d,
            dd: pad(d),
            ddd: dF.i18n.dayNames[D + 7],
            dddd: dF.i18n.dayNames[D],
            E: dF.i18n.dayNames[D + 7],
            EE: dF.i18n.dayNames[D],
            M: M + 1,
            MM: pad(M + 1),
            MMM: dF.i18n.monthNames[M + 12],
            MMMM: dF.i18n.monthNames[M],
            NNN: dF.i18n.monthNames[M],
            yy: String(y).slice(2),
            yyyy: y,
            h: H % 12 || 12,
            hh: pad(H % 12 || 12),
            H,
            HH: pad(H),
            k: (H % 12 || 12) - 1,
            kk: pad((H % 12 || 12) - 1),
            K: H - 1,
            KK: pad(H - 1),
            m,
            mm: pad(m),
            s,
            ss: pad(s),
            lll: pad(L, 3),
            ll: pad(Math.round(L / 10)),
            l: L,
            L: pad(L > 99 ? Math.round(L / 10) : L),
            t: H < 12 ? 'a' : 'p',
            tt: H < 12 ? 'am' : 'pm',
            T: H < 12 ? 'A' : 'P',
            TT: H < 12 ? 'AM' : 'PM',
            Z: utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
            o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
            S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10],
            x: dayDiff,
            xx: ((dayDiff >= -7) && (dayDiff <= dF.i18n.dayDiffNames.length)) ? dF.i18n.dayDiffNames(dayDiff + 7) : dF.i18n.dayNames[D]
        };

        return mask.replace(token, $0 => {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
})();

// Some common format strings
dateFormat.masks = {
    default: 'ddd MMM dd yyyy HH:mm:ss',
    shortDate: 'm/d/yy',
    mediumDate: 'MMM d, yyyy',
    longDate: 'MMMM d, yyyy',
    fullDate: 'dddd, MMMM d, yyyy',
    shortTime: 'h:mm TT',
    mediumTime: 'h:mm:ss TT',
    longTime: 'h:mm:ss TT Z',
    isoDate: 'yyyy-MM-dd',
    isoTime: 'HH:MM:ss',
    isoDateTime: 'yyyy-MM-dd\'T\'HH:mm:ss',
    isoUtcDateTime: 'UTC:yyyy-MM-dd\'T\'HH:mm:ss\'Z\''
};

dateFormat.parseDates = {
    general : ['y-M-d', 'MMM d, y', 'MMM d,y', 'y-MMM-d', 'd-MMM-y', 'MMM d'],
    monthFirst : ['M/d/y', 'M-d-y', 'M.d.y', 'MMM-d', 'M/d', 'M-d'],
    dateFirst : ['d/M/y', 'd-M-y', 'd.M.y', 'd-MMM', 'd/M', 'd-M']
};

dateFormat.parseTimes = ['hh:mm:ss:lt', 'hh:mm:ss.lt', 'hh:mm:sst', 'hh:mmt', 'HH:mm:ss:l', 'HH:mm:ss.l', 'HH:mm:ss', 'HH:mm', 'h:mm:ss TT Z', 'h:mm:ss TT', 'h:mm TT'];

dateFormat.i18n = {
    dayNames: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
    ],
    monthNames: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ],
    dayDiffNames: [
        '1 week ago', '6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today', 'Tomorrow', 'day after tomorrow', 'in 3 days', 'in 4 days', 'in 5 days', 'in 6 days'
    ]
};

dateFormat.parse = [
    {label: 'Year yy (2 digits)', value: 'yy'},
    {label: 'Year yyyy (4 digits)', value: 'yyyy'},
    {label: 'Month M (1 digit)', value: 'M'},
    {label: 'Month MM (2 digits)', value: 'MM'},
    {label: 'Month MMM (name or abbr.)', value: 'MMM'},
    {label: 'Month NNN (abbr.)', value: 'NNN'},
    {label: 'Day of Month d (1 digit)', value: 'd'},
    {label: 'Day of Month dd (2 digits)', value: 'dd'},
    {label: 'Day of Week E (abbr)', value: 'E'},
    {label: 'Day of Week EE (name)', value: 'EE'},
    {label: 'Hour h (1 digit 1-12)', value: 'h'},
    {label: 'Hour hh (2 digits 1-12)', value: 'hh'},
    {label: 'Hour H (1 digit 0-23)', value: 'H'},
    {label: 'Hour HH (2 digits 0-23)', value: 'HH'},
    {label: 'Hour K (1 digit 0-11)', value: 'K'},
    {label: 'Hour KK (2 digits 0-11)', value: 'KK'},
    {label: 'Hour k (1 digit 1-24)', value: 'k'},
    {label: 'Hour kk (2 digits 1-24)', value: 'kk'},
    {label: 'Minute m (1 digit)', value: 'm'},
    {label: 'Minute mm (2 digits)', value: 'mm'},
    {label: 'Second s (1 digit)', value: 's'},
    {label: 'Second ss (2 digits)', value: 'ss'},
    {label: 'Milliseconds ll (2 digits)', value: 'll'},
    {label: 'Milliseconds lll (3 digits)', value: 'lll'},
    {label: 'AM/PM t (1 digit)', value: 't'},
    {label: 'AM/PM tt (2 digits)', value: 'tt'}
];
dateFormat.format = [
    {label: 'Year yyyy (4 digits)', value: 'yyyy'},
    {label: 'Year yy (2 digits)', value: 'yy'},
    {label: 'Month M (1 digit)', value: 'M'},
    {label: 'Month MM (2 digits)', value: 'MM'},
    {label: 'Month MMM (abbr.)', value: 'MMM'},
    {label: 'Month NNN (name)', value: 'NNN'},
    {label: 'Day of Month d (1 digit)', value: 'd'},
    {label: 'Day of Month dd (2 digits)', value: 'dd'},
    {label: 'Day of Week E (abbr)', value: 'E'},
    {label: 'Day of Week EE (name)', value: 'EE'},
    {label: 'Hour h (1-12)', value: 'h'},
    {label: 'Hour hh (2 digits 01-12)', value: 'hh'},
    {label: 'Hour H (0-23)', value: 'H'},
    {label: 'Hour HH (2 digits 00-23)', value: 'HH'},
    {label: 'Hour K (0-11)', value: 'K'},
    {label: 'Hour KK (2 digits 00-11)', value: 'KK'},
    {label: 'Hour k (1-24)', value: 'k'},
    {label: 'Hour kk (2 digits 01-24)', value: 'kk'},
    {label: 'Minute m (0-59)', value: 'm'},
    {label: 'Minute mm (2 digits 00-59)', value: 'mm'},
    {label: 'Second s (0-59)', value: 's'},
    {label: 'Second ss (2 digits 00-59)', value: 'ss'},
    {label: 'Milliseconds l (0-999)', value: 'l'},
    {label: 'Milliseconds ll (2 digits 00-99)', value: 'll'},
    {label: 'Milliseconds lll (3 digits 000-999)', value: 'lll'},
    {label: 'AM/PM t (1 digit - Lowercase)', value: 't'},
    {label: 'AM/PM tt (2 digits - Lowercase)', value: 'tt'},
    {label: 'AM/PM T (1 digit - Uppercase)', value: 'T'},
    {label: 'AM/PM TT (2 digits - Uppercase)', value: 'TT'},
    {label: 'timezone Z (abbr.)', value: 'Z'},
    {label: 'timezone offset o (abbr.)', value: 'o'},
    {label: 'date\'s ordinal suffix (st, nd, rd, or th) S', value: 'S'},
    {label: 'Day difference x', value: 'x'},
    {label: 'Day difference (name) xx', value: 'xx'}
];

/**
 * Formate a date to the given Format string
 * @param  {Date} date -  Javascript Date to format
 * @param  {string} mask -  mask of the date
 * @param  {bool} utc - indicates if the formated date should be in utc or not
 * @param  {Array.<string>} [dayNames]       -  Array of day Names long and short ["Sunday", "Monday", ..., "Mo", "Tu", ...]
 * @param  {Array.<string>} [monthNames]     -  Array of month Names long and short ["January", "February", ..., "Jan", "Feb", ...]
 * @param  {Array.<string>} [dayDiffNames]   -  Array of names for relative day, starting 7 days ago ["1 week ago", "6 days ago", ..., "Yesterday", "Today", "Tomorrow", ...]
 * @return {string}   date as depending on the given Format
 */
function formatDate(date, mask, utc, dayNames, monthNames, dayDiffNames) {
    if (dayNames) {
        dateFormat.i18n.dayNames = dayNames;
    }

    if (monthNames) {
        dateFormat.i18n.monthNames = monthNames;
    }

    if (dayDiffNames) {
        dateFormat.i18n.dayDiffNames = dayDiffNames;
    }

    return dateFormat(date, mask, utc);
}

/**
 * gives the difference between two times in Milliseconds
 * @param  {Date}    time1       -  Javascript Date object
 * @param  {Date}    [time2]     -  Javascript Date object, if not defined, now will be used
 * @param  {Number}  [limit]     -  limit in milliseconds. If defined and result is less then limit, result will be always a positive value.
 * @return {Number}   returns a number, string or object depending on the given Format
 */
function getTimeDiff(time1, time2, limit) {
    if (!time2) {
        time2 = new Date();
    }

    let millis = time1.getTime() - time2.getTime();
    if (limit) {
        while (millis < limit) {
            millis += 86400000; // 24h
        }
    }

    return millis;
}

/**
 * pre defined formates of a given date
 * @param  {Date}            date            -  Javascript Date to format
 * @param  {string}          [format]        -  format of the date
 * @param  {Array.<string>}  [dayNames]      -  Array of day Names in short and ["Sunday", "Monday", ..., "Mo", "Tu", ...]
 * @param  {Array.<string>}  [monthNames]    -  Array of month Names long and short ["January", "February", ..., "Jan", "Feb", ...]
 * @param  {Array.<string>}  [dayDiffNames]  -  Array of names for relative day, starting 7 days ago ["1 week ago", "6 days ago", ..., "Yesterday", "Today", "Tomorrow", ...]
 * @return {any}   returns a number, string or object depending on the given Format
 */
function getFormatedDateOut(date, format, dayNames, monthNames, dayDiffNames) {
    // console.log('getFormatedDateOut ' + date + ' --> ' + format + '  [' + dayNames + '] - [' + monthNames + '] [' + dayDiffNames + ']'); // eslint-disable-line
    format = format || 0;
    if (isNaN(format)) {
        return formatDate(date, String(format), false, dayNames, monthNames, dayDiffNames);
    }

    switch (Number(format)) {
        case 0: // timeformat_UNIX - milliseconds since Jan 1, 1970 00:00
            return date.getTime();
        case 1: // timeformat_ECMA262 - date as string ECMA-262
            return date;
        case 2: // timeformat_local      - 26.12.2018, 23:40:45  - timeformat_G - 6/15/2009 1:45:30 PM
            return date.toLocaleString();
        case 3: // timeformat_localTime  - 23:40:58              - timeformat_T - 1:45:30 PM
            return date.toLocaleTimeString();
        case 4: // timeformat_UTC
            return date.toUTCString();
        case 5: // timeformat_ISO
            return date.toISOString();
        case 6: // timeformat_ms
            return date.getTime() - (new Date()).getTime();
        case 7: // timeformat_sec
            return Math.round((date.getTime() - (new Date()).getTime()) / 1000);
        case 8: // timeformat_min
            return (Math.round((date.getTime() - (new Date()).getTime()) / 1000) / 60);
        case 9: // timeformat_hour
            return (Math.round((date.getTime() - (new Date()).getTime()) / 1000) / 3600);
        case 10: // timeformat_YYYYMMDDHHMMSS
            return getComperableDateFormat(date);
        case 11: // timeformat_YYYYMMDD_HHMMSS
            return getComperableDateFormat2(date);
        case 12: // timeformat_localDate - 26.12.2018  - timeformat_d - 6/15/2009
            return date.toLocaleDateString();
        case 13: // timeformat_localTimeLong       - 23:43:10 GMT+0100 (Mitteleuropäische Normalzeit)
            return date.toTimeString();
        case 14: // timeformat_localLong       - Wed Dec 26 2018 23:44:12 GMT+0100 (Mitteleuropäische Normalzeit)
            return date.toString();
        case 15: // timeformat_localDateLong       - Wed Dec 26 2018
            return date.toDateString();
        case 16: // timeformat_weekday           - Montag, 22.12.
            return formatDate(date, 'dddd, d.m.', false, dayNames, monthNames, dayDiffNames);
        case 17: // timeformat_weekday2          - heute 22.12., morgen 23.12., übermorgen 24.12., in 3 Tagen 25.12., Montag, 26.12.
            return formatDate(date, 'xx, d.m.', false, dayNames, monthNames, dayDiffNames);
    }

    const delay = (date.getTime() - (new Date()).getTime());
    return {
        date,
        ts: date.getTime(),
        timeUTCStr: date.toUTCString(),
        timeISOStr: date.toISOString(),
        timeLocaleStr: date.toLocaleString(),
        timeLocaleTimeStr: date.toLocaleTimeString(),
        delay,
        delaySec: Math.round(delay / 1000)
    };
}
// ===================================================================
// Author: Matt Kruse <matt@mattkruse.com>
// WWW: http://www.mattkruse.com/
// https://www.mattkruse.com/javascript/date/source.html
// http://javascripttoolbox.com/lib/date/index.php
//
// NOTICE: You may use this code for any purpose, commercial or
// private, without any further permission from the author. You may
// remove this notice from your final code if you wish, however it is
// appreciated by the author if at least my web site address is kept.
//
// You may *NOT* re-distribute this code in any way except through its
// use. That means, you can include it in your product, or your web
// site, or any other form where the code is actually being used. You
// may not put the plain javascript up on your site for download or
// include it in your javascript libraries for download.
// If you wish to share this code with others, please just point them
// to the URL instead.
// Please DO NOT link directly to my .js files from your site. Copy
// the files to your server and use them there. Thank you.
// ===================================================================

// HISTORY
// ------------------------------------------------------------------
// May 17, 2003: Fixed bug in parseDate() for dates <1970
// March 11, 2003: Added parseDate() function
// March 11, 2003: Added "NNN" formatting option. Doesn't match up
//                 perfectly with SimpleDateFormat formats, but
//                 backwards-compatability was required.

// ------------------------------------------------------------------
// These functions use the same 'format' strings as the
// java.text.SimpleDateFormat class, with minor exceptions.
// The format string consists of the following abbreviations:
//
// Field        | Full Form          | Short Form
// -------------+--------------------+-----------------------
// Year         | yyyy (4 digits)    | yy (2 digits), y (2 or 4 digits)
// Month        | MMM (name or abbr.)| MM (2 digits), M (1 or 2 digits)
//              | NNN (abbr.)        |
// Day of Month | dd (2 digits)      | d (1 or 2 digits)
// Day of Week  | EE (name)          | E (abbr)
// Hour (1-12)  | hh (2 digits)      | h (1 or 2 digits)
// Hour (0-23)  | HH (2 digits)      | H (1 or 2 digits)
// Hour (0-11)  | KK (2 digits)      | K (1 or 2 digits)
// Hour (1-24)  | kk (2 digits)      | k (1 or 2 digits)
// Minute       | mm (2 digits)      | m (1 or 2 digits)
// Second       | ss (2 digits)      | s (1 or 2 digits)
// Millisecond  | ll (3 digits)      | l (1, 2 or 3 digits)
// AM/PM        | tt  (2 digits)     | t (1 or 2 digits)
//
// NOTE THE DIFFERENCE BETWEEN MM and mm! Month=MM, not mm!
// Examples:
//  "MMM d, y" matches: January 01, 2000
//                      Dec 1, 1900
//                      Nov 20, 00
//  "M/d/yy"   matches: 01/20/00
//                      9/2/00
//  "MMM dd, yyyy hh:mm:ssa" matches: "January 01, 2000 12:30:45AM"
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Utility functions for parsing in getDateFromFormat()
// ------------------------------------------------------------------
function _isInteger(val) {
    const digits = '1234567890';
    for (let i = 0; i < val.length; i++) {
        if (digits.indexOf(val.charAt(i)) === -1) {
            return false;
        }
    }

    return true;
}

function _getInt(str, i, minlength, maxlength) {
    for (let x = maxlength; x >= minlength; x--) {
        const token = str.substring(i, i + x);
        if (token.length < minlength) {
            return null;
        }

        if (_isInteger(token)) {
            return token;
        }
    }

    return null;
}

// ------------------------------------------------------------------
// getDateFromFormat( date_string , format_string )
//
// This function takes a date string and a format string. It matches
// If the date string matches the format string, it returns the
// getTime() of the date. If it does not match, it returns 0.
// ------------------------------------------------------------------
function getDateFromFormat(val, format) {
    // console.log('getDateFromFormat ' + val + ' --> ' + format); // eslint-disable-line
    val = String(val);
    format = String(format);
    const now = new Date();
    let i_val = 0;
    let i_format = 0;
    let c = '';
    let token = '';
    let x; let y;
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let date = now.getDate();
    let hh = now.getHours();
    let mm = now.getMinutes();
    let ss = now.getSeconds();
    let ll = now.getMilliseconds();
    let ampm = '';

    while (i_format < format.length) {
        // Get next token from format string
        c = format.charAt(i_format);
        token = '';
        while ((format.charAt(i_format) === c) && (i_format < format.length)) {
            token += format.charAt(i_format++);
        }

        // Extract contents of value based on format token
        if (token === 'yyyy' || token === 'yy' || token === 'y') {
            if (token === 'yyyy') {
                x = 4;
                y = 4;
            }

            if (token === 'yy') {
                x = 2;
                y = 2;
            }

            if (token === 'y') {
                x = 2;
                y = 4;
            }
            year = _getInt(val, i_val, x, y);
            if (year === null) {
                return null;
            }

            i_val += year.length;
            if (year.length === 2) {
                if (year > 70) {
                    year = 1900 + (year - 0);
                } else {
                    year = 2000 + (year - 0);
                }
            }
        } else if (token === 'MMM' || token === 'NNN' || token === 'MMMM') {
            month = 0;
            for (let i = 0; i < dateFormat.i18n.monthNames.length; i++) {
                const month_name = dateFormat.i18n.monthNames[i];
                if (val.substring(i_val, i_val + month_name.length).toLowerCase() === month_name.toLowerCase()) {
                    if (token === 'MMM' || ((token === 'NNN' || token === 'MMMM') && i > 11)) {
                        month = i + 1;
                        if (month > 12) {
                            month -= 12;
                        }

                        i_val += month_name.length;
                        break;
                    }
                }
            }

            if ((month < 1) || (month > 12)) {
                return null;
            }
        } else if (token === 'EE' || token === 'E' || token === 'dddd' || token === 'ddd') {
            for (let i = 0; i < dateFormat.i18n.dayNames.length; i++) {
                const day_name = dateFormat.i18n.dayNames[i];
                if (val.substring(i_val, i_val + day_name.length).toLowerCase() === day_name.toLowerCase()) {
                    i_val += day_name.length;
                    break;
                }
            }
        } else if (token === 'MM' || token === 'M') {
            month = _getInt(val, i_val, token.length, 2);
            if (month === null || (month < 1) || (month > 12)) {
                return null;
            }

            i_val += month.length;
        } else if (token === 'dd' || token === 'd') {
            date = _getInt(val, i_val, token.length, 2);
            if (date === null || (date < 1) || (date > 31)) {
                return null;
            }

            i_val += date.length;
        } else if (token === 'hh' || token === 'h') {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh === null || (hh < 1) || (hh > 12)) {
                return null;
            }

            i_val += hh.length;
        } else if (token === 'HH' || token === 'H') {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh === null || (hh < 0) || (hh > 23)) {
                return null;
            }

            i_val += hh.length;
        } else if (token === 'KK' || token === 'K') {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh === null || (hh < 0) || (hh > 11)) {
                return null;
            }

            i_val += hh.length;
        } else if (token === 'kk' || token === 'k') {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh === null || (hh < 1) || (hh > 24)) {
                return null;
            }

            i_val += hh.length;
            hh--;
        } else if (token === 'mm' || token === 'm') {
            mm = _getInt(val, i_val, token.length, 2);
            if (mm === null || (mm < 0) || (mm > 59)) {
                return null;
            }

            i_val += mm.length;
        } else if (token === 'ss' || token === 's') {
            ss = _getInt(val, i_val, token.length, 2);
            if (ss === null || (ss < 0) || (ss > 59)) {
                return null;
            }

            i_val += ss.length;
        } else if (token === 'lll' || token === 'll' || token === 'l' || token === 'L') {
            ll = _getInt(val, i_val, token.length, 3);
            if (ll === null || (ll < 0) || (ll > 999)) {
                return null;
            }

            i_val += ll.length;
        } else if ((token === 'tt') || (token === 't') || (token === 'TT') || (token === 'T')) {
            if (val.substring(i_val, i_val + 2).toLowerCase() === 'am') {
                ampm = 'AM';
                i_val += 2;
            } else if (val.substring(i_val, i_val + 2).toLowerCase() === 'pm') {
                ampm = 'PM';
                i_val += 2;
            } else if (val.substring(i_val, i_val + 1).toLowerCase() === 'a') {
                ampm = 'AM';
                i_val += 1;
            } else if (val.substring(i_val, i_val + 1).toLowerCase() === 'p') {
                ampm = 'PM';
                i_val += 1;
            } else {
                return null;
            }
        } else {
            if (val.substring(i_val, i_val + token.length) !== token) {
                return null;
            }

            i_val += token.length;
        }
    }

    // If there are any trailing characters left in the value, it doesn't match
    if (i_val !== val.length) {
        return null;
    }

    // Is date valid for month?
    if (month === 2) {
        // Check for leap year
        if (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) { // leap year
            if (date > 29) {
                return null;
            }
        } else if (date > 28) {
            return null;
        }
    }

    if ((month === 4) || (month === 6) || (month === 9) || (month === 11)) {
        if (date > 30) {
            return null;
        }
    }

    // Correct hours value
    if (hh < 12 && ampm === 'PM') {
        hh = hh - 0 + 12;
    } else if (hh > 11 && ampm === 'AM') {
        hh -= 12;
    }
    // console.log(year, month, date, hh, mm, ss, ll); // eslint-disable-line
    return new Date(year, month - 1, date, hh, mm, ss, ll);
}

// ------------------------------------------------------------------
// parseDate( date_string [, prefer_euro_format] )
//
// This function takes a date string and tries to match it to a
// number of possible date formats to get the value. It will try to
// match against the following international formats, in this order:
// y-M-d   MMM d, y   MMM d,y   y-MMM-d   d-MMM-y  MMM d
// M/d/y   M-d-y      M.d.y     MMM-d     M/d      M-d
// d/M/y   d-M-y      d.M.y     d-MMM     d/M      d-M
// A second argument may be passed to instruct the method to search
// for formats like d/M/y (european format) before M/d/y (American).
// Returns a Date object or null if no patterns match.
// ------------------------------------------------------------------
function parseArray(val, listTocheck) {
    for (let i = 0, n = listTocheck.length; i < n; i++) {
        const res = getDateFromFormat(val, listTocheck[i]);
        if (res !== null) {
            return res;
        }
    }
    return null;
}

function parseDate(val, preferEuro) {
    let res = parseArray(val, dateFormat.parseDates.general);
    if (res !== null) { return res; }
    res = parseArray(val, (preferEuro) ? dateFormat.parseDates.dateFirst : dateFormat.parseDates.monthFirst);
    if (res !== null) { return res; }
    return parseArray(val, (preferEuro) ? dateFormat.parseDates.monthFirst : dateFormat.parseDates.dateFirst);
}

function parseDateTime(val, preferEuro) {
    function mix(lst1, lst2, result) {
        for (let i = 0; i < lst1.length; i++) {
            for (let j = 0; j < lst2.length; j++) {
                result.push(lst1[i] + ' ' + lst2[j]);
            }
        }
        return result;
    }

    let checkList = [dateFormat.masks.isoDateTime];
    checkList = mix(dateFormat.parseDates.general, dateFormat.parseTimes, checkList);
    if (preferEuro) {
        checkList = mix(dateFormat.parseDates.dateFirst, dateFormat.parseTimes, checkList);
        checkList = mix(dateFormat.parseDates.monthFirst, dateFormat.parseTimes, checkList);
    } else {
        checkList = mix(dateFormat.parseDates.monthFirst, dateFormat.parseTimes, checkList);
        checkList = mix(dateFormat.parseDates.dateFirst, dateFormat.parseTimes, checkList);
    }
    return parseArray(val, checkList);
}

function parseDateFromFormat(date, format, dayNames, monthNames, dayDiffNames) {
    console.debug('parseDateFromFormat ' + util.inspect(date) + ' - ' + util.inspect(format) + 'dayNames'); // eslint-disable-line
    if (dayNames) {
        dateFormat.i18n.dayNames = dayNames;
    }

    if (monthNames) {
        dateFormat.i18n.monthNames = monthNames;
    }

    if (dayDiffNames) {
        dateFormat.i18n.dayDiffNames = dayDiffNames;
    }

    format = format || 0;

    if (isNaN(format)) { // timeparse_TextOther
        return getDateFromFormat(date, format);
    }

    const tryparse = (val, preferEuro) => {
console.debug('tryparse ' + util.inspect(preferEuro)); // eslint-disable-line
        let res = parseDateTime(val, preferEuro);
        if (res === null) {
            res = parseDate(val, preferEuro);
        }
        if (res === null) {
            res = parseArray(val, dateFormat.parseTimes);
        }
        return res;
    };

    switch (Number(format)) {
        case 0: // UNIX Timestamp
            return new Date(Number(date));
        case 1: // timeparse_ECMA262
            return Date.parse(date);
        case 2: // various - try different Formats, prefere european formats
            return tryparse(date, true);
        case 3: // various - try different Formats, prefere american formats
            return tryparse(date, false);
        case 4: // timeformat_YYYYMMDDHHMMSS
            return parseComperableDateFormat(date);
        case 5: // timeformat_YYYYMMDD_HHMMSS
            return parseComperableDateFormat2(date);
        default:
            return getDateOfText(date);
    }
}