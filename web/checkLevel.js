define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

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