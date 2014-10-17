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
  it('abbreviation', function() {
    var s = 'html{padding:0}div{border-width:0}html{border:1px solid #fff}';
    expect(More.compress(s)).to.eql(s);
  });
  it('duplicate', function() {
    var s = 'html{margin:0}div{padding:1;margin:2}html{margin:1;padding:0}';
    expect(More.compress(s)).to.eql('div{padding:1;margin:2}html{margin:1;padding:0}');
  });
  it('override 1', function() {
    var s = 'html{margin-left:0}div{padding:1;margin:2}html{margin:1;padding:0}';
    expect(More.compress(s)).to.eql('div{padding:1;margin:2}html{margin:1;padding:0}');
  });
  it('override 2', function() {
    var s = 'html{border:1px solid #fff}div{border-left:1px solid #000}html{border-width:2px}';
    expect(More.compress(s)).to.eql(s);
  });
  it('override 3', function() {
    var s = 'html{border-width:2px}div{border-left:1px solid #000}html{border:1px solid #fff}';
    expect(More.compress(s)).to.eql('div{border-left:1px solid #000}html{border:1px solid #fff}');
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
  it('ignore :-ms', function() {
    var s = 'html{margin:0}div:-ms-hover{padding:1}html{padding:0}';
    expect(More.compress(s, true)).to.eql(s);
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
    expect(More.compress(s, true)).to.eql('div{padding:1}html{color:#FFF;margin:0;padding:0}p{color:#fff}');
  });
  it('several', function() {
    var s = 'html{margin:0}div{padding:1}html{padding:0}div{color:#fff}';
    expect(More.compress(s, true)).to.eql('div{color:#fff;padding:1}html{margin:0;padding:0}');
  });
  it('abbreviation 1', function() {
    var s = 'html{padding:0}div{border-width:0}html{border:1px solid #fff}';
    expect(More.compress(s, true)).to.eql('div{border-width:0}html{border:1px solid #fff;padding:0}');
  });
  it('abbreviation 2', function() {
    var s = 'html{padding:0}div{border-width:0;padding-top:0}html{border:1px solid #fff}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('abbreviation 3', function() {
    var s = 'html{padding:0!important}div{border-width:0;padding-top:0}html{border:1px solid #fff}';
    expect(More.compress(s, true)).to.eql('div{border-width:0;padding-top:0}html{border:1px solid #fff;padding:0!important}');
  });
  it('prefix hack', function() {
    var s = 'html{margin:0}div{-webkit-padding:1}html{padding:0}';
    expect(More.compress(s, true)).to.eql('div{-webkit-padding:1}html{margin:0;padding:0}');
  });
  it('suffix hack', function() {
    var s = 'html{margin:0}div{padding:1\\0}html{padding:0}';
    expect(More.compress(s, true)).to.eql('div{padding:1\\0}html{margin:0;padding:0}');
  });
});
describe('union', function() {
  it('confilct', function() {
    var s = 'html{margin:0}div{margin:1}body{margin:0}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('same value', function() {
    var s = 'html{margin:0;padding:0}div{margin:0}body{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql('body,html{margin:0;padding:0}div{margin:0}');
  });
  it('abbreviation', function() {
    var s = 'html{margin:0;padding:0}div{margin-top:0}body{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('sequence', function() {
    var s = 'html{margin:0;padding:0}div{padding:1!important}body{padding:0;margin:0}';
    expect(More.compress(s, true)).to.eql('body,html{margin:0;padding:0}div{padding:1!important}');
  });
  it('same style diff important', function() {
    var s = 'html{margin:0}.a{margin:1!important}body{margin:0}';
    expect(More.compress(s, true)).to.eql('body,html{margin:0}.a{margin:1!important}');
  });
});
describe.skip('calarea', function() {
  describe('single', function() {

  });
});
describe.skip('extract', function() {
  it('single', function() {
    var s = '.a{margin:0;padding:0}.b{margin:0;border:none}';
    expect(More.compress(s, true)).to.eql('.a,.b{margin:0}.a{padding:0}.b{border:none}');
  });
});