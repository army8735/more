##A css pre-compiler by javascript

The css lexer bases on jssc: https://github.com/army8735/jssc

相对于less，more的命名意思是比原本的css多做了一点点，定位于普通产品简化开发位置，而非广义CSS下游框架重量级功能。

目前提供层级功能、子文件拆分（实际上就是原标准的@import语法，并不擅自发明规范之外的新语法）、层级变量、自动拆分字符串、@extend继承；还有css激进压缩器。
详细见：https://github.com/army8735/more/wiki/%E8%AF%B4%E6%98%8E%E6%96%87%E6%A1%A3

web目录下为书写符合AMD/CMD规范的js文件；
server目录下为nodejs环境的module模块。

more的核心理念是：原有的浏览器标准不修改，编译后的代码严格保持调试一致，行数不变更，文件对应关系不改变，满足GoToDefine的先决条件。

##INSTALL

npm install more-css

##API

more.parse(code:String, preVars:Object):String

方法传入源代码，返回解析后的代码，如果出错，返回错误信息。
preVars为解析前预变量，功用在于实现层级变量作用域——即被import的文件可以访问父级变量。此接口可以自定义实现仅文件内作用域或全局作用域。
推荐使用层级作用域，demo文件夹中的import.html和node.js演示了这一特性。

more.tree():Node

获取解析后的语法树。此为内部接口，一般用不到。

more.token():Array<Token>

获取解析后的词法单元列表。此为内部接口，一般用不到。

more.vars():Object<String, String>

获取解析后的变量声明哈希表。键为变量名，值为变量值。

more.global(global:Object<String, String/Number/Boolean>):Object<String, String/Number/Boolean>

设置全局变量，可在所有文件中被访问。局部变量拥有更高优先级。

more.styles():Object<String, String>

获取样式集。键为标准选择器名，值为其对应的样式集和。

more.imports():Array

获取解析后的导入文件列表。

more.compress(src:String, agressive:Boolean):String

压缩css文件。此方法基于clean-css，在不传入agressive参数或为false时即为clean-css的原有压缩功能；agressive为true时进行激进压缩，合并去重聚合以及择优提取公因子，也是安全无冲突的。

激进压缩5个步骤：合并相同选择器merge、去除同一选择器中重复样式声明duplicate、去除同一选择器中被覆盖的样式声明override、聚合相同样式的选择器union、提取公因子extract。

more.root(root:String):String

设置uri的根路径，此在@import解析中会用到，且不使用相对根路径的情况下无需设置。

more.localRoot(localRoot:String):String

设置本地根路径，此在build()方法中用到，且不使用相对根路径的情况下无需设置。

more.less(l:Boolean):Boolean

是否兼容less的相对路径。在uri标准中，'/uri'为相对根路径，'uri'和'./uri'均为相对当前路径，兼容less为仅后者为当前路径，前2为相对根。此设置会干扰@import和build()方法。

more.suffix(s:String):String

设置css文件的后缀名，默认为css，它影响构建@import的文件后缀名。

more.build(file:String, noImport:Boolean = false):String

构建css文件，将一个可能包含多个文件的文件合并为一个单独的字符串。noImport为true时不处理@import的文件，默认包括。

# License

[MIT License]