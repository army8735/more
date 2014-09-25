define(function(require, exports, module){var data = {};

exports.default=function(k, v) {
  if(v !== void 0) {
    data[k] = v;
  }
  return data[k];
}});