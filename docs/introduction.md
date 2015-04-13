# What is swagger-node?

swagger-node provides tools to design and build APIs entirely in Node.js.  It integrates with popular Node.js API frameworks like express, connect, hapi, and sails.  With swagger-node, you can model, build, and test your API **first**. When your happy with the design, you can focus on writing custom controller code in Node.js for each of your API operations.


* [The Model-first programming approach](#programming_model)
* [Get help](#gethelp)


## <a name="programming_model"></a>The Model-first programming approach

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

Controller files are written in Node.js and are located in `<project-root>/api/controllers`. For example: `<project-root>/api/controllers/hello_world.js`

* Use the `operationId` property for your operations in the Swagger 2.0 Model
```yaml
    get:
      description: "Returns 'Hello' to the caller"
      operationId: "hello"
```

* Behind the scenes, swagger-node wires up your app, routing HTTP requests to specific Node.js controller files. 

* At runtime swagger-tools middleware validates the request before sending it to the `hello` operation of the `hello_world` controller. 

* Finally, your controller logic will be invoked.


## <a name="gethelp"></a>Get help

Need help using swagger-node? Have an issue to report? See the [Reporting issues and getting help](./report-issues.md).
