'use strict';

var SwaggerHapi = require('swagger-hapi');
var Hapi = require('hapi');
var app = new Hapi.Server();

// export setup Promis for testing
module.exports = new Promise(function (resolve, reject) {

  var config = {
    appRoot: __dirname // required config
  };

  SwaggerHapi.create(config, function (err, swaggerHapi) {
    if (err) { throw err; }

    var port = process.env.PORT || 10010;
    app.connection({ port: port });
    app.address = function () {
      return { port: port };
    };

    app.register(swaggerHapi.plugin, function (err) {
      if (err) {
        console.error('Failed to load plugin:', err);
        reject(err);
      }
      app.start(function () {
        if (swaggerHapi.runner.swagger.paths['/hello']) {
          console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
        }
        resolve(app);
      });
    });
  });
});
