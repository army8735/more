module homunculus from 'homunculus';

import join from './join';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var res = '';
var index = 0;

function exprstmt(node, ignores, i, fnHash, globalFn, varHash, globalVar) {
  res = '';
  index = i;
  switch(node.name()) {
    case Node.RELSTMT:
    case Node.EQSTMT:
      res = relstmt(node, ignores, fnHash, globalFn, varHash, globalVar);
      break;
    case Node.PRMRSTMT:
      res = prmrstmt(node, ignores, fnHash, globalFn, varHash, globalVar);
      break;
  }
  return { res, index };
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
  //while(ignores[++index]) {
  //  res += ignores[index].content();
  //}
  return res;
}

export default exprstmt;