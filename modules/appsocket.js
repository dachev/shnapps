var Io = require('socket.io');
    
module.exports = {
    Consumer:Consumer,
    Producer:Producer
};

// producer
function Producer(server) {
    var self        = this,
        consumers   = {},
        connections = {},
        listener    = Io.listen(server, {flashPolicyServer:false, log:null});

    listener.on('connection', function(connection) {
        var sessionId = connection.sessionId,
            client    = new Client(connection);
        
        connection.on('message', function(msg) {
            var topic      = msg.topic,
                command    = msg.command,
                data       = msg.data,
                consumer   = consumers[topic];
            
            if (!topic || !command || !consumer) {
                return;
            }
            
            switch (command) {
                case 'join':
                    if (!connections[sessionId]) {
                        connections[sessionId] = [];
                    }
                    connections[sessionId].push(consumer);
                    consumer.join(client);
                    break;
                
                case 'data':
                    consumer.data(client, data);
                    break;
                
                case 'drop':
                    consumer.drop(client);
                    break;
            }
        });
        
        connection.on('disconnect', function() {
            var connectionConsumers = connections[sessionId];
            
            for (var i = 0; i < connectionConsumers.length; i++) {
                connectionConsumers[i].drop(client);
            }
            
            delete connections[sessionId];
        });
    });
    
    this.addConsumer = function(topic, consumer) {
        consumers[topic] = consumer;
    }
    this.removeConsumer = function(topic) {
        delete consumers[topic];
    }
}
Producer.prototype = new process.EventEmitter();

// consumer
function Consumer() {}
Consumer.prototype = new process.EventEmitter();
Consumer.prototype.clients = {};
Consumer.prototype.broadcast = function(message, except) {
    for (var i = 0, k = Object.keys(this.clients), l = k.length; i < l; i++) {
        if (!except || ((typeof except == 'number' || typeof except == 'string') && k[i] != except)
                    || (Array.isArray(except) && except.indexOf(k[i]) == -1)) {
            this.clients[k[i]].send(message);
        }
    }
    return this;
};
Consumer.prototype.join = function(client) {
    var sessionId = client.sessionId;
    this.clients[sessionId] = client;
    this.emit('join', client);
}
Consumer.prototype.data = function(client, msg) {
    client.emit('data', msg);
}
Consumer.prototype.drop = function(client) {
    var sessionId = client.sessionId;
    delete this.clients[sessionId];
    client.emit('drop');
}

// client
function Client(connection) {
    this.sessionId = connection.sessionId;
    this.send = function(msg) {
        connection.send(msg);
    };
}
Client.prototype = new process.EventEmitter();


