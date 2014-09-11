define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _12=require('./join');return _12.hasOwnProperty("join")?_12.join:_12.hasOwnProperty("default")?_12.default:_12}()
var ignore=function(){var _13=require('./ignore');return _13.hasOwnProperty("ignore")?_13.ignore:_13.hasOwnProperty("default")?_13.default:_13}()
var Fn=function(){var _14=require('./Fn');return _14.hasOwnProperty("Fn")?_14.Fn:_14.hasOwnProperty("default")?_14.default:_14}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globanVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    ignore(node, ignores, index);
    var res = fn.compile(node.leaf(1), varHash, globanVar);
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