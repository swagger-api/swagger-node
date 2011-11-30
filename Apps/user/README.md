# Example app for handling User Management

Example app for handling common actions needed for an user management API.

## Required Node Modules

    mongodb
    express
    connect
    url
    password-hash
    swagger ;)
    nodeunit (for running tests)

## Configuration

Connection for MongoDB can be defined in `main.js` lines 7 to 9, if you are not running your swagger server somewhere else than localhost please make the needed changes in `tests/user.js` lines 3 to 5.

## Running Example App

    node /path/to/Apps/user/main.js
    
All calls are secured with the `special-key` api_key, provide it when using swagger-ui or other clients…
    
## Running UnitTests

    nodeunit /path/to/Apps/user/tests/