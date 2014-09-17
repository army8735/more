A css pre-compiler & radical-compressor
====

相对于less，more的命名意思是比原本的css多做了一点点

[![NPM version](https://badge.fury.io/js/more-css.png)](https://npmjs.org/package/more-css)
[![Build Status](https://travis-ci.org/army8735/more.svg?branch=master)](https://travis-ci.org/army8735/more)
[![Coverage Status](https://coveralls.io/repos/army8735/more/badge.png)](https://coveralls.io/r/army8735/more)
[![Dependency Status](https://david-dm.org/army8735/more.png)](https://david-dm.org/army8735/more)

more定位于普通产品简化开发位置，而非广义CSS下游框架重量级功能。more的设计严格遵循css标准规范并进行扩展。

目前提供层级功能、子文件拆分（实际上就是原标准的@import语法）、层级变量、自动拆分字符串、@extend深继承；还有css激进压缩器。

详细见：https://github.com/army8735/more/wiki/%E8%AF%B4%E6%98%8E%E6%96%87%E6%A1%A3

build目录下为nodejs环境的module模块。
web目录下为书写符合AMD/CMD规范的js文件。

more的核心理念是：原有的浏览器标准不修改，编译后的代码严格保持调试一致，行数不变更，文件对应关系不改变，满足GoToDefine的先决条件。

##INSTALL

npm install more-css

##API

### More
* constructor(code:String = '') 传入需要转换的code
* parse(code:String = null):String 转换code，可以为空，否则会覆盖构造函数里传入的code
* parseFile(file:String):String 转换一个css文件
* ast():Object 返回解析后的语法树
* tokens():Array<Object> 返回解析后的词法单元序列
* imports():Array<String> 返回解析后的@import文件列表
* vars(data:Object):Object 设置/读取变量哈希
* styles(data:Object):Object 设置/读取样式哈希
* fns(data:Object):Object 设置/读取方法哈希

### 静态属性
* suffix(str:String):String 全局设置/读取文件后缀名，默认css
* root(str:String):String 全局设置/读取相对根路径
* localRoot(str:String):String 全局设置/读取本地相对根路径
* vars(data:Object):Object 全局设置/读取变量哈希
* styles(data:Object):Object 全局设置/读取样式哈希
* fns(data:Object):Object 全局设置/读取方法哈希

## Demo
* demo目录下是一个web端的实时转换例子，本地浏览需要`npm install`安装依赖
* 依赖的语法解析器来自于`homunculus`：https://github.com/army8735/homunculus
* 在线地址：http://army8735.me/more/demo/

# License
[MIT License]
