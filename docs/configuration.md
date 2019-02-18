## Configuration

** NOTE: The following applies to swagger-node apps replying on swagger-node-runner 0.5.x and better. (ie. Any app using swagger-connect 0.1.0, swagger-express-mw 0.1.0, swagger-hapi 0.1.0, swagger-restify 0.1.0, or swagger-sails 0.1.0 - or higher versions of the same.) **

Swagger-Node application configuration is driven by the file `default.yaml` (by default) in the application's `config` directory. Configuration is driven by the [config](https://github.com/lorenwest/node-config/wiki/Configuration-Files) module, so reference its documentation to understand how you may set up configuration per environment and perform configuration overrides. By default, the configuration file looks something like this:

```yaml
# swagger configuration file

# values in the swagger hash are system configuration for swagger-node
swagger:

  fittingsDirs: [ api/fittings, node_modules ]
  defaultPipe: null
  swaggerControllerPipe: swagger_controllers  # defines the standard processing pipe for controllers

  # values defined in the bagpipes key are the bagpipes pipes and fittings definitions
  # (see https://github.com/apigee-127/bagpipes)
  bagpipes:

    _router:
      name: swagger_router
      mockMode: false
      mockControllersDirs: [ api/mocks ]
      controllersDirs: [ api/controllers ]

    _swagger_validate:
      name: swagger_validator
      validateResponse: true

    # pipe for all swagger-node controllers
    swagger_controllers:
      - onError: json_error_handler
      - cors
      - swagger_params_parser
      - swagger_security
      - _swagger_validate
      - express_compatibility
      - _router

    # pipe to serve swagger (endpoint is in swagger.yaml)
    swagger_raw:
      name: swagger_raw

# any other values in this file are just loaded into the config for application access...
```

Important things to note:

* All configuration for the Swagger-Node system is under the `swagger` key
* Overall system behavior is driven by configuring the [Bagpipes](https://github.com/apigee-127/bagpipes) library
* You may include other values and sections as you wish, they will just be loaded into the config for your application
  to access.

Let's walk through the configuration:

### fittingsDirs

Defines the directories Bagpipes will search for fittings that are defined or used in the bagpipes section below. Fittings are extension plugins that can either be installed (eg. https://www.npmjs.com/package/volos-swagger-oauth and https://www.npmjs.com/package/volos-swagger-apply) or written into your application directly.

### defaultPipe

If no pipe is explicitly declared for a path or operation, this pipe will be played when that endpoint is hit.

### swaggerControllerPipe

This names the standard pipe that plays for the swagger-node controllers (declared in the swagger.yaml with the
extension `x-swagger-router-controller`). We'll look at how that's defined in a second.

### bagpipes

This block is the configuration passed to the [bagpipes](https://github.com/apigee-127/bagpipes) underlying the application. As you can see, it defines not only the flow, but also the configuration of the elements.

#### _router

This configures the standard swagger-node router (currently swagger-tools). It tells it how to find your controllers, your mock controllers, and whether to run in mock mode.

#### _swagger_validate

This configures the swagger validator (currently swagger-tools). You can turn response validation on and off here.

#### swagger_controllers

Because this is specified as your controller pipe (in the `swaggerControllerPipe` setting above), this pipe plays for all paths and operations where you've specified a controller extension (`x-swagger-router-controller`).

The default pipe is as follows:

1. set an error handler that converts all errors to JSON
2. run the [cors](https://www.npmjs.com/package/cors) module
3. execute swagger security (currently swagger-tools)
4. run swagger validator (currently swagger-tools)
5. add a few commonly used Express functions (if not already present) to request (path, query, get) and response (json,
 get, set, status).
6. run the router (currently swagger-tools)

As you can see, you have full control over the pipeline and may add or remove elements you need for your specific application and environment.

#### swagger_raw

This serves your swagger file - on the path that is defined in your `api/swagger/swagger.yaml` and tagged with the `x-swagger-pipe` extension. It looks like this:

```yaml
  /swagger:
    x-swagger-pipe: swagger_raw
```

Note: This automatically filters out all sections that are swagger extensions (`x-*`) by using a predefined regular expression: `/^(?!x-.*)/`.

Naturally, if you don't wish to serve your swagger on this path or at all, you may change or remove this.

This also conveniently serves as an example of how to map a path in your Swagger to a pipe. You may, of course, define and use any pipes you wish using any of the Bagpipes operations or add your own in your fittings directory.
