'use strict';

describe('shallowClone', function(){
  var shallowClone = require('../lib/shallowClone');
  
  it('should be a function', function(){
    shallowClone.should.be.type('function'); 
  });


  it('should not output the input', function(){
    var input = {};
    shallowClone(input).should.not.equal(input);
  });

  it('should clone non object properties', function(){
    var input = {a:5};
    var output  = shallowClone(input);

    output.a.should.equal(5);
  });

  it('should not clone object properties', function(){
    var input = {a:5, c:{}};
    var output  = shallowClone(input);

    output.a.should.equal(5);
    output.should.not.have.property('c');
  });

});
