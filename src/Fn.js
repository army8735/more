import homunculus from 'homunculus';
import join from './join';
import ignore from './ignore';
import getVar from './getVar';
import clone from './clone';
import calculate from './calculate';
import operate from './operate';
import exprstmt from './exprstmt';
import Tree from './Tree';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

class Fn {
  constructor(node, ignores, index, fnHash, globalFn, file) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.fnHash = fnHash;
    this.globalFn = globalFn;
    this.file = file;

    this.params = [];
    this.preCompiler(node, ignores);
  }
  preCompiler(node, ignores) {
    var self = this;
    var ps = node.leaf(1).leaves();
    ps.slice(1, ps.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        self.params.push(leaf.token().content());
      }
    });
  }
  compile(cParams, index, varHash, globalHash, first) {
    var self = this;
    var newVarHash = clone(varHash);
    var leaves = cParams.leaves();
    leaves.slice(1, leaves.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        if(idx < self.params.length) {
          var k = self.params[idx];
          k = k.replace(/^[$@]\{?/, '').replace(/}$/, '');
          switch(leaf.name()) {
            case Node.ARRLTR:
            case Node.DIR:
              newVarHash[k] = {
                value: exprstmt(leaf, varHash, globalHash, self.file),
                unit: ''
              };
              break;
            case Node.UNBOX:
              newVarHash[k] = {
                value: leaf.last().token().val(),
                unit: ''
              };
              break;
            default:
              newVarHash[k] = calculate(leaf, self.ignores, index, varHash, globalHash, self.file);
              break;
          }
        }
      }
      index = ignore(leaf, self.ignores, index).index;
    });
    index = self.index;
    index = ignore(self.node.first(), self.ignores, index).index;
    index = ignore(self.node.leaf(1), self.ignores, index).index;
    var block = self.node.leaf(2);
    index = ignore(block.first(), self.ignores, index).index;
    var temp;
    var res = '';
    for(var j = 1, len = block.size(); j < len - 1; j++) {
      var l = block.leaf(j);
      if(l.isToken() && l.token().isVirtual()) {
        continue;
      }
      var tree = new Tree(
        self.ignores,
        index,
        newVarHash,
        globalHash,
        self.fnHash,
        self.globalFn,
        {},
        0,
        [],
        {},
        true,
        first,
        self.file
      );
      temp = tree.join(l);
      res += temp.res;
      index = temp.index;
    }
    return res;
  }
}

export default Fn;