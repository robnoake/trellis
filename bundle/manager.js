var
    fs = require('fs'),
    path = require('path');
    
module.exports = function(arbor) {
    var bundles,
        loadOrder,
        dependencyGraph;
    
    function load(bundlePath) {
        bundlePath = path.normalize(bundlePath);
        var bundleFile = path.join(bundlePath, 'bundle.js'),
            bundle;
        
        if (path.existsSync(bundleFile)) {
            arbor.logger.verbose('Loading bundle at: ' + bundlePath);
            bundle = require(bundleFile);            
            
            if (bundles.hasOwnProperty(bundle.name)) {
                throw new Error('A bundle called ' + bundle.name + ' already exists, attempting to load another at ' + bundle.path);
            }
            
            bundle.path = path.dirname(bundlePath);
            bundles[bundleName] = bundle;
            arbor.logger.verbose('Loaded bundle: ' + bundle.name);
            
            dependencyGraph.addBundle(bundleName, bundle.requiredBundles);
        } else {
            if (!path.existsSync(bundlePath)) {
                throw new Error('Bundle path does not exist: ' + bundlePath);
            }
            throw new Error('Missing bundle.js in path: ' + bundlePath);
        }
    }
    
    function loadPath(bundleRootPath) {
        bundleRootPath = path.normalize(bundleRootPath);
        arbor.logger.bundle('Adding all bundles in directory: ' + bundleRootPath);
        fs.readdirSync(bundleRootPath).forEach(function(fileName) {
    		if (fs.statSync(path.join(bundleRootPath, fileName)).isDirectory()) {
                if (fs.fileExists(path.join(bundleRootPath, fileName, 'bundle.js'))) {
				    addBundle(bundleRootPath + '/' + fileName);
                }
			}
		});
    }
    
    function finalize(onFinish) {
        arbor.logger.info('Calculating bundle initialization order');
        loadOrder = dependencyGraph.getLoadOrder();
        // Synchronously load each item
        initNextBundle(onFinish);
    }
    
    function initNext(onFinish) {
        if (loadOrder.length > 0) {
            var nextBundle = loadOrder.pop();
            if (!bundles.hasOwnProperty(nextBundle)) {
                throw new Error('Unmet bundle dependency: ' + nextBundle);
            }
            
            arbor.logger.verbose('Initializing bundle: ' + nextBundle);
            
            bundles[nextBundle].init(function () {
                initNext();
            });
        } else {
            arbor.logger.info('Done loading bundles');
            onFinish();
        }
    }
    
    /**
     * Retrieves a loaded bundle
     * @param string bundleName Name of the bundle to be retrieved
     */
    function get(bundleName) {
        if (liveBundles.hasOwnProperty(bundleName)) {
            return liveBundles[bundleName];
        } else {
            throw Error('Requested unknown bundle ' + bundleName);
        }
    }
    
    return {
        get: get,
        finalize: finalize,
        load: load,
        loadPath: loadPath
    };
};