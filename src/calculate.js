import homunculus from 'homunculus';
import operate from './operate';
import getVar from './getVar';
import exprstmt from './exprstmt';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

export default function(node, ignores, i, varHash, globalHash, file) {
  switch(node.size()) {
    case 1:
      var leaf = node.first();
      switch(leaf.name()) {
        //变量申明为1个表达式
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
        case Node.PRMREXPR:
          return operate(leaf, varHash, globalHash);
        //或者1个UNBOX，去除引号
        case Node.UNBOX:
          var s = getVar(leaf.last().token(), varHash, globalHash);
          return {
            value: s.slice(1, s.length -1),
            unit: ''
          };
        //内置函数
        case Node.BASENAME:
        case Node.EXTNAME:
        case Node.WIDTH:
        case Node.HEIGHT:
          return {
            value: exprstmt(leaf, varHash, globalHash, file),
            unit: ''
          };
        //默认value
        default:
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
    //2个token的value，数字+单位
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
      recursion(res, node, ignores, varHash, globalHash, file);
      return res;
  }
};

function recursion(res, node, ignores, varHash, globalHash, file) {
  if(node.isToken()) {
    var token = node.token();
    if(!token.isVirtual()) {
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
      recursion(res, leaf, ignores, varHash, globalHash, file);
    });
  }
}