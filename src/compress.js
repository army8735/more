import Clean from 'clean-css';

module homunculus from 'homunculus';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

export default function(code, radical) {
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


class Compress {
  constructor(code) {
    this.code = code;
    this.head = '';
    this.body = '';
  }
  compress() {
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
  getHead() {
    var leaves = this.node.leaves();
    for(var i = 0, len = leaves.length; i < len; i++) {
      var leaf = leaves[i];
      if(leaf.name() == Node.STYLESET) {
        return;;
      }
      this.joinHead(leaf);
    }
  }
  joinHead(node) {
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
  merge() {
    //
  }
  join() {
    //
  }
}
