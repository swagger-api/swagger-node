'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
// export setup Promis for testing
module.exports = new Promise(function (resolve, reject) {

  var config = {
    appRoot: __dirname // required config
  };

  SwaggerExpress.create(config, function (err, swaggerExpress) {
    if (err) { throw err; }

    // install middleware
    swaggerExpress.register(app);

    var port = process.env.PORT || 10010;
    app.listen(port, function() {
      if (swaggerExpress.runner.swagger.paths['/hello']) {
        console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
      }
      resolve(app);
    });
  });
});