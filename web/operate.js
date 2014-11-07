define(function(require, exports, module){var homunculus=require('homunculus');
var getVar=function(){var _30=require('./getVar');return _30.hasOwnProperty("getVar")?_30.getVar:_30.hasOwnProperty("default")?_30.default:_30}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, varHash, globalVar) {
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


  function Add(node, varHash, globalVar) {
    this.node = node;
    this.varHash = varHash;
    this.globalVar = globalVar;
    this.res = '';
    this.unit = '';
  }
  Add.prototype.exec = function() {
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
        if(first.token().type() == Token.NUMBER) {
          first = first.token().content();
          self.res = first.indexOf('.') > -1 ? parseFloat(first) : parseInt(first);
        }
        else {
          self.res = first.token().content();
        }
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
          if(second.token().type() == Token.NUMBER) {
            second = second.token().content();
            second = second.indexOf('.') > -1 ? parseFloat(second) : parseInt(second);
          }
          else {
            second = second.token().content();
          }
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



  function Prmr(node, varHash, globalVar) {
    this.node = node;
    this.varHash = varHash;
    this.globalVar = globalVar;
    this.res = '';
    this.unit = '';
  }
  Prmr.prototype.exec = function() {
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
});