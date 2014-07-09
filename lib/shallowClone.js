'use strict';

module.exports = shallowClone;

// clone anything but objects to avoid shared references
function shallowClone(obj) {
  var cloned = {};
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) {
      continue;
    }
    if (typeof (obj[i]) !== 'object') {
      cloned[i] = obj[i];
    }
  }
  return cloned;
}
