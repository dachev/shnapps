var express = module.parent.require('express');
var parser  = module.parent.require('./lib/uaparser');
var common  = [
  express.logger({ format: ':date | :remote-addr | :method | :url | :status | :response-time' }),
  express.bodyParser(),
  express.methodOverride(),
  express.cookieParser(),
  express.session({secret:'6e404410-2b6d-11e0-91fa-0800200c9a66'}),
  function(req, res, next) {
    req.ua = parser.parse(req.headers['user-agent'] || '');
    next();
  }
];

module.exports = {
  web : {
    port    : 8002,
    middleware : common.concat([
      express.errorHandler({dumpExceptions:true, showStack:true})
    ])
  }
};
