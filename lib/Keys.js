mousetrap = require('../components/component-mousetrap');
/** Simple way to listen to keystrokes

*/
var Keys = module.exports = function() {

	//No-op, to be replaced with your listener
	this.fn = function() {};

};

/** Listen, supporting IE

*/
var addListener = function(obj,verb,fn) {
	if('addEventListener' in obj) {
		obj.addEventListener(verb,fn);
	} else {
		obj.attachEvent('on' + verb,fn);
	}
};

//Both characters we want to prevent and where our uses differ from mousetrap
var specialChars = {
	enter: '\n',
	tab: '\t',
	escape: 'esc',
	backspace: '\b',
	space: ' ',
	meta: '',
	shift: ''
};

var reverseShiftMap = {};
for(var i in mousetrap.SHIFT_MAP) {
	reverseShiftMap['' + mousetrap.SHIFT_MAP[i]] = '' + i;
}


/** Initialize on the object (presumabley, document)

*/
Keys.prototype.listen = function(obj) {
	addListener(obj,'keydown', function(e) {
		var key = mousetrap.characterFromEvent(e);
		if(e.shiftKey) {
			if(key in reverseShiftMap) {
				key = reverseShiftMap[key];
			} else {
				key = key.toUpperCase();
			}
		}
		if(key.toLowerCase() in specialChars) {
			e.preventDefault();
			key = specialChars[key];
			if(!key || !key.length) return;
		}
		this.fn(key);
	}.bind(this));
};
