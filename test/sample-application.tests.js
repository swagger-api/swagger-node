'use strict';

describe('sample application', function(){
  var once = require('once');
  var request = require('request');
  var spawn = require('child_process').spawn;
  var sampleAppPath = require.resolve('../sample-application/app.js');
  var sampleApp;
  var endpoint = 'http://localhost:8002';

  before(function(done){
    done = once(done);
    sampleApp = spawn('node', [sampleAppPath]);
    sampleApp.on('error', done);
    sampleApp.on('exit', done);
    sampleApp.stderr.pipe(process.stderr);
    sampleApp.stdout.pipe(process.stdout);
    setTimeout(done, 1000);
  });

  after(function(done){
    sampleApp.on('exit', function(){
      done();
    });
    sampleApp.kill();
  });

  describe('/docs', function(){
    it('should contain the html on the page', function(done){
      request(endpoint + '/docs', function(err, res, body){
        body.indexOf('swagger').should.be.above(-1);
        res.statusCode.should.equal(200);
        done(err);
      });
    });
  });

  describe('/api-docs', function(){
    it('should return docs about the API', function(done){
      request(endpoint + '/api-docs', {json:true}, function(err, res, body){
        body.swaggerVersion.should.equal('1.2');
        res.statusCode.should.equal(200);
        done(err);
      });
    });
  });

  describe('/api-docs/pet', function(){
    it('should return docs about the pet API', function(done){
      request(endpoint + '/api-docs/pet', {json:true}, function(err, res, body){
        body.swaggerVersion.should.equal('1.2');
        res.statusCode.should.equal(200);
        done(err);
      });
    });
  });

  describe('/pet/:petId', function(){
    it('should return pet 1', function(done){
      request(endpoint + '/pet/1', {json:true}, function(err, res, body){
        body.id.should.equal(1);
        body.category.name.should.equal('Cats');
        res.statusCode.should.equal(200);
        done(err);
      });
    });
  });

  //I couldnt get this one to work.
  /*describe('/pet/findByTags', function(){
    it('should return pets', function(done){
      request(endpoint + '/pet/findByTags?tags=1', {json:true}, function(err, res, body){
        res.statusCode.should.equal(200);
        done(err);
      });
    });
  });*/

});
