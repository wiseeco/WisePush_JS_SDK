$.validator.addMethod(
	"regex",
	function(value, element, regexp) {
		return this.optional(element) || regexp.test(value);
	},
	"Please check your input."
);