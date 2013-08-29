var http = require('http');
var url = require('url');
var fs = require('fs');
var more = require('../server/more.js');
var hash = {};

http.createServer(function(request, response) {
	var params = url.parse(request.url, true);
	console.log("Request for " + params.path + " received.");

	if(/\.css$/.test(params.pathname)) {console.log(1, hash)
		response.writeHead(200, { 'Content-Type': 'text/css' });
		var parent = params.path.replace(/\w+\.css$/, '');
		var f = module.filename.replace(/\w+\.js$/, '') + /\w+\.css$/.exec(params.pathname)[0];
		var s = fs.readFileSync(f, {
			encoding: 'utf-8'
		});
		var pre = hash[params.path];console.log(2, pre)
		var str = more.parse(s, pre);
		var vars = more.vars();
		var imports = more.imports();
		imports.forEach(function(im) {
			if(im.charAt(0) == '/') {
				hash[im] = vars;
			}
			else {
				im = parent + im;
				im = im.replace(/\w+\/\.\.\//g, '').replace(/\.\//g, '');
				hash[im] = vars;
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