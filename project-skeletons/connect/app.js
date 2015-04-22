'use strict';

var SwaggerRunner = require('swagger-node-runner');
var app = require('connect')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerRunner.create(config, function(err, runner) {
  if (err) { throw err; }

  var connectMiddleware = runner.connectMiddleware();
  connectMiddleware.register(app);

  var port = process.env.PORT || 10010;
  app.listen(port);

  console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
});
