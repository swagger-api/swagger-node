/****************************************************************************
 Copyright 2015 Apigee Corporation

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

var net = require('net');
var debug = require('debug')('swagger');
var http = require('http');
var https = require('https');
var fs = require('fs');
var _ = require('lodash');

var DEFAULT_TIMEOUT = 100;

module.exports = {
  isPortOpen: isPortOpen
};

function isPortOpen(port, timeout, cb) {
  if (!cb) { cb = timeout; timeout = DEFAULT_TIMEOUT; }
  cb = _.once(cb);

  var s = new net.Socket();

  s.setTimeout(timeout, function() {
    s.destroy();
    cb(null, false);
  });
  s.connect(port, function() {
    cb(null, true);
  });

  s.on('error', function(err) {
    s.destroy();
    if (err.code === 'ECONNREFUSED') { err = null; }
    cb(err, false);
  });
}
