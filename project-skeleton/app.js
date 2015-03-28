'use strict';

var SwaggerRunner = require('swagger-node-runner');
var app = require('connect')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerRunner.create(config, function(err, runner) {
  if (err) { throw err; }

  app.use(runner.connectMiddleware().chain());
  app.use(errorHandler);

  var port = process.env.PORT || 10010;
  app.listen(port);

  console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
});

// this just emits errors to the client as a json string
function errorHandler(err, req, res, next) {

  if (err && typeof err === 'object') {
    Object.defineProperty(err, 'message', { enumerable: true }); // include message property in response
    res.end(JSON.stringify(err));
  }
  next(err);
}
