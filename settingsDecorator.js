/**
 * Decorates arbor.setting with helper methods that allow bundles to impose 
 * constraints on configuration during startup.
 */
var util = require('util');

module.exports = function(arbor) {

	function exists(path) {
		var parts = settingString.split('.'),
			parentObject = arbor.settings;

		for (var i = 0; i < parts.length; i++) {
			var nextPart = parts[i];

			if (!parentObject.hasOwnProperty(nextPart)) {
				return false;
			}
			parentObject = parentObject[nextPart];
		}

		return true;
	}

	arbor.settings.defaultValue = function(settingString, defaultValue) {
		var parts = settingString.split('.'),
			parentObject = arbor.settings;

		for (var i = 0; i < parts.length; i++) {
			var nextPart = parts[i];

			if (!parentObject.hasOwnProperty(nextPart)) {
				if (i === parts.length - 1) {
					parentObject[nextPart] = defaultValue;
				}
				else {
					parentObject[nextPart] = {};
				}
			}
			parentObject = parentObject[nextPart];
		}
	};

	arbor.settings.require = function(settingString) {
		var parts = settingString.split('.'),
			parentObject = arbor.settings,
			objectPath = '';

		for (var i = 0; i < parts.length; i++) {
			var nextPart = parts[i];

			if (i > 0) {
				objectPath += '.';
			}
			objectPath += nextPart;

			if (!parentObject.hasOwnProperty(nextPart)) {
				var errorMessage = util.format('Required setting "%s" not present in configuration', objectPath);
				if (arbor.logger) {
					arbor.logger.error(errorMessage);
				}
				else {
					console.error(errorMessage);
				}
				process.exit(1);
			}

			parentObject = parentObject[nextPart];
		}
		return true;
	};
};