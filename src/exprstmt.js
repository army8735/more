module homunculus from 'homunculus';

import join from './join';
import ignore from './ignore';

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

export default exprstmt;