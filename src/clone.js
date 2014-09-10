function clone(obj, res) {
  Object.keys(obj).forEach(function(k) {
    res[k] = obj[k];
  });
}

export default function(obj) {
  var res = {};
  clone(obj, res);
  return res;
};