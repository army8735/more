module homunculus from 'homunculus';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

export default function(block) {
  var has = false;
  block.leaves().forEach(function(leaf) {
    if(!has && leaf.name() == Node.STYLESET) {
      has = true;
    }
  });
  return has;
};