##A css pre-compiler by javascript

The css lexer bases on jssc: https://github.com/army8735/jssc

相对于less，more的命名意思是比原本的css多做了一点点，定位于普通产品简化开发位置，而非广义CSS下游框架重量级功能。

目前仅提供层级功能、子文件拆分和层级变量（实际上就是原标准的@import语法，并不擅自发明规范之外的新语法，合并工具请自行实现），AST部分预研css增量压缩器。

web目录下为书写符合AMD/CMD规范的js文件；
server目录下为nodejs环境的module模块。

more的核心理念是：原有的浏览器标准不修改，编译后的代码严格保持调试一致，行数不变更，文件对应关系不改变，满足GoToDefine的先决条件。

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

more.imports():Array

获取解析后的导入文件列表。

more.compress(src:String, agressive:Boolean):String

压缩css文件。此方法基于clean-css，在不传入agressive参数或为false时即为clean-css的原有压缩功能；agressive为true时进行增量压缩，删除重复声明以及合并同类项。

# License

[MIT License]