/****************************************************************************
 The MIT License (MIT)

 Copyright (c) 2015 Apigee Corporation

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
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
var SWAGGER_EDITOR_BRANDING_LEFT = '/templates/branding-left.html';
var SWAGGER_EDITOR_BRANDING_RIGHT = '/templates/branding-right.html';
var SWAGGER_EDITOR_BRANDING_CSS = '/styles/branding.css';

module.exports = {
  edit: edit
};

function edit(project, options, cb) {

  var swaggerFile = path.resolve(project.dirname, config.swagger.fileName);
  var app = require('connect')();

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

  // server swagger-editor configuration JSON and branding HTML and CSS files
  var configFilePath = path.join(config.rootDir, 'config', 'swagger-editor.config.json');
  var brandingDir = path.join(config.rootDir, 'config', 'editor-branding');

  app.use(SWAGGER_EDITOR_CONFIG_PATH, serveStatic(configFilePath));
  app.use(SWAGGER_EDITOR_BRANDING_LEFT, serveStatic(path.join(brandingDir, 'left.html')));
  app.use(SWAGGER_EDITOR_BRANDING_RIGHT, serveStatic(path.join(brandingDir, 'right.html')));
  app.use(SWAGGER_EDITOR_BRANDING_CSS, serveStatic(path.join(brandingDir, 'branding.css')));


  // serve swagger-editor
  app.use(SWAGGER_EDITOR_SERVE_PATH, serveStatic(config.swagger.editorDir));


  // start //

  var http = require('http');
  var server = http.createServer(app);
  server.listen(0, '127.0.0.1', function() {
    var port = server.address().port;
    var editorUrl = util.format('http://127.0.0.1:%d/#/edit', port);
    var editApiUrl = util.format('http://127.0.0.1:%d/editor/spec', port);
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
