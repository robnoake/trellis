var express = require('express'),
    path = require('path'),
    process = require('process'),
    Settings = require('settings'),
    Winston = require('winston');

module.exports = function (options) {
    var arbor,
        bundleManager,
        logger,
        server,
        settings;
    
    arbor.settings = new Settings(path.join(process.cwd(), 'config', 'environment.js')).getEnvironment('test');
    
    arbor.logger = new Winston.Logger({
        transports: [new winston.transports.Console({ level: 'silly', timestamp: true, colorize: true })]
    });
    
    arbor.bundle = require('./bundle/manager.js');
    
    arbor.express = express.createServer(
        express.bodyParser(),
        express.methodOverride(),
        express.cookieParser(),
        express.session({ secret: settings.session.secret })
    );
    
    /**
     * Starts the express server for this application.
     */
    arbor.start = function () {
        logger.info('Starting HTTP server on port ' + settings.http.port);
        server.listen(settings.http.port);
    };
    
    return arbor;
};