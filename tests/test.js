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
  it('#vars', function() {
    var more = new More();
    expect(more.vars).to.be.a(Function);
  });
  it('#fns', function() {
    var more = new More();
    expect(more.fns).to.be.a(Function);
  });
  it('#styles', function() {
    var more = new More();
    expect(more.styles).to.be.a(Function);
  });
  it('#config', function() {
    var more = new More();
    expect(more.config).to.be.a(Function);
  });
  it('#configFile', function() {
    var more = new More();
    expect(more.configFile).to.be.a(Function);
  });
  it('#clean', function() {
    var more = new More();
    expect(more.clean).to.be.a(Function);
  });
  it('##vars', function() {
    expect(More.vars).to.be.a(Function);
  });
  it('##fns', function() {
    expect(More.fns).to.be.a(Function);
  });
  it('##styles', function() {
    expect(More.styles).to.be.a(Function);
  });
  it('##suffix', function() {
    expect(More.suffix).to.be.a(Function);
  });
  it('##root', function() {
    expect(More.root).to.be.a(Function);
  });
  it('##config', function() {
    expect(More.config).to.be.a(Function);
  });
  it('##configFile', function() {
    expect(More.configFile).to.be.a(Function);
  });
  it('##clean', function() {
    expect(More.clean).to.be.a(Function);
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
  it('$var = $var', function() {
    var more = new More();
    var s = '$a:1;$b:2px;$c:$a;$d:@b;a{margin:$c $d}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1 2px}');
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
  it('$中文', function() {
    var more = new More();
    var s = '$中文: background:url(xxx);\nbody{$中文}';
    var res = more.parse(s);
    expect(res).to.eql('\nbody{background:url(xxx)}');
  });
  it('~ autoSplit', function() {
    var more = new More();
    var s = 'body{font-family:~"Arail, verdana"}';
    var res = more.parse(s);
    expect(res).to.eql('body{font-family:"Arail","verdana"}');
  });
  it('~ autoSplit in fn', function() {
    var more = new More();
    var s = '$fn(){~font-family:~"Arail, verdana"}body{$fn()}';
    var res = more.parse(s);
    expect(res).to.eql('body{~font-family:"Arail","verdana"}');
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
    expect(res).to.eql('body{margin:2}');
  });
  it('fncall global var', function() {
    var more = new More();
    var s = '$a:1;fn(){margin:$a}body{fn(2)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:1}');
  });
  it('fncall var priority', function() {
    var more = new More();
    var s = '$a:1;fn($a){margin:$a}body{fn(2)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:2}');
  });
  it('fncall file', function() {
    var s = fs.readFileSync(path.join(__dirname, 'fn.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'fn2.css'), res, { encoding: 'utf-8' });
    var s2 = fs.readFileSync(path.join(__dirname, 'fn2.css'), { encoding: 'utf-8' });
    expect(res).to.eql(s2);
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
    expect(res).to.eql('body{background:url(xxx)}');
  });
  it('fncall repeat', function() {
    var more = new More();
    var s = 'fn($a){margin:0 $a 1px}body{fn(2%);fn(3%)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:0 2% 1px;margin:0 3% 1px}');
  });
  it('fncall params with operate', function() {
    var more = new More();
    var s = 'fn($a){margin:0 $a 1px}body{fn(2px + 5)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:0 7px 1px}');
  });
  it('fncall with operate', function() {
    var more = new More();
    var s = 'fn($a){margin:0 $a 1px + 2}body{fn(3%)}';
    var res = more.parse(s);
    expect(res).to.eql('body{margin:0 3% 3px}');
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
  it('multi @extend', function() {
    var more = new More();
    var s = 'html{margin:0}div{padding:0}body{@extend html;@extend div}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}div{padding:0}body{margin:0;padding:0;}');
  });
  it('@extend error', function() {
    var more = new More();
    var s = 'html{margin:0}body{@extend div}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0}body{}');
  });
  it('@extend error2', function() {
    var more = new More();
    var s = '.test1{margin:0}.testb{padding:0}html{@extend .test;@extend .testb}';
    var res = more.parse(s);
    expect(res).to.eql('.test1{margin:0}.testb{padding:0}html{padding:0;}');
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
    expect(res).to.eql('html{margin:0;}html body{margin:0;}html{padding:1}');
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
    expect(res).to.eql('html{margin:0;}html body{margin:0;}html{padding:1;}html:hover{color:#000}');
  });
  it('@extend pseudo level multi', function() {
    var more = new More();
    var s = 'html{margin:0;body{@extend html,a}padding:1;&:hover{color:#000}}a{line-height:2}a:hover{text-align:center}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0;}html body{margin:0;}html{padding:1;}html:hover{color:#000}a{line-height:2}a:hover{text-align:center}');
  });
  it('@extend like less', function() {
    var more = new More();
    var s = 'html{margin:0;body{html}}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:0;}html body{margin:0;}');
  });
  it('normalize selector 1', function() {
    var more = new More();
    var s = 'html :hover{margin:0}body{@extend html:hover}';
    var res = more.parse(s);
    expect(res).to.eql('html :hover{margin:0}body{margin:0;}');
  });
  it('normalize selector 2', function() {
    var more = new More();
    var s = 'html > body{margin:0}div{@extend html>body}';
    var res = more.parse(s);
    expect(res).to.eql('html > body{margin:0}div{margin:0;}');
  });
  it('ignroe begin', function() {
    var more = new More();
    var s = '/*sdfsdf*/html{}';
    var res = more.parse(s);
    expect(res).to.eql('/*sdfsdf*/html{}');
  });
  it('single comment', function() {
    var more = new More();
    var s = '//test\nhtml{}//test2';
    var res = more.parse(s);
    expect(res).to.eql('/*test*/\nhtml{}/*test2*/');
  });
  it('@import var', function() {
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './1.css'));
    expect(res).to.eql('@import \"2.css\";\n\n\nbody{margin:1;padding:$b;font-size:$c;fn1();}\n.test2{background:#f00}');
  });
  it('#parseFile true', function() {
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './1.css'), true);
    expect(res).to.eql('\n\n\n.test1{line-height:1}\n\n\n\nbody{margin:1;}\ndiv{line-height:1;}\n\n\nbody{margin:1;padding:2;font-size:3;text-align:center;;line-height:1;}\n.test2{background:#f00}');
  });
  it('suffix', function() {
    More.suffix('less');
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './1.less'));
    expect(res).to.eql('@import \"2.css\";\n@import url(3.css);\n\nbody{margin:1;padding:@b;font-size:$c}');
    More.suffix('css');
  });
  it('suffix #parseFile true', function() {
    More.suffix('less');
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './1.less'), true);
    expect(res).to.eql('\n\n\n\nbody{margin:1;padding:2;font-size:3}');
    More.suffix('css');
  });
  it('unknow kw', function() {
    var more = new More();
    var s = 'html{dd:1}body{@extend html}';
    var res = more.parse(s);
    expect(res.indexOf('Error:')).to.eql(0);
  });
  it('new kw', function() {
    More.addKeyword('armyarmyarmy');
    var more = new More();
    var s = 'html{armyarmyarmy:1}body{@extend html}';
    var res = more.parse(s);
    expect(res).to.eql('html{armyarmyarmy:1}body{armyarmyarmy:1;}');
  });
  it('#parseFile when error', function() {
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './error.css'));
    expect(res.indexOf('Error')).to.eql(0);
  });
  it('var in string', function() {
    var more = new More();
    var s = '$a: "a";html{margin:"$a"}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:"a"}');
  });
  it('ignore css3 var', function() {
    var more = new More();
    var s = ':root{var-a:1;$b:2;margin:$a $b;}';
    var res = more.parse(s);
    expect(res).to.eql(':root{var-a:1;margin:$a 2;}');
  });
  it('#ast', function() {
    var more = new More();
    var s = 'html{}';
    more.parse(s);
    expect(more.ast()).to.eql(more.node);
  });
});
describe('operate', function() {
  it('integer single add', function() {
    var more = new More();
    var s = 'a{margin:1 + 2}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3}');
  });
  it('integer multi add', function() {
    var more = new More();
    var s = 'a{margin:1 + 2 + 3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:6}');
  });
  it('decimal single add', function() {
    var more = new More();
    var s = 'a{margin:1.1 + 2.0}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3.1}');
  });
  it('decimal multi add', function() {
    var more = new More();
    var s = 'a{margin:1.1 + 2.0 + 3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:6.1}');
  });
  it('cross line', function() {
    var more = new More();
    var s = 'a{margin:1\n+ 2}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3\n}');
  });
  it('integer single minus', function() {
    var more = new More();
    var s = 'a{margin:1 - 2}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:-1}');
  });
  it('integer multi minus', function() {
    var more = new More();
    var s = 'a{margin:1 - 2 - 3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:-4}');
  });
  it('decimal single minus', function() {
    var more = new More();
    var s = 'a{margin:1.5 - 2.0}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:-0.5}');
  });
  it('decimal multi minus', function() {
    var more = new More();
    var s = 'a{margin:1.5 - 2.0 - 3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:-3.5}');
  });
  it('integer single mtpl', function() {
    var more = new More();
    var s = 'a{margin:1*2}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2}');
  });
  it('integer multi mtpl', function() {
    var more = new More();
    var s = 'a{margin:1*2*3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:6}');
  });
  it('decimal single mtpl', function() {
    var more = new More();
    var s = 'a{margin:1.5*2.0}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3}');
  });
  it('decimal multi mtpl', function() {
    var more = new More();
    var s = 'a{margin:1.5*2.0/3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1}');
  });
  it('overload add', function() {
    var more = new More();
    var s = 'a{margin:1+"2"}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1"2"}');
  });
  it('overload mtpl', function() {
    var more = new More();
    var s = 'a{margin:1*"2"}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:NaN}');
  });
  it('()', function() {
    var more = new More();
    var s = 'a{margin:(1)}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1}');
  });
  it('() with unit', function() {
    var more = new More();
    var s = 'a{margin:(1px)}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1px}');
  });
  it('() before unit', function() {
    var more = new More();
    var s = 'a{margin:(1)px}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1px}');
  });
  it('complex 1', function() {
    var more = new More();
    var s = 'a{margin:(1 + 2)*3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:9}');
  });
  it('complex 2', function() {
    var more = new More();
    var s = 'a{margin:1 + 2*3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:7}');
  });
  it('complex 3', function() {
    var more = new More();
    var s = 'a{margin:(1 + 2/2)*3 + 5}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:11}');
  });
  it('complex 4', function() {
    var more = new More();
    var s = 'a{margin:(2px)*3}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:6px}');
  });
  it('complex 5', function() {
    var more = new More();
    var s = 'a{margin:(2px)*3em}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:6em}');
  });
  it('unit 1', function() {
    var more = new More();
    var s = 'a{margin:1px + 2px}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3px}');
  });
  it('unit 2', function() {
    var more = new More();
    var s = 'a{margin:2px + 2}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:4px}');
  });
  it('unit 3', function() {
    var more = new More();
    var s = 'a{margin:2 + 3px}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:5px}');
  });
  it('unit % 1', function() {
    var more = new More();
    var s = 'a{margin:2 + 50%}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3}');
  });
  it('unit % 2', function() {
    var more = new More();
    var s = 'a{margin:2px - 50%}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1px}');
  });
  it('unit % 3', function() {
    var more = new More();
    var s = 'a{margin:100% * 50%}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:50%}');
  });
  it('unit % 4', function() {
    var more = new More();
    var s = 'a{margin:100% - 10%}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:90%}');
  });
  it('unit % 5', function() {
    var more = new More();
    var s = 'a{margin:100% / 10px}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:10px}');
  });
  it('var number +', function() {
    var more = new More();
    var s = '$a:1;a{margin:$a + 1}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2}');
  });
  it('var unit +', function() {
    var more = new More();
    var s = '$a:1px;a{margin:$a + 1}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2px}');
  });
  it('var unit + unit', function() {
    var more = new More();
    var s = '$a:1px;a{margin:$a + 50%}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1.5px}');
  });
  it('var % +', function() {
    var more = new More();
    var s = '$a:50%;a{margin:$a + 2px}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3px}');
  });
  it('var string +', function() {
    var more = new More();
    var s = '$a:"1";a{margin:$a + 1}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:"1"1}');
  });
  it('+ var number', function() {
    var more = new More();
    var s = '$a:1;a{margin:1 + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2}');
  });
  it('+ var unit', function() {
    var more = new More();
    var s = '$a:1px;a{margin:1 + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2px}');
  });
  it('unit + var unit', function() {
    var more = new More();
    var s = '$a:1px;a{margin:50% + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1.5px}');
  });
  it('+ var %', function() {
    var more = new More();
    var s = '$a:50%;a{margin:2px + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3px}');
  });
  it('+ var string', function() {
    var more = new More();
    var s = '$a:"1";a{margin:1 + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1"1"}');
  });
  it('var + var number', function() {
    var more = new More();
    var s = '$a:1;a{margin:$a + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2}');
  });
  it('var + var unit', function() {
    var more = new More();
    var s = '$a:1px;a{margin:$a + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2px}');
  });
  it('var unit + var unit', function() {
    var more = new More();
    var s = '$a:1px;a{margin:$a + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:2px}');
  });
  it('var + var %', function() {
    var more = new More();
    var s = '$a:50%;a{margin:$a + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:100%}');
  });
  it('var + var string', function() {
    var more = new More();
    var s = '$a:"1";a{margin:$a + $a}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:"1""1"}');
  });
  it('vardecl', function() {
    var more = new More();
    var s = '$a:1;$b=$a + 2;a{margin:$b}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3}');
  });
  it('vardecl with unit', function() {
    var more = new More();
    var s = '$a:1;$b=$a + 2px;@c:$b * 2;a{margin:$b $c}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3px 6px}');
  });
  it('vardecl pre', function() {
    var more = new More();
    var s = 'a{margin:$b}$a:1;$b=$a + 2;';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:3}');
  });
});
describe('ifstmt', function() {
  it('only if', function() {
    var more = new More();
    var s = '$a:1;@if($a){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:1}');
  });
  it('if not', function() {
    var more = new More();
    var s = '@if(0) {a{margin:2}}';
    var res = more.parse(s);
    expect(res).to.eql(' ');
  });
  it('else', function() {
    var more = new More();
    var s = '@if(0){/*no*/div{margin:0}}@else{div{margin:1}}';
    var res = more.parse(s);
    expect(res).to.eql('/*no*/div{margin:1}');
  });
  it('elseif', function() {
    var more = new More();
    var s = '@if(0){}@elseif(2){a{margin:0}}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:0}');
  });
  it('with var', function() {
    var more = new More();
    var s = '@if(0){$a=0;}@else{$a=1;a{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('a{margin:1}');
  });
  it('file', function() {
    var s = fs.readFileSync(path.join(__dirname, 'if.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'if2.css'), res, { encoding: 'utf-8' });
    var s2 = fs.readFileSync(path.join(__dirname, 'if2.css'), { encoding: 'utf-8' });
    expect(res).to.eql(s2);
  });
});
describe('forstmt', function() {
  it('for var', function() {
    var more = new More();
    var s = '@for($a=1;$a<3;$a++){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:1}div{margin:2}');
  });
  it('no var', function() {
    var more = new More();
    var s = '$a=1;@for(;$a<3;$a++){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:1}div{margin:2}');
  });
  it('config', function() {
    var more = new More();
    more.config('$a = 1;');
    var s = '@for(;$a<3;$a++){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:1}div{margin:2}');
  });
  it('for in', function() {
    var more = new More();
    var s = '@for($a in [1,2]){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:0}div{margin:1}');
  });
  it('for of', function() {
    var more = new More();
    var s = '@for($a of [1,2]){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:1}div{margin:2}');
  });
  it('for in for', function() {
    var s = fs.readFileSync(path.join(__dirname, 'for.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'for2.css'), res, { encoding: 'utf-8' });
    var s2 = fs.readFileSync(path.join(__dirname, 'for2.css'), { encoding: 'utf-8' });
    expect(res).to.eql(s2);
  });
  it('for in selector', function() {
    var more = new More();
    var s = '@for($a of [1,2]){.c$a{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('  .c1{margin:1}.c2{margin:2}');
  });
});
describe('unbox', function() {
  it('var', function() {
    var more = new More();
    var s = '$a:~"test";div{margin:$a}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:test}');
  });
  it('fn call', function() {
    var more = new More();
    var s = '$fn($a){margin:$a}div{$fn(~"test")}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:test}');
  });
});
describe('dir', function() {
  it('normal', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '$a = @dir();div{margin:$a}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:' + __dirname + '/img/000.png,' + __dirname + '/img/FFF.png}');
  });
  it('in for', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:' + __dirname + '/img/000.png}div{margin:' + __dirname + '/img/FFF.png}');
  });
  it('with 2nd param', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./", true)){div{margin:$a}}';
    var res = more.parse(s);
    expect(res).to.eql('   div{margin:000.png}div{margin:FFF.png}');
  });
  it('glob', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '$a = @dir("./*.png");div{margin:$a}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:' + __dirname + '/img/000.png,' + __dirname + '/img/FFF.png}');
  });
  it('glob 2nd param', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '$a = @dir("./*.png", true);div{margin:$a}';
    var res = more.parse(s);
    expect(res).to.eql('div{margin:000.png,FFF.png}');
  });
});
describe('global fn', function() {
  it('basename', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){$b = @basename($a);div{margin:$b}}';
    var res = more.parse(s);
    expect(res).to.eql('    div{margin:000.png}  div{margin:FFF.png}');
  });
  it('basename with ext', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){$b = @basename($a, ".png");div{margin:$b}}';
    var res = more.parse(s);
    expect(res).to.eql('     div{margin:000}   div{margin:FFF}');
  });
  it('basename in value', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:@basename($a)}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:000.png}div{margin:FFF.png}');
  });
  it('extname', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){$b = @extname($a);div{margin:$b}}';
    var res = more.parse(s);
    expect(res).to.eql('    div{margin:.png}  div{margin:.png}');
  });
  it('extname in value', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:@extname($a)}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:.png}div{margin:.png}');
  });
  it('width', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){$b = @width($a);div{margin:$b}}';
    var res = more.parse(s);
    expect(res).to.eql('    div{margin:16}  div{margin:16}');
  });
  it('width in value', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:@width($a)}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:16}div{margin:16}');
  });
  it('width in expr', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:1 + @width($a)}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:17}div{margin:17}');
  });
  it('width in prmrexpr', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:(@width($a))}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:16}div{margin:16}');
  });
  it('height', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){$b = @height($a);div{margin:$b}}';
    var res = more.parse(s);
    expect(res).to.eql('    div{margin:16}  div{margin:16}');
  });
  it('height in value', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:@height($a)}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:16}div{margin:16}');
  });
  it('height in expr', function() {
    var more = new More();
    more.path(path.join(__dirname, './img'));
    var s = '@for($a of @dir("./")){div{margin:@height($a) + 1}}';
    var res = more.parse(s);
    expect(res).to.eql('  div{margin:17}div{margin:17}');
  });
});
describe('config', function() {
  it('code', function() {
    var more = new More();
    more.config('$a = 1;');
    var s = 'html{margin:$a}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:1}');
  });
  it('file', function() {
    var more = new More();
    more.configFile(path.resolve(__dirname, './config.css'));
    var s = 'html{margin:$a;$fn()}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:1;padding: 0}');
  });
  it('#vars,#fns,#styles', function() {
    var more = new More();
    more.config('$a = 1;fn1(){padding:0}.test{color:#000}');
    var s = 'html{margin:$a;fn1();@extend .test}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:1;padding:0;color:#000;}');
  });
  it('overwrite #vars,#fns,#styles', function() {
    var more = new More();
    more.config('$a = 1;fn1(){padding:0}.test{color:#000}');
    more.config('$a = 2;fn1(){padding:1}.test{color:#f00}');
    var s = 'html{margin:$a;fn1();@extend .test}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:2;padding:1;color:#f00;}');
  });
  it('mix #vars,#fns,#styles', function() {
    var more = new More();
    more.config('$a = 1;$b = 2;fn1(){padding:0}fn2(){padding:1}.test{color:#000}.test2{color:#fff}');
    more.config('$a = 2;fn1(){padding:1}.test{color:#f00}', true);
    var s = 'html{margin:$a;padding:$b;fn1();fn2();@extend .test;@extend .test2}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:2;padding:2;padding:1;padding:1;color:#f00;color:#fff;}');
  });
  it('#clean', function() {
    var more = new More();
    more.config('$a = 1;fn1(){padding:0}.test{color:#000}');
    more.clean();
    var s = 'html{margin:$a;fn1();@extend .test}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:$a;fn1();}');
  });
  it('static config', function() {
    More.config('$a = 1;fn1(){padding:0}.test{color:#000}');
    var more = new More();
    var s = 'html{margin:$a;fn1();@extend .test}';
    var res = more.parse(s);
    expect(res).to.eql('html{margin:1;padding:0;color:#000;}');
  });
  it('root', function() {
    More.root(path.join(__dirname, './file'));
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './root.css'), true);
    expect(res).to.eql('html{margin:0}');
  });
  it('global mix', function() {
    More.config('$a = 1;fn1(){padding:0}.test{color:#000}');
    More.config('$b = 2;fn2(){padding:1}.test2{color:#f00}', true);
    var s = 'html{margin:$a $b;fn1();fn2();@extend .test;@extend .test2}';
    var res = More.parse(s);
    expect(res).to.eql('html{margin:1 2;padding:0;padding:1;color:#000;color:#f00;}');
  });
});
describe('ignore source css', function() {
  it('normal', function() {
    var more = new More();
    var s = 'html { margin: 1px; }';
    var res = more.parse(s);
    expect(res).to.eql(s);
  });
  it('~hack', function() {
    var more = new More();
    var s = '~a{}';
    var res = more.parse(s);
    expect(res).to.eql(s);
  });
  it('/ in font', function() {
    var more = new More();
    var s = 'a{font:0/0 a}';
    var res = more.parse(s);
    expect(res).to.eql(s);
  });
  it('+-*/ in calc', function() {
    var more = new More();
    var s = 'a{margin:calc(1 + 2/3);}';
    var res = more.parse(s);
    expect(res).to.eql(s);
  });
  it('+-*/ in expression', function() {
    var more = new More();
    var s = '@media (min--moz-device-pixel-ratio: 2/1){p{background:url(x)}}';
    var res = more.parse(s);
    expect(res).to.eql(s);
  });
  it(':hover', function() {
    var more = new More();
    var s = 'html :hover { margin: 1px; }';
    var res = more.parse(s);
    expect(res).to.eql(s);
  });
  it('@import .css?', function() {
    var more = new More();
    var s = '@import url(a.css?123);';
    var res = more.parse(s);
    expect(res).to.eql(s);
  });
  it('960', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/960.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/960-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('animate', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/animate.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/960-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('blueprint', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/blueprint.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/blueprint-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('bootstrap', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/bootstrap.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/bootstrap-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('font-awesome', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/font-awesome.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/font-awesome-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('foundation', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/foundation.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/foundation-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('gumby', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/gumby.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/gumby-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('inuit', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/inuit.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/inuit-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('normalize', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/normalize.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/normalize-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('oocss', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/oocss.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/oocss-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('pure', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/pure.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/pure-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
  it('reset', function() {
    var s = fs.readFileSync(path.join(__dirname, 'file/reset.css'), { encoding: 'utf-8' });
    var more = new More();
    var res = more.parse(s);
    //fs.writeFileSync(path.join(__dirname, 'file/reset-res.css'), res, { encoding: 'utf-8' });
    expect(res).to.eql(s);
  });
});
describe('map', function() {
  it('hash', function() {
    More.map({
      'a.css': 'b"\'.css'
    });
    var more = new More();
    var s = '@import url(a.css);';
    var res = more.parse(s);
    expect(res).to.eql('@import url(b"\'.css);');
  });
  it('function', function() {
    More.map(function(url) {
      return '1' + url;
    });
    var more = new More();
    var s = '@import "a.less";';
    var res = more.parse(s);
    expect(res).to.eql('@import "1a.css";');
  });
  it('file hash', function() {
    More.map({
      'x.css': 'b.css'
    });
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './a.css'), true);
    expect(res).to.eql('a{}');
  });
  it('file function', function() {
    More.map(function() {
      return 'c.css';
    });
    var more = new More();
    var res = more.parseFile(path.join(__dirname, './a.css'), true);
    expect(res).to.eql('b{}');
  });
});