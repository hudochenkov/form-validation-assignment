/* global bfaValidator */

// User's code

// Setup validation for a single form with default options
bfaValidator(document.querySelector('.js-signup'));

// Setup validation for multiple forms with default options
Array.prototype.slice.call(document.querySelectorAll('.js-form')).forEach(function (element) {
	bfaValidator(element);
});

// Setup validation for a form and add email validation rule
bfaValidator(
	document.querySelector('.js-form-with-custom-rule'),
	{
		rules: {
			email: function (field) {
				var emailRegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

				if (
					field.getAttribute('type') === 'email'
					&& field.value.trim().length > 0
				) {
					return emailRegExp.test(field.value.trim());
				}

				return true;
			},
		},
		messages: {
			email: 'This isn\'t a valid email address',
		},
	}
);

// This form in HTML goes after form with custom rule (see above)
// Testing that previous options don't interfere with other forms.
bfaValidator(document.querySelector('.js-form-2'));

// Change message for default rule. Useful for internationalization
bfaValidator(
	document.querySelector('.js-custom-message'),
	{
		messages: {
			required: 'Custom message for required fields',
		},
	}
);
