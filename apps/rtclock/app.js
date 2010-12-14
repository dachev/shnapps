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

var Express   = require('express'),
    AppSocket = require('appsocket'),
    rest      = Express.createServer();

rest.use('/rtclock', Express.staticProvider(__dirname + '/public'));
rest.set('views', __dirname + '/views');
rest.register('.html', require('ejs'));
rest.set('view engine', 'html');
rest.get('/rtclock', function(req, res, next) {
    res.render('index', {
        status:200,
        locals:{about:about}
    });
});

var consumer = new AppSocket.Consumer();
consumer.on('join', function(client) {
    consumer.broadcast({
        notification:makeMessage('join')
    });
    
    client.on('data', function(msg) {
        //console.log(msg);
    });
    client.on('drop', function() {
        consumer.broadcast({
            notification:makeMessage('drop')
        });
    });
});

function makeMessage(action) {
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

setInterval(function() {
    consumer.broadcast({
        time:+new Date
    });
}, 1000);

module.exports = {
    rest   : rest,
    socket : consumer
};













