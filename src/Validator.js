import Sugar from "./sugar"
import { formatWith } from "./utils"

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
       *   absence: [{ message: "%{attribute} must not be present" }]
       * }
       */
      absence: function(value, options) {
        if (!/^\s*$/.test(value || "")) {
          return options.message;
        }
      },
     /*
      * attr: {
      *   presence: [{ message: "%{attribute} must be present" }]
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
      *       message: "%{attribute} must be accepted",
      *       accept: true || "yes"
      *     }
      *   ]
      * }
      */
      acceptance: function(value, options) {
        if (typeof options.accept === "boolean")
          if (!value) return options.message;
        if(value !== options.accept) return options.message;
      },
     /*
      * attr: {
      *   format: [
      *     {
      *       message: "Please enter a valid %{attribute}",
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
      *         only_integer: "%{attribute} must only be an integer."
      *       }
      *       ...
      *       allow_blank: true,
      *       messages: {
      *         numericality: "%{attribute} must be a number."
      *       }
      *       ...
      *       greater_than: 0 || "other_attr"
      *       messages: {
      *         greater_than: "%{attribute} must be greater than 0."
      *       }
      *       ...
      *       odd: true,
      *       messages: {
      *         odd: "%{attribute} must be an odd number."
      *       }
      *       ...
      *       even: true,
      *       messages: {
      *         even: "%{attribute} must be an even number."
      *       }
      *     }
      *   ]
      * }
      */
      numericality: function(value, options, form) {
        const { separator } = Validator.settings.number_format,
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
        /* eslint-disable guard-for-in */
        for (let check in CHECKS) {
        /* eslint-enable guard-for-in */
          const operator = CHECKS[check];
          if (options[check] !== undefined) {
            const checkValue = !isNaN(parseFloat(options[check])) && isFinite(options[check]) ?
              /* The checkValue will be hardcoded in the validator */
              options[check]
            :
              /* The checkValue will be dynamic based on another attribute */
              form.fields.hasOwnProperty(options[check]) ?
                /* Is there a value in the form */
                /* Is it a function type value */
                typeof form.fields[options[check]].value === "function" ?
                  JSON.stringify(form.fields[options[check]].value({}))
                :
                  /* If not, just a regular getter */
                  form.fields[options[check]].value
              :
                /* Fallback to the Model instance */
                form.props.for[options[check]]
            if (checkValue === undefined || checkValue === "") return;
            /* eslint-disable no-new-func */
            const fn = new Function(`return ${safeValue} ${operator} ${checkValue}`)
            /* eslint-enable no-new-func */
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
      *       allow_blank: true,
      *       is: 10
      *       messages: {
      *         is: "%{attribute} must be 10 characters."
      *       }
      *     }
      *     ...
      *     {
      *       minimum: 10,
      *       maximum: 255,
      *       messages: {
      *         minimum: "%{attribute} must be at least 10 characters.",
      *         maximum: "%{attribute} must be no more than 255 characters."
      *       }
      *     }
      *     ...
      *   ]
      * }
      */
      length: function(value, options) {
        /* eslint-disable no-new-func */
        const valueLength = new Function("value", "return (value.split('') || '').length")(value),
        /* eslint-enable no-new-func */
              CHECKS = {
                is: "==",
                minimum: ">=",
                maximum: "<="
              },
              blankOptions = {};
        if ("is" in options || "minimum" in options) {
          blankOptions.message = "is" in options ? options.messages.is : options.messages.minimum;
        }
        if (options.allow_blank === true && this.presence(value, { message: options.messages.numericality })) return;
        const message = this.presence(value, blankOptions);
        if (message) {
          if (options.allow_blank === true) return
          return message;
        }
        /* eslint-disable guard-for-in */
        for (let check in CHECKS) {
        /* eslint-enable guard-for-in */
          const operator = CHECKS[check];
          if (options[check] === undefined) continue;
          /* eslint-disable no-new-func */
          const fn = new Function(`return ${valueLength} ${operator} ${options[check]}`);
          /* eslint-enable no-new-func */
          if (!fn()) return options.messages[check];
        }
      },
     /*
      * attr: {
      *   exclusion: [
      *     {
      *       allow_blank: true
      *       in: ["Maryland, Texas"]
      *       message: "%{attribute} is reserved."
      *     }
      *     ...
      *     {
      *       range: [18,24]
      *       message: "%{attribute} is reserved."
      *     }
      *   ]
      * }
      */
      exclusion: function(value, options) {
        const message = this.presence(value, options);
        if (message) {
          if (options.allow_blank === true) return
          return message;
        }
        if ("in" in options && options.in.map(String).indexOf(value) >= 0) return options.message;
        if ("range" in options) {
          const [lower, upper] = options.range;
          if (value >= lower && value <= upper) return options.message;
        }
      },
     /*
      * attr: {
      *   inclusion: [
      *     {
      *       allow_blank: true
      *       in: ["Rent, Security deposit"]
      *       message: "%{attribute} is not included in the list."
      *     }
      *     ...
      *     {
      *       range: [1,12]
      *       message: "%{attribute} is not included in the list."
      *     }
      *   ]
      * }
      */
      inclusion: function(value, options) {
        const message = this.presence(value, options);
        if (message) {
          if (options.allow_blank === true) return
          return message;
        }
        if ("in" in options && options.in.map(String).indexOf(value) === -1) return options.message;
        if ("range" in options) {
          const [lower, upper] = options.range;
          if (value >= lower && value <= upper) return;
          return options.message;
        }
      },
     /*
      * attr: {
      *   confirmation: [
      *     {
      *       case_sensitive: true
      *       message: "%{attribute} does not match %{} confirmation."
      *     }
      *   ]
      * }
      */
      confirmation: function(value, options, form, attribute) {
        const confirmationFieldName = `${attribute}_confirmation`
        if (confirmationFieldName in form.fields) {
          /* Is there a value in the form */
          const confirmationValue = form.fields[confirmationFieldName].value
          const stringFn = options.case_sensitive ? "toString" : "toLowerCase"
          if (value[stringFn]() !== confirmationValue[stringFn]()) return options.message
        }
      }
    },
    remote: {}
  },
  firstErrorMessage: function(validationObj, value) {
    const { attribute, form, ...validators } = validationObj;
    /* eslint-disable guard-for-in */
    for (let validator in validators) {
    /* eslint-enable guard-for-in */
      const optionsArr = validators[validator];
      if (validator in this.validators.local) {
        for (let i = 0; i < optionsArr.length; i++) {
          const options = optionsArr[i];
          const msg = this.validators.local[validator](value, options, form, attribute);
          if (msg) return msg::formatWith({
            value,
            attribute: Sugar.String.titleize(Sugar.String.humanize(attribute))
          });
        }
      }
    }
    return null;
  },
  firstRemoteErrorMessage: function(validationObj, value, beginValidation, callback) {
    const { attribute, form, ...validators } = validationObj,
          remoteValidators = Object.keys(validators).filter(validator => (Object.keys(this.validators.remote).indexOf(validator) >= 0)),
          validatorsToCheck = remoteValidators.length;

    let validatorsChecked = 0;

    const runNextValidator = function(msg) {
            validatorsChecked++;
            if (msg)
              return callback(msg::formatWith({
                value,
                attribute: Sugar.String.titleize(Sugar.String.humanize(attribute))
              }));
            if (validatorsToCheck === validatorsChecked) return callback(null);
            const validator = remoteValidators[validatorsChecked],
                  options = validators[validator][0];
            this.validators.remote[validator](value, options, form, attribute, runNextValidator);
          }
    if (!validatorsToCheck) return callback(null);
    form.increaseValidation()
    beginValidation()
    const validator = remoteValidators[validatorsChecked],
          options = validators[validator][0];
    this.validators.remote[validator](value, options, form, attribute, runNextValidator);
  },
}
export default Validator;