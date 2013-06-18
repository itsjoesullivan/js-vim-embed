var Vim = require('js-vim'),
	View = require('./lib/view'),
	Keys = require('./lib/keys');

/* set up */
var init = function(obj) {

	//Ok
	window.vim = new Vim();

	//Hmm.
	vim.edit = function(obj) {
		vim.view = new View({
			el: obj.el,
			vim: vim
		});
	};

	//Set up keys
	keys = new Keys();
	keys.listen(document);

	keys.fn = function(key) {
		vim.exec(key);
	};

	//Want to return a vim here, not a view
	//return vim;
};

init();	
