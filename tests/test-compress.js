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
    expect(More.compress(s)).to.not.eql(s);
  });
  it('in @media', function() {
    var s = '@media all and (width:1024px){body{color:#f33}body{margin:0}}';
    expect(More.compress(s, true)).to.eql('@media all and (width:1024px){body{color:#f33;margin:0}}');
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
  it('cross', function() {
    var s = '@import "a.css";.a{margin:0}@keyframes fadeOut{0%{opacity:1}100%{opacity:0}}.b{padding:0}';
    expect(More.compress(s, true)).to.eql('@import \"a.css\";@keyframes fadeOut{0%{opacity:1}100%{opacity:0}}.a{margin:0}.b{padding:0}');
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
  it('split by child selector', function() {
    var s = 'html{margin:0}html body{margin:1;padding:1}html{padding:0}';
    expect(More.compress(s, true)).to.eql('html{margin:0;padding:0}html body{margin:1;padding:1}');
  });
  it('split by children selector fail', function() {
    var s = 'html{margin:0}div,html body{margin:1;padding:1}html{padding:0}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('split by father selector', function() {
    var s = 'html body{margin:0}html{margin:1;padding:1}html body{padding:0}';
    expect(More.compress(s, true)).to.eql('html body{margin:0;padding:0}html{margin:1;padding:1}');
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
    var s = 'html{margin:0}div{margin-top:0}body{margin:0}';
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
  it('split by child selector', function() {
    var s = '.a{margin:0;padding:0}.a .b{margin:1;padding:1}.c{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql('.a .b{margin:1;padding:1}.a,.c{margin:0;padding:0}');
  });
  it('split by children selector fail', function() {
    var s = '.a{margin:0;padding:0}.a .b,.d{margin:1;padding:1}.c{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('split by father selector', function() {
    var s = '.a .b{margin:0}.a{margin:1}.c{margin:0}';
    expect(More.compress(s, true)).to.eql('.a{margin:1}.a .b,.c{margin:0}');
  });
});
describe('extract', function() {
  it('single', function() {
    var s = '.a{margin:0;padding:0}.b{margin:0;border:none}';
    expect(More.compress(s, true)).to.eql('.a,.b{margin:0}.a{padding:0}.b{border:none}');
  });
  it('abbreviation', function() {
    var s = '.a{margin:0;padding:0}.b{margin-top:0}.c{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql('.a,.c{padding:0}.a{margin:0}.b{margin-top:0}.c{margin:0}');
  });
  it('conflict', function() {
    var s = '.a{margin:0;padding:0}.b{margin:1}.c{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql('.a,.c{padding:0}.a{margin:0}.b{margin:1}.c{margin:0}');
  });
  it('important', function() {
    var s = '.a{margin:0;padding:0}.b{margin:1!important}.c{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql('.a,.c{margin:0;padding:0}.b{margin:1!important}');
  });
  it('selector is longer than value', function() {
    var s = '.aaaaaa{margin:0;padding:0}.b{margin:1}.ccccccc{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it(':-ms-', function() {
    var s = 'html{margin:0;padding:1}div:-ms-hover{margin:0;padding:0}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('remove empty', function() {
    var s = '.a{margin:0;padding:0}.b{margin:0}';
    expect(More.compress(s, true)).to.eql('.a,.b{margin:0}.a{padding:0}');
  });
  it('multi 1', function() {
    var s = '.a{margin:0;padding:0}.b{margin:0}.c{margin:0}';
    expect(More.compress(s, true)).to.eql('.a,.b,.c{margin:0}.a{padding:0}');
  });
  it('multi 2', function() {
    var s = '.a{margin:0;padding:0}.b{margin:0;color:#FFF}.c{padding:0;color:#FFF}';
    expect(More.compress(s, true)).to.eql('.a,.c{padding:0}.a,.b{margin:0}.b,.c{color:#FFF}');
  });
  it('multi 3', function() {
    var s = '.a{margin:0;padding:0;width:0;height:0}.b{margin:0;padding:1;width:2;height:0}.c{margin:1;padding:1;width:3;height:0}';
    expect(More.compress(s, true)).to.eql('.a,.b{margin:0}.a{height:0;padding:0;width:0}.b,.c{height:0;padding:1}.b{width:2}.c{margin:1;width:3}');
  });
  it('multi 4', function() {
    var s = '.aaaaaaaa{margin:0;padding:0;width:0;height:0}.b{margin:0;padding:1;width:2;height:0}.cccccccc{margin:1;padding:1;width:3;height:0}';
    expect(More.compress(s, true)).to.eql('.aaaaaaaa{height:0;margin:0;padding:0;width:0}.b,.cccccccc{height:0;padding:1}.b{margin:0;width:2}.cccccccc{margin:1;width:3}');
  });
  it('multi 5', function() {
    var s = '.a{margin:0;padding:0;width:0;height:0;color:#FFF}.b{margin:1;padding:2;width:0;height:3;color:#000}.c{margin:0;padding:1;width:2;height:2;color:#FFF}.d{margin:3;padding:1;width:3;height:0;color:#FFF}.e{margin:1;padding:1;width:0;height:0;color:#000}.f{margin:1;padding:0;width:0;height:3;color:#000}.g{margin:0;padding:0;width:2;height:1color:#FFF}';
    expect(More.compress(s, true)).to.eql('.a,.b{width:0}.a{color:#FFF;height:0;margin:0;padding:0}.b{color:#000;height:3;margin:1;padding:2}.c,.d{color:#FFF;padding:1}.c{height:2;margin:0;width:2}.d,.e{height:0}.d{margin:3;width:3}.e,.f{width:0;color:#000;margin:1}.e{padding:1}.f,.g{padding:0}.f{height:3}.g{height:1color:#FFF;margin:0;width:2}');
  });
  it('split by child selector', function() {
    var s = '.a{margin:0;padding:0}.a .b{margin:1}.c{margin:0}';
    expect(More.compress(s, true)).to.eql('.a,.c{margin:0}.a{padding:0}.a .b{margin:1}');
  });
  it('split by children selector fail', function() {
    var s = '.a{margin:0;padding:0}.a .b,.d{margin:1}.c{margin:0}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('split by father selector', function() {
    var s = '.a{margin:0;padding:0}.a .b{margin:1}.c{margin:0}';
    expect(More.compress(s, true)).to.eql('.a,.c{margin:0}.a{padding:0}.a .b{margin:1}');
  });
});
describe('@media', function() {
  it('single', function() {
    var s = '@media all and (width:1024px){body{color:#f33}}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('multi same', function() {
    var s = '@media all and (width:1024px){body{color:#f33}}@media all and (width:1024px){div{color:#f33}}';
    expect(More.compress(s, true)).to.eql(s);
  });
  it('merge', function() {
    var s = '@media all and (width:1024px){html{margin:0}div{padding:1}html{padding:0}}';
    expect(More.compress(s, true)).to.eql('@media all and (width:1024px){div{padding:1}html{margin:0;padding:0}}');
  });
  it('union', function() {
    var s = '@media all and (width:1024px){html{margin:0;padding:0}div{margin:0}body{margin:0;padding:0}}';
    expect(More.compress(s, true)).to.eql('@media all and (width:1024px){body,html{margin:0;padding:0}div{margin:0}}');
  });
  it('extract', function() {
    var s = '@media all and (width:1024px){.a{margin:0;padding:0}.b{margin:0;border:none}}';
    expect(More.compress(s, true)).to.eql('@media all and (width:1024px){.a,.b{margin:0}.a{padding:0}.b{border:none}}');
  });
  it('multi cross', function() {
    var s = '@media all{.a{margin:0;padding:0}.b{margin:0;border:none}}body{margin:0}@media (width:1024px){body{color:#f33}}html{padding:0}';
    expect(More.compress(s, true)).to.eql('@media all{.a,.b{margin:0}.a{padding:0}.b{border:none}}body{margin:0}@media (width:1024px){body{color:#f33}}html{padding:0}');
  });
});
describe('file', function() {
  it('960', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/960.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/960-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/960-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('animate', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/animate.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/animate-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/animate-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('blueprint', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/blueprint.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/blueprint-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/blueprint-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('bootstrap', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/bootstrap.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/bootstrap-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/bootstrap-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('font-awesome', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/font-awesome.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/font-awesome-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/font-awesome-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('foundation', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/foundation.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/foundation-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/foundation-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('gumby', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/gumby.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/gumby-res1.css'), res1, { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/gumby-res2.css'), res2, { encoding: 'utf-8' });
  });
  it('inuit', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/inuit.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/inuit-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/inuit-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('normalize', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/normalize.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/normalize-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/normalize-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('oocss', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/oocss.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/oocss-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/oocss-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('pure', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/pure.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/pure-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/pure-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
  it('reset', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/reset.css'), { encoding: 'utf-8' });
    //var res1 = More.compress(s);
    var res2 = More.compress(s, true);
    //fs.writeFileSync(path.join(__dirname, 'file/reset-res1.css'), res1.replace(/}/g, '}\n'), { encoding: 'utf-8' });
    //fs.writeFileSync(path.join(__dirname, 'file/reset-res2.css'), res2.replace(/}/g, '}\n'), { encoding: 'utf-8' });
  });
});
describe('options', function() {
  it('has', function() {
    var s = '.a{margin:0;padding:0}.b{margin:0;border:none}';
    expect(More.compress(s, {}, true)).to.eql('.a,.b{margin:0}.a{padding:0}.b{border:none}');
  });
});