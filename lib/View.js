var View = module.exports = function(obj) {
	if(!obj) throw "No configuration object";
	if(!obj.el) throw "No element!";

	this.el = obj.el;
	this.setup();
	this.getDimensions();

};


View.prototype.getDimensions = function() {
	var character = document.createElement('span');
	character.innerHTML = 'a';
	this.pre.appendChild(character);
	var char2 = document.createElement('span');
	char2.innerHTML = 'b';
	this.pre.appendChild(char2);
	var char3 = document.createElement('pre');
	char3.style.margin = '0px';
	char3.innerHTML = 'c';
	this.pre.appendChild(char3);
	var charHeight = char3.offsetTop - character.offsetTop;
	var charWidth = char2.offsetLeft - character.offsetLeft;
	var charDimensions = [charWidth,charHeight];
	var elDimensions = [parseInt(this.pre.offsetWidth),parseInt(this.pre.offsetHeight)];
	
	//Record dimensions.
	this.dimensions = [Math.floor(elDimensions[0]/charDimensions[0]),Math.floor((elDimensions[1]-14)/charDimensions[1])]

	//Remove the temporary elements.
	this.pre.removeChild(character);
	this.pre.removeChild(char2);
	this.pre.removeChild(char3);
};


View.prototype.setup = function() {
	var pre = document.createElement('pre');
	pre.className = 'vim-container';
	this.pre = pre;
	this.el.appendChild(pre);
};

View.prototype.write = function(text) {
	this.pre.innerHTML = text;
};

function isCursor(pos) {
	var cursor = vim.cursor().position();
	return pos[1] === cursor.line && pos[0] === cursor.char;
}

function isSelection(pos) {
	var selection = vim.curDoc.selection();
	if(typeof pos === 'number') {
		return pos >= selection[0].line && pos <= selection[1].line
	} else {
		pos = {
			line: pos[1],
			char: pos[0]
		}
	}
	if(pos.line < selection[0].line || pos.line > selection[1].line) return false;
	if(pos.line === selection[0].line && selection[0].line === selection[1].line) {
		return pos.char >= selection[0].char && pos.char < selection[1].char;	
	}
	if(pos.line === selection[0].line) {
		return pos.char >= selection[0].char;
	}
	if(pos.line === selection[1].line) {
		return pos.char < selection[1].char;
	}
	return true;
}

function gutterTemplate(index) {
	var gutter = document.createElement('span')
	gutter.className = 'gutter'
	var text = '    ' + (index+1);
	while(text.length < 4) {
		text += ' ';
	}
	while(text.length > 4) {
		text = text.substring(1);
	}
	text += ' ';
	gutter.innerHTML = text;
	return gutter;
}
