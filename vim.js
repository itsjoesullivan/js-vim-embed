;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
//js implementation of vim
var Vim = require('js-vim'),
	//browser vim view
	ElView = require('./lib/View'),
	//browser key handler
	Keys = require('./lib/keys');

//janky style...
require('./lib/style');

/* set up */
var init = function(obj) {

	//Instanciate
	window.vim = new Vim();
	var elView;

	//Give vim a special edit function
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

},{"./lib/View":1,"./lib/keys":3,"./lib/style":4,"js-vim":5}],4:[function(require,module,exports){
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

},{"../style.css":6}],6:[function(require,module,exports){
module.exports = '.vim-container{margin:0;padding:0;position:relative;height:100%;width:100%;border-radius:4px;color:#f4f4f4;background-color:#111;font-size:14px;font-family:"Courier New", Courier, monospace}.vim-container pre,.vim-container span{font-size:inherit}.vim-container .selection{background-color:#555}.vim-container .selection.cursor{background-color:#888;color:#333}.vim-container .gutter{color:#ca792d;font-weight:700}.vim-container .blank{color:#4a39de;font-weight:700}.vim-container .var{color:#c0bb31}';

},{}],3:[function(require,module,exports){
mousetrap = require('../components/component-mousetrap');
/** Simple way to listen to keystrokes

*/
var Keys = module.exports = function() {

	//No-op, to be replaced with your listener
	this.fn = function() {};

};

/** Listen, supporting IE

*/
var addListener = function(obj,verb,fn) {
	if('addEventListener' in obj) {
		obj.addEventListener(verb,fn);
	} else {
		obj.attachEvent('on' + verb,fn);
	}
};

//Both characters we want to prevent and where our uses differ from mousetrap
var specialChars = {
	enter: '\n',
	tab: '\t',
	escape: 'esc',
	backspace: '\b',
	space: ' ',
	meta: '',
	shift: ''
};

var reverseShiftMap = {};
for(var i in mousetrap.SHIFT_MAP) {
	reverseShiftMap['' + mousetrap.SHIFT_MAP[i]] = '' + i;
}


/** Initialize on the object (presumabley, document)

*/
Keys.prototype.listen = function(obj) {
	addListener(obj,'keydown', function(e) {
		var key = mousetrap.characterFromEvent(e);
		if(e.shiftKey) {
			if(key in reverseShiftMap) {
				key = reverseShiftMap[key];
			} else {
				key = key.toUpperCase();
			}
		}
		if(key.toLowerCase() in specialChars) {
			e.preventDefault();
			key = specialChars[key];
			if(!key || !key.length) return;
		}
		this.fn(key);
	}.bind(this));
};

},{"../components/component-mousetrap":7}],5:[function(require,module,exports){
/* Nothing to see here */
module.exports = require('./lib/Vim');

},{"./lib/Vim":8}],7:[function(require,module,exports){
/**
 * Copyright 2012 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.1.2
 * @url craig.is/killing/mice
 */

  /**
   * mapping of special keycodes to their corresponding keys
   *
   * everything in this dictionary cannot use keypress events
   * so it has to be here to map to the correct keycodes for
   * keyup/keydown events
   *
   * @type {Object}
   */
  var _MAP = {
          8: 'backspace',
          9: 'tab',
          13: 'enter',
          16: 'shift',
          17: 'ctrl',
          18: 'alt',
          20: 'capslock',
          27: 'esc',
          32: 'space',
          33: 'pageup',
          34: 'pagedown',
          35: 'end',
          36: 'home',
          37: 'left',
          38: 'up',
          39: 'right',
          40: 'down',
          45: 'ins',
          46: 'del',
          91: 'meta',
          93: 'meta',
          224: 'meta'
      },

      /**
       * mapping for special characters so they can support
       *
       * this dictionary is only used incase you want to bind a
       * keyup or keydown event to one of these keys
       *
       * @type {Object}
       */
      _KEYCODE_MAP = {
          106: '*',
          107: '+',
          109: '-',
          110: '.',
          111 : '/',
          186: ';',
          187: '=',
          188: ',',
          189: '-',
          190: '.',
          191: '/',
          192: '`',
          219: '[',
          220: '\\',
          221: ']',
          222: '\''
      },

      /**
       * this is a mapping of keys that require shift on a US keypad
       * back to the non shift equivelents
       *
       * this is so you can use keyup events with these keys
       *
       * note that this will only work reliably on US keyboards
       *
       * @type {Object}
       */
      _SHIFT_MAP = {
          '~': '`',
          '!': '1',
          '@': '2',
          '#': '3',
          '$': '4',
          '%': '5',
          '^': '6',
          '&': '7',
          '*': '8',
          '(': '9',
          ')': '0',
          '_': '-',
          '+': '=',
          ':': ';',
          '\"': '\'',
          '<': ',',
          '>': '.',
          '?': '/',
          '|': '\\',
					'{': '[',
					'}': ']'
      },

      /**
       * this is a list of special strings you can use to map
       * to modifier keys when you specify your keyboard shortcuts
       *
       * @type {Object}
       */
      _SPECIAL_ALIASES = {
          'option': 'alt',
          'command': 'meta',
          'return': 'enter',
          'escape': 'esc'
      },

      /**
       * variable to store the flipped version of _MAP from above
       * needed to check if we should use keypress or not when no action
       * is specified
       *
       * @type {Object|undefined}
       */
      _REVERSE_MAP,

      /**
       * a list of all the callbacks setup via Mousetrap.bind()
       *
       * @type {Object}
       */
      _callbacks = {},

      /**
       * direct map of string combinations to callbacks used for trigger()
       *
       * @type {Object}
       */
      _direct_map = {},

      /**
       * keeps track of what level each sequence is at since multiple
       * sequences can start out with the same sequence
       *
       * @type {Object}
       */
      _sequence_levels = {},

      /**
       * variable to store the setTimeout call
       *
       * @type {null|number}
       */
      _reset_timer,

      /**
       * temporary state where we will ignore the next keyup
       *
       * @type {boolean|string}
       */
      _ignore_next_keyup = false,

      /**
       * are we currently inside of a sequence?
       * type of action ("keyup" or "keydown" or "keypress") or false
       *
       * @type {boolean|string}
       */
      _inside_sequence = false;

  /**
   * loop through the f keys, f1 to f19 and add them to the map
   * programatically
   */
  for (var i = 1; i < 20; ++i) {
      _MAP[111 + i] = 'f' + i;
  }

  /**
   * loop through to map numbers on the numeric keypad
   */
  for (i = 0; i <= 9; ++i) {
      _MAP[i + 96] = i;
  }

  /**
   * cross browser add event method
   *
   * @param {Element|HTMLDocument} object
   * @param {string} type
   * @param {Function} callback
   * @returns void
   */
  function _addEvent(object, type, callback) {
      if (object.addEventListener) {
          return object.addEventListener(type, callback, false);
      }

      object.attachEvent('on' + type, callback);
  }

  /**
   * takes the event and returns the key character
   *
   * @param {Event} e
   * @return {string}
   */
  function _characterFromEvent(e) {

      // for keypress events we should return the character as is
      if (e.type == 'keypress') {
          return String.fromCharCode(e.which);
      }

      // for non keypress events the special maps are needed
      if (_MAP[e.which]) {
          return _MAP[e.which];
      }

      if (_KEYCODE_MAP[e.which]) {
          return _KEYCODE_MAP[e.which];
      }

      // if it is not in the special map
      return String.fromCharCode(e.which).toLowerCase();
  }

  /**
   * should we stop this event before firing off callbacks
   *
   * @param {Event} e
   * @return {boolean}
   */
  function _stop(e) {
      var element = e.target || e.srcElement,
          tag_name = element.tagName;

      // if the element has the class "mousetrap" then no need to stop
      if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
          return false;
      }

      // stop for input, select, and textarea
      return tag_name == 'INPUT' || tag_name == 'SELECT' || tag_name == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true');
  }

  /**
   * checks if two arrays are equal
   *
   * @param {Array} modifiers1
   * @param {Array} modifiers2
   * @returns {boolean}
   */
  function _modifiersMatch(modifiers1, modifiers2) {
      return modifiers1.sort().join(',') === modifiers2.sort().join(',');
  }

  /**
   * resets all sequence counters except for the ones passed in
   *
   * @param {Object} do_not_reset
   * @returns void
   */
  function _resetSequences(do_not_reset) {
      do_not_reset = do_not_reset || {};

      var active_sequences = false,
          key;

      for (key in _sequence_levels) {
          if (do_not_reset[key]) {
              active_sequences = true;
              continue;
          }
          _sequence_levels[key] = 0;
      }

      if (!active_sequences) {
          _inside_sequence = false;
      }
  }

  /**
   * finds all callbacks that match based on the keycode, modifiers,
   * and action
   *
   * @param {string} character
   * @param {Array} modifiers
   * @param {string} action
   * @param {boolean=} remove - should we remove any matches
   * @param {string=} combination
   * @returns {Array}
   */
  function _getMatches(character, modifiers, action, remove, combination) {
      var i,
          callback,
          matches = [];

      // if there are no events related to this keycode
      if (!_callbacks[character]) {
          return [];
      }

      // if a modifier key is coming up on its own we should allow it
      if (action == 'keyup' && _isModifier(character)) {
          modifiers = [character];
      }

      // loop through all callbacks for the key that was pressed
      // and see if any of them match
      for (i = 0; i < _callbacks[character].length; ++i) {
          callback = _callbacks[character][i];

          // if this is a sequence but it is not at the right level
          // then move onto the next match
          if (callback.seq && _sequence_levels[callback.seq] != callback.level) {
              continue;
          }

          // if the action we are looking for doesn't match the action we got
          // then we should keep going
          if (action != callback.action) {
              continue;
          }

          // if this is a keypress event that means that we need to only
          // look at the character, otherwise check the modifiers as
          // well
          if (action == 'keypress' || _modifiersMatch(modifiers, callback.modifiers)) {

              // remove is used so if you change your mind and call bind a
              // second time with a new function the first one is overwritten
              if (remove && callback.combo == combination) {
                  _callbacks[character].splice(i, 1);
              }

              matches.push(callback);
          }
      }

      return matches;
  }

  /**
   * takes a key event and figures out what the modifiers are
   *
   * @param {Event} e
   * @returns {Array}
   */
  function _eventModifiers(e) {
      var modifiers = [];

      if (e.shiftKey) {
          modifiers.push('shift');
      }

      if (e.altKey) {
          modifiers.push('alt');
      }

      if (e.ctrlKey) {
          modifiers.push('ctrl');
      }

      if (e.metaKey) {
          modifiers.push('meta');
      }

      return modifiers;
  }

  /**
   * actually calls the callback function
   *
   * if your callback function returns false this will use the jquery
   * convention - prevent default and stop propogation on the event
   *
   * @param {Function} callback
   * @param {Event} e
   * @returns void
   */
  function _fireCallback(callback, e) {
      if (callback(e) === false) {
          if (e.preventDefault) {
              e.preventDefault();
          }

          if (e.stopPropagation) {
              e.stopPropagation();
          }

          e.returnValue = false;
          e.cancelBubble = true;
      }
  }

  /**
   * handles a character key event
   *
   * @param {string} character
   * @param {Event} e
   * @returns void
   */
  function _handleCharacter(character, e) {

      // if this event should not happen stop here
      if (_stop(e)) {
          return;
      }

      var callbacks = _getMatches(character, _eventModifiers(e), e.type),
          i,
          do_not_reset = {},
          processed_sequence_callback = false;

      // loop through matching callbacks for this key event
      for (i = 0; i < callbacks.length; ++i) {

          // fire for all sequence callbacks
          // this is because if for example you have multiple sequences
          // bound such as "g i" and "g t" they both need to fire the
          // callback for matching g cause otherwise you can only ever
          // match the first one
          if (callbacks[i].seq) {
              processed_sequence_callback = true;

              // keep a list of which sequences were matches for later
              do_not_reset[callbacks[i].seq] = 1;
              _fireCallback(callbacks[i].callback, e);
              continue;
          }

          // if there were no sequence matches but we are still here
          // that means this is a regular match so we should fire that
          if (!processed_sequence_callback && !_inside_sequence) {
              _fireCallback(callbacks[i].callback, e);
          }
      }

      // if you are inside of a sequence and the key you are pressing
      // is not a modifier key then we should reset all sequences
      // that were not matched by this key event
      if (e.type == _inside_sequence && !_isModifier(character)) {
          _resetSequences(do_not_reset);
      }
  }

  /**
   * handles a keydown event
   *
   * @param {Event} e
   * @returns void
   */
  function _handleKey(e) {

      // normalize e.which for key events
      // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
      e.which = typeof e.which == "number" ? e.which : e.keyCode;

      var character = _characterFromEvent(e);

      // no character found then stop
      if (!character) {
          return;
      }

      if (e.type == 'keyup' && _ignore_next_keyup == character) {
          _ignore_next_keyup = false;
          return;
      }

      _handleCharacter(character, e);
  }

  /**
   * determines if the keycode specified is a modifier key or not
   *
   * @param {string} key
   * @returns {boolean}
   */
  function _isModifier(key) {
      return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
  }

  /**
   * called to set a 1 second timeout on the specified sequence
   *
   * this is so after each key press in the sequence you have 1 second
   * to press the next key before you have to start over
   *
   * @returns void
   */
  function _resetSequenceTimer() {
      clearTimeout(_reset_timer);
      _reset_timer = setTimeout(_resetSequences, 1000);
  }

  /**
   * reverses the map lookup so that we can look for specific keys
   * to see what can and can't use keypress
   *
   * @return {Object}
   */
  function _getReverseMap() {
      if (!_REVERSE_MAP) {
          _REVERSE_MAP = {};
          for (var key in _MAP) {

              // pull out the numeric keypad from here cause keypress should
              // be able to detect the keys from the character
              if (key > 95 && key < 112) {
                  continue;
              }

              if (_MAP.hasOwnProperty(key)) {
                  _REVERSE_MAP[_MAP[key]] = key;
              }
          }
      }
      return _REVERSE_MAP;
  }

  /**
   * picks the best action based on the key combination
   *
   * @param {string} key - character for key
   * @param {Array} modifiers
   * @param {string=} action passed in
   */
  function _pickBestAction(key, modifiers, action) {

      // if no action was picked in we should try to pick the one
      // that we think would work best for this key
      if (!action) {
          action = _getReverseMap()[key] ? 'keydown' : 'keypress';
      }

      // modifier keys don't work as expected with keypress,
      // switch to keydown
      if (action == 'keypress' && modifiers.length) {
          action = 'keydown';
      }

      return action;
  }

  /**
   * binds a key sequence to an event
   *
   * @param {string} combo - combo specified in bind call
   * @param {Array} keys
   * @param {Function} callback
   * @param {string=} action
   * @returns void
   */
  function _bindSequence(combo, keys, callback, action) {

      // start off by adding a sequence level record for this combination
      // and setting the level to 0
      _sequence_levels[combo] = 0;

      // if there is no action pick the best one for the first key
      // in the sequence
      if (!action) {
          action = _pickBestAction(keys[0], []);
      }

      /**
       * callback to increase the sequence level for this sequence and reset
       * all other sequences that were active
       *
       * @param {Event} e
       * @returns void
       */
      var _increaseSequence = function(e) {
              _inside_sequence = action;
              ++_sequence_levels[combo];
              _resetSequenceTimer();
          },

          /**
           * wraps the specified callback inside of another function in order
           * to reset all sequence counters as soon as this sequence is done
           *
           * @param {Event} e
           * @returns void
           */
          _callbackAndReset = function(e) {
              _fireCallback(callback, e);

              // we should ignore the next key up if the action is key down
              // or keypress.  this is so if you finish a sequence and
              // release the key the final key will not trigger a keyup
              if (action !== 'keyup') {
                  _ignore_next_keyup = _characterFromEvent(e);
              }

              // weird race condition if a sequence ends with the key
              // another sequence begins with
              setTimeout(_resetSequences, 10);
          },
          i;

      // loop through keys one at a time and bind the appropriate callback
      // function.  for any key leading up to the final one it should
      // increase the sequence. after the final, it should reset all sequences
      for (i = 0; i < keys.length; ++i) {
          _bindSingle(keys[i], i < keys.length - 1 ? _increaseSequence : _callbackAndReset, action, combo, i);
      }
  }

  /**
   * binds a single keyboard combination
   *
   * @param {string} combination
   * @param {Function} callback
   * @param {string=} action
   * @param {string=} sequence_name - name of sequence if part of sequence
   * @param {number=} level - what part of the sequence the command is
   * @returns void
   */
  function _bindSingle(combination, callback, action, sequence_name, level) {

      // make sure multiple spaces in a row become a single space
      combination = combination.replace(/\s+/g, ' ');

      var sequence = combination.split(' '),
          i,
          key,
          keys,
          modifiers = [];

      // if this pattern is a sequence of keys then run through this method
      // to reprocess each pattern one key at a time
      if (sequence.length > 1) {
          return _bindSequence(combination, sequence, callback, action);
      }

      // take the keys from this pattern and figure out what the actual
      // pattern is all about
      keys = combination === '+' ? ['+'] : combination.split('+');

      for (i = 0; i < keys.length; ++i) {
          key = keys[i];

          // normalize key names
          if (_SPECIAL_ALIASES[key]) {
              key = _SPECIAL_ALIASES[key];
          }

          // if this is not a keypress event then we should
          // be smart about using shift keys
          // this will only work for US keyboards however
          if (action && action != 'keypress' && _SHIFT_MAP[key]) {
              key = _SHIFT_MAP[key];
              modifiers.push('shift');
          }

          // if this key is a modifier then add it to the list of modifiers
          if (_isModifier(key)) {
              modifiers.push(key);
          }
      }

      // depending on what the key combination is
      // we will try to pick the best event for it
      action = _pickBestAction(key, modifiers, action);

      // make sure to initialize array if this is the first time
      // a callback is added for this key
      if (!_callbacks[key]) {
          _callbacks[key] = [];
      }

      // remove an existing match if there is one
      _getMatches(key, modifiers, action, !sequence_name, combination);

      // add this call back to the array
      // if it is a sequence put it at the beginning
      // if not put it at the end
      //
      // this is important because the way these are processed expects
      // the sequence ones to come first
      _callbacks[key][sequence_name ? 'unshift' : 'push']({
          callback: callback,
          modifiers: modifiers,
          action: action,
          seq: sequence_name,
          level: level,
          combo: combination
      });
  }

  /**
   * binds multiple combinations to the same callback
   *
   * @param {Array} combinations
   * @param {Function} callback
   * @param {string|undefined} action
   * @returns void
   */
  function _bindMultiple(combinations, callback, action) {
      for (var i = 0; i < combinations.length; ++i) {
          _bindSingle(combinations[i], callback, action);
      }
  }

  // start!
  _addEvent(document, 'keypress', _handleKey);
  _addEvent(document, 'keydown', _handleKey);
  _addEvent(document, 'keyup', _handleKey);

  var mousetrap = {

      /**
       * binds an event to mousetrap
       *
       * can be a single key, a combination of keys separated with +,
       * a comma separated list of keys, an array of keys, or
       * a sequence of keys separated by spaces
       *
       * be sure to list the modifier keys first to make sure that the
       * correct key ends up getting bound (the last key in the pattern)
       *
       * @param {string|Array} keys
       * @param {Function} callback
       * @param {string=} action - 'keypress', 'keydown', or 'keyup'
       * @returns void
       */
      bind: function(keys, callback, action) {
          _bindMultiple(keys instanceof Array ? keys : [keys], callback, action);
          _direct_map[keys + ':' + action] = callback;
          return this;
      },

      /**
       * unbinds an event to mousetrap
       *
       * the unbinding sets the callback function of the specified key combo
       * to an empty function and deletes the corresponding key in the
       * _direct_map dict.
       *
       * the keycombo+action has to be exactly the same as
       * it was defined in the bind method
       *
       * TODO: actually remove this from the _callbacks dictionary instead
       * of binding an empty function
       *
       * @param {string|Array} keys
       * @param {string} action
       * @returns void
       */
      unbind: function(keys, action) {
          if (_direct_map[keys + ':' + action]) {
              delete _direct_map[keys + ':' + action];
              this.bind(keys, function() {}, action);
          }
          return this;
      },

      /**
       * triggers an event that has already been bound
       *
       * @param {string} keys
       * @param {string=} action
       * @returns void
       */
      trigger: function(keys, action) {
          _direct_map[keys + ':' + action]();
          return this;
      },

      /**
       * resets the library back to its initial state.  this is useful
       * if you want to clear out the current keyboard shortcuts and bind
       * new ones - for example if you switch to another page
       *
       * @returns void
       */
      reset: function() {
          _callbacks = {};
          _direct_map = {};
          return this;
      }
  };

module.exports = mousetrap;
//Sneaky
module.exports.characterFromEvent = _characterFromEvent;
module.exports.SHIFT_MAP = _SHIFT_MAP;


},{}],9:[function(require,module,exports){
module.exports = {
	'/(.*)\n/': function(keys, vim, res) {
		vim.searchBuffer = res[1];
		var lastMode = vim.lastMode || 'command';
		vim.mode(lastMode);
		vim.exec('n');
	}
};

},{}],10:[function(require,module,exports){
(function(){function parseRange(range, doc) {
	if (range === '.-') range = '.-1';
	if (range === '-') range = '.-1';
	if (range === '.+') range = '.+1';
	if (range === '+') range = '.+1';
	var cur = doc.cursor.line(),
		last = doc._lines.length - 1;
	//Handle recursively
	if (range.indexOf(',') > -1) {
		var split = range.split(',');
		return [parseRange(split[0], doc)[0], parseRange(split[1], doc)[1]];
	}
	var num = parseInt(range);
	if ('' + num === range) return [num - 1, num - 1];
	if (range === '' || range === '.') return [cur, cur];
	if (range.match(/\.(\+|-)/)) {
		var val = parseInt(range.substring(1));
		return [cur + val, cur + val];
	}
	if (range === '%') return [0, last];
	if (range === '$') return [last, last];

	return [cur, cur];
};

module.exports = function(Vim) {

	Vim.addCommand({
		mode: 'command',
		match: /:(.+)s(?:ubstitute)?(\/.*\n)/,
		fn: function(keys, vim, expr) {
			var position = this.curDoc.cursor.position();
			var range = expr[1];
			range = parseRange(expr[1], this.curDoc);
			var line = range[1];
			while (line >= range[0]) {
				vim.curDoc.cursor.line(line);
				vim.exec(':s' + expr[2]);
				line--;
			}
			this.curDoc.cursor.line(position.line);
			this.curDoc.cursor.char(position.char);
		}
	});

	Vim.addCommand({
		mode: 'command',
		match: /:s(\/.*\n)/,
		fn: function(keys, vim, expr) {
			vim.exec(keys.replace(/:s/, ':substitute'));
		}
	});
	Vim.addCommand({
		mode: 'command',
		match: /:substitute\/([^\/]*)\/([^\/]*)\n/,
		fn: function(keys, vim, expr) {
			vim.exec(keys.replace(/\n/, '/\n'));
		}
	});

	Vim.addCommand({
		mode: 'command',
		match: /:substitute\/(.*)\/(.*)\/([gci]*)\n/,
		fn: function(res, vim, expr) {
			var pos = this.curDoc.cursor.position();
			var flags = (expr[3] || '').split('');
			val = this.curDoc.find(new RegExp('(' + expr[1] + ')', 'g'), {
				wholeLine: true,
				range: false
			});
			while (val.found) {
				this.curDoc.cursor.char(val.char);
				this.curDoc.cursor.line(val.line);
				vim.exec('v');
				for (var i = 1; i < expr[1].length; i++) {
					vim.exec('l');
				}
				vim.exec('c');
				vim.exec(expr[2]);
				vim.exec('esc');

				//If not global, stop after first.
				if (flags.indexOf('g') === -1) break;
				val = this.curDoc.find(new RegExp('(' + expr[1] + ')', 'g'), {
					wholeLine: true,
					range: false
				});
			}
			this.curDoc.cursor.char(pos.char);
			this.curDoc.cursor.line(pos.line);
		}
	});

	Vim.addCommand({
		mode: 'command',
		match: /:substitute\/([^\/]*)\/([^\/]*)\n/,
		fn: function(keys, vim, expr) {
			vim.exec(keys.replace(/\n/, '/\n'));
		}
	});

	Vim.addCommand({
		mode: 'command',
		match: /:(.*)g\/([^\/]*)\/([^\/]*)\n/,
		fn: function(keys, vim, expr) {
			var range = parseRange(expr[1], this.curDoc),
				pattern = expr[2],
				command = expr[3];
			var cur = this.curDoc.cursor.position();
			var end = range[1];
			while (end >= range[0]) {

			}


		}
	});

}

module.exports.parseRange = parseRange;

})()
},{}],8:[function(require,module,exports){
/*!
 * js-vim
 * Copyright(c) 2013 Joe Sullivan <itsjoesullivan@gmail.com>
 * MIT Licensed
 */


/*
 * Dependencies
 */

var Set = require('get-set'),
	_ = require('underscore');
var mark = require('./mark');

/*
 * Components
 */

var Doc = require('./Doc'),
	View = require('./View'),
	CommandParser = require('js-vim-command');


/** Initialize a Vim instance
 */
Vim = function(obj) {

	//Instanciate view
	this.view = new View({
		vim: this
	});

	//Place for multiple docs
	this.docs = [];

	//Clipboard stuff. TODO: refactor out into separate module
	this._numRegistry = [];
	this._registry = {};
	//Hm.
	this.currentRegister = 0;

	//Remember everything types in that particular insertion
	this.insertSession = '';


	//Giving this method a shot.
	this.histories = {
		':': []
	};
	this.histories[':'].position = 0;


	this.marks = {};

	this.rc = {
		tabstop: 4,
		smartindent: true,
		shiftwidth: 4,
		abbreviations: {}

	};

	this.curChar = '';
	this.curWord = '';


	//Instanciate parser
	this.parser = new CommandParser();

	//Diff util for undo, etc.
	//API: https://code.google.com/p/google-diff-match-patch/wiki/API
	var dmpmod = require('diff_match_patch');
	this.dmp = new dmpmod.diff_match_patch();

	//Current depth of command execution. 
	//0 is idle; 
	//1 is a user-executed command; 
	//below 1 is sub-commands resulting from the input
	this.execDepth = 0;

	//Place to hold all commands
	this.modes = {};

	//Keys typed. When typing :q, before you press q, keyBuffer reads ":"
	this.keyBuffer = '';

	//A history of keys typed which is cleared at different intervals.
	this.keyHistory = '';

	//Create initial document
	var doc = new Doc();
	doc.vim = this;
	this.add(doc);

	this.on('change:status', function() {
		this.trigger('change')
	}.bind(this))


	//Add modes
	this.addMode('insert', require('./modes/insert'));
	this.addMode('command', require('./modes/command'));
	this.addMode('search', require('./modes/search'));
	this.addMode('visual', require('./modes/visual'));

	require('./modes/ex')(this);

	//Default to command mode
	this.mode('command');

};

//Inherit Set, giving set, get, on, trigger
Vim.prototype = new Set();

//Create a new doc. Not very semantic.
//TODO: kill this
Vim.prototype.new = function() {
	var doc = new Doc();
	doc.cursor.line(0);
	doc.cursor.char(0);
	this.docs.push(doc);
	this.curDoc = doc;
	this.exec('esc');
};

/** Create a new mode
 *
 * @param {String} name
 * @param {Object} mode
 */
Vim.prototype.addMode = function(name, mode) {

	var modeArr = [];

	for (var i in mode) {
		//TODO make it _().each
		if (mode.hasOwnProperty(i)) {

			//TODO let strings fall through for (command in mode) matching
			var reg = new RegExp(i.substring(1, i.length - 1));
			this.addCommand({
				mode: name,
				match: reg,
				fn: mode[i]
			});
		}
	}

};

/** add a command to an existing mode
 * 
 * @param {Object} obj

	obj ~ {
		mode: string,
		match: regexp | string,	<-- /:o (.*)\n/ vs. "o"
		fn: function		
	}

*/
Vim.prototype.addCommand = function(obj) {
	if (!obj || typeof obj !== 'object' || !obj.mode || !obj.match || !obj.fn) throw "Invalid argument";

	//Create mode if it doesn't yet exist
	if (!(obj.mode in this.modes)) this.modes[obj.mode] = [];

	return this.modes[obj.mode].push({
		command: obj.match,
		fn: obj.fn
	});
}

/** Get/set mode
 * TODO: use Vim.set
 *
 */
Vim.prototype.mode = function(name) {
	if (name) {
		if (!(name in this.modes)) throw "Mode " + name + " does not exist";
		this._mode = this.modes[name];
		this.modeName = name;
		this.trigger('change:mode', this._mode);
		this.trigger('change', {
			type: 'mode'
		});
	}

	return this._mode;
};




/** set/get registers
 * TODO: do this as a set/get thing.

*/
Vim.prototype.register = function(k, v) {
	var num = typeof k === 'number';
	if (v) {
		//Clone if array
		if (_(v).isArray()) v = v.slice(0);

		if (num) {
			this._numRegistry.splice(k, 0, v); //put where
			this._numRegistry.splice(10); //only ten.
		} else {
			this._registry[k] = v; //just set if not num TODO: check for '1' case
			this.register(0, v); //AND record into current register
		}
	} else {
		var val;
		if (num) {
			val = this._numRegistry[k];
		} else if (k === '%') {
			if ('path' in this.curDoc && typeof this.curDoc.path === 'string') {
				return /(?:\/|^)([^\/]*)$/.exec(this.curDoc.path)[1];
			}
		} else {
			val = this._registry[k];
		}
		if (_(val).isArray()) val = val.slice(0);
		//Send an empty string if it's an empty buffer.
		return val ? val : '';
	}
};


//TODO kill
/** Get a register, following logic that usage sets the default to 0

*/
Vim.prototype.useRegister = function() {
	var index = this.currentRegister || 0;
	this.currentRegister = 0; //Using sets to the default.
	//	var val = this.register(index);
	var val = 'asdf';
	return val;
};

var _text = '';

var abbreviationKeyMap = {
	' ': 1,
	'\n': 1,
	'esc': 1
};

/** Execute a given command by passing it through 
 */
Vim.prototype.exec = function(newCommand) {

	//Grab what's left in the buffer
	if (this.keyBuffer.length) {
		this.keyBuffer += newCommand;
	} else {
		this.keyBuffer = newCommand;
	}

	//Keep track of top-level keys
	if (this.execDepth === 1) {
		this.keyHistory += newCommand;
	}


	command = this.keyBuffer;
	//TODO change triggers in order
	if (this.execDepth < 2) {
		this.trigger('change:keyBuffer', this.keyBuffer);
		this.trigger('change');
	}
	this.curChar = this.curDoc.getRange(this.curDoc.selection()).substring(0, 1);

	//accept an array as the first argument.
	if (typeof command !== 'string' && !('marks' in command)) {
		for (var i in command) {
			//For strings, execute them one at a time. Use the substring method here because a character may also hold a mark.
			if (command.hasOwnProperty(i)) {
				this.exec(command[i]);
			}
		}
		return;
	}



	//Increment the depth so we can identify top-level commands
	this.execDepth++;

	//Handle abbreviations
	if (this.modeName === 'insert' && this.execDepth === 1 && command in abbreviationKeyMap && abbreviationKeyMap[command] && this.currentInsertedText.length >= this.curWord.length) {
		if (this.curWord in this.rc.abbreviations) {
			var key = command;
			var curWord = this.curWord;
			var newWord = this.rc.abbreviations[this.curWord];
			var pos = this.curDoc.cursor.position();
			this.curDoc.remove([{
				line: pos.line,
				char: pos.char - curWord.length
			}, {
				line: pos.line,
				char: pos.char
			}]);
			this.curDoc.cursor.char(pos.char - curWord.length);
			this.curDoc.insert(newWord);
		}
	}


	//If this is top-level command, store the value of text for diffing to store the undo
	//TODO: kill this
	//    if (this.execDepth === 1) {
	//        _text = this.text();
	//    }

	//Keep a hold of what the position is
	var startPos = this.curDoc.cursor.position();


	//Hold mode
	var mode = this.mode();

	var arg, regResult;

	//EX command helper

	if (this.keyBuffer.indexOf(':') === 0 && this.keyBuffer.lastIndexOf('\n') === this.keyBuffer.length - 1) {
		this.histories[':'].push(this.keyBuffer.substring(1, this.keyBuffer.length - 1));
		this.histories[':'].position = this.histories[':'].length;
	}



	//TODO break this into "should parse?" "parse useful?"

	//See if it is a complete, parsed command
	var parsedCommand = this.parser.parse(command);

	//Don't catch single commands because they aren't very useful.
	if (parsedCommand && parsedCommand.description.lastIndexOf('{') === 0) parsedCommand = false; //Dont handle if just one
	// 'yy' should fall through
	if (parsedCommand.description === '{operator}{operator}') parsedCommand = false;
	// '{n}y' should fall through
	if (parsedCommand.description === '{count}{operator}') parsedCommand = false;
	// '{n}yy', too
	if (parsedCommand.description === '{count}{operator}{operator}') parsedCommand = false;
	if (command.indexOf(':') === 0) {
		parsedCommand = false;
	}
	if (command.indexOf('?') === 0) {
		parsedCommand = false;
	}
	if (command.indexOf('/') === 0) {
		parsedCommand = false;
	}
	if (command.indexOf('<') > -1 && command.indexOf('>') > -1) {
		parsedCommand = false;
	}


	var handlers = [];
	var mode = this.mode();

	handlers = _(this.mode()).filter(function(mode) {
		var res;

		//Identify text
		if (command === mode.command) return true;
		//But don't let text tests go on.	
		if (typeof mode.command === 'string') return;


		if (parsedCommand) {
			res = mode.command.exec(parsedCommand.description)
			if (res) return true;
		} else if ('exec' in mode.command) {
			//      if(mode.command.exec(command)) {
			//           res = command;
			//        }
			res = mode.command.exec(command);
		} else {
			return;
		}
		if (res) {
			regResult = res;
			arg = command;
			return true;
		}
	});

	//If we found one
	if (handlers.length) {

		//For recording macros, i.e. qq{commands}q, @q
		if (this.recording && this.execDepth === 1 && command.indexOf('q') !== 0) {
			this.recordingBuffer.push(command);
		}

		//Clear keyBuffer before fn runs, so that it can reset keyBuffer if it desires without being overwritten
		this.lastKeyBuffer = command;
		this.keyBuffer = '';

		//Run the fn... TODO refactor the API so that that can be just one line
		if (parsedCommand) {
			handlers[0].fn.apply(this, parsedCommand.value);
		} else {
			handlers[0].fn.bind(this)(arg, this, regResult);
		}
	}

	//Escape valve for when the keyBuffer turns into a string that none of the commands recognize
	if (command === 'esc') {
		this.mode('command');
		this.keyBuffer = '';
	}

	if (this.execDepth === 1) {
		this.trigger('change:keyBuffer', command);
		this.trigger('exec', command)
	}

	this.curChar = this.curDoc.getRange(this.curDoc.selection()).substring(0, 1);
	this.curWord = getCurWord(this);
	this.execDepth--;

	if (this.execDepth === 0) {
		this.trigger('idle');
	}

};

function getCurWord(vim) {
	var doc = vim.curDoc;
	var startPoint = doc.find(/(?:^|\W)(\w+)$/g, {
		backwards: true,
		inclusive: true
	});
	var endPoint;
	if (vim.modeName === 'insert') {
		endPoint = doc.find(/(\w)$/g, {
			backwards: true,
			inclusive: true
		});
	} else {
		endPoint = doc.find(/(\w)(?:$|\W)/g, {
			inclusive: true
		});
	}
	// Expand for range friendly ness
	endPoint.col++;
	endPoint.char++;
	if (endPoint.found && startPoint.found) {
		var word = doc.getRange([startPoint, endPoint]);
		return word;
	} else {
		return '';
	}
}

Vim.prototype.addUndoState = function() {
	var pos = this.curDoc.cursor.position();
	var result = this.curDoc.undo.add({
		text: this.curDoc.text(),
		cursor: pos,
		keys: this.keyHistory
	});
	if (result) this.keyHistory = '';
	return result;
};


Vim.prototype.add = function(doc) {
	//Add a doc
	doc.on('change:cursor', function() {
		this.trigger('change');
	}.bind(this));
	doc.on('change:text', function() {
		this.trigger('change:text');
		this.trigger('change', {
			type: 'text'
		});
	}.bind(this));
	this.docs.push(doc);
	this.curDoc = doc;
	this.doc = this.curDoc; //I like this better than curDoc.
	this.trigger('change');
};


/** "Notifies" the user of something. Currently conducted by setting status. But could be growl, etc.

*/
Vim.prototype.notify = function(text) {
	this.view.status = text;
};

/* Shorthand fns */

Vim.prototype.insert = function() {
	return this.curDoc.insert.apply(this.curDoc, arguments);
};

Vim.prototype.remove = function() {
	return this.curDoc.remove.apply(this.curDoc, arguments);
};

Vim.prototype.text = function() {
	return this.curDoc.text.apply(this.curDoc, arguments);
}

Vim.prototype.cursor = function() {
	return this.curDoc.cursor;
}

//Expose Doc for testing
Vim.prototype.Doc = Doc;

module.exports = Vim;

},{"./mark":11,"./Doc":12,"./View":13,"./modes/insert":14,"./modes/command":15,"./modes/search":9,"./modes/visual":16,"./modes/ex":10,"get-set":17,"underscore":18,"js-vim-command":19,"diff_match_patch":20}],18:[function(require,module,exports){
(function(){//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

})()
},{}],21:[function(require,module,exports){
module.exports = function() {};

/** 
 * Add a listener by event name
 * @param {String} name
 * @param {Function} fn
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.on = function(name, fn) {

	//Lazy instanciation of events object
	var events = this.events = this.events || {};

	//Lazy instanciation of specific event
	events[name] = events[name] || [];

	//Give it the function
	events[name].push(fn);

	return this;

};


/** 
 * Trigger an event by name, passing arguments
 *
 * @param {String} name
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.trigger = function(name, arg1, arg2 /** ... */ ) {

	//Only if events + this event exist...
	if (!this.events || !this.events[name]) return this;

	//Grab the listeners
	var listeners = this.events[name],
		//All arguments after the name should be passed to the function
		args = Array.prototype.slice.call(arguments, 1);

	//So we can efficiently apply below

	function triggerFunction(fn) {
		fn.apply(this, args);
	};

	if ('forEach' in listeners) {
		listeners.forEach(triggerFunction.bind(this));
	} else {
		for (var i in listeners) {
			if (listeners.hasOwnProperty(i)) triggerFunction(fn);
		}
	}

	return this;

};

},{}],22:[function(require,module,exports){
var Undo = module.exports = function() {
	this._history = [];
	this.position = 0;
};

/** Add a state
 *
 * N.B.: this.position can use some conceptual explanation.
 * At its root, position is the state that you are presently in.
 * Undo.add is not used when you have completed a change, but when you are about to initiate a change. Therefore it's appropriate that insert the state at your current position, then increment position into a state that is not defined in _history.
 */
Undo.prototype.add = function(ev) {

	//Don't add additional identical states.
	if (this.position && typeof ev !== 'string' && 'cursor' in ev && 'text' in ev) {
		var current = this._history.slice(this.position - 1, this.position)[0];
		var next = this._history.slice(this.position, this.position + 1);
		next = next.length ? next[0] : false;
		if (areSame(ev, current) || (next && areSame(ev, next))) {
			return;
		}
	}

	this._history.splice(this.position);
	this._history.push(ev);
	this.position++;
	return true;
};

function areSame(ev1, ev2) {
	return (ev1.text === ev2.text);
}

/** Retrieve a state and move the current "position" to there
 */
Undo.prototype.get = function(index) {
	if (index < 0 || index >= this._history.length) return;
	var state = this._history.slice(index, index + 1)[0];
	this.position = index;
	return state;
};

/** Retrieve the previous state
 */
Undo.prototype.last = function() {
	return this.get(this.position - 1);
};

/** Retrieve the next state
 */
Undo.prototype.next = function() {
	return this.get(this.position + 1);
};

},{}],19:[function(require,module,exports){
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
var motions = ['h', '%', 'l','0','\\$','\\^','g_','\\|','\(?:\'\|`\)\(\?\:[a-z]\)','\(?:f\|F\|t\|T\)\(\?\:.\)',';',',','k','j','\\+','-','_','(?:[1-9]+[0-9]*|)G','e','E','w','W','b','B','ge','gE','\\(','\\)','\\{','\\}','\\]\\]','\\]\\[','\\[\\[','\\[\\]','(?:\\?|\\/)(?:\\S+)\\n','~'];
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

},{}],20:[function(require,module,exports){
(function(){/**
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Computes the difference between two texts to create a patch.
 * Applies the patch onto another text, allowing for errors.
 * @author fraser@google.com (Neil Fraser)
 */

/**
 * Class containing the diff, match and patch methods.
 * @constructor
 */
function diff_match_patch() {

  // Defaults.
  // Redefine these in your program to override the defaults.

  // Number of seconds to map a diff before giving up (0 for infinity).
  this.Diff_Timeout = 1.0;
  // Cost of an empty edit operation in terms of edit characters.
  this.Diff_EditCost = 4;
  // The size beyond which the double-ended diff activates.
  // Double-ending is twice as fast, but less accurate.
  this.Diff_DualThreshold = 32;
  // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
  this.Match_Threshold = 0.5;
  // How far to search for a match (0 = exact location, 1000+ = broad match).
  // A match this many characters away from the expected location will add
  // 1.0 to the score (0.0 is a perfect match).
  this.Match_Distance = 1000;
  // When deleting a large block of text (over ~64 characters), how close does
  // the contents have to match the expected contents. (0.0 = perfection,
  // 1.0 = very loose).  Note that Match_Threshold controls how closely the
  // end points of a delete need to match.
  this.Patch_DeleteThreshold = 0.5;
  // Chunk size for context length.
  this.Patch_Margin = 4;

  /**
   * Compute the number of bits in an int.
   * The normal answer for JavaScript is 32.
   * @return {number} Max bits
   */
  function getMaxBits() {
    var maxbits = 0;
    var oldi = 1;
    var newi = 2;
    while (oldi != newi) {
      maxbits++;
      oldi = newi;
      newi = newi << 1;
    }
    return maxbits;
  }
  // How many bits in a number?
  this.Match_MaxBits = getMaxBits();
}


//  DIFF FUNCTIONS


/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;


/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} opt_checklines Optional speedup flag.  If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff
 * @return {Array.<Array.<number|string>>} Array of diff tuples.
 */
diff_match_patch.prototype.diff_main = function(text1, text2, opt_checklines) {
  // Check for null inputs.
  if (text1 == null || text2 == null) {
    throw new Error('Null input. (diff_main)');
  }

  // Check for equality (speedup).
  if (text1 == text2) {
    return [[DIFF_EQUAL, text1]];
  }

  if (typeof opt_checklines == 'undefined') {
    opt_checklines = true;
  }
  var checklines = opt_checklines;

  // Trim off common prefix (speedup).
  var commonlength = this.diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = this.diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  var diffs = this.diff_compute(text1, text2, checklines);

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }
  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }
  this.diff_cleanupMerge(diffs);
  return diffs;
};


/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} checklines Speedup flag.  If false, then don't run a
 *     line-level diff first to identify the changed areas.
 *     If true, then run a faster, slightly less optimal diff
 * @return {Array.<Array.<number|string>>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_compute = function(text1, text2, checklines) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);
  if (i != -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
             [DIFF_EQUAL, shorttext],
             [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }
  longtext = shorttext = null;  // Garbage collect.

  // Check to see if the problem can be split in two.
  var hm = this.diff_halfMatch(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = this.diff_main(text1_a, text2_a, checklines);
    var diffs_b = this.diff_main(text1_b, text2_b, checklines);
    // Merge the results.
    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  // Perform a real diff.
  if (checklines && (text1.length < 100 || text2.length < 100)) {
    // Too trivial for the overhead.
    checklines = false;
  }
  var linearray;
  if (checklines) {
    // Scan the text on a line-by-line basis first.
    var a = this.diff_linesToChars(text1, text2);
    text1 = a[0];
    text2 = a[1];
    linearray = a[2];
  }
  diffs = this.diff_map(text1, text2);
  if (!diffs) {
    // No acceptable result.
    diffs = [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }
  if (checklines) {
    // Convert the diff back to original text.
    this.diff_charsToLines(diffs, linearray);
    // Eliminate freak matches (e.g. blank lines)
    this.diff_cleanupSemantic(diffs);

    // Rediff any replacement blocks, this time character-by-character.
    // Add a dummy entry at the end.
    diffs.push([DIFF_EQUAL, '']);
    var pointer = 0;
    var count_delete = 0;
    var count_insert = 0;
    var text_delete = '';
    var text_insert = '';
    while (pointer < diffs.length) {
      switch (diffs[pointer][0]) {
        case DIFF_INSERT:
          count_insert++;
          text_insert += diffs[pointer][1];
          break;
        case DIFF_DELETE:
          count_delete++;
          text_delete += diffs[pointer][1];
          break;
        case DIFF_EQUAL:
          // Upon reaching an equality, check for prior redundancies.
          if (count_delete >= 1 && count_insert >= 1) {
            // Delete the offending records and add the merged ones.
            var a = this.diff_main(text_delete, text_insert, false);
            diffs.splice(pointer - count_delete - count_insert,
                         count_delete + count_insert);
            pointer = pointer - count_delete - count_insert;
            for (var j = a.length - 1; j >= 0; j--) {
              diffs.splice(pointer, 0, a[j]);
            }
            pointer = pointer + a.length;
          }
          count_insert = 0;
          count_delete = 0;
          text_delete = '';
          text_insert = '';
          break;
      }
     pointer++;
    }
    diffs.pop();  // Remove the dummy entry at the end.
  }
  return diffs;
};


/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string|Array.<string>>} Three element Array, containing the
 *     encoded text1, the encoded text2 and the array of unique strings.  The
 *     zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
diff_match_patch.prototype.diff_linesToChars = function(text1, text2) {
  var lineArray = [];  // e.g. lineArray[4] == 'Hello\n'
  var lineHash = {};   // e.g. lineHash['Hello\n'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  function diff_linesToCharsMunge(text) {
    var chars = '';
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    var lineStart = 0;
    var lineEnd = -1;
    // Keeping our own length variable is faster than looking it up.
    var lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf('\n', lineStart);
      if (lineEnd == -1) {
        lineEnd = text.length - 1;
      }
      var line = text.substring(lineStart, lineEnd + 1);
      lineStart = lineEnd + 1;

      if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) :
          (lineHash[line] !== undefined)) {
        chars += String.fromCharCode(lineHash[line]);
      } else {
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
    }
    return chars;
  }

  var chars1 = diff_linesToCharsMunge(text1);
  var chars2 = diff_linesToCharsMunge(text2);
  return [chars1, chars2, lineArray];
};


