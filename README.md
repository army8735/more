The css lexer base on jssc: https://github.com/army8735/jssc

相对于less，more的命名意思是比原本的css多做了一点点，而不滥加华而不实的功能。

初版仅提供层级功能和子文件拆分（实际上就是原标准的@import语法），AST部分预研css增量压缩器。

more的核心理念是：原有的浏览器标准不修改，编译后的代码调试保持一致，行数不变更。

## License

[MIT License]