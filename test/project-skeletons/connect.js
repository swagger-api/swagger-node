/****************************************************************************
 The MIT License (MIT)

 Copyright (c) 2013 Apigee Corporation

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
var request = require('supertest');
var tmp = require('tmp');
var path = require('path');
var project = require('../../lib/commands/project/project');
var debug = require('debug')('swagger');

var framework = 'connect';
var name = framework;
var tmpDir, projPath, server;

describe(framework + ' project', function() {

  before(function(done) {
    this.timeout(30000);

    tmp.setGracefulCleanup();

    // set up project dir
    tmp.dir({ unsafeCleanup: true }, function(err, reply) {
      should.not.exist(err);
      tmpDir = reply;
      process.chdir(tmpDir);

      projPath = path.resolve(tmpDir, framework);
      process.chdir(tmpDir);
      project.create(name, { framework: framework }, function(err) {
        should.not.exist(err);

        require('./helpers').freePort(function(err, port) {
          should.not.exist(err);
          process.env.PORT = port;
          server = require(projPath + '/app.js');
          done();
        });
      });
    });
  });

  it('should run test', function(done) {
    project.test(projPath, {}, function(err, failures) {
      should.not.exist(err);
      failures.should.eql(0);
      done();
    });
  });

  describe('/hello should respond', function() {

    it('without query param', function(done) {
      request(server)
        .get('/hello')
        .end(function(err, res) {
          should.not.exist(err);
          debug('Result: %s %j', res.text, res.headers);

          res.status.should.eql(200);
          res.body.should.eql('Hello, stranger!');

          done();
        });
    });

    it('with query param', function(done) {
      request(server)
        .get('/hello')
        .query({ name: 'Scott' })
        .end(function(err, res) {
          should.not.exist(err);
          debug('Result: %s %j', res.text, res.headers);

          res.status.should.eql(200);
          res.body.should.eql('Hello, Scott!');

          done();
        });
    });
  });
});
