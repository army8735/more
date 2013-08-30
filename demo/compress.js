var more = require('../server/more.js');
var s = '@import "a.css";\
	@charset "gbk";\
	div{color:#F00;color:#000;color:#000;width:100%;}\
	div{}\
	div{color:#F00 !important;}\
	p{color:#000;width:50%;}\
	p{width:10px\\9;}\
	span{color:#FFF;height:100%;}\
	div{color:#FFF;}\
	div p{width:100%;}';

var res = more.compress(s);
console.log(res);
console.log('==========');
var res2 = more.compress(s, true);
console.log(res2);

console.log('==========');
console.log(more.test(res));