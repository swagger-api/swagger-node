'use strict';

var tmp = require('tmp');
var path = require('path');
var should = require('should');
var request = require('supertest');
var project = require('../../lib/commands/project/project');
var yaml = require('js-yaml');
var debug = require('debug')('swagger');
var helpers = require('./helpers');

describe('project framework', function() {
  // oddly, sails must be run first or there is an error
  testFramework('sails');
  var frameworks = Object.keys(project.frameworks);
  for (var i = 0; i < frameworks.length; i++) {
    if (frameworks[i] !== 'sails') testFramework(frameworks[i]);
  }
});

function testFramework(framework) {

  describe(framework, function() {

    var tmpDir, projPath, server, sails;

    before(function(done) {
      this.timeout(45000);

      tmp.setGracefulCleanup();

      // set up project dir
      tmp.dir({ unsafeCleanup: true }, function(err, reply) {
        should.not.exist(err);
        tmpDir = reply;
        process.chdir(tmpDir);

        projPath = path.resolve(tmpDir, framework);
        project.create(framework, { framework: framework }, function(err) {
          should.not.exist(err);

          helpers.freePort(function(err, port) {
            should.not.exist(err);

            process.env.PORT = port;

            if (framework === 'sails') {
              process.chdir(projPath);
              var Sails = require(path.resolve(projPath, './node_modules/sails'));
              Sails.lift({}, function(err, s) {
                should.not.exist(err);
                sails = s;
                server = sails.hooks.http.app;
                done(err);
              });
            } else {
              server = require(projPath + '/app.js');
              done();
            }
          });
        });
      });
    });

    after(function(done) {
      if (sails) {
        sails.lower(done);
      } else {
        done();
      }
    });

    // it breaks the tests to include this, figure it out later...
    //it('should run test', function(done) {
    //  project.test(projPath, {}, function(err, failures) {
    //    should.not.exist(err);
    //    failures.should.eql(0);
    //    done();
    //  });
    //});

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

    describe('/swagger should respond', function() {

      it('with json', function(done) {
        request(server)
          .get('/swagger')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.swagger.should.eql('2.0');

            done();
          });
      });

      it('with yaml', function(done) {
        request(server)
          .get('/swagger')
          .expect(200)
          .set('Accept', 'text/yaml')
          .expect('Content-Type', /yaml/)
          .end(function(err, res) {
            should.not.exist(err);

            var swagger = yaml.safeLoad(res.text);
            swagger.swagger.should.eql('2.0');

            done();
          });
      });
    });

    describe('/missing should respond', function() {

      it('with 404', function(done) {
        request(server)
          .get('/nothing')
          .expect(404)
          .end(done);
      });
    });
  });
}
