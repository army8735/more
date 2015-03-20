var homunculus=require('homunculus');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var res = '';

function exprstmt(node, ignores, fnHash, globalFn, varHash, globalVar) {
  res = '';
  switch(node.name()) {
    case Node.RELSTMT:
    case Node.EQSTMT:
      res = relstmt(node, ignores, fnHash, globalFn, varHash, globalVar);
      break;
    case Node.PRMRSTMT:
      res = prmrstmt(node, ignores, fnHash, globalFn, varHash, globalVar);
      break;
  }
  return res;
}

function relstmt(node, ignores, fnHash, globalFn, varHash, globalVar) {
  var left = exprstmt(node.leaf(0), ignores, fnHash, globalFn, varHash, globalVar);
  var right = exprstmt(node.leaf(2), ignores, fnHash, globalFn, varHash, globalVar);
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

function prmrstmt(node, ignores, fnHash, globalFn, varHash, globalVar) {
  var token = node.leaf(0).token();
  var content = token.content();
  var res;
  switch(token.type()) {
    case Token.VARS:
      var k = content.replace(/^[$@]\{?/, '').replace(/}$/, '');
      res = (varHash[k] || globalVar[k] || {}).value;
      break;
    case Token.NUMBER:
      res = parseFloat(content);
      break;
    case Token.STRING:
      res = token.val();
      break;
    default:
      res = content;
      break;
  }
  return res;
}

exports.default=exprstmt;