define(function(require, exports, module) {
	var Rule = require('./Rule'),
		LineSearch = require('../match/LineSearch'),
		LineParse = require('../match/LineParse'),
		CompleteEqual = require('../match/CompleteEqual'),
		RegMatch = require('../match/RegMatch'),
		Token = require('../Token'),
		character = require('../../util/character'),
		CssRule = Rule.extend(function() {
			var self = this;
			Rule.call(self, CssRule.KEYWORDS);

			self.vl = {};
			CssRule.VALUES.forEach(function(o) {
				self.vl[o] = true;
			});

			self.cl = {};
			CssRule.COLORS.forEach(function(o) {
				self.cl[o] = true;
			});
			
			self.addMatch(new CompleteEqual(Token.BLANK, character.BLANK));
			self.addMatch(new CompleteEqual(Token.TAB, character.TAB));
			self.addMatch(new CompleteEqual(Token.ENTER, character.ENTER));
			self.addMatch(new CompleteEqual(Token.LINE, character.LINE));

			self.addMatch(new LineSearch(Token.COMMENT, '/*', '*/', true));
			self.addMatch(new LineParse(Token.STRING, '"', '"', false));
			self.addMatch(new LineParse(Token.STRING, "'", "'", false));
			
			self.addMatch(new RegMatch(Token.NUMBER, /^-\d+\.?\d*[a-z%]*/i));

			self.addMatch(new RegMatch(Token.ID, /^[a-z_\-*][\w\-_]+/i));
			self.addMatch(new RegMatch(Token.ID, /^\\[a-z\d]{4}/i));
			self.addMatch(new CompleteEqual(Token.IMPORTANT, '!important'));

			self.addMatch(new RegMatch(Token.NUMBER, /^\.\d+[a-z%]*/i));

			['{', '}', ',', ';', '::', ':', '-', '(', ')', '>', '+', '/', '[', ']', '$=', '|=', '*=', '~=', '^=', '=', '~', '*'].forEach(function(o) {
				self.addMatch(new CompleteEqual(Token.SIGN, o));
			});
			self.addMatch(new RegMatch(Token.HEAD, /^@[\w-]+/));
			self.addMatch(new RegMatch(Token.VARS, /^\$[\w-]+/));

			self.addMatch(new RegMatch(Token.NUMBER, /^#[\da-f]{6}/i));
			self.addMatch(new RegMatch(Token.NUMBER, /^#[\da-f]{3}/i));
			self.addMatch(new RegMatch(Token.NUMBER, /^\d+\.?\d*[a-z%]*/i));
			
			self.addMatch(new RegMatch(Token.ID, /^[.#]?[a-z_][\w\-_.#]*/i));

			self.addMatch(new CompleteEqual(Token.HACK, '\\9\\0'));
			self.addMatch(new CompleteEqual(Token.HACK, '\\0'));
			self.addMatch(new CompleteEqual(Token.HACK, '\\9'));
		}).methods({
			values: function() {
				return this.vl;
			},
			colors: function() {
				return this.cl;
			}
		}).statics({
			KEYWORDS: 'appearance ascent aspect-ratio azimuth background-attachment background-clip background-color background-image background-origin background-position background-repeat background-size background baseline bbox border-collapse border-color border-image border-radius border-spacing border-style border-top border-right border-bottom border-left border-top-color border-right-color border-bottom-color border-left-color border-top-style border-right-style border-bottom-style border-left-style border-top-width border-right-width border-bottom-width border-left-width border-width border bottom box-shadow box-sizing cap-height caption-side centerline clear clip color color-index content counter-increment counter-reset cue-after cue-before cue cursor definition-src descent device-aspect-ratio device-height device-width direction display elevation empty-cells filter float font-size-adjust font-family font-size font-stretch font-style font-variant font-weight font grid height interpolation-mode left letter-spacing line-height list-style-image list-style-position list-style-type list-style margin-top margin-right margin-bottom margin-left margin marker-offset marks mathline max-aspect-ratio max-device-width max-height max-width min-aspect-ratio min-device-width min-height min-width monochrome nav-down nav-left nav-right nav-up opacity orphans outline-color outline-style outline-width orientation outline overflow-x overflow-y overflow padding-top padding-right padding-bottom padding-left padding page page-break-after page-break-before page-break-inside pause pause-after pause-before pitch pitch-range play-during position quotes resize resolution right richness scan size slope src speak-header speak-numeral speak-punctuation speak speech-rate stemh stemv stress table-layout text-align top text-decoration text-indent text-justify text-overflow text-shadow text-transform transform transition transition-property unicode-bidi unicode-range units-per-em vertical-align visibility voice-family volume white-space widows width widths word-break word-spacing word-wrap x-height z-index zoom'.split(' '),
			VALUES: 'above absolute all alpha always aqua armenian attr aural auto avoid background baseline behind below bicubic bidi-override black blink block blue bold bolder border-box both bottom break-all break-word braille capitalize caption center center-left center-right circle close-quote code collapse color compact condensed content-box continuous counter counters crop cross crosshair cursive dashed decimal decimal-leading-zero default digits disc dotted double ease embed embossed e-resize expanded extra-condensed extra-expanded fantasy far-left far-right fast faster fixed format fuchsia gray green groove handheld hebrew help hidden hide high higher icon inline-table inline inset inside inter-ideograph invert italic justify landscape large larger left-side leftwards level lighter lime linear-gradient linear line-through list-item local loud lower-alpha lowercase lower-greek lower-latin lower-roman lower low ltr marker maroon medium message-box middle mix move narrower navy ne-resize no-close-quote none no-open-quote no-repeat normal nowrap n-resize nw-resize oblique olive once opacity open-quote outset outside overline padding-box pointer portrait pre print projection purple red relative repeat repeat-x repeat-y rgb ridge right right-side rightwards rtl run-in screen scroll semi-condensed semi-expanded separate se-resize show silent silver slower slow small small-caps small-caption smaller soft solid speech spell-out square s-resize static status-bar sub super sw-resize table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row table-row-group teal text-bottom text-top text thick thin top transparent tty tv ultra-condensed ultra-expanded underline upper-alpha uppercase upper-latin upper-roman url visible wait white wider width w-resize x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow'.split(' '),
			COLORS: 'black silver gray white maroon red purple fuchsia green lime olive yellow navy blue teal aqua'.split(' ')
		});
	module.exports = CssRule;
});