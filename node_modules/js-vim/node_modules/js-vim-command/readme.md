#Vim Command Parser

Vim's commands are powerful. This library is meant to parse those that fit a general syntax of:

	[count][operator][count][motion]

As defined in [vim docs](http://vimdoc.sourceforge.net/htmldoc/intro.html#notation)

##Usage

var Parser = require('vim-command-parser'),
	parser = new Parser();

##Format

Input: command string

```javascript
parser.parse('c3fa')
```

Output: object

```javascript
{
	description: '{operator}{count}{motion}',
	value: ['c', 3, 'fa']
}
```

Why is this useful? Imagine implementing the actual commands like so:

```javascript
//Define command handlers
var commands = {
	'{count}{motion}': function(count, motion) {
		while(ct--) this.exec(motion);
	}
};
```

```javascript
//Use the parser to map keystrokes to handlers
var keyBuffer = '';
vim.on('key', function(key) {
	keyBuffer += key;
	var command = parser.parse(keyBuffer);
	if(command.description in commands) commands[command.description].apply(vim,command.value
});
```


##TODO:

- Registers


