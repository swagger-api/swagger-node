var sw = require("../../Common/node/swagger.js");
var param = require("../../Common/node/paramTypes.js");
var models = require("./models.js");
var url = require("url");
var swe = sw.errors;

exports.findById = {
  'spec': {
    "description" : "Operations about pets",
    "path" : "/pet.{format}/{petId}",
    "notes" : "Returns a pet for IDs in 0 < ID < 10. ID > 10, negative numbers or nonintegers will simulate API error conditions",
    "summary" : "Find pet by ID",
    "method": "GET",
    "params" : [param.path("petId", "ID of pet that needs to be fetched", "string")],
    "outputModel" : {
      "name" : "pet",
      "responseClass" : models.pet
    },
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet')],
    "nickname" : "getPetById"
  },
  'action': function (req,res) {
    if (!req.params.petId) {
      throw swe.invalid('id'); }
    var id = parseInt(req.params.petId);
    if (!id || (id > 10 || id < 0)) {
      throw swe.invalid('id'); }

    res.send(JSON.stringify(sw.containerByModel(models.pet, {'id': req.params.petId}, req.params.petId)));
  }
};

exports.findByStatus = {
  'spec': {
    "description" : "Operations about pets",  
    "path" : "/pet.{format}/findByStatus",
    "notes" : "Multiple status values can be provided with comma-separated strings",
    "summary" : "Find pets by status",
    "method": "GET",    
    "params" : [param.query("status", "Status (Values: available, pending, sold)", "string", true, true)], 
    "outputModel" : {
      "name" : "List[pet]",
      "responseClass" : models.pet
    },
    "errorResponses" : [swe.invalid('status')],
    "nickname" : "findPetsByStatus"
  },  
  'action': function (req,res) {
    var statusString = url.parse(req.url,true).query["status"];
    if (!statusString) {
      throw swe.invalid('status'); }
    
    var output = new Array();
    for (var i = 0; i < sw.Randomizer.intBetween(1,10); i++) {
      output.push(sw.containerByModel(models.pet, {'status': statusString}, -1));
    }

    res.send(JSON.stringify(output));
  }
};

exports.findByTags = {
  'spec': {
    "path" : "/pet.{format}/findByTags",
    "notes" : "Multiple tags can be provided with comma-separated strings. Use tag1, tag2, tag3 for testing.",
    "summary" : "Find pets by tags",
    "method": "GET",    
    "params" : [param.query("tags", "Tags to filter by", "string", true, true)],
    "outputModel" : {
      "name" : "List[pet]",
      "responseClass" : models.pet
    },
    "errorResponses" : [swe.invalid('tag')],
    "nickname" : "findPetsByTags"
  },
  'action': function (req,res) {
    var tagsString = url.parse(req.url,true).query["tags"];
    if (!tagsString) {
      throw swe.invalid('tag'); }
    
    var output = new Array();
    for (var i = 0; i < sw.Randomizer.intBetween(1,10); i++) {
      output.push(sw.containerByModel(models.pet, {'tags': tagsString.split(',')}, -1));
    }

    res.send(JSON.stringify(output));
  }
};

exports.addPet = {
  'spec': {
    "path" : "/pet.{format}",
    "notes" : "adds a pet to the store",
    "summary" : "Add a new pet to the store",
    "method": "PUT",
    "params" : [param.post("Pet object that needs to be added to the store", "pet")],
    "errorResponses" : [swe.invalid('input')],
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
    "method": "POST",    
    "summary" : "Update an existing pet",
    "params" : [param.post("Pet object that needs to be added to the store", "pet")],
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet'), swe.invalid('input')],
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
    "method": "DELETE",
    "summary" : "Remove an existing pet",
    "params" : [param.path("id", "ID of pet that needs to be removed", "string")],
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet')],
    "nickname" : "deletePet" 
  },  
  'action': function(req, res) {
    res.send(JSON.stringify({
      "message" : "thanks for playing"
    }));
  }
};
