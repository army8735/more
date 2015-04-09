define(function(require, exports, module){function clone(obj) {
  var o = Array.isArray(obj) ? [] : {};
  for(var i in obj) {
    if(obj.hasOwnProperty(i)) {
      o[i] = typeof obj[i] === 'object' ? clone(obj[i]) : obj[i];
    }
  }
  return o;
}

exports.default=function(obj) {
  if(typeof obj != 'object') {
    return obj;
  }
  return clone(obj);
};});