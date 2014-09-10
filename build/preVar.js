var homunculus=require('homunculus');
var join=function(){var _43=require('./join');return _43.hasOwnProperty("join")?_43.join:_43.hasOwnProperty("default")?_43.default:_43}()
var ignore=function(){var _44=require('./ignore');return _44.hasOwnProperty("ignore")?_44.ignore:_44.hasOwnProperty("default")?_44.default:_44}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.VARDECL) {
      while(ignores[++index]) {}
      while(ignores[++index]) {}
      var leaves = node.leaves();
      var k = leaves[0].leaves().content().slice(1);
      var v = join(leaves[2], ignores, index);
      res[k] = v;
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