/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 * @param {Array.<string>} lineArray Array of unique strings.
 * @private
 */
diff_match_patch.prototype.diff_charsToLines = function(diffs, lineArray) {
  for (var x = 0; x < diffs.length; x++) {
    var chars = diffs[x][1];
    var text = [];
    for (var y = 0; y < chars.length; y++) {
      text[y] = lineArray[chars.charCodeAt(y)];
    }
    diffs[x][1] = text.join('');
  }
};


/**
 * Explore the intersection points between the two texts.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {?Array.<Array.<number|string>>} Array of diff tuples or null if no
 *     diff available.
 * @private
 */
diff_match_patch.prototype.diff_map = function(text1, text2) {
  // Don't run for too long.
  var ms_end = (new Date()).getTime() + this.Diff_Timeout * 1000;
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = text1_length + text2_length - 1;
  var doubleEnd = this.Diff_DualThreshold * 2 < max_d;
  // JavaScript efficiency note: (x << 32) + y doesn't work since numbers are
  // only 32 bit.  Use x + ',' + y to create a hash instead.
  var v_map1 = [];
  var v_map2 = [];
  var v1 = {};
  var v2 = {};
  v1[1] = 0;
  v2[1] = 0;
  var x, y;
  var footstep;  // Used to track overlapping paths.
  var footsteps = {};
  var done = false;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = (text1_length + text2_length) % 2;
  for (var d = 0; d < max_d; d++) {
    // Bail out if timeout reached.
    if (this.Diff_Timeout > 0 && (new Date()).getTime() > ms_end) {
      return null;
    }

    // Walk the front path one step.
    v_map1[d] = {};
    for (var k = -d; k <= d; k += 2) {
      if (k == -d || k != d && v1[k - 1] < v1[k + 1]) {
        x = v1[k + 1];
      } else {
        x = v1[k - 1] + 1;
      }
      y = x - k;
      if (doubleEnd) {
        footstep = x + ',' + y;
        if (front && footsteps[footstep] !== undefined) {
          done = true;
        }
        if (!front) {
          footsteps[footstep] = d;
        }
      }
      while (!done && x < text1_length && y < text2_length &&
             text1.charAt(x) == text2.charAt(y)) {
        x++;
        y++;
        if (doubleEnd) {
          footstep = x + ',' + y;
          if (front && footsteps[footstep] !== undefined) {
            done = true;
          }
          if (!front) {
            footsteps[footstep] = d;
          }
        }
      }
      v1[k] = x;
      v_map1[d][x + ',' + y] = true;
      if (x == text1_length && y == text2_length) {
        // Reached the end in single-path mode.
        return this.diff_path1(v_map1, text1, text2);
      } else if (done) {
        // Front path ran over reverse path.
        v_map2 = v_map2.slice(0, footsteps[footstep] + 1);
        var a = this.diff_path1(v_map1, text1.substring(0, x),
                                text2.substring(0, y));
        return a.concat(this.diff_path2(v_map2, text1.substring(x),
                                        text2.substring(y)));
      }
    }

    if (doubleEnd) {
      // Walk the reverse path one step.
      v_map2[d] = {};
      for (var k = -d; k <= d; k += 2) {
        if (k == -d || k != d && v2[k - 1] < v2[k + 1]) {
          x = v2[k + 1];
        } else {
          x = v2[k - 1] + 1;
        }
        y = x - k;
        footstep = (text1_length - x) + ',' + (text2_length - y);
        if (!front && footsteps[footstep] !== undefined) {
          done = true;
        }
        if (front) {
          footsteps[footstep] = d;
        }
        while (!done && x < text1_length && y < text2_length &&
               text1.charAt(text1_length - x - 1) ==
               text2.charAt(text2_length - y - 1)) {
          x++;
          y++;
          footstep = (text1_length - x) + ',' + (text2_length - y);
          if (!front && footsteps[footstep] !== undefined) {
            done = true;
          }
          if (front) {
            footsteps[footstep] = d;
          }
        }
        v2[k] = x;
        v_map2[d][x + ',' + y] = true;
        if (done) {
          // Reverse path ran over front path.
          v_map1 = v_map1.slice(0, footsteps[footstep] + 1);
          var a = this.diff_path1(v_map1, text1.substring(0, text1_length - x),
                                  text2.substring(0, text2_length - y));
          return a.concat(this.diff_path2(v_map2,
                          text1.substring(text1_length - x),
                          text2.substring(text2_length - y)));
        }
      }
    }
  }
  // Number of diffs equals number of characters, no commonality at all.
  return null;
};


