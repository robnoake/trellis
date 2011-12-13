var fs = require('fs'),
	path = require('path');

var inspect = require('util').inspect;

module.exports = function(trellis) {
	var bundles = {},
		loadOrder, dependencyGraph = require('./dependencyGraph.js');

	function load(bundlePath) {
		bundlePath = path.normalize(bundlePath);
		var bundleFile = path.join(bundlePath, 'bundle.js');

		if (path.existsSync(bundleFile)) {
			trellis.logger.silly('Loading bundle at: ' + bundlePath);
			var bundle = require(bundleFile)(trellis);

			if (bundles.hasOwnProperty(bundle.name)) {
				throw new Error('A bundle called ' + bundle.name + ' already exists, attempting to load another at ' + bundlePath);
			}

			bundle.path = bundlePath;
			bundles[bundle.name] = bundle;
			trellis.logger.verbose('Loaded bundle: ' + bundle.name);

			dependencyGraph.addBundle(bundle.name, bundle.requiredBundles);
		}
		else {
			if (!path.existsSync(bundlePath)) {
				throw new Error('Bundle path does not exist: ' + bundlePath);
			}
			throw new Error('Missing bundle.js in path: ' + bundlePath);
		}
	}

	function loadPath(bundleRootPath) {
		bundleRootPath = path.normalize(bundleRootPath);
		trellis.logger.verbose('Adding all bundles in directory: ' + bundleRootPath);
		fs.readdirSync(bundleRootPath).forEach(function(fileName) {
			if (fs.statSync(path.join(bundleRootPath, fileName)).isDirectory()) {
				if (path.existsSync(path.join(bundleRootPath, fileName, 'bundle.js'))) {
					load(bundleRootPath + '/' + fileName);
				}
			}
		});
	}
	
	function injectDependency(bundle, dependency) {
		dependencyGraph.addBundle(bundle, [dependency]);
	}

	function finalize(onFinish) {
		trellis.logger.info('Calculating bundle initialization order');
		loadOrder = dependencyGraph.getLoadOrder();

		// Synchronously load each item
		initNextBundle(onFinish);
	}

	function initNextBundle(onFinish) {
		if (loadOrder.length > 0) {
			var nextBundle = loadOrder.shift();
			if (!bundles.hasOwnProperty(nextBundle)) {
				throw new Error('Unmet bundle dependency: ' + nextBundle);
			}

			trellis.logger.verbose('Initializing bundle: ' + nextBundle);

			bundles[nextBundle].initialize(function() {
				initNextBundle(onFinish);
			});
		}
		else {
			trellis.logger.info('Done loading bundles');
			onFinish();
		}
	}

	/**
	 * Retrieves a loaded bundle
	 * @param string bundleName Name of the bundle to be retrieved
	 */

	function get(bundleName) {
		if (bundles.hasOwnProperty(bundleName)) {
			return bundles[bundleName];
		}
		else {
			throw Error('Requested unknown bundle ' + bundleName);
		}
	}

	return {
		get: get,
		injectDependency: injectDependency,
		finalize: finalize,
		load: load,
		loadPath: loadPath
	};
};