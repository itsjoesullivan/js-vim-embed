(function() {
	var style = document.createElement('style');
	var text = require('../style.css');
	style.setAttribute("type", "text/css");
	if (style.styleSheet) {   // for IE
		style.styleSheet.cssText = text;
	} else {                // others
		var textnode = document.createTextNode(text);
		style.appendChild(textnode);
	}
	var h = document.getElementsByTagName('head')[0];
	h.appendChild(style);
})();
