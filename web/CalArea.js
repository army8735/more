define(function(require, exports, module){var ImpactChild=function(){var _0=require('./ImpactChild');return _0.hasOwnProperty("ImpactChild")?_0.ImpactChild:_0.hasOwnProperty("default")?_0.default:_0}();
var sort=function(){var _1=require('./sort');return _1.hasOwnProperty("sort")?_1.sort:_1.hasOwnProperty("default")?_1.default:_1}();


  function CalArea(list, map, keys) {
    this.list = list;
    this.map = map;
    this.keys = keys;
    this.area = [];
    this.history = {};
    this.impact = new ImpactChild();
    this.init();
  }
  CalArea.prototype.init = function() {
    var self = this;
    console.log(self.map);
    //初始化构建全部冲突表，横向表示一个选择器中的样式，纵向表示一个样式出现在不同的选择器中
    //只计算纵向，因为横向没必要
    //这个表不同于map表，连续的1表示无冲突可以合并，0反之，2表示已被合并过，3表示可合并但结果反而变大没有合并
    //如此不会出现单个的1，连续的1表示此样式至少有2个相同的选择器里可合并
    //计算最大面积时可按矩阵中组成1的最多的矩形计算
    //并忽略掉横坐标：意为横向相隔可忽略
    var res = [];
    self.map.forEach(function(arr, idx) {
      //先填充
      var nrr = new Array(arr.length);
      for(var i = 0, len = nrr.length; i < len; i++) {
        nrr[i] = 0;
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
                  nrr[k] = 1;
                }
                i = j + 1;
              }
            }
          }
        }
      }
      res.push(nrr);
    });
    console.log(res);
    //冒泡递归计算面积，每个节点可使用多次，具体去重在另外逻辑中做
    //纵列的标识不会单个出现，至少有2个，因为可合并样式至少会出现在2个选择器中
    res.forEach(function(arr, i) {
      for(var j = 0, len = arr.length; j < len - 1; j++) {
        if(arr[j] == 1) {
          var k = arr.indexOf(1, j + 1);
          self.record(i, j, k);
          j = k + 1;
        }
      }
    });
    console.log(this.area)
    //将面积从大到小排列
    sort(this.area, function(a, b) {
      return (a.y2 - a.y1) * a.xs.length < (b.y2 - b.y1) * b.xs.length;
    });
  }
  CalArea.prototype.record = function(col, start, end) {
    var self = this;
    //遍历之前的矩阵，发现可以扩充的部分则增量扩充，即原有的复制后扩充，保证所有方式都存储
    self.area.forEach(function(item) {
      //冒泡组合出此次可填充的矩阵边
      for(var i = start; i < end - 1; i++) {
        for(var j = i + 1; j < end; j++) {
          if(item.y1 == i && item.y2 == j) {
            self.area.push({
              xs: item.xs.concat(col),
              y1: item.y1,
              y2: item.y2
            });
          }
        }
      }
    });
    //本身可以组成一个矩阵，将其存入
    self.area.push({
      xs: [col],
      y1: start,
      y2: end
    });
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
        for(var y = res.y1; y < res.y2; y++) {
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
      res.xs.forEach(function(x, i) {
        val += self.keys[x];
        if(i < res.xs.length - 1) {
          val += ';';
        }
      });
      var sel = '';
      for(var i = res.y1; i <= res.y2; i++) {
        sel += self.list[i].s2s;
        if(i < res.y2) {
          sel += ',';
        }
        //注意当被提取的样式所属的选择器不止一个样式时，会多省略1个分号
        if(self.list[i].styles.length) {
          temp++;
        }
      }
      //比较增减
      var reduce = val.length * (res.y2 - res.y1 + 1) + temp;
      var increase = sel.length + 2 + val.length;
      console.log(val, sel, reduce, increase)
      if(reduce > increase) {
        for(var i = 0, len = res.xs.length; i < len; i++) {
          var x = res.xs[i];
          for(var y = res.y1; y < res.y2; y++) {
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