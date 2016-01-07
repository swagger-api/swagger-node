/****************************************************************************
 Copyright 2016 Apigee Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
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
