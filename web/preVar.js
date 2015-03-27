define(function(require, exports, module){var homunculus=require('homunculus');
var ignore=function(){var _0=require('./ignore');return _0.hasOwnProperty("ignore")?_0.ignore:_0.hasOwnProperty("default")?_0.default:_0}();
var calculate=function(){var _1=require('./calculate');return _1.hasOwnProperty("calculate")?_1.calculate:_1.hasOwnProperty("default")?_1.default:_1}();
var exprstmt=function(){var _2=require('./exprstmt');return _2.hasOwnProperty("exprstmt")?_2.exprstmt:_2.hasOwnProperty("default")?_2.default:_2}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, varHash, globalVar, file, focus) {
  if(!node.isToken()) {
    if(node.name() == Node.VARDECL
      && ['$', '@'].indexOf(node.first().token().content().charAt(0)) > -1) {
      var i = index;
      while(ignores[++i]) {}
      while(ignores[++i]) {}
      var leaves = node.leaves();
      var k = leaves[0].token().content().slice(1);
      var v = leaves[2];
      switch(v.name()) {
        case Node.UNBOX:
          varHash[k] = {
            value: v.last().token().val(),
            unit: ''
          };
          break;
        case Node.ARRLTR:
        case Node.DIR:
        case Node.BASENAME:
        case Node.EXTNAME:
        case Node.WIDTH:
        case Node.HEIGHT:
          varHash[k] = {
            value: exprstmt(v, varHash, globalVar, file),
            unit: ''
          };
          break;
        default:
          varHash[k] = calculate(v, ignores, i, varHash, globalVar);
      }
      index = ignore(node, ignores, index).index;
      index = ignore(node.next(), ignores, index).index;
    }
    else {
      node.leaves().forEach(function(leaf) {
        //if和for和fn的在执行到时方运算
        if(focus || [Node.IFSTMT, Node.FORSTMT, Node.FN].indexOf(leaf.name()) == -1) {
          recursion(leaf, ignores, varHash, globalVar, file, focus);
        }
      });
    }
  }
  else if(!node.token().isVirtual()) {
    while(ignores[++index]) {}
  }
}

exports.default=function(node, ignores, i, varHash, globalVar, file, focus) {
  index = i;
  recursion(node, ignores, varHash, globalVar, file, focus);
}});