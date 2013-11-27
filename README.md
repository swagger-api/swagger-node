This is the Wordnik Swagger code for the express framework.  For more on Swagger, please visit http://swagger.wordnik.com.  For more on express, please visit https://github.com/visionmedia/express

## READ MORE about swagger!

See the [swagger website](http://swagger.wordnik.com) or the [swagger-core wiki](https://github.com/wordnik/swagger-core/wiki), which contains information about the swagger json spec.

Try a sample!  The source for a [functional sample](https://github.com/wordnik/swagger-node-express/blob/master/SAMPLE.md) is available on github:



### Adding swagger to your express-based API

Include swagger.js in your app and add express as the app handler:

```js
var express = require("express")
 , url = require("url")
 , swagger = require("swagger-node-express");

var app = express();
app.use(express.json());
app.use(express.urlencoded());

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
        apiKey = url.parse(req.url,true).query["api_key"]; }
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
    "params" : [swagger.pathParam("petId", "ID of pet that needs to be fetched", "string")],
    "responseClass" : "Pet",
    "errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('pet')],
    "nickname" : "getPetById"
  },
  'action': function (req,res) {
    if (!req.params.petId) {
      throw swagger.errors.invalid('id'); }
    var id = parseInt(req.params.petId);
    var pet = petData.getPetById(id);

    if(pet) res.send(JSON.stringify(pet));
    else throw swagger.errors.notFound('pet');
  }
};

swagger.addGet(findById);

```

Adds an API route to express and provides all the necessary information to swagger.

Finally, configure swagger with a `public` URL and version:

```js
swagger.configure("http://petstore.swagger.wordnik.com", "0.1");
```

and the server can be started:

```js
app.listen(8002);
```

Now you can open up a [swagger-ui](https://github.com/wordnik/swagger-ui) and browse your API, generate a client with [swagger-codegen](https://github.com/wordnik/swagger-codegen), and be happy.


### Other Configurations

#### .{format} suffix removal

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

#### Mapping swagger to subpaths

To add a subpath to the api (i.e. list your REST api under `/api` or `/v1`), you can configure express as follows:

```js
var app = express();
var subpath = express();

app.use(express.json());
app.use(express.urlencoded());
app.use("/v1", subpath);

swagger.setAppHandler(subpath);
```

Now swagger and all apis configured through it will live under the `/v1` path (i.e. `/v1/api-docs.json`).

#### Allows-origin and special headers

If you want to modify the default headers sent with every swagger-managed method, you can do so as follows:

```js
swagger.setHeaders = function setHeaders(res) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-API-KEY");
  res.header("Content-Type", "application/json; charset=utf-8");
};
```
If you have a special name for an api key (such as `X-API-KEY`, per above), this is where you can inject it.
