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
  it('multi', function() {
    var s = 'html{margin:0}div{padding:1}html{padding:0}p{color:#fff}html{color:#FFF}';
    expect(More.compress(s)).to.eql(s);
  });
  it('several', function() {
    var s = 'html{margin:0}div{padding:1}html{padding:0}div{color:#fff}';
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
    var s = 'html{margin:0}.a{padding:1!important}html{padding:0}';
    expect(More.compress(s, true)).to.eql('html{margin:0;padding:0}.a{padding:1!important}');
  });
  it('sort selector', function() {
    var s = '.a,.d,.c,.b,.e{margin:0}div{padding:1}.e,.a,.c,.b,.d{padding:0}';
    expect(More.compress(s, true)).to.eql('div{padding:1}.a,.b,.c,.d,.e{margin:0;padding:0}');
  });
  it('sort selector > 9', function() {
    var s = '.a,.d,.c,.b,.e,.f,.g,.i,.h,.k,.j{margin:0}div{padding:1}.e,.a,.c,.b,.d,.g,.f,.h,.i,.k,.j{padding:0}';
    expect(More.compress(s, true)).to.eql('div{padding:1}.a,.b,.c,.d,.e,.f,.g,.h,.i,.j,.k{margin:0;padding:0}');
  });
  it('multi', function() {
    var s = 'html{margin:0}div{padding:1}html{padding:0}p{color:#fff}html{color:#FFF}';
    expect(More.compress(s, true)).to.eql('div{padding:1}html{margin:0;padding:0;color:#FFF}p{color:#fff}');
  });
  it('several', function() {
    var s = 'html{margin:0}div{padding:1}html{padding:0}div{color:#fff}';
    expect(More.compress(s, true)).to.eql('div{padding:1;color:#fff}html{margin:0;padding:0}');
  });
  it('abbreviation 1', function() {
    var s = 'html{padding:0}div{border-width:0}html{border:1px solid #fff}';
    expect(More.compress(s, true)).to.eql('div{border-width:0}html{padding:0;border:1px solid #fff}');
  });
  it('abbreviation 2', function() {
    var s = 'html{padding:0}div{border-width:0;padding-top:0}html{border:1px solid #fff}';
    expect(More.compress(s, true)).to.eql(s);
  });
});
describe('union', function() {
  it.skip('same style diff important', function() {
    var s = 'html{margin:0}.a{margin:1 !important}body{margin:0}';
    expect(More.compress(s, true)).to.eql('body,html{margin:0}.a{margin:1 !important}');
  });
})