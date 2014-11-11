define(function(require, exports, module){var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var NUMBER;exports.NUMBER=NUMBER = 0;
var STRING;exports.STRING=STRING = 1;

exports.getType=getType;function getType(node, str) {
  var leaves = node.leaves();
  switch(leaves.length) {
    case 1:
      var value = leaves[0].token().content();
      if(leaves[0].token().type() == Token.NUMBER) {
        return {
          type: NUMBER,
          unit: '',
          value: value.indexOf('.') > -1 ? parseFloat(value) : parseInt(value)
        };
      }
      else {
        return {
          type: STRING,
          unit: '',
          value: value
        };
      }
    case 2:
      var value = leaves[0].token().content();
      if(leaves[0].token().type() == Token.NUMBER) {
        return {
          type: NUMBER,
          unit: leaves[1].token().content(),
          value: value.indexOf('.') > -1 ? parseFloat(value) : parseInt(value)
        };
      }
      else {
        return {
          type: STRING,
          unit: '',
          value: str
        };
      }
    default:
      return {
        type: STRING,
        unit: '',
        value: str
      };;
  }
};});