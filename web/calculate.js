define(function(require, exports, module){var homunculus=require('homunculus');
var operate=function(){var _0=require('./operate');return _0.hasOwnProperty("operate")?_0.operate:_0.hasOwnProperty("default")?_0.default:_0}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

exports.default=function(node, ignores, i, varHash, globalHash) {
  switch(node.size()) {
    case 1:
      var leaf = node.first();
      if([Node.ADDEXPR, Node.MTPLEXPR, Node.PRMREXPR].indexOf(leaf.name()) > -1) {
        var res = operate(leaf, varHash, globalHash);
        return res;
      }
      else {
        var token = leaf.token();
        if(token.type() == Token.VARS) {
          var k = token.content().replace(/^[$@]\{?/, '').replace(/}$/, '');
          var vara = varHash[k] || globalHash[k];
          if(vara === void 0) {
            vara = {
              value: '',
              unit: ''
            };
          }
          return vara;
        }
        else {
          return {
            value: token.type() == Token.NUMBER ? parseFloat(token.content()) : token.content(),
            unit: ''
          };
        }
      }
    case 2:
      if(node.first().name() == Node.TOKEN
        && node.last().name() == Node.TOKEN) {
        var first = node.first().token();
        var last = node.last().token();
        if(first.type() == Token.NUMBER && last.type() == Token.UNITS) {
          return {
            value: parseFloat(first.content()),
            unit: last.content()
          };
        }
      }
    default:
      var res = { value: '', unit: '' };
      index = i;
      recursion(res, node, ignores, varHash, globalHash);
      return res;
  }
};

function recursion(res, node, ignores, varHash, globalHash) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      res.value += token.content();
      while(ignores[++index]) {
        var s = ignores[index].content();
        if(s != '\n') {
          res.value += s;
        }
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf) {
      recursion(res, leaf, ignores, varHash, globalHash);
    });
  }
}});