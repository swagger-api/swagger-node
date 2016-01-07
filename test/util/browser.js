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
