# What is swagger-node?

swagger-node provides the tools you need to design and build APIs entirely in Node.js and deploy them on any Node.js runtime system.


* [Quick overview](#overview)
* [The Model-first swagger-node programming approach](#programming_model)
* [Get help](#gethelp)

## <a name="overview"></a>Quick overview of swagger-node

swagger-node lets you model, build, and test your API model **first** in the intuitive, interactive Swagger editor. When you're happy with your design, you can focus on writing custom controller code (in Node.js) for each of your APIs operations. 


## <a name="programming_model"></a>The Model-first swagger-node programming approach

The focus of swagger-node is using a standard model for building APIs.  

The programming flow for an swagger-node project looks like this:

* Define the Swagger Model using the Swagger 2.0 Editor included with swagger-node.

* Annotate your paths and operations in the Swagger 2.0 model with the `x-swagger-router-controller` extension to define the name of the Controller that implements the logic behind the operation.  For example:

```yaml
paths:
  /hello:
    x-swagger-router-controller: "hello_world"  
```

* Use the `operationId` property for your operations in the Swagger 2.0 Model
```yaml
    get:
      description: "Returns 'Hello' to the caller"
      operationId: "hello"
```

* Behind the scenes, swagger-node wires up your app, routing HTTP requests to specific Node.js controller files. 

* At runtime Swagger middleware validates the request before sending it to the `hello` operation of the `hello_world` controller which is found in `{project_home}/api/controllers/hello_world.js`.  By default the swagger-router looks for controllers in `[project_home]/api/controllers` but this can be overridden in the project.

* Finally, your controller logic will be invoked according to the `x-swagger-router-controller` specified for the resource path and the `operationId` of the corresponding operation.  By default the Controller should be in `[project_home]/api/controllers/[x-swagger-router-controller].js`


## <a name="gethelp"></a>Get help

Need help using swagger-node? Have an issue to report? See the [Reporting issues and getting help](./report-issues.md).
