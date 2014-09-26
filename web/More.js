define(function(require, exports, module){var fs=require('fs');
var path=require('path');

var homunculus=require('homunculus');

var preImport=function(){var _3361=require('./preImport');return _3361.hasOwnProperty("preImport")?_3361.preImport:_3361.hasOwnProperty("default")?_3361.default:_3361}();
var preVar=function(){var _3362=require('./preVar');return _3362.hasOwnProperty("preVar")?_3362.preVar:_3362.hasOwnProperty("default")?_3362.default:_3362}();
var getVar=function(){var _3363=require('./getVar');return _3363.hasOwnProperty("getVar")?_3363.getVar:_3363.hasOwnProperty("default")?_3363.default:_3363}();
var preFn=function(){var _3364=require('./preFn');return _3364.hasOwnProperty("preFn")?_3364.preFn:_3364.hasOwnProperty("default")?_3364.default:_3364}();
var getFn=function(){var _3365=require('./getFn');return _3365.hasOwnProperty("getFn")?_3365.getFn:_3365.hasOwnProperty("default")?_3365.default:_3365}();
var ignore=function(){var _3366=require('./ignore');return _3366.hasOwnProperty("ignore")?_3366.ignore:_3366.hasOwnProperty("default")?_3366.default:_3366}();
var clone=function(){var _3367=require('./clone');return _3367.hasOwnProperty("clone")?_3367.clone:_3367.hasOwnProperty("default")?_3367.default:_3367}();
var join=function(){var _3368=require('./join');return _3368.hasOwnProperty("join")?_3368.join:_3368.hasOwnProperty("default")?_3368.default:_3368}();
var concatSelector=function(){var _3369=require('./concatSelector');return _3369.hasOwnProperty("concatSelector")?_3369.concatSelector:_3369.hasOwnProperty("default")?_3369.default:_3369}();
var eventbus=function(){var _3370=require('./eventbus');return _3370.hasOwnProperty("eventbus")?_3370.eventbus:_3370.hasOwnProperty("default")?_3370.default:_3370}();
var checkLevel=function(){var _3371=require('./checkLevel');return _3371.hasOwnProperty("checkLevel")?_3371.checkLevel:_3371.hasOwnProperty("default")?_3371.default:_3371}();
var normalize=function(){var _3372=require('./normalize');return _3372.hasOwnProperty("normalize")?_3372.normalize:_3372.hasOwnProperty("default")?_3372.default:_3372}();
var share=function(){var _3373=require('./share');return _3373.hasOwnProperty("share")?_3373.share:_3373.hasOwnProperty("default")?_3373.default:_3373}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var global = {
  vars: {},
  fns: {},
  styles: {},
  suffix: 'css',
  root: '',
  localRoot: ''
};


  function More(code) {
    if(code===void 0)code='';this.code = code;
    this.node = null;
    this.parser = null;
    this.varHash = {};
    this.styleHash = {};
    this.styleTemp = 0;
    this.fnHash = {};
    this.res = '';
    this.index = 0;
    this.msg = null;
    this.autoSplit = false;
    this.selectorStack = [];
    this.importStack = [];
  }
  More.prototype.parse = function(code, ignoreImport) {
    this.preParse(code, ignoreImport);
    if(this.msg) {
      return this.msg;
    }
    return this.parseOn();
  }
  //从入口处发起，递归入口css文件及其@import列表，以页面为作用域，将环境变量保存到data中
  //后面的文件的变量会覆盖前者，styles除外
  More.prototype.mixFrom = function(file, data, list) {
    var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    var more = new More();
    more.preParse(code);
    more.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, '.' + global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      list.push(iFile);
      self.mixFrom(iFile, data);
    });
    var vars = more.vars();
    Object.keys(vars).forEach(function(v) {
      data.vars[v] = vars[v];
    });
    var fns = more.fns();
    Object.keys(fns).forEach(function(v) {
      data.fns[v] = fns[v];
    });
    //执行过程中可能会存在变量未定义，因为使用后面文件中的定义，防止报错将其静音
    share('silence', true);
    more.parseOn();
    share('silence', false);
    var styles = more.styles();
    Object.keys(styles).forEach(function(v) {
      data.styles[v] = data.styles[v] || '';
      data.styles[v] += styles[v];
    });
    relations[file] = relations[file] || {};
    relations[file].styles = clone(data.styles);
  }
  //通过page参数区分是页面中link标签引入的css文件或独立访问，还是被css@import加载的
  //后端可通过request.refferrer来识别
  //简易使用可忽略此参数，此时变量作用域不是页面，而是此文件以及@import的文件
  //按css规范（草案）及历史设计延续，变量作用域应该以页面为准，后出现拥有高优先级
  More.prototype.parseFile = function(file, page) {
    if(page===void 0)page=false;var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    self.preParse(code);
    if(self.msg) {
      return self.msg;
    }
    //page传入时说明来源于页面，删除可能存在与其对应的共享变量作用域
    if(page) {
      delete relations[file];
    }
    //否则是被@import导入的文件，直接使用已存的共享变量
    else if(relations.hasOwnProperty(file)) {
      self.varHash = relations[file].vars;
      self.fnHash = relations[file].fns;
      self.styleHash = relations[file].styles;
      delete relations[file];
      return self.parseOn();
    }
    //先预分析取得@import列表，递归其获取变量
    var data = {
      vars: {},
      fns: {},
      styles: {}
    };
    var list = [];
    self.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, '.' + global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      list.push(iFile);
      self.mixFrom(iFile, data, list);
    });
    //合并@import文件中的变量
    Object.keys(data.vars).forEach(function(v) {
      if(!self.varHash.hasOwnProperty(v)) {
        self.varHash[v] = data.vars[v];
      }
    });
    Object.keys(data.fns).forEach(function(v) {
      if(!self.fnHash.hasOwnProperty(v)) {
        self.fnHash[v] = data.fns[v];
      }
    });
    self.styleHash = data.styles;
    //page传入时说明来源于页面，将变量存储于@import的文件中，共享变量作用域
    if(page) {
      list.forEach(function(iFile) {
        relations[iFile] = relations[iFile] || {};
        relations[iFile].vars = self.varHash;
        relations[iFile].fns =  self.fnHash;
      });
    }
    return self.parseOn();
  }
  More.prototype.preParse = function(code, ignoreImport) {
    if(code) {
      this.code = code;
    }
    this.parser = homunculus.getParser('css');
    try {
      this.node = this.parser.parse(this.code);
      this.ignores = this.parser.ignore();
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return this.msg = e.toString();
    }
    this.importStack = preImport(this.node, this.ignores, this.index, ignoreImport);
    preVar(this.node, this.ignores, this.index, this.varHash);
    preFn(this.node, this.ignores, this.index, this.fnHash);
  }
  More.prototype.parseOn = function() {
    this.preJoin();
    this.join(this.node);
    return this.res;
  }
  More.prototype.preJoin = function() {
    while(this.ignores[this.index]) {
      if(this.ignores[this.index].type() == Token.ignores) {
        this.res += this.ignores[this.index].content().replace(/\S/g, ' ');
      }
      else {
        var ig = this.ignores[this.index];
        var s = ig.content();
        if(ig.type() == Token.COMMENT && s.indexOf('//') == 0) {
          s = '/*' + s.slice(2) + '*/';
        }
        this.res += s;
      }
      this.index++;
    }
  }
  More.prototype.join = function(node) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        eventbus.emit(node.nid());
        var token = node.token();
        //标识下一个string是否自动拆分
        if(token.content() == '~') {
          self.autoSplit = true;
          ignore(token, self.ignores, self.index);
        }
        else if(token.type() != Token.STRING) {
          self.autoSplit = false;
        }
        if(!token.ignore) {
          //~String拆分语法
          if(self.autoSplit && token.type() == Token.STRING) {
            var s = getVar(token, self.varHash, global.vars);
            var c = s.charAt(0);
            if(c != "'" && c != '"') {
              c = '"';
              s = c + s + c;
            }
            s = s.replace(/,\s*/g, c + ',' + c);
            self.res += s;
            self.autoSplit = false;
          }
          else {
            var str = getVar(token, self.varHash, global.vars);
            if(token.import) {
              if(!/\.\w+['"]?$/.test(str)) {
                str = str.replace(/(['"]?)$/, '.css$1');
              }
              else if(!/\.css+['"]?$/.test(str)) {
                str = str.replace(/\.\w+(['"]?)$/, '.css$1');
              }
            }
            self.res += str;
          }
        }
        while(self.ignores[++self.index]) {
          var ig = self.ignores[self.index];
          var s = ig.type() == Token.ignores ? ig.content().replace(/\S/g, ' ') : ig.content();
          if(ig.type() == Token.COMMENT && s.indexOf('//') == 0) {
            s = '/*' + s.slice(2) + '*/';
          }
          if(!ig.ignore) {
            self.res += s;
          }
        }
      }
    }
    else {
      eventbus.emit(node.nid(), true);
      switch(node.name()) {
        case Node.STYLESET:
          self.styleset(true, node);
          break;
        case Node.BLOCK:
          self.block(node);
          break;
        case Node.FNC:
          self.res += getFn(node, self.ignores, self.index, self.fnHash, global.fns, self.varHash, global.vars);
          break;
        case Node.EXTEND:
          self.extend(node);
          break;
        case Node.IMPORT:
          self.impt(node);
          break;
      }
      //递归子节点
      var leaves = node.leaves();
      leaves.forEach(function(leaf) {
        self.join(leaf);
      });
      eventbus.emit(node.nid(), false);
      switch(node.name()) {
        case Node.STYLESET:
          self.styleset(false, node);
          break;
      }
    }
  }
  More.prototype.styleset = function(start, node) {
    var self = this;
    if(start) {
      var block = node.leaf(1);
      block.hasLevel = checkLevel(block);
      //忽略掉所有二级以上选择器，由block之前生成
      if(block.hasLevel || self.selectorStack.length) {
        ignore(node.first(), self.ignores, self.index);
      }
      //二级以上选择器样式集需先结束
      if(this.selectorStack.length) {
        var prev = node.prev();
        //前一个是styleset或者{时，会造成空样式
        if(prev.name() == Node.STYLESET
          || prev.name() == Node.TOKEN
            && prev.token().content() == '{') {
          //
        }
        else {
          var s = concatSelector(self.selectorStack);
          normalize(s).split(',').forEach(function(se) {
            self.saveStyle(se, self.res.slice(self.styleTemp, self.res.length));
          });
          self.res += '}';
        }
      }
      //存储当前层级父选择器集合
      var s = join(node.first(), self.ignores, self.index, true);
      self.selectorStack.push(s.split(','));
    }
    else {
      if(node.last().last().prev().name() != Node.STYLESET) {
        var s = concatSelector(self.selectorStack);
        var temp = self.res.lastIndexOf('}');
        normalize(s).split(',').forEach(function(se) {
          self.saveStyle(se, self.res.slice(self.styleTemp, temp));
        });
      }
      self.selectorStack.pop();
      if(self.selectorStack.length) {
        var s = concatSelector(self.selectorStack);
        var next = node.next();
        //当多级styleset结束时下个是styleset或}，会造成空白样式
        if(next && (next.name() == Node.STYLESET
          || next.name() == Node.TOKEN
            && next.token().content() == '}')) {
          //
        }
        else {
          self.res += s + '{';
          normalize(s).split(',').forEach(function(se) {
            self.styleTemp = self.res.length;
          });
        }
      }
    }
  }
  More.prototype.block = function(node) {
    var self = this;
    var last = node.last();
    var prev = last.prev();
    //当多级block的最后一个是styleset或}，会造成空白样式
    if(prev.name() == Node.STYLESET) {
      eventbus.on(last.nid(), function() {
        ignore(last, self.ignores, self.index);
      });
    }
    var s = concatSelector(this.selectorStack);
    var first = node.leaf(1);
    if(first.name() == Node.STYLESET) {
      eventbus.on(first.prev().nid(), function() {
        ignore(first.prev(), self.ignores, self.index);
      });
    }
    else {
      if(node.hasLevel || this.selectorStack.length > 1) {
        self.res += s;
      }
      normalize(s).split(',').forEach(function(se) {
        self.styleTemp = self.res.length + 1;
      });
    }
  }
  More.prototype.extend = function(node) {
    var self = this;
    ignore(node, self.ignores, self.index);
    var i = self.index;
    while(self.ignores[++i]) {}
    var s = normalize(join(node.leaf(1), self.ignores, i));
    var targets = s.split(',');
    targets.forEach(function(se) {
      self.res += self.styleHash[se] || '';
    });
    var se = normalize(concatSelector(self.selectorStack));
    se = se.split(',');
    eventbus.on(node.parent().nid(), function(start) {
      if(!start) {
        var styleArray = Object.keys(self.styleHash);
        targets.forEach(function(se1) {
          styleArray.forEach(function(se2) {
            if(se2.indexOf(se1) == 0 && se2.length != se1.length && se1.indexOf(se2) == -1) {
              var pseudo = concatSelector([se].concat([[se2.slice(se1.length)]]));
              pseudo = normalize(pseudo);
              if(self.styleHash[se2]) {
                self.res += pseudo + '{' + self.styleHash[se2] + '}';
                self.styleHash[pseudo] = self.styleHash[pseudo] || '';
                self.styleHash[pseudo] += self.styleHash[se2];
              }
            }
          });
        });
      }
    });
  }
  More.prototype.saveStyle = function(k, v) {
    this.styleHash[k] = this.styleHash[k] || '';
    v = v.trim();
    if(v.length && v.charAt(v.length - 1) != ';') {
      v += ';';
    }
    this.styleHash[k] += v;
  }
  More.prototype.impt = function(node) {
    var url = node.leaf(1);
    if(url.size() == 1) {
      url.first().token().import = true;
    }
    else {
      url.leaf(2).token().import = true;
    }
  }
  More.prototype.ast = function() {
    return this.node;
  }
  More.prototype.tokens = function() {
    return this.parser.lexer.tokens();
  }
  More.prototype.imports = function() {
    return this.importStack;
  }

  More.prototype.vars = function(o, mix) {
    if(o) {
      if(mix) {
        var self = this;
        Object.keys(o).forEach(function(k) {
          self.varHash[k] = o[k];
        });
      }
      else {
        this.varHash = clone(o);
      }
    }
    return this.varHash;
  }
  More.prototype.fns = function(o, mix) {
    if(o) {
      if(mix) {
        var self = this;
        Object.keys(o).forEach(function(k) {
          self.fnHash[k] = o[k];
        });
      }
      else {
        this.fnHash = o;
      }
    }
    return this.fnHash;
  }
  More.prototype.styles = function(o, mix) {
    if(o) {
      if(mix) {
        var self = this;
        Object.keys(o).forEach(function(k) {
          self.styleHash[k] = o[k];
        });
      }
      else {
        this.styleHash = clone(o);
      }
    }
    return this.styleHash;
  }
  More.prototype.config = function(str, mix) {
    var self = this;
    if(str) {
      var more = new More();
      more.parse(str);
      self.vars(more.vars(), mix);
      self.fns(more.fns(), mix);
      self.styles(more.styles(), mix);
    }
    return {
      vars: self.vars(),
      fns: self.fns(),
      styles: self.styles()
    };
  }
  More.prototype.configFile = function(file, mix) {
    return this.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  More.prototype.clean = function() {
    this.varHash = {};
    this.fnHash = {};
    this.styleHash = {};
  }
  More.prototype.buildFile = function(file, page) {
    if(page===void 0)page=false;var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    self.preParse(code, true);
    if(self.msg) {
      return self.msg;
    }
    //build前清空所有关系数据
    if(page) {
      relations = {};
    }
    //先预分析取得@import列表，递归其获取变量
    var data = {
      vars: {},
      fns: {},
      styles: {}
    };
    var list = [];
    self.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, '.' + global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      list.push(iFile);
      self.mixFrom(iFile, data, []);
    });
    //合并@import文件中的变量
    Object.keys(data.vars).forEach(function(v) {
      if(!self.varHash.hasOwnProperty(v)) {
        self.varHash[v] = data.vars[v];
      }
    });
    Object.keys(data.fns).forEach(function(v) {
      if(!self.fnHash.hasOwnProperty(v)) {
        self.fnHash[v] = data.fns[v];
      }
    });
    self.styleHash = data.styles;
    var res = '';
    //page传入时说明来源于页面，将变量存储于@import的文件中，共享变量作用域
    if(page) {
      list.forEach(function(iFile) {
        res += More.buildIn(iFile, {
          vars: self.varHash,
          fns: self.fnHash
        });
      });
      relations = {};
    }
    //否则作用域为顺序，递归执行build即可
    else {
      list.forEach(function(iFile) {
        res += More.buildFile(iFile);
      });
    }
    res += self.parseOn();
    return res;
  }
  More.buildIn=function(file, data) {
    var more = new More();
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    more.preParse(code, true);
    if(more.msg) {
      return more.msg;
    }
    var res = '';
    more.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, '.' + global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      res += More.buildIn(iFile, data);
    });
    more.vars(data.vars);
    more.fns(data.fns);
    more.styles(relations[file].styles);
    res += more.parseOn();
    return res;
  }

  More.parse=function(code) {
    return (new More()).parse(code);
  }
  More.parseFile=function(file) {
    return (new More()).parseFile(code);
  }
  More.buildFile=function(file, page) {
    return (new More).buildFile(file, page);
  }
  More.suffix=function(str) {
    if(str===void 0)str=null;if(str) {
      global.suffix = str.replace(/^\./, '');
    }
    return global.suffix;
  }
  More.root=function(str) {
    if(str===void 0)str=null;if(str) {
      global.root = str;
    }
    return global.root;
  }
  More.localRoot=function(str) {
    if(str===void 0)str=null;if(str) {
      global.localRoot = str;
    }
    return global.localRoot;
  }
  More.vars=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.varHash[k] = o[k];
        });
      }
      else {
        global.varHash = o;
      }
    }
    return global.varHash;
  }
  More.fns=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.fnHash[k] = o[k];
        });
      }
      else {
        global.fnHash = o;
      }
    }
    return global.fnHash;
  }
  More.styles=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.styleHash[k] = o[k];
        });
      }
      else {
        global.styleHash = o;
      }
    }
    return global.styleHash;
  }
  More.config=function(str, mix) {
    if(str) {
      var more = new More();
      more.parse(str);
      More.vars(more.vars(), mix);
      More.fns(more.fns(), mix);
      More.styles(more.styles(), mix);
    }
    return global;
  }
  More.configFile=function(file, mix) {
    return More.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  More.clean=function() {
    global = {
      vars: {},
      fns: {},
      styles: {},
      suffix: 'css',
      root: '',
      localRoot: ''
    };
    return global;
  }
  More.addKeyword=function(kw) {
    homunculus.getClass('rule', 'css').addKeyWord(kw);
  }


exports.default=More;});