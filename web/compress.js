define(function(require, exports, module){var Clean=function(){var _17=require('clean-css');return _17.hasOwnProperty("Clean")?_17.Clean:_17.hasOwnProperty("default")?_17.default:_17}();

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
  }
  Compress.prototype.compress = function() {
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

});