var View = module.exports = function(obj) {
	if(!obj) throw "No configuration object";
	if(!obj.el) throw "No element!";
	if(!obj.vim) throw "No vim instance!";


	this.el = obj.el;
	this.vim = obj.vim;
	
	this.setup();

};


var style = {
	width: '100%',
	height: '100%',
	'background-color': '#111',
	'color': '#eee',
	'border-radius':'inherit',
	'padding': '15px'
};


View.prototype.setup = function() {

	var pre = document.createElement('pre');

	//Simple styling... a stylesheet solution is much better than this.
	for(var i in style) {
		pre.style[i] = style[i];
	}

	this.el.appendChild(pre);

	this.vim.on('change', function() {
		pre.innerHTML = this.vim.text();
	}.bind(this));

};
