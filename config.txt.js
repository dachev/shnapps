var Express = require('express');
var oneYear = 31557600000;
var common  = [
    Express.logger({ format: ':date | :remote-addr | :method | :url | :status | :response-time' }),
    Express.bodyParser(),
    Express.methodOverride(),
    Express.cookieParser(),
    Express.session({secret:'secret'})
];

module.exports = {
    development : {
        web : {
            docroot : 'path',
            port    : 8002,
            middleware : common.concat([
                Express.static('path'),
                Express.errorHandler({dumpExceptions:true, showStack:true})
            ])
        }
    },
    production  : {
        web : {
            docroot    : 'path',
            port       : 8002,
            middleware : common.concat([
                Express.static('path', {maxAge:oneYear}),
                Express.errorHandler()
            ])
        }
    }
};