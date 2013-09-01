var more = require('../server/more.js');
var s = '@import "a.css";\
	@charset "gbk";\
	div{color:red;color:#000\\0;width:0 !important;color:#0F9;width:100%;color:#FFF;width:3px}\
	div{}\
	div{color:#F00 !important;}\
	p{color:#000;width:50%;}\
	p{width:10px\\9;}\
	span{color:#FFF;height:100%;}\
	div{color:#FFF;}\
	div p{width:100%;}\
	div p{*width:1px;}\
	b{font-size:12px;color:#000;*width:1px}\
	i{color:#000;*width:1px}\
	a{margin:0;padding:0}h3{padding:0;margin:0}';

var res = more.compress(s);
console.log(res);
console.log('==========');
var res2 = more.compress(s, true);
console.log(res2);