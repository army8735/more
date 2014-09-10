define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _246=require('./join');return _246.hasOwnProperty("join")?_246.join:_246.hasOwnProperty("default")?_246.default:_246}()
var ignore=function(){var _247=require('./ignore');return _247.hasOwnProperty("ignore")?_247.ignore:_247.hasOwnProperty("default")?_247.default:_247}()
var Fn=function(){var _248=require('./Fn');return _248.hasOwnProperty("Fn")?_248.Fn:_248.hasOwnProperty("default")?_248.default:_248}()

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