var View = module.exports = function(obj) {
	if(!obj) throw "No configuration object";
	if(!obj.el) throw "No element!";
	if(!obj.vim) throw "No vim instance!";


	this.el = obj.el;
	this.vim = obj.vim;
	
	this.setup();
	this.getDimensions();

};


var style = {
	width: '100%',
	height: '100%',
	'background-color': '#111',
	'color': '#eee',
	'border-radius':'inherit',
	'padding': '15px 5px',
	'font-family':'courier',
	'margin':'none'
};



View.prototype.getDimensions = function() {
	var character = document.createElement('span');
	character.innerHTML = 'a';
	this.pre.appendChild(character);
	var charDimensions = [parseInt(character.offsetWidth),parseInt(character.offsetHeight)*.8];
	var elDimensions = [parseInt(this.el.offsetWidth),parseInt(this.el.offsetHeight)];

	this.dimensions = [Math.floor(elDimensions[0]/charDimensions[0]),Math.floor(elDimensions[1]/charDimensions[1])]
	this.pre.removeChild(character);
};


View.prototype.setup = function() {

	var pre = document.createElement('pre');

	//Simple styling... a stylesheet solution is much better than this.
	for(var i in style) {
		pre.style[i] = style[i];
	}
	this.pre = pre;

	this.el.appendChild(pre);

	this.vim.on('change', function() {
		this.render();
	}.bind(this));

};

View.prototype.render = function() {
	this.pre.innerHTML = '';

	var text = this.vim.text();
	var textEl = this.renderText(text);
	this.pre.appendChild(textEl);
};



View.prototype.renderText = function(text) {
	this.getDimensions();
	var el = document.createElement('pre');
	el.style.margin = '0px';
	var lines = text.split('\n');
	var ct = 0;
	while(lines.length) {
		el.appendChild(this.renderLine(lines.shift() + ' ' ,ct));
		ct++;
	}
	console.log(this.dimensions[1],ct);
	while(ct < this.dimensions[1]) {
		el.appendChild(this.renderBlank());
		ct++
	}
	return el;
};

View.prototype.renderBlank = function() {
	var el = document.createElement('pre');
	el.style.margin = '0px';
	el.className = 'blank';
	el.innerHTML = '~';
	return el;
}


View.prototype.renderLine = function(line, index) {
	if(isSelection(index)) {
		return renderSelection(line,index);
	} else {
		return renderDumb(line,index);	
	}
};

function renderDumb(line, index) {
	var el = document.createElement('pre')
	el.style.margin = '0px';
	var gutter = gutterTemplate(index);
	el.appendChild(gutter);
	var text = document.createElement('span');
	text.innerHTML = line;
	el.appendChild(text)
	return el;
}

	
function renderSelection(line,index) {
	var characters = line.split('');
	var el = document.createElement('pre');
	el.style.margin = '0px';
	var position = [0,index];
	var gutter = gutterTemplate(index);
	el.appendChild(gutter);
	while(characters.length) {
		var character = characters.shift();
		var span = document.createElement('span');
		span.innerHTML = character;
		if(isSelection(position) || line.length === 1) {
			span.className = 'selection';
		}
		if(isCursor(position) || line.length === 1) {
			span.className += ' cursor';
		}
		el.appendChild(span);
		position[0] += 1;
	}
	return el;
}



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
	while(text.length < 5) {
		text += ' ';
	}
	while(text.length > 5) {
		text = text.substring(1);
	}
	text += ' ';
	gutter.innerHTML = text;
	return gutter;
}
