## swagger modules and dependencies

This topic briefly describes the relevant Node.js modules on which a swagger project depends. 

* [swagger](#swagger)
* [skeleton](#skeleton)
* [swagger-editor](#swagger-editor)
* [swagger-tools](#swagger-tools)

###<a ref='swagger'></a>swagger

The `swagger` npm module provides everything you need to create new  projects, including the Swagger editor, Swagger Tools middleware, sample project skeletons, and the `swagger` command-line tools. 

####Installation
For installation instructions, see "[Installation](./install.md)". 

####Documentation

The main source of documentation for the swagger module and related components is in the swagger-node repository on GitHub. 

####Installation

The swagger command-line tools are installed with swagger. 

#### Documentation

[swagger command-line reference](./cli.md)


### <a ref='skeleton'></a>skeleton

A basic, "hello world" swagger project. This project automatically cloned when you create a new swagger project by executing `swagger project create`. Skeleton projects are implemented for specific API frameworks, such as express, restify, or others. 

#### Documentation

See the swagger "[Quick start](./quick-start.md)" to see how easy it is to get a new swagger API project up and running. 

### <a ref='swagger-editor'></a>swagger-editor

The Swagger Editor lets you design your API specification and interactively preview its documentation for your swagger API project. 

####Installation

Standard npm install. Installed with swagger.

####Documentation

See "[Swagger Editor](https://github.com/swagger-api/swagger-editor)" on GitHub.

### <a ref='swagger-tools'></a>swagger-tools

Middleware for Node.js including Message Validation, Authorization and Routing. 

####Installation

Standard npm install. Installed with swagger. 

####Documentation

See the `swagger-tools` [README](https://github.com/apigee-127/swagger-tools) on GitHub. 


#### Swagger Tools middleware components

Swagger tools provides these middleware components. They provide services for message validation, authorization, and routing. 

* swagger-metadata
* swagger-router
* swagger-validator
