Array.prototype.next = function() {
  var i = this.__i || 0;
  if(i >= this.length - 1) {
    return {
      done: true
    };
  }
  else {
    i++;
    return {
      done: i >= this.length - 1,
      value: this[i - 1]
    }
  }
};