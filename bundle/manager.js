var fs = require('fs'),
	path = require('path');

module.exports = function(trellis) {
	var self = {},
		bundles = {},
		loadOrder, 
		dependencyGraph = require('./dependencyGraph.js');

	/**
	 * Load a bundle at the given path.
	 */
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

	/**
	 * Loads all bundles under a given path. Directories without a bundle.js file
	 * are silently ignored.
	 */
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
	
	/**
	 * Injects a dependency into the graph for the named bundle.
	 */
	self.injectDependency = function (bundle, dependency) {
		dependencyGraph.addBundle(bundle, [dependency]);
	};


	/**
	 * Takes the next bundle in the load order and invokes initialization.
	 */
	function initNextBundle (onFinish) {
		if (loadOrder.length > 0) {
			var nextBundle = loadOrder.shift();
			if (!bundles.hasOwnProperty(nextBundle)) {
				var dependent = dependencyGraph.getDependents(nextBundle).shift();
				throw new Error('Missing dependency: ' + dependent + ' requires ' + nextBundle);
			}

			trellis.logger.debug('Initializing bundle: ' + nextBundle);

			bundles[nextBundle].initialize(function() {
				initNextBundle(onFinish);
			});
		}
		else {
			trellis.logger.debug('Done loading bundles');
			onFinish();
		}
	}

/**
	 * Finalizes loaded bundles. This triggers bundle initialization calls, and
	 * will invoke the onFinish callback when all bundles are loaded.
	 */
	self.finalize = function (onFinish) {
		trellis.logger.debug('Calculating bundle initialization order');
		loadOrder = dependencyGraph.getLoadOrder();

		initNextBundle(onFinish);
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
