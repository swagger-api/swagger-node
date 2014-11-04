var params            = require('./paramTypes');
var errorHandling     = require('./errorHandling');
var swagger           = require('./swagger');

module.exports = exports = swagger;
module.exports.params = params;
exports.queryParam    = params.query;
exports.pathParam     = params.path;
exports.bodyParam     = params.body;
exports.formParam     = params.form;
exports.headerParam   = params.header;
exports.error         = errorHandling.error;

