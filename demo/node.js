var http = require('http');
var url = require('url');
var fs = require('fs');
var more = require('../server/more.js');
var hash = {};
var hash2 = {};

http.createServer(function(request, response) {
	var params = url.parse(request.url, true);
	console.log("Request for " + params.path + " received.");

	if(/\.css$/.test(params.pathname)) {
		response.writeHead(200, { 'Content-Type': 'text/css' });
		var parent = params.path.replace(/\w+\.css$/, '');
		var f = module.filename.replace(/\w+\.js$/, '') + /\w+\.css$/.exec(params.pathname)[0];
		var s = fs.readFileSync(f, {
			encoding: 'utf-8'
		});
		var pre = hash[params.path];
		var pre2 = hash2[params.path];
		var str = more.parse(s, pre, pre2);
		var vars = more.vars();
		var styles = more.styles();
		var imports = more.imports();
		imports.forEach(function(im) {
			if(im.charAt(0) == '/') {
				hash[im] = vars;
				hash2[im] = styles;
			}
			else {
				im = parent + im;
				im = im.replace(/\w+\/\.\.\//g, '').replace(/\.\//g, '');
				hash[im] = vars;
				hash2[im] = styles;
			}
		});
		response.write(str);
	}
	else if(/\.html$/.test(params.pathname)) {
		response.writeHead(200, { 'Content-Type': 'text/html' });
		var f = module.filename.replace(/\w+\.js$/, '') + /\w+\.html$/.exec(params.pathname)[0];
		var s = fs.readFileSync(f, {
			encoding: 'utf-8'
		});
		response.write(s);
	}

	response.end();
}).listen(80);

console.log(module.filename + "\nServer has started.");