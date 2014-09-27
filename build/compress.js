var Clean=function(){var _108=require('clean-css');return _108.hasOwnProperty("Clean")?_108.Clean:_108.hasOwnProperty("default")?_108.default:_108}();

var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(code, radical) {
  var clean = new Clean();
  try {
    code = clean.minify(code);
    console.log(code)
  }
  catch(e) {
    if(typeof console != 'undefined') {
      console.error(e);
    }
    return e.toString();
  }
  if(!radical) {
    return code;
  }
  return (new Compress(code)).compress();
}



  function Compress(code) {
    this.code = code;
    this.head = '';
    this.body = '';
  }
  Compress.prototype.compress = function() {
    var parser = homunculus.getParser('css');
    var node;
    var ignores;
    try {
      this.node = parser.parse(this.code);
      this.ignores = parser.ignore();
      this.index = 0;
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return e.toString();
    }
    this.getHead();
    this.merge();
    this.join();
    return this.head + this.body;
  }
  Compress.prototype.getHead = function() {
    var leaves = this.node.leaves();
    for(var i = 0, len = leaves.length; i < len; i++) {
      var leaf = leaves[i];
      if(leaf.name() == Node.STYLESET) {
        return;;
      }
      this.joinHead(leaf);
    }
  }
  Compress.prototype.joinHead = function(node) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    if(isToken) {
      var token = node.token();
      if(token.type() != Token.VIRTUAL) {
        self.head += token.content();
        while(self.ignore[++self.index]) {
          var ig = self.ignore[self.index];
          self.head += ig.content();
        }
      }
    }
    else {
      node.leaves().forEach(function(leaf) {
        self.joinHead(leaf);
      });
    }
  }
  Compress.prototype.merge = function() {
    //
  }
  Compress.prototype.join = function() {
    //
  }

