define(function(require, exports, module){var sort=function(){var _0=require('./sort');return _0.hasOwnProperty("sort")?_0.sort:_0.hasOwnProperty("default")?_0.default:_0}();
var CalArea=function(){var _1=require('./CalArea.js');return _1.hasOwnProperty("CalArea")?_1.CalArea:_1.hasOwnProperty("default")?_1.default:_1}();
var Impact=function(){var _2=require('./Impact');return _2.hasOwnProperty("Impact")?_2.Impact:_2.hasOwnProperty("default")?_2.default:_2}();

var homunculus=require('homunculus');

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');


  function RegionCompress(list) {
    this.list = list;
    this.insert = {};
    this.impact = new Impact();
  }
  RegionCompress.prototype.compress = function() {
    /* 获取新数据结构list后，处理以下5个步骤：
     1合并相同选择器（检测是否冲突）、
     2去除重复样式（合并后可能造成的重复，包括优先级重复）、
     3去除被覆盖的样式（合并后可能造成的缩写覆盖）、
     4聚合相同样式的选择器（样式确保唯一后排序，不冲突则合并相同的）、
     5提取公因子（最大图形选择算法），
     2和3已被clean-css实现，无需重复
     */
    this.merge(this.list);
    this.merge(this.list, true);
    this.preJoin(this.list);
    this.union(this.list);
    this.union(this.list, true);
    this.preRelease(this.list);
    this.extract(this.list);
    return this.join(this.list);
  }
  //合并相同选择器，向前向后两个方向
  RegionCompress.prototype.merge = function(list, direction) {
    //冒泡处理，因为可能处理后留有多个相同选择器，但后面的选择器可继续递归过程
    var res = false;
    if(direction) {
      outer:
        for(var i = list.length - 1; i > 0; i--) {
          for(var j = i - 1; j >= 0; j--) {
            if(list[i].s2s == list[j].s2s) {
              if(this.impact.noImpact(list, i, j)) {
                list[i].styles = list[j].styles.concat(list[i].styles);
                list.splice(j, 1);
                this.impact.upCache(j);
                i--;
                j--;
                res = true;
              }
              else {
                continue outer;
              }
            }
          }
        }
    }
    else {
      outer:
        for(var i = 0; i < list.length - 1; i++) {
          for(var j = i + 1; j < list.length; j++) {
            if(list[i].s2s == list[j].s2s) {
              if(this.impact.noImpact(list, i, j)) {
                list[i].styles = list[i].styles.concat(list[j].styles);
                list.splice(j, 1);
                this.impact.upCache(j);
                j--;
                res = true;
              }
              else {
                continue outer;
              }
            }
          }
        }
    }
    //递归处理，直到没有可合并的为止
    if(res) {
      this.merge(list, direction);
    }
  }
  RegionCompress.prototype.preJoin = function(list) {
    //为union做准备，将选择器的样式拼接在一起存至value属性下，可直接==比较
    list.forEach(function(item) {
      sort(item.styles, function(a, b) {
        return a.key > b.key;
      });
      item.value = '';
      var len = item.styles.length;
      item.styles.forEach(function(style, i) {
        item.value += style.key;
        item.value += ':';
        item.value += style.content.toLowerCase();
        if(i < len - 1) {
          item.value += ';';
        }
      });
    });
  }
  RegionCompress.prototype.preRelease = function(list) {
    //union完成后删除value属性
    list.forEach(function(item) {
      delete item.value;
    });
  }
  //聚合相同样式的选择器
  RegionCompress.prototype.union = function(list, direction) {
    var res = false;
    if(direction) {
      outer:
        for(var i = list.length - 1; i > 0; i--) {
          for(var j = i - 1; j >= 0; j--) {
            if(list[i].value == list[j].value) {
              if(this.impact.noImpact(list, i, j)) {
                list[i].selectors = list[i].selectors.concat(list[j].selectors);
                sort(list[i].selectors);
                list[i].s2s = list[i].selectors.join(',');
                list.splice(j, 1);
                this.impact.upCache(j);
                i--;
                j--;
                res = true;
              }
              else {
                continue outer;
              }
            }
          }
        }
    }
    else {
      outer:
        for(var i = 0; i < list.length - 1; i++) {
          for(var j = i + 1; j < list.length; j++) {
            if(list[i].value == list[j].value) {
              if(this.impact.noImpact(list, i, j)) {
                list[i].selectors = list[i].selectors.concat(list[j].selectors);
                sort(list[i].selectors);
                list[i].s2s = list[i].selectors.join(',');
                list.splice(j, 1);
                this.impact.upCache(j);
                j--;
                res = true;
              }
              else {
                continue outer;
              }
            }
          }
        }
    }
    if(res) {
      this.union(list, direction);
    }
  }
  //提取公因子
  RegionCompress.prototype.extract = function(list) {
    //统计单个样式的出现信息，以便后续操作
    //keys按顺序保存键值，即以单个样式本身toString()
    //hash将相同单个样式收集到一个数组里
    var hash = {};
    var keys = [];
    list.forEach(function(item, i) {
      item.styles.forEach(function(style, j) {
        var key = style.key + ':' + style.content;
        if(!hash.hasOwnProperty(key)) {
          hash[key] = [];
          keys.push(key);
        }
        hash[key].push({
          parent: item,
          i: i,
          j: j
        });
      });
    });
    //index记录对应索引的选择器是否出现此样式
    //比如index[0]记录keys[0]的样式出现在哪些位置上，位置为选择器索引
    //max标明最大样式数
    var index = [];
    var max = 0;
    keys.forEach(function(o) {
      var same = hash[o];
      var temp = {};
      same.forEach(function(o2) {
        temp[o2.i] = o2.j;
        max = Math.max(max, o2.i);
      });
      index.push(temp);
    });
    //以单个样式为横坐标，选择器顺序索引为纵坐标，组成一个二维数组
    //索引和位置对应，表示此样式出现在对应选择器的第几个，空的地方填-1
    var map = [];
    index.forEach(function(temp, idx) {
      var arr = new Array(max);
      for(var i = 0; i <= max; i++) {
        arr[i] = -1;
      }
      Object.keys(temp).forEach(function(i) {
        arr[parseInt(i)] = temp[i];
      });
      map.push(arr);
    });
    //同列相同部分视为一个矩形面积，不同列拥有相同位置和高度可合并计算面积——即拥有相同样式的不同选择器以优先取最大面积合并
    //当然至少要2列，因为1列为只出现在1个选择器中没必要提
    //面积择优算法：计算矩阵中可合并的所有面积，以最大面积优先合并
    //舍弃采用单行合并，即拥有某个样式的所有选择器尝试合并
    //当然因为优先级冲突不一定能够整行合并，应该递归其所有组合尝试，代价太大暂时忽略
    var calArea = new CalArea(list, map, keys);
    var res;
    while(res = calArea.getMax()) {
      var y = res.ys[0];
      this.insert[y] = this.insert[y] || '';
      this.insert[y] += res.sel + '{' + res.val + '}';
      res.xs.forEach(function(x) {
        res.ys.forEach(function(y) {//console.log(x, y, keys[x], list[y].s2s)
          list[y].styles[map[x][y]].ignore = true;
        });
      });
    }
  }
  RegionCompress.prototype.join = function(list) {
    var self = this;
    var body = '';
    list.forEach(function(item, i) {
      //extract提炼出来的插入
      if(self.insert.hasOwnProperty(i)) {
        body += self.insert[i];
      }
      //有可能全部ignore为空
      var first = true;
      item.styles.forEach(function(style) {
        if(!style.ignore) {
          if(first) {
            body += item.s2s;
            body += '{';
            first = false;
          }
          body += style.key;
          body += ':';
          body += style.content;
          body += ';';
        }
      });
      if(!first) {
        body = body.slice(0, body.length - 1) + '}';
      }
    });
    return body;
  }


exports.default=RegionCompress;});