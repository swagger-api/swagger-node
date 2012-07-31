/**
 * this is a JSON schema for the UserModel
 */

exports.user = {
	"id": "user",
	"properties" : {
		"id" : {
		  "type" : "long"
		},
		"name" : {
		  "regex": /^[a-z0-9_-]{4,24}$/,
		  "type" : "string"
		},
		"mail" : {
		  "regex": /^([a-zA-Z0-9_\.\-\~\#])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
		  "type" : "string"
		}		
	}
};
