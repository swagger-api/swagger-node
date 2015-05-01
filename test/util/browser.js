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

var should = require('should');
var util = require('util');
var config = require('../../config');
var proxyquire =  require('proxyquire');

describe('browser', function() {

  var URL = 'abc123';
  var browserStubs = {
    'child_process': {
      exec: function(name, cb) {
        cb(null, name);
      }
    }
  };
  var browser = proxyquire('../../lib/util/browser', browserStubs);

  beforeEach(function() {
    config.browser = undefined;
  });

  describe('Windows', function() {

    it('should start', function(done) {
      browser.open(URL, function(err, command) {
        command.should.equal(util.format('start "" "%s"', URL));
        done();
      }, 'win32')
    });

    it('should honor config', function(done) {
      var browserPath = config.browser = '/my/browser';
      browser.open(URL, function(err, command) {
        command.should.equal(util.format("start \"\" \"%s\" \"%s\"", browserPath, URL));
        done();
      }, 'win32')
    });

  });

  describe('OS X', function() {

    it('should open', function(done) {
      browser.open(URL, function(err, command) {
        command.should.equal(util.format('open "%s"', URL));
        done();
      }, 'darwin')
    });

    it('should honor config', function(done) {
      var browserPath = config.browser = '/my/browser';
      browser.open(URL, function(err, command) {
        command.should.equal(util.format("open -a %s \"%s\"", browserPath, URL));
        done();
      }, 'darwin')
    });

  });

  describe('Linux', function () {

    it('should open', function(done) {
      browser.open(URL, function(err, command) {
        command.should.equal(util.format('xdg-open "%s"', URL));
        done();
      }, 'linux');
    });

    it('should honor config', function(done) {
      var browserPath = config.browser = '/usr/bin/x-www-browser';
      browser.open(URL, function(err, command) {
        command.should.equal(util.format('%s "%s"', browserPath, URL));
        done();
      }, 'linux')
    });

  });

  describe('other Unix', function() {

    it('should err if not configured', function(done) {
      config.browser = undefined;
      browser.open(URL, function(err, command) {
        should.exist(err);
        done();
      }, 'foo')
    });

    it('should honor config', function(done) {
      var browserPath = config.browser = '/my/browser';
      browser.open(URL, function(err, command) {
        command.should.equal(util.format('%s "%s"', browserPath, URL));
        done();
      }, 'foo')
    });

  });

});
