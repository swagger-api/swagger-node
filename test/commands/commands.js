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

var expect = require('chai').expect;
var path = require('path');
var rewire = require('rewire');
var sinon = require('sinon');

describe('commands', function() {
  var commands;
  var converterSpy = sinon.spy();
  var specSpy = sinon.stub().callsArg(2);

  var specMock = {
    validateSwagger: specSpy
  };

  var fsMock = {
    existsSync: sinon.stub().returns(true),
    readFileSync: sinon.stub().returns("{\"help\": true, \"test\": 4}")
  }
  var yamlMock = {
    safeDump: sinon.stub().returns('')
  }

  before(function() {
    commands = rewire('../../lib/commands/commands.js');
    commands.__set__('swaggerConverter', converterSpy);
    commands.__set__('fs', fsMock);
    commands.__set__('yaml', yamlMock);

    commands.__set__('swaggerSpec', specMock);
  });

  it ('should run validate with no issues', function(done) {
    commands.validate('test.yaml', {}, function(err) {
      expect(specSpy.called).to.be.true;
      done(err);
    });
  });

  it ('should run convert with no issues', function(done) {
    commands.convert('test.yaml', [], {}, function (error) {
      expect(converterSpy.called).to.be.true;
      done(error);
    });
  });
});

