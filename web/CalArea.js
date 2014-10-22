define(function(require, exports, module){var ImpactChild=function(){var _0=require('./ImpactChild');return _0.hasOwnProperty("ImpactChild")?_0.ImpactChild:_0.hasOwnProperty("default")?_0.default:_0}();
var sort=function(){var _1=require('./sort');return _1.hasOwnProperty("sort")?_1.sort:_1.hasOwnProperty("default")?_1.default:_1}();

function equalArr(a, b) {
  if(a.length == b.length) {
    for(var i = 0, len = a.length; i < len; i++) {
      if(a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}


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
//    console.log(0, self.keys);
//    console.log(1, self.map);
    //初始化构建全部冲突表，横向表示一个选择器中的样式，纵向表示一个样式出现在不同的选择器中
    //只计算纵向，因为横向没必要
    //这个表不同于map表，连续的1表示无冲突可以合并，-1反之，0表示无此样式
    //连续的1中可以出现0，因为无样式即不冲突可合并，但在真正合并时要考虑不能合并没有样式的选择器
    //如此不会出现单个的1，连续的1表示此样式至少有2个相同的选择器里可合并
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
//    console.log(2, matrix);
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
//    console.log(3, this.area)
    //将面积从大到小排列
    sort(this.area, function(a, b) {
      return (a.y2 - a.y1) * a.xs.length < (b.y2 - b.y1) * b.xs.length;
    });
//    console.log(4, this.area)
  }
  CalArea.prototype.record = function(arr, col, start, end) {
    var self = this;
    var add = [];
    //冒泡组成若干个矩阵，将其存入临时数组，先横向增量扩充原有矩阵，再保存自身
    for(var i = start; i < end; i++) {
      if(arr[i] == 1) {
        var temp = [i];
        for(var j = i + 1; j <= end; j++) {
          if(arr[j] == 1) {
            temp.push(j);
            var key = temp.join(',');
            var o = {
              xs: [col],
              ys: temp.concat([]),
              key: key,
              area: temp.length
            };
            if(self.areaMap.hasOwnProperty(key)) {
              self.areaMap.forEach(function(item) {
                sefl.areaMap.push({
                  xs: item.xs.concat(col),
                  ys: item.ys,
                  area: item.area + item.ys.length
                });
              });
            }
            add.push(o);
            //hash保存加快速度，增量扩充已有的矩阵时直接以边为key
            self.areaMap[key] = self.areaMap[key] || [];
            self.areaMap[key].push(o);
          }
        }
      }
    }
    self.area = self.area.concat(add);
  }
  CalArea.prototype.getMax = function() {
    var self = this;
    //以null作标识已无面积可用
    //每次取出最大值后，将其记录，后续如果出现冲突直接跳过
    while(self.area.length) {
      var res = this.area.pop();
      var has = false;
      outer:
      for(var i = 0, len = res.xs.length; i < len; i++) {
        var x = res.xs[i];
        for(var j = 0, len2 = res.ys.length; j < len2; j++) {
          var y = res.ys[j];
          if(self.history.hasOwnProperty([x + ',' + y])) {
            has = true;
            break outer;
          }
        }
      }
      if(has) {
        continue;
      }
      //获取最大面积后要检查合并后是否体积变小
      var val = '';
      var temp = 0;
      var count = 0;
      res.xs.forEach(function(x, i) {
        val += self.keys[x];
        if(i < res.xs.length - 1) {
          val += ';';
        }
      });
      var sel = '';
      var len = res.ys.length;
      res.ys.forEach(function(y, i) {
        sel += self.list[y].s2s;
        if(i < len - 1) {
          sel += ',';
        }
        //注意当被提取的样式所属的选择器不止一个样式时，会多省略1个分号
        if(self.list[y].styles.length > 1) {
          temp++;
        }
        //否则会省略整个选择器
        else {
          temp += self.list[y].s2s.length + 2;
        }
        count++;
      });
      //比较增减
      var reduce = val.length * count + temp;
      var increase = sel.length + 2 + val.length;
//      console.log(5, val, sel, reduce, increase, count, temp)
      if(reduce > increase) {
        for(var i = 0, len = res.xs.length; i < len; i++) {
          var x = res.xs[i];
          for(var j = 0, len2 = res.ys.length; j < len2; j++) {
            var y = res.ys[j];
            self.history[x + ',' + y] = true;
          }
        }
        res.val = val;
        res.sel = sel;
        return res;
      }
    }
    return null;
  }


exports.default=CalArea;});