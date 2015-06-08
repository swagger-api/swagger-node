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

// disabled: including this test causes a full test run to break. todo: figure this out

//var should = require('should');
//var proxyquire = require('proxyquire').noPreserveCache();
//
//describe('config', function() {
//
//  describe('swagger env var', function() {
//
//    it('should load', function(done) {
//
//      var config = proxyquire('../config', {});
//      should.not.exist(config.test);
//      process.env['swagger_test'] = 'test';
//
//      config = proxyquire('../config', {});
//      should.exist(config.test);
//      config.test.should.equal('test');
//      done();
//    });
//
//    it('should load subkeys', function(done) {
//
//      var config = proxyquire('../config', {});
//      should.not.exist(config.sub);
//      process.env['swagger_sub_key'] = 'test';
//      process.env['swagger_sub_key2'] = 'test2';
//
//      config = proxyquire('../config', {});
//      should.exist(config.sub);
//      config.sub.should.have.property('key', 'test');
//      config.sub.should.have.property('key2', 'test2');
//      done();
//    });
//  });
//
//});
