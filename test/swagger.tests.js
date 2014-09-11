'use strict';

describe('swagger', function(){
  it('should be a module', function(){
    require('../');
  });
  it('should have params object', function() {
    require('../').should.have.property('params').and.should.be.type('object');
  });
  it('should have queryParam function', function() {
    require('../').should.have.property('queryParam').and.should.be.type('object');
  });
  it('should have pathParam function', function() {
    require('../').should.have.property('pathParam').and.should.be.type('object');
  });
  it('should have bodyParam function', function() {
    require('../').should.have.property('bodyParam').and.should.be.type('object');
  });
  it('should have formParam function', function() {
    require('../').should.have.property('formParam').and.should.be.type('object');
  });
  it('should have headerParam function', function() {
    require('../').should.have.property('headerParam').and.should.be.type('object');
  });
  it('should have error function', function() {
    require('../').should.have.property('error').and.should.be.type('object');
  });
});
