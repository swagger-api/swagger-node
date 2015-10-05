## Release Notes

### swagger-node 0.7.0, swagger-node-runner 0.5.0

#### New features
  
  * Request handing pipeline is now fully configurable
  * Application configuration is now driven by the [config module](https://github.com/lorenwest/node-config/wiki/Configuration-Files) to allow a ton of flexibility in setting up configurations and routes based on environment.
  * Supports plugins such as [volos-swagger-oauth](https://www.npmjs.com/package/volos-swagger-oauth) and [volos-swagger-apply](https://www.npmjs.com/package/volos-swagger-apply) 
  * Custom security handlers can be declared in config in app.js. Example:
  
  ```javascript
  config.swaggerSecurityHandlers = {
    oauth2: function securityHandler1(req, authOrSecDef, scopesOrApiKey, cb) {
      // your security code
      cb();
    }
  };
  ```

#### Bug Fixes

  * json_error_handler should work in all container environments (mapErrorsToJson did not)
  
#### Breaking Changes

  * `mapErrorsToJson` config option is now configured as an onError handler: `onError: json_error_handler` 
  * `docEndpoints` raw config option is now declared in Swagger and handled via a pipe: `swagger_raw`

#### Converting From Previous Version

  1. Update your package.json to use the new middleware versions: "^0.1.0". (eg. `"swagger-express-mw": "^0.1.0"`)
  2. Update your application dependencies: `npm update`.
  3. Existing config should generally work, but you should update your config to the [new format](https://github.com/swagger-api/swagger-node/blob/master/docs/cli.md/configuration.md).
