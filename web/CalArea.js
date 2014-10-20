define(function(require, exports, module){var ImpactChild=function(){var _0=require('./ImpactChild');return _0.hasOwnProperty("ImpactChild")?_0.ImpactChild:_0.hasOwnProperty("default")?_0.default:_0}();


  function CalArea(list, map) {
    this.impact = new ImpactChild();
    this.list = list;
    this.map = map;//console.log(map)
  }
  CalArea.prototype.getMax = function() {
    //
  }


exports.default=CalArea;});