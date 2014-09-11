var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var More = require('../');

describe('api', function() {
  it('#parse', function() {
    var more = new More();
    expect(more.parse).to.be.a(Function);
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
    expect(res).to.eql('body{fn(2)}');
  });
});