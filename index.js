if(typeof define === 'function' && (define.amd || define.cmd)) {
  define(function(require, exports, module) {
    module.exports = require('./web/More');
  });
}
else {
  module.exports = require('./build/More');
}