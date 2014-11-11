define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var varType=require('./varType');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res, globalHash) {
  var value;var unit;var type;var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.VARDECL
      && ['$', '@'].indexOf(node.first().token().content().charAt(0)) > -1) {
      var i = index;
      while(ignores[++i]) {}
      while(ignores[++i]) {}
      var leaves = node.leaves();
      var k = leaves[0].token().content().slice(1);
      var v = join(leaves[2], ignores, i);
      !function(){var _2= varType.getType(leaves[2], v);type=_2["type"];unit=_2["unit"];value=_2["value"]}();
      res[k] = {
        type: type,
        unit: unit,
        str: v,
        value: value
      };
      index = ignore(node, ignores, index);
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignores, res, globalHash);
      });
    }
  }
  else if(!isVirtual) {
    while(ignores[++index]) {}
  }
}

exports.default=function(node, ignores, i, varHash, globalHash) {
  index = i;
  recursion(node, ignores, varHash, globalHash);
}});