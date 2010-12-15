#!/usr/bin/env node

var Express   = require('express'),
    Ejs       = require('ejs'),
    Path      = require('path'),
    argv      = require('optimist').argv,
    opts      = makeOptions(argv),
    port      = opts.port,
    docroot   = opts.docroot;

require.paths.unshift(docroot + '/modules');

var AppLoader = require('apploader'),
    server    = Express.createServer();
    
server.use(Express.staticProvider(docroot + '/public'));
server.use(Express.logger({ format: ':date | :remote-addr | :method | :url | :status | :response-time' }));
server.use(Express.bodyDecoder());
server.use(Express.methodOverride());
server.use(Express.cookieDecoder());
server.use(Express.session());

var loader    = new AppLoader(server, docroot);
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

function makeOptions(argv) {
    var opts = {
        docroot:''
    }
    
    if (typeof argv.p != 'string') {
        showBanner();
        console.log('No port number specified')
        process.exit(1);
    }
    
    if (typeof argv.d != 'string') {
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





