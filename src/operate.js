module homunculus from 'homunculus';
import getVar from './getVar';
import ignore from './ignore';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;
var res;

export default function(node, ignores, i, varHash, globalVar) {
  index = i;
  res = '';
  var operate = new Operate(node, ignores, index, varHash, globalVar);
  console.log(operate.exec());
  return res;
};

class Operate {
  constructor(node, ignores, index, varHash, globalVar) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.varHash = varHash;
    this.globalVar = globalVar;
    this.res = '';
  }
  exec(node = this.node) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        var token = node.token();
        if(!token.ignore) {
          //
        }
      }
    }
    else {
      var leaves = node.leaves();
      leaves.forEach(function(leaf) {
        switch(leaf.name()) {
          case Node.ADDEXPR:
          case Node.MTPLEXPR:
          case Node.PRMREXPR:
            var operate = new Operate(self.node, self.ignores, self.index, self.varHash, self.globalVar);
            self.res += operate.exec();
            ignore(node);
            break;
        }
        self.exec(leaf);
      });
    }
    return self.res;
  }
}