define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var join=function(){var _1=require('./join');return _1.hasOwnProperty("join")?_1.join:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();
var getVar=function(){var _3=require('./getVar');return _3.hasOwnProperty("getVar")?_3.getVar:_3.hasOwnProperty("default")?_3.default:_3}();
var clone=function(){var _4=require('./clone');return _4.hasOwnProperty("clone")?_4.clone:_4.hasOwnProperty("default")?_4.default:_4}();
var calculate=function(){var _5=require('./calculate');return _5.hasOwnProperty("calculate")?_5.calculate:_5.hasOwnProperty("default")?_5.default:_5}();
var operate=function(){var _6=require('./operate');return _6.hasOwnProperty("operate")?_6.operate:_6.hasOwnProperty("default")?_6.default:_6}();
var exprstmt=function(){var _7=require('./exprstmt');return _7.hasOwnProperty("exprstmt")?_7.exprstmt:_7.hasOwnProperty("default")?_7.default:_7}();
var Tree=function(){var _8=require('./Tree');return _8.hasOwnProperty("Tree")?_8.Tree:_8.hasOwnProperty("default")?_8.default:_8}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');


  function Fn(node, ignores, index, fnHash, globalFn, file) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.fnHash = fnHash;
    this.globalFn = globalFn;
    this.file = file;

    this.params = [];
    this.preCompiler(node, ignores);
  }
  Fn.prototype.preCompiler = function(node, ignores) {
    var self = this;
    var ps = node.leaf(1).leaves();
    ps.slice(1, ps.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        self.params.push(leaf.token().content());
      }
    });
  }
  Fn.prototype.compile = function(cParams, index, varHash, globalHash, first) {
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


exports.default=Fn;});