/****************************************************************************
 The MIT License (MIT)

 Copyright (c) 2015 Apigee Corporation

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
'use strict';

var Child = require('child_process');
var config = require('../../config');
var emit = require('./feedback').emit;

var platformOpeners = {

  darwin:
    function(url, cb) {
      var browser = escape(config.browser);
      if (browser) {
        open('open -a ' + browser, url, cb);
      } else {
        open('open', url, cb);
      }
    },

  win32:
    function(url, cb) {
      var browser = escape(config.browser);
      if (browser) {
        open('start "" "' + browser + '"', url, cb);
      } else {
        open('start ""', url, cb);
      }
    },

  linux:
    function(url, cb) {
      var browser = escape(config.browser);
      if (browser) {
        open(browser, url, cb);
      } else {
        open('xdg-open', url, cb);
      }
    },

  other:
    function(url, cb) {
      var browser = escape(config.browser);
      if (browser) {
        open(browser, url, cb);
      } else {
        cb(new Error('must specify browser in config'));
      }
    }
};

module.exports = {
  open: platformOpen
};

// note: platform parameter is just for testing...
function platformOpen(url, cb, platform) {
  platform = platform || process.platform;
  if (!platformOpeners[platform]) { platform = 'other'; }
  platformOpeners[platform](url, cb);
}

function open(command, url, cb) {
  if (config.debug) { emit('command: ' + command); }
  emit('Opening browser to: ' + url);
  Child.exec(command + ' "' + escape(url) + '"', cb);
}

function escape(s) {
  if (!s) { return s; }
  return s.replace(/"/g, '\\\"');
}
