if(typeof define === 'function' && (define.amd || define.cmd)) {
  define(function(require, exports, module) {
    require('./fix');
    module.exports = require('./web/More').default;
  });
}
else {
  require('./fix');
  module.exports = require('./build/More').default;
}