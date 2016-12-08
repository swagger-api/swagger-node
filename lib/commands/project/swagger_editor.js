/****************************************************************************
 Copyright 2016 Apigee Corporation

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
var fs = require('fs');

// swagger-editor must be served from root
var SWAGGER_EDITOR_SERVE_PATH = '/';

// swagger-editor expects to GET the file here
var SWAGGER_EDITOR_LOAD_PATH = '/editor/spec';

// swagger-editor PUTs the file back here
var SWAGGER_EDITOR_SAVE_PATH = '/editor/spec';

// swagger-editor GETs the configuration files
var SWAGGER_EDITOR_CONFIG_PATH = '/config/defaults.json';

module.exports = {
  edit: edit
};

function edit(project, options, cb) {

  var swaggerFile = path.resolve(project.dirname, config.swagger.fileName);
  var app = require('connect')();

  // serve swagger-editor
  app.use(SWAGGER_EDITOR_SERVE_PATH, serveStatic(config.swagger.editorDir));

  // save the file from swagger-editor
  app.use(SWAGGER_EDITOR_SAVE_PATH, function(req, res, next) {
    if (req.method !== 'PUT') { return next(); }
    var stream = fs.createWriteStream(swaggerFile);
    req.pipe(stream);

    stream.on('finish', function() {
      res.end('ok');
    })
  });

  // retrieve the project swagger file for the swagger-editor
  app.use(SWAGGER_EDITOR_LOAD_PATH, serveStatic(swaggerFile) );

  app.use(SWAGGER_EDITOR_CONFIG_PATH, function(req, res, next) {
    if (req.method !== 'GET') { return next(); }
    res.end(JSON.stringify(config.swagger.editorConfig));
  });

  // start //

  var http = require('http');
  var server = http.createServer(app);
  var port = options.port || 0;
  var hostname = options.host || '127.0.0.1';
  server.listen(port, hostname, function() {
    port = server.address().port;
    var editorUrl = util.format('http://%s:%d/#/edit', hostname, port);
    var editApiUrl = util.format('http://%s:%d/editor/spec', hostname, port);
    var dontKillMessage = 'Do not terminate this process or close this window until finished editing.';
    emit('Starting Swagger Editor.');

    if (!options.silent) {
      browser.open(editorUrl, function(err) {
        if (err) { return cb(err); }
        emit(dontKillMessage);
      });
    } else {
      emit('Running Swagger Editor API server. You can make GET and PUT calls to %s', editApiUrl);
      emit(dontKillMessage)
    }
  });
}
