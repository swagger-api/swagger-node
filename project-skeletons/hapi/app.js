'use strict';

var SwaggerHapi = require('swagger-hapi');
var Hapi = require('hapi');
var app = new Hapi.Server();

module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerHapi.create(config, function(err, swaggerHapi) {
  if (err) { throw err; }

  var port = process.env.PORT || 10010;
  app.connection({ port: port });

  app.register(swaggerHapi.plugin, function(err) {
    if (err) { return console.error('Failed to load plugin:', err); }
    app.start(function() {
      console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
    });
  });
});
