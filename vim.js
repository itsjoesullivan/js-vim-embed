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

},{"../style.css":6}],3:[function(require,module,exports){
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

},{"../components/component-mousetrap":7}],6:[function(require,module,exports){
module.exports = '.vim-container{margin:0;padding:0;position:relative;height:100%;width:100%;border-radius:4px;color:#f4f4f4;background-color:#111;font-size:14px;font-family:"Courier New", Courier, monospace}.vim-container pre,.vim-container span{font-size:inherit}.vim-container .selection{background-color:#555}.vim-container .selection.cursor{background-color:#888;color:#333}.vim-container .gutter{color:#ca792d;font-weight:700}.vim-container .blank{color:#4a39de;font-weight:700}.vim-container .var{color:#c0bb31}';

},{}],7:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
/* Nothing to see here */
module.exports = require('./lib/Vim');

},{"./lib/Vim":8}],9:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./lib/event":15}],16:[function(require,module,exports){
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
},{"./Cursor":17,"./mark":18,"./Event":12,"./Undo":13,"underscore":11}],17:[function(require,module,exports){
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

},{"./Event":12}],18:[function(require,module,exports){
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

},{"underscore":11}],19:[function(require,module,exports){
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

},{"underscore":11,"get-set":14,"mauve":20}],15:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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

},{"../mark":18,"underscore":11}],22:[function(require,module,exports){
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

},{"underscore":11}],23:[function(require,module,exports){
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
},{"../mark":18,"underscore":11}]