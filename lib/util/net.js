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

var net = require('net');
var debug = require('debug')('swagger');
var http = require('http');
var https = require('https');
var fs = require('fs');
var _ = require('lodash');

var DEFAULT_TIMEOUT = 100;

module.exports = {
  isPortOpen: isPortOpen,
  download: download
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

// returns final file size if successful (or -1 if unknown)
function download(url, destFile, cb) {

  var proto = url.substr(0, url.indexOf(':')) == 'https' ? https : http;
  var tmpFile = destFile + '.tmp';

  var error = function(err) {
    debug(err);
    debug('error: removing downloaded file');
    fs.unlink(tmpFile);
    cb(err);
  };

  var file = fs.createWriteStream(tmpFile);
  file.on('error', error);

  proto.get(url, function(res) {

    var size = 0;
    var count = 0;

    res.on('data', function(chunk) {
      file.write(chunk);
      size += chunk.length;
      if (++count % 70 === 0) { process.stdout.write('.'); }
      if (debug.enabled) { debug('downloaded ' + size + ' bytes'); }
    })
      .on('end', function() {
        fs.rename(tmpFile, destFile, function(err) {
          if (err) { return error(err); }
          cb(null, size);
        });
      })
      .on('error', error);
  })
}
