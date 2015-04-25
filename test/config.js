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
