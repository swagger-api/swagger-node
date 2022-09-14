## What is the swagger module?
The swagger module provides tools for designing and building APIs entirely in Node.js. It integrates with popular Node.js servers, including Express, hapi, restify, and Sails, as well as any Connect-based middleware. With swagger, you can specify, build, and test your API from the very beginning, and it allows you to make changes to your design without rewriting the logic of your implementation. It explicitly isolates the design of your interfaces from writing your controller code, leading to a much better software development lifecycle. 

* [The API-First Development Process](#sdlc)
* [Reporting issues](#gethelp)

### <a name="sdlc"></a>The API-First Development Process
API design is a discovery process. Swagger development begins with design tooling, and it expects that you will evolve your interface over time. It gracefully handles the routing of interfaces to controllers so that you can make changes to your interfaces without clobbering any of your implementation logic.

Designing an API specification is like writing a contract. As you write the spec in YAML using [Swagger 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md), your API documentation is generated in real-time, allowing the client and server teams to agree on how their systems will work together. 

Once you have defined your first operation, it drives a mock server, which enables  client development happen in parallel with server development. As you build the client, you will discover further changes you'll need to make to your APIs, meaning another iteration of the specification.

* Defining your API specification using the Swagger Editor (included with swagger).

*The Swagger Editor*
![alt text](./images/swagger-editor.png)

Write your specification in YAML on the left, and see the API documentation in real-time on the right. Auto-completion makes it easy to learn the syntax, and validation helps you correct any syntactic or semantic errors you might make along the way.

* Use the `x-swagger-router-controller` extension to annotating your paths and operations. This maps the interface onto the name of the controller file that implements the logic behind the operation. For example:

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

* Behind the scenes, swagger wires up your app, routing HTTP requests to specific Node.js controller files. 

* At runtime swagger-tools middleware validates the request before sending it to the `hello` operation of the `hello_world` controller. 

* Finally, the controller logic associated with the requested path is executed.

### <a name="gethelp"></a>Reporting issues
Have an issue to report? See the [Reporting issues](./report-issues.md).