/**
 * Work from the middle back to the start to determine the path.
 * @param {Array.<Object>} v_map Array of paths.
 * @param {string} text1 Old string fragment to be diffed.
 * @param {string} text2 New string fragment to be diffed.
 * @return {Array.<Array.<number|string>>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_path1 = function(v_map, text1, text2) {
  var path = [];
  var x = text1.length;
  var y = text2.length;
  /** @type {?number} */
  var last_op = null;
  for (var d = v_map.length - 2; d >= 0; d--) {
    while (1) {
      if (v_map[d][(x - 1) + ',' + y] !== undefined) {
        x--;
        if (last_op === DIFF_DELETE) {
          path[0][1] = text1.charAt(x) + path[0][1];
        } else {
          path.unshift([DIFF_DELETE, text1.charAt(x)]);
        }
        last_op = DIFF_DELETE;
        break;
      } else if (v_map[d][x + ',' + (y - 1)] !== undefined) {
        y--;
        if (last_op === DIFF_INSERT) {
          path[0][1] = text2.charAt(y) + path[0][1];
        } else {
          path.unshift([DIFF_INSERT, text2.charAt(y)]);
        }
        last_op = DIFF_INSERT;
        break;
      } else {
        x--;
        y--;
        if (text1.charAt(x) != text2.charAt(y)) {
          throw new Error('No diagonal.  Can\'t happen. (diff_path1)');
        }
        if (last_op === DIFF_EQUAL) {
          path[0][1] = text1.charAt(x) + path[0][1];
        } else {
          path.unshift([DIFF_EQUAL, text1.charAt(x)]);
        }
        last_op = DIFF_EQUAL;
      }
    }
  }
  return path;
};


/**
 * Work from the middle back to the end to determine the path.
 * @param {Array.<Object>} v_map Array of paths.
 * @param {string} text1 Old string fragment to be diffed.
 * @param {string} text2 New string fragment to be diffed.
 * @return {Array.<Array.<number|string>>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_path2 = function(v_map, text1, text2) {
  var path = [];
  var pathLength = 0;
  var x = text1.length;
  var y = text2.length;
  /** @type {?number} */
  var last_op = null;
  for (var d = v_map.length - 2; d >= 0; d--) {
    while (1) {
      if (v_map[d][(x - 1) + ',' + y] !== undefined) {
        x--;
        if (last_op === DIFF_DELETE) {
          path[pathLength - 1][1] += text1.charAt(text1.length - x - 1);
        } else {
          path[pathLength++] =
              [DIFF_DELETE, text1.charAt(text1.length - x - 1)];
        }
        last_op = DIFF_DELETE;
        break;
      } else if (v_map[d][x + ',' + (y - 1)] !== undefined) {
        y--;
        if (last_op === DIFF_INSERT) {
          path[pathLength - 1][1] += text2.charAt(text2.length - y - 1);
        } else {
          path[pathLength++] =
              [DIFF_INSERT, text2.charAt(text2.length - y - 1)];
        }
        last_op = DIFF_INSERT;
        break;
      } else {
        x--;
        y--;
        if (text1.charAt(text1.length - x - 1) !=
            text2.charAt(text2.length - y - 1)) {
          throw new Error('No diagonal.  Can\'t happen. (diff_path2)');
        }
        if (last_op === DIFF_EQUAL) {
          path[pathLength - 1][1] += text1.charAt(text1.length - x - 1);
        } else {
          path[pathLength++] =
              [DIFF_EQUAL, text1.charAt(text1.length - x - 1)];
        }
        last_op = DIFF_EQUAL;
      }
    }
  }
  return path;
};


/**
 * Determine the common prefix of two strings
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
diff_match_patch.prototype.diff_commonPrefix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) ==
        text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine the common suffix of two strings
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
diff_match_patch.prototype.diff_commonSuffix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(text1.length - 1) !=
                          text2.charAt(text2.length - 1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {?Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 */
diff_match_patch.prototype.diff_halfMatch = function(text1, text2) {
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 10 || shorttext.length < 1) {
    return null;  // Pointless.
  }
  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext
   * @return {?Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diff_halfMatchI(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = '';
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
      var prefixLength = dmp.diff_commonPrefix(longtext.substring(i),
                                               shorttext.substring(j));
      var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i),
                                               shorttext.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext.substring(j - suffixLength, j) +
            shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length >= longtext.length / 2) {
      return [best_longtext_a, best_longtext_b,
              best_shorttext_a, best_shorttext_b, best_common];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI(longtext, shorttext,
                            Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI(longtext, shorttext,
                            Math.ceil(longtext.length / 2));
  var hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  var text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
};


/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemantic = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  var lastequality = null;  // Always equal to equalities[equalitiesLength-1][1]
  var pointer = 0;  // Index of current position.
  // Number of characters that changed prior to the equality.
  var length_changes1 = 0;
  // Number of characters that changed after the equality.
  var length_changes2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // equality found
      equalities[equalitiesLength++] = pointer;
      length_changes1 = length_changes2;
      length_changes2 = 0;
      lastequality = diffs[pointer][1];
    } else {  // an insertion or deletion
      length_changes2 += diffs[pointer][1].length;
      if (lastequality !== null && (lastequality.length <= length_changes1) &&
          (lastequality.length <= length_changes2)) {
        // Duplicate record
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        // Throw away the equality we just deleted.
        equalitiesLength--;
        // Throw away the previous equality (it needs to be reevaluated).
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_changes1 = 0;  // Reset the counters.
        length_changes2 = 0;
        lastequality = null;
        changes = true;
      }
    }
    pointer++;
  }
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
  this.diff_cleanupSemanticLossless(diffs);
};


/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemanticLossless = function(diffs) {
  // Define some regex patterns for matching boundaries.
  var punctuation = /[^a-zA-Z0-9]/;
  var whitespace = /\s/;
  var linebreak = /[\r\n]/;
  var blanklineEnd = /\n\r?\n$/;
  var blanklineStart = /^\r?\n\r?\n/;

  /**
   * Given two strings, compute a score representing whether the internal
   * boundary falls on logical boundaries.
   * Scores range from 5 (best) to 0 (worst).
   * Closure, makes reference to regex patterns defined above.
   * @param {string} one First string.
   * @param {string} two Second string.
   * @return {number} The score.
   */
  function diff_cleanupSemanticScore(one, two) {
    if (!one || !two) {
      // Edges are the best.
      return 5;
    }

    // Each port of this function behaves slightly differently due to
    // subtle differences in each language's definition of things like
    // 'whitespace'.  Since this function's purpose is largely cosmetic,
    // the choice has been made to use each language's native features
    // rather than force total conformity.
    var score = 0;
    // One point for non-alphanumeric.
    if (one.charAt(one.length - 1).match(punctuation) ||
        two.charAt(0).match(punctuation)) {
      score++;
      // Two points for whitespace.
      if (one.charAt(one.length - 1).match(whitespace) ||
          two.charAt(0).match(whitespace)) {
        score++;
        // Three points for line breaks.
        if (one.charAt(one.length - 1).match(linebreak) ||
            two.charAt(0).match(linebreak)) {
          score++;
          // Four points for blank lines.
          if (one.match(blanklineEnd) || two.match(blanklineStart)) {
            score++;
          }
        }
      }
    }
    return score;
  }

  var pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      var equality1 = diffs[pointer - 1][1];
      var edit = diffs[pointer][1];
      var equality2 = diffs[pointer + 1][1];

      // First, shift the edit as far left as possible.
      var commonOffset = this.diff_commonSuffix(equality1, edit);
      if (commonOffset) {
        var commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }

      // Second, step character by character right, looking for the best fit.
      var bestEquality1 = equality1;
      var bestEdit = edit;
      var bestEquality2 = equality2;
      var bestScore = diff_cleanupSemanticScore(equality1, edit) +
          diff_cleanupSemanticScore(edit, equality2);
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0);
        edit = edit.substring(1) + equality2.charAt(0);
        equality2 = equality2.substring(1);
        var score = diff_cleanupSemanticScore(equality1, edit) +
            diff_cleanupSemanticScore(edit, equality2);
        // The >= encourages trailing rather than leading whitespace on edits.
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }

      if (diffs[pointer - 1][1] != bestEquality1) {
        // We have an improvement, save it back to the diff.
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
};


/**
 * Reduce the number of edits by eliminating operationally trivial equalities.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupEfficiency = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  var lastequality = '';  // Always equal to equalities[equalitiesLength-1][1]
  var pointer = 0;  // Index of current position.
  // Is there an insertion operation before the last equality.
  var pre_ins = false;
  // Is there a deletion operation before the last equality.
  var pre_del = false;
  // Is there an insertion operation after the last equality.
  var post_ins = false;
  // Is there a deletion operation after the last equality.
  var post_del = false;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // equality found
      if (diffs[pointer][1].length < this.Diff_EditCost &&
          (post_ins || post_del)) {
        // Candidate found.
        equalities[equalitiesLength++] = pointer;
        pre_ins = post_ins;
        pre_del = post_del;
        lastequality = diffs[pointer][1];
      } else {
        // Not a candidate, and can never become one.
        equalitiesLength = 0;
        lastequality = '';
      }
      post_ins = post_del = false;
    } else {  // an insertion or deletion
      if (diffs[pointer][0] == DIFF_DELETE) {
        post_del = true;
      } else {
        post_ins = true;
      }
      /*
       * Five types to be split:
       * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
       * <ins>A</ins>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<ins>C</ins>
       * <ins>A</del>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<del>C</del>
       */
      if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                           ((lastequality.length < this.Diff_EditCost / 2) &&
                            (pre_ins + pre_del + post_ins + post_del) == 3))) {
        // Duplicate record
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;  // Throw away the equality we just deleted;
        lastequality = '';
        if (pre_ins && pre_del) {
          // No changes made which could affect previous entry, keep going.
          post_ins = post_del = true;
          equalitiesLength = 0;
        } else {
          equalitiesLength--;  // Throw away the previous equality;
          pointer = equalitiesLength > 0 ?
              equalities[equalitiesLength - 1] : -1;
          post_ins = post_del = false;
        }
        changes = true;
      }
    }
    pointer++;
  }

  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupMerge = function(diffs) {
  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  var commonlength;
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete !== 0 || count_insert !== 0) {
          if (count_delete !== 0 && count_insert !== 0) {
            // Factor out any common prefixies.
            commonlength = this.diff_commonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if ((pointer - count_delete - count_insert) > 0 &&
                  diffs[pointer - count_delete - count_insert - 1][0] ==
                  DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] +=
                    text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL,
                    text_insert.substring(0, commonlength)]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixies.
            commonlength = this.diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length -
                  commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length -
                  commonlength);
              text_delete = text_delete.substring(0, text_delete.length -
                  commonlength);
            }
          }
          // Delete the offending records and add the merged ones.
          if (count_delete === 0) {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_INSERT, text_insert]);
          } else if (count_insert === 0) {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete]);
          } else {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete],
                [DIFF_INSERT, text_insert]);
          }
          pointer = pointer - count_delete - count_insert +
                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
        } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop();  // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                        diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
          diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
            diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * loc is a location in text1, compute and return the equivalent location in
 * text2.
 * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 * @param {number} loc Location within text1.
 * @return {number} Location within text2.
 */
