define(function(require, exports, module){var homunculus=require('homunculus');

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

exports.default=function(block) {
  var has = false;
  block.leaves().forEach(function(leaf) {
    if(!has && leaf.name() == Node.STYLESET) {
      has = true;
    }
  });
  return has;
};});