
## About controllers

* [Implementing a controller](#implementing)
* [Weather API example](#weather)

### <a name="implementing"></a>Implementing an controller

This topic explains how to implement a controller. The `x-swagger-router-controller` Swagger extension element is used to specify the name of a controller file. The quick start example defines a `hello_world` controller file, which is by default in `api/controllers/hello_world.js`. 

```yaml
paths:
    /hello:
      # binds swagger-node app logic to a route
      x-swagger-router-controller: hello_world
```

By default, controller method names map to the HTTP operation names, like get() or post(). But you can specify any name you wish with the `operationId` element. In the following example, a GET request results in calling the hello() method in the controller. 

```yaml
    get:
      description: Returns 'Hello' to the caller
      # used as the method name of the controller
      operationId: hello
```

Here is the `hello_world.js` implementation for the quick start example. It retrieves the query parameter value and returns a response. 

```javascript
    var util = require('util');

    module.exports = {
      hello: hello
    };

    function hello(req, res) {
      var name = req.swagger.params.name.value;
      var hello = name ? util.format('Hello, %s', name) : 'Hello, stranger!';
      res.json(hello);
    }
```

### <a name="weather"></a>Weather API example

Let's look at an example controller for a simple weather API.

The Weather API requires a controller function that takes in request and response objects, queries the Open Weather Map API using the `city` query parameter and returns the current weather conditions. 

Note that Open Weather returns a JSON object. Also, we'll need to export the controller function so that it is available to the outside world. 

We will use the `request` library to make the request. So, add it to `package.json`:

  ```javascript
    "dependencies": {
      "request": ""
    },
  ```

>Note: If a controller requires additional Node.js modules, be sure to add them to your package.json file and execute `npm install`. 

In the Swagger file, you can see that when a GET is performed on `/weather`, the target controller file is `api/controllers/weather.js`, and the target method to call is getWeatherByCity():

```yaml
    paths:
      /weather:
        x-swagger-router-controller: weather
        get:
          description: "Returns current weather in the specified city to the caller"
          operationId: getWeatherByCity
          parameters:
            - name: city
              in: query
              description: "The city you want weather for in the form city,state,country"
              required: true
              type: "string"
```

Here is the controller implementation for the  `getWeatherByCity` function:

```javascript
      'use strict';
      
      var util = require('util');
      var request = require('request');
      
      module.exports = {
        getWeatherByCity: getWeatherByCity
      }
      
      function getWeatherByCity(req, res) {
        var city = req.swagger.params.city.value;
        var url = "http://api.openweathermap.org/data/2.5/weather?q="+city+"&units=imperial";
        console.log('Executing request: '+url);
        request.get(url).pipe(res);
      };
```


Here is how you call the Weather API, which returns data for a specified city. 
  
  ```bash
    curl http://localhost:10010/weather\?city\=San%20Jose,CA
  ```

