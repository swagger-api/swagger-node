/****************************************************************************
 Copyright 2015 Apigee Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ****************************************************************************/
'use strict';

var config = require('../../../config');
var emit = require('../../util/feedback').emit;
var browser = require('../../util/browser');
var util = require('util');
var path = require('path');
var serveStatic = require('serve-static');

// swagger-ui must be served from root
var SWAGGER_UI_SERVE_PATH = '/';

// swagger-ui expects to GET the file here
var SWAGGER_UI_LOAD_PATH = '/ui/spec';

module.exports = {
  ui: ui
};

function ui(project, options, cb) {

  var swaggerFile = path.resolve(project.dirname, config.swagger.fileName);
  var app = require('connect')();

  // retrieve the project swagger file for the swagger-ui
  app.use(SWAGGER_UI_LOAD_PATH, serveStatic(swaggerFile) );

  // serve swagger-ui
  app.use(SWAGGER_UI_SERVE_PATH, serveStatic(config.swagger.uiDir));

  // start //

  var http = require('http');
  var server = http.createServer(app);
  var port = options.port || 0;
  var hostname = options.host || '127.0.0.1';
  server.listen(port, hostname, function() {
    port = server.address().port;
    var uiUrl = util.format('http://%s:%d/?url=' + SWAGGER_UI_LOAD_PATH, hostname, port);
    emit('Starting Swagger UI.');

    if (!options.silent) {
      browser.open(uiUrl, function(err) {
        if (err) { return cb(err); }
      });
    } else {
      emit('Running Swagger UI API server');
    }
  });
}
