define(function(require, exports, module){var homunculus=require('homunculus');

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
    case Node.POSTFIXSTMT:
      res = poststmt(node, ignores, fnHash, globalFn, varHash, globalVar);
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
  var token = node.first().token();
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

function poststmt(node, ignores, fnHash, globalFn, varHash, globalVar) {
  var token = node.first().first().token();
  var content = token.content();
  switch(token.type()) {
    case Token.VARS:
      var k = content.replace(/^[$@]\{?/, '').replace(/}$/, '');
      var o;
      if(varHash[k]) {
        o = varHash[k];
      }
      else if(globalVar[k]) {
        o = globalVar[k];
      }
      else {
        throw new Error(k + ' is undefined: line ' + token.line() + ', col ' + token.col());
      }
      var next = node.last().token();
      content = next.content();
      switch(content) {
        case '++':
          o.value++;
          break;
        case '--':
          o.value--;
          break;
      }
      return o.value - 1;
    case Token.NUMBER:
      return parseFloat(content);
    case Token.STRING:
      throw new Error('Invalid left-hand side expression in postfix operation: line ' + token.line() + ', col ' + token.col());
  }
}

exports.default=exprstmt;});