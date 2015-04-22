'use strict';

var SwaggerRunner = require('swagger-node-runner');
var app = require('express')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerRunner.create(config, function(err, runner) {
  if (err) { throw err; }

  // install swagger-node-runner middleware
  var expressMiddleware = runner.expressMiddleware();
  expressMiddleware.register(app);

  var port = process.env.PORT || 10010;
  app.listen(port);

  console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
});
