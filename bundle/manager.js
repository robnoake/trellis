var fs = require('fs'),
	path = require('path');

module.exports = function(trellis) {
	var self = {},
		bundles = {},
		loadOrder, 
		dependencyGraph = require('./dependencyGraph.js');

	self.load = function (bundlePath) {
		bundlePath = path.normalize(bundlePath);
		var bundleFile = path.join(bundlePath, 'bundle.js');

		if (path.existsSync(bundleFile)) {
			trellis.logger.debug('Loading bundle at: ' + bundlePath);
			var bundle = require(bundleFile)(trellis);

			if (bundles.hasOwnProperty(bundle.name)) {
				throw new Error('A bundle called ' + bundle.name + ' already exists, attempting to load another at ' + bundlePath);
			}

			bundle.path = bundlePath;
			bundles[bundle.name] = bundle;
			trellis.logger.debug('Loaded bundle: ' + bundle.name);

			dependencyGraph.addBundle(bundle.name, bundle.requiredBundles);
		}
		else {
			if (!path.existsSync(bundlePath)) {
				throw new Error('Bundle path does not exist: ' + bundlePath);
			}
			throw new Error('Missing bundle.js in path: ' + bundlePath);
		}
	};

	self.loadPath = function (bundleRootPath) {
		bundleRootPath = path.normalize(bundleRootPath);
		trellis.logger.debug('Adding all bundles in directory: ' + bundleRootPath);
		fs.readdirSync(bundleRootPath).forEach(function(fileName) {
			if (fs.statSync(path.join(bundleRootPath, fileName)).isDirectory()) {
				if (path.existsSync(path.join(bundleRootPath, fileName, 'bundle.js'))) {
					self.load(bundleRootPath + '/' + fileName);
				}
			}
		});
	};
	
	self.injectDependency = function (bundle, dependency) {
		dependencyGraph.addBundle(bundle, [dependency]);
	};

	self.finalize = function (onFinish) {
		trellis.logger.debug('Calculating bundle initialization order');
		loadOrder = dependencyGraph.getLoadOrder();

		self.initNextBundle(onFinish);
	};

	self.initNextBundle = function (onFinish) {
		if (loadOrder.length > 0) {
			var nextBundle = loadOrder.shift();
			if (!bundles.hasOwnProperty(nextBundle)) {
				throw new Error('Unmet bundle dependency: ' + nextBundle);
			}

			trellis.logger.debug('Initializing bundle: ' + nextBundle);

			bundles[nextBundle].initialize(function() {
				self.initNextBundle(onFinish);
			});
		}
		else {
			trellis.logger.debug('Done loading bundles');
			onFinish();
		}
	};

	/**
	 * Retrieves a loaded bundle
	 * @param string bundleName Name of the bundle to be retrieved
	 */
	self.get = function (bundleName) {
		if (bundles.hasOwnProperty(bundleName)) {
			return bundles[bundleName];
		}
		else {
			throw Error('Requested unknown bundle ' + bundleName);
		}
	};

	return self;
};