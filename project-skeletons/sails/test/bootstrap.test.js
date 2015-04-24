var Sails = require('sails'), sails;

before(function(done) {
  Sails.lift({
    // configuration for testing purposes
  }, function(err, s) {
    if (err) return done(err);
    sails = s;
    global.server = sails.hooks.http.app;
    // here you can load fixtures, etc.
    done(err, sails);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});
