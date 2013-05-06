#!/usr/bin/env node

var Fs   = require('fs')
var Path = require('path');
var apps = {};

function AppLoader(server, bayeux, docroot) {
    var dirs = Fs.readdirSync(docroot);
    
    // load app.js files
    dirs.forEach(function(name, idx) {
        var path  = Path.join(docroot, name);
        var stats = Fs.statSync(path);
        
        if (stats.isDirectory() == false) {
            return;
        }
        
        var file = path + '/app.js';
        var app  = require(file);
        
        Fs.watchFile(file, function(curr, prev) {
            process.exit(0);
        });
        
        apps[app.name] = app;
    });
    
    Object.keys(apps).forEach(function(name, idx) {
        var app = apps[name];
        
        app.init(server, bayeux);
        
        server.use('/'+name, app.rest);
    });
    
    var self = this;
    process.nextTick(function() {
        self.emit('done');
    });
}
AppLoader.prototype = new process.EventEmitter();

function makeOptions(argv) {
    if (!argv.e) {
        showBanner();
        console.log('No environment specified')
        process.exit(1);
    }
    
    return {env:argv.e};
}

function showBanner() {
    var command = Path.basename(__filename),
        banner  = 'Usage: ' + command + ' -e ENVIRONMENT';

    console.log(banner);
    console.log(new Array(banner.length+1).join('-'))
}

function init() {
    var Express = require('express');
    var Ejs     = require('ejs');
    var Faye    = require('faye');
    var argv    = require('optimist').argv;
    var opts    = makeOptions(argv);
    var config  = require('./config')[opts.env]||{};
    
    // add a cron job to start the server on reboot
    require('crontab').load(cronLoaded);
    function cronLoaded(err, tab) {
        if (err) { console.log(err); process.exit(1); }
    
        var uuid          = '74d967a0-120b-11e0-ac64-0800200c9a66'
            ,nodePath     = process.execPath.split('/').slice(0, -1).join('/')
            ,exptCommand  = 'export PATH=' + nodePath + ':$PATH'
            ,options      = ' -e ' + opts.env
            ,wwwCommand   = __filename + options
            ,forevCommand = 'forever'
            ,sysCommand   = exptCommand + ' && ' + forevCommand + ' start ' + wwwCommand;
        
        tab.remove(tab.findComment(uuid));
    
        var item = tab.create(sysCommand, uuid);
        item.everyReboot();
        tab.save();
    };
    
    var server = Express.createServer();
    server.set('env', opts.env);
    
    // set root templating
    server.set('views', __dirname + '/views');
    server.set('view engine', 'html');
    server.register('.html', Ejs);
    
    // add middleware declared in config file
    var middleware = config.web.middleware||[];
    for (var i = 0; i < middleware.length; i++) {
        server.use(middleware[i]);
    }
    
    // set root public folder
    if (opts.env == 'production') {
        var oneYear = 31557600000;
        server.use(Express.static(__dirname + '/public', {maxAge:oneYear}));
    }
    else {
        server.use(Express.static(__dirname + '/public'));
    }
    
    var bayeux = new Faye.NodeAdapter({
        mount   : '/faye',
        timeout : 45
    });
    bayeux.attach(server);
    
    var loader = new AppLoader(server, bayeux, config.web.docroot);
    loader.on('done', function() {
        server.get('/', function(req, res, next) {
            res.render(__dirname + '/views/index', {
                layout : __dirname + '/views/layout',
                locals : {request: req, apps:apps}
            });
        });
        
        server.use(function(req, res) {
            res.statusCode = 404;
            res.render(__dirname + '/views/404', {
                layout  : __dirname + '/views/layout',
                request : req
            });
        });
        
        server.error(function(err, req, res) {
            console.dir(err);
            
            res.statusCode = 500;
            res.render(__dirname + '/views/500', {
                layout  : __dirname + '/views/layout',
                request : req,
                msg     : 'Sorry an error has occurred.'
            });
        });
        
        server.listen(config.web.port);
    });
}

process.on('uncaughtException', function(err) {
    console.log(err);
});

init();




