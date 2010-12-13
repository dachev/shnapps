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
        locals:{request: req}
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













