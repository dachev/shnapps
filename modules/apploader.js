var Fs        = require('fs'),
    AppSocket = require('appsocket');

module.exports = ApplicationLoader;

function ApplicationLoader(server, docroot) {
    var self     = this;
        producer = new AppSocket.Producer(server);
    
    Fs.readdir(docroot + '/apps', function(err, dirs) {
        if (err) throw err;
        
        dirs.forEach(function(name, index, dirs) {
            var path = docroot + '/apps/' + name;
        
            Fs.stat(path, function(err, stats) {
                if (err) throw err;
                
                if (stats.isDirectory() == false) {
                    return;
                }
                
                require.paths.unshift(path + '/modules');
                
                var file = path + '/app.js',
                    app  = require(file);
                
                Fs.watchFile(file, function(curr, prev) {
                    process.exit(0);
                });
                
                if (app.socket) {
                    producer.addConsumer(name, app.socket);
                }
                
                server.use(app.rest);
                
                // last app
                if (index == dirs.length-1) {
                    self.emit('done');
                }
            });
        });
    });
}
ApplicationLoader.prototype = new process.EventEmitter();