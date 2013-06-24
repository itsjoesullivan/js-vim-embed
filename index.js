var Vim = require('js-vim'),
	ElView = require('./lib/View'),
	Keys = require('./lib/keys');

require('./lib/style');

/* set up */
var init = function(obj) {

	//Ok
	window.vim = new Vim();
	var elView;

	//Hmm.
	vim.edit = function(obj) {
		if(!obj || typeof obj !== 'object' || !('el' in obj)) throw "vim.edit required { el: <HTMLElement> }";
		var text = obj.el.innerHTML;
		obj.el.innerHTML = '';
		elView = new ElView({
			el: obj.el,
		});
		vim.view.lines = elView.dimensions[1];
		vim.view.cols = elView.dimensions[0];
		if(text.length) {
			vim.curDoc.text(text);
			vim.exec('G')
			vim.exec('$')
		}
	
	};

	//Get dimensions
//	var dimensions = getDimensions();
//	vim.view.cols = dimensions.cols;
//	vim.view.lines = dimensions.lines;


	vim.view.on('change', function() {
		elView.write(vim.view.getText());
	});
	

	

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
