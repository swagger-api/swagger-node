var params            = require('./paramTypes');
var errorHandling     = require('./errorHandling');
var swagger           = require('./swagger');

module.exports        = swagger;
module.exports.params = params;
module.exports.queryParam    = params.query;
module.exports.pathParam     = params.path;
module.exports.bodyParam     = params.body;
module.exports.formParam     = params.form;
module.exports.headerParam   = params.header;
module.exports.error         = errorHandling.error;

