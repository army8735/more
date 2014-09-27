var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var More = require('../');

describe('cleanCss', function() {
  it('normal', function() {
    var s = '/**/ html{margin: 0} ';
    expect(More.compress(s)).to.eql('html{margin:0}');
  });
  it('error', function() {
    var s = '*(#(*{{{';
    expect(More.compress(s).indexOf('Error') > -1).to.be.ok();
  });
});
describe('head', function() {
  it('normal', function() {
    var s = '@import "a.css";';
    expect(More.compress(s, true)).to.eql(s);
  });
});
describe('merge', function() {
  it('a same style', function() {
    var s = 'html{margin:0}body{margin:0}'
    expect(More.compress(s, true)).to.eql('html,body{margin:0}');
  });
});