diff_match_patch.prototype.diff_xIndex = function(diffs, loc) {
  var chars1 = 0;
  var chars2 = 0;
  var last_chars1 = 0;
  var last_chars2 = 0;
  var x;
  for (x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {  // Equality or deletion.
      chars1 += diffs[x][1].length;
    }
    if (diffs[x][0] !== DIFF_DELETE) {  // Equality or insertion.
      chars2 += diffs[x][1].length;
    }
    if (chars1 > loc) {  // Overshot the location.
      break;
    }
    last_chars1 = chars1;
    last_chars2 = chars2;
  }
  // Was the location was deleted?
  if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
    return last_chars2;
  }
  // Add the remaining character length.
  return last_chars2 + (loc - last_chars1);
};


/**
 * Convert a diff array into a pretty HTML report.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
diff_match_patch.prototype.diff_prettyHtml = function(diffs) {
  var html = [];
  var i = 0;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
    var text = data.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/\n/g, '&para;<BR>');
    switch (op) {
      case DIFF_INSERT:
        html[x] = '<INS STYLE="background:#E6FFE6;" TITLE="i=' + i + '">' +
                text + '</INS>';
        break;
      case DIFF_DELETE:
        html[x] = '<DEL STYLE="background:#FFE6E6;" TITLE="i=' + i + '">' +
                text + '</DEL>';
        break;
      case DIFF_EQUAL:
        html[x] = '<SPAN TITLE="i=' + i + '">' + text + '</SPAN>';
        break;
    }
    if (op !== DIFF_DELETE) {
      i += data.length;
    }
  }
  return html.join('');
};


/**
 * Compute and return the source text (all equalities and deletions).
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
diff_match_patch.prototype.diff_text1 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute and return the destination text (all equalities and insertions).
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 * @return {string} Destination text.
 */
diff_match_patch.prototype.diff_text2 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_DELETE) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute the Levenshtein distance; the number of inserted, deleted or
 * substituted characters.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 * @return {number} Number of changes.
 */
diff_match_patch.prototype.diff_levenshtein = function(diffs) {
  var levenshtein = 0;
  var insertions = 0;
  var deletions = 0;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];
    var data = diffs[x][1];
    switch (op) {
      case DIFF_INSERT:
        insertions += data.length;
        break;
      case DIFF_DELETE:
        deletions += data.length;
        break;
      case DIFF_EQUAL:
        // A deletion and an insertion is one substitution.
        levenshtein += Math.max(insertions, deletions);
        insertions = 0;
        deletions = 0;
        break;
    }
  }
  levenshtein += Math.max(insertions, deletions);
  return levenshtein;
};


/**
 * Crush the diff into an encoded string which describes the operations
 * required to transform text1 into text2.
 * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
 * Operations are tab-separated.  Inserted text is escaped using %xx notation.
 * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
 * @return {string} Delta text.
 */
diff_match_patch.prototype.diff_toDelta = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    switch (diffs[x][0]) {
      case DIFF_INSERT:
        text[x] = '+' + encodeURI(diffs[x][1]);
        break;
      case DIFF_DELETE:
        text[x] = '-' + diffs[x][1].length;
        break;
      case DIFF_EQUAL:
        text[x] = '=' + diffs[x][1].length;
        break;
    }
  }
  // Opera doesn't know how to encode char 0.
  return text.join('\t').replace(/\x00/g, '%00').replace(/%20/g, ' ');
};


/**
 * Given the original text1, and an encoded string which describes the
 * operations required to transform text1 into text2, compute the full diff.
 * @param {string} text1 Source string for the diff.
 * @param {string} delta Delta text.
 * @return {Array.<Array.<number|string>>} Array of diff tuples.
 * @throws {Error} If invalid input.
 */
diff_match_patch.prototype.diff_fromDelta = function(text1, delta) {
  var diffs = [];
  var diffsLength = 0;  // Keeping our own length var is faster in JS.
  var pointer = 0;  // Cursor in text1
  // Opera doesn't know how to decode char 0.
  delta = delta.replace(/%00/g, '\0');
  var tokens = delta.split(/\t/g);
  for (var x = 0; x < tokens.length; x++) {
    // Each token begins with a one character parameter which specifies the
    // operation of this token (delete, insert, equality).
    var param = tokens[x].substring(1);
    switch (tokens[x].charAt(0)) {
      case '+':
        try {
          diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
        } catch (ex) {
          // Malformed URI sequence.
          throw new Error('Illegal escape in diff_fromDelta: ' + param);
        }
        break;
      case '-':
        // Fall through.
      case '=':
        var n = parseInt(param, 10);
        if (isNaN(n) || n < 0) {
          throw new Error('Invalid number in diff_fromDelta: ' + param);
        }
        var text = text1.substring(pointer, pointer += n);
        if (tokens[x].charAt(0) == '=') {
          diffs[diffsLength++] = [DIFF_EQUAL, text];
        } else {
          diffs[diffsLength++] = [DIFF_DELETE, text];
        }
        break;
      default:
        // Blank tokens are ok (from a trailing \t).
        // Anything else is an error.
        if (tokens[x]) {
          throw new Error('Invalid diff operation in diff_fromDelta: ' +
                          tokens[x]);
        }
    }
  }
  if (pointer != text1.length) {
    throw new Error('Delta length (' + pointer +
        ') does not equal source text length (' + text1.length + ').');
  }
  return diffs;
};


//  MATCH FUNCTIONS


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 */
diff_match_patch.prototype.match_main = function(text, pattern, loc) {
  // Check for null inputs.
  if (text == null || pattern == null || loc == null) {
    throw new Error('Null input. (match_main)');
  }

  loc = Math.max(0, Math.min(loc, text.length));
  if (text == pattern) {
    // Shortcut (potentially not guaranteed by the algorithm)
    return 0;
  } else if (!text.length) {
    // Nothing to match.
    return -1;
  } else if (text.substring(loc, loc + pattern.length) == pattern) {
    // Perfect match at the perfect spot!  (Includes case of null pattern)
    return loc;
  } else {
    // Do a fuzzy compare.
    return this.match_bitap(text, pattern, loc);
  }
};


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc' using the
 * Bitap algorithm.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 * @private
 */
diff_match_patch.prototype.match_bitap = function(text, pattern, loc) {
  if (pattern.length > this.Match_MaxBits) {
    throw new Error('Pattern too long for this browser.');
  }

  // Initialise the alphabet.
  var s = this.match_alphabet(pattern);

  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Compute and return the score for a match with e errors and x location.
   * Accesses loc and pattern through being a closure.
   * @param {number} e Number of errors in match.
   * @param {number} x Location of match.
   * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
   * @private
   */
  function match_bitapScore(e, x) {
    var accuracy = e / pattern.length;
    var proximity = Math.abs(loc - x);
    if (!dmp.Match_Distance) {
      // Dodge divide by zero error.
      return proximity ? 1.0 : accuracy;
    }
    return accuracy + (proximity / dmp.Match_Distance);
  }

  // Highest score beyond which we give up.
  var score_threshold = this.Match_Threshold;
  // Is there a nearby exact match? (speedup)
  var best_loc = text.indexOf(pattern, loc);
  if (best_loc != -1) {
    score_threshold = Math.min(match_bitapScore(0, best_loc), score_threshold);
    // What about in the other direction? (speedup)
    best_loc = text.lastIndexOf(pattern, loc + pattern.length);
    if (best_loc != -1) {
      score_threshold =
          Math.min(match_bitapScore(0, best_loc), score_threshold);
    }
  }

  // Initialise the bit arrays.
  var matchmask = 1 << (pattern.length - 1);
  best_loc = -1;

  var bin_min, bin_mid;
  var bin_max = pattern.length + text.length;
  var last_rd;
  for (var d = 0; d < pattern.length; d++) {
    // Scan for the best match; each iteration allows for one more error.
    // Run a binary search to determine how far from 'loc' we can stray at this
    // error level.
    bin_min = 0;
    bin_mid = bin_max;
    while (bin_min < bin_mid) {
      if (match_bitapScore(d, loc + bin_mid) <= score_threshold) {
        bin_min = bin_mid;
      } else {
        bin_max = bin_mid;
      }
      bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
    }
    // Use the result from this iteration as the maximum for the next.
    bin_max = bin_mid;
    var start = Math.max(1, loc - bin_mid + 1);
    var finish = Math.min(loc + bin_mid, text.length) + pattern.length;

    var rd = Array(finish + 2);
    rd[finish + 1] = (1 << d) - 1;
    for (var j = finish; j >= start; j--) {
      // The alphabet (s) is a sparse hash, so the following line generates
      // warnings.
      var charMatch = s[text.charAt(j - 1)];
      if (d === 0) {  // First pass: exact match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
      } else {  // Subsequent passes: fuzzy match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch |
                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                last_rd[j + 1];
      }
      if (rd[j] & matchmask) {
        var score = match_bitapScore(d, j - 1);
        // This match will almost certainly be better than any existing match.
        // But check anyway.
        if (score <= score_threshold) {
          // Told you so.
          score_threshold = score;
          best_loc = j - 1;
          if (best_loc > loc) {
            // When passing loc, don't exceed our current distance from loc.
            start = Math.max(1, 2 * loc - best_loc);
          } else {
            // Already passed loc, downhill from here on in.
            break;
          }
        }
      }
    }
    // No hope for a (better) match at greater error levels.
    if (match_bitapScore(d + 1, loc) > score_threshold) {
      break;
    }
    last_rd = rd;
  }
  return best_loc;
};


/**
 * Initialise the alphabet for the Bitap algorithm.
 * @param {string} pattern The text to encode.
 * @return {Object} Hash of character locations.
 * @private
 */
diff_match_patch.prototype.match_alphabet = function(pattern) {
  var s = {};
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] = 0;
  }
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
  }
  return s;
};


//  PATCH FUNCTIONS


/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond Match_MaxBits.
 * @param {patch_obj} patch The patch to grow.
 * @param {string} text Source text.
 * @private
 */
diff_match_patch.prototype.patch_addContext = function(patch, text) {
  if (text.length == 0) {
    return;
  }
  var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
  var padding = 0;

  // Look for the first and last matches of pattern in text.  If two different
  // matches are found, increase the pattern length.
  while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
         pattern.length < this.Match_MaxBits - this.Patch_Margin -
         this.Patch_Margin) {
    padding += this.Patch_Margin;
    pattern = text.substring(patch.start2 - padding,
                             patch.start2 + patch.length1 + padding);
  }
  // Add one chunk for good luck.
  padding += this.Patch_Margin;

  // Add the prefix.
  var prefix = text.substring(patch.start2 - padding, patch.start2);
  if (prefix) {
    patch.diffs.unshift([DIFF_EQUAL, prefix]);
  }
  // Add the suffix.
  var suffix = text.substring(patch.start2 + patch.length1,
                              patch.start2 + patch.length1 + padding);
  if (suffix) {
    patch.diffs.push([DIFF_EQUAL, suffix]);
  }

  // Roll back the start points.
  patch.start1 -= prefix.length;
  patch.start2 -= prefix.length;
  // Extend the lengths.
  patch.length1 += prefix.length + suffix.length;
  patch.length2 += prefix.length + suffix.length;
};


/**
 * Compute a list of patches to turn text1 into text2.
 * Use diffs if provided, otherwise compute it ourselves.
 * There are four ways to call this function, depending on what data is
 * available to the caller:
 * Method 1:
 * a = text1, b = text2
 * Method 2:
 * a = diffs
 * Method 3 (optimal):
 * a = text1, b = diffs
 * Method 4 (deprecated, use method 3):
 * a = text1, b = text2, c = diffs
 *
 * @param {string|Array.<Array.<number|string>>} a text1 (methods 1,3,4) or
 * Array of diff tuples for text1 to text2 (method 2).
 * @param {string|Array.<Array.<number|string>>} opt_b text2 (methods 1,4) or
 * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
 * @param {string|Array.<Array.<number|string>>} opt_c Array of diff tuples for
 * text1 to text2 (method 4) or undefined (methods 1,2,3).
 * @return {Array.<patch_obj>} Array of patch objects.
 */
diff_match_patch.prototype.patch_make = function(a, opt_b, opt_c) {
  var text1, diffs;
  if (typeof a == 'string' && typeof opt_b == 'string' &&
      typeof opt_c == 'undefined') {
    // Method 1: text1, text2
    // Compute diffs from text1 and text2.
    text1 = a;
    diffs = this.diff_main(text1, opt_b, true);
    if (diffs.length > 2) {
      this.diff_cleanupSemantic(diffs);
      this.diff_cleanupEfficiency(diffs);
    }
  } else if (a && typeof a == 'object' && typeof opt_b == 'undefined' &&
      typeof opt_c == 'undefined') {
    // Method 2: diffs
    // Compute text1 from diffs.
    diffs = a;
    text1 = this.diff_text1(diffs);
  } else if (typeof a == 'string' && opt_b && typeof opt_b == 'object' &&
      typeof opt_c == 'undefined') {
    // Method 3: text1, diffs
    text1 = a;
    diffs = opt_b;
  } else if (typeof a == 'string' && typeof opt_b == 'string' &&
      opt_c && typeof opt_c == 'object') {
    // Method 4: text1, text2, diffs
    // text2 is not used.
    text1 = a;
    diffs = opt_c;
  } else {
    throw new Error('Unknown call format to patch_make.');
  }

  if (diffs.length === 0) {
    return [];  // Get rid of the null case.
  }
  var patches = [];
  var patch = new patch_obj();
  var patchDiffLength = 0;  // Keeping our own length var is faster in JS.
  var char_count1 = 0;  // Number of characters into the text1 string.
  var char_count2 = 0;  // Number of characters into the text2 string.
  // Start with text1 (prepatch_text) and apply the diffs until we arrive at
  // text2 (postpatch_text).  We recreate the patches one by one to determine
  // context info.
  var prepatch_text = text1;
  var postpatch_text = text1;
  for (var x = 0; x < diffs.length; x++) {
    var diff_type = diffs[x][0];
    var diff_text = diffs[x][1];

    if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
      // A new patch starts here.
      patch.start1 = char_count1;
      patch.start2 = char_count2;
    }

    switch (diff_type) {
      case DIFF_INSERT:
        patch.diffs[patchDiffLength++] = diffs[x];
        patch.length2 += diff_text.length;
        postpatch_text = postpatch_text.substring(0, char_count2) + diff_text +
                         postpatch_text.substring(char_count2);
        break;
      case DIFF_DELETE:
        patch.length1 += diff_text.length;
        patch.diffs[patchDiffLength++] = diffs[x];
        postpatch_text = postpatch_text.substring(0, char_count2) +
                         postpatch_text.substring(char_count2 +
                             diff_text.length);
        break;
      case DIFF_EQUAL:
        if (diff_text.length <= 2 * this.Patch_Margin &&
            patchDiffLength && diffs.length != x + 1) {
          // Small equality inside a patch.
          patch.diffs[patchDiffLength++] = diffs[x];
          patch.length1 += diff_text.length;
          patch.length2 += diff_text.length;
        } else if (diff_text.length >= 2 * this.Patch_Margin) {
          // Time for a new patch.
          if (patchDiffLength) {
            this.patch_addContext(patch, prepatch_text);
            patches.push(patch);
            patch = new patch_obj();
            patchDiffLength = 0;
            // Unlike Unidiff, our patch lists have a rolling context.
            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
            // Update prepatch text & pos to reflect the application of the
            // just completed patch.
            prepatch_text = postpatch_text;
            char_count1 = char_count2;
          }
        }
        break;
    }

    // Update the current character count.
    if (diff_type !== DIFF_INSERT) {
      char_count1 += diff_text.length;
    }
    if (diff_type !== DIFF_DELETE) {
      char_count2 += diff_text.length;
    }
  }
  // Pick up the leftover patch if not empty.
  if (patchDiffLength) {
    this.patch_addContext(patch, prepatch_text);
    patches.push(patch);
  }

  return patches;
};


/**
 * Given an array of patches, return another array that is identical.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @return {Array.<patch_obj>} Array of patch objects.
 */
diff_match_patch.prototype.patch_deepCopy = function(patches) {
  // Making deep copies is hard in JavaScript.
  var patchesCopy = [];
  for (var x = 0; x < patches.length; x++) {
    var patch = patches[x];
    var patchCopy = new patch_obj();
    patchCopy.diffs = [];
    for (var y = 0; y < patch.diffs.length; y++) {
      patchCopy.diffs[y] = patch.diffs[y].slice();
    }
    patchCopy.start1 = patch.start1;
    patchCopy.start2 = patch.start2;
    patchCopy.length1 = patch.length1;
    patchCopy.length2 = patch.length2;
    patchesCopy[x] = patchCopy;
  }
  return patchesCopy;
};


/**
 * Merge a set of patches onto the text.  Return a patched text, as well
 * as a list of true/false values indicating which patches were applied.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @param {string} text Old text.
 * @return {Array.<string|Array.<boolean>>} Two element Array, containing the
 *      new text and an array of boolean values.
 */
diff_match_patch.prototype.patch_apply = function(patches, text) {
  if (patches.length == 0) {
    return [text, []];
  }

  // Deep copy the patches so that no changes are made to originals.
  patches = this.patch_deepCopy(patches);

  var nullPadding = this.patch_addPadding(patches);
  text = nullPadding + text + nullPadding;

  this.patch_splitMax(patches);
  // delta keeps track of the offset between the expected and actual location
  // of the previous patch.  If there are patches expected at positions 10 and
  // 20, but the first patch was found at 12, delta is 2 and the second patch
  // has an effective expected position of 22.
  var delta = 0;
  var results = [];
  for (var x = 0; x < patches.length; x++) {
    var expected_loc = patches[x].start2 + delta;
    var text1 = this.diff_text1(patches[x].diffs);
    var start_loc;
    var end_loc = -1;
    if (text1.length > this.Match_MaxBits) {
      // patch_splitMax will only provide an oversized pattern in the case of
      // a monster delete.
      start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits),
                                  expected_loc);
      if (start_loc != -1) {
        end_loc = this.match_main(text,
            text1.substring(text1.length - this.Match_MaxBits),
            expected_loc + text1.length - this.Match_MaxBits);
        if (end_loc == -1 || start_loc >= end_loc) {
          // Can't find valid trailing context.  Drop this patch.
          start_loc = -1;
        }
      }
    } else {
      start_loc = this.match_main(text, text1, expected_loc);
    }
    if (start_loc == -1) {
      // No match found.  :(
      results[x] = false;
      // Subtract the delta for this failed patch from subsequent patches.
      delta -= patches[x].length2 - patches[x].length1;
    } else {
      // Found a match.  :)
      results[x] = true;
      delta = start_loc - expected_loc;
      var text2;
      if (end_loc == -1) {
        text2 = text.substring(start_loc, start_loc + text1.length);
      } else {
        text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
      }
      if (text1 == text2) {
        // Perfect match, just shove the replacement text in.
        text = text.substring(0, start_loc) +
               this.diff_text2(patches[x].diffs) +
               text.substring(start_loc + text1.length);
      } else {
        // Imperfect match.  Run a diff to get a framework of equivalent
        // indices.
        var diffs = this.diff_main(text1, text2, false);
        if (text1.length > this.Match_MaxBits &&
            this.diff_levenshtein(diffs) / text1.length >
            this.Patch_DeleteThreshold) {
          // The end points match, but the content is unacceptably bad.
          results[x] = false;
        } else {
          this.diff_cleanupSemanticLossless(diffs);
          var index1 = 0;
          var index2;
          for (var y = 0; y < patches[x].diffs.length; y++) {
            var mod = patches[x].diffs[y];
            if (mod[0] !== DIFF_EQUAL) {
              index2 = this.diff_xIndex(diffs, index1);
            }
            if (mod[0] === DIFF_INSERT) {  // Insertion
              text = text.substring(0, start_loc + index2) + mod[1] +
                     text.substring(start_loc + index2);
            } else if (mod[0] === DIFF_DELETE) {  // Deletion
              text = text.substring(0, start_loc + index2) +
                     text.substring(start_loc + this.diff_xIndex(diffs,
                         index1 + mod[1].length));
            }
            if (mod[0] !== DIFF_DELETE) {
              index1 += mod[1].length;
            }
          }
        }
      }
    }
  }
  // Strip the padding off.
  text = text.substring(nullPadding.length, text.length - nullPadding.length);
  return [text, results];
};


/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @return {string} The padding string added to each side.
 */
diff_match_patch.prototype.patch_addPadding = function(patches) {
  var paddingLength = this.Patch_Margin;
  var nullPadding = '';
  for (var x = 1; x <= paddingLength; x++) {
    nullPadding += String.fromCharCode(x);
  }

  // Bump all the patches forward.
  for (var x = 0; x < patches.length; x++) {
    patches[x].start1 += paddingLength;
    patches[x].start2 += paddingLength;
  }

  // Add some padding on start of first diff.
  var patch = patches[0];
  var diffs = patch.diffs;
  if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.unshift([DIFF_EQUAL, nullPadding]);
    patch.start1 -= paddingLength;  // Should be 0.
    patch.start2 -= paddingLength;  // Should be 0.
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[0][1].length) {
    // Grow first equality.
    var extraLength = paddingLength - diffs[0][1].length;
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
    patch.start1 -= extraLength;
    patch.start2 -= extraLength;
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  // Add some padding on end of last diff.
  patch = patches[patches.length - 1];
  diffs = patch.diffs;
  if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.push([DIFF_EQUAL, nullPadding]);
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[diffs.length - 1][1].length) {
    // Grow last equality.
    var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  return nullPadding;
};


