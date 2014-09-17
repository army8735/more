define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _18=require('./join');return _18.hasOwnProperty("join")?_18.join:_18.hasOwnProperty("default")?_18.default:_18}()
var ignore=function(){var _19=require('./ignore');return _19.hasOwnProperty("ignore")?_19.ignore:_19.hasOwnProperty("default")?_19.default:_19}()
var Fn=function(){var _20=require('./Fn');return _20.hasOwnProperty("Fn")?_20.Fn:_20.hasOwnProperty("default")?_20.default:_20}()

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

exports.default=function(node, ignores, i, fnHash) {
  index = i;
  recursion(node, ignores, fnHash);
}});