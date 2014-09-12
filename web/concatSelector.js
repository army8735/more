define(function(require, exports, module){var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

function concat(arr, res, index, temp) {
  if(res===void 0)res=[];if(index===void 0)index=0;if(temp===void 0)temp='';if(index == arr.length) {
    res.push(temp.trim());
  }
  else {
    for(var i = 0, se = arr[index], len = se.length; i < len; i++) {
      var newTemp = temp + (temp.length && !/\s$/.test(temp) && se[i].charAt(0) != '&' ? ' ' : '') + se[i].replace(/^&/, '').trim();
      concat(arr, res, index + 1, newTemp);
    }
  }
  if(index == 0) {
    return res.join(',').trim();
  }
}

exports.default=concat;});