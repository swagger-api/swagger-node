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
var config = require('../../config');
var proxyquire =  require('proxyquire');
var _ = require('lodash');
var helpers = require('../helpers');

describe('cli', function() {

  var cliStubs = {
    'inquirer': {
      prompt: function(questions, cb) {
        var results = {};
        if (!_.isArray(questions)) { questions = [questions]; }
        _.each(questions, function(question) {
          results[question.name] =
            (question.hasOwnProperty('default') && question.default !== undefined)
              ? question.default
              : (question.type === 'list') ? question.choices[0] : 'XXX';
        });
        cb(results);
      }
    }
  };
  var cli = proxyquire('../../lib/util/cli', cliStubs);

  beforeEach(function() {
    config.browser = undefined;
  });

  var FIELDS = [
    { name: 'baseuri',      message: 'Base URI?', default: 'https://api.enterprise.apigee.com' },
    { name: 'organization', message: 'Organization?' },
    { name: 'password',     message: 'Password?', type: 'password' }
  ];

  describe('requireAnswers', function() {

    it('should ensure all questions are answered', function(done) {

      cli.requireAnswers(FIELDS, {}, function(results) {
        results.baseuri.should.equal('https://api.enterprise.apigee.com');
        results.organization.should.equal('XXX');
        results.password.should.equal('XXX');
        done();
      });
    });

    it('should not ask for questions already answered', function(done) {

      var results = {
        password: 'password'
      };

      cli.requireAnswers(FIELDS, results, function(results) {
        results.password.should.equal('password');
        done();
      });
    });

  });

  describe('updateAnswers', function() {

    it('should ask all questions', function(done) {

      cli.updateAnswers(FIELDS, {}, function(results) {
        results.organization.should.equal('XXX');
        results.baseuri.should.equal('XXX');
        results.password.should.equal('XXX');
        done();
      });
    });


    it('should default to existing answers', function(done) {

      var results = {
        baseuri: 'baseuri'
      };

      cli.updateAnswers(FIELDS, results, function(results) {
        results.organization.should.equal('XXX');
        results.baseuri.should.equal('baseuri');
        done();
      });
    });

    it('should not default password', function(done) {

      var results = {
        password: 'password'
      };

      cli.updateAnswers(FIELDS, results, function(results) {
        results.password.should.equal('XXX');
        done();
      });
    });

  });

  describe('confirm', function() {

    it('should default true', function(done) {

      cli.confirm('true?', function(result) {
        result.should.equal(true);
        done();
      });
    });

    it('should default false', function(done) {

      cli.confirm('false?', false, function(result) {
        result.should.equal(false);
        done();
      });
    });

  });

  describe('chooseOne', function() {

    it('should return one', function(done) {

      cli.chooseOne('choose?', ['1', '2'], function(result) {
        result.should.equal('1');
        done();
      });
    });

  });

  describe('printAndExit', function() {

    var oldExit = process.exit;
    var exitCode;

    before(function() {
      process.exit = (function() {
        return function(code) {
          exitCode = code;
        }
      })();
    });

    after(function() {
      process.exit = oldExit;
    });

    var capture;
    beforeEach(function() {
      capture = helpers.captureOutput();
      exitCode = undefined;
    });

    afterEach(function() {
      capture.release();
    });

    it('should log errors', function() {

      cli.printAndExit(new Error('test'));
      exitCode.should.equal(1);
    });

    it('should log strings', function() {

      cli.printAndExit(null, 'test');
      exitCode.should.equal(0);
      capture.output().should.equal('test\n');
    });

    it('should log simple objects', function() {

      cli.printAndExit(null, { test: 1 });
      exitCode.should.equal(0);
      capture.output().should.equal('test: 1\n\n');
    });

    it('should log complex objects', function() {

      cli.printAndExit(null, { test: { test: 1 } });
      exitCode.should.equal(0);
      capture.output().should.equal('test:\n  test: 1\n\n');
    });

    it('should hide passwords', function() {

      cli.printAndExit(null, { password: 1 });
      exitCode.should.equal(0);
      capture.output().should.equal("password: '******'\n\n");
    });

    describe('execute', function() {

      var executeNoError = function(arg1, cb) {
        cb(null, arg1);
      };

      it('should error if no command', function() {
        cli.execute(null, 'whatever')();
        exitCode.should.equal(1);
        capture.output().should.match(/Error: missing command method/);
      });

      it("should error if arguments don't match", function() {

        cli.execute(executeNoError, 'whatever')();
        exitCode.should.equal(1);
        capture.output().should.match(/Error: incorrect arguments/);
      });

      it('should print the result of the command', function() {

        cli.execute(executeNoError)(1);
        exitCode.should.equal(0);
        capture.output().should.equal('1\n');
      });

      it('should print the result with header', function() {

        cli.execute(executeNoError, 'whatever')(1);
        exitCode.should.equal(0);
        capture.output().should.equal('whatever\n========\n1\n');
      });

    });

  });

  describe('validate', function() {

    var helpCalled = false;
    var app = {
      commands: [
        { _name: '1' },
        { _name: '2' }
      ],
      help: function() {
        helpCalled = true;
      },
      rawArgs: new Array(3)
    };

    beforeEach(function() {
      helpCalled = false;
    });

    it('should do nothing if valid command', function() {

      app.rawArgs[2] = '1';
      cli.validate(app);
      helpCalled.should.be.false;
    });

    it('should error if invalid command', function() {

      app.rawArgs[2] = '3';
      cli.validate(app);
      helpCalled.should.be.true;
    });
  });

  describe('version', function() {

    it('should return the version', function() {

      var version = require('../../package.json').version;
      cli.version().should.eql(version);
    });
  });

});
