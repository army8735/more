var homunculus=require('homunculus');
var join=function(){var _25=require('./join');return _25.hasOwnProperty("join")?_25.join:_25.hasOwnProperty("default")?_25.default:_25}();
var ignore=function(){var _26=require('./ignore');return _26.hasOwnProperty("ignore")?_26.ignore:_26.hasOwnProperty("default")?_26.default:_26}();
var Fn=function(){var _27=require('./Fn');return _27.hasOwnProperty("Fn")?_27.Fn:_27.hasOwnProperty("default")?_27.default:_27}();

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
