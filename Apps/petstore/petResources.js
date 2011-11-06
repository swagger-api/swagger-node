var swagger = require("../../Common/node/swagger.js");
var petstoreModels = require("./models.js");
var url = require("url");

exports.findByIdSpec = {
  "description" : "Operations about pets",
  "path" : "/pet.{format}/{petId}",
  "notes" : "Returns a pet when ID < 10. ID > 10 or nonintegers will simulate API error conditions",
  "summary" : "Find pet by ID",
  "params" : new Array(
    swagger.pathParam("petId", "ID of pet that needs to be fetched", "string")),
  "outputModel" : {
    "name" : "pet",
    "responseClass" : petstoreModels.pet
  },
  "errorResponses" : new Array(
    swagger.error(400, "invalid id"),
    swagger.error(404, "Pet not found")),
  "nickname" : "getPetById"
}

exports.findById = function (req,res) {
  console.log("find by id");
  if(!req.params.petId){
    throw swagger.error(400,"invalid id");
  }
  var id = parseInt(req.params.petId);
  if(!id){
    throw swagger.error(400,"invalid id");
  }
  if(id >10)
    throw swagger.error(400,"id too big");
  res.send(JSON.stringify({
    "message" : "got pet " + req.params.petId
  }));
}

exports.findByStatusSpec = {
  "path" : "/pet.{format}/findByStatus",
  "notes" : "Multiple status values can be provided with comma-separated strings",
  "summary" : "Find pets by status",
  "params" : new Array(
    swagger.queryParam("status", "Status values that need to be considered for filter", "string", true, true, "available,pending,sold", "available")),
  "outputModel" : {
    "name" : "List[pet]",
    "responseClass" : petstoreModels.pet
  },
  "errorResponses" : new Array(
    swagger.error(400, "invalid id"),
    swagger.error(404, "Pet not found")),
  "nickname" : "findPetsByStatus"
}

exports.findByStatus = function (req,res) {
  var statusString = url.parse(req.url,true).query["status"];
  if(!statusString) throw swagger.error(400, "invalid status supplied");
  
  var output = new Array();
  var array = statusString.split(",");
  var id = 1;
  array.forEach(function(item){
    id += 1;
    output.push({
      "id":id + 1,
      "status":item,
      "category":"furry"
    })
  });
  res.send(JSON.stringify(output));
}

exports.findByTagsSpec = {
  "path" : "/pet.{format}/findByTags",
  "notes" : "Multiple tags can be provided with comma-separated strings. Use tag1, tag2, tag3 for testing.",
  "summary" : "Find pets by tags",
  "params" : new Array(
    swagger.queryParam("tags", "Tags to filter by", "string", true, true)),
  "outputModel" : {
    "name" : "List[pet]",
    "responseClass" : petstoreModels.pet
  },
  "errorResponses" : new Array(
    swagger.error(400, "Invalid tag value"),
    swagger.error(404, "Pet not found")),
  "nickname" : "findPetsByTags"
}

exports.findByTags = function (req,res) {
  var tagsString = url.parse(req.url,true).query["tags"];
  if(!tagsString) throw swagger.error(400, "invalid tags supplied");
  
  var output = new Array();
  var array = tagsString.split(",");
  var id = 1;
  array.forEach(function(item){
    id += 1;
    output.push({
      "id":id + 1,
      "status":"available",
      "category":"furry",
      "tags":new Array(item)
    })
  });
  res.send(JSON.stringify(output));
}

exports.addPetSpec = {
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
}

exports.updatePetSpec = {
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
}

exports.deletePetSpec = {
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
}
