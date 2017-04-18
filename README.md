A css pre-compiler&radical-compressor
====

Relative to the less, the more the name mean, like css more than a little bit.

[![NPM version](https://badge.fury.io/js/more-css.png)](https://npmjs.org/package/more-css)
[![Build Status](https://travis-ci.org/army8735/more.svg?branch=master)](https://travis-ci.org/army8735/more)
[![Coverage Status](https://coveralls.io/repos/army8735/more/badge.png)](https://coveralls.io/r/army8735/more)
[![Dependency Status](https://david-dm.org/army8735/more.png)](https://david-dm.org/army8735/more)

more – Positioning of the ordinary products simplify the development of location, rather than a broad definition of CSS downstream framework for heavyweight functions. more design strict adherence to css standards, norms and expansion.

Currently provide the level of functionality, document splitting (actually it's the standard@import syntax), the levels of variables, automatically split strings, deep inheritance, a function of mixing, the rule of four; css radical compression.
To not use these functions to the css code, The more the cognitive't change. more not normal css code.

Details (Chinese): https://github.com/army8735/more/wiki/文档<br/>
English：https://github.com/army8735/more/wiki/document

build directory for nodejs environment module module.
web directory for writing compatible with AMD/CMD norms js document.

the core concept: the original browser standards no changes, editing, translation, code, strictly to maintain tuning consistency, the numbers don't change, document the relationship don't change to meet GoToDefine prerequisite.

## INSTALL

npm install more-css

## API

### More
* constructor(code:String = '') In need to pre-compile the code
* parse(code:String = null, type:int = More.INDEPENDENT):String Pre-compiled code, it can be empty, otherwise it will cover the structure, function, where in the code; and type for address@import types
* parseFile(file:String, type:int = More.INDEPENDENT):String Convert css files; type the address@import types
 * type for details, see [import high use](https://github.com/army8735/more/wiki/%E6%96%87%E6%A1%A3#import高级用法)
* ast():Object Return, the syntax tree.
* tokens():Array\<Object> Return, the term module sequence.
* imports():Array\<String> Return,@import Document List.
* vars(data:Object):Object Set/read variables hash.
* styles(data:Object):Object Set/read the style hash.
* fns(data:Object):Object Set/read methods hash.
* path(file:String):String Set/read the document path
* config(str:String):void Pre-compiled paragraph of css and its results as more of the image after pre-compile time global variables
* configFile(file:String):void Ibid., in a file path
* clean():void Empty set

### Static attributes
* parse(code:String = null, type:int = More.INDEPENDENT):String Quick a way to pre-compile, without the need for new steps
* parseFile(file:String, type:int = More.INDEPENDENT):String Quick a way of pre-editing and translation of documents, without the need for new steps
* suffix(str:String):String The authority to set/read a document name list, the default css
* root(str:String):String The authority to set/read the local document root path
* vars(data:Object):Object Global set/read variables hash.
* styles(data:Object):Object Global set/read pattern Hashi
* fns(data:Object):Object Global set/read methods hash.
* path(file:String):String The authority to set/read the document path
* config(str:String):void Pre-compiled paragraph of css and its results, as after the overall compilation time of a global variable
* configFile(file:String):void Ibid., in a file path
* clean():void Clear the Board to set
* addKeyWord(kw:String/Array\<String>):void Add unknown css attributes of key words to support analysis
* compress(code:String, radical:Boolean = false):String Based on clean-css compress css code, radical indicates whether or not to use a radical of the security algorithm.
* compress(code:String, options:Object = { processImport: false }, radical:Boolean = false):String Ibid., an increase of options Options to pass clean-css
* map(data:Object/Function):Object/Function The authority to set/read the mapping table, use the@import of the name of the file as a matching replacement handle
* INDEPENDENT:int = 0 Types, processing of import documents, rewrite the paper concludes with css
* INCLUDE:int = 1 Types, processing of import documents, sharing role, don't rewrite document end
* COMPLEX:int = 2 Types, processing of import documentation, segregation, don't rewrite document end

## Demo
* demo Directory is a web-end real-time conversion example of this, local browsing needs `npm install`Installation-dependent
* Dependency grammar parser. from the `homunculus`：https://github.com/army8735/homunculus
* On-line address：http://army8735.me/more/demo/
* Compression rate comparison：http://goalsmashers.github.io/css-minification-benchmark/

# License
[MIT License]
