/**
 * this is a JSON schema for the PetModel
 */
exports.petModel = {
	"properties" : {
		"tags" : {
			"type" : "array",
			"items" : {
				"$ref" : "tag"
			}
		},
		"id" : {
			"type" : "long"
		},
		"category" : {
			"type" : "category"
		},
		"status" : {
			"type" : "string",
			"description" : "pet status in the store",
			"enum" : [ "available", "pending", "sold" ]
		},
		"name" : {
			"type" : "string"
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

