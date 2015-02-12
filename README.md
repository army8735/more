A css pre-compiler & radical-compressor
====

相对于less，more的命名意思是比原本的css多做了一点点。

[![NPM version](https://badge.fury.io/js/more-css.png)](https://npmjs.org/package/more-css)
[![Build Status](https://travis-ci.org/army8735/more.svg?branch=master)](https://travis-ci.org/army8735/more)
[![Coverage Status](https://coveralls.io/repos/army8735/more/badge.png)](https://coveralls.io/r/army8735/more)
[![Dependency Status](https://david-dm.org/army8735/more.png)](https://david-dm.org/army8735/more)

more定位于普通产品简化开发位置，而非广义CSS下游框架重量级功能。more的设计严格遵循css标准规范并进行扩展。

目前提供层级功能、子文件拆分（实际上就是原标准的@import语法）、层级变量、自动拆分字符串、深继承、函数混入、四则运算；还有css激进压缩器。
对于没用到这些功能的css代码，more会智能识别不变更。more不会动普通的css代码。

详细见：https://github.com/army8735/more/wiki/document

build目录下为nodejs环境的module模块。
web目录下为书写符合AMD/CMD规范的js文件。

more的核心理念是：原有的浏览器标准不修改，编译后的代码严格保持调试一致，行数不变更，文件对应关系不改变，满足GoToDefine的先决条件。

##INSTALL

npm install more-css

##API

### More
* constructor(code:String = '') 传入需要预编译的code
* parse(code:String = null):String 预编译code，可以为空，否则会覆盖构造函数里传入的code
* parseFile(file:String, combo:Boolean = false):String 转换css文件，combo表明是否静态合并@import的文件
 * combo详见[parseFile高级用法](https://github.com/army8735/more/wiki/document#parsefile高级用法)
* ast():Object 返回解析后的语法树
* tokens():Array<Object> 返回解析后的词法单元序列
* imports():Array<String> 返回解析后的@import文件列表
* vars(data:Object):Object 设置/读取变量哈希
* styles(data:Object):Object 设置/读取样式哈希
* fns(data:Object):Object 设置/读取方法哈希
* config(str:String):void 预编译一段css并将其结果作为此more对象之后预编译时的全局变量
* configFile(file:String):void 同上，传入一个文件的路径
* clean():void 清空设置

### 静态属性
* parse(code:String = ''):String 快捷方式预编译，无需new步骤
* parseFile(code:String = '', combo:Boolean = false):String 快捷方式预编译文件，无需new步骤
* suffix(str:String):String 全局设置/读取文件后缀名，默认css
* root(str:String):String 全局设置/读取相对本地文件的根路径
* vars(data:Object):Object 全局设置/读取变量哈希
* styles(data:Object):Object 全局设置/读取样式哈希
* fns(data:Object):Object 全局设置/读取方法哈希
* config(str:String):void 预编译一段css并将其结果作为之后全局预编译时的全局变量
* configFile(file:String):void 同上，传入一个文件的路径
* clean():void 清空全局设置
* addKeyWord(kw:String/Array<String>):void 添加未知的css属性关键字以支持分析
* compress(code:String, radical:Boolean = false):String 基于clean-css压缩css代码，radical表明是否使用激进安全算法
* compress(code:String, options:Object = { processImport: false }, radical:Boolean = false):String 同上，增加options选项，传给clean-css
* map(data:Object/Function):Object/Function 全局设置/读取映射表，用以将@import的文件名作匹配替换处理

## Demo
* demo目录下是一个web端的实时转换例子，本地浏览需要`npm install`安装依赖
* 依赖的语法解析器来自于`homunculus`：https://github.com/army8735/homunculus
* 在线地址：http://army8735.me/more/demo/
* 压缩率对比：http://goalsmashers.github.io/css-minification-benchmark/

# License
[MIT License]
