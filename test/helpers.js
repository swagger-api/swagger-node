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

var fs = require('fs');
var _ = require('lodash');
var util = require('util');

module.exports.copyFile = function(source, target, cb) {
  cb = _.once(cb);

  var rd = fs.createReadStream(source);
  rd.on('error', function(err) {
    cb(err);
  });

  var wr = fs.createWriteStream(target);
  wr.on('error', function(err) {
    cb(err);
  });
  wr.on('close', function(err) {
    cb(err);
  });
  rd.pipe(wr);
};

// intercepts stdout and stderr
// returns object with methods:
//   output() : returns captured string
//   release() : must be called when done, returns captured string
module.exports.captureOutput = function captureOutput() {
  var old_stdout_write = process.stdout.write;
  var old_console_error = console.error;

  var captured = '';
  var callback = function(string) {
    captured += string;
  };

  process.stdout.write = (function(write) {
    return function(string, encoding, fd) {
      var args = _.toArray(arguments);
      write.apply(process.stdout, args);

      // only intercept the string
      callback.call(callback, string);
    };
  }(process.stdout.write));

  console.error = (function(log) {
    return function() {
      var args = _.toArray(arguments);
      args.unshift('[ERROR]');
      console.log.apply(console.log, args);

      // string here encapsulates all the args
      callback.call(callback, util.format(args));
    };
  }(console.error));

  return {
    output: function output(err, reply) {
      return captured;
    },
    release: function done(err, reply) {
      process.stdout.write = old_stdout_write;
      console.error = old_console_error;
      return captured;
    }
  }
};
