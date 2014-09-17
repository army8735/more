var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var More = require('../');

describe('api', function() {
  it('#parse', function() {
    var more = new More();
    expect(more.parse).to.be.a(Function);
  });
  it('#tokens', function() {
    var more = new More();
    expect(more.tokens).to.be.a(Function);
  });
  it('#ast', function() {
    var more = new More();
    expect(more.ast).to.be.a(Function);
  });
  it('#config', function() {
    var more = new More();
    expect(more.config).to.be.a(Function);
  });
  it('More#config', function() {
    expect(More.config).to.be.a(Function);
  });
});
describe('simple test', function() {
  it('$var :', function() {
    var more = new More();
    var s = '$a: 0;body{ margin: $a}';
    var res = more.parse(s);
    expect(res).to.eql('body{ margin: 0}');
  });
  it('$var =', function() {
    var more = new More();
    var s = '$a: background:url(xxx);\nbody{ margin: $a}';
    var res = more.parse(s);
    expect(res).to.eql('\nbody{ margin: background:url(xxx)}');
  });
  it('@var', function() {
    var more = new More();
    var s = '$a: background: url(xxx);\nbody{ margin: $a}';
    var res = more.parse(s);
    expect(res).to.eql('\nbody{ margin: background: url(xxx)}');
  });
  it('undefined var', function() {
    var more = new More();
    var s = 'body{ margin: $a}';
    var res = more.parse(s);
    expect(res).to.eql('body{ margin: $a}');
  });
  it('${var}', function() {
    var more = new More();
    var s = '$a:1;body{ margin: ${a}}';
    var res = more.parse(s);
    expect(res).to.eql('body{ margin: 1}');
  });
  it('undefined ${var}', function() {
    var more = new More();
    var s = 'body{ margin: ${a}}';
    var res = more.parse(s);
    expect(res).to.eql('body{ margin: ${a}}');
  });
  it('escape $', function() {
    var more = new More();
    var s = 'body{ margin: "\\$a"}';
    var res = more.parse(s);
    expect(res).to.eql('body{ margin: "\\$a"}');
  });
  it('~ autoSplit', function() {
    var more = new More();
    var s = 'body{font-family:~"Arail, verdana"}';
    var res = more.parse(s);
    expect(res).to.eql('body{font-family:"Arail","verdana"}');
  });
  it('fndecl', function() {
    var more = new More();
    var s = 'fn(){margin:0}\nbody{margin:0}';
    var res = more.parse(s);
    expect(res).to.eql('\nbody{margin:0}');
  });
  it('fncall', function() {
    var more = new More();
    var s = 'fn($a){margin:$a}body{fn(2)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:2;}');
  });
  it('fncall global var', function() {
    var more = new More();
    var s = '$a:1;fn(){margin:$a}body{fn(2)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:1;}');
  });
  it('fncall var priority', function() {
    var more = new More();
    var s = '$a:1;fn($a){margin:$a}body{fn(2)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:2;}');
  });
  it('undefined fncall', function() {
    var more = new More();
    var s = 'body{fn(2)}';
    var res = more.parse(s);
    expect(res).to.eql('body{fn(2)}');
  });
  it('complex fncall', function() {
    var more = new More();
    var s = 'fn($a){$a}body{fn(background:url(xxx))}';
    var res = more.parse(s);
    expect(res).to.eql('body{background:url(xxx);}');
  });
  it('level', function() {
    var more = new More();
    var s = 'html,body{margin:0;div,p{padding:0;a{color:#000}span{color:#fff}}}';
    var res = more.parse(s);
    expect(res).to.eql('html,body{margin:0;}html div,html p,body div,body p{padding:0;}html div a,html p a,body div a,body p a{color:#000}html div span,html p span,body div span,body p span{color:#fff}');
  });
  it('level 2', function() {
    var more = new More();
    var s = 'html,body{div,p{padding:0;a{color:#000}span{color:#fff}}margin:0;}';
    var res = more.parse(s);
    expect(res).to.eql('html div,html p,body div,body p{padding:0;}html div a,html p a,body div a,body p a{color:#000}html div span,html p span,body div span,body p span{color:#fff}html,body{margin:0;}');
  });
  it('level 3', function() {
    var more = new More();
    var s = 'html{}';
    var res = more.parse(s);
    expect(res).to.eql('html{}');
  });
  it('level 4', function() {
    var more = new More();
    var s = 'html{p{}}';
    var res = more.parse(s);
    expect(res).to.eql('html p{}');
  });
  it('level 5', function() {
    var more = new More();
    var s = 'html{p{margin:0}}';
    var res = more.parse(s);
    expect(res).to.eql('html p{margin:0}');
  });
  it('level 6', function() {
    var more = new More();
    var s = 'html{p{margin:0}div{padding:0}}';
    var res = more.parse(s);
    expect(res).to.eql('html p{margin:0}html div{padding:0}');
  });
  it('level 7', function() {
    var more = new More();
    var s = 'html{color:#000;p{margin:0}color:#001;div{padding:0}color:#002;}';
    var res = more.parse(s);
    expect(res).to.eql('html{color:#000;}html p{margin:0}html{color:#001;}html div{padding:0}html{color:#002;}');
  });
  it('ignore single level', function() {
    var more = new More();
    var s = 'html, p{}';
    var res = more.parse(s);
    expect(res).to.eql('html, p{}');
  });
  it('&', function() {
    var more = new More();
    var s = 'a{color:#000;&:hover{}}';
    var res = more.parse(s);
    expect(res).to.eql('a{color:#000;}a:hover{}');
  });
  it('@import', function() {
    var more = new More();
    var s = '$v = "v";@import "a";@import url("b");@import url(c);@import url($v);';
    var res = more.parse(s);
    expect(res).to.eql('@import "a.css";@import url("b.css");@import url(c.css);@import url("v.css");');
  });
  it('@extend 1', function() {
    var more = new More();
    var s = 'html{margin:0}body{@extend html}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}body{margin:0;}');
  });
  it('@extend 2', function() {
    var more = new More();
    var s = 'html{margin:0}html{padding:0}body{@extend html}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}html{padding:0}body{margin:0;padding:0;}');
  });
  it('@extend multi', function() {
    var more = new More();
    var s = 'html{margin:0}div{padding:0}body{@extend html,div}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}div{padding:0}body{margin:0;padding:0;}');
  });
  it('@extend recursion 1', function() {
    var more = new More();
    var s = 'html{margin:0}body{@extend html}div{@extend body}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}body{margin:0;}div{margin:0;}');
  });
  it('@extend recursion 2', function() {
    var more = new More();
    var s = 'html{margin:0}body{@extend div}div{@extend html}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}body{}div{margin:0;}');
  });
  it('@extend circular', function() {
    var more = new More();
    var s = 'html{margin:0}body{@extend div}div{@extend body}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}body{}div{}');
  });
  it('@extend level', function() {
    var more = new More();
    var s = 'html{margin:0;body{@extend html}padding:1}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0;}html body{margin:0;padding:1;}html{padding:1}');
  });
  it('@extend pseudo', function() {
    var more = new More();
    var s = 'body{margin:0}\nbody:hover{padding:0}\na{@extend body}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:0}\nbody:hover{padding:0}\na{margin:0;}a:hover{padding:0;}');
  });
  it('@extend pseudo level', function() {
    var more = new More();
    var s = 'html{margin:0;body{@extend html}padding:1;&:hover{color:#000}}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0;}html body{margin:0;padding:1;}html body:hover{color:#000;}html{padding:1;}html:hover{color:#000}');
  });
});