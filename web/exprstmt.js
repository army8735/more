define(function(require, exports, module){var homunculus=require('homunculus');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

function exprstmt(node, fnHash, globalFn, varHash, globalVar) {
  switch(node.name()) {
    case Node.RELSTMT:
    case Node.EQSTMT:
      return relstmt(node, fnHash, globalFn, varHash, globalVar);
    case Node.PRMRSTMT:
      return prmrstmt(node, fnHash, globalFn, varHash, globalVar);
  }
}

function relstmt(node, fnHash, globalFn, varHash, globalVar) {
  var left = exprstmt(node.leaf(0), fnHash, globalFn, varHash, globalVar);
  var right = exprstmt(node.leaf(2), fnHash, globalFn, varHash, globalVar);
  var opt = node.leaf(1).token().content();
  switch(opt) {
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '!=':
      return left != right;
    case '==':
      return left == right;
  }
}

function prmrstmt(node, fnHash, globalFn, varHash, globalVar) {
  var token = node.leaf(0).token();
  var content = token.content();
  switch(token.type()) {
    case Token.VARS:
      var k = content.replace(/^[$@]\{?/, '').replace(/}$/, '');
      return (varHash[k] || globalVar[k] || {}).value;
    case Token.NUMBER:
      return parseFloat(content);
    case Token.STRING:
      return token.val();
    default:
      return content;
  }
}

exports.default=exprstmt;});