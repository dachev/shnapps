var Fs        = require('fs'),
    Exec      = require('child_process').exec,
    AppSocket = require('appsocket');

module.exports = ApplicationLoader;

function ApplicationLoader(server, docroot) {
    var self     = this,
        producer = new AppSocket.Producer(server),
        apps     = loadApps(docroot + '/apps'),
        deps     = getDeps(apps);

    installDeps(producer, apps, deps);
    
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
    
    function initApps(producer, apps) {
        Object.keys(apps).forEach(function(name, idx) {
            var api = apps[name].api;
            
            api.init();
            
            if (api.socket) {
                producer.addConsumer(name, api.socket);
            }
            
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
    
    function installDeps(producer, apps, deps) {
        var command = 'npm install ' + deps.join(' ');
        Exec(command, function(err, stdout, stderr) {
            if (err) {
                var lines = err.message.split('\n');
                lines.forEach(function(line, idx) {
                    console.log(line);
                });
                process.exit(1);
            }
            
            initApps(producer, apps);
        });
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
ApplicationLoader.prototype = new process.EventEmitter();
