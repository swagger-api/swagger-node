This is the Wordnik Swagger code for the express framework.  For more on Swagger, please visit http://swagger.wordnik.com.  For more on express, please visit https://github.com/visionmedia/express

## READ MORE about swagger!

See the (swagger website)[http://swagger.wordnik.com] or the (swagger-core wiki)[https://github.com/wordnik/swagger-core/wiki], which contains information about the swagger json spec.

Try a sample!  The source for a functial sample is available on github:

```
https://github.com/wordnik/swagger-node-express/blob/master/SAMPLE.md
```

### Adding swagger to your express-based API

Include swagger.js in your app and add express as the app handler:

```js
var express = require("express")
 , url = require("url")
 , swagger = require("swagger.js");

var app = express();
app.use(express.bodyParser());

swagger.setAppHandler(app);
```

You can optionally add a validator function, which is used to filter the swagger json and request operations:

```js
/* This is a sample validator.  It simply says that for _all_ POST, DELETE, PUT  methods, the header `api_key` OR query param `api_key` must be equal to the string literal `special-key`.  All other HTTP ops are A-OK */

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

You now add models to the swagger context.  Models are described in a JSON format, per the [swagger model specification](https://github.com/wordnik/swagger-core/wiki/Datatypes).  Most folks keep them in a separate file (see (here)[https://github.com/wordnik/swagger-node-express/blob/master/Apps/petstore/models.js] for an example), or you can add them as such:

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
    "params" : [param.path("petId", "ID of pet that needs to be fetched", "string")],
    "responseClass" : "Pet",
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet')],
    "nickname" : "getPetById"
  },
  'action': function (req,res) {
    if (!req.params.petId) {
      throw swe.invalid('id'); }
    var id = parseInt(req.params.petId);
    var pet = petData.getPetById(id);

    if(pet) res.send(JSON.stringify(pet));
    else throw swe.notFound('pet');
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

Now you can open up a (swagger-ui)[https://github.com/wordnik/swagger-ui] and browse your API, generate a client with (swagger-codegen)[https://github.com/wordnik/swagger-codegen], and be happy.

