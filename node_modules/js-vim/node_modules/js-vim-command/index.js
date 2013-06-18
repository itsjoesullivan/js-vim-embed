var Parser = function() {};

/** Parse a command

input: string of text
output: object containing the interpreted string and an array with each element 

*/
Parser.prototype.parse = function(command) {

	var motion = this.getLastMotion(command);

	var prefix = command;

	var command = {
		description: '',
		value: []
	};
	

	var next;

	while(prefix.length) {
		next = this.getLastCount(prefix) || this.getLastMotion(prefix) || this.getLastOperator(prefix);
		if(!next) break
		prefix = next.prefix;	
		command.description = next.description + command.description;
		command.value.unshift(next.value);
		command.prefix = next.prefix;
	}
	return command.description.length ? command : false;



	var x = this.getLastCount(command) || this.getLastMotion(command) ||	this.getLastOperator(command);

		
		
/*


	{count}

	{count}{op}{motion}
	{op}{count}{motion}
	{count}{op}{count}{motion}

	{motion}

	{
*/
	
};
//Test for operator
var opTest = new RegExp('\(\.\*\?\)\(c\|d\|y\|~\|g~\|gu\|gU\|!\|=\|gg\|g\\?\|>\|<\|zf\|g@\)$');
/** Determines whether command is an operator, returning it if so */
Parser.prototype.getLastOperator = function(command) {
	var op = opTest.exec(command)
	if(!op) return;
	return {
		description: '{operator}',
		value: op[2],
		prefix: op[1]
	};
};

/** Get motions, of which there are a variety
	h l 0 ^ g_ | (f|F|t|T){char} ; , k j - + _ G
	
word motions:
	e E w W b B ge gE

text object motions:
	( ) { } ]] [] [[ []

*/
var motions = ['h','l','0','\\$','\\^','g_','\\|','\(?:f\|F\|t\|T\)\(\?\:.\)',';',',','k','j','\\+','-','_','(?:[1-9]+[0-9]*|)G','e','E','w','W','b','B','ge','gE','\\(','\\)','\\{','\\}','\\]\\]','\\]\\[','\\[\\[','\\[\\]','(?:\\?|\\/)(?:\\S+)\\n'];
var motionTest = new RegExp('\(\.\*\?\)\(' + motions.join('\|') + '\)\$');
Parser.prototype.getLastMotion = function(command) {
	var motion = motionTest.exec(command);	
	if(!motion) return;
	return {
		description: '{motion}',
		value: motion[2],
		prefix: motion[1]
	}
};


var countTest = /(.*?)([1-9]+[0-9]*)$/
Parser.prototype.getLastCount = function(command) {
	var countResult = countTest.exec(command);
	if(!countResult) return;
	return {
		description: '{count}',
		value: parseInt(countResult[2]),
		prefix: countResult[1]
	};
};


module.exports = Parser;
