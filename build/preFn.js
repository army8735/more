var homunculus=require('homunculus');
var join=function(){var _17=require('./join');return _17.hasOwnProperty("join")?_17.join:_17.hasOwnProperty("default")?_17.default:_17}()
var ignore=function(){var _18=require('./ignore');return _18.hasOwnProperty("ignore")?_18.ignore:_18.hasOwnProperty("default")?_18.default:_18}()
var Fn=function(){var _19=require('./Fn');return _19.hasOwnProperty("Fn")?_19.Fn:_19.hasOwnProperty("default")?_19.default:_19}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.FN) {
      var leaves = node.leaves();
      var k = leaves[0].token().content();
      res[k] = new Fn(node, ignores, index);
      index = ignore(node, ignores, index);
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignores, res);
      });
    }
  }
  else if(!isVirtual) {
    while(ignores[++index]) {}
  }
}

exports.default=function(node, ignores, i) {
  var res = {};
  index = i;
  recursion(node, ignores, res);
  return res;
}