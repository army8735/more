module homunculus from 'homunculus';
import join from './join';
import ignore from './ignore';
import getVar from './getVar';
import clone from './clone';
import calculate from './calculate';
import operate from './operate';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

class Fn {
  constructor(node, ignores, index) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.index2 = index;
    this.params = [];
    this.flag = false;
    this.res = '';
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
  compile(cParams, ignores, index, varHash, globalHash) {
    var self = this;
    self.index2 = self.index;
    self.flag = false;
    self.res = '';
    var newVarHash = clone(varHash);
    var leaves = cParams.leaves();
    leaves.slice(1, leaves.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        if(idx < self.params.length) {
          var k = self.params[idx];
          k = k.replace(/^[$@]\{?/, '').replace(/}$/, '');
          newVarHash[k] = calculate(leaf, ignores, index, varHash, globalHash);
        }
      }
      index = ignore(leaf, ignores, index);
    });
    self.recursion(self.node, ignores, newVarHash, globalHash);
    return self.res.replace(/^{/, '').replace(/}$/, '');
  }
  recursion(node, ignores, newVarHash, globalHash) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        if(self.flag) {
          var token = node.token();
          self.res += getVar(token, newVarHash, globalHash);
        }
        while(self.ignores[++self.index2]) {
          var s = self.ignores[self.index2].content();
          if(self.flag && s != '\n') {
            self.res += s;
          }
        }
      }
    }
    else {
      switch(node.name()) {
        case Node.BLOCK:
          self.flag = true;
          break;
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
        case Node.PRMREXPR:
          var opt = operate(node, newVarHash, globalHash);
          self.res += opt.value + opt.unit;
          self.index2 = ignore(node, ignores, self.index2);
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, ignores, newVarHash, globalHash);
      });
    }
  }
}

export default Fn;