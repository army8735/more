define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _13=require('./join');return _13.hasOwnProperty("join")?_13.join:_13.hasOwnProperty("default")?_13.default:_13}()
var ignore=function(){var _14=require('./ignore');return _14.hasOwnProperty("ignore")?_14.ignore:_14.hasOwnProperty("default")?_14.default:_14}()
var Fn=function(){var _15=require('./Fn');return _15.hasOwnProperty("Fn")?_15.Fn:_15.hasOwnProperty("default")?_15.default:_15}()

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