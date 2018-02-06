## Running in mock mode

Mock mode lets you "mock up" API routes/paths and response objects in the Swagger editor and test them without writing any controller code. By default, mock mode responses are system-generated; however, you can optionally implement custom mock controllers to return custom responses.

* [When to use mock mode](#whentouse)
* [Starting a project in mock mode](#starting)
* [Quick example: mock mode in action](#quickexample)
* [Building and testing an API in mock mode](#buildtest)
* [Implementing mock controllers](#mockcontrollers)
* [Wiring up and implementing the API controller](#wireup)

### <a name="whentouse"></a>When to use mock mode

Mock mode is useful when you are designing your API model in the Swagger editor, but you're not ready to implement the API's handler/controllers. For example, you might use mock mode when you're trying to decide which API routes you need and what kind of data each API operation should return. Basically, mock mode let's you perfect your API design without writing any Node.js code. 

When you're happy with the overall API design, then you can implement your controller methods. 

### <a name="starting"></a>Starting a project in mock mode

To start an swagger project in mock mode, use the `-m` flag:

`swagger project start -m`


### <a name="quickexample"></a>Quick example: mock mode in action

Here's a simple example where the API definition only has one path (`/weather`) and a response object called WeatherResponse. In this case, the WeatherResponse object returns a simple message of type string. Here's the Swagger YAML:


```yaml 
swagger: '2.0'
info:
  version: "0.0.1"
  title: Mock mode test
host: localhost
basePath: /
schemes:
  - http
consumes:
  - application/json
produces:
  - application/json
paths:
  /weather:
    get:
      responses:
        "200":
          description: Success
          schema:
            $ref: "#/definitions/WeatherResponse"
definitions:
  WeatherResponse:
    required:
      - message
    properties:
      message:
        type: string
```


To test this API configuration in mock mode, start your swagger project with the mock mode "-m" flag:

`swagger project start -m`

When you call the API, like this:

`curl -i http://localhost:10010/weather` 

Mock mode returns this system-generated response:


```json
    {
    "message": "Sample text"
    }
```

If you change the response object to return an integer...

```yaml
        WeatherResponse:
            required:
                - message
            properties:
                message:
                type: integer
```

The mock response is an integer:

```json
    {
    "message": 1
    }
```


### <a name="buildtest"></a>Building and testing your API model in mock mode

An actual weather API isn't only going to return a string; it's going to return a more complex response object consisting of objects, strings, and numbers. As you build your API, you can model and test the intended behavior  entirely in mock mode. 

For example, here's a WeatherResponse object for a weather API. It's got strings, numbers, arrays, and objects representing various aspects of weather data. 

```yaml
       WeatherResponse:
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


If you call this API in mock mode, it returns the following JSON. Objects, arrays, strings, and numbers are all "mocked up" with mock values of the appropriate data type: 

```yaml
    {
        "base": "Sample text",
        "clouds": {
            "all": 1
        },
        "cod": 1,
        "coord": {
            "lat": 1,
            "lon": 1
        },
        "dt": 1,
        "id": 1,
        "main": {
            "humidity": 1,
            "pressure": 1,
            "temp": 1,
            "temp_max": 1,
            "temp_min": 1
        },
        "name": "Sample text",
        "sys": {
            "country": "Sample text",
            "id": 1,
            "message": 1,
            "sunrise": 1,
            "sunset": 1,
            "type": 1
        },
        "weather": [
            {
                "description": "Sample text",
                "icon": "Sample text",
                "id": 1,
                "main": "Sample text"
            }
        ],
        "wind": {
            "deg": 1,
            "speed": 1
        }
    }
```


### <a name="mockcontrollers"></a>Implementing mock mode controllers

By default, mock mode returns programmed responses, like "Sample text" for a string, a number for an integer, and so on. 

But you can also create mock controllers with handler methods that return custom responses. 

Place these custom "mock" controllers in the `/api/mocks` directory. 

Here's an example that returns some data whenever the `search()` handler method is called:


```javascript
    'use strict';

    module.exports = {
      search: search
    };

    function search(req, res, next) {

      res.json([{ user: 'mock', created: new Date(), text: 'this'}]);
    }
```

### <a name="wireup"></a>Wiring up and implementing the API controller

After you're happy with your API design, you're ready to implement wire up the controller for the `/weather` path. 

You simply specify in the OpenAPI spec the route handler (`x-swagger-router-controller`) file, which method to call in the controller (`operationId`), and any query parameters you wish to pass: 

In weather sample's `swagger.yaml` file, it looks like this:

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

Finally, implement the route's operation -- the `getWeatherByCity()` method in  `api/controllers/weather.js` --  which calls the back-end service and returns the response. 

Here is the sample controller implementation for a weather API:

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

In the case of this sample weather API, the controller calls the back-end service (the [OpenWeatherMap](http://openweathermap.org/) API). When you call the API like this:

`curl http://localhost:10010/weather?city=Boulder,CO`

The same response object that you previously modeled and tested in mock mode is filled in with the correct values:


```json
    {
        "base": "cmc stations",
        "clouds": {
            "all": 40
        },
        "cod": 200,
        "coord": {
            "lat": 40.02,
            "lon": -105.28
        },
        "dt": 1411077635,
        "id": 5574991,
        "main": {
            "humidity": 27,
            "pressure": 1016,
            "temp": 87.62,
            "temp_max": 91.99,
            "temp_min": 80.01
        },
        "name": "",
        "sys": {
            "country": "United States of America",
            "id": 538,
            "message": 0.0175,
            "sunrise": 1411044334,
            "sunset": 1411088663,
            "type": 1
        },
        "weather": [
            {
                "description": "scattered clouds",
                "icon": "03d",
                "id": 802,
                "main": "Clouds"
            }
        ],
        "wind": {
            "deg": 160,
            "speed": 7.78
        }
    }
```



