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
            
            apps[name] = {
                api  : app
            }
        });
        
        return apps;
    }
    
    console.log('loading apps');
    
    var self  = this
        ,apps = loadApps(docroot + '/apps');
        
    console.log('initializing apps');
    
    Object.keys(apps).forEach(function(name, idx) {
        var api = apps[name].api;
        
        api.init(bayeux);
        
        server.use(api.rest);
    });
    
    process.nextTick(function() {
        self.emit('done');
        console.log('ready');
    });
}
AppLoader.prototype = new process.EventEmitter();

function makeOptions(argv) {
    var opts = {
        docroot:''
    }
    
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
    
    opts.port = parseInt(argv.p);
    opts.docroot = (argv.d.indexOf('/') == 0) ?
        argv.d :
        Path.join(process.cwd(), argv.d);
    
    return opts;
}

function showBanner() {
    var command = Path.basename(__filename),
        banner  = 'Usage: ' + command + ' -d DOCROOT -p PORT';

    console.log(banner);
    console.log(new Array(banner.length+1).join('-'))
}

function init() {
    var Express    = require('express')
        ,Ejs       = require('ejs')
        ,Faye      = require('faye')
        ,argv      = require('optimist').argv
        ,opts      = makeOptions(argv)
        ,port      = opts.port
        ,docroot   = opts.docroot;
    
    // add a cron job to start the server on reboot
    require('crontab').load(cronLoaded);
    function cronLoaded(err, tab) {
        if (err) { console.log(err); process.exit(1); }
    
        var Npm = require('npm');
        Npm.load({}, function (err, npm) {
            if (err) { return; }
            
            var uuid         = '74d967a0-120b-11e0-ac64-0800200c9a66',
                npmBinRoot   = npm.config.get('binroot'),
                nodePath     = process.execPath.split('/').slice(0, -1).join('/'),
                exptCommand  = 'export PATH=' + nodePath + ':$PATH',
                wwwCommand   = __filename + ' -d ' + docroot + ' -p ' +  port,
                forevCommand = Path.join(npmBinRoot, 'forever'),
                sysCommand   = exptCommand + ' && ' + forevCommand + ' start ' + wwwCommand;
            
            tab.remove(tab.findComment(uuid));
        
            var item = tab.create(sysCommand, uuid);
            item.everyReboot();
            tab.save();
        });
    };
    
    require.paths.unshift(docroot + '/modules');
    
    var Parser = require('uaparser'),
        server = Express.createServer();
    
    server.use(Express.static(docroot + '/public'));
    server.use(Express.logger({ format: ':date | :remote-addr | :method | :url | :status | :response-time' }));
    server.use(function(req, res, next) {
        req.ua = Parser.parse(req.headers['user-agent'] || '');
        next();
    });
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
    server.use(Express.bodyParser());
    server.use(Express.methodOverride());
    server.use(Express.cookieParser());
    server.use(Express.session({secret:'6e404410-2b6d-11e0-91fa-0800200c9a66'}));
    
    var bayeux = new Faye.NodeAdapter({
        mount   : '/faye',
        timeout : 45
    });
    bayeux.attach(server);
    
    var loader = new AppLoader(server, bayeux, docroot);
    loader.on('done', function() {
        server.set('views', docroot + '/views');
        server.set('view engine', 'html');
        server.register('.html', Ejs);
        
        server.get('/', function(req, res, next) {
            res.render(docroot + '/views/index', {
                layout : docroot + '/views/layout',
                locals : {request: req}
            });
        });
        
        server.use(function(req, res) {
            res.render(docroot + '/views/404', {
                layout : docroot + '/views/layout',
                status : 404,
                locals : {request: req}
            });
        });
        
        server.error(function(err, req, res) {
            console.dir(err);
            
            res.render(docroot + '/views/500', {
                layout : docroot + '/views/layout',
                status : 500,
                locals : {request: req}
            });
        });
        
        server.listen(port);
    });
}

init();




