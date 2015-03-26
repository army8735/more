module homunculus from 'homunculus';
module fs from 'fs';
module path from 'path';

import join from './join';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

function exprstmt(node, fnHash, globalFn, varHash, globalVar, file) {
  switch(node.name()) {
    case Node.DIR:
      return dir(node, fnHash, globalFn, varHash, globalVar, file);
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

export default exprstmt;