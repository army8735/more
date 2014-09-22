define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _22=require('./join');return _22.hasOwnProperty("join")?_22.join:_22.hasOwnProperty("default")?_22.default:_22}()
var ignore=function(){var _23=require('./ignore');return _23.hasOwnProperty("ignore")?_23.ignore:_23.hasOwnProperty("default")?_23.default:_23}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.VARDECL) {
      var i = index;
      while(ignores[++i]) {}
      while(ignores[++i]) {}
      var leaves = node.leaves();
      var k = leaves[0].token().content().slice(1);
      var v = join(leaves[2], ignores, i);
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

exports.default=function(node, res) {
  var leaves = node.leaves();
  for(var i = 0, len = leaves.length; i < len; i++) {
    var leaf = leaves[i];
    if(leaf.name() == Node.STYLESET) {
      return res;
    }
    else if(leaf.name() == Node.IMPORT) {
      var url = leaf.leaf(1);
      if(url.size() == 1) {
        res.push(url.first().token().val());
      }
      else {
        res.push(url.leaf(2).token().val());
      }
    }
  }
}});