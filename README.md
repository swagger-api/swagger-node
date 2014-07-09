# Swagger for Express and Node.js

[![Build Status](https://travis-ci.org/wordnik/swagger-node-express.png)](https://travis-ci.org/wordnik/swagger-node-express)

This is a [Swagger](https://github.com/wordnik/swagger-spec) module for the [Express](http://expressjs.com) web application framework for Node.js.

Try a sample!  The source for a [functional sample](https://github.com/wordnik/swagger-node-express/blob/master/SAMPLE.md) is available on github.

## What's Swagger?

The goal of Swagger™ is to define a standard, language-agnostic interface to REST APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection. When properly defined via Swagger, a consumer can understand and interact with the remote service with a minimal amount of implementation logic. Similar to what interfaces have done for lower-level programming, Swager removes the guesswork in calling the service.


Check out [Swagger-Spec](https://github.com/wordnik/swagger-spec) for additional information about the Swagger project, including additional libraries with support for other languages and more. 


## Installation

Using NPM, include the `swagger-node-express` module in your `package.json` dependencies.

```json
{
	...
	"dependencies": {
		"swagger-node-express": "~2.0",
		...
	}
}
```


## Adding Swagger to an Express Application

```js
// Load module dependencies.
var express = require("express")
 , url = require("url")
 , swagger = require("swagger-node-express");

// Create the application.
var app = express();
app.use(express.json());
app.use(express.urlencoded());

// Couple the application to the Swagger module.
swagger.setAppHandler(app);
```

You can optionally add a validator function, which is used to filter the swagger json and request operations:

```js
// This is a sample validator.  It simply says that for _all_ POST, DELETE, PUT  methods, 
// the header api_key OR query param api_key must be equal to the string literal 
// special-key.  All other HTTP ops are A-OK */

swagger.addValidator(
  function validate(req, path, httpMethod) {
    //  example, only allow POST for api_key="special-key"
    if ("POST" == httpMethod || "DELETE" == httpMethod || "PUT" == httpMethod) {
      var apiKey = req.headers["api_key"];
      if (!apiKey) {
        apiKey = url.parse(req.url,true).query["api_key"];
      }
      if ("special-key" == apiKey) {
        return true; 
      }
      return false;
    }
    return true;
  }
);

```

You now add models to the swagger context.  Models are described in a JSON format, per the [swagger model specification](https://github.com/wordnik/swagger-core/wiki/Datatypes).  Most folks keep them in a separate file (see [here](https://github.com/wordnik/swagger-node-express/blob/master/Apps/petstore/models.js) for an example), or you can add them as such:

```js
swagger.addModels(models);

```

Next, add some resources.  Each resource contains a swagger spec as well as the action to execute when called.  The spec contains enough to describe the method, and adding the resource will do the rest.  For example:


```js
var findById = {
  'spec': {
    "description" : "Operations about pets",
    "path" : "/pet.{format}/{petId}",
    "notes" : "Returns a pet based on ID",
    "summary" : "Find pet by ID",
    "method": "GET",
    "parameters" : [swagger.pathParam("petId", "ID of pet that needs to be fetched", "string")],
    "type" : "Pet",
    "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('pet')],
    "nickname" : "getPetById"
  },
  'action': function (req,res) {
    if (!req.params.petId) {
      throw swagger.errors.invalid('id');
    }
    var id = parseInt(req.params.petId);
    var pet = petData.getPetById(id);

    if (pet) {
      res.send(JSON.stringify(pet));
    } else {
      throw swagger.errors.notFound('pet');
    }
  }
};

swagger.addGet(findById);

```

Adds an API route to express and provides all the necessary information to swagger.

Finally, configure swagger with a `public` URL and version (note, this must be called after all the other swagger API calls):

```js
swagger.configure("http://petstore.swagger.wordnik.com", "0.1");
```

and the server can be started:

```js
app.listen(8002);
```

Now you can open up a [swagger-ui](https://github.com/wordnik/swagger-ui) and browse your API, generate a client with [swagger-codegen](https://github.com/wordnik/swagger-codegen), and be happy.


## Additional Configurations

### .{format} suffix removal

If you don't like the .{format} or .json suffix, you can override this before configuring swagger:

```js
swagger.configureSwaggerPaths("", "/api-docs", "");
```

That will put the resource listing under `/api-docs`, and ditch the `.{format}` on each of the apis you're adding to.  Make sure to set the paths correctly in your spec configuration though, like such:

```js
// note the .{format} is removed from the path!
var findById = {
  'spec': {
    "description" : "Operations about pets",
    "path" : "/pet/{petId}",
    "notes" : "Returns a pet based on ID",
    ...
```

### Mapping swagger to subpaths

To add a subpath to the api (i.e. list your REST api under `/api` or `/v1`), you can configure express as follows:

```js
var app = express();
var subpath = express();

app.use(express.json());
app.use(express.urlencoded());
app.use("/v1", subpath);

swagger.setAppHandler(subpath);
```

Now swagger and all apis configured through it will live under the `/v1` path (i.e. `/v1/api-docs`).

### Allows special headers

If you want to modify the default headers sent with every swagger-managed method, you can do so as follows:

```js
swagger.setHeaders = function setHeaders(res) {
  res.header("Access-Control-Allow-Headers", "Content-Type, X-API-KEY");
  res.header("Content-Type", "application/json; charset=utf-8");
};
```
If you have a special name for an api key (such as `X-API-KEY`, per above), this is where you can inject it.

### Error handling
As of 2.1.0, swagger no longer consumes errors.  The preferred way to handle errors
is to use standard express middelware with an arity of 4 I.E.

```javascript
var app = express();
swagger.setAppHandler(app);
app.use(function(err, req, res, next){
  //do something with the error.
});
```

### Enabling cors support using cors library

To enable cors support using cors express npm module (https://npmjs.org/package/cors) add the following to your app.

```js
var cors = require('cors');

var corsOptions = {
    credentials: true,
    origin: function(origin,callback) {
        if(origin===undefined) {
            callback(null,false);
        } else {
            // change wordnik.com to your allowed domain.
            var match = origin.match("^(.*)?.wordnik.com(\:[0-9]+)?");
            var allowed = (match!==null && match.length > 0);
            callback(null,allowed);
        }
    }
};

app.use(cors(corsOptions));

```

### Configuring the Resource Listing Information

The Swagger `info` node of the resource listing can be configured using the `configureDeclaration` method:

```js
swagger.configureDeclaration('pet', {
	description: 'Operations about Pets',
	authorizations : ["oauth2"],
	protocols : ["http"],
	consumes: ['application/json'],
	produces: ['application/json']
});
```

## License

Copyright 2014 Reverb Technologies, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
