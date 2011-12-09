var express = require('express'),
	path = require('path'),
	Settings = require('settings'),
	settingsDecorator = require('./settingsDecorator.js'),
	Winston = require('winston');

module.exports = function() {
	var arbor = {},
		bundleManager, logger, server;

	arbor.settings = new Settings(path.join(process.cwd(), 'config', 'environment.js')).getEnvironment('test');

	console.log('Loaded settings');

	arbor.logger = new Winston.Logger({
		transports: [new Winston.transports.Console(arbor.settings.logger.console)]
	});

	arbor.logger.verbose('Logger initialized');

	settingsDecorator(arbor);

	arbor.logger.verbose('Loading bundle manager');
	arbor.bundle = require('./bundle/manager.js')(arbor);

	arbor.settings.bundle.directories.forEach(function(bundleRoot) {
		arbor.bundle.loadPath(path.join(process.cwd(), bundleRoot));
	});

	arbor.express = express.createServer(
	express.bodyParser(), express.methodOverride(), express.cookieParser());

	/**
	 * Starts the express server for this application.
	 */
	arbor.start = function() {
		arbor.bundle.finalize(function() {
			arbor.logger.info('Starting HTTP server on port ' + arbor.settings.http.port);
			arbor.express.listen(arbor.settings.http.port);
		});
	};

	return arbor;
}();