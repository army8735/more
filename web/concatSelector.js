define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0["default"]:_0}();

var Token = homunculus.getClass('token', 'css');
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

exports["default"]=concat;});