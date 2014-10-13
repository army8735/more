var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var More = require('../');

describe('cleanCss', function() {
  it('normal', function() {
    var s = '/**/ html{margin: 0} ';
    expect(More.compress(s)).to.eql('html{margin:0}');
  });
  it('merge same style', function() {
    var s = 'html{margin:0}body{margin:0}';
    expect(More.compress(s)).to.eql('body,html{margin:0}');
  });
  it('same style but confilct', function() {
    var s = 'html{margin:0}.a{margin:1}body{margin:0}';
    expect(More.compress(s)).to.eql(s);
  });
  it('repeat', function() {
    var s = 'div{background-color:#000;background:#fff}';
    expect(More.compress(s)).to.eql('div{background:#fff}');
  });
  it('merge same selector', function() {
    var s = 'html{margin:0}html{padding:0}';
    expect(More.compress(s)).to.eql('html{margin:0;padding:0}');
  });
  it('same selector but confilct', function() {
    var s = 'html{margin:0}div{padding:1}html{padding:0}';
    expect(More.compress(s)).to.eql(s);
  });
  it('error', function() {
    var s = '*(#(*{{{';
    expect(More.compress(s).indexOf('Error') > -1).to.be.ok();
  });
});
describe('ignore head', function() {
  it('normal', function() {
    var s = '@import "a.css";';
    expect(More.compress(s)).to.eql(s);
  });
  it('radical', function() {
    var s = '@import "a.css";';
    expect(More.compress(s, true)).to.eql(s);
  });
});
describe('merge', function() {
  it('same selector but confilct forward and ok backward', function() {
    var s = 'html{margin:0}div{padding:1}html{padding:0}';
    expect(More.compress(s, true)).to.eql('div{padding:1}html{margin:0;padding:0}');
  });
  it('same selector diff important', function() {
    var s = 'html{margin:0}.a{padding:1 !important}html{padding:0}';
    expect(More.compress(s, true)).to.eql('html{margin:0;padding:0}.a{padding:1 !important}');
  });
});
describe('union', function() {
  it.skip('same style diff important', function() {
    var s = 'html{margin:0}.a{margin:1 !important}body{margin:0}';
    expect(More.compress(s, true)).to.eql('body,html{margin:0}.a{margin:1 !important}');
  });
})