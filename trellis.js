var path = require('path'),
	Settings = require('settings'),
	settingsDecorator = require('./settingsDecorator.js'),
	Winston = require('winston');

module.exports = function() {
	var trellis = {},
		bundleManager, logger, server;

	trellis.settings = new Settings(path.join(process.cwd(), 'config', 'environment.js')).getEnvironment('test');

	console.log('Loaded settings');

	trellis.logger = new Winston.Logger({
		transports: [new Winston.transports.Console(trellis.settings.logger.console)]
	});
	
	trellis.logger.setLevels(Winston.config.syslog.levels);

	trellis.logger.debug('Logger initialized');

	settingsDecorator(trellis);

	trellis.logger.debug('Loading bundle manager');
	trellis.bundle = require('./bundle/manager.js')(trellis);
	trellis.get = trellis.bundle.get;

	trellis.settings.bundle.directories.forEach(function(bundleRoot) {
		trellis.bundle.loadPath(path.join(process.cwd(), bundleRoot));
	});

	return trellis;
}();