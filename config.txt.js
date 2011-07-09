var Express = require('express');
var oneYear = 31557600000;
var common  = [
    Express.logger({ format: ':date | :remote-addr | :method | :url | :status | :response-time' }),
    Express.bodyParser(),
    Express.methodOverride(),
    Express.cookieParser(),
    Express.session({secret:'SECRET_STRING'})
];

module.exports = {
    development : {
        web : {
            docroot    : '/ABSOLUTE/PATH/TO/DOCUMENT/ROOT',
            port    : 8002,
            middleware : common.concat([
                Express.errorHandler({dumpExceptions:true, showStack:true})
            ])
        }
    },
    production  : {
        web : {
            docroot    : '/ABSOLUTE/PATH/TO/DOCUMENT/ROOT',
            port       : 8002,
            middleware : common.concat([
                Express.errorHandler()
            ])
        }
    }
};