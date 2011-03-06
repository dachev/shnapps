#!/usr/bin/env node

var Fs    = require('fs')
    ,Path = require('path');

function AppLoader(server, bayeux, docroot) {
    function loadApps(appDir) {
        var dirs = Fs.readdirSync(appDir),
            apps = [];
            
        dirs.forEach(function(name, idx) {
            var path  = docroot + '/apps/' + name,
                stats = Fs.statSync(path);
            
            if (stats.isDirectory() == false) {
                return;
            }
            
            require.paths.unshift(path + '/modules');
            
            var file = path + '/app.js',
                app  = require(file);
            
            Fs.watchFile(file, function(curr, prev) {
                process.exit(0);
            });
            
            apps[name] = app;
        });
        
        return apps;
    }
    
    console.log('loading apps');
    
    var apps = loadApps(docroot + '/apps');
        
    console.log('initializing apps');
    
    Object.keys(apps).forEach(function(name, idx) {
        var app = apps[name];
        
        app.init(server, bayeux);
        
        server.use(app.rest);
    });
    
    var self = this;
    process.nextTick(function() {
        self.emit('done');
        console.log('ready');
    });
}
AppLoader.prototype = new process.EventEmitter();

function makeOptions(argv) {
    if (!argv.p) {
        showBanner();
        console.log('No port number specified')
        process.exit(1);
    }
    
    if (!argv.d) {
        showBanner();
        console.log('No document root specified')
        process.exit(1);
    }
    
    if (!argv.e) {
        showBanner();
        console.log('No environment specified')
        process.exit(1);
    }
    
    var opts = {};
    
    opts.port    = parseInt(argv.p);
    opts.env     = argv.e;
    opts.docroot = (argv.d.indexOf('/') == 0) ?
        argv.d :
        Path.join(process.cwd(), argv.d);
    
    return opts;
}

function showBanner() {
    var command = Path.basename(__filename),
        banner  = 'Usage: ' + command + ' -d DOCROOT -p PORT -e ENVIRONMENT';

    console.log(banner);
    console.log(new Array(banner.length+1).join('-'))
}

function init() {
    var Express = require('express')
        ,Ejs    = require('ejs')
        ,Faye   = require('faye')
        ,argv   = require('optimist').argv
        ,opts   = makeOptions(argv);
    
    // add a cron job to start the server on reboot
    require('crontab').load(cronLoaded);
    function cronLoaded(err, tab) {
        if (err) { console.log(err); process.exit(1); }
    
        var Npm = require('npm');
        Npm.load({}, function (err, npm) {
            if (err) { return; }
            
            var uuid          = '74d967a0-120b-11e0-ac64-0800200c9a66'
                ,npmBinRoot   = npm.config.get('binroot')
                ,nodePath     = process.execPath.split('/').slice(0, -1).join('/')
                ,exptCommand  = 'export PATH=' + nodePath + ':$PATH'
                ,options      = ' -d ' + opts.docroot + ' -p ' +  opts.port + ' -e ' + opts.env
                ,wwwCommand   = __filename + options
                ,forevCommand = Path.join(npmBinRoot, 'forever')
                ,sysCommand   = exptCommand + ' && ' + forevCommand + ' start ' + wwwCommand;
            
            tab.remove(tab.findComment(uuid));
        
            var item = tab.create(sysCommand, uuid);
            item.everyReboot();
            tab.save();
        });
    };
    
    require.paths.unshift(opts.docroot + '/modules');
    
    var Parser = require('uaparser'),
        server = Express.createServer();
    
    server.set('env', opts.env);
    
    server.configure(function() {
        server.use(Express.logger({ format: ':date | :remote-addr | :method | :url | :status | :response-time' }));
        server.use(Express.bodyParser());
        server.use(Express.methodOverride());
        server.use(Express.cookieParser());
        server.use(Express.session({secret:'6e404410-2b6d-11e0-91fa-0800200c9a66'}));
        server.use(function(req, res, next) {
            req.ua = Parser.parse(req.headers['user-agent'] || '');
            next();
        });
    });
    
    server.configure('development', function(){
        server.use(Express.static(opts.docroot + '/public'));
        server.use(Express.errorHandler({dumpExceptions:true, showStack:true}));
    });
    
    server.configure('production', function() {
        var oneYear = 31557600000;
        
        server.use(Express.static({root:opts.docroot + '/public', maxAge:oneYear}));
        server.use(Express.errorHandler());
        server.use(function(req, res, next) {
            if ((req.headers.host||'').indexOf('openhouse.dachev.com') == 0) {
            res.redirect('http://openhouse.dachev.com:8000' + req.url, 301);
                return;
            }
            if ((req.headers.host||'').indexOf('445movies.dachev.com') == 0) {
            res.redirect('http://445movies.dachev.com:8000' + req.url, 301);
                return;
            }
            if ((req.headers.host||'').indexOf('lisa.dachev.com') == 0) {
            res.redirect('http://lisa.dachev.com:8000' + req.url, 301);
                return;
            }
            if ((req.url||'').indexOf('/~') == 0) {
                res.redirect('http://blago.dachev.com:8000' + req.url, 301);
                return;
            }
            
            next();
        });
    });
    
    var bayeux = new Faye.NodeAdapter({
        mount   : '/faye',
        timeout : 45
    });
    bayeux.attach(server);
    
    var loader = new AppLoader(server, bayeux, opts.docroot);
    loader.on('done', function() {
        server.set('views', opts.docroot + '/views');
        server.set('view engine', 'html');
        server.register('.html', Ejs);
        
        server.get('/', function(req, res, next) {
            res.render(opts.docroot + '/views/index', {
                layout : opts.docroot + '/views/layout',
                locals : {request: req}
            });
        });
        
        server.use(function(req, res) {
            res.statusCode = 404;
            res.render(opts.docroot + '/views/404', {
                layout  : opts.docroot + '/views/layout',
                request : req
            });
        });
        
        server.error(function(err, req, res) {
            console.dir(err);
            
            res.statusCode = 500;
            res.render(opts.docroot + '/views/500', {
                layout  : opts.docroot + '/views/layout',
                request : req,
                msg     : 'Sorry an error has occurred.'
            });
        });
        
        server.listen(opts.port);
    });
}

init();




