define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _19=require('./join');return _19.hasOwnProperty("join")?_19.join:_19.hasOwnProperty("default")?_19.default:_19}();
var ignore=function(){var _20=require('./ignore');return _20.hasOwnProperty("ignore")?_20.ignore:_20.hasOwnProperty("default")?_20.default:_20}();
var Fn=function(){var _21=require('./Fn');return _21.hasOwnProperty("Fn")?_21.Fn:_21.hasOwnProperty("default")?_21.default:_21}();

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