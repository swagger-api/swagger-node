'use strict';

var SwaggerRunner = require('swagger-node-runner');
var restify = require('restify');
var app = restify.createServer();

module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerRunner.create(config, function(err, runner) {
  if (err) { throw err; }

  // temporary: swagger-tools currently requires ownership of request.query
  app.use(function(req, res, next) { req.query = null; next(); });

  // install swagger-node-runner middleware
  var restifyMiddleware = runner.restifyMiddleware();
  app.use(restifyMiddleware.chain({ mapErrorsToJson: true }));

  // force Restify to route all requests - necessary to allow swagger-node-runner middleware to execute
  function noOp(req, res, next) { next(); }
  ['del', 'get', 'head', 'opts', 'post', 'put', 'patch']
    .forEach(function(method) { app[method].call(app, '.*', noOp); });

  var port = process.env.PORT || 10010;
  app.listen(port);

  console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
});
