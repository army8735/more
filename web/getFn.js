define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _17=require('./join');return _17.hasOwnProperty("join")?_17.join:_17.hasOwnProperty("default")?_17.default:_17}();
var ignore=function(){var _18=require('./ignore');return _18.hasOwnProperty("ignore")?_18.ignore:_18.hasOwnProperty("default")?_18.default:_18}();
var Fn=function(){var _19=require('./Fn');return _19.hasOwnProperty("Fn")?_19.Fn:_19.hasOwnProperty("default")?_19.default:_19}();

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