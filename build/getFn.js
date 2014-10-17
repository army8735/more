var homunculus=require('homunculus');
var join=function(){var _20=require('./join');return _20.hasOwnProperty("join")?_20.join:_20.hasOwnProperty("default")?_20.default:_20}();
var ignore=function(){var _21=require('./ignore');return _21.hasOwnProperty("ignore")?_21.ignore:_21.hasOwnProperty("default")?_21.default:_21}();
var Fn=function(){var _22=require('./Fn');return _22.hasOwnProperty("Fn")?_22.Fn:_22.hasOwnProperty("default")?_22.default:_22}();

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
