var swagger = require("../../Common/node/swagger.js");
var param = require("../../Common/node/paramTypes.js");
var models = require("./models.js");
var url = require("url");

exports.findById = {
  'spec': {
    "description" : "Operations about pets",
    "path" : "/pet.{format}/{petId}",
    "notes" : "Returns a pet for IDs in 0 < ID < 10. ID > 10, negative numbers or nonintegers will simulate API error conditions",
    "summary" : "Find pet by ID",
    "method": "GET",
    "params" : new Array(
      param.path("petId", "ID of pet that needs to be fetched", "string")),
    "outputModel" : {
      "name" : "pet",
      "responseClass" : models.pet
    },
    "errorResponses" : new Array(
      swagger.error(400, "invalid id"),
      swagger.error(404, "Pet not found")),
    "nickname" : "getPetById"
  },
  'action': function (req,res) {
    console.log("find by id");
    if (!req.params.petId) {
      throw swagger.error(400,"invalid id"); }
    var id = parseInt(req.params.petId);
    if (!id) {
      throw swagger.error(400,"invalid id"); }
    if (id > 10 || id < 0) { // custom error 
      throw swagger.error(400,"id out of scope"); }

    res.send(JSON.stringify(swagger.containerByModel(models.pet, {'id': req.params.petId}, req.params.petId)));
  }
};

exports.findByTags = {
  'spec': {
    "path" : "/pet.{format}/findByTags",
    "notes" : "Multiple tags can be provided with comma-separated strings. Use tag1, tag2, tag3 for testing.",
    "summary" : "Find pets by tags",
    "params" : new Array(
      swagger.queryParam("tags", "Tags to filter by", "string", true, true)),
    "outputModel" : {
      "name" : "List[pet]",
      "responseClass" : models.pet
    },
    "errorResponses" : new Array(
      swagger.error(400, "Invalid tag value"),
      swagger.error(404, "Pet not found")),
    "nickname" : "findPetsByTags"
  },
  'action': function (req,res) {
    var tagsString = url.parse(req.url,true).query["tags"];
    if (!tagsString) {
      throw swagger.error(400, "invalid tags supplied"); }
    
    var output = new Array();
    for (var i = 0; i < swagger.Randomizer.intBetween(1,10); i++) {
      output.push(swagger.containerByModel(models.pet, {'tags': tagsString.split(',')}, -1));
    }

    res.send(JSON.stringify(output));
  }
};

exports.addPet = {
  'spec': {
    "path" : "/pet.{format}",
    "notes" : "adds a pet to the store",
    "summary" : "Add a new pet to the store",
    "params" : new Array(
      swagger.postParam("Pet object that needs to be added to the store", "pet")
    ),
    "errorResponses" : new Array(
      swagger.error(405, "invalid input")
    ),
    "nickname" : "addPet"
  },  
  'action': function(req, res) {
    res.send(JSON.stringify({
      "message" : "thanks for playing"
    }));
  }
};

exports.updatePet = {
  'spec': {
    "path" : "/pet.{format}",
    "notes" : "updates a pet in the store",
    "summary" : "Update an existing pet",
    "params" : new Array(
      swagger.postParam("Pet object that needs to be added to the store", "pet")
    ),
    "errorResponses" : new Array(
      swagger.error(400, "invalid ID supplied"),
      swagger.error(404, "Pet not found"),
      swagger.error(405, "validation exception")
    ),
    "nickname" : "addPet"  
  },  
  'action': function(req, res) {
    res.send(JSON.stringify({
      "message" : "thanks for playing"
    }));
  }
};

exports.deletePet = {
  'spec': {
    "path" : "/pet.{format}/{id}",
    "notes" : "removes a pet from the store",
    "summary" : "Remove an existing pet",
    "params" : new Array(
      swagger.pathParam("id", "ID of pet that needs to be removed", "string")
    ),
    "errorResponses" : new Array(
      swagger.error(400, "invalid ID supplied"),
      swagger.error(404, "Pet not found")
    ),
    "nickname" : "deletePet" 
  },  
  'action': function(req, res) {
    res.send(JSON.stringify({
      "message" : "thanks for playing"
    }));
  }
};
