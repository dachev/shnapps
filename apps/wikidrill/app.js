var about = [{
        name  : 'require',
        items : [
            {name:'express', link:'https://github.com/visionmedia/express'},
            {name:'ejs',     link:'https://github.com/visionmedia/ejs'},
            {name:'jsdom',   link:'https://github.com/tmpvar/jsdom'},
            {name:'jquery',  link:null},
            {name:'restler', link:'https://github.com/ashleydev/restler'}
            
        ]
    },
    {
        name  : 'credits',
        items : [
            {name:'icons',   link:'http://www.deleket.com/softscraps.html'},
            {name:'buttons', link:'http://www.webdesignerwall.com/demo/css-buttons.html'},
            {name:'bubbles', link:'http://boedesign.com/blog/2009/07/11/growl-for-jquery-gritter/'},
            {name:'xul.css', link:'http://infrequently.org/2009/08/css-3-progress/'}
        ]
    }
];

module.exports = {
    rest   : null,
    about  : about,
    init   : init
};

function init(server, pubsub) {
    var Path    = require('path'),
        Express = require('express'),
        Ejs     = require('ejs'),
        Drill   = require('./modules/drill'),
        rest    = Express.createServer();
    
    rest.use('/wikidrill', Express.static(__dirname + '/public'));
    
    // configure views
    rest.set('views', __dirname + '/views');
    rest.register('.html', Ejs);
    rest.set('view engine', 'html');
    rest.helpers({
        rootPath: Path.join(__dirname, '../../')
    });
    
    rest.get('/wikidrill', function(req, res, next) {
        res.render('index', {about:about});
    });
    
    rest.post('/wikidrill', function(req, res, next) {
        var result = {success:false, msgType:'error', msg:'Unknow server error'},
            args   = req.body || {};
        
        if (!args.start_term || !args.end_term) {
            result.msg = 'Start or end page is missing or invalid';
            res.send(result);
            
            return;
        }
        
        drillWikipedia(Drill, res, args.start_term, args.end_term);
    });
    
    module.exports.rest = rest;
}

    
function drillWikipedia(Drill, res, startTerm, endTerm) {
    var result = {success:false, msgType:'error', msg:'Unknow server error'},
        probe  = Drill.probe(startTerm, endTerm);
        
    probe.on('error', function(bit) {
        result.success = false;
        result.msgType = 'error';
        result.msg     = bit.msg || result.msg;
        result.stack   = bit.stack;
        
        res.send(result);
    });
        
    probe.on('complete', function(bit) {
        result.success = true;
        result.msgType = 'success';
        result.msg     = bit.msg;
        result.stack   = bit.stack;
        
        res.send(result);
    });
}