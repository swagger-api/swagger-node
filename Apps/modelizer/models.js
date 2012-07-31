/**
 * this is a JSON schema for the Modelizer
 */

exports.random = {
	"id": "random",
	"properties":{
    "ID":{
      "type":"string"
    },
    "string":{
      "type":"string"
    },
    "Date":{
      "type":"Date"
    },
    "boolean":{
      "type":"boolean"
    },
    "double":{
      "type":"double"
    },
    "int":{
      "type":"int"
    },    
    "visits" : {
      "type" : "array",
      "items" : {
        "type" : "date"
      }
    },    
    "scores" : {
      "type" : "array",
      "items" : {
        "type" : "int"
      }
    },
    "photos" : {
      "type" : "array",
      "items" : {
        "type" : "string"
      }
    }
  }
};