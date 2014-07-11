'use strict';

var _ = require('lodash');
require('should');

describe('validation', function() {
  var validation = require('../lib/validation');

  describe('float', function() {
    it('should validate', function() {
      var ret = validation.validateFloatParameter(1.5, 'testParam');
      (ret === null).should.be.true;
    });

    it('should validate with large number', function() {
      var ret = validation.validateFloatParameter(112312234132443.88635, 'testParam');
      (ret === null).should.be.true;
    });

    it('should not validate with negative too large number', function() {
      var ret = validation.validateFloatParameter(-112312234132443.88635, 'testParam');
      (ret === null).should.be.true;
    });

    it('should validate with decimal of 0', function() {
      var ret = validation.validateFloatParameter(1.0, 'testParam');
      (ret === null).should.be.true;
    });

    it('should not validate with too large number', function() {
      var ret = validation.validateFloatParameter(1e4500, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of float");
    });

    it('should not validate with negative too large number', function() {
      var ret = validation.validateFloatParameter(-1e4500, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of float");
    });

    it('should not validate with object', function() {
      var ret = validation.validateFloatParameter({}, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of float");
    });

    it('should not validate with string', function() {
      var ret = validation.validateFloatParameter('string', 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of float");
    });
  });

  describe('integer', function() {
    it('should validate', function() {
      var ret = validation.validateIntegerParameter(1, 'testParam');
      (ret === null).should.be.true;
    });

    it('should validate with large number', function() {
      var ret = validation.validateIntegerParameter(123124582, 'testParam');
      (ret === null).should.be.true;
    });

    it('should validate float with no decimal', function() {
      var ret = validation.validateIntegerParameter(1.0, 'testParam');
      (ret === null).should.be.true;
    });

    it('should not validate with too large number', function() {
      var ret = validation.validateIntegerParameter(5656423372324422244, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of integer");
    });

    it('should not validate with float', function() {
      var ret = validation.validateIntegerParameter(1.2, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of integer");
    });

    it('should not validate with object', function() {
      var ret = validation.validateIntegerParameter({}, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of integer");
    });

    it('should not validate with string', function() {
      var ret = validation.validateIntegerParameter('string', 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of integer");
    });
  });

  describe('string', function() {
    it('should validate', function() {
      var ret = validation.validateStringParameter('Hi', 'testParam');
      (ret === null).should.be.true;
    });

    it('should validate with large string', function() {
      var ret = validation.validateStringParameter('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 'testParam');
      (ret === null).should.be.true;
    });

    it('should not validate with number', function() {
      var ret = validation.validateStringParameter(1, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of string");
    });

    it('should not validate with boolean', function() {
      var ret = validation.validateStringParameter(true, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of string");
    });

    it('should not validate with object', function() {
      var ret = validation.validateStringParameter({}, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of string");
    });
  });

  describe('boolean', function() {
    it('should validate', function() {
      var ret = validation.validateBoolParameter(true, 'testParam');
      (ret === null).should.be.true;
    });

    it('should validate with large string', function() {
      var ret = validation.validateBoolParameter(false, 'testParam');
      (ret === null).should.be.true;
    });

    it('should not validate with number', function() {
      var ret = validation.validateBoolParameter(1, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of boolean");
    });

    it('should not validate with string', function() {
      var ret = validation.validateBoolParameter('Hello World', 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of boolean");
    });

    it('should not validate with object', function() {
      var ret = validation.validateBoolParameter({}, 'testParam');
      (ret === null).should.be.false;
      ret.should.equal("Parameter testParam is not a type of boolean");
    });
  });
});