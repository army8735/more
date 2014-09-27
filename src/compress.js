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
  }
  compress() {
    var parser = homunculus.getParser('css');
    var node;
    var ignores;
    try {
      this.node = parser.parse(this.code);
      this.ignores = parser.ignore();
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return e.toString();
    }
  }
}
