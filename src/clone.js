function isEmptyObject( obj ) {
  for(var name in obj ) {
    return false;
  }
  return true;
}

function clone(obj) {
  if(typeof obj != 'object') {
    return obj;
  }
  var re = {};
  if(obj.constructor == Array) {
    re = [];
  }
  Object.keys(obj).forEach(function(i) {
    if(!isEmptyObject(obj[i])) {
      re[i] = clone(obj[i]);
    }
    else if(typeof obj[i] != 'object') {
      re[i] = obj[i];
    }
    else {
      re[i] = {};
    }
  });
  return re;
}

export default clone;