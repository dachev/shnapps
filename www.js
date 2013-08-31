#!/usr/bin/env node

var fs      = require('fs')
var path    = require('path');
var colors  = require('colors');
var _       = require('underscore');
var inflate = require('./lib/inflate');
var apps    = {};

function AppLoader(rest, pubsub, docroot) {
  var dirs = fs.readdirSync(docroot);
  
  // load app.js files
  _.each(dirs, function(val, key) {
    var appPath = path.join(docroot, val);
    var appStat = fs.statSync(appPath);
    
    if (appStat.isDirectory() == false) {
      return;
    }
    
    var file = path.join(appPath, 'app.js');
    var app  = require(file);
    
    fs.watchFile(file, function(curr, prev) {
      process.exit(0);
    });
    
    apps[app.name] = app;
  });
  
  _.chain(apps).keys().each(function(val, key) {
    var app = apps[val];
    
    app.init(rest, pubsub);
    
    rest.use('/'+val, app.rest);
  });
  
  var self = this;
  process.nextTick(function() {
    self.emit('done');
  });
}
AppLoader.prototype = new process.EventEmitter();

function init() {
  var express = require('express');
  var faye    = require('faye');
  var utml    = require('utml');
  var program = require('commander'); parseArguments(program);
  var config  = require('./config')[program.environment];
  
  // add a cron job to start the server on reboot
  if (program.startup == true) {
    require('crontab').load(function cronLoaded(err, tab) {
      if (err) {
        console.error(err.message.red);
        process.exit(1);
      }

      var uuid         = '74d967a0-120b-11e0-ac64-0800200c9a66';
      var nodePath     = process.execPath.split('/').slice(0, -1).join('/');
      var exptCommand  = 'export PATH=' + nodePath + ':$PATH';
      var options      = ' -e ' + program.environment;
      var wwwCommand   = __filename + options;
      var forevCommand = path.join(__dirname, 'node_modules', 'forever', 'bin', 'forever');
      var sysCommand   = exptCommand + ' && ' + forevCommand + ' start ' + wwwCommand;

      tab.remove(tab.findComment(uuid));

      var item = tab.create(sysCommand, uuid);
      item.everyReboot();
      tab.save();
    });
  }

  var rest = express();
  rest.set('env', program.environment);
  rest.set('port', config.web.port);
  
  // set root templating
  rest.set('views', __dirname + '/views');
  rest.set('view engine', 'html');
  rest.engine('html', utml.__express);

  // add deflate middleware
  rest.use(inflate());
  
  // add middleware declared in config file
  var middleware = config.web.middleware||[];
  for (var i = 0; i < middleware.length; i++) {
    rest.use(middleware[i]);
  }
  
  // set root public folder
  if (program.environment == 'production') {
    var oneYear = 31557600000;
    rest.use(express.static(__dirname + '/public', {maxAge:oneYear}));
  }
  else {
    rest.use(express.static(__dirname + '/public'));
  }
  
  var pubsub = new faye.NodeAdapter({
    mount   : '/faye',
    timeout : 45
  });
  
  var loader = new AppLoader(rest, pubsub, config.web.docroot);
  loader.on('done', function() {
    rest.get('/', function(req, res, next) {
      res.render('index', {
        locals : {
          request : req,
          apps    : apps
        }
      });
    });
    
    rest.use(function(req, res) {
      res.status(404);
      res.render(__dirname + '/views/404', {
        locals : {
          request : req,
          apps    : apps
        }
      });
    });
    
    rest.use(function(err, req, res) {
      console.error(err);
      
      res.status(500);
      res.render(__dirname + '/views/500', {
        locals : {
          request : req,
          apps    : apps,
          msg     : 'Sorry an error has occurred.'
        }
      });
    });
    
    var server = require('http').createServer(rest);
    pubsub.attach(server);
    server.listen(rest.get('port'), function() {
      console.log('listening on port ' + rest.get('port'));
    });
  });
}

function parseArguments(program) {
  program
    .version('0.0.1')
    .usage('[options]')
    .option('-e, --environment <name>', 'string', String, process.env.NODE_ENV)
    .option('-s, --startup [flag]', 'true|false', true)
    .parse(process.argv);

  if (!program.environment) {
    console.error('No environment specified.'.red)
    process.exit(1);
  }
  if (program.startup == 'true') {
    program.startup = true;
  }
  if (program.startup == 'false') {
    program.startup = false;
  }
  if (program.startup !== true && program.startup !== false) {
    console.error('Startup argument must be true or false.'.red)
    process.exit(1);
  }
}

process.on('uncaughtException', function(err) {
  console.log(err);
});

init();




