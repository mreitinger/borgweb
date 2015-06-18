/**
  This file was autogenerated.
  See https://github.com/borgbackup/borgweb
*/
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var dateformat = require('dateformat');

/**
  ~~ Config ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var cfg = {
  'logFilesList': [],
  'logFilesListHTML': '',
  'lastSelectedLog': NaN,
  'pollFrequency': 100
};

/**
  ~~ BorgBackup interaction ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var noBackupRunning = function noBackupRunning(callback) {
  $.getJSON('/backup/status', function (resp) {
    if (resp.rc === null) {
      log('▶ Backup in progress');
      callback(false);
    } else {
      log('✖ No backup in progress');
      callback(true);
    }
  });
};
var pollBackupStatus = function pollBackupStatus(endpoint, ms, callback) {
  noBackupRunning(function (notRunning) {
    if (notRunning) return null;else {
      log('Polling backup status');
      $.getJSON('/backup/status', callback);
      setTimeout(ms, pollBackupStatus(endpoint, ms, callback));
    }
  });
};
var startBackup = function startBackup(force) {
  if (force) {
    log('Sending backup start request');
    $.post('/backup/start', {}, function () {
      pollBackupStatus('/backup/status', cfg['pollFrequency'], function (res) {
        console.log(res);
      });
    });
  } else if (force === undefined) noBackupRunning(startBackup);else log('*Not* sending backup start request');
};

/**
  ~~ Utility ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var log = function log() {
  var args = Array.prototype.slice.call(arguments);
  var time = '[' + dateformat(new Date(), 'HH:MM:ss') + ']';
  args.unshift(time);
  console.log.apply(console, args);
  return this;
};
var isInt = function isInt(n) {
  return n % 1 === 0;
};
var success = function success(data) {
  logFiles = data.log_files;
};
var parseAnchor = function parseAnchor() {
  var url = window.location.href.toString();
  var idx = url.indexOf('#');
  var anchor = idx != -1 ? url.substring(idx + 1) : '';
  if (anchor) {
    var parts = anchor.split(';');
    var partsParsed = {};
    parts.forEach(function (e) {
      var pair = e.split(':');
      partsParsed[pair[0]] = pair[1];
    });
    return partsParsed;
  } else return { 'log': 0 };
};

/**
  ~~ UI updaters ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var updateLogFileList = function updateLogFileList(logFiles) {
  $.each(logFiles.log_files, function (key, value) {
    cfg.logFilesListHTML += '<li><a href="#log:' + value[0] + '" onClick="window.displayThatLog(' + value[0] + ')">' + value[1] + '</a></li>';
  });
  $('#log-files').html(cfg.logFilesListHTML);
};
var renderLogFile = function renderLogFile(text) {
  log('Rendering: ' + text.log_file);
  $('#log-text').html(text.log_content);
};
var highlightLogFile = function highlightLogFile(logNumber) {
  if (isInt(cfg.lastSelectedLog)) $('#log-files li:nth-child(' + (cfg.lastSelectedLog + 1) + ')').toggleClass('active');
  $(document).ready(function () {
    $('#log-files li:nth-child(' + (logNumber + 1) + ')').toggleClass('active');
  });
  cfg.lastSelectedLog = logNumber;
};
var updateShownLogFile = function updateShownLogFile(that) {
  log('Updating log file list');
  var logNumber = NaN;
  if (!isInt(that)) {
    var anchor = parseAnchor();
    logNumber = anchor['log'];
  } else logNumber = that;

  highlightLogFile(logNumber);
  var url = '/logs/' + logNumber + '/0::';
  log('Fetching ' + url);
  $.getJSON(url, renderLogFile);
};

/**
  ~~ UI callables ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
window.displayThatLog = function (that) {
  updateShownLogFile(that);
};
window.startBackup = startBackup;

/**
  ~~ Site init ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
$.getJSON('/logs', updateLogFileList);
updateShownLogFile();

},{"dateformat":2}],2:[function(require,module,exports){
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
 */

