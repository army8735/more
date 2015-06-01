if(typeof define === 'function' && (define.amd || define.cmd)) {
  define(function(require, exports, module) {
    module.exports = require('./web/More')['default'];
  });
}
else {
  module.exports = require('./build/More')['default'];
}