define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _4=require('./join');return _4.hasOwnProperty("join")?_4.join:_4.hasOwnProperty("default")?_4.default:_4}()
var ignore=function(){var _5=require('./ignore');return _5.hasOwnProperty("ignore")?_5.ignore:_5.hasOwnProperty("default")?_5.default:_5}()
var Fn=function(){var _6=require('./Fn');return _6.hasOwnProperty("Fn")?_6.Fn:_6.hasOwnProperty("default")?_6.default:_6}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globanVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    ignore(node, ignores, index);
    var res = fn.compile(node.leaf(1), varHash, globanVar).trim().replace(/;$/, '');
    var next = node.next();
    //fnc之后没有;号，除非跟着}结束，否则加上
    if(!next
      || next.name() != Node.TOKEN
      || next.token().content() == '}') {
      res += ';';
    }
    return res;
  }
  return '';
}
});