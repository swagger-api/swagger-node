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

var path = require('path');
var _ = require('lodash');
var debug = require('debug')('swagger');

var config = {
  rootDir: path.resolve(__dirname, '..'),
  userHome: process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
  debug: !!process.env.DEBUG
};
config.nodeModules = path.resolve(config.rootDir, 'node_modules');

module.exports = config;

// swagger editor //

config.swagger = {
  fileName: 'api/swagger/swagger.yaml',
  editorDir: path.resolve(config.nodeModules, 'swagger-editor')
};

// project //

config.project = {
  port: process.env.PORT || 10010,
  skeletonDir: path.resolve(__dirname, '..', 'project-skeleton')
};

// load env vars //

_.each(process.env, function(value, key) {
  var split = key.split('_');
  if (split[0] === 'swagger') {
    var configItem = config;
    for (var i = 1; i < split.length; i++) {
      var subKey = split[i];
      if (i < split.length - 1) {
        if (!configItem[subKey]) { configItem[subKey] = {}; }
        configItem = configItem[subKey];
      } else {
        configItem[subKey] = value;
      }
    }
    debug('loaded env var: %s = %s', split.slice(1).join('.'), value);
  }
});

