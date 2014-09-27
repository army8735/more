var homunculus=require('homunculus');
var join=function(){var _18=require('./join');return _18.hasOwnProperty("join")?_18.join:_18.hasOwnProperty("default")?_18.default:_18}();
var ignore=function(){var _19=require('./ignore');return _19.hasOwnProperty("ignore")?_19.ignore:_19.hasOwnProperty("default")?_19.default:_19}();
var Fn=function(){var _20=require('./Fn');return _20.hasOwnProperty("Fn")?_20.Fn:_20.hasOwnProperty("default")?_20.default:_20}();

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
