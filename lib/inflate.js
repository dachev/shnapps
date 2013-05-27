var zlib = require('zlib');

module.exports = function() {
  return function(req, res, next) {
    if (req.headers['content-encoding'] != 'deflate+base64') {
      return next();
    }
    
    req.setEncoding('utf8');

    var data = '';
    var emit = req.emit;

    req.emit = function(name) {
      if (name == 'readable') {
        var chunk = req.read();
        if (!chunk || chunk.length < 1) {
          return;
        }

        data += chunk;
      }
      else if (name == 'end') {
        var buffer = new Buffer(data, 'base64');

        zlib.inflateRaw(buffer, function(err, body) {
          if (err) {
            return next(err);
          }
          
          req.emit = emit;
          req.emit.call(req, 'data', body);
          req.emit.call(req, 'end');
        });
      }
    };

    next();
  }
}