/**
 * Look through the patches and break up any which are longer than the maximum
 * limit of the match algorithm.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 */
diff_match_patch.prototype.patch_splitMax = function(patches) {
  for (var x = 0; x < patches.length; x++) {
    if (patches[x].length1 > this.Match_MaxBits) {
      var bigpatch = patches[x];
      // Remove the big old patch.
      patches.splice(x--, 1);
      var patch_size = this.Match_MaxBits;
      var start1 = bigpatch.start1;
      var start2 = bigpatch.start2;
      var precontext = '';
      while (bigpatch.diffs.length !== 0) {
        // Create one of several smaller patches.
        var patch = new patch_obj();
        var empty = true;
        patch.start1 = start1 - precontext.length;
        patch.start2 = start2 - precontext.length;
        if (precontext !== '') {
          patch.length1 = patch.length2 = precontext.length;
          patch.diffs.push([DIFF_EQUAL, precontext]);
        }
        while (bigpatch.diffs.length !== 0 &&
               patch.length1 < patch_size - this.Patch_Margin) {
          var diff_type = bigpatch.diffs[0][0];
          var diff_text = bigpatch.diffs[0][1];
          if (diff_type === DIFF_INSERT) {
            // Insertions are harmless.
            patch.length2 += diff_text.length;
            start2 += diff_text.length;
            patch.diffs.push(bigpatch.diffs.shift());
            empty = false;
          } else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 &&
                     patch.diffs[0][0] == DIFF_EQUAL &&
                     diff_text.length > 2 * patch_size) {
            // This is a large deletion.  Let it pass in one chunk.
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            empty = false;
            patch.diffs.push([diff_type, diff_text]);
            bigpatch.diffs.shift();
          } else {
            // Deletion or equality.  Only take as much as we can stomach.
            diff_text = diff_text.substring(0, patch_size - patch.length1 -
                                               this.Patch_Margin);
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            if (diff_type === DIFF_EQUAL) {
              patch.length2 += diff_text.length;
              start2 += diff_text.length;
            } else {
              empty = false;
            }
            patch.diffs.push([diff_type, diff_text]);
            if (diff_text == bigpatch.diffs[0][1]) {
              bigpatch.diffs.shift();
            } else {
              bigpatch.diffs[0][1] =
                  bigpatch.diffs[0][1].substring(diff_text.length);
            }
          }
        }
        // Compute the head context for the next patch.
        precontext = this.diff_text2(patch.diffs);
        precontext =
            precontext.substring(precontext.length - this.Patch_Margin);
        // Append the end context for this patch.
        var postcontext = this.diff_text1(bigpatch.diffs)
                              .substring(0, this.Patch_Margin);
        if (postcontext !== '') {
          patch.length1 += postcontext.length;
          patch.length2 += postcontext.length;
          if (patch.diffs.length !== 0 &&
              patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
            patch.diffs[patch.diffs.length - 1][1] += postcontext;
          } else {
            patch.diffs.push([DIFF_EQUAL, postcontext]);
          }
        }
        if (!empty) {
          patches.splice(++x, 0, patch);
        }
      }
    }
  }
};


/**
 * Take a list of patches and return a textual representation.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @return {string} Text representation of patches.
 */
diff_match_patch.prototype.patch_toText = function(patches) {
  var text = [];
  for (var x = 0; x < patches.length; x++) {
    text[x] = patches[x];
  }
  return text.join('');
};


/**
 * Parse a textual representation of patches and return a list of patch objects.
 * @param {string} textline Text representation of patches.
 * @return {Array.<patch_obj>} Array of patch objects.
 * @throws {Error} If invalid input.
 */
diff_match_patch.prototype.patch_fromText = function(textline) {
  var patches = [];
  if (!textline) {
    return patches;
  }
  // Opera doesn't know how to decode char 0.
  textline = textline.replace(/%00/g, '\0');
  var text = textline.split('\n');
  var textPointer = 0;
  while (textPointer < text.length) {
    var m = text[textPointer].match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/);
    if (!m) {
      throw new Error('Invalid patch string: ' + text[textPointer]);
    }
    var patch = new patch_obj();
    patches.push(patch);
    patch.start1 = parseInt(m[1], 10);
    if (m[2] === '') {
      patch.start1--;
      patch.length1 = 1;
    } else if (m[2] == '0') {
      patch.length1 = 0;
    } else {
      patch.start1--;
      patch.length1 = parseInt(m[2], 10);
    }

    patch.start2 = parseInt(m[3], 10);
    if (m[4] === '') {
      patch.start2--;
      patch.length2 = 1;
    } else if (m[4] == '0') {
      patch.length2 = 0;
    } else {
      patch.start2--;
      patch.length2 = parseInt(m[4], 10);
    }
    textPointer++;

    while (textPointer < text.length) {
      var sign = text[textPointer].charAt(0);
      try {
        var line = decodeURI(text[textPointer].substring(1));
      } catch (ex) {
        // Malformed URI sequence.
        throw new Error('Illegal escape in patch_fromText: ' + line);
      }
      if (sign == '-') {
        // Deletion.
        patch.diffs.push([DIFF_DELETE, line]);
      } else if (sign == '+') {
        // Insertion.
        patch.diffs.push([DIFF_INSERT, line]);
      } else if (sign == ' ') {
        // Minor equality.
        patch.diffs.push([DIFF_EQUAL, line]);
      } else if (sign == '@') {
        // Start of next patch.
        break;
      } else if (sign === '') {
        // Blank line?  Whatever.
      } else {
        // WTF?
        throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
      }
      textPointer++;
    }
  }
  return patches;
};


/**
 * Class representing one patch operation.
 * @constructor
 */
function patch_obj() {
  /** @type {Array.<Array.<number|string>>} */
  this.diffs = [];
  /** @type {?number} */
  this.start1 = null;
  /** @type {?number} */
  this.start2 = null;
  /** @type {number} */
  this.length1 = 0;
  /** @type {number} */
  this.length2 = 0;
}


/**
 * Emmulate GNU diff's format.
 * Header: @@ -382,8 +481,9 @@
 * Indicies are printed as 1-based, not 0-based.
 * @return {string} The GNU diff string.
 */
patch_obj.prototype.toString = function() {
  var coords1, coords2;
  if (this.length1 === 0) {
    coords1 = this.start1 + ',0';
  } else if (this.length1 == 1) {
    coords1 = this.start1 + 1;
  } else {
    coords1 = (this.start1 + 1) + ',' + this.length1;
  }
  if (this.length2 === 0) {
    coords2 = this.start2 + ',0';
  } else if (this.length2 == 1) {
    coords2 = this.start2 + 1;
  } else {
    coords2 = (this.start2 + 1) + ',' + this.length2;
  }
  var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
  var op;
  // Escape the body of the patch with %xx notation.
  for (var x = 0; x < this.diffs.length; x++) {
    switch (this.diffs[x][0]) {
      case DIFF_INSERT:
        op = '+';
        break;
      case DIFF_DELETE:
        op = '-';
        break;
      case DIFF_EQUAL:
        op = ' ';
        break;
    }
    text[x + 1] = op + encodeURI(this.diffs[x][1]) + '\n';
  }
  // Opera doesn't know how to encode char 0.
  return text.join('').replace(/\x00/g, '%00').replace(/%20/g, ' ');
};


// Export these global variables so that they survive Google's JS compiler.
/*changed by lfborjas: changed `window` for `exports` to make it suitable for the node.js module conventions*/
exports['diff_match_patch'] = diff_match_patch;
exports['patch_obj'] = patch_obj;
exports['DIFF_DELETE'] = DIFF_DELETE;
exports['DIFF_INSERT'] = DIFF_INSERT;
exports['DIFF_EQUAL'] = DIFF_EQUAL;

})()
},{}],17:[function(require,module,exports){
var Event = require('./lib/event')

var Set = module.exports = function() {}

Set.prototype = new Event();

Set.prototype.set = function(k,v) {
	if(v === undefined) {
		for(var i in k) {
			this.set(i,k[i]);
		}
		return;
	}
	this[k] = v;
	this.trigger('change:' + k,v);
};

Set.prototype.get = function(k) {
	return this[k]
};

},{"./lib/event":23}],11:[function(require,module,exports){
var _ = require('underscore');
//http://blog.elliotjameschong.com/2012/10/10/underscore-js-deepclone-and-deepextend-mix-ins/ thanks!
_.mixin({
	deepClone: function(p_object) {
		return JSON.parse(JSON.stringify(p_object));
	}
});

function shallowCopy(obj) {
	var newObj = {};
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			newObj[i] = obj[i]
		}
	}
	return newObj;
}


