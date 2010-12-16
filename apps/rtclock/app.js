var about = [{
        name  : 'require',
        items : [
            {name:'express',   link:'https://github.com/visionmedia/express'},
            {name:'ejs',       link:'https://github.com/visionmedia/ejs'},
            {name:'socket.io', link:'https://github.com/LearnBoost/Socket.IO-node'}
        ]
    },
    {
        name  : 'credits',
        items : [
            {name:'fonts',   link:'http://www.font-zone.com/download.php?fid=1520'},
            {name:'clock',   link:'http://blog.briancavalier.com/css3-digital-clock'},
            {name:'icons',   link:'http://www.deleket.com/softscraps.html'},
            {name:'bubbles', link:'http://boedesign.com/blog/2009/07/11/growl-for-jquery-gritter/'},
            {name:'xul.css', link:'http://infrequently.org/2009/08/css-3-progress/'}
        ]
    }
];

module.exports = {
    rest   : null,
    socket : null,
    about  : about,
    init   : init
};

function init () {
    var Path      = require('path'),
        Express   = require('express'),
        Ejs       = require('ejs'),
        AppSocket = require('appsocket'),
        rest      = Express.createServer();
    
    rest.use('/rtclock', Express.staticProvider(__dirname + '/public'));
    
    // configure views
    rest.set('views', __dirname + '/views');
    rest.register('.html', Ejs);
    rest.set('view engine', 'html');
    rest.helpers({
        rootPath: Path.join(__dirname, '../../')
    });
    
    rest.get('/rtclock', function(req, res, next) {
        res.render('index', {
            status:200,
            locals:{about:about}
        });
    });
    
    var consumer = new AppSocket.Consumer();
    consumer.on('join', function(client) {
        consumer.broadcast({
            notification:sendMessage(consumer, 'join')
        });
        
        client.on('data', function(msg) {
            //console.log(msg);
        });
        client.on('drop', function() {
            consumer.broadcast({
                notification:sendMessage(consumer, 'drop')
            });
        });
    });
    
    setInterval(function() {
        consumer.broadcast({
            time:+new Date
        });
    }, 1000);
    
    module.exports.rest   = rest;
    module.exports.socket = consumer;
}
    
function sendMessage(consumer, action) {
    var count = Object.keys(consumer.clients).length,
        file  = 'button_add_01.png',
        title = 'User joined',
        text  = 'You are the only user on this page';
    
    if (action != 'join') {
        file  = 'button_delete_01.png';
        title = 'User left';
    }
    
    if (count > 1) {
        text = 'There are ' + count + ' users on this page';
    }
    
    return {
        title  : title,
        text   : text,
        image  : '/images/' + file,
        sticky : false,
        time   : '3000'
    }
}













