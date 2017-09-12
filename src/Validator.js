const Validator = {
  settings: {
    number_format: {
      separator: ".",
      delimiter: ","
    },
  },
  patterns: {
    numericality: {
      default: /^[-+]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?$/,
      only_integer: /^[+-]?\\d+$/
    }
  },
  validators: {
    local: {
      /*
       * attr: {
       *   absence: [{ message: "%{attr} must not be present" }]
       * }
       */
      absence: function(value, options) {
        if (!/^\s*$/.test(value || "")) {
          return options.message;
        }
      },
     /*
      * attr: {
      *   presence: [{ message: "%{attr} must be present" }]
      * }
      */
      presence: function(value, options) {
        if (/^\s*$/.test(value || "")) {
          return options.message;
        }
      },
     /*
      * attr: {
      *   acceptance: [
      *     {
      *       message: "%{attr} must be accepted",
      *       accept: true || "yes"
      *     }
      *   ]
      * }
      */
      acceptance: function(value, options=true) {
        if (typeof options.accept === "boolean")
          if (!value) return options.message;
        if(value !== options.accept) return options.message;
      },
     /*
      * attr: {
      *   format: [
      *     {
      *       message: "Please enter a valid %{attr}",
      *       with: /regex/,
      *       without: /regex/,
      *       allow_blank: false|true
      *     }
      *   ]
      * }
      */
      format: function(value, options) {
        let message = this.presence(value, options);
        if (message) {
          if (options.allow_blank === true) return;
          return message;
        }
        if (options.with && !options.with.test(value)) return options.message;
        if (options.without && options.without.test(value)) return options.message;
      },
     /*
      * attr: {
      *   numericality: [
      *     {
      *       only_integer: true,
      *       messages:{
      *         only_integer: "%{attr} must only be an integer."
      *       }
      *       ...
      *       allow_blank: true,
      *       messages: {
      *         numericality: "%{attr} must be a number."
      *       }
      *       ...
      *       greater_than: 0 || "other_attr"
      *       messages: {
      *         greater_than: "%{attr} must be greater than 0."
      *       }
      *       ...
      *       odd: true,
      *       messages: {
      *         odd: "%{attr} must be an odd number."
      *       }
      *       ...
      *       even: true,
      *       messages: {
      *         even: "%{attr} must be an even number."
      *       }
      *     }
      *   ]
      * }
      */
      numericality: function(value, options, form) {
        const { separator, delimiter } = Validator.settings.number_format,
              safeValue = value.replace(new RegExp(separator,"g"), ".");
        if (options.only_integer && !Validator.patterns.numericality.only_integer.test(safeValue))
          return options.messages.only_integer
        if (!Validator.patterns.numericality.default.test(safeValue)) {
          if (options.allow_blank === true && this.presence(safeValue, { message: options.messages.numericality })) return;
          return options.messages.numericality;
        }
        const CHECKS = {
          greater_than: ">",
          greater_than_or_equal_to: ">=",
          equal_to: "==",
          less_than: "<",
          less_than_or_equal_to: "<="
        }
        for (let check in CHECKS) {
          const operator = CHECKS[check];
          if (options[check] !== undefined) {
            checkValue = !isNaN(parseFloat(options[check])) && isFinite(options[check]) ?
              /* The checkValue will be hardcoded in the validator */
              options[check]
            :
              /* The checkValue will be dynamic based on another attribute */
              form.fields.hasOwnProperty(options[check]) ?
                /* Is there a value in the form */
                /* Is it a function type value */
                typeof form.fields[options[check]].value === "function" ?
                  form.fields[options[check]].value({})
                :
                  /* If not, just a regular getter */
                  form.fields[options[check]].value
              :
                /* Fallback to the Model instance */
                form.props.for[options[check]]
            if (checkValue === undefined || checkValue === "") return;
            const fn = new Function(`return ${safeValue} ${operator} ${checkValue}`)
            if (!fn()) return options.messages[check]
          }
        }
        if (options.odd && !(parseInt(safeValue, 10) % 2)) {
          return options.messages.odd;
        }
        if (options.even && (parseInt(safeValue, 10) % 2)) {
          return options.messages.even;
        }
      },
     /*
      * attr: {
      *   length: [
      *     {
      *       message: "",
      *     }
      *   ]
      * }
      */
      length: function(value, options) {
        var CHECKS, blankOptions, check, fn, message, operator, tokenized_length, tokenizer;
        tokenizer = options.js_tokenizer || "split('')";
        tokenized_length = new Function('element', "return (element.val()." + tokenizer + " || '').length")(element);
        CHECKS = {
          is: '==',
          minimum: '>=',
          maximum: '<='
        };
        blankOptions = {};
        blankOptions.message = options.is ? options.messages.is : options.minimum ? options.messages.minimum : void 0;
        message = this.presence(element, blankOptions);
        if (message) {
          if (options.allow_blank === true) {
            return;
          }
          return message;
        }
        for (check in CHECKS) {
          operator = CHECKS[check];
          if (!options[check]) {
            continue;
          }
          fn = new Function("return " + tokenized_length + " " + operator + " " + options[check]);
          if (!fn()) {
            return options.messages[check];
          }
        }
      },
      exclusion: function(element, options) {
        var lower, message, option, ref, upper;
        message = this.presence(element, options);
        if (message) {
          if (options.allow_blank === true) {
            return;
          }
          return message;
        }
        if (options["in"]) {
          if (ref = element.val(), indexOf.call((function() {
            var i, len, ref1, results;
            ref1 = options["in"];
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              option = ref1[i];
              results.push(option.toString());
            }
            return results;
          })(), ref) >= 0) {
            return options.message;
          }
        }
        if (options.range) {
          lower = options.range[0];
          upper = options.range[1];
          if (element.val() >= lower && element.val() <= upper) {
            return options.message;
          }
        }
      },
      inclusion: function(element, options) {
        var lower, message, option, ref, upper;
        message = this.presence(element, options);
        if (message) {
          if (options.allow_blank === true) {
            return;
          }
          return message;
        }
        if (options["in"]) {
          if (ref = element.val(), indexOf.call((function() {
            var i, len, ref1, results;
            ref1 = options["in"];
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              option = ref1[i];
              results.push(option.toString());
            }
            return results;
          })(), ref) >= 0) {
            return;
          }
          return options.message;
        }
        if (options.range) {
          lower = options.range[0];
          upper = options.range[1];
          if (element.val() >= lower && element.val() <= upper) {
            return;
          }
          return options.message;
        }
      },
      confirmation: function(element, options) {
        var confirmation_value, value;
        value = element.val();
        confirmation_value = $("#" + (element.attr('id')) + "_confirmation").val();
        if (!options.case_sensitive) {
          value = value.toLowerCase();
          confirmation_value = confirmation_value.toLowerCase();
        }
        if (value !== confirmation_value) {
          return options.message;
        }
      }
    },
    remote: {}
  },
  firstErrorMessage: function(validators, value) {
    console.log(validators)
    return (Math.random() >= 0.5) ? "BIG mistake, friendo!" : null
  },
  firstRemoteErrorMessage: function(validators, value, callback) {
    console.log("Performing remote validations")
    callback((Math.random() >= 0.5) ? "REMOTELY big mistake, friendo!" : null)
  },
}
export default Validator;