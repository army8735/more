import ImpactChild from './ImpactChild';

class CalArea {
  constructor(list, map) {
    this.list = list;
    this.map = map;
    this.history = {};
    this.impact = new ImpactChild();
    this.init();
  }
  init() {
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
      //不会出现2个可合并串有重合的情况
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
    console.log(res)
    //冒泡递归计算面积从大到小排列，每个节点可使用多次，具体去重在另外逻辑中做
  }
  getMax() {
    //因为存在最大面积的
  }
  useMax() {
    //
  }
}

export default CalArea;