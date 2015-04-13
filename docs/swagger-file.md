# <a name="understandingthespec"></a>Understanding the Swagger specification file

* [Intro](#intro)
* [Default swagger-node project file](#default)
* [Swagger specification elements](#reference)

## <a name="intro"></a>Intro

When you execute `swagger project create myproject`, a default Swagger model is placed in `myproject/api/swagger/swagger.yaml`. This model conforms to the [Swagger 2.0 specification](https://github.com/reverb/swagger-spec/blob/master/versions/2.0.md). 

>Note: For a quick intro to swagger, see "[What is Swagger](./swagger-about)". 

## <a name="default"></a>Default swagger-node project file

Here is the entire `swagger.yaml` file that is provisioned for a new swagger-node project: 

```yaml
    swagger: "2.0"
    info:
      version: "0.0.1"
      title: Hello World App
    # during dev, should point to your local machine
    host: localhost
    # basePath prefixes all resource paths
    basePath: /
    #
    schemes:
      # tip: remove http to make production-grade
      - http
      - https
    # format of bodies a client can send (Content-Type)
    consumes:
      - application/json
    # format of the responses to the client (Accepts)
    produces:
      - application/json
    paths:
      /hello:
        # binds swagger-node app logic to a route
        x-swagger-router-controller: hello_world
        get:
          description: Returns 'Hello' to the caller
          # used as the method name of the controller
          operationId: hello
          parameters:
            - name: name
              in: query
              description: The name of the person to whom to say hello
              required: false
              type: string
          responses:
            "200":
              description: Success
              schema:
                # a pointer to a definition
```


##<a name="reference"></a>wagger specification elements

The Swagger file includes a number of standard Swagger 2.0 specification elements. You can read about them in the [Swagger 2.0 specification](https://github.com/reverb/swagger-spec/blob/master/versions/2.0.md). 

Here's a brief description of the elements in a swagger-node project file:

*  **swagger: 2.0** - (Required) Identifies the version of the Swagger specification (2.0).

*  **info:** - (Required) Provides metadata about the API.

*  **host:** - (Optional) The host serving the API. By default, a new project connects to a server running locally on port 10010. 

*  **basePath:** - (Optional) The base path on which the API is served, which is relative to the host. 

*  **schemes:** - (Optional) A list of transfer protocol(s) of the API.

*  **consumes:** - (Optional) A list of MIME types the APIs can consume.

*  **produces:** - (Optional) A list of MIME types the APIs can produce.

*  **paths:** - (Required) Defines the available operations on the API. You'll spend most of your time configuring the paths part of the file. You can read about the path element in the [Swagger 2.0 specification](https://github.com/reverb/swagger-spec/blob/master/versions/2.0.md). In general, the paths section specifies an operation's verb (like `get`), the endpoint for an API operation (like `/hello`), query parameters, and responses. 

* **definitions:** - (Optional) These represent the structure of complex objects such as request and response bodies. For example, you might have a collection of `/users` that returns an array of `user` objects. You would describe these with two definitions: 1) to describe the `User` object, and 2) the definition of the `Users` array. Swagger uses [JSON-schema](http://json-schema.org/).

* **x-swagger-router-controller:** - (Optional) This extension specifies the name of the controller file (hello_world.js) that will execute when this API operation is called. Controller files reside in `apis/controllers` in your swagger-node project. This extension is provided through the [`swagger-tools`](https://github.com/apigee-127/swagger-tools) middleware module.

