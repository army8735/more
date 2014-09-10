var homunculus=require('homunculus');
var join=function(){var _309=require('./join');return _309.hasOwnProperty("join")?_309.join:_309.hasOwnProperty("default")?_309.default:_309}()
var ignore=function(){var _310=require('./ignore');return _310.hasOwnProperty("ignore")?_310.ignore:_310.hasOwnProperty("default")?_310.default:_310}()
var getVar=function(){var _311=require('./getVar');return _311.hasOwnProperty("getVar")?_311.getVar:_311.hasOwnProperty("default")?_311.default:_311}()
var clone=function(){var _312=require('./clone');return _312.hasOwnProperty("clone")?_312.clone:_312.hasOwnProperty("default")?_312.default:_312}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');


  function Fn(node, ignores, index) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.params = [];
    this.preCompiler(node, ignores, index);
  }
  Fn.prototype.preCompiler = function(node, ignores, index) {
    var self = this;
    var ps = node.leaf(1).leaves();
    ps.slice(1, ps.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        self.params.push(leaf.token().content());
      }
    });
  }
  Fn.prototype.compile = function(cParams, varHash, globalVar) {
    var self = this;
    var newVarHash = clone(varHash);
    var leaves = cParams.leaves();
    leaves.slice(1, leaves.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        var k = leaf.first().token().content();
        if(idx < self.params.length) {
          var v = self.params[idx];
          v = v.replace(/^\${?/, '').replace(/}$/, '');
          newVarHash[v] = k;
        }
      }
    });
    console.log(varHash, newVarHash)
    return '';
  }


exports.default=Fn;