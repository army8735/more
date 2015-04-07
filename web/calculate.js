define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var operate=function(){var _1=require('./operate');return _1.hasOwnProperty("operate")?_1.operate:_1.hasOwnProperty("default")?_1.default:_1}();
var getVar=function(){var _2=require('./getVar');return _2.hasOwnProperty("getVar")?_2.getVar:_2.hasOwnProperty("default")?_2.default:_2}();
var exprstmt=function(){var _3=require('./exprstmt');return _3.hasOwnProperty("exprstmt")?_3.exprstmt:_3.hasOwnProperty("default")?_3.default:_3}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

exports.default=function(node, ignores, i, varHash, globalHash, file) {
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
}});