(function(global) {
  'use strict';

  var dateFormat = (function() {
      var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'|'[^']*'/g;
      var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
      var timezoneClip = /[^-+\dA-Z]/g;
  
      // Regexes and supporting functions are cached through closure
      return function (date, mask, utc, gmt) {
  
        // You can't provide utc if you skip other args (use the 'UTC:' mask prefix)
        if (arguments.length === 1 && kindOf(date) === 'string' && !/\d/.test(date)) {
          mask = date;
          date = undefined;
        }
  
        date = date || new Date;
  
        if(!(date instanceof Date)) {
          date = new Date(date);
        }
  
        if (isNaN(date)) {
          throw TypeError('Invalid date');
        }
  
        mask = String(dateFormat.masks[mask] || mask || dateFormat.masks['default']);
  
        // Allow setting the utc/gmt argument via the mask
        var maskSlice = mask.slice(0, 4);
        if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
          mask = mask.slice(4);
          utc = true;
          if (maskSlice === 'GMT:') {
            gmt = true;
          }
        }
  
        var _ = utc ? 'getUTC' : 'get';
        var d = date[_ + 'Date']();
        var D = date[_ + 'Day']();
        var m = date[_ + 'Month']();
        var y = date[_ + 'FullYear']();
        var H = date[_ + 'Hours']();
        var M = date[_ + 'Minutes']();
        var s = date[_ + 'Seconds']();
        var L = date[_ + 'Milliseconds']();
        var o = utc ? 0 : date.getTimezoneOffset();
        var W = getWeek(date);
        var N = getDayOfWeek(date);
        var flags = {
          d:    d,
          dd:   pad(d),
          ddd:  dateFormat.i18n.dayNames[D],
          dddd: dateFormat.i18n.dayNames[D + 7],
          m:    m + 1,
          mm:   pad(m + 1),
          mmm:  dateFormat.i18n.monthNames[m],
          mmmm: dateFormat.i18n.monthNames[m + 12],
          yy:   String(y).slice(2),
          yyyy: y,
          h:    H % 12 || 12,
          hh:   pad(H % 12 || 12),
          H:    H,
          HH:   pad(H),
          M:    M,
          MM:   pad(M),
          s:    s,
          ss:   pad(s),
          l:    pad(L, 3),
          L:    pad(Math.round(L / 10)),
          t:    H < 12 ? 'a'  : 'p',
          tt:   H < 12 ? 'am' : 'pm',
          T:    H < 12 ? 'A'  : 'P',
          TT:   H < 12 ? 'AM' : 'PM',
          Z:    gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
          o:    (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S:    ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10],
          W:    W,
          N:    N
        };
  
        return mask.replace(token, function (match) {
          if (match in flags) {
            return flags[match];
          }
          return match.slice(1, match.length - 1);
        });
      };
    })();

  dateFormat.masks = {
    'default':               'ddd mmm dd yyyy HH:MM:ss',
    'shortDate':             'm/d/yy',
    'mediumDate':            'mmm d, yyyy',
    'longDate':              'mmmm d, yyyy',
    'fullDate':              'dddd, mmmm d, yyyy',
    'shortTime':             'h:MM TT',
    'mediumTime':            'h:MM:ss TT',
    'longTime':              'h:MM:ss TT Z',
    'isoDate':               'yyyy-mm-dd',
    'isoTime':               'HH:MM:ss',
    'isoDateTime':           'yyyy-mm-dd\'T\'HH:MM:sso',
    'isoUtcDateTime':        'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
    'expiresHeaderFormat':   'ddd, dd mmm yyyy HH:MM:ss Z'
  };

  // Internationalization strings
  dateFormat.i18n = {
    dayNames: [
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ],
    monthNames: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ]
  };

function pad(val, len) {
  val = String(val);
  len = len || 2;
  while (val.length < len) {
    val = '0' + val;
  }
  return val;
}

/**
 * Get the ISO 8601 week number
 * Based on comments from
 * http://techblog.procurios.nl/k/n618/news/view/33796/14863/Calculate-ISO-8601-week-and-year-in-javascript.html
 *
 * @param  {Object} `date`
 * @return {Number}
 */
function getWeek(date) {
  // Remove time components of date
  var targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Change date to Thursday same week
  targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

  // Take January 4th as it is always in week 1 (see ISO 8601)
  var firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

  // Change date to Thursday same week
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

  // Check if daylight-saving-time-switch occured and correct for it
  var ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
  targetThursday.setHours(targetThursday.getHours() - ds);

  // Number of weeks between target Thursday and first Thursday
  var weekDiff = (targetThursday - firstThursday) / (86400000*7);
  return 1 + Math.floor(weekDiff);
}

/**
 * Get ISO-8601 numeric representation of the day of the week
 * 1 (for Monday) through 7 (for Sunday)
 * 
 * @param  {Object} `date`
 * @return {Number}
 */
function getDayOfWeek(date) {
  var dow = date.getDay();
  if(dow === 0) {
    dow = 7;
  }
  return dow;
}

/**
 * kind-of shortcut
 * @param  {*} val
 * @return {String}
 */
function kindOf(val) {
  if (val === null) {
    return 'null';
  }

  if (val === undefined) {
    return 'undefined';
  }

  if (typeof val !== 'object') {
    return typeof val;
  }

  if (Array.isArray(val)) {
    return 'array';
  }

  return {}.toString.call(val)
    .slice(8, -1).toLowerCase();
};



  if (typeof define === 'function' && define.amd) {
    define(dateFormat);
  } else if (typeof exports === 'object') {
    module.exports = dateFormat;
  } else {
    global.dateFormat = dateFormat;
  }
})(this);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9wZ3V0aC9naXRodWIvYm9yZ3dlYi9qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRlZm9ybWF0L2xpYi9kYXRlZm9ybWF0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7Ozs7O0FBS3RDLElBQUksR0FBRyxHQUFHO0FBQ1IsZ0JBQWMsRUFBRSxFQUFFO0FBQ2xCLG9CQUFrQixFQUFFLEVBQUU7QUFDdEIsbUJBQWlCLEVBQUUsR0FBRztBQUN0QixpQkFBZSxFQUFFLEdBQUc7Q0FDckIsQ0FBQTs7Ozs7QUFLRCxJQUFJLGVBQWUsR0FBRyxTQUFsQixlQUFlLENBQWEsUUFBUSxFQUFFO0FBQ3hDLEdBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxJQUFJLEVBQUU7QUFDMUMsUUFBSSxJQUFJLENBQUMsRUFBRSxLQUFLLElBQUksRUFBRTtBQUNuQixTQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtBQUM1QixjQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDaEIsTUFBTTtBQUNMLFNBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO0FBQzlCLGNBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUNmO0dBQ0YsQ0FBQyxDQUFBO0NBQ0gsQ0FBQTtBQUNELElBQUksZ0JBQWdCLEdBQUcsU0FBbkIsZ0JBQWdCLENBQWEsUUFBUSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUU7QUFDdkQsaUJBQWUsQ0FBQyxVQUFVLFVBQVUsRUFBRTtBQUNwQyxRQUFJLFVBQVUsRUFBRSxPQUFPLElBQUksQ0FBQSxLQUN0QjtBQUNILFNBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0FBQzVCLE9BQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUs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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGRhdGVmb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0JylcblxuLyoqXG4gIH5+IENvbmZpZyB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+flxuKi9cbnZhciBjZmcgPSB7XG4gICdsb2dGaWxlc0xpc3QnOiBbXSxcbiAgJ2xvZ0ZpbGVzTGlzdEhUTUwnOiBcIlwiLFxuICAnbGFzdFNlbGVjdGVkTG9nJzogTmFOLFxuICAncG9sbEZyZXF1ZW5jeSc6IDEwMFxufVxuXG4vKipcbiAgfn4gQm9yZ0JhY2t1cCBpbnRlcmFjdGlvbiB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+XG4qL1xudmFyIG5vQmFja3VwUnVubmluZyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAkLmdldEpTT04oJy9iYWNrdXAvc3RhdHVzJywgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICBpZiAocmVzcC5yYyA9PT0gbnVsbCkge1xuICAgICAgIGxvZygn4pa2IEJhY2t1cCBpbiBwcm9ncmVzcycpXG4gICAgICBjYWxsYmFjayhmYWxzZSlcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nKCfinJYgTm8gYmFja3VwIGluIHByb2dyZXNzJylcbiAgICAgIGNhbGxiYWNrKHRydWUpXG4gICAgfVxuICB9KVxufVxudmFyIHBvbGxCYWNrdXBTdGF0dXMgPSBmdW5jdGlvbiAoZW5kcG9pbnQsIG1zLCBjYWxsYmFjaykge1xuICBub0JhY2t1cFJ1bm5pbmcoZnVuY3Rpb24gKG5vdFJ1bm5pbmcpIHtcbiAgICBpZiAobm90UnVubmluZykgcmV0dXJuIG51bGxcbiAgICBlbHNlIHtcbiAgICAgIGxvZyhcIlBvbGxpbmcgYmFja3VwIHN0YXR1c1wiKVxuICAgICAgJC5nZXRKU09OKCcvYmFja3VwL3N0YXR1cycsIGNhbGxiYWNrKVxuICAgICAgc2V0VGltZW91dChtcywgcG9sbEJhY2t1cFN0YXR1cyhlbmRwb2ludCwgbXMsIGNhbGxiYWNrKSlcbiAgICB9XG4gIH0pXG59XG52YXIgc3RhcnRCYWNrdXAgPSBmdW5jdGlvbiAoZm9yY2UpIHtcbiAgaWYgKGZvcmNlKSB7XG4gICAgbG9nKFwiU2VuZGluZyBiYWNrdXAgc3RhcnQgcmVxdWVzdFwiKVxuICAgICQucG9zdCgnL2JhY2t1cC9zdGFydCcsIHt9LCBmdW5jdGlvbiAoKSB7XG4gICAgICBwb2xsQmFja3VwU3RhdHVzKCcvYmFja3VwL3N0YXR1cycsIGNmZ1sncG9sbEZyZXF1ZW5jeSddLFxuICAgICAgICBmdW5jdGlvbiAocmVzKSB7IGNvbnNvbGUubG9nKHJlcykgfSkgfSlcbiAgfSBlbHNlIGlmIChmb3JjZSA9PT0gdW5kZWZpbmVkKSBub0JhY2t1cFJ1bm5pbmcoc3RhcnRCYWNrdXApXG4gIGVsc2UgbG9nKFwiKk5vdCogc2VuZGluZyBiYWNrdXAgc3RhcnQgcmVxdWVzdFwiKVxufVxuXG4vKipcbiAgfn4gVXRpbGl0eSB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+XG4qL1xudmFyIGxvZyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICB2YXIgdGltZSA9ICdbJyArIGRhdGVmb3JtYXQobmV3IERhdGUoKSwgJ0hIOk1NOnNzJykgKyAnXSdcbiAgYXJncy51bnNoaWZ0KHRpbWUpXG4gIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICByZXR1cm4gdGhpc1xufVxudmFyIGlzSW50ID0gZnVuY3Rpb24gKG4pIHtcbiAgcmV0dXJuIG4gJSAxID09PSAwXG59XG52YXIgc3VjY2VzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gIGxvZ0ZpbGVzID0gZGF0YS5sb2dfZmlsZXNcbn1cbnZhciBwYXJzZUFuY2hvciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnRvU3RyaW5nKClcbiAgdmFyIGlkeCA9IHVybC5pbmRleE9mKFwiI1wiKVxuICB2YXIgYW5jaG9yID0gKGlkeCAhPSAtMSkgPyB1cmwuc3Vic3RyaW5nKGlkeCsxKSA6IFwiXCJcbiAgaWYgKGFuY2hvcikge1xuICAgIHZhciBwYXJ0cyA9IGFuY2hvci5zcGxpdCgnOycpXG4gICAgdmFyIHBhcnRzUGFyc2VkID0ge31cbiAgICBwYXJ0cy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgcGFpciA9IGUuc3BsaXQoJzonKVxuICAgICAgcGFydHNQYXJzZWRbcGFpclswXV0gPSBwYWlyWzFdXG4gICAgfSlcbiAgICByZXR1cm4gcGFydHNQYXJzZWRcbiAgfSBlbHNlIHJldHVybiB7J2xvZyc6IDB9XG59XG5cbi8qKlxuICB+fiBVSSB1cGRhdGVycyB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiovXG52YXIgdXBkYXRlTG9nRmlsZUxpc3QgPSBmdW5jdGlvbiAobG9nRmlsZXMpIHtcbiAgJC5lYWNoKGxvZ0ZpbGVzLmxvZ19maWxlcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICBjZmcubG9nRmlsZXNMaXN0SFRNTCArPSAnPGxpPjxhIGhyZWY9XCIjbG9nOicgKyB2YWx1ZVswXVxuICAgICAgKyAnXCIgb25DbGljaz1cIndpbmRvdy5kaXNwbGF5VGhhdExvZygnXG4gICAgICArIHZhbHVlWzBdICsgJylcIj4nICsgdmFsdWVbMV0gKyAnPC9hPjwvbGk+J30pXG4gICQoJyNsb2ctZmlsZXMnKS5odG1sKGNmZy5sb2dGaWxlc0xpc3RIVE1MKVxufVxudmFyIHJlbmRlckxvZ0ZpbGUgPSBmdW5jdGlvbiAodGV4dCkge1xuICBsb2coXCJSZW5kZXJpbmc6IFwiICsgdGV4dC5sb2dfZmlsZSlcbiAgJCgnI2xvZy10ZXh0JykuaHRtbCh0ZXh0LmxvZ19jb250ZW50KVxufVxudmFyIGhpZ2hsaWdodExvZ0ZpbGUgPSBmdW5jdGlvbiAobG9nTnVtYmVyKSB7XG4gIGlmIChpc0ludChjZmcubGFzdFNlbGVjdGVkTG9nKSlcbiAgICAkKCcjbG9nLWZpbGVzIGxpOm50aC1jaGlsZCgnXG4gICAgICArIChjZmcubGFzdFNlbGVjdGVkTG9nICsgMSkgKyAnKScpLnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxuICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAkKCcjbG9nLWZpbGVzIGxpOm50aC1jaGlsZCgnXG4gICAgICArIChsb2dOdW1iZXIgKyAxKSArICcpJykudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpIH0pXG4gIGNmZy5sYXN0U2VsZWN0ZWRMb2cgPSBsb2dOdW1iZXJcbn1cbnZhciB1cGRhdGVTaG93bkxvZ0ZpbGUgPSBmdW5jdGlvbiAodGhhdCkge1xuICBsb2coXCJVcGRhdGluZyBsb2cgZmlsZSBsaXN0XCIpXG4gIHZhciBsb2dOdW1iZXIgPSBOYU5cbiAgaWYgKCFpc0ludCh0aGF0KSkge1xuICAgIHZhciBhbmNob3IgPSBwYXJzZUFuY2hvcigpXG4gICAgbG9nTnVtYmVyID0gYW5jaG9yWydsb2cnXVxuICB9IGVsc2UgbG9nTnVtYmVyID0gdGhhdFxuICBcbiAgaGlnaGxpZ2h0TG9nRmlsZShsb2dOdW1iZXIpXG4gIHZhciB1cmwgPSAnL2xvZ3MvJyArIGxvZ051bWJlciArICcvMDo6J1xuICBsb2coXCJGZXRjaGluZyBcIiArIHVybClcbiAgJC5nZXRKU09OKHVybCwgcmVuZGVyTG9nRmlsZSlcbn1cblxuLyoqXG4gIH5+IFVJIGNhbGxhYmxlcyB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+flxuKi9cbndpbmRvdy5kaXNwbGF5VGhhdExvZyA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gIHVwZGF0ZVNob3duTG9nRmlsZSh0aGF0KVxufVxud2luZG93LnN0YXJ0QmFja3VwID0gc3RhcnRCYWNrdXBcblxuLyoqXG4gIH5+IFNpdGUgaW5pdCB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+flxuKi9cbiQuZ2V0SlNPTignL2xvZ3MnLCB1cGRhdGVMb2dGaWxlTGlzdClcbnVwZGF0ZVNob3duTG9nRmlsZSgpXG5cblxuXG5cblxuXG4iLCIvKlxuICogRGF0ZSBGb3JtYXQgMS4yLjNcbiAqIChjKSAyMDA3LTIwMDkgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4gKiBNSVQgbGljZW5zZVxuICpcbiAqIEluY2x1ZGVzIGVuaGFuY2VtZW50cyBieSBTY290dCBUcmVuZGEgPHNjb3R0LnRyZW5kYS5uZXQ+XG4gKiBhbmQgS3JpcyBLb3dhbCA8Y2l4YXIuY29tL35rcmlzLmtvd2FsLz5cbiAqXG4gKiBBY2NlcHRzIGEgZGF0ZSwgYSBtYXNrLCBvciBhIGRhdGUgYW5kIGEgbWFzay5cbiAqIFJldHVybnMgYSBmb3JtYXR0ZWQgdmVyc2lvbiBvZiB0aGUgZ2l2ZW4gZGF0ZS5cbiAqIFRoZSBkYXRlIGRlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGRhdGUvdGltZS5cbiAqIFRoZSBtYXNrIGRlZmF1bHRzIHRvIGRhdGVGb3JtYXQubWFza3MuZGVmYXVsdC5cbiAqL1xuXG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgZGF0ZUZvcm1hdCA9IChmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0b2tlbiA9IC9kezEsNH18bXsxLDR9fHl5KD86eXkpP3woW0hoTXNUdF0pXFwxP3xbTGxvU1pXTl18J1teJ10qJ3wnW14nXSonL2c7XG4gICAgICB2YXIgdGltZXpvbmUgPSAvXFxiKD86W1BNQ0VBXVtTRFBdVHwoPzpQYWNpZmljfE1vdW50YWlufENlbnRyYWx8RWFzdGVybnxBdGxhbnRpYykgKD86U3RhbmRhcmR8RGF5bGlnaHR8UHJldmFpbGluZykgVGltZXwoPzpHTVR8VVRDKSg/OlstK11cXGR7NH0pPylcXGIvZztcbiAgICAgIHZhciB0aW1lem9uZUNsaXAgPSAvW14tK1xcZEEtWl0vZztcbiAgXG4gICAgICAvLyBSZWdleGVzIGFuZCBzdXBwb3J0aW5nIGZ1bmN0aW9ucyBhcmUgY2FjaGVkIHRocm91Z2ggY2xvc3VyZVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkYXRlLCBtYXNrLCB1dGMsIGdtdCkge1xuICBcbiAgICAgICAgLy8gWW91IGNhbid0IHByb3ZpZGUgdXRjIGlmIHlvdSBza2lwIG90aGVyIGFyZ3MgKHVzZSB0aGUgJ1VUQzonIG1hc2sgcHJlZml4KVxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBraW5kT2YoZGF0ZSkgPT09ICdzdHJpbmcnICYmICEvXFxkLy50ZXN0KGRhdGUpKSB7XG4gICAgICAgICAgbWFzayA9IGRhdGU7XG4gICAgICAgICAgZGF0ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICBcbiAgICAgICAgZGF0ZSA9IGRhdGUgfHwgbmV3IERhdGU7XG4gIFxuICAgICAgICBpZighKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICAgIGRhdGUgPSBuZXcgRGF0ZShkYXRlKTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGlzTmFOKGRhdGUpKSB7XG4gICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdJbnZhbGlkIGRhdGUnKTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgbWFzayA9IFN0cmluZyhkYXRlRm9ybWF0Lm1hc2tzW21hc2tdIHx8IG1hc2sgfHwgZGF0ZUZvcm1hdC5tYXNrc1snZGVmYXVsdCddKTtcbiAgXG4gICAgICAgIC8vIEFsbG93IHNldHRpbmcgdGhlIHV0Yy9nbXQgYXJndW1lbnQgdmlhIHRoZSBtYXNrXG4gICAgICAgIHZhciBtYXNrU2xpY2UgPSBtYXNrLnNsaWNlKDAsIDQpO1xuICAgICAgICBpZiAobWFza1NsaWNlID09PSAnVVRDOicgfHwgbWFza1NsaWNlID09PSAnR01UOicpIHtcbiAgICAgICAgICBtYXNrID0gbWFzay5zbGljZSg0KTtcbiAgICAgICAgICB1dGMgPSB0cnVlO1xuICAgICAgICAgIGlmIChtYXNrU2xpY2UgPT09ICdHTVQ6Jykge1xuICAgICAgICAgICAgZ210ID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHZhciBfID0gdXRjID8gJ2dldFVUQycgOiAnZ2V0JztcbiAgICAgICAgdmFyIGQgPSBkYXRlW18gKyAnRGF0ZSddKCk7XG4gICAgICAgIHZhciBEID0gZGF0ZVtfICsgJ0RheSddKCk7XG4gICAgICAgIHZhciBtID0gZGF0ZVtfICsgJ01vbnRoJ10oKTtcbiAgICAgICAgdmFyIHkgPSBkYXRlW18gKyAnRnVsbFllYXInXSgpO1xuICAgICAgICB2YXIgSCA9IGRhdGVbXyArICdIb3VycyddKCk7XG4gICAgICAgIHZhciBNID0gZGF0ZVtfICsgJ01pbnV0ZXMnXSgpO1xuICAgICAgICB2YXIgcyA9IGRhdGVbXyArICdTZWNvbmRzJ10oKTtcbiAgICAgICAgdmFyIEwgPSBkYXRlW18gKyAnTWlsbGlzZWNvbmRzJ10oKTtcbiAgICAgICAgdmFyIG8gPSB1dGMgPyAwIDogZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpO1xuICAgICAgICB2YXIgVyA9IGdldFdlZWsoZGF0ZSk7XG4gICAgICAgIHZhciBOID0gZ2V0RGF5T2ZXZWVrKGRhdGUpO1xuICAgICAgICB2YXIgZmxhZ3MgPSB7XG4gICAgICAgICAgZDogICAgZCxcbiAgICAgICAgICBkZDogICBwYWQoZCksXG4gICAgICAgICAgZGRkOiAgZGF0ZUZvcm1hdC5pMThuLmRheU5hbWVzW0RdLFxuICAgICAgICAgIGRkZGQ6IGRhdGVGb3JtYXQuaTE4bi5kYXlOYW1lc1tEICsgN10sXG4gICAgICAgICAgbTogICAgbSArIDEsXG4gICAgICAgICAgbW06ICAgcGFkKG0gKyAxKSxcbiAgICAgICAgICBtbW06ICBkYXRlRm9ybWF0LmkxOG4ubW9udGhOYW1lc1ttXSxcbiAgICAgICAgICBtbW1tOiBkYXRlRm9ybWF0LmkxOG4ubW9udGhOYW1lc1ttICsgMTJdLFxuICAgICAgICAgIHl5OiAgIFN0cmluZyh5KS5zbGljZSgyKSxcbiAgICAgICAgICB5eXl5OiB5LFxuICAgICAgICAgIGg6ICAgIEggJSAxMiB8fCAxMixcbiAgICAgICAgICBoaDogICBwYWQoSCAlIDEyIHx8IDEyKSxcbiAgICAgICAgICBIOiAgICBILFxuICAgICAgICAgIEhIOiAgIHBhZChIKSxcbiAgICAgICAgICBNOiAgICBNLFxuICAgICAgICAgIE1NOiAgIHBhZChNKSxcbiAgICAgICAgICBzOiAgICBzLFxuICAgICAgICAgIHNzOiAgIHBhZChzKSxcbiAgICAgICAgICBsOiAgICBwYWQoTCwgMyksXG4gICAgICAgICAgTDogICAgcGFkKE1hdGgucm91bmQoTCAvIDEwKSksXG4gICAgICAgICAgdDogICAgSCA8IDEyID8gJ2EnICA6ICdwJyxcbiAgICAgICAgICB0dDogICBIIDwgMTIgPyAnYW0nIDogJ3BtJyxcbiAgICAgICAgICBUOiAgICBIIDwgMTIgPyAnQScgIDogJ1AnLFxuICAgICAgICAgIFRUOiAgIEggPCAxMiA/ICdBTScgOiAnUE0nLFxuICAgICAgICAgIFo6ICAgIGdtdCA/ICdHTVQnIDogdXRjID8gJ1VUQycgOiAoU3RyaW5nKGRhdGUpLm1hdGNoKHRpbWV6b25lKSB8fCBbJyddKS5wb3AoKS5yZXBsYWNlKHRpbWV6b25lQ2xpcCwgJycpLFxuICAgICAgICAgIG86ICAgIChvID4gMCA/ICctJyA6ICcrJykgKyBwYWQoTWF0aC5mbG9vcihNYXRoLmFicyhvKSAvIDYwKSAqIDEwMCArIE1hdGguYWJzKG8pICUgNjAsIDQpLFxuICAgICAgICAgIFM6ICAgIFsndGgnLCAnc3QnLCAnbmQnLCAncmQnXVtkICUgMTAgPiAzID8gMCA6IChkICUgMTAwIC0gZCAlIDEwICE9IDEwKSAqIGQgJSAxMF0sXG4gICAgICAgICAgVzogICAgVyxcbiAgICAgICAgICBOOiAgICBOXG4gICAgICAgIH07XG4gIFxuICAgICAgICByZXR1cm4gbWFzay5yZXBsYWNlKHRva2VuLCBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgICBpZiAobWF0Y2ggaW4gZmxhZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmbGFnc1ttYXRjaF07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgxLCBtYXRjaC5sZW5ndGggLSAxKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pKCk7XG5cbiAgZGF0ZUZvcm1hdC5tYXNrcyA9IHtcbiAgICAnZGVmYXVsdCc6ICAgICAgICAgICAgICAgJ2RkZCBtbW0gZGQgeXl5eSBISDpNTTpzcycsXG4gICAgJ3Nob3J0RGF0ZSc6ICAgICAgICAgICAgICdtL2QveXknLFxuICAgICdtZWRpdW1EYXRlJzogICAgICAgICAgICAnbW1tIGQsIHl5eXknLFxuICAgICdsb25nRGF0ZSc6ICAgICAgICAgICAgICAnbW1tbSBkLCB5eXl5JyxcbiAgICAnZnVsbERhdGUnOiAgICAgICAgICAgICAgJ2RkZGQsIG1tbW0gZCwgeXl5eScsXG4gICAgJ3Nob3J0VGltZSc6ICAgICAgICAgICAgICdoOk1NIFRUJyxcbiAgICAnbWVkaXVtVGltZSc6ICAgICAgICAgICAgJ2g6TU06c3MgVFQnLFxuICAgICdsb25nVGltZSc6ICAgICAgICAgICAgICAnaDpNTTpzcyBUVCBaJyxcbiAgICAnaXNvRGF0ZSc6ICAgICAgICAgICAgICAgJ3l5eXktbW0tZGQnLFxuICAgICdpc29UaW1lJzogICAgICAgICAgICAgICAnSEg6TU06c3MnLFxuICAgICdpc29EYXRlVGltZSc6ICAgICAgICAgICAneXl5eS1tbS1kZFxcJ1RcXCdISDpNTTpzc28nLFxuICAgICdpc29VdGNEYXRlVGltZSc6ICAgICAgICAnVVRDOnl5eXktbW0tZGRcXCdUXFwnSEg6TU06c3NcXCdaXFwnJyxcbiAgICAnZXhwaXJlc0hlYWRlckZvcm1hdCc6ICAgJ2RkZCwgZGQgbW1tIHl5eXkgSEg6TU06c3MgWidcbiAgfTtcblxuICAvLyBJbnRlcm5hdGlvbmFsaXphdGlvbiBzdHJpbmdzXG4gIGRhdGVGb3JtYXQuaTE4biA9IHtcbiAgICBkYXlOYW1lczogW1xuICAgICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCcsXG4gICAgICAnU3VuZGF5JywgJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknLCAnU2F0dXJkYXknXG4gICAgXSxcbiAgICBtb250aE5hbWVzOiBbXG4gICAgICAnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnLFxuICAgICAgJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXG4gICAgXVxuICB9O1xuXG5mdW5jdGlvbiBwYWQodmFsLCBsZW4pIHtcbiAgdmFsID0gU3RyaW5nKHZhbCk7XG4gIGxlbiA9IGxlbiB8fCAyO1xuICB3aGlsZSAodmFsLmxlbmd0aCA8IGxlbikge1xuICAgIHZhbCA9ICcwJyArIHZhbDtcbiAgfVxuICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIEdldCB0aGUgSVNPIDg2MDEgd2VlayBudW1iZXJcbiAqIEJhc2VkIG9uIGNvbW1lbnRzIGZyb21cbiAqIGh0dHA6Ly90ZWNoYmxvZy5wcm9jdXJpb3Mubmwvay9uNjE4L25ld3Mvdmlldy8zMzc5Ni8xNDg2My9DYWxjdWxhdGUtSVNPLTg2MDEtd2Vlay1hbmQteWVhci1pbi1qYXZhc2NyaXB0Lmh0bWxcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBkYXRlYFxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5mdW5jdGlvbiBnZXRXZWVrKGRhdGUpIHtcbiAgLy8gUmVtb3ZlIHRpbWUgY29tcG9uZW50cyBvZiBkYXRlXG4gIHZhciB0YXJnZXRUaHVyc2RheSA9IG5ldyBEYXRlKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSk7XG5cbiAgLy8gQ2hhbmdlIGRhdGUgdG8gVGh1cnNkYXkgc2FtZSB3ZWVrXG4gIHRhcmdldFRodXJzZGF5LnNldERhdGUodGFyZ2V0VGh1cnNkYXkuZ2V0RGF0ZSgpIC0gKCh0YXJnZXRUaHVyc2RheS5nZXREYXkoKSArIDYpICUgNykgKyAzKTtcblxuICAvLyBUYWtlIEphbnVhcnkgNHRoIGFzIGl0IGlzIGFsd2F5cyBpbiB3ZWVrIDEgKHNlZSBJU08gODYwMSlcbiAgdmFyIGZpcnN0VGh1cnNkYXkgPSBuZXcgRGF0ZSh0YXJnZXRUaHVyc2RheS5nZXRGdWxsWWVhcigpLCAwLCA0KTtcblxuICAvLyBDaGFuZ2UgZGF0ZSB0byBUaHVyc2RheSBzYW1lIHdlZWtcbiAgZmlyc3RUaHVyc2RheS5zZXREYXRlKGZpcnN0VGh1cnNkYXkuZ2V0RGF0ZSgpIC0gKChmaXJzdFRodXJzZGF5LmdldERheSgpICsgNikgJSA3KSArIDMpO1xuXG4gIC8vIENoZWNrIGlmIGRheWxpZ2h0LXNhdmluZy10aW1lLXN3aXRjaCBvY2N1cmVkIGFuZCBjb3JyZWN0IGZvciBpdFxuICB2YXIgZHMgPSB0YXJnZXRUaHVyc2RheS5nZXRUaW1lem9uZU9mZnNldCgpIC0gZmlyc3RUaHVyc2RheS5nZXRUaW1lem9uZU9mZnNldCgpO1xuICB0YXJnZXRUaHVyc2RheS5zZXRIb3Vycyh0YXJnZXRUaHVyc2RheS5nZXRIb3VycygpIC0gZHMpO1xuXG4gIC8vIE51bWJlciBvZiB3ZWVrcyBiZXR3ZWVuIHRhcmdldCBUaHVyc2RheSBhbmQgZmlyc3QgVGh1cnNkYXlcbiAgdmFyIHdlZWtEaWZmID0gKHRhcmdldFRodXJzZGF5IC0gZmlyc3RUaHVyc2RheSkgLyAoODY0MDAwMDAqNyk7XG4gIHJldHVybiAxICsgTWF0aC5mbG9vcih3ZWVrRGlmZik7XG59XG5cbi8qKlxuICogR2V0IElTTy04NjAxIG51bWVyaWMgcmVwcmVzZW50YXRpb24gb2YgdGhlIGRheSBvZiB0aGUgd2Vla1xuICogMSAoZm9yIE1vbmRheSkgdGhyb3VnaCA3IChmb3IgU3VuZGF5KVxuICogXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBkYXRlYFxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5mdW5jdGlvbiBnZXREYXlPZldlZWsoZGF0ZSkge1xuICB2YXIgZG93ID0gZGF0ZS5nZXREYXkoKTtcbiAgaWYoZG93ID09PSAwKSB7XG4gICAgZG93ID0gNztcbiAgfVxuICByZXR1cm4gZG93O1xufVxuXG4vKipcbiAqIGtpbmQtb2Ygc2hvcnRjdXRcbiAqIEBwYXJhbSAgeyp9IHZhbFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBraW5kT2YodmFsKSB7XG4gIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9XG5cbiAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWwgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWw7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgcmV0dXJuICdhcnJheSc7XG4gIH1cblxuICByZXR1cm4ge30udG9TdHJpbmcuY2FsbCh2YWwpXG4gICAgLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpO1xufTtcblxuXG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShkYXRlRm9ybWF0KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRhdGVGb3JtYXQ7XG4gIH0gZWxzZSB7XG4gICAgZ2xvYmFsLmRhdGVGb3JtYXQgPSBkYXRlRm9ybWF0O1xuICB9XG59KSh0aGlzKTtcbiJdfQ==