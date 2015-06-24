

## Anatomy of a path

This topic looks at how paths are constructed and wired to response objects in a Swagger project's Swagger configuration file. 

* [Simple path example](#simple)
* [More about route handling](#more)
* [Request and response models](#models)
* [Next steps](#nextstep)

### <a name="simple"></a>Simple path example

The `/hello` path in the original Quick Start example looks like this:

```yaml
  paths:
    /hello:
      # binds swagger app logic to a route
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
              $ref: #/definitions/HelloWorldResponse
          # responses may fall through to errors
          default:
            description: Error
            schema:
              $ref: #/definitions/ErrorResponse
```

The parts of the path definition include:

* `x-swagger-router-controller` is a custom Swagger extension to the Swagger model that maps a path to a controller file. For instance, `/weather` gets mapped to `api/controller/weather.js`. See [More about route handling]() below. 

* `operationId` maps to a method name in the controller file. 

* `security:` can be used to apply security schemes such as OAuth, Basic authentication, and API keys. 

* `parameters:` specifies any parameters used by the path. They can be passed as query or form parameters, or headers. 

* The other keys conform to the Swagger 2.0 [specifications](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md). The parameters is a YAML array that defines all the parameters required for the call. The responses object defines the response specifications for response codes.

### <a name="more"></a>More about route handling

As noted previously, `the x-swagger-router-controller` maps a path to a controller file. You can specify a router handler either at the path level or operation level in the Swagger file. For example, at the path level, like this:

```yaml
paths:
  /hello:
    x-swagger-router-controller: hello_world
    get:
      description: Returns 'Hello' to the caller
      # used as the method name of the controller
      operationId: hello
```

or at the operation level, like this:

```yaml
paths:
  /hello:
    get:
      x-swagger-router-controller: hello_world
      description: Returns 'Hello' to the caller
      # used as the method name of the controller
      operationId: hello
```

Routers applied at the operation level override routers specified at the path level. 

When you call your API with a given path, like `GET /hello`, the middleware checks to make sure there is an operation (e.g., "get") defined for that path. If not, then a 405 code is returned. If the path does have a corresponding operation defined, then a 200 response is returned. If you are running in mock mode, you'll get back a mock response, otherwise, you'll get back whatever response is returned by the controller. If you hit a path that is not specified in the Swagger file at all, then that's a 404. 

When you call your API, the middleware attempts to match a route defined in the Swagger file to a corresponding controller method. When you test your API, one of three possible results can occur:

* A route defined in the Swagger file matches a controller file, and the controller has a method for the operation. In this case, either the route method is executed or, if you are in mock mode, a mock response is returned.

* A route defined in the Swagger file matches a controller file, but there is no method in the controller for the operation. In this case, a 405 HTTP code is returned. 

* The requested route is not present in the Swagger file. In this case, a 404 code is returned. 

### <a name="models"></a>Request and response models

The Swagger specification allows you to define both request and the response models (also called schemas). The `path` definition described in the previous section is an example of a request model. 

Here's an example of a weather API that returns a relatively complex object.

The Open Weather API returns an object that looks like the following:

  ```json
  {
      "coord": {
          "lon": -77.58,
          "lat": 35.27
      },
      "sys": {
          "type": 1,
          "id": 1786,
          "message": 0.1057,
          "country": "United States of America",
          "sunrise": 1409913972,
          "sunset": 1409959883
      },
      "weather": [
          {
              "id": 500,
              "main": "Rain",
              "description": "light rain",
              "icon": "10n"
          },
          {
              "id": 211,
              "main": "Thunderstorm",
              "description": "thunderstorm",
              "icon": "11n"
          }
      ],
      "base": "cmc stations",
      "main": {
          "temp": 78.58,
          "pressure": 1021,
          "humidity": 88,
          "temp_min": 73.4,
          "temp_max": 82.4
      },
      "wind": {
          "speed": 5.62,
          "deg": 40
      },
      "clouds": {
          "all": 90
      },
      "dt": 1409876198,
      "id": 4474436,
      "name": "Kinston",
      "cod": 200
  }
  ```


To wire the path to the schema, you use the `responses` element to refer to the schema definition. In this example, we specify two responses, a 200 and an Error response. Note that you use `$ref` syntax to refer to each specific schema definition, listed in the `#/definitions` section (which we describe below). 

>Note: You must use explicit references of the form $ref: #/definitions/<DefName>. For example: $ref: #/definitions/WeatherResponse. 

>Note: In this case, all other responses that are not 200 will be referred to the Error response schema.

```yaml    
    paths:
      /weather:
        ...      
        responses:
          "200":
            description: Success
            schema:
              $ref: #/definitions/WeatherResponse
          default:
            description: Error
            schema:
              $ref: #/definitions/ErrorResponse
```

Then in the `#/definitions` section of the Swagger document we define the `WeatherResponse` schemas that we referenced from the `/paths` section. Here is the schema that represents the JSON returned by the weather API (shown previously). These schemas are primarily used to provide response objects for mock mode:

```yaml
definitions:
  WeatherResponse:
    type: "object"
    properties: 
      base: 
        type: "string"
      clouds: 
        type: "object"
        properties: 
          all: 
            type: "number"
      cod: 
        type: "number"
      coord: 
        type: "object"
        properties: 
          lat: 
            type: "number"
          lon: 
            type: "number"
      dt: 
        type: "number"
      id: 
        type: "number"
      main: 
        type: "object"
        properties: 
          humidity: 
            type: "number"
          pressure: 
            type: "number"
          temp_max: 
            type: "number"
          temp_min: 
            type: "number"
          temp: 
            type: "number"
      name: 
        type: "string"
      sys: 
        type: "object"
        properties: 
          country: 
            type: "string"
          id: 
            type: "number"
          message: 
            type: "number"
          sunrise: 
            type: "number"
          sunset: 
            type: "number"
          type: 
            type: "number"
      weather: 
        type: "array"
        items: 
          type: "object"
          properties: 
            description: 
              type: "string"
            icon: 
              type: "string"
            id: 
              type: "number"
            main: 
              type: "string"
      wind: 
        type: "object"
        properties: 
          deg: 
            type: "number"
          speed: 
            type: "number"
```

### <a name="nextstep"></a>Next steps

Now that you know have added a path, its time to [implement the actual controller](./controllers.md) 
