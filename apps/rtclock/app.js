var about = [{
        name  : 'require',
        items : [
            {name:'express', link:'https://github.com/visionmedia/express'},
            {name:'ejs',     link:'https://github.com/visionmedia/ejs'},
            {name:'faye',    link:'https://github.com/jcoglan/faye'}
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
    about  : about,
    init   : init
};

function init(bayeux) {
    var Path    = require('path'),
        Express = require('express'),
        Ejs     = require('ejs'),
        rest    = Express.createServer();
    
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
    
    var client = bayeux.getClient();
    setInterval(function() {
        client.publish('/rtclock/time', {time:+new Date});
    }, 1000);
    
    client.subscribe('/rtclock/users/ping', function(msg) {
    });
    
    var counter = new Counter(client);
    bayeux.addExtension(counter);
    
    module.exports.rest = rest;
}

function Counter(client) {
    var clients = {};
    
    this.incoming = function(message, callback) {
        if (message.channel == '/rtclock/users/ping') {
            var cid = message.clientId;
            
            if (!clients[cid]) {
                client.publish('/rtclock/users', makeMessage(clients, 'join'));
            }
            clients[cid] = +new Date;
        }
        
        return callback(message);
    };
    
    function collect() {
        var keys  = Object.keys(clients),
            count = keys.length,
            now   = +new Date;
        
        for (var i = 0; i < keys.length; i++) {
            var key       = keys[i],
                timestamp = clients[key];
        
            if (timestamp < now-1000) {
                delete clients[key];
            }
        }
        
        if (Object.keys(clients).length != count) {
            client.publish('/rtclock/users', makeMessage(clients, 'drop'));
        }
    }
    
    setInterval(collect, 2000);
}
    
function makeMessage(clients, action) {
    var count = Object.keys(clients).length,
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
        users: {
            title  : title,
            text   : text,
            image  : '/images/' + file,
            sticky : false,
            time   : '3000'
        }
    }
}













