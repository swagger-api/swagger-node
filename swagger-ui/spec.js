var spec = 
{
  "swagger": "2.0",
  "info": {
    "description": "This is a sample server Petstore server.  You can find out more about Swagger at <a href=\"http://swagger.wordnik.com\">http://swagger.wordnik.com</a> or on irc.freenode.net, #swagger.  For this sample, you can use the api key \"special-key\" to test the authorization filters",
    "version": "1.0.0",
    "title": "Swagger Petstore",
    "termsOfService": "http://helloreverb.com/terms/",
    "contact": {
      "name": "apiteam@wordnik.com"
    },
    "license": {
      "name": "Apache 2.0",
      "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
    }
  },
  "host": "petstore.swagger.wordnik.com",
  "basePath": "/v2",
  "schemes": [
    "http"
  ],
  "paths": {
    "/pet/{petId}": {
      "get": {
        "tags": [
          "pet"
        ],
        "summary": "Find pet by ID",
        "description": "Returns a pet when ID < 10.  ID > 10 or nonintegers will simulate API error conditions",
        "operationId": "getPetById",
        "produces": [
          "application/json",
          "application/xml"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "petId",
            "description": "ID of pet that needs to be fetched",
            "required": true,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responses": {
          "404": {
            "description": "Pet not found"
          },
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Pet"
            }
          },
          "400": {
            "description": "Invalid ID supplied"
          }
        },
        "security": [
          {
            "api_key": []
          },
          {
            "petstore_oauth2": ["email"]
          }
        ]
      }
    }
  },
  "securityDefinitions": {
    "api_key": {
      "type": "apiKey",
      "name": "api_key",
      "in": "header"
    },
    "petstore_oauth2": {
      "type": "oauth2",
      "flow": "implicit",
      "tokenUrl": "http://petstore.swagger.wordnik.com/api/oauth/dialog",
      "scopes": {
        "email": "the email"
      }
    }
  },
  "definitions": {
    "User": {
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64",
          "xml": {
            "name": "id"
          }
        },
        "username": {
          "type": "string",
          "xml": {
            "name": "username"
          }
        },
        "firstName": {
          "type": "string",
          "xml": {
            "name": "firstName"
          }
        },
        "lastName": {
          "type": "string",
          "xml": {
            "name": "lastName"
          }
        },
        "email": {
          "type": "string",
          "xml": {
            "name": "email"
          }
        },
        "password": {
          "type": "string",
          "xml": {
            "name": "password"
          }
        },
        "phone": {
          "type": "string",
          "xml": {
            "name": "phone"
          }
        },
        "userStatus": {
          "type": "integer",
          "format": "int32",
          "xml": {
            "name": "userStatus"
          },
          "description": "User Status"
        }
      },
      "xml": {
        "name": "User"
      }
    },
    "Category": {
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64",
          "xml": {
            "name": "id"
          }
        },
        "name": {
          "type": "string",
          "xml": {
            "name": "name"
          }
        }
      },
      "xml": {
        "name": "Category"
      }
    },
    "Pet": {
      "required": [
        "name",
        "photoUrls"
      ],
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64",
          "xml": {
            "name": "id"
          }
        },
        "category": {
          "xml": {
            "name": "category"
          },
          "$ref": "Category"
        },
        "name": {
          "type": "string",
          "example": "doggie",
          "xml": {
            "name": "name"
          }
        },
        "photoUrls": {
          "type": "array",
          "xml": {
            "name": "photoUrl",
            "wrapped": true
          },
          "items": {
            "type": "string"
          }
        },
        "tags": {
          "type": "array",
          "xml": {
            "name": "tag",
            "wrapped": true
          },
          "items": {
            "$ref": "Tag"
          }
        },
        "status": {
          "type": "string",
          "xml": {
            "name": "status"
          },
          "description": "pet status in the store"
        }
      },
      "xml": {
        "name": "Pet"
      }
    },
    "Tag": {
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64",
          "xml": {
            "name": "id"
          }
        },
        "name": {
          "type": "string",
          "xml": {
            "name": "name"
          }
        }
      },
      "xml": {
        "name": "Tag"
      }
    },
    "Order": {
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64",
          "xml": {
            "name": "id"
          }
        },
        "petId": {
          "type": "integer",
          "format": "int64",
          "xml": {
            "name": "petId"
          }
        },
        "quantity": {
          "type": "integer",
          "format": "int32",
          "xml": {
            "name": "quantity"
          }
        },
        "shipDate": {
          "type": "string",
          "format": "date-time",
          "xml": {
            "name": "shipDate"
          }
        },
        "status": {
          "type": "string",
          "xml": {
            "name": "status"
          },
          "description": "Order Status"
        },
        "complete": {
          "type": "boolean"
        }
      },
      "xml": {
        "name": "Order"
      }
    }
  }
}