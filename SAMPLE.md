This is the Wordnik Swagger code for the express framework.  For more on Swagger, please visit http://swagger.wordnik.com.  For more on express, please visit https://github.com/visionmedia/express

### To run the sample App

You must first install dependencies:

```js
npm install 
```

To run the sample server:
```js
node sample-application/app.js
```

Then visit the server directly from your browser:

```
http://localhost:8002/api-docs
```

or from [swagger UI](https://github.com/wordnik/swagger-ui), mounted at `/docs`: [http://localhost:8002/docs](http://localhost:8002/docs).

### How it works

The swagger.js file is included when configuring the express server.  There
are a few additional steps to get the api to declare the swagger spec:

<li> Define your input/output models in JSON schema format

<li> Define a specification for operations against the API

For the sample app, the models are defined here: [Apps/petstore/models.js](https://github.com/wordnik/swagger-node-express/blob/master/Apps/petstore/models.js)

You could load this from a static file or generate them programatically as in the
sample.

The operations and the callback functions are defined in this file: [Apps/petstore/petResources.js](https://github.com/wordnik/swagger-node-express/blob/master/Apps/petstore/petResources.js)

Each spec defines input/output params with helper functions to generate the swagger
metadata.

When the routes are added (see petstore.js: addGet, addPost...), the params
are validated and added to the schema.  If they fail validation, the failure
will be logged to the console and they will not be added to the server.

### Other notes

The swagger.js code wraps exceptions and turns them into the appropriate HTTP
error response.  To take advantage of this, you can throw exceptions as follows:

```js
try{
	//	some dangerous function
}
catch(ex){
	throw {
		"code":401,
		"description":"You forgot to log in!"
	}
}
```

Also, the "Access-Control-Allow-Origin" is hard-coded to "*" to allow access from
localhost.  This will become a configuration option at some point.

#### Security

You can secure the API by adding your own validator.  These methods can read the
request object and extract cookies, headers, api-keys, etc.  They also have
access to the HTTP method and path being requested.  You can then decide for
yourself it the caller should have access to the resource.  See the petstore.js
example:

```js
swagger.addValidator(
	function validate(req, path, httpMethod) {
		...
```


### Current limitations

<li> Only JSON is supported </li>

<li> - There are probably (many) others </li>
