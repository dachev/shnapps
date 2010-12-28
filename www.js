#!/usr/bin/env node

function AppLoader(server, bayeux, docroot) {
    var self = this;
    
    console.log('loading apps');
    
    var apps  = loadApps(docroot + '/apps'),
        deps  = getDeps(apps);
    
    console.log('installing app dependencies');
    
    var installer = new DepInstaller(deps);
    installer.on('done', function() {
        console.log('initializing apps');
        initApps(bayeux, apps);
        console.log('ready');
    });
    
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
                app  = require(file),
                deps = getRequires(app.about);
            
            Fs.watchFile(file, function(curr, prev) {
                process.exit(0);
            });
            
            apps[name] = {
                deps : deps,
                api  : app
            }
        });
        
        return apps;
    }
    
    function initApps(bayeux, apps) {
        Object.keys(apps).forEach(function(name, idx) {
            var api = apps[name].api;
            
            api.init(bayeux);
            
            server.use(api.rest);
        });
        
        self.emit('done');
    }
    
    function getDeps(apps) {
        var deps = {};
        
        Object.keys(apps).forEach(function(name, idx) {
            var app = apps[name];
            
            for (var i = 0; i < app.deps.length; i++) {
                var dep = app.deps[i];
                deps[dep] = true;
            }
        });
        
        return Object.keys(deps);
    }
    
    function getRequires(abouts) {
        var deps = [];
        
        for (var i = 0; i < abouts.length; i++) {
            var about = abouts[i],
                topic = about.name,
                items = about.items;
            
            if (topic != 'require' || !items) {
                continue;
            }
            
            for (var j = 0; j < items.length; j++) {
                var item = items[j],
                    name = item.name;
            
                if (!name) {
                    continue;
                }
                
                deps.push(name);
            }
        }
        
        return deps;
    }
}
AppLoader.prototype = new process.EventEmitter();

function DepInstaller(deps) {
    var self = this,
        Npm  = require('npm');
    
    Npm.load({}, function (err, npm) {
        if (err) {
            dieWithError(err);
        }
            
        npm.commands.install(deps, function(err, data) {
            if (err) {
                dieWithError(err);
            }
            
            self.emit('done');
        });
    });
    
    return;
}
DepInstaller.prototype = new process.EventEmitter();

function dieWithError(err) {
    var lines = err.message.split('\n');
    lines.forEach(function(line, idx) {
        console.log(line);
    });
    process.exit(1);
}

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

var Fs   = require('fs'),
    Path = require('path'),
    deps = ['express', 'ejs', 'faye', 'optimist', 'forever', 'crontab'];

console.log('installing server dependencies');

var installer = new DepInstaller(deps);
installer.on('done', function() {
    var Express   = require('express'),
        Ejs       = require('ejs'),
        Faye      = require('faye'),
        CronTab   = require('crontab'),
        tab       = new CronTab(),
        argv      = require('optimist').argv,
        opts      = makeOptions(argv),
        port      = opts.port,
        docroot   = opts.docroot;
    
    // add a cron job to start the server on reboot
    tab.on('loaded', function(tab) {
        var Npm = require('npm');
        Npm.load({}, function (err, npm) {
            if (err) { return; }
            
            var uuid         = '74d967a0-120b-11e0-ac64-0800200c9a66',
                npmBinRoot   = npm.config.get('binroot'),
                nodePath     = process.execPath.split('/').slice(0, -1).join('/'),
                exptCommand  = 'export PATH=' + nodePath + ':$PATH',
                wwwCommand   = __filename + ' -d ' + docroot + ' -p ' +  port + ' --uuid ' + uuid,
                forevCommand = Path.join(npmBinRoot, 'forever'),
                sysCommand   = exptCommand + ' && ' + forevCommand + ' start ' + wwwCommand;
            
            tab.removeAll(uuid);
        
            var item = tab.create(sysCommand);
            item.everyReboot();
            tab.save();
        });
    });
    
    require.paths.unshift(docroot + '/modules');
    
    var server = Express.createServer();
    server.use(Express.staticProvider(docroot + '/public'));
    server.use(Express.logger({ format: ':date | :remote-addr | :method | :url | :status | :response-time' }));
    server.use(Express.bodyDecoder());
    server.use(Express.methodOverride());
    server.use(Express.cookieDecoder());
    server.use(Express.session());
    
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
});





