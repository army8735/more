define(function(require, exports, module){exports.default=function(s) {
  //标准选择器写法，将a :hover，input[ type=submit]等空白去除
  return s.trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*(\[|\]|\(|\)|,|>|:|\+|~=|\^=|\$=|\*=|\|=|=)\s*/g, '$1');
};});