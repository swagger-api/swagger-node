'use strict';

var SwaggerConnect = require('swagger-connect');
var app = require('connect')();
// export setup Promis for testing
module.exports = new Promise(function (resolve, reject) {
  var config = {
    appRoot: __dirname // required config
  };

  SwaggerConnect.create(config, function (err, swaggerConnect) {
    if (err) { throw err; }

    // install middleware
    swaggerConnect.register(app);

    var port = process.env.PORT || 10010;
    app.listen(port);

    if (swaggerConnect.runner.swagger.paths['/hello']) {
      var basePath = swaggerConnect.runner.swagger.basePath || '';
      console.log('try this:\ncurl http://127.0.0.1:' + port + basePath + '/hello?name=Scott');
    }
    resolve(app);
  });
});
