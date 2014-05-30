'use strict';

describe('toJsonType', function(){
  var toJsonType = require('../lib/toJsonType');
  
  it('should map int', function(){
    toJsonType('int').should.have.properties({
      type: 'integer',
      format: 'int32'
    });
  });

  it('should map long', function(){
    toJsonType('long').should.have.properties({
      type: 'integer',
      format: 'int64'
    });
  });

  it('should map float', function(){
    toJsonType('float').should.have.properties({
      type: 'number',
      format: 'float'
    });
  });

  it('should map double', function(){
    toJsonType('double').should.have.properties({
      type: 'number',
      format: 'double'
    });
  });

  it('should map date', function(){
    toJsonType('date').should.have.properties({
      type: 'string',
      format: 'date-time'
    });
  });

});
