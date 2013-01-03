This is the Wordnik Swagger code for the express framework.  For more on Swagger, please visit http://swagger.wordnik.com.  For more on express, please visit https://github.com/visionmedia/express

### To run

You must first install the express module.  See the [express framework site](http://expressjs.com/guide.html) for a guide and quick start.

<pre>
npm install express
</pre>

To run the sample server:
<pre>
node Apps/petstore/main.js
</pre>

Then visit the server from your browser:

<pre>
http://localhost:8002/api-docs.json
</pre>

or from [swagger UI], mounted at `/docs`: [http://localhost:8002/docs](http://localhost:8002/docs).

### How it works
The swagger.js file is included when configuring the express server.  There
are a few additional steps to get the api to declare the swagger spec:

<li> - Define your input/output models in JSON schema format

<li> - Define a specification for operations against the API

For the sample app, the models are defined here:

[Apps/petstore/models.js](https://github.com/wordnik/swagger-node-express/blob/master/Apps/petstore/models.js)

You could load this from a static file or generate them programatically as in the
sample.

The operations and the callback functions are defined in this file:

[Apps/petstore/petResources.js](https://github.com/wordnik/swagger-node-express/blob/master/Apps/petstore/petResources.js)

Each spec defines input/output params with helper functions to generate the swagger
metadata.

When the routes are added (see petstore.js: addGet, addPost...), the params
are validated and added to the schema.  If they fail validation, the failure
will be logged to the console and they will not be added to the server.

### Other notes
The swagger.js code wraps exceptions and turns them into the appropriate HTTP
error response.  To take advantage of this, you can throw exceptions as follows:

<pre>
try{
	//	some dangerous function
}
catch(ex){
	throw {
		"code":401,
		"reason":"You forgot to log in!"
	}
}
</pre>

Also, the "Access-Control-Allow-Origin" is hard-coded to "*" to allow access from
localhost.  This will become a configuration option at some point.

#### Security
You can secure the API by adding your own validator.  These methods can read the
request object and extract cookies, headers, api-keys, etc.  They also have
access to the HTTP method and path being requested.  You can then decide for
yourself it the caller should have access to the resource.  See the petstore.js
example:

<pre>
swagger.addValidator(
	function validate(req, path, httpMethod) {
		...
</pre>

### Other Configurations
If you don't like the `.json` suffix `(.{format})`, you can configure it away.  In swagger.js,
change the formatString (default is ".{format}"), resourcePath, and suffix for json as follows:

```js
var formatString = "";						// default is ".{format}"
var resourcePath = "/api-docs";   // default is ".api-docs.{format}"
var jsonSuffix = ""; 							// default is ".json"
```

Of course, in the petstore example, you'll want to change the paths in the petResource.js file to
remove the `.{format}` suffix:

```js
// was:
exports.findById = {
  'spec': {
    "description" : "Operations about pets",
    "path" : "/pet.{format}/{petId}",
    "notes" : "Returns a pet based on ID",
    "summary" : "Find pet by ID",
    "method": "GET",
    "params" : [param.path("petId", "ID of pet that needs to be fetched", "string")],
    "responseClass" : "Pet",
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet')],
    "nickname" : "getPetById"
  }

// should be:
exports.findById = {
  'spec': {
    "description" : "Operations about pets",
    "path" : "/pet/{petId}",
    "notes" : "Returns a pet based on ID",
    "summary" : "Find pet by ID",
    "method": "GET",
    "params" : [param.path("petId", "ID of pet that needs to be fetched", "string")],
    "responseClass" : "Pet",
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet')],
    "nickname" : "getPetById"
  }
```

### Current limitations

<li> - Only JSON is supported </li>

<li> - Nested objects may not be declared in the models array </li>