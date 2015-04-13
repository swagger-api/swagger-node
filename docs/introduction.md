## What is swagger-node?

The swagger-node module provides tools for designing and building APIs entirely in Node.js.  It integrates with popular Node.js API frameworks like express, connect, hapi, restify, and sails.  With swagger-node, you can model, build, and test your API **first**. When your happy with the design, you can focus on writing custom controller code in Node.js for each of your API operations.


* [The Model-first programming approach](#programming_model)
* [Reporting issues](#gethelp)


### <a name="programming_model"></a>The Model-first programming approach

The focus of swagger-node is using a standard model for building APIs. The programming flow for an swagger-node project looks like this:

* Define the Swagger Model using the Swagger 2.0 Editor included with swagger-node.

*The Swagger editor*
![alt text](./images/swagger-editor.png)

* Annotate your paths and operations in the Swagger 2.0 model with the `x-swagger-router-controller` extension. This extension specifies the name of the controller file that implements the logic behind the operation.  For example:

```yaml
paths:
  /hello:
    x-swagger-router-controller: "hello_world"  
```

* Use the operationId property to specify which controller method to call for the given path:

```yaml
    get:
      description: "Returns 'Hello' to the caller"
      operationId: "hello"
```

* Implement your controller files in Node.js and place them in `<project-root>/api/controllers`. For example: `<project-root>/api/controllers/hello_world.js` 

* Behind the scenes, swagger-node wires up your app, routing HTTP requests to specific Node.js controller files. 

* At runtime swagger-tools middleware validates the request before sending it to the `hello` operation of the `hello_world` controller. 

* Finally, the controller logic associated with the requested path is executed.


### <a name="gethelp"></a>Reporting issues

Have an issue to report? See the [Reporting issues](./report-issues.md).
