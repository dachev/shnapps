var about = [{
        name  : 'require',
        items : [
            {name:'express', link:'https://github.com/visionmedia/express'},
            {name:'ejs',     link:'https://github.com/visionmedia/ejs'},
            {name:'jsdom',   link:'https://github.com/tmpvar/jsdom'},
            {name:'jquery',  link:null},
            {name:'restler-aaronblohowiak', link:'https://github.com/aaronblohowiak/restler'}
            
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

var Path    = require('path'),
    Express = require('express'),
    Ejs     = require('ejs'),
    Drill   = require('drill'),
    rest    = Express.createServer();

rest.use('/wikidrill', Express.staticProvider(__dirname + '/public'));

// configure views
rest.set('views', __dirname + '/views');
rest.register('.html', Ejs);
rest.set('view engine', 'html');
rest.helpers({
    rootPath: Path.join(__dirname, '../../')
});

rest.get('/wikidrill', function(req, res, next) {
    res.render('index', {
        status:200,
        locals:{about:about}
    });
});

rest.post('/wikidrill', function(req, res, next) {
    var result = {success:false, msgType:'error', msg:'Unknow server error'},
        args   = req.body || {};
    
    if (!args.start_term || !args.end_term) {
        result.msg = 'Start or end page is missing or invalid';
        res.send(result);
        res.end();
        
        return;
    }
    
    drillWikipedia(res, args.start_term, args.end_term);
});

function drillWikipedia(res, startTerm, endTerm) {
    var result = {success:false, msgType:'error', msg:'Unknow server error'};
    
    Drill.probe(startTerm, endTerm, function(bit) {
        result.success = bit.success;
        result.msgType = (bit.success == true) ? 'success' : 'error';
        result.msg     = bit.msg;
        result.stack   = bit.stack;
        
        //console.log(result);
        
        res.send(result);
        res.end();
    });
}

module.exports = {
    rest:rest
};
