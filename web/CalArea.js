define(function(require, exports, module){var ImpactChild=function(){var _0=require('./ImpactChild');return _0.hasOwnProperty("ImpactChild")?_0.ImpactChild:_0.hasOwnProperty("default")?_0.default:_0}();
var sort=function(){var _1=require('./sort');return _1.hasOwnProperty("sort")?_1.sort:_1.hasOwnProperty("default")?_1.default:_1}();


  function CalArea(list, map, keys) {
    this.list = list;
    this.map = map;
    this.keys = keys;
    this.area = [];
    this.areaMap = {};
    this.history = {};
    this.impact = new ImpactChild();
    this.init();
  }
  CalArea.prototype.init = function() {
    var self = this;
    //console.log(0, self.keys);
    //console.log(1, self.map);
    //初始化构建全部冲突表，横向表示一个选择器中的样式，纵向表示一个样式出现在不同的选择器中
    //只计算纵向，因为横向没必要
    //这个表不同于map表，连续的1表示无冲突可以合并，-1反之，0表示无此样式
    //连续的1中可以出现0，因为无样式即不冲突可合并，但在真正合并时要考虑不能合并没有样式的选择器
    //如此不会出现单个的1和0，头和尾一定是1，连续的1表示此样式至少有2个相同的选择器里可合并
    //计算最大面积时可按矩阵中组成1的最多的矩形计算
    //并忽略掉横坐标：意为横向相隔可忽略
    var matrix = [];
    self.map.forEach(function(arr, idx) {
      //先填充
      var nrr = new Array(arr.length);
      for(var i = 0, len = nrr.length; i < len; i++) {
        nrr[i] = -1;
      }
      //冒泡计算，可合并一定是连续出现，因为是单个样式
      //不会出现2个可合并串有重合或相邻的情况
      for(var i = 0, len = arr.length; i < len - 1; i++) {
        //要判断是否有此样式
        if(arr[i] > -1) {
          for(var j = len - 1; j > i; j--) {
            //要判断是否有此样式
            if(arr[j] > -1) {
              if(self.impact.noImpact(self.list, i, j, arr[j])) {
                for(var k = i; k <= j; k++) {
                  nrr[k] = self.map[idx][k] > - 1 ? 1 : 0;
                }
                i = j + 1;
              }
            }
          }
        }
      }
      matrix.push(nrr);
    });
    //console.log(2, matrix);
    //冒泡递归计算面积，每个节点可使用多次，具体去重在另外逻辑中做
    //纵列的标识不会单个出现，至少有2个，因为可合并样式至少会出现在2个选择器中
    matrix.forEach(function(arr, i) {
      for(var j = 0, len = arr.length; j < len - 1; j++) {
        if(arr[j] == 1) {
          var k = arr.indexOf(-1, j + 2);
          if(k == -1) {
            k = len;
          }
          self.record(arr, i, j, k - 1);
          j = k + 1;
        }
      }
    });
    //console.log(3, this.area)
    //将面积从大到小排列
    sort(this.area, function(a, b) {
      return a.area > b.area;
    });
    //console.log(4, this.area)
  }
  CalArea.prototype.record = function(arr, col, start, end) {
    var self = this;
    var ys = [];
    for(var i = start; i <= end; i++) {
      if(arr[i] == 1) {
        ys.push(i);
      }
    }
    var key = ys.join(',');
    var hasContain = false;
    //遍历寻找重叠区域
    self.area.forEach(function(area) {
      if(area.key.indexOf(key) > -1) {
        hasContain = true;
      }
      if(area.start <= end && area.end >= start) {
        var newYs = self.overlap(area.ys, ys);
        //防止单行无效合并
        if(newYs.length < 2) {
          return;
        }
        var newKey = newYs.join(',');
        if(self.areaMap.hasOwnProperty(newKey)) {
          var exist = self.areaMap[newKey];
          if(exist.xs.indexOf(col) == -1) {
            exist.xs.push(col);
            exist.area += exist.xs.length;
          }
        }
        else if(area.xs.indexOf(col) == -1) {
          var xs = area.xs.concat([col]);
          var o = {
            xs: xs,
            ys: newYs,
            start: start,
            end: end,
            key: newKey,
            area: xs.length * newYs.length
          };
          self.area.push(o);
          self.areaMap[newKey] = o;
        }
      }
    });
    //本身没有被包含时需添加
    if(!hasContain) {
      var o = {
        xs: [col],
        ys: ys,
        start: start,
        end: end,
        key: key,
        area: ys.length
      };
      self.area.push(o);
      self.areaMap[key] = o;
    }
  }
  CalArea.prototype.overlap = function(ys1, ys2) {
    var arr = [];
    ys1.forEach(function(y) {
      if(ys2.indexOf(y) > -1) {
        arr.push(y);
      }
    });
    return arr;
  }
  CalArea.prototype.getMax = function() {
    var self = this;
    //以null作标识已无面积可用
    //每次取出最大值后，将其记录，后续如果出现冲突直接跳过
    while(self.area.length) {
      var res = this.area.pop();
      //获取最大面积后要检查合并后是否体积变小
      var reduce = 0;
      var increase = 0;
      var val = '';
      res.xs.forEach(function(x, i) {
        val += self.keys[x];
        reduce += self.keys[x].length;
        if(i < res.xs.length - 1) {
          val += ';';
        }
      });
      reduce *= res.ys.length;
      var sel = '';
      var len = res.ys.length;
      res.ys.forEach(function(y, i) {
        sel += self.list[y].s2s;
        if(i < len - 1) {
          sel += ',';
        }
        var count = 0;
        self.list[y].styles.forEach(function(style) {
          if(!style.ignore) {
            count++;
          }
        });
        //注意当被提取的样式所属的选择器不止一个样式时，会多省略1个分号
        if(count > 1) {
          reduce++;
        }
        //否则会省略整个选择器
        else {
          reduce += self.list[y].s2s.length + 2;
        }
      });
      increase = sel.length + 2 + val.length;
      //无论是否采用，此次结果的矩阵都要被清除
      //然后根据是否使用，再处理其它面积中和此矩阵冲突的要进行分割或裁减
      //因为没有使用的话直接pass即可，无需处理冲突
      delete self.areaMap[res.key];
      //console.log(5, sel, val, reduce, increase);
      //console.log(res);
      //比较增减
      if(reduce > increase) {
        self.conflict(res);
        res.val = val;
        res.sel = sel;
        return res;
      }
    }
    return null;
  }
  CalArea.prototype.conflict = function(res) {
    var self = this;
    //标记使用到的矩阵点
    var hash = {};
    res.xs.forEach(function(x) {
      res.ys.forEach(function(y) {
        hash[x + ',' + y] = true;
      });
    });
    //遍历，发现冲突则重新计算
    self.area.forEach(function(area) {
      var cf = false;
      outer:
      for(var i = 0, len = area.xs.length; i < len; i++) {
        var x = area.xs[i];
        for(var j = 0, len2 = area.ys.length; j < len2; j++) {
          var y = area.ys[j];
          if(hash.hasOwnProperty(x + ',' + y)) {
            cf = true;
            break outer;
          }
        }
      }
      if(cf) {
        delete self.areaMap[area.key];
        area.ignore = true;
        area.xs.forEach(function(x) {
          var ys = [];
          area.ys.forEach(function(y) {
            if(!hash.hasOwnProperty(x + ',' + y)) {
              ys.push(y);
            }
          });
          if(ys.length > 1) {
            self.insert(x, ys);
          }
        });
      }
    });
    //清除掉冲突的并重新排序
    for(var i = self.area.length - 1; i >= 0; i--) {
      if(self.area[i].ignore) {
        self.area.splice(i, 1);
      }
    }
    sort(self.area, function(a, b) {
      return a.area > b.area;
    });
  }
  CalArea.prototype.insert = function(col, ys) {
    var self = this;
    var start = ys[0];
    var end = ys[ys.length - 1];
    var key = ys.join(',');
    var hasContain = false;
    //类似record
    self.area.forEach(function(area) {
      if(area.ignore) {
        return;
      }
      if(area.key.indexOf(key) > -1) {
        hasContain = true;
      }
      if(area.start <= end && area.end >= start) {
        var newYs = self.overlap(area.ys, ys);
        //防止单行无效合并
        if(newYs.length < 2) {
          return;
        }
        var newKey = newYs.join(',');
        if(self.areaMap.hasOwnProperty(newKey)) {
          var exist = self.areaMap[newKey];
          if(exist.xs.indexOf(col) == -1) {
            exist.xs.push(col);
            exist.area += exist.xs.length;
          }
        }
        else if(area.xs.indexOf(col) == -1) {
          var xs = area.xs.concat([col]);
          var o = {
            xs: xs,
            ys: newYs,
            start: start,
            end: end,
            key: newKey,
            area: xs.length * newYs.length
          };
          self.area.push(o);
          self.areaMap[newKey] = o;
        }
      }
    });
    if(!hasContain) {
      var o = {
        xs: [col],
        ys: ys,
        start: start,
        end: end,
        key: key,
        area: ys.length
      };
      self.area.push(o);
      self.areaMap[key] = o;
    }
  }


exports.default=CalArea;});