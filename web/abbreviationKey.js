define(function(require, exports, module){var KEYS = [
  ['background', 'background-position', 'background-color', 'background-repeat', 'background-attachment', 'background-image'],
  ['font', 'font-family', 'font-size', 'font-style', 'line-height', 'font-variant'],
  ['margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom'],
  ['padding', 'padding-left', 'padding-top', 'padding-right', 'padding-bottom'],
  ['overflow', 'overflow-x', 'overflow-y'],
  ['border', 'border-width', 'border-style', 'border-color',
    'border-left', 'border-top', 'border-right', 'border-bottom',
    'border-left-width', 'border-left-color', 'border-left-style',
    'border-right-width', 'border-right-color', 'border-right-style',
    'border-top-width', 'border-top-color', 'border-top-style',
    'border-bottom-width', 'border-bottom-color', 'border-bottom-style'],
  ['list-style', 'list-style-image', 'list-style-position', 'list-style-type'],
  ['border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius']
];
var KEY_HASH = {};
KEYS.forEach(function(ks, i) {
  ks.forEach(function(k) {
    KEY_HASH[k] = i;
  });
});

exports.default=KEY_HASH;});