'use strict';

var SwaggerRestify = require('swagger-restify-mw');
var restify = require('restify');
var app = restify.createServer();

// export setup Promis for testing
module.exports = new Promise(function (resolve, reject) {

  var config = {
    appRoot: __dirname // required config
  };

  SwaggerRestify.create(config, function (err, swaggerRestify) {
    if (err) { throw err; }

    swaggerRestify.register(app);

    var port = process.env.PORT || 10010;
    app.listen(port, function () {
      if (swaggerRestify.runner.swagger.paths['/hello']) {
        var basePath = swaggerRestify.runner.swagger.basePath || '';
        console.log('try this:\ncurl http://127.0.0.1:' + port + basePath + '/hello?name=Scott');
      }
      resolve(app);
    });
  });
});
