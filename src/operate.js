module homunculus from 'homunculus';
import getVar from './getVar';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

export default function(node, varHash, globalVar) {
  switch(node.name()) {
    case Node.ADDEXPR:
      var temp = new Add(node, varHash, globalVar);
      return temp.exec() + temp.unit;
    case Node.MTPLEXPR:
      var temp = new Add(node, varHash, globalVar);
      return temp.exec() + temp.unit;
    case Node.PRMREXPR:
      var temp = new Prmr(node, varHash, globalVar);
      return temp.exec() + temp.unit;
  }
};

class Add {
  constructor(node, varHash, globalVar) {
    this.node = node;
    this.varHash = varHash;
    this.globalVar = globalVar;
    this.res = '';
    this.unit = '';
  }
  exec() {
    var self = this;
    var first = self.node.first();
    var firstUnit = first.next();
    var opt;
    if(firstUnit.token().type() == Token.UNITS) {
      opt = firstUnit.next();
      firstUnit = firstUnit.token().content();
    }
    else {
      opt = firstUnit;
      firstUnit = null;
    }
    switch(first.name()) {
      case Node.ADDEXPR:
        var temp = new Add(first, self.varHash, self.globalVar);
        self.res = temp.exec();
        self.unit = temp.unit;
        break;
      case Node.MTPLEXPR:
        var temp = new Add(first, self.varHash, self.globalVar);
        self.res = temp.exec();
        self.unit = temp.unit;
        break;
      case Node.PRMREXPR:
        var temp = new Prmr(first, self.varHash, self.globalVar);
        self.res = temp.exec();
        self.unit = temp.unit;
        break;
      default:
        first = first.token().content();
        first = first.indexOf('.') > -1 ? parseFloat(first) : parseInt(first);
        self.res = first;
    }
    while(opt && opt.token().type() == Token.SIGN) {
      var optValue = opt.token().content();
      var second = opt.next();
      var secondUnit = second.next();
      if(secondUnit && secondUnit.token().type() == Token.UNITS) {
        opt = secondUnit.next();
        secondUnit = secondUnit.token();
      }
      else {
        secondUnit = null;
        opt = second.next();
      }
      switch(second.name()) {
        case Node.ADDEXPR:
          var temp = new Add(second, self.varHash, self.globalVar);
          second = temp.exec();
          secondUnit = temp.unit;
          break;
        case Node.MTPLEXPR:
          var temp = new Add(second, self.varHash, self.globalVar);
          second = temp.exec();
          secondUnit = temp.unit;
          break;
        case Node.PRMREXPR:
          var temp = new Prmr(second, self.varHash, self.globalVar);
          second = temp.exec();
          secondUnit = temp.unit;
          break;
        default:
          second = second.token().content();
          second = second.indexOf('.') > -1 ? parseFloat(second) : parseInt(second);
      }
      switch(optValue) {
        case '+':
          self.res += second;
          break;
        case '-':
          self.res -= second;
          break;
        case '*':
          self.res *= second;
          break;
        case '/':
          self.res /= second;
          break;
      }
      //两个单位只有1个，或相等的情况下，无冲突，其中有一个为%无冲突，其余冲突取最后一个
      if(!self.unit && secondUnit) {
        self.unit = secondUnit;
      }
      else if(self.unit && secondUnit && self.unit != secondUnit) {
        if(firstUnit == '%') {
          self.unit = secondUnit;
        }
        else if(secondUnit == '%') {
          self.unit = firstUnit;
        }
        else {
          self.unit = secondUnit;
        }
      }
    }
    return self.res;
  }
}

class Prmr {
  constructor(node, varHash, globalVar) {
    this.node = node;
    this.varHash = varHash;
    this.globalVar = globalVar;
    this.res = '';
    this.unit = '';
  }
  exec() {
    return self.res;
  }
}