'use strict';
var assert = require('assert');

describe('swagger', function () {
	it('should be a module', function () {
		require('../');
	});

	describe('addModels', function () {
		it('should accept a hash and add all the top level members', function () {
			var instance = require('../');

			// Add some models.
			instance.addModels({
				'One': {
					id: 'One',
					description: 'The first model.'
				},
				'Two': {
					id: 'Two',
					description: 'The second model.'
				}
			});

			// And add some more to test merging with the above.
			instance.addModels({
				'Three': {
					id: 'Three',
					description: 'The third model.'
				}
			});

			// Note, there is no good API to test this worked so we have to check the innards of the class itself.
			assert.equal(instance.allModels['One'].id, 'One');
			assert.equal(instance.allModels['Two'].id, 'Two');
			assert.equal(instance.allModels['Three'].id, 'Three');
		});
	});
});