var mark = module.exports = function(str, mk) {
	if (str.marks & !mk) return str;
	var tmpStr = new String(str);
	tmpStr.marks = [];
	if (str.marks) tmpStr.marks = _.deepClone(str.marks);
	str = tmpStr;
	if (mk) {
		if ('length' in mk) {
			if (mk.length) {
				str.marks = mk;
			}
		} else {
			str.marks.push(mk);
		}
	}
	str._substring = str._substring || str.substring;
	str.substring = function(from, to) {
		if (from === to) return mark('');
		var newString = mark(str._substring.apply(str, arguments));
		for (var i in str.marks) {
			if (str.marks.hasOwnProperty(i)) {
				if (str.marks[i].col >= from && ((!to && to !== 0) || str.marks[i].col < to)) {
					var newMark = shallowCopy(str.marks[i]);
					newMark.col = str.marks[i].col - from;
					newString.marks.push(newMark);
				}
			}
		}
		if (newString.length > (to - from)) throw "awwww";
		return newString;
	}

	str._concat = str.concat;
	str.concat = function(incomingStr) {
		var marks = str.marks;

		if (incomingStr.marks && incomingStr.marks.length) {
			for (var i in incomingStr.marks) {
				if (incomingStr.marks.hasOwnProperty(i)) {
					var newMark = incomingStr.marks[i];
					newMark.col += str.length;
					marks.push(newMark);
				}
			}
		}
		return mark(str._concat(incomingStr), marks);
	};

	return str;
};

},{"underscore":18}],24:[function(require,module,exports){
var Event = require('./Event');

var Cursor = function(obj) {

	this._line = 0;
	this._char = 0;

	if (typeof obj === 'object') {
		if ('line' in obj) this._line = obj.line;
		if ('char' in obj) this._char = obj.char;
	}

	//Whether the cursor has changed since last set
	this.moved = false;

	this.on('change', function() {
		this.moved = true;
	});
};


Cursor.prototype = new Event();

Cursor.prototype.line = function(num) {
	if (typeof num === 'number' && this._line !== num) {
		this._line = num;
		this.trigger('change:line', num);
		this.trigger('change');
	}

	if ('doc' in this) {
		if (this.doc._lines.length && this.doc._lines.length <= this._line) {
			this.line(this.doc._lines.length - 1);
		}
	}

	return this._line;
};

Cursor.prototype.col = function(num) {
	if (typeof num === 'number' && this._char !== num) {
		this._char = num;
		this.trigger('change:char', num);
		this.trigger('change');
	}

	//Just say we are on the last character if it's not available.
	if ('doc' in this) {
		if (this.doc.line().length < this._char) {
			return this.doc.line().length;
		}
	}
	return this._char;
};

Cursor.prototype.char = function() {
	return this.col.apply(this, arguments);
};

Cursor.prototype.position = function(pos) {
	if (pos) {
		this.line(pos.line);
		this.char(pos.char);
	}
	return {
		line: this.line(),
		char: this.char(),
		col: this.col()
	}
};

module.exports = Cursor;

},{"./Event":21}],12:[function(require,module,exports){
(function(){var Cursor = require('./Cursor');
var _ = require('underscore');

var mark = require('./mark');

var Event = require('./Event');

Doc = function(obj) {

	this.cursor = new Cursor();
	this.cursor.doc = this;
	this.cursor.on('change', function() {
		this.trigger('change:cursor');
	}.bind(this));

	this._text = '';
	this._lines = [];
	this.undo.add({
		text: '',
		cursor: {
			char: 0,
			line: 0
		}
	});
	this._marks = {};

	this.selecting = false; //The document behaves differently when navigating vs. selecting
	this.yanking = false; //'yanking' sub-mode
	if (typeof obj === 'object') {
		if ('text' in obj) {
			this._text = obj.text;
		}
	}

	this._selection = [];

	if (this._text.length) this._lines = this._text.split('\n');
};

Doc.prototype = new Event();
var _lasts = [];

/** Repeating commands need to look up the parameters for the command that happened! Store it here.

*/
Doc.prototype.last = function(k, v) {
	if (v) {
		return _lasts[k] = v;
	}
	return _lasts[k];
};
var Undo = require('./Undo');

Doc.prototype.undo = new Undo();





Doc.prototype.set = function(k, v) {
	var obj;
	if (v && typeof k === 'string') {
		obj = {};
		obj[k] = v;
		return this.set(obj);
	}
	obj = k;
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			this['_' + i] = obj[i];
			this.trigger('change:' + i, obj[i]);
			this.trigger('change');
		}
	}
};

//Getter / setter
Doc.prototype.text = function(text) {
	if (text || text === '') {
		if (typeof text === 'string') {
			this._text = text;
			this._lines = this._text.split('\n');
			this.trigger('change:text');
		} else if ('length' in text) {
			return this._lines.slice.apply(this._lines, text).join('\n')
		}
	}
	return this._text;
};

Doc.prototype.getRange = function(range) {

	var text = mark('');

	// If block selection
	if (!('line' in range[0]) && range[0][0] && 'line' in range[0][0]) {
		//AAAHHH!
		_(range).each(function(subRange) {
			text += this.getRange(subRange);
		}, this);
		return text;

	}


	//if same line, just do as one
	if (range[0].line === range[1].line) {
		text = this.line(range[0].line).substring(parseInt(range[0].char), parseInt(range[1].char));
	} else {

		//else start by grabbing rest of this line
		text = text.concat(this.line(range[0].line).substring(range[0].char));

		//if more lines, add each with an \n before
		var middleLineCount = range[1].line - range[0].line;
		var ct = 1;
		while (ct < middleLineCount) {
			text = text.concat('\n').concat(this.line(range[0].line + ct));
			ct++;
		}

		//add the first bit of the last line
		var lastLine = this.line(range[1].line);
		text = text.concat('\n').concat(lastLine.substring(0, range[1].char));
	}

	//If it extends beyond the actual text add a return
	if (range[1].char > this.line(range[1].line).length) {
		text = text.concat('\n');
	}

	return text;

};

/** Add a mark to the document, embedded in one of the lines of the document
 */
Doc.prototype.addMark = function(mk) {
	if (!mk) return;
	if (!('line' in mk && 'col' in mk)) throw "bad mark."
	var markId = (new Date().getTime() + Math.random()).toString(16)
	mk.id = markId;
	this._marks[mk.mark] = mk;
	if (mk.mark === '.') return;
	this._lines[mk.line] = mark(this._lines[mk.line], mk);
};

Doc.prototype.getMark = function(index) {
	if (index === '.') return this._marks['.'];
	var markId = this._marks[index].id;
	var mark = false;
	_(this._lines).each(function(line, lineIndex) {
		if (mark) return;
		if (line.marks && line.marks.length) {
			if (mark) return;
			_(line.marks).each(function(lineMark) {
				if (lineMark.id === markId) mark = lineMark;
				mark.line = lineIndex;
			});
		}
	});
	return mark;
};

//Retrieve the line at num; default to cursor if no num
Doc.prototype.line = function(num) {
	if (typeof num !== 'number') num = this.cursor.line();
	if (this._lines.length <= num) {
		if (this.cursor.line() === 0) {
			this._lines.push('');
		} else {
			console.log(new Error().stack);
			throw "Line out of range of document";
		}
	}
	return this._lines[num];
};

//Input text
Doc.prototype.insert = function(text) {

	if (typeof text !== 'string' & !text.marks) throw "Only strings can be inserted into a doc";

	if (text.length > 1) {
		for (var i = 0; i < text.length; i++) {
			this.insert(text.substring(i, i + 1));
		}
		return;
	}

	var curLine = this.line()
	var lineBackup = mark(curLine, curLine.marks);
	curLine = curLine.substring(0, this.cursor.char());
	if (typeof text.marks !== 'undefined' && typeof curLine.marks === 'undefined') {
		curLine = mark(curLine);
	}
	curLine = curLine.concat(text);
	curLine = curLine.concat(lineBackup.substring(this.cursor.char()));
	if (text.toString() === '\n') {
		var curLineIndex = this.cursor.line();
		var lines = curLine.split('\n');
		this._lines[curLineIndex] = lines[0];
		this._lines.splice(curLineIndex + 1, 0, lines[1]);
		this.cursor.line(curLineIndex + 1);
		this.cursor.char(0);
	} else {
		this._lines[this.cursor.line()] = curLine;
		this.cursor.char(this.cursor.char() + text.length);
	}

	//Add mark
	var pos = this.cursor.position();
	pos.mark = '.';
	this.addMark(pos);

	this.set({
		text: this._lines.join('\n')
	});
	this.trigger('change');
};

/** Remove removes a range of characters like:

	[
		//from
		{
			char: number,
			line: number
		},
		//to
		{
			char: number,
			line: number
		}
	]

*/
Doc.prototype.remove = function(range) {
	//if invalid
	if (!isRange(range)) throw 'Not a valid range.';
	if (!('line' in range[0])) {
		return _.each(range, function(subRange) {
			this.remove(subRange);
		}, this);
	}

	//grab first half of line if exists
	var first = this._lines[range[0].line].substring(0, range[0].char);

	//check if joining after, determined by whether there's anything left of the line.
	var join = range[1].char >= this._lines[range[1].line].length ? true : false;

	//grab end of other line if exists
	var last = this._lines[range[1].line].substring(range[1].char);

	//if the last line is entirely selected, remove it.

	//if the entire 
	var deleteLastLine = (!range[0].char //range opens at first character of a line
		|| range[0].line < range[1].line) //or range opens above the line it ends on
	&& range[1].char > this.line(range[1].line).length; //and range extends beyond the characters (into presumed \n)

	//delete all lines in between if exist
	if (range[1].line > range[0].line) this._lines.splice(range[0].line + 1, (range[1].line - range[0].line));

	//if the second range goes over and no first half AND not the same line, remove current line
	if (join && !first.length && range[0].line !== range[1].line) {
		this._lines.splice(range[0].line, 1)
	} else if (deleteLastLine) {
		this._lines.splice(range[1].line, 1)
	} else { //otherwise join first and second half and set as line.
		this._lines[range[0].line] = first.concat(last);
	}

	//Add mark
	var pos = this.cursor.position();
	pos.mark = '.';
	this.addMark(pos);


	this.set({
		text: this._lines.join('\n')
	});
};

/* Finds the next instance of that exp, returning a range */

Doc.prototype.find = function(exp, opts) {
	opts = opts || {},
	carriage = '',
	backwards = false,
	wholeLine = false,
	// Range here represents how far to look. Defaults to %, all.
	range = (opts.range || opts.range === false) ? opts.range : '%',
	offset = 0,
	inclusive = false;

	if (this.selecting) {
		carriage = '\n';
	}

	if ('backwards' in opts && opts.backwards) {
		backwards = true;
	}

	if ('inclusive' in opts && opts.inclusive) {
		inclusive = true;
	}

	if ('wholeLine' in opts && opts.wholeLine) wholeLine = true;

	if ('offset' in opts && opts.offset) offset = opts.offset;


	//check the rest of this line
	var rest;
	var thisLine = this.line() + carriage;

	var tmpOffset = 0;
	if (offset) {
		tmpOffset = offset;
	} else if (wholeLine) {
		tmpOffset = 0;
	} else {
		tmpOffset = this.cursor.char();
		if (backwards) {
			//TODO
		} else {
			tmpOffset += 1;
		}
		if (inclusive) {
			if (backwards) {
				tmpOffset += 1;
			} else {
				tmpOffset -= 1;
			}
		}
	}

	var curIndex = checkString(exp, thisLine, tmpOffset, backwards);

	if (curIndex > -1) {
		return {
			line: this.cursor.line(),
			char: curIndex,
			found: true
		};
	}

	if (range) {
		//now check the rest. Decrement if this is a backwards search.
		var lineIndex = this.cursor.line() + (backwards ? -1 : 1);
		while (lineIndex < this._lines.length && lineIndex >= 0) {
			var foundAt = checkString(exp, this._lines[lineIndex] + carriage, 0, backwards);
			if (foundAt > -1) return {
				line: lineIndex,
				char: foundAt,
				found: true
			};
			lineIndex += (backwards ? -1 : 1);
		}
	}

	//return the last character if not found.
	var result = backwards ? this.firstPosition() : this.lastPosition();
	result.found = false;
	return result;
};

Doc.prototype.lastPosition = function() {
	return {
		line: this._lines.length - 1,
		char: this._lines[this._lines.length - 1].length - 1
	};
};

Doc.prototype.firstPosition = function() {
	return {
		line: 0,
		char: 0
	}
};


/** Check a string for a regular expression, indicating where in the string the match begins. -1 for false
 */

function checkString(exp, str, offset, backwards) {

	//Because of the lastIndex use the expression needs to be global
	if (!exp.global) throw "Regular expressions need to be global here";

	//Offset optional
	if (offset == null) offset = 0;

	//Don't search before the offset
	if (!backwards) exp.lastIndex = offset;

	//If backwards, don't consider the rest of the string
	if (backwards && offset !== 0) str = str.substring(0, offset);

	var test = exp.exec(str);

	if (!test) return -1;

	result = !! test[1] ? test[1] : test[2];
	if (backwards) {
		// AND this match is not looking for the beginning of the line. 
		// TODO: make this check airtight, maybe faster.
		if (exp.toString().match(/[^\\^\[](\^)/)) {
			return str.indexOf(result);
		} else {
			return str.lastIndexOf(result);
		}
	} else {
		return exp.lastIndex - test[0].length + test[0].indexOf(result);
	}

}

//Expose for testing!
Doc.prototype.checkString = checkString;

var _selection = false;
Doc.prototype.selection = function(range) {
	//Reset if told
	if (range === 'reset') return _selection = false;

	if (range) { //Set
		_selection = range;
	} else if (!_selection) { //Set as cursor position if none
		var pos = this.cursor.position();
		var end = {
			line: pos.line,
			char: pos.char + 1
		};
		return [pos, end];
	}
	return _selection; //get
};



function isRange(range) {
	if (!('line' in range[0]) && _(range[0]).isArray()) {
		var areRanges = true;
		_.each(range, function(subRange) {
			if (!isRange(subRange)) areRanges = false;
		});
		return areRanges;

	}
	if (!range) return false;
	if (!('length' in range)) return false;

	if (!range.length === 2) return false;

	//basic structure
	if ('char' in range[0] && 'line' in range[0] && 'char' in range[1] && 'line' in range[1]) {
		if (range[0].line > range[1].line) return false;
		if (range[0].line === range[1].line && range[0].char > range[1].char) return false;
	} else {
		return false;
	}

	return true;
};

/** Check whether a position is a part of the current selection. */
Doc.prototype.inSelection = function(pos) {

};

Doc.prototype.exec = function() {
	if ('vim' in this) this.vim.exec.apply(this.vim, arguments);
}

module.exports = Doc;

})()
},{"./Cursor":24,"./mark":11,"./Event":21,"./Undo":22,"underscore":18}],13:[function(require,module,exports){
var _ = require('underscore'),
	Set = require('get-set');

var mauve = require('mauve');

//var rainbow = require('./3rd/rainbow/js/rainbow.js');
//require('./3rd/rainbow/js/language/javascript.js')(rainbow);

mauve.set({
	'idle': '#0000ff',
	'gutter': '#d75f00',
	'cursor': '/#555',
	'status': 'bold',
	'entity.function': '#dc3',
	'storage': "#21F",
	'function.anonymous': '#1F1',
	'selection': '#000/#fff'
});

/*

	View handles the difference between what's stored in the file and what is visible on the screen.

	Individual implementations (cli, web) should listen to view

	Probably the optimal basis for view will be communication of diffs

*/
var View = module.exports = function(obj) {
	//Grab a handle
	this.vim = obj.vim;
	this.color = true;

	//Set dimensions, defaulting to 24 lines of 80 columns	
	this.lines = obj.lines || 24;
	this.cols = obj.cols || 80;

	//Array keeping track of which segment of the doc we are looking at.
	this.lastVisibleLines = [0, 1];

	this.vim.on('change', this.handleChange.bind(this));
	this.idle = false;
	this.vim.on('idle', function() {
		this.idle = true;
		this.handleChange.bind(this);
	}.bind(this));



	this.vim.on('change:status', function() {
		this.trigger('change');
	}.bind(this));

	//The status message;
	this.status = '';

	//An array of the text
	this.lineArray = [];

	//The line that has focus. For now: line at bottom of screen
	this.focus = 0;


};

//Inherit 'on', 'trigger'
View.prototype = new Set();

/** Responds to vim changes

*/
View.prototype.handleChange = function() {
	//    if(!this.idle) return;
	this.refreshStatusLine();
	this.getText();

	this.trigger('change');
	this.idle = false;
};
var renderCt = 0;

/* The basic status line */
View.prototype.refreshStatusLine = function() {

	//Some modes just show the name
	if (this.notification) {
		this.status = this.notification;
		this.notification = false;
		return this.status;
	}
	if ('insert,replace'.indexOf(this.vim.modeName) !== -1) {
		var text = '-- ' + this.vim.modeName.toUpperCase() + ' --';
		this.status = this.color ? mauve(text).status : text;
		return this.status;
	}
	var keys = this.vim.keyBuffer;
	var firstKey = keys.substring(0, 1);
	if (firstKey === '/' || firstKey === '?' || firstKey === ':') {
		return this.status = this.vim.keyBuffer;
	}
	this.status = '';

};

View.prototype.getText = function() {
	var text = this.getArray().join('\n');

	//Do 
	/*rainbow.color(text,'javascript', function(newText) {
		text = newText;
	});*/

	return text;
};


/** Returns an array [startLine,endLine] of visible lines
 *
 * Logic: moves w the cursor. TODO: scrolloff in vim.rc alias: "so"
 */
View.prototype.visibleLines = function() {
	if (this.lastVisibleLines[1] < this.lines) {
		this.lastVisibleLines[1] = this.lines;
	}
	//Lines we have
	var totalLines = this.lines - 1

	var cursorLine = this.vim.curDoc.cursor.line();

	if (cursorLine >= this.lastVisibleLines[1]) {
		this.lastVisibleLines = [cursorLine - totalLines + 1, cursorLine];
	} else if (cursorLine < this.lastVisibleLines[0]) {
		this.lastVisibleLines = [cursorLine, cursorLine + totalLines];
	}
	if (this.lastVisibleLines[0] < 0) this.lastVisibleLines[0] = 0;
	return this.lastVisibleLines;
};

View.prototype.getArray = function() {
	renderCt++;
	//Grab those that are relevant
	var visibleLines = this.visibleLines();

	var textArray = this.vim.curDoc._lines.slice(visibleLines[0], visibleLines[1] + 1)
	var noLines = false;
	if (!textArray.length) {
		this.notify = '--No lines in buffer';
		noLines = true;
	}

	var cursor = noLines ? {
		line: 0,
		char: 0
	} : this.vim.curDoc.cursor.position();

	var visibleCursorIndex = cursor.line - visibleLines[0];
	var cursorLine = textArray[visibleCursorIndex];
	if (!cursorLine) {
		cursorLine = '';
	}
	cursorLine += ' ';

	var selection = this.vim.curDoc.selection();
	var newLines = [];
	_(textArray).each(function(text, lineIndex) {
		var newText = '';
		if (lineIndex === cursor.line && cursor.char >= text.length) {
			text += ' ';
		}
		_(text).each(function(character, charIndex) {
			newText += this.renderChar(character, {
				line: lineIndex,
				char: charIndex
			}, cursor, selection);
		}, this);
		newLines[lineIndex] = newText;
	}, this);
	textArray = newLines;


	var lines = [];

	//Lines of the screen left to account for
	var linesLeft = this.lines;

	//Add status first
	lines.unshift(this.status);
	linesLeft--

	while (linesLeft > 0) {
		//Add the nearest text-line
		if (typeof textArray[linesLeft - 1] !== 'undefined') {
			var textLine = textArray[linesLeft - 1];
			lines.unshift(this.renderLine(textLine, visibleLines[0] + linesLeft));
		} else {
			lines.splice(lines.length - 1, 0, !this.color ? '~' : mauve('~').idle);
		}
		//Shift ref to the text-line above that

		//TODO incorporate wrapping lines
		// If wrap, linesLeft-- 
		//Record that we're one line shorter
		// linesLeft -= Math.ceil(this.lines[i]/this.cols);
		linesLeft--;
	}
	return lines;

};


/** render a specific character. This is brutal, but simplest way to handle cursor + selection highlighting without stepping on one another's toes.
 */

View.prototype.renderChar = function renderChar(character, position, cursor, selection) {

	// If is cursor, just do that.
	if (cursor.line === position.line && cursor.char === position.char)
		return (!this.color ? character : mauve(character).cursor);
	// If is a typical range, show that.
	if ('line' in selection[0]) {
		if (position.line < selection[0].line || position.line > selection[1].line)
			return character;
		if (position.line > selection[0].line && position.line < selection[1].line)
			return !this.color ? character : mauve(character).selection;
		if (position.line === selection[0].line && position.line !== selection[1].line && position.char >= selection[0].char)
			return !this.color ? character : mauve(character).selection;
		if (position.line === selection[1].line && position.line !== selection[0].line && position.char < selection[1].char)
			return !this.color ? character : mauve(character).selection;
		if (selection[0].line === selection[1].line && position.line === selection[0].line) {
			if (position.char >= selection[0].char && position.char < selection[1].char)
				return !this.color ? character : mauve(character).selection;
		}
	} else {
		// A visual block selection
		if (position.line < selection[0][0].line || position.line > selection[selection.length - 1][1].line) return character;
		var result = false;
		_(selection).find(function(range) {
			if (range[0].line === position.line && (position.char >= range[0].char && position.char < range[1].char)) {
				result = !this.color ? character : mauve(character).selection;
			}
		}, this);
		if (result) return character.selection;
	}
	return character;
}


/** Return the difference between current and arg ref 

	Making a decisioin here, let's let it collapse to "oh, this character changed..."
		Because that's going to be the cheapest way for terminal to handle small changes

*/
View.prototype.getPatch = function(ref) {
	this.renderText();
	//diff
	var patch = [];
	//current text
	var text = this.getText();
	if (!ref && ref !== '') throw "No reference to diff!";
	/* Why doing this so slowly? Well, the point is:
		1) This is meant for diffing the current screen, so ~50 lines... not too expensive
		2) A comprehensive diff will be useful to a display where changes are expensive (imagine... kindle)	
	*/
	//We need to definitely account for every refLine
	var refLines = ref.split('\n');
	while (refLines.length < 24) {
		refLines.push('');
	}
	var textLines = text.split('\n');

	var lineIndex = 0
	//Do the lines
	_(refLines).each(function(line, i) {
		//Get the general line changes
		var diff = this.diffLine(line, textLines[i]);
		_(diff).each(function(change) {
			//Add the line number
			change.line = i + 1;
			//Push to the patch
			patch.push(change);
			lineIndex = i;
		});
	}.bind(this));

	return patch;

};

View.prototype.diffLine = function(line1, line2) {
	var diffs = []
	//No changes
	if (line1 === line2) return [];
	//Clear the line
	if (!line2 || !line2.length) return [{
		from: 0,
		to: line1.length - 1,
		content: ''
	}];
	//Write the line
	if (!line1 || !line1.length) return [{
		from: 0,
		to: line2.length - 1,
		content: line2
	}];

	var len = Math.max(line1.length, line2.length);
	var diff = false;
	for (var i = 0; i < len; i++) {
		//If the same
		if (line1[i] === line2[i]) {
			//And a diff had been started
			if (diff) {
				//The diff is over, man
				diff.to = i;
				diffs.push(diff);
				diff = false;
			}
			//Otherwise, proceed.

		} else { //There is a difference
			//And it's not the first one
			if (diff) {
				//Just add the different character
				diff.content += line2[i] ? line2[i] : '';
			} else { //But if it's the beginning of a diff
				//Start it off.
				diff = {
					from: i,
					content: line2[i] ? line2[i] : ''
				};
			}
		}
	}
	//What if the last line is different?
	if (diff) {
		diff.to = i;
		diffs.push(diff);
	}

	return diffs;
};

View.prototype.renderText = function() {
	//Grab the text. Dumb... should be transferring arrays, or just referencing directly
	//	this.text = this.vim.text();
};


/** Render an individual line. Expect a 1-indexed line # and.. who knows.

*/

View.prototype.renderLine = function(text, index, misc) {
	//Create gutter
	var gutter = '     ' + index + ' ';
	while (gutter.length > 6) {
		gutter = gutter.substring(1);
	}
	gutter = !this.color ? gutter : mauve(gutter).gutter
	return gutter + text;
};


View.prototype.notify = function(text) {
	this.notification = text;
	this.trigger('change:status');
}

},{"underscore":18,"get-set":17,"mauve":25}],23:[function(require,module,exports){
module.exports = function() {};

/** 
 * Add a listener by event name
 * @param {String} name
 * @param {Function} fn
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.on = function(name,fn) {

	//Lazy instanciation of events object
	var events = this.events = this.events || {};

	//Lazy instanciation of specific event
  events[name] = events[name] || [];

  //Give it the function
  events[name].push(fn);

  return this;

};


/** 
 * Trigger an event by name, passing arguments
 * 
 * @param {String} name
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.trigger = function(name, arg1, arg2 /** ... */) {

	//Only if events + this event exist...
  if(!this.events || !this.events[name]) return this;

  //Grab the listeners
  var listeners = this.events[name],
    //All arguments after the name should be passed to the function
  	args = Array.prototype.slice.call(arguments,1);

  //So we can efficiently apply below
  function triggerFunction(fn) {
  	fn.apply(this,args);
  };

  if('forEach' in listeners) {
  	listeners.forEach(triggerFunction.bind(this));
  } else {
  	for(var i in listeners) {
  	  if(listeners.hasOwnProperty(i)) triggerFunction(fn);
  	}
  }

  return this;

};
},{}],15:[function(require,module,exports){
var _ = require('underscore');

module.exports = {

	'/^{count}{motion}$/': function(count, motion) {
		while (count--) {
			this.exec(motion);
		}
	},


	/*	'/^{operator}{operator}$/': function(op1,op2) {
		this.exec(op1 + op2);
	},*/

	'/^{count}{operator}{count}{motion}$/': function(ct1, operator, ct2, motion) {
		var count = ct1 * ct2;
		this.exec(count + operator + motion);
	},

	'/^{operator}{motion}$/': function(operator, motion) {
		this.exec('1' + operator + motion);

	},

	/*

		Oh boy, this is the big one.

	*/
	'/^{count}{operator}{motion}$/': function(count, operator, motion) {
		this.addUndoState();

		var visualMode = 'v';

		//Certain ops assume you're in visual line mode
		if (['gg', 'G', 'j', 'k', '-', '+'].indexOf(motion) > -1) {
			visualMode = 'V';
		}


		//See http://vimdoc.sourceforge.net/htmldoc/motion.html#operator
		if (operator === 'd' || operator === 'c') {
			if (motion === 'w') motion = 'e';
		}

		var position = this.curDoc.cursor.position();
		this.exec(visualMode);
		this.exec(motion)
		this.exec(operator);
	},


	// Text object selection
	'/^(y|d|c)(i|a)(w|W|s|S|p|\\]|\\[|\\(|\\)|b|>|<|t|\\{|\\}|"|\'|`)$/': function(keys, vim, match) {
		this.exec('v');
		this.exec(match[2] + match[3]);
		this.exec(match[1]);
	},



	/**


	MOTIONS: (t|T|f|F)(\S)


	*/


	'/\g_/': function(keys, vim) {
		this.exec('$');
		var doc = this.curDoc;
		var point = doc.find(/([\S])( |$)/g, {
			backwards: true
		}); //backwards
		if (point) {
			doc.cursor.line(point.line);
			doc.cursor.char(point.char);
		}
	},

	'/^gv$/': function() {},

	'/^(b|B)/': function(keys, vim) {
		var doc = this.curDoc;
		var point = doc.find(/(\S*)\s*(?=[\S]*)$/g, {
			backwards: true
		});
		if (point) {
			doc.cursor.line(point.line);
			doc.cursor.char(point.char); //oh ho
		}
	},





	'/^\\$$/': function(keys, vim) {
		var curLine = this.curDoc.line();
		var cursorPos = 0;
		if (curLine.length) {
			cursorPos = curLine.length - 1 + (this.curDoc.selecting ? 1 : 0);
		}
		this.cursor().char(cursorPos);
	},

	/* go to beginning of line */
	'/^0$/': function(keys, vim) {
		this.cursor().char(0);
	},

	/* go to next word */
	'/^(w)$/': function(keys, vim) {
		var doc = this.curDoc;

		var point;
		if (!this.curChar.match(/\s/)) {
			if (this.curChar.match(/\w/)) {
				point = doc.find(/(?:(?: |^)(\S)|([^\w^\s]))/g);
			} else {
				point = doc.find(/(?:(?: |^)([^\w^\s])|(\w))/g);
			}
		} else {
			point = doc.find(/(\S)/g);
		}

		if (point) { // there is a space, therefore a word
			doc.cursor.line(point.line);
			doc.cursor.char(point.char);
		}
	},

	/* go to next WORD */
	'/^(W)$/': function(keys, vim) {
		var doc = this.curDoc;
		var point = doc.find(/(?: |^)(\S+)/g);
		if (point) { //there is a space, therefore a word
			doc.cursor.line(point.line);
			doc.cursor.char(point.char);
		}

	},

	/* go to end of this word */
	'/^(e)$/': function(keys, vim) {
		var doc = this.curDoc;
		var point = doc.find(/(\w)(?= |$|\n)/g);
		if (point) { //there is a space, therefore a word
			doc.cursor.line(point.line);
			doc.cursor.char(point.char); //oh ho
		}
	},

	/* go to first non-whitespace character of this line */
	'/\\^/': function(keys, vim) {
		this.exec('0');
		var doc = this.curDoc;
		if (this.curChar.match(/(\S)/g) === null) {
			// if the first character is whitespace, seek another
			var point = doc.find(/(\S)/g);
			if (point) {
				doc.cursor.line(point.line);
				doc.cursor.char(point.char);
			}
		}
	},

	/* *)* sentences forward. */
	'/^\\)$/': function() {
		var pt = this.curDoc.find(/(?:^|\. )(.)/g);
		if (pt) this.curDoc.cursor.position(pt);
	},

	/* *(* sentences backward. */
	'/^\\($/': function() {
		//If mid-sentence
		var pt = this.curDoc.find(/(?:\.|\?|\!) ([\w\s]+)(?:$)/g, {
			backwards: true
		});
		if (!pt.found) {
			//If A middle sentence
			var pt = this.curDoc.find(/(?:\.|\?|\!) ([\w\s]+)(?:(?:\.|\?|\!)|$)/g, {
				backwards: true
			});
		}
		if (!pt.found) {
			//If first sentence of line.
			var pt = this.curDoc.find(/(?:^|(?:\.|\?|\!) )([\w\s]+)(?:(?:\.|\?|\!)|$)/g, {
				backwards: true
			});
		}

		//If previous sentence is not at beginning
		//var pt = this.curDoc.find(/(?:\. )(\w*?)(?:$|\. )?/g, { backwards: true });
		//If previous sentece IS the beginning
		if (pt) this.curDoc.cursor.position(pt);
	},



	/* Basic movement */

	'/^h$/': function(keys, vim) {
		var newChar = this.cursor().char() - 1;
		if (newChar < 0) return;
		this.cursor().char(newChar);
	},

	'/^l$/': function(keys, vim) {
		var newChar = this.cursor().char() + 1;
		if (!this.curDoc.selecting && newChar >= this.curDoc.line().length) return;

		this.cursor().char(newChar);
	},

	'/^j$/': function(keys, vim) {
		var newLine = this.cursor().line() + 1;
		if (newLine >= this.curDoc._lines.length) return;
		this.cursor().line(newLine);
	},

	'/^k$/': function(keys, vim) {
		var newLine = this.cursor().line() - 1;
		if (newLine < 0) return;
		this.cursor().line(newLine);
	},

	'/^([1-9]+[0-9]*)$/': function(keys, vim, res) {
		this.keyBuffer += keys;
	},

	/* Go to line */
	'/^([1-9][0-9]*)G$': function(keys, vim, res) {

		//Zero indexed but referenced one-indexed
		var lineNumber = parseInt(res[1]) - 1;

		//Move line
		if (this.curDoc._lines.length <= lineNumber) {
			lineNumber = this.curDoc._lines.length - 1;
		}
		this.curDoc.cursor.line(lineNumber);
		//Go to the beginning
		this.exec('0');
	},

	/* go to first line */
	'/^gg$/': function(keys, vim, res) {
		this.exec('1G');
	},

	/* go to last line */
	'/^G$/': function(keys, vim, res) {
		this.exec('' + this.curDoc._lines.length + 'G');
	},




	'/^f(.)$/': function(keys, vim, match) { //convert to: f([\w])
		var lastSearch = this.curDoc.last('search');
		this.exec('/' + match[1] + '\n');
		this.curDoc.last('f', 'f' + match[1]);
		this.curDoc.last('search', lastSearch);
	},


	'/^F(.)$/': function(keys, vim, match) { //convert to: f([\w])
		var lastSearch = this.curDoc.last('search');
		this.exec('?' + match[1] + '\n');
		this.curDoc.last('f', 'F' + match[1]);
		this.curDoc.last('search', lastSearch);
	},


	'/^t(.)$/': function(keys, vim, match) { //convert to: f([\w])
		var lastSearch = this.curDoc.last('search');
		this.exec('l');
		this.exec('/' + match[1] + '\n');
		this.exec('h');
		this.curDoc.last('f', 't' + match[1]);
		this.curDoc.last('search', lastSearch);
	},


	'^T(.)$': function(keys, vim, match) { //convert to: f([\w])
		var lastSearch = this.curDoc.last('search');
		this.exec('h');
		this.exec('?' + match[1] + '\n');
		this.exec('l');
		this.curDoc.last('f', 'T' + match[1]);
		this.curDoc.last('search', lastSearch);
	},



	'/^;$/': function(vim) {
		this.exec(this.curDoc.last('f'));
	},

	'/^,$/': function(vim) {
		var last = this.curDoc.last('f');
		var lastOp = last.substring(0, 1);
		if (lastOp === lastOp.toLowerCase()) {
			lastOp = lastOp.toUpperCase()
		} else {
			lastOp = lastOp.toLowerCase();
		}
		this.exec(lastOp + last.substring(1));
		this.curDoc.last('f', last)
	},


	'/^(\\/|\\?)(.+)\\n/': function(keys, vim, match) {

		this.curDoc.last('search', keys)

		this.searchMode = match[1] === '/' ? 'forwards' : 'backwards';
		this.searchBuffer = match[2];
		if (match[2].match(/"[a-z]/)) {
			this.searchBuffer = this.register(match[2].substring(1));
		}
		var pt = this.curDoc.find(new RegExp('(' + this.searchBuffer.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ')', 'g'), {
			selection: true,
			backwards: vim.searchMode === 'backwards'
		});
		if (pt) {
			this.cursor().line(pt.line);
			this.cursor().char(pt.char);
		}
	},

	/*'/^(\\/)/': function(keys,vim) {
		this.searchMode = 'forward';
		this.keyBuffer = '';
		this.mode('search');
	},*/

	'/^n$/': function(keys, vim, res) {
		this.exec(this.curDoc.last('search'));
	},

	'/^N$/': function(keys, vim, res) {
		var last = this.curDoc.last('search');
		if (!last) return;
		if (last.substring(0, 1) === '?') {
			newLast = '/' + last.substring(1);
		} else {
			newLast = '?' + last.substring(1);
		}
		this.exec(newLast);
		this.curDoc.last('search', last)
	},



	//MODES

	'/(esc)/': function(keys, vim) {
		this.keyBuffer = ''
	},

	//Insert mode
	'/^(i|s|S)/': function(keys, vim) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		//this.exec('h');
		if (!this.curDoc._lines.length) {
			this.curDoc._lines.push('');
		}
		this.currentInsertedText = '';
		this.insertSession = '';
		this.mode('insert');
	},

	'/^(A)$/': function(keys, vim) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('$');
		this.exec('a');
	},

	'/^(I)/': function(keys, vim) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('0');
		this.exec('i');
	},

	'/^v$/': function(keys, vim) {
		var pos = this.curDoc.cursor.position()
		this.rangeStart = this.rangeEnd = pos;
		this.mode('visual');
	},

	'/^V$/': function(keys, vim) {
		this.submode = 'Visual';
		this.exec('v');
	},

	'/^<C-v>$/': function() {
		this.submode = 'block';
		this.exec('v');
	},


	/* join */
	'/^J$/': function(keys, vim) {
		this.exec('j');
		this.exec('0');
		this.exec('v');
		this.exec('$');
		this.exec('d');

		//Doing this rather than go to greater measures to delete the line.
		var copied = this.register(0);
		copied = copied.substring(0, copied.length - 1);
		this.register(0, copied);

		this.exec('k');
		this.exec('$');
		var position = this.curDoc.cursor.char();
		this.exec('a');
		this.exec(' ');
		this.exec(copied);
		//this.exec('p');	
		this.exec('esc');
		//		this.curDoc.cursor.char(position);
		this.curDoc.selection('reset');
		this.exec('0');
		this.exec(position + 1 + 'l');
	},

	'/^o$/': function(keys, vim) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('A');
		this.exec('\n');
	},

	'/^O$/': function(keys, vim) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('0');
		this.exec('i');
		this.exec('\n');
		this.exec('esc');
		this.exec('k');
		this.exec('i');
	},
	'/^a$/': function(keys, vim) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('i');
		var doc = this.curDoc;
		doc.cursor.char(doc.cursor.char() + 1);
	},

	'/^([1-9]+[0-9]*)?(yy|cc|dd)$/': function(keys, vim, match) { //number
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		var start = this.curDoc.cursor.position();

		this.exec('0');
		this.exec('v');
		var ct = 1;
		var to = parseInt(match[1]);
		if (!to) to = 1;
		while (ct < to) {
			ct++;
			this.exec('j');
		}
		this.exec('$');


		var text = this.curDoc.getRange(this.curDoc.selection());
		if (text.substring(text.length - 1) === '\n') text = text.substring(0, text.length - 1);
		this.curDoc.yanking = false;

		if (match[2] === 'cc' || match[2] === 'dd') {
			this.exec('d');
		}

		this.curDoc.cursor.line(start.line);
		this.curDoc.cursor.char(start.char);


		if (match[2] === 'cc') {
			this.exec('i');
		}
		var command = ['o', text, 'esc'];
		if (to >= 2) {
			command.push(to - 1 + 'k');
		}
		command.push('0');

		this.register(this.currentRegister, command);
		this.curDoc.yanking = false;

	},


	/* Set current register */
	'/^"([a-z%\.\-_\"#])$/': function(keys, vim, match) {
		this.currentRegister = match[1];
	},


	/* paste / put after cursor */
	'/^(p|P)$/': function(keys, vim, match) {
		var P = match[1] === 'P';
		var reg = this.register(this.currentRegister || 0);

		//Don't execute nothing
		if (!reg || !reg.length) return;

		//Execute arrays as a sequence of commands
		if (_(reg).isArray()) {
			while (reg.length) {
				this.exec(reg.shift());
			}
			this.exec('esc');
		} else {
			//Otherwise treat as text
			this.exec(P ? 'i' : 'a');
			this.exec(reg);
			this.exec('esc');
		}

	},

	'/^(P)/': function(keys, vim, res) {
		this.exec('i');
		this.exec(this.register(0));
		this.exec('esc');
	},


	/* Begin recording into specified registry */
	'/^q([a-z]?)$/': function(keys, vim, res) {
		if (this.recording) {
			this.register(this.recordingRegister, this.recordingBuffer);
			this.recording = false;
		} else if (res[1]) {
			this.recording = true;
			this.recordingRegister = res[1]
			this.recordingBuffer = [];
			this.preRecordText = this.curDoc.text();
		} else {
			this.keyBuffer = 'q';
		}
		//grab the doc in a diff
		//this.mode('recording');
	},


	/* End the recording if currently recording */
	/*'/^q$/': function(keys,vim) {
		if(this.recording) {
			this.recording = false;
			this.curDoc.text(vim.preRecordText);
		}
	},*/

	/* Execute the command as stored in the register */
	'/^@([a-z])$/': function(keys, vim, res) {
		var commands = this.register(res[1]);
		this.curDoc.last('macro', res[1]);
		if (typeof commands === 'string') {
			this.exec(commands)
		} else {
			while (commands.length) {
				this.exec(commands.shift());
			}
		}
	},

	'/^@@$/': function() {
		var last = this.curDoc.last('macro');
		if (last) {
			this.exec('@' + last);
		}
	},

	/*'/([0-9]+)([hHjJkKlLwWbBeE(){}]|yy|dd|\[\[|\]\]|)/': function(keys,vim,result) {
		var ct = result[1];
		var command = result[2];
		while(ct--) this.exec(command);
	}*/

	/* REPLACE */

	'/^r(.)$/': function(keys, vim, match) {
		this.exec('x');
		this.exec('i');
		this.exec(match[1]);
		this.exec('esc');
	},

	/* SHORTCUTS */


	/* Commands that can be stupidly executed N times, instead of a smarter visual selection */
	'/^([1-9]+[0-9]*)(x|X)$/': function(keys, vim, match) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		var ct = parseInt(match[1]);
		while (ct--) {
			vim.exec(match[2]);
		}
	},

	'/^x$/': function(keys, vim, res) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		//Using x, don't delete a line if it's empty.
		var range = this.curDoc.selection();
		if (range[0].line === range[1].line & !this.curDoc.line(range[0].line).length) {
			return;
		}

		//Grab a hold of something
		this.exec('v');

		//Otherwise treat as d
		this.exec('d');
	},
	'/^X$/': function(keys, vim, res) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('h');
		this.exec('x');
	},
	'/^D$/': function(keys, vim, res) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('d');
		this.exec('$');
	},
	'/^C$/': function(keys, vim, res) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('c');
		this.exec('$');
	},
	'/^s$/': function(keys, vim, res) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('c');
		this.exec('l');
	},
	'/^S$/': function(keys, vim, res) {
		if (this.execDepth === 1) {
			this.addUndoState();
		}
		this.exec('c');
		this.exec('c');
	},

	'/^u$/': function(keys, vim, res) {
		if (this.execDepth === 1) {
			if (this.addUndoState()) {
				//quick undo to get back to current state just recorded.	
				this.curDoc.undo.last();
			}
		}
		var state = this.curDoc.undo.last();
		if (!state) return;
		this.curDoc.text(state.text);
		this.curDoc.cursor.char(state.cursor.char);
		this.curDoc.cursor.line(state.cursor.line);
	},

	'/<C-r>/': function(keys, vim, res) {
		var state = this.curDoc.undo.next();
		if (!state) return;
		this.curDoc.text(state.text);
		this.curDoc.cursor.char(state.cursor.char);
		this.curDoc.cursor.line(state.cursor.line);
	},

	/*	'/:([^w^q]*)\n/': function(exCommand) {
		this.keyBuffer = '';
		this.exec('esc');
	},
*/

	'/:say (.*)\\n/': function(exCommand) {
		this.notify('hey!');
	},

	'/:(.*)↑/': function() {
		var hist = this.histories[':'];
		var pos = hist.position;
		if (pos > 0) pos--;
		this.histories[':'].position = pos;
		this.keyBuffer === '';
		this.exec(':');
		this.exec(hist[pos]);
	},
	'/:(.*)↓/': function() {
		var hist = this.histories[':'];
		var pos = hist.position;
		if (pos > hist.length - 1) pos = hist.length - 1;
		if (pos < hist.length - 1) pos++;
		this.histories[':'].position = pos;
		this.keyBuffer === '';
		this.exec('esc');
		this.exec(':');
		this.exec(hist[pos]);
	},

	'/^:abbreviate (.*?) (.*)\n$/': function(keys, vim, expr) {
		var key = expr[1];
		var val = expr[2];
		this.rc.abbreviations[key] = val;
	},

	'/^:ab (.*?) (.*)\n$/': function(keys) {
		this.exec(keys.replace(/:ab/, ':abbreviate'));
	},

	'/^~$/': function() {
		var curChar = this.curChar;
		this.exec('r');
		this.exec(this.curChar === this.curChar.toLowerCase() ? this.curChar.toUpperCase() : this.curChar.toLowerCase());
		this.exec('esc');
	},

	/* complement */
	'/^%$/': function() {
		var pos = this.curDoc.cursor.position();
		var table = {
			'{': '}',
			'}': '{',
			'(': ')',
			')': '(',
			'f': 'F',
			'F': 'f'
		};
		var seeking = table[this.curChar];
		var verb = '{('.indexOf(this.curChar) > -1 ? 'f' : 'F';
		this.exec(verb + seeking);
		this.exec(table[verb] + table[seeking]);
		var ct = 1;
		//While the previous calisthenics don't return you home
		var last = false;
		while (pos.char !== this.curDoc.cursor.char() || pos.line !== this.curDoc.cursor.line()) {
			if (last) {
				this.curDoc.cursor.line(pos.line);
				this.curDoc.cursor.char(pos.char);
				return;
			}
			this.curDoc.cursor.line(pos.line);
			this.curDoc.cursor.char(pos.char);
			if (ct > 10) throw 'recursion in complement seeking';
			//Endeaver to go farther
			ct++;
			this.exec('' + ct + verb + seeking);
			last = (this.curDoc.cursor.line() === this.curDoc._lines.length - 1 && this.curDoc.cursor.char() >= this.curDoc._lines[this.curDoc.cursor.line()].length - 1)
			this.exec('' + ct + table[verb] + table[seeking]);
		}
		this.exec('' + ct + verb + seeking);
	},

	/* Mark */
	'/^m([a-z\.])$/': function(keys, vim, expr) {
		var pos = this.curDoc.cursor.position();
		var mark = {
			col: pos.char,
			line: pos.line,
			file: this.curDoc.path || '',
			mark: expr[1]
		};
		this.curDoc.addMark(mark);
	},

	/* Go to mark */
	'/^(\'|`)([a-z\.<>])$/': function(keys, vim, expr) {
		var markName = expr[2];
		if (markName in this.curDoc._marks) {
			var docMark = this.curDoc._marks[markName];
			var mark = this.curDoc.getMark(expr[2]);
			if (mark) {
				this.curDoc.cursor.line(mark.line);
				if (expr[1] === '`') this.curDoc.cursor.char(mark.col);
				return;
			}
		}
		this.notify("E20: Mark not set");
	}

}

},{"underscore":18}],14:[function(require,module,exports){
var _ = require('underscore');
var mark = require('../mark');

module.exports = {

	/* Any time you receive multiple keys in one go */
	'/^((?!\b|esc)[\\w\\W][\\w\\W]+)$/': function(keys, vim) {
		for (var i = 0; i < keys.length; i++) {
			this.exec(keys.substring(i, i + 1));
		}
	},

	'/^((?!\b|esc|}).)$/': function(keys, vim, match) {
		this.currentInsertedText += keys
		vim.insert(keys);
	},

	'/^}$/': function() {
		if (this.rc.smartindent && this.curDoc._lines[this.curDoc.cursor.line()].match(/^\s*$/)) {
			var ct = this.rc.tabstop;
			this.exec('esc');
			while (ct--) {
				this.exec('X');
			}
			this.exec('i');
		}
		this.insert('}');

	},

	'/^\n$/': function(keys) {
		this.currentInsertedText += keys;
		if (!this.rc.smartindent || this.curDoc._lines[this.curDoc.cursor.line()].length === 0) {
			this.insert('\n');
		} else {
			var thisLine = this.curDoc._lines[this.curDoc.cursor.line()];
			var indent = thisLine.match(/{\s*(?:\/\/.*|\/\*.*\*\/\s*)?$/);
			curChar = this.curDoc.cursor.char();
			var currentText = this.currentInsertedText;
			this.exec('esc');
			this.exec('^');

			//Assume you're indenting to the first non-blank char
			var ct = this.curDoc.cursor.char();
			//Unless it's all blank, then to zero.
			if (thisLine.match(/^\s*$/)) {
				ct = 0;
			}

			this.curDoc.cursor.char(curChar);
			this.insert('\n');

			if (indent) {
				ct += this.rc.tabstop;
			}
			this.exec('i');
			this.currentInsertedText = currentText;
			while (ct-- > 0) {
				this.exec(' ');
			}
		}
	},

	'/^(\b)$/': function(keys, vim) {
		if (this.currentInsertedText.length) this.currentInsertedText = this.currentInsertedText.substring(0, this.currentInsertedText.length - 1);
		var atZero = !vim.curDoc.cursor.char()
		vim.exec('esc');

		//Only backspace if there's somewhere to go.
		if (atZero & !vim.curDoc.cursor.line()) return;

		//Do a join if at the beginning (i.e., deleting a carriage return)		
		if (atZero && vim.curDoc.cursor.line()) {
			vim.exec('k');
			vim.exec('J');
			vim.exec('x');
		} else {
			//Otherwise just erase the character. This works because "esc" from insert decrements the cursor.
			vim.exec('x');
		}
		vim.exec('i');
	},
	'/^esc/': function(keys, vim) {
		//Handle text

		vim.mode('command');
		vim.exec('h');

		if (this.submode === 'block' & !this.currentInsertedText.match(/\n/)) {
			this.submode = '';
			var lastText = this.currentInsertedText;
			//For each line that was a part of that block selection
			var meaningfulSelection = this.lastSelection.slice(1);
			_(meaningfulSelection).each(function(range) {
				//Move to the beginning of the selection on that line
				if (this.submodeVerb === 'I') {
					this.curDoc.cursor.position(range[0]);
					this.exec('i');
				} else if (this.submodeVerb === 'A') {
					var newPos = range[1];
					newPos.char--;
					newPos.col--;
					this.curDoc.cursor.position(range[1]);
					this.exec('a');
				}
				this.exec(lastText);
				this.exec('esc');
			}, this);
			this.curDoc.cursor.position(this.lastSelection[0][0]);

		}

		this.register('.', this.currentInsertedText);
		this.currentInsertedText = this.currentInsertedText.substring(0, 0);



	},


};

},{"../mark":11,"underscore":18}],16:[function(require,module,exports){
(function(){var _ = require('underscore');
var mark = require('../mark');


/*

	Visual mode is just text selection on top of command mode. Each keypress, simply maintain your range.

*/

//TODO absorb these elsewhere... Won't work with multiple vim instances
var rangeStart,
	originalCursorPosition = false;
module.exports = {

	/* Keys that pass through visual mode. Motion, mostly.  */
	'/^((?![1-9])(?!esc|x|d|y|i|a|J|c|>|<|~|g~|gu|gU).*[^1-9]+.*)/': function(keys, vim, res) {
		//Remember we're in the process of selecting
		this.curDoc.selecting = true;

		// "I" in visual block 
		if (this.submode === 'block') {
			/*if(keys === '$') {
				var sel = this.curDoc.selection();
				var firstPoint = ('line' in sel[0]) ? sel[0] : sel[0][0];
				var startingColumn = firstPoint.char;				
				var curLine = this.curDoc.getMark('<').line;
				var finalLine = this.curDoc.getMark('>').line;
				var newSelection = [];
				while(curLine <= finalLine) {
					var subRange = [ { line: curLine }, { line: curLine } ];
					if(this.curDoc._lines[curLine].length > startingColumn) {
						subRange[0].char = startingColumn;
					} else {
						subRange[0].char = 0;	
					}
					subRange[1].char = this.curDoc._lines[curLine].length;
					newSelection.push(subRange);
					curLine++;
				}
				this.curDoc.selection(newSelection);
				return;
			}*/
			if (keys === 'C') {
				this.exec('$');
				this.exec('c');
				return;
			}
			if (keys === 'I' || keys === 'A') {
				this.submodeVerb = keys;
				this.submode === '';
				//Move to command mode
				if (keys === 'A') {
					var pos = this.curDoc.selection()[0][1];
					pos.char--;
					pos.col--;
				}
				this.exec('esc');
				//Move to insert mode
				if (keys === 'A') {
					this.curDoc.cursor.position(pos);
					this.exec('a');
				} else {
					this.exec('i');
				}
				//Ensure still block submode
				this.submode = 'block';
				return;
			}
		}


		if (!originalCursorPosition) {
			originalCursorPosition = this.curDoc.cursor.position();
		}

		this.lastMode = 'visual';

		//execute the command in command mode
		this.mode('command'); //dont use 'esc' as that is defined below to cancel the visual session
		this.exec(keys);


		// Re-adjust the selection if necessary
		var pos = this.curDoc.cursor.position();

		this.rangeEnd = pos;

		var range = [JSON.parse(JSON.stringify(this.rangeStart)), JSON.parse(JSON.stringify(this.rangeEnd))];

		//Reverse if not correct order. But rangeStart remains where it was.
		if (this.rangeEnd.line < this.rangeStart.line || (this.rangeEnd.line === this.rangeStart.line && this.rangeEnd.char < this.rangeStart.char)) {
			range = [range[1], range[0]];
		}
		range[1].char++;

		// Store as marks; Augment with col as char is deprecated.
		range[0].col = range[0].char;
		range[0].mark = '<';
		range[1].col = range[1].char;
		range[1].mark = '>';


		this.curDoc.addMark(range[0]);
		this.curDoc.addMark(range[1]);

		//Visual
		if (this.submode === 'Visual') {
			range[0].char = 0;
			var line = this.curDoc.line(range[1].line);
			range[1].char = this.curDoc.line(range[1].line).length;
		}


		// Block mode
		if (this.submode === 'block') {
			//Starting line
			var curLine = range[0].line;
			var lastLine = range[1].line;
			// The first col of the selection
			var firstCol, lastCol;
			if (range[1].char <= range[0].char) {
				firstCol = range[1].char - 1;
				lastCol = range[0].char + 1;
			} else {
				firstCol = range[0].char;
				lastCol = range[1].char;
			}
			//Redefine range as an array
			blockRange = [];
			while (curLine <= range[1].line) {
				// If the range begins after the end of the line, skip it for now.
				// TODO:handle $ edge case
				if (firstCol >= this.curDoc._lines[curLine].length) {
					curLine++;
					continue;
				};
				var lastLineCol = Math.min(this.curDoc._lines[curLine].length, lastCol);
				var pos = this.curDoc.cursor.position();
				if (curLine === pos.line && lastLineCol === pos.col) {
					lastLineCol++;
				}

				blockRange.push([{
					line: curLine,
					char: firstCol,
					col: firstCol
				}, {
					line: curLine,
					char: lastLineCol,
					col: lastLineCol
				}]);
				curLine++;
			}
			if (blockRange.length === 1) blockRange = blockRange[0];
			range = blockRange;
		}


		this.curDoc.selection(range);

		//Assuming we can, move back to visual mode after executing.
		//If we can't, must trust the mode to return us.
		if (this.modeName === 'command') this.mode('visual');

	},

	/* OPERATORS


	*/

	'/^c$/': function() {
		if (this.submode === 'block') {
			var newSelection = JSON.parse(JSON.stringify(this.curDoc.selection()));
			if ('line' in newSelection[0]) {
				newSelection = [newSelection]
			}
			_(newSelection).each(function(subRange, i) {
				var newEnd = subRange[1];
				newEnd.char++;
				newEnd.col++;
				newSelection[i][1] = newEnd;
			});
			this.exec('d');
			this.exec('<C-v>');
			this.curDoc.selection(newSelection);
			this.exec('I');
			return;
		}
		this.exec('d');
		this.exec('i');
	},

	/* delete */
	'/^d$/': function() {
		var sel = this.curDoc.selection();
		this.exec('y');
		this.exec('v');
		this.curDoc.selection(sel);


		var doc = this.curDoc;

		//Grab the selection
		var range = doc.selection();

		//Don't kill the line
		//if(range[0].line === range[1].line &! doc.line(range[0].line).length) return;

		doc.remove(range);
		doc.selection('reset');

		//Move to the beginning of the range
		if (range[0].line >= doc._lines.length) {
			var newLine = doc._lines.length - 1;
			if (newLine < 0) newLine = 0;
			doc.cursor.line(newLine);
		} else {
			doc.cursor.line(range[0].line);
		}
		doc.cursor.char(range[0].char);
		this.exec('esc');

	},

	/* yank */
	'/^y$/': function() {
		var selection = this.curDoc.getRange(this.curDoc.selection());
		var index = this.currentRegister;
		this.register(index, selection);
		this.curDoc.cursor.position(this.curDoc.selection()[0]);
		this.curDoc.selection('reset');
		this.exec('esc');
	},

	/* swap case */
	'/^~$/': function() {
		this.exec('g~');
	},


	/* swap case */
	'/^g~$/': function() {
		var selection = this.curDoc.selection();
		if (!selection[0].length) {
			selection = [selection];
		}
		_(selection).each(function(subRange) {
			var text = this.curDoc.getRange(subRange);
			var newText = mark('');

			for (var i = 0; i < text.length; i++) {
				var newChar = (text[i] === text[i].toLowerCase()) ? text[i].toUpperCase() : text[i].toLowerCase();
				newText = newText.concat(newChar);
			}
			this.curDoc.selection(selection);
			this.curDoc.exec('d');
			this.curDoc.exec('i');
			this.exec(newText);
			this.exec('esc');
		}, this);
	},

	/* make lowercase */
	'/^gu$/': function() {
		var selection = this.curDoc.selection();
		if (!selection[0].length) {
			selection = [selection];
		}
		_(selection).each(function(subRange) {
			var text = this.curDoc.getRange(subRange);
			var newText = mark('');

			for (var i = 0; i < text.length; i++) {
				var newChar = text[i].toLowerCase();
				newText = newText.concat(newChar);
			}
			this.curDoc.selection(selection);
			this.curDoc.exec('d');
			this.curDoc.exec('i');
			this.exec(newText);
			this.exec('esc');
		}, this);
	},

	/* make uppercase */
	'/^gU$/': function() {
		var selection = this.curDoc.selection();
		if (!selection[0].length) {
			selection = [selection];
		}
		_(selection).each(function(subRange) {
			var text = this.curDoc.getRange(subRange);
			var newText = mark('');

			for (var i = 0; i < text.length; i++) {
				var newChar = text[i].toUpperCase();
				newText = newText.concat(newChar);
			}
			this.curDoc.selection(selection);
			this.curDoc.exec('d');
			this.curDoc.exec('i');
			this.exec(newText);
			this.exec('esc');
		}, this);
	},

	/* filter through an external program */
	'/^!$/': function() {},


	/* filter through 'equalprg' */
	'/^=$/': function() {},

	/* text formatting */
	'/^gq$/': function() {},

	/* ROT13 encoding */
	'/^g?$/': function() {},

	/* shift right */
	'/^>$/': function() {
		var selection = this.curDoc.selection();
		var ct = selection[1].line - selection[0].line + 1;
		this.curDoc.cursor.line(selection[0].line)
		while (ct > 0) {
			this.exec('0');
			this.mode('insert');
			this.exec('\t')
			this.mode('visual')
			this.exec('j');
			ct--
		}
		this.exec('esc');
		this.exec('^');
	},

	/* shift left */
	'/^<$/': function() {

	},

	/* define a fold */
	'/^zf$/': function() {

	},

	/* call function set with the 'operatorfunc' option */
	'/^g@$/': function() {

	},

	// Inner select
	'/^([1-9]+[0-9]*)?(a|i)(w|W|s|S|p|\\]|\\[|\\(|\\)|b|>|<|t|\\{|\\}|"|\'|`)$/': function(keys, vim, match) {
		var outer = match[2] === 'a';
		var count = 1;
		if (match[1] && match[1].length) count = parseInt(match[1]);
		var boundaries = [];
		var boundaryMap = {
			'w': ['b', 'e'],
			'W': ['F ', 'f '],
			'"': ['F"', 'f"'],
			's': ['(', ')'],
			'(': ['F(', 'f)']
		};

		if (match[3] in boundaryMap) {
			boundaries = boundaryMap[match[3]]
		} else {
			boundaries = [match[3], match[3]];
		}

		var moveIn = false
		if (boundaries[0].substring(0, 1) === 'F' && match[2] === 'i') {
			boundaries[0] = 'T' + boundaries[0].substring(1);
			boundaries[1] = 't' + boundaries[1].substring(1);
		} else if (match[2] === 'i') { //fix this
			moveIn = true;
		}

		if (boundaries.length) {
			this.exec('esc');
			var i = 0;
			while (i++ < count) {
				this.exec(boundaryMap[match[3]][0])
			}
			if (moveIn) this.exec('l');
			this.exec('v');
			var i = 0;
			while (i++ < count) {
				this.exec(boundaryMap[match[3]][1])
			}

			if (moveIn) this.exec('h');
		}


	},

	'/^esc/': function(keys, vim) {
		// Grab the last selection. Shitty to be cloning like this, but TODO fix.
		this.lastSelection = JSON.parse(JSON.stringify(this.curDoc.selection()));
		this.rangeStart = false;
		this.curDoc.selection('reset');
		this.curDoc.selecting = false;
		this.curDoc.cursor.position(originalCursorPosition)
		originalCursorPosition = false;
		this.submode = false;
	},

	'/^(x)$/': function(keys, vim) {
		this.exec('d');
	},

	'/^(J)$/': function(keys, vim) {
		var range = this.curDoc.selection();
		var ct = range[1].line - range[0].line || 1; //do first join ANYWAYS

		//Move to the beginning
		this.curDoc.cursor.line(range[0].line);
		this.exec('esc');
		while (ct--) {
			this.exec('J');
		}
	}
};

})()
},{"../mark":11,"underscore":18}],25:[function(require,module,exports){
var hex2rgbString = require('rgb'),
	x256 = require('x256'),
	rgbRegExp = /(\d+),(\d+),(\d+)/;

/*
	mauve does colors stuff, but with less error checking + all 256 xterm colors rendered from hex
*/

var mauve;

function getPrefix(scheme) {
	//Handle the CSS here TODO: bold
	return '<span style="' +
		(scheme.fg ? 'color:' + scheme.fg +';': '') +
		(scheme.bg ? 'background-color:' + scheme.bg +';': '') +
		(scheme.misc ? 'font-weight:700;': '') +
		'">';
}

mauve = function(raw) {
	var freshString = new String(raw);
	if(typeof window !== 'undefined') {
	for(var scheme in mauve.hash) {
		freshString[mauve.hash[scheme].name] = new String(getPrefix(mauve.hash[scheme]) + raw + "</span>");
		freshString[mauve.hash[scheme].name].substring = function() {
			return getPrefix(mauve.hash[scheme]) + raw.substring.apply(raw,arguments) + "</span>";	
		};
	}
	}
	return freshString;
}

mauve.hash = {};

mauve.set = function(name,color) {


// Pass k, v of item name and ideal color
	//Allow setting via a hash, i.e. "set theme"
	if(typeof name === 'object') {
		for(var i in name) {
			this.set(i,name[i]);
		}
		return;
	}

	var scheme = {};

	var fg = false;
	var bg = false;
	var misc = false;
	if(color.indexOf('#') > -1) {
		var colors = color.split('/');
		var fg = colors[0].length ? hex2Address(colors[0]) : false;
		scheme.fg = colors[0];
		var bg = colors[1] ? hex2Address(colors[1]) : false;
		scheme.bg = colors[1];
		this.hash[name] = scheme
		this.hash[name].name = name;
	} else {
		switch(color) {
			case 'bold':
				misc = '\u001B[1m';
				this.hash[name] = { misc: 'bold', name: name };
				break;
		}
	}

	//In node, ammend this TODO: kill this in favor of above strategy.
	if(typeof window === 'undefined') { //node


		//When called, overwrite the substring method to ignore the added characters
	String.prototype.substring = function(start,end) {
			if(start === end) return '';
			if(!end) end = this.length;
			var text = '';
			var raw = this.split('');
			var index = 0;
			var inEscape = false;
			var curChar;
			var currentCommand = '';
			while(index < start) {
				curChar = raw.shift();
				if(inEscape) {
					currentCommand += curChar;
					if(curChar === 'm') {
						inEscape = false;
					}
					continue;
				} else {
					if(curChar === '\u001B') {
						inEscape = true;
						currentCommand = curChar;
						continue;
					}
					index++;
				}
			}	

			//If there is current formatting, apply it.
			if(currentCommand !== '\u001B[0m') {
				text += currentCommand;
			}	

			while(index < end && raw.length) {

				curChar = raw.shift();
				text += curChar;
				if(inEscape) {
					if(curChar === 'm') {
						inEscape = false;
					}
					continue;
				} else {
					if(curChar === '\u001B') {
						inEscape = true;
						continue;
					}
				}
				index++;
			}
			return text;
		};

	
	String.prototype.__defineGetter__(name,function() {
		var raw = this.replace(/\u001B(?:.*)m/,'');
		var result = '';
		if(fg) result += '\u001B[38;5;' + fg + 'm';
		if(bg) result += '\u001B[48;5;' + bg + 'm';
		if(misc) result += misc;
		result += raw + '\u001B[0m';
		return result;
	});
	}
};

function hex2Address(hex) {
	var rgb = hex2rgbString(hex);
	var nums = rgbRegExp.exec(rgb);
	return x256(parseInt(nums[1]),parseInt(nums[2]),parseInt(nums[3]));
}


module.exports = mauve;

},{"rgb":26,"x256":27}],26:[function(require,module,exports){
/*
color
*/"use strict"

var colors = {
    maroon      : "#800000",
    red         : "#ff0000",
    orange      : "#ffA500",
    yellow      : "#ffff00",
    olive       : "#808000",
    purple      : "#800080",
    fuchsia     : "#ff00ff",
    white       : "#ffffff",
    lime        : "#00ff00",
    green       : "#008000",
    navy        : "#000080",
    blue        : "#0000ff",
    aqua        : "#00ffff",
    teal        : "#008080",
    black       : "#000000",
    silver      : "#c0c0c0",
    gray        : "#808080",
    transparent : "#0000"
}

var RGBtoRGB = function(r, g, b, a){
    if (a == null || a === "") a = 1
    r = parseFloat(r)
    g = parseFloat(g)
    b = parseFloat(b)
    a = parseFloat(a)
    if (!(r <= 255 && r >= 0 && g <= 255 && g >= 0 && b <= 255 && b >= 0 && a <= 1 && a >= 0)) return null

    return [Math.round(r), Math.round(g), Math.round(b), a]
}

var HEXtoRGB = function(hex){
    if (hex.length === 3) hex += "f"
    if (hex.length === 4){
        var h0 = hex.charAt(0),
            h1 = hex.charAt(1),
            h2 = hex.charAt(2),
            h3 = hex.charAt(3)

        hex = h0 + h0 + h1 + h1 + h2 + h2 + h3 + h3
    }
    if (hex.length === 6) hex += "ff"
    var rgb = []
    for (var i = 0, l = hex.length; i < l; i += 2) rgb.push(parseInt(hex.substr(i, 2), 16) / (i === 6 ? 255 : 1))
    return rgb
}

// HSL to RGB conversion from:
// http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
// thank you!

var HUEtoRGB = function(p, q, t){
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
}

var HSLtoRGB = function(h, s, l, a){
    var r, b, g
    if (a == null || a === "") a = 1
    h = parseFloat(h) / 360
    s = parseFloat(s) / 100
    l = parseFloat(l) / 100
    a = parseFloat(a) / 1
    if (h > 1 || h < 0 || s > 1 || s < 0 || l > 1 || l < 0 || a > 1 || a < 0) return null
    if (s === 0){
        r = b = g = l
    } else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s
        var p = 2 * l - q
        r = HUEtoRGB(p, q, h + 1 / 3)
        g = HUEtoRGB(p, q, h)
        b = HUEtoRGB(p, q, h - 1 / 3)
    }
    return [r * 255, g * 255, b * 255, a]
}

var keys = []
for (var c in colors) keys.push(c)

var shex  = "(?:#([a-f0-9]{3,8}))",
    sval  = "\\s*([.\\d%]+)\\s*",
    sop   = "(?:,\\s*([.\\d]+)\\s*)?",
    slist = "\\(" + [sval, sval, sval] + sop + "\\)",
    srgb  = "(?:rgb)a?",
    shsl  = "(?:hsl)a?",
    skeys = "(" + keys.join("|") + ")"


var xhex   = RegExp(shex, "i"),
    xrgb   = RegExp(srgb + slist, "i"),
    xhsl   = RegExp(shsl + slist, "i")

var color = function(input, array){
    if (input == null) return null
    input = (input + "").replace(/\s+/, "")

    var match = colors[input]
    if (match){
        return color(match, array)
    } else if (match = input.match(xhex)){
        input = HEXtoRGB(match[1])
    } else if (match = input.match(xrgb)){
        input = match.slice(1)
    } else if (match = input.match(xhsl)){
        input = HSLtoRGB.apply(null, match.slice(1))
    } else return null

    if (!(input && (input = RGBtoRGB.apply(null, input)))) return null
    if (array) return input
    if (input[3] === 1) input.splice(3, 1)
    return "rgb" + (input.length === 4 ? "a" : "") + "(" + input + ")"
}

var regexp = RegExp([skeys, shex, srgb + slist, shsl + slist].join("|"), "gi")

color.replace = function(string, method){
    if (!method) method = function(match){
        return color(match)
    }
    return (string + "").replace(regexp, method)
}

color.matches = function(string){
    return !!(string + "").match(regexp)
}

module.exports = color

},{}],27:[function(require,module,exports){
// colors scraped from
// http://www.calmar.ws/vim/256-xterm-24bit-rgb-color-chart.html
// %s/ *\d\+ \+#\([^ ]\+\)/\1\r/g

var colors = require('./colors.json')
    .map(function (hex) {
        var r = parseInt(hex.slice(0,2), 16);
        var g = parseInt(hex.slice(2,4), 16);
        var b = parseInt(hex.slice(4,6), 16);
        return [ r, g, b ];
    })
;

var x256 = module.exports = function (r, g, b) {
    var c = Array.isArray(r) ? r : [ r, g, b ];
    var best = null;
    
    for (var i = 0; i < colors.length; i++) {
        var d = distance(colors[i], c)
        if (!best || d <= best.distance) {
            best = { distance : d, index : i };
        }
    }
    
    return best.index;
};
x256.colors = colors;

function distance (a, b) {
    return Math.sqrt(
        Math.pow(a[0]-b[0], 2)
        + Math.pow(a[1]-b[1], 2)
        + Math.pow(a[2]-b[2], 2)
    )
}

},{"./colors.json":28}],28:[function(require,module,exports){
module.exports=["000000",
"800000",
"008000",
"808000",
"000080",
"800080",
"008080",
"c0c0c0",
"808080",
"ff0000",
"00ff00",
"ffff00",
"0000ff",
"ff00ff",
"00ffff",
"ffffff",
"000000",
"00005f",
"000087",
"0000af",
"0000d7",
"0000ff",
"005f00",
"005f5f",
"005f87",
"005faf",
"005fd7",
"005fff",
"008700",
"00875f",
"008787",
"0087af",
"0087d7",
"0087ff",
"00af00",
"00af5f",
"00af87",
"00afaf",
"00afd7",
"00afff",
"00d700",
"00d75f",
"00d787",
"00d7af",
"00d7d7",
"00d7ff",
"00ff00",
"00ff5f",
"00ff87",
"00ffaf",
"00ffd7",
"00ffff",
"5f0000",
"5f005f",
"5f0087",
"5f00af",
"5f00d7",
"5f00ff",
"5f5f00",
"5f5f5f",
"5f5f87",
"5f5faf",
"5f5fd7",
"5f5fff",
"5f8700",
"5f875f",
"5f8787",
"5f87af",
"5f87d7",
"5f87ff",
"5faf00",
"5faf5f",
"5faf87",
"5fafaf",
"5fafd7",
"5fafff",
"5fd700",
"5fd75f",
"5fd787",
"5fd7af",
"5fd7d7",
"5fd7ff",
"5fff00",
"5fff5f",
"5fff87",
"5fffaf",
"5fffd7",
"5fffff",
"870000",
"87005f",
"870087",
"8700af",
"8700d7",
"8700ff",
"875f00",
"875f5f",
"875f87",
"875faf",
"875fd7",
"875fff",
"878700",
"87875f",
"878787",
"8787af",
"8787d7",
"8787ff",
"87af00",
"87af5f",
"87af87",
"87afaf",
"87afd7",
"87afff",
"87d700",
"87d75f",
"87d787",
"87d7af",
"87d7d7",
"87d7ff",
"87ff00",
"87ff5f",
"87ff87",
"87ffaf",
"87ffd7",
"87ffff",
"af0000",
"af005f",
"af0087",
"af00af",
"af00d7",
"af00ff",
"af5f00",
"af5f5f",
"af5f87",
"af5faf",
"af5fd7",
"af5fff",
"af8700",
"af875f",
"af8787",
"af87af",
"af87d7",
"af87ff",
"afaf00",
"afaf5f",
"afaf87",
"afafaf",
"afafd7",
"afafff",
"afd700",
"afd75f",
"afd787",
"afd7af",
"afd7d7",
"afd7ff",
"afff00",
"afff5f",
"afff87",
"afffaf",
"afffd7",
"afffff",
"d70000",
"d7005f",
"d70087",
"d700af",
"d700d7",
"d700ff",
"d75f00",
"d75f5f",
"d75f87",
"d75faf",
"d75fd7",
"d75fff",
"d78700",
"d7875f",
"d78787",
"d787af",
"d787d7",
"d787ff",
"d7af00",
"d7af5f",
"d7af87",
"d7afaf",
"d7afd7",
"d7afff",
"d7d700",
"d7d75f",
"d7d787",
"d7d7af",
"d7d7d7",
"d7d7ff",
"d7ff00",
"d7ff5f",
"d7ff87",
"d7ffaf",
"d7ffd7",
"d7ffff",
"ff0000",
"ff005f",
"ff0087",
"ff00af",
"ff00d7",
"ff00ff",
"ff5f00",
"ff5f5f",
"ff5f87",
"ff5faf",
"ff5fd7",
"ff5fff",
"ff8700",
"ff875f",
"ff8787",
"ff87af",
"ff87d7",
"ff87ff",
"ffaf00",
"ffaf5f",
"ffaf87",
"ffafaf",
"ffafd7",
"ffafff",
"ffd700",
"ffd75f",
"ffd787",
"ffd7af",
"ffd7d7",
"ffd7ff",
"ffff00",
"ffff5f",
"ffff87",
"ffffaf",
"ffffd7",
"ffffff",
"080808",
"121212",
"1c1c1c",
"262626",
"303030",
"3a3a3a",
"444444",
"4e4e4e",
"585858",
"606060",
"666666",
"767676",
"808080",
"8a8a8a",
"949494",
"9e9e9e",
"a8a8a8",
"b2b2b2",
"bcbcbc",
"c6c6c6",
"d0d0d0",
"dadada",
"e4e4e4",
"eeeeee"]

},{}]},{},[2])
;