[![Build Status](https://travis-ci.org/swagger-api/swagger-node.svg?branch=master)](https://travis-ci.org/swagger-api/swagger-node)

The `swagger` module provides tools for designing and building Swagger-compliant APIs entirely in Node.js. It integrates with popular Node.js servers, including Express, hapi, restify, and Sails, as well as any Connect-based middleware. With `swagger`, you can specify, build, and test your API from the very beginning, on your laptop. It allows you to change and iterate your design without rewriting the logic of your implementation.

![alt text](./docs/images/overview2.png)


One great thing about this approach is that all of the Swagger validation logic is handled for you, and all of the routing logic is managed through the Swagger configuration. You don't have to code any of that stuff yourself.  

# Your swagger API in five steps

## 1. Install the swagger module

Install using npm. For complete instructions, see the [install](./docs/install.md) page. 

![alt text](./docs/images/swagger-install.png)

## 2. Create a new swagger project

Use the [CLI](./docs/cli.md) to create and manage projects. Learn more on the [quick start](./docs/quick-start.md) page. 

![alt text](./docs/images/project-create.png)

## 3. Design your API in the Swagger Editor

The interactive, browser-based [Swagger Editor](http://editor.swagger.io/) is built in. It provides Swagger 2.0 validation and endpoint routing, generates docs on the fly, and consumes easy-to-read YAML. 

![alt text](./docs/images/project-start-editor.png)

![alt text](./docs/images/project-editor.png)

## 4. Write controller code in Node.js

Code your API's business logic in Node.js. 

![alt text](./docs/images/project-controller.png)

If you look at the Swagger file in the editor (shown in step 3 above), the `x-swagger-router-controller` element (line 17 in the editor screenshot) specifies the name of the controller file associated with the `/hello` path. For example:

```yaml
    paths:
        /hello:
            x-swagger-router-controller: hello_world
```

Controller source code is always placed in `./api/controllers`. So, the controller source file for this project is `./api/controllers/hello_world.js`. 

The `operationId` element specifies which controller function to call. In this case (line 19), it is a function called `hello`. Learn [more](./docs/controller.md).

## 5. Run the server

Run the project server.

![alt text](./docs/images/project-start.png)

## Now, call the API!

It just works!

![alt text](./docs/images/project-call.png)

![alt text](./docs/images/project-hello.png)

# <a name="installation"></a>Installing the swagger module

See the [Installing swagger](https://github.com/apigee-127/swagger-node/blob/master/docs/install.md) for details. 

# <a name="using"></a>Using the swagger module

Go to the [swagger module doc page](https://github.com/apigee-127/swagger-node/blob/master/docs/README.md). It includes all the information you need to get started. 

# <a name="about"></a>About this project

This initiative grew out of Apigee-127, an API design-first development framework using Swagger. 
Apigee donated the code to create the swagger-node project in 2015.

 >Copyright 2015 Apigee Corporation

 >Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 >http://www.apache.org/licenses/LICENSE-2.0

 >Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
