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
  editorDir: path.resolve(config.nodeModules, 'swagger-editor'),
  editorConfig: {
    analytics: { google: { id: null } },
    disableCodeGen: true,
    disableNewUserIntro: true,
    examplesFolder: '/spec-files/',
    exampleFiles: [],
    autocompleteExtension: {},
    useBackendForStorage: true,
    backendEndpoint: '/editor/spec',
    backendHealthCheckTimeout: 5000,
    useYamlBackend: true,
    disableFileMenu: true,
    enableTryIt: true,
    headerBranding: false,
    brandingCssClass: null,
    schemaUrl: '/schema/swagger.json',
    importProxyUrl: 'https://cors-it.herokuapp.com/?url='
  }
};

// project //

config.project = {
  port: process.env.PORT || 10010,
  skeletonsDir: path.resolve(__dirname, '..', 'project-skeletons')
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
