var homunculus=require('homunculus');
var join=function(){var _13=require('./join');return _13.hasOwnProperty("join")?_13.join:_13.hasOwnProperty("default")?_13.default:_13}()
var ignore=function(){var _14=require('./ignore');return _14.hasOwnProperty("ignore")?_14.ignore:_14.hasOwnProperty("default")?_14.default:_14}()
var Fn=function(){var _15=require('./Fn');return _15.hasOwnProperty("Fn")?_15.Fn:_15.hasOwnProperty("default")?_15.default:_15}()

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
