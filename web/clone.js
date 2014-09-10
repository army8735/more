define(function(require, exports, module){function clone(obj, res) {
  Object.keys(obj).forEach(function(k) {
    res[k] = obj[k];
  });
}

exports.default=function(obj) {
  var res = {};
  clone(obj, res);
  return res;
};});