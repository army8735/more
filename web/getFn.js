define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _16=require('./join');return _16.hasOwnProperty("join")?_16.join:_16.hasOwnProperty("default")?_16.default:_16}();
var ignore=function(){var _17=require('./ignore');return _17.hasOwnProperty("ignore")?_17.ignore:_17.hasOwnProperty("default")?_17.default:_17}();
var Fn=function(){var _18=require('./Fn');return _18.hasOwnProperty("Fn")?_18.Fn:_18.hasOwnProperty("default")?_18.default:_18}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globanVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    ignore(node, ignores, index);
    var res = fn.compile(node.leaf(1), varHash, globanVar).trim().replace(/;$/, '').replace(/\n/g, '');
    var next = node.next();
    //fnc之后没有;号，除非跟着}结束，否则加上
    if(!next
      || next.name() != Node.TOKEN
      || next.token().content() != '}') {
      res += ';';
    }
    return res;
  }
  return '';
}
});