var about   = [];
var host    = '127.0.0.1';
var port    = 8080;
var core    = 'pgbot';
var solrUrl = 'http://' + host + ':' + port + '/solr/' + core + '/select';
var _       = require('underscore');
var Rest    = require('restler');

module.exports = {
    rest   : null,
    about  : about,
    init   : init
};

function init(server, pubsub) {
    var Path    = require('path'),
        Express = require('express'),
        Ejs     = require('ejs'),
        rest    = Express.createServer();
    
    rest.use('/pgbot', Express.static(__dirname + '/public'));
    
    // configure views
    rest.set('views', __dirname + '/views');
    rest.register('.html', Ejs);
    rest.set('view engine', 'html');
    rest.helpers({
        rootPath: Path.join(__dirname, '../../')
    });
    
    rest.get('/pgbot', getIndex);
    rest.post('/pgbot/line', postLine);
    
    module.exports.rest = rest;
}

function getIndex(req, res) {
    res.render('index', {about:about});
}

function postLine(req, res) {
    var response = {
        success : false,
        message : ''
    };
    
    var text = req.body && req.body.text || '';
    if (text == '') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
        return;
    }
    
    var args = {
        q       : text,
        start   : 0,
        rows    : 3,
        indent  : 'off',
        wt      : 'json'
    };
    
    var url      = solrUrl + '?' + serializeArgs(args)
        ,request = Rest.get(url, {followRedirects:true});
    
    request.on('success', function(data) {
        try { data = JSON.parse(data); } catch(e) { data = {}; }
        
        if (!data.response || !data.response.docs) {
            response.message = 'search server error';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(response));
            return;
        }
        
        var lines = data.response.docs;
        if (lines.length < 1) {
            response.success = true;
            response.payload = 'I don\'t know what to tell you';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(response));
            return;
        }
        
        var idx = Math.round(Math.random()*(lines.length-1))
        var doc = lines[idx] || {text:'I don\'t know what to tell you'};
        
        if (doc.text == text) {
            response.success = true;
            response.payload = 'I don\'t know what to tell you';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(response));
            return;
        }
        
        response.success = true;
        response.payload = doc.text;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
    });
    request.on('error', function(error) {
        response.message = 'search server error';
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
    });
}

function serializeArgs(args) {
    var tokens = _.reduce(args, function(memo, arg, key, args) {
        var list = Array.isArray(arg) ? arg : [arg];
        
        for (var i = 0; i < list.length; i++) {
            memo.push(key + '=' +  encodeURIComponent(list[i]));
        }
        
        return memo;
    }, []);
    
    return tokens.join('&') || '';
}


