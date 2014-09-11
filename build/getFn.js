var homunculus=require('homunculus');
var join=function(){var _10=require('./join');return _10.hasOwnProperty("join")?_10.join:_10.hasOwnProperty("default")?_10.default:_10}()
var ignore=function(){var _11=require('./ignore');return _11.hasOwnProperty("ignore")?_11.ignore:_11.hasOwnProperty("default")?_11.default:_11}()
var Fn=function(){var _12=require('./Fn');return _12.hasOwnProperty("Fn")?_12.Fn:_12.hasOwnProperty("default")?_12.default:_12}()

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
