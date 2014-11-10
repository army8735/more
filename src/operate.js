module homunculus from 'homunculus';
import getVar from './getVar';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

export default function(node, varHash, globalVar) {
  switch(node.name()) {
    case Node.ADDEXPR:
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
      firstUnit = '';
    }
    switch(first.name()) {
      case Node.ADDEXPR:
      case Node.MTPLEXPR:
        var temp = new Add(first, self.varHash, self.globalVar);
        self.res = temp.exec();
        self.unit = firstUnit || temp.unit;
        break;
      case Node.PRMREXPR:
        var temp = new Prmr(first, self.varHash, self.globalVar);
        self.res = temp.exec();
        self.unit = firstUnit || temp.unit;
        break;
      default:
        if(first.token().type() == Token.NUMBER) {
          first = first.token().content();
          self.res = first.indexOf('.') > -1 ? parseFloat(first) : parseInt(first);
        }
        else {
          self.res = first.token().content();
        }
        self.unit = firstUnit;
    }
    while(opt && opt.token().type() == Token.SIGN) {
      var optValue = opt.token().content();
      var second = opt.next();
      var secondUnit = second.next();
      if(secondUnit && secondUnit.token().type() == Token.UNITS) {
        opt = secondUnit.next();
        secondUnit = secondUnit.token().content();
      }
      else {
        secondUnit = '';
        opt = second.next();
      }
      switch(second.name()) {
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
          var temp = new Add(second, self.varHash, self.globalVar);
          second = temp.exec();
          secondUnit = secondUnit || temp.unit;
          break;
        case Node.PRMREXPR:
          var temp = new Prmr(second, self.varHash, self.globalVar);
          second = temp.exec();
          secondUnit = secondUnit || temp.unit;
          break;
        default:
          if(second.token().type() == Token.NUMBER) {
            second = second.token().content();
            second = second.indexOf('.') > -1 ? parseFloat(second) : parseInt(second);
          }
          else {
            second = second.token().content();
          }
      }
      //两个单位只有1个，或相等的情况下，无冲突，其中有一个为%无冲突，其余冲突取最后一个
      if(self.unit == secondUnit && secondUnit == '%') {
        switch(optValue) {
          case '+':
            self.res += second;
            break;
          case '-':
            self.res -= second;
            break;
          case '*':
            self.res *= second;
            self.res /= 100;
            break;
          case '/':
            self.res /= second;
            self.res /= 100;
            break;
        }
      }
      else if(self.unit != secondUnit) {
        if(self.unit == '%') {
          self.unit = secondUnit;
          switch(optValue) {
            case '+':
              self.res = self.res * second / 100 + second;
              break;
            case '-':
              self.res = self.res * second / 100 - second;
              break;
            case '*':
              self.res = self.res * second / 100;
              break;
            case '/':
              self.res /= second;
              break;
          }
        }
        else if(secondUnit == '%') {
          self.unit = self.unit;
          switch(optValue) {
            case '+':
              self.res += self.res * second / 100;
              break;
            case '-':
              self.res -= self.res * second / 100;
              break;
            case '*':
              self.res = self.res * second / 100;
              break;
            case '/':
              self.res = self.res * 100 / second;
              break;
          }
        }
        else {
          self.unit = secondUnit || self.unit;
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
        }
      }
      else {
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
    var first = this.node.leaf(1);
    switch(first.name()) {
      case Node.ADDEXPR:
      case Node.MTPLEXPR:
        var temp = new Add(first, this.varHash, this.globalVar);
        this.res = temp.exec();
        break;
      case Node.PRMREXPR:
        var temp = new Prmr(first, this.varHash, this.globalVar);
        this.res = temp.exec();
      default:
        var unit = first.next().token();
        if(unit.type() == Token.UNITS) {
          this.unit = unit.content();
        }
        this.res = first.token().content();
    }
    return this.res;
  }
}