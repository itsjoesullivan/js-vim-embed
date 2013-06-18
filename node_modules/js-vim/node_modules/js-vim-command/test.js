var Parser = require('./index');
var parser = new Parser();
parse = function() {
	return parser.parse.apply(parser,arguments);
};

var expect = require('chai').expect



describe('getLastOperator', function() {
	var operators = [
		'c',
		'd',
		'y',
		'~',
		'g~',
		'gu',
		'gU',
		'!',
		'=',
		'gg',
		'g?',
		'>',
		'<',
		'zf',
		'g@'
	]
	for(var i in operators) {
		var op = operators[i];
		it('catches ' + op, (function() { 
			var res = parser.getLastOperator(op).value === op; return function() { 
				expect(res).equal(true);
			}; 
		})());
	}
});

describe('getLastMotion', function() {
	var motions = [
		'h',
		'l',
		'0',
		'$',
		'^',
		'g_',
		'|',
		'fa',
		'f9',
		'f_',
		'f ',
		'Fg',
		'F2',
		'F?',
		'ta',
		't9',
		't_',
		'Tg',
		'T2',
		'T?',
		';',
		',',
		'k',
		'j',
		'-',
		'+',
		'_',
		'G',
		'1G',
		'10G',
		'322G',
		'e',
		'E',
		'w',
		'W',
		'b',
		'B',
		'ge',
		'gE',
		'(',
		')',
		'{',
		'}',
		']]',
		'][',
		'[[',
		'[]',
		'/foo\n',
		'?foo\n'
	];
	for(var i in motions) {
		var motion = motions[i]
		it('catches ' + motion, (function() { 
			var command = parser.getLastMotion(motion);
			var res = ( (command || {}).value || false) === motion; 
			return function() { 
				expect(res).equal(true);
			}; 
		})());
	}

});

describe('getLastCount', function() {
	it('retrieves 1', function() {
		expect(parser.getLastCount('1').value).equal(1);
	});
});


describe('parse', function() {
	var x = parse('h');	

	it('catches a single motion', function() {
		expect(parse('h').value[0]).equal('h')
		expect(parse('fh').value[0]).equal('fh')
		expect(parse('0').value[0]).equal('0')
		expect(parse('$').value[0]).equal('$')
	});

	it('catches a single operator', function() {
		expect(parse('c').value[0]).equal('c')
		expect(parse('y').value[0]).equal('y')
		expect(parse('d').value[0]).equal('d')
	});

	it('catches a single count', function() {
		expect(parse('10').value[0]).equal(10)
		expect(parse('77').value[0]).equal(77)
		expect(parse('800').value[0]).equal(800)
	});


	it('catches a count and a motion', function() {
		var command = parse('2h');
		expect(command.description).equal('{count}{motion}');
	});

	it('catches a count, operator, and motion', function() {
		var command = parse('2ch');
		expect(command.description).equal('{count}{operator}{motion}');
	});

	it('returns falsy when given i', function() {
		expect(parse('i')).equal(false);
	});

});
