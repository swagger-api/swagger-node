This is the Wordnik Swagger code for the express framework.  For more on Swagger, please visit http://swagger.wordnik.com.  For more on express, please visit https://github.com/visionmedia/express

### To run

You must first install the express module (see also http://expressjs.com/guide.html):

<pre>
npm install express
</pre>

To run the sample server:
<pre>
node src/main/js/petstore.js
</pre>

Then visit the server from your browser:

<pre>
http://localhost:8002/resources.json
</pre>

or from a swagger UI

### How it works
The swagger.js file is included when configuring the express server.  There
are a few additional steps to get the api to declare the swagger spec:

<li> - Define your input/output models in JSON schema format

<li> - Define a specification for operations against the API

For the sample app, the models are defined here:

<pre>
./src/main/js/models.js
</pre>

You could load this from a static file or generate them programmatically as in the
sample.

The operations and the callback functions are defined in this file:

<pre>
./src/main/js/petResources.js
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
localhost.  This will become a configuraiton option at some point.

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