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
http://localhost:8002/resources.json
</pre>

or from a [swagger UI](https://github.com/wordnik/swagger-ui)

![Swagger UI](https://github.com/wordnik/swagger-node-express/blob/master/docs/swagger-config.png?raw=true)

### How it works
The swagger.js file is included when configuring the express server.  There
are a few additional steps to get the api to declare the swagger spec:

<li> - Define your input/output models in JSON schema format

<li> - Define a specification for operations against the API

For the sample app, the models are defined here:

<pre>
Apps/petstore/models.js
</pre>

You could load this from a static file or generate them programatically as in the
sample.

The operations and the callback functions are defined in this file:

<pre>
Apps/petstore/petResources.js
</pre>

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
		"description":"You forgot to log in!"
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


### Current limitations

<li> - Only JSON is supported </li>

<li> - Nested objects may not be declared in the models array </li>

<li> - There are probably (many) others </li>