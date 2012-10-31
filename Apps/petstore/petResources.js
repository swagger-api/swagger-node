var sw = require("../../Common/node/swagger.js");
var param = require("../../Common/node/paramTypes.js");
var url = require("url");
var swe = sw.errors;

var petData = require("./petData.js");

function writeResponse (res, data) {
	sw.setHeaders(res);
  res.send(JSON.stringify(data));
}

exports.models = require("./models.js");

exports.findById = {
  'spec': {
    "description" : "Operations about pets",
    "path" : "/pet.{format}/{petId}",
    "notes" : "Returns a pet based on ID",
    "summary" : "Find pet by ID",
    "method": "GET",
    "params" : [param.path("petId", "ID of pet that needs to be fetched", "string")],
    "responseClass" : "Pet",
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet')],
    "nickname" : "getPetById"
  },
  'action': function (req,res) {
    if (!req.params.petId) {
      throw swe.invalid('id'); }
    var id = parseInt(req.params.petId);
    var pet = petData.getPetById(id);

    if(pet) res.send(JSON.stringify(pet));
    else throw swe.notFound('pet');
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
    "responseClass" : "List[Pet]",
    "errorResponses" : [swe.invalid('status')],
    "nickname" : "findPetsByStatus"
  },  
  'action': function (req,res) {
    var statusString = url.parse(req.url,true).query["status"];
    if (!statusString) {
      throw swe.invalid('status'); }

    var output = petData.findPetByStatus(statusString);
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
    "responseClass" : "List[Pet]",
    "errorResponses" : [swe.invalid('tag')],
    "nickname" : "findPetsByTags"
  },
  'action': function (req,res) {
    var tagsString = url.parse(req.url,true).query["tags"];
    if (!tagsString) {
      throw swe.invalid('tag'); }
    var output = petData.findPetByTags(tagsString);
    writeResponse(res, output);
  }
};

exports.addPet = {
  'spec': {
    "path" : "/pet.{format}",
    "notes" : "adds a pet to the store",
    "summary" : "Add a new pet to the store",
    "method": "POST",
    "params" : [param.post("Pet object that needs to be added to the store", "Pet")],
    "errorResponses" : [swe.invalid('input')],
    "nickname" : "addPet"
  },  
  'action': function(req, res) {
    var body = req.body;
    if(!body || !body.id){
      throw swe.invalid('pet');
    }
    else{
	    petData.addPet(body);
	    res.send(200);
	  }  
  }
};

exports.updatePet = {
  'spec': {
    "path" : "/pet.{format}",
    "notes" : "updates a pet in the store",
    "method": "POST",    
    "summary" : "Update an existing pet",
    "params" : [param.post("Pet object that needs to be added to the store", "Pet")],
    "errorResponses" : [swe.invalid('id'), swe.notFound('pet'), swe.invalid('input')],
    "nickname" : "addPet"
  },  
  'action': function(req, res) {
    var body = req.body;
    if(!body || !body.id){
      throw swe.invalid('pet');
    }
    else {
	    petData.addPet(body);
	    res.send(200);
	  }
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
    var id = parseInt(req.params.id);
    petData.deletePet(id)
    res.send(200);
  }
};
