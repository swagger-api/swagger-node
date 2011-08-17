function error(code, description) {
	return {
		"description" : description,
		"code" : code
	};
}

exports.error = error