define(function(require, exports, module){var homunculus=require('homunculus');
var images=require('images');

var fs=require('fs');
var path=require('path');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

function exprstmt(node, fnHash, globalFn, varHash, globalVar, file) {
  switch(node.name()) {
    case Node.DIR:
      return dir(node, fnHash, globalFn, varHash, globalVar, file);
    case Node.BASENAME:
      return basename(node, fnHash, globalFn, varHash, globalVar, file);
    case Node.EXTNAME:
      return extname(node, fnHash, globalFn, varHash, globalVar, file);
    case Node.WIDTH:
      return width(node, fnHash, globalFn, varHash, globalVar, file);
    case Node.HEIGHT:
      return height(node, fnHash, globalFn, varHash, globalVar, file);
    default:
      return eqstmt(node, fnHash, globalFn, varHash, globalVar);
  }
}

function dir(node, fnHash, globalFn, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  var onlyBase = false;
  if(cparam.size() > 2) {
    var p = cparam.leaf(1).first();
    if(p.isToken()) {
      var token = p.token();
      if(token.type() == Token.STRING) {
        s = token.val();
      }
    }
    onlyBase = !!cparam.leaf(3);
  }
  s = path.resolve(file, s);
  if(!fs.existsSync(s)) {
    throw new Error('no such file or directory: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  };
  var state = fs.lstatSync(s);
  if(state.isFile()) {
    s = path.dirname(s);
  }
  else if(!state.isDirectory()) {
    throw new Error('no such file or directory: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var arr = fs.readdirSync(s);
  var res = [];
  arr.forEach(function(item) {
    var s2 = path.join(s, item);
    state = fs.lstatSync(s2);
    if(state.isFile()) {
      onlyBase ? res.push(path.relative(file, s2)) : res.push(s2);
    }
  });
  return res;
}

function basename(node, fnHash, globalFn, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@basename requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  var ext = cparam.leaf(3);
  if(ext) {
    ext = ext.first().token().val();
  }
  else {
    ext = undefined;
  }
  s = path.resolve(file, s);
  return path.basename(s, ext);
}

function extname(node, fnHash, globalFn, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@extname requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  s = path.resolve(file, s);
  return path.extname(s);
}

function width(node, fnHash, globalFn, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@width requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  s = path.resolve(file, s);
  return images(s).width();
}

function height(node, fnHash, globalFn, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@height requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  s = path.resolve(file, s);
  return images(s).height();
}

function eqstmt(node, fnHash, globalFn, varHash, globalVar) {
  if(node.name() == Node.EQSTMT) {
    var rel = relstmt(node.first(), fnHash, globalFn, varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '==':
        return rel == relstmt(node.last(), fnHash, globalFn, varHash, globalVar);
      case '!=':
        return rel != relstmt(node.last(), fnHash, globalFn, varHash, globalVar);
    }
  }
  return relstmt(node, fnHash, globalFn, varHash, globalVar);
}

function relstmt(node, fnHash, globalFn, varHash, globalVar) {
  if(node.name() == Node.RELSTMT) {
    var add = addstmt(node.first(), fnHash, globalFn, varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '>':
        return add > addstmt(node.last(), fnHash, globalFn, varHash, globalVar);
      case '>=':
        return add >= addstmt(node.last(), fnHash, globalFn, varHash, globalVar);
      case '<':
        return add < addstmt(node.last(), fnHash, globalFn, varHash, globalVar);
      case '<=':
        return add <= addstmt(node.last(), fnHash, globalFn, varHash, globalVar);
    }
  }
  return addstmt(node, fnHash, globalFn, varHash, globalVar);
}

function addstmt(node, fnHash, globalFn, varHash, globalVar) {
  if(node.name() == Node.ADDSTMT) {
    var mtpl = mtplstmt(node.first(), fnHash, globalFn, varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '+':
        return mtpl + mtplstmt(node.last(), fnHash, globalFn, varHash, globalVar);
      case '-':
        return mtpl + mtplstmt(node.last(), fnHash, globalFn, varHash, globalVar);
    }
  }
  return mtplstmt(node, fnHash, globalFn, varHash, globalVar);
}

function mtplstmt(node, fnHash, globalFn, varHash, globalVar) {
  if(node.name() == Node.MTPLSTMT) {
    var postfix = postfixstmt(node.first(), fnHash, globalFn, varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '*':
        return postfix * mtplstmt(node.last(), fnHash, globalFn, varHash, globalVar);
      case '/':
        return postfix / mtplstmt(node.last(), fnHash, globalFn, varHash, globalVar);
    }
  }
  return postfixstmt(node, fnHash, globalFn, varHash, globalVar);
}

function postfixstmt(node, fnHash, globalFn, varHash, globalVar) {
  if(node.name() == Node.POSTFIXSTMT) {
    var prmr = prmrstmt(node.first(), fnHash, globalFn, varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '++':
        return prmr.value++;
      case '--':
        return prmr.value--;
    }
  }
  return prmrstmt(node, fnHash, globalFn, varHash, globalVar).value;
}

function prmrstmt(node, fnHash, globalFn, varHash, globalVar) {
  var token = node.first().token();
  var s = token.content();
  switch(token.type()) {
    case Token.VARS:
      var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
      return varHash[k] || globalVar[k] || {};
    case Token.NUMBER:
      return { value: parseFloat(s) };
    case Token.STRING:
      return { value: s };
    default:
      if(s == '(') {
        return { value: exprstmt(node.leaf(1), fnHash, globalFn, varHash, globalVar) };
      }
      else if(s == '[') {
        var arr = [];
        node.leaves().forEach(function(item) {
          if(item.name() == Node.VALUE) {
            var token = item.first().token();
            var s = token.content();
            if(token.type() == Token.VARS) {
              arr.push(varHash[k] || globalVar[k] || {}).value;
            }
            else if(token.type() == Token.NUMBER) {
              arr.push(parseFloat(s));
            }
            else {
              arr.push(s);
            }
          }
        });
        return { value: arr };
      }
  }
}

exports.default=exprstmt;});