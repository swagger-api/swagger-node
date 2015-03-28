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

var should = require('should');
var path = require('path');
var tmp = require('tmp');
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
      netutil.isPortOpen(port, function(err, open) {
        should.not.exist(err);
        should(open).be.false;
        done();
      });
    });
  });

  describe('download', function() {

    it('should download a file', function(done) {

      tmp.setGracefulCleanup();
      tmp.dir({ unsafeCleanup: true }, function(err, tmpDir) {
        should.not.exist(err);

        var sourceFile = path.resolve(tmpDir, 'source');
        var outputLines = '';
        for (var i = 0; i < 20; i++) {
          outputLines += 'line' + i + '\n';
        }
        fs.writeFileSync(sourceFile, outputLines);
        var destFile = path.resolve(tmpDir, 'dest');

        serve(sourceFile, function(port, server) {
          var url = 'http://localhost:' + port;

          netutil.download(url, destFile, function(err, size) {
            server.close();
            should.not.exist(err);

            var destContent = fs.readFileSync(destFile, 'utf8');
            size.should.eql(destContent.length);
            destContent.should.eql(outputLines);
            done();
          });
        });
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
