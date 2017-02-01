(function (root, factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		root.bfaValidator = factory;
	}
}(this, function (formElement, opts) {
	// If form was passed to validator, add listeners to validate when it's needed
	if (typeof formElement !== 'undefined') {
		if (
			formElement
			&& formElement.nodeName
			&& formElement.nodeName === 'FORM'
		) {
			addListeners(formElement);
		} else {
			throw new Error('bfaValidator: only forms could be validated');
		}
	}

	// Default rules
	var rules = {
		required: function (field) {
			if (field.required) {
				// If checkbox is checked
				if (
					field.type === 'checkbox'
					&& !field.checked
				) {
					return false;
				}

				// If radio group has selected option
				if (
					field.type === 'radio'
					&& !field.form.querySelector('input[name="' + field.name + '"]:checked')
				) {
					return false;
				}

				// If field is not empty or has selected option
				if (
					field.value !== null
					&& field.value.trim() === ''
				) {
					return false;
				}
			}

			return true;
		},
		maxlength: function (field) {
			var maxlength = Number(field.getAttribute('maxlength'));

			if (
				maxlength > 0
				&& field.value.trim().length > maxlength
			) {
				return false;
			}

			return true;
		},
		minlength: function (field) {
			var minlength = Number(field.getAttribute('minlength'));

			if (
				minlength >= 0
				&& field.value.trim().length < minlength
			) {
				return false;
			}

			return true;
		},
	};

	// Messages for rules above. Keys are the same as in `rules` object
	// Made as separate object for easier internationalization
	var messages = {
		required: 'This is a required field.',
		maxlength: 'Too long.',
		minlength: 'Too short.',
	};

	var defaultOptions = {
		rules: rules,
		messages: messages,
		messageClassName: 'bfa-error-message',
	};

	// If no options passed set default options
	opts = opts || {};

	// Merge default options and user's options
	var options = objectAssign({}, defaultOptions, opts);

	// Merge above will overwrite every rule, so make sure we didn't lost any rules
	if (opts.rules) {
		options.rules = objectAssign({}, rules, opts.rules);
	}

	if (opts.messages) {
		options.messages = objectAssign({}, messages, opts.messages);
	}

	function addListeners(form) {
		// Disable native validation
		// Because we want fully customizable validation
		if (typeof form.noValidate !== 'undefined') {
			form.noValidate = true;
		}

		// Form can be submit with click on Submit button, or by pressing Enter while focus in a form field
		// `submit` event is universal
		form.addEventListener('submit', function (e) {
			// Prevent form submitting only for example, so page will not refresh if form is valid
			// It will not go to the final module
			e.preventDefault();

			// Indicator for presentational purpose of this assignment only
			var indicator = document.querySelector('.form-indicator');

			if (validateForm(form)) {
				indicator.innerHTML = '✔︎ Valid: ' + Date.now();
			} else {
				// Prevent form from submitting if it's not valid
				// It will go to the final module
				e.preventDefault();
				indicator.innerHTML = '✘ Invalid: ' + Date.now();
			}
		});

		// If form was validated before and user corrects invalid field, we validate form again to remove old validation error message
		form.addEventListener('change', function () {
			if (wasValidated(form)) {
				validateForm(form);
			}
		});
	}

	function validateForm(form) {
		// Remove all old validation messages
		removeMessages(form);

		var isValidForm = true;

		// Form is invalid if even one field is invalid
		Array.prototype.slice.call(form.elements).forEach(function (field) {
			if (!validateField(field)) {
				isValidForm = false;
			}
		});

		return isValidForm;
	}

	function validateField(field) {
		var nodeName = field.nodeName;

		// Skip all nodes which are not <input>, <textarea>, or <select>
		if (
			nodeName !== 'INPUT'
			&& nodeName !== 'TEXTAREA'
			&& nodeName !== 'SELECT'
		) {
			return true;
		}

		// Skip <input> with some types
		if (nodeName === 'INPUT') {
			var type = field.type;

			if (
				type
				&& (
					type === 'submit'
					|| type === 'button'
					|| type === 'image'
					|| type === 'hidden'
				)
			) {
				return true;
			}
		}

		// Skip if disabled or readonly fields
		if (field.disabled || field.readOnly) {
			return true;
		}

		var isValidField = true;

		// Check field over every rule and report if it's invalid
		for (var rule in options.rules) {
			if (
				options.rules.hasOwnProperty(rule)
				&& !options.rules[rule](field)
			) {
				isValidField = false;
				report(field, options.messages[rule]);

				// Field might has several errors, so we'll show only the first one
				break;
			}
		}

		return isValidField;
	}

	function report(field, message) {
		// Insert error message right before field
		// Using <span> because field could be in element which will be broken by <div>. E. g. <p>
		field.insertAdjacentHTML('beforebegin', '<span class="' + options.messageClassName + '">' + message + '</span>');
	}

	function removeMessages(form) {
		Array.prototype.slice.call(form.querySelectorAll('.' + options.messageClassName)).forEach(function (message) {
			message.parentNode.removeChild(message);
		});
	}

	function wasValidated(form) {
		// Form was validated if there error messages
		return Boolean(form.querySelectorAll('.' + options.messageClassName).length);
	}

	// Object.assign ponyfill
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	function objectAssign(target, varArgs) { // eslint-disable-line no-unused-vars
		'use strict';

		if (target == null) { // eslint-disable-line no-eq-null
			throw new TypeError('Cannot convert undefined or null to object');
		}

		var to = Object(target);

		for (var index = 1; index < arguments.length; index++) {
			var nextSource = arguments[index];

			if (nextSource != null) { // eslint-disable-line no-eq-null
				for (var nextKey in nextSource) {
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}

		return to;
	}

	// Module can have public API. Currently there is nothing to expose
	return {};
}));
