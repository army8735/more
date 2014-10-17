var homunculus=require('homunculus');
var join=function(){var _22=require('./join');return _22.hasOwnProperty("join")?_22.join:_22.hasOwnProperty("default")?_22.default:_22}();
var ignore=function(){var _23=require('./ignore');return _23.hasOwnProperty("ignore")?_23.ignore:_23.hasOwnProperty("default")?_23.default:_23}();
var Fn=function(){var _24=require('./Fn');return _24.hasOwnProperty("Fn")?_24.Fn:_24.hasOwnProperty("default")?_24.default:_24}();

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
