## About swagger

* [What is Swagger?](#whatisswagger)
* [How does the swagger module use Swagger?](#howdoes)
* [Help me with YAML](#helpwith)
* [Next step](#nextstep)


### <a name="whatisswagger"></a>What is Swagger?

[Swagger™ ](http://swagger.io) is a specification and framework implementation for describing, producing, consuming, and visualizing RESTful web services. 

To read more about Swagger, refer to:

* [The Swagger website](http://swagger.io) 
* [Swagger on GitHub](https://github.com/swagger-api)


### <a name="howdoes"></a>How does the swagger module use Swagger?

The Swagger Editor lets you design your API specification and preview its documentation for your swagger API. The editor is installed with swagger.

A swagger.yaml file is installed into  every new swagger project, and lives in `<project_root>/api/swagger/swagger.yaml`. It conforms to the [Swagger 2.0 specification](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md).  

Behind the scenes, Swagger middleware validates and processes the Swagger configuration file, and routes API operation endpoints to controller files. All **you** need to do is implement your custom API controller logic. 

>Note: The editor is served locally and automatically saves your work *as you edit*. In addition, if the project is running (`swagger project start`), it is automatically restarted each time the editor saves. Just be careful if you kill the editor, that you do not lose unsaved work. 

**Try it:**

1. `swagger project create test-project`
2. `cd test-project`
2. `swagger project edit`

*The Swagger editor*
![alt text](./images/swagger-editor.png)


### <a name="helpwith"></a><a name="yaml"></a>Help me with YAML

YAML is a data serialization/representation standard. If you're new to YAML, check out [www.yaml.org](http://www.yaml.org). Another excellent introduction is the [Wikipedia YAML entry](http://en.wikipedia.org/wiki/YAML).

YAML is intended to be easy for humans to read. Every swagger project includes a Swagger 2.0 compliant configuration file that is written in YAML. 

### <a name="nextstep"></a>Next step

For a more detailed look the Swagger configurations, see "[The Swagger specification file](./swagger-file.md)".
