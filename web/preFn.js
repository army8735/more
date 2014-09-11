define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _15=require('./join');return _15.hasOwnProperty("join")?_15.join:_15.hasOwnProperty("default")?_15.default:_15}()
var ignore=function(){var _16=require('./ignore');return _16.hasOwnProperty("ignore")?_16.ignore:_16.hasOwnProperty("default")?_16.default:_16}()
var Fn=function(){var _17=require('./Fn');return _17.hasOwnProperty("Fn")?_17.Fn:_17.hasOwnProperty("default")?_17.default:_17}()

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
}});