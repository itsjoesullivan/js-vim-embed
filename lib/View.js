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
	'padding': '15px',
	'font-family':'courier',
	'margin':'none'
};



View.prototype.getDimensions = function() {
	var character = document.createElement('span');
	character.innerHTML = 'a';
	this.pre.appendChild(character);
	var charDimensions = [parseInt(character.offsetWidth),parseInt(character.offsetHeight)];
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
	var el = document.createElement('pre');
	var lines = text.split('\n');
	var ct = 1;
	while(lines.length) {
		el.appendChild(this.renderLine(lines.shift(),ct));
		ct++;
	}
	return el;
};

View.prototype.renderLine = function(line) {
	var el = document.createElement('pre');
	el.style.margin = '0px'
	el.innerHTML = line;
	return el;
};
