define(function(require, exports, module) {
  var fs=require('fs');
  var homunculus=require('homunculus');
  
  
    function More() {
  
    }
  
    More.less=function(data) {
  
    if(data===void 0)data={};}
    More.global=function(data) {
  
    if(data===void 0)data={};}
    More.parse=function(args) {
      args=[].slice.call(arguments, 0);return new More().parse.apply(new More(), [].concat(args));
    }
  
  
  exports.default=More;
});