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

var should = require('should');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var http = require('http');
var netutil = require('../../lib/util/net');

describe('net', function() {

  describe('isPortOpen', function() {

    var port, server;

    it('should recognize an open port', function(done) {

      serve(null, function(p, s) {
        port = p; server = s;
        netutil.isPortOpen(port, function(err, open) {
          should.not.exist(err);
          should(open).be.true;
          done();
        });
      })
    });

    it('should recognize an unopened port', function(done) {

      server.close();
      netutil.isPortOpen(port, 10, function(err, open) {
        should.not.exist(err);
        should(open).be.false;
        done();
      });
    });
  });

});

// return port, server
function serve(file, cb) {
  var server = http.createServer(function(req, res) {
    fs.readFile(file, function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  });
  server.listen(0, 'localhost', function() {
    var port = server.address().port;
    cb(port, server);
  });
}
