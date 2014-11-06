var homunculus=require('homunculus');
var join=function(){var _34=require('./join');return _34.hasOwnProperty("join")?_34.join:_34.hasOwnProperty("default")?_34.default:_34}();
var ignore=function(){var _35=require('./ignore');return _35.hasOwnProperty("ignore")?_35.ignore:_35.hasOwnProperty("default")?_35.default:_35}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.STYLESET) {
      return;
    }
    else if(node.name() == Node.IMPORT) {
      index = ignore(node, ignores, index);
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignores);
      });
    }
  }
  else if(!isVirtual) {
    while(ignores[++index]) {}
  }
}

exports.default=function(node, ignores, i, ignoreImport) {
  if(ignoreImport) {
    index = i;
    recursion(node, ignores);
  }
  var res = [];
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
  return res;
}