/**
 * this is a JSON schema for the PetModel
 */
exports.pet = {
  "properties" : {
    "id" : {
      "type" : "long"
    },
    "status" : {
      "type" : "string",
      "description" : "pet status in the store",
      "enum" : [ "available", "pending", "sold" ]
    },
    "name" : {
      "type" : "string"
    },
    "tags" : {
      "type" : "array",
      "items" : {
        "type" : "tag"
      }
    },    
    "photoUrls" : {
      "type" : "array",
      "items" : {
        "type" : "string"
      }
    }
  },
  "id" : "pet"
};

