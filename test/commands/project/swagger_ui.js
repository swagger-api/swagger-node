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

var should = require('should');
var util = require('util');
var path = require('path');
var proxyquire =  require('proxyquire').noPreserveCache();
var tmp = require('tmp');
var fs = require('fs');
var config = require('../../../config/index');
var request = require('superagent');
var Url = require('url');

var projectStubs = {
    'child_process': {
        spawn: function(command, args, options) {
            var ret = {};
            ret.stdout = {
                on: function() {}
            };
            ret.stderr = {
                on: function() {}
            };
            ret.on = function(name, cb) {
                if (name === 'close') {
                    setTimeout(function() { cb(0); }, 0);
                }
                return ret;
            };
            return ret;
        }
    },
};
var project = proxyquire('../../../lib/commands/project/project', projectStubs);

var SWAGGER_UI_LOAD_PATH = '/ui/spec';                // swagger-editor expects to GET the file here

describe('swagger ui', function() {

    var name = 'basic';
    var projPath;
    var swaggerFile;
    var baseUrl;
    var hostname;
    var port;

    before(function(done) {
        tmp.setGracefulCleanup();
        tmp.dir({ unsafeCleanup: true }, function(err, dir) {
            should.not.exist(err);
            var tmpDir = dir;
            process.chdir(tmpDir);

            projPath = path.resolve(tmpDir, name);
            swaggerFile = path.resolve(projPath, config.swagger.fileName);
            process.chdir(tmpDir);
            project.create(name, { framework: 'connect' }, done);
        });
    });

    var uiStubs = {
        '../../util/browser': {
            open: function(uiUrl, cb) {
                var url = Url.parse(uiUrl);
                url.hash = null;
                url.query = null;
                baseUrl = Url.format(url);
                hostname = url.hostname;
                port = url.port;
                cb(new Error());
            }
        }
    };
    var ui = proxyquire('../../../lib/commands/project/swagger_ui', uiStubs);

    it('should be able to load swagger', function(done) {
        var fileContents = fs.readFileSync(swaggerFile, 'utf8');

        project.read(projPath, {}, function(err, project) {
            if (err) { cb(err); }

            ui.ui(project, {}, function() {
                var url = Url.resolve(baseUrl, SWAGGER_UI_LOAD_PATH);
                request
                    .get(url)
                    .buffer()
                    .end(function(err, res) {
                        should.not.exist(err);
                        res.status.should.eql(200);
                        //res.text.should.equal(fileContents);
                        done();
                    });
            });
        });
    });

    it('should be able to run on a custom host and port', function(done) {
        var fileContents = fs.readFileSync(swaggerFile, 'utf8');

        project.read(projPath, {}, function(err, project) {
            if (err) {
                cb(err);
            }

            ui.ui(project, { host: 'localhost', port: '1235' }, function () {
                hostname.should.equal('localhost');
                port.should.equal('1235');
                done();
            });
        });
    });

});
