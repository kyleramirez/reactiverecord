import React, { Component } from "react"
import { without, triggerEventForProps, isEmptyObject } from "../utils"

function noop() {}

const Validator = {
  firstErrorMessage: function(validators, value) {
    console.log("Performing local validations")
    return (Math.random() >= 0.5) ? "BIG mistake, friendo!" : null
  },
  firstRemoteErrorMessage: function(validators, value, callback) {
    console.log("Performing remote validations")
    callback((Math.random() >= 0.5) ? "REMOTELY big mistake, friendo!" : null)
  },
}

export default function validated(WrappedComponent) {
  const {
    name="Unknown",
    displayName:wrappedComponentName=name
  } = WrappedComponent;

  return class extends Component {
    static displayName = `validated(${wrappedComponentName})`;

    constructor(props, context) {
      super(props, context);
      this.state = {
        errorText: null,
        valueForPropsErrorText: null
      }
      if (props.errorText) {
        state.valueForPropsErrorText = props.value || props.defaultValue;
      }

      this.onChange = this::this.onChange;
      this.onBlur = this::this.onBlur;
    }

    componentWillReceiveProps({ errorText }) {
      if (errorText && this.props.errorText !== errorText) {
        this.setState({
          valueForPropsErrorText: this.getValueInternal()
        })
      }
    }

    render() {
      const { onChange, onBlur, errorText } = this;
      
      return <WrappedComponent
               {...this.props::without("onChange", "onBlur", "errorText")}
               {...{ onChange, onBlur, errorText }}
               ref={ ref => { this.input = ref }}
             />
    }

    get errorText() {
      const { props, state, input } = this;
      if (props.errorText) {
        /* 
         * Props says there's an error. The
         * component has not yet mounted.
         */
        if (!input) return props.errorText;
        /* 
         * Props says there's an error and the value that
         * caused the error is unchanged.
         */
        if (JSON.stringify(this.getValueInternal()) === JSON.stringify(state.valueForPropsErrorText))
          return props.errorText;
      }
      /* 
       * The state error text will be
       * the latest error or null
       */
      return state.errorText;
    }

    getValueInternal() {
      if (typeof this.value === "function")
        return this.value({})
      return this.value
    }

    get value() {
      return this.input.value;
    }

    isValid(callback) {
      this.runValidations(true, callback)
    }

    onChange(e) {
      this.runValidations()
      this::triggerEventForProps("Change", e);
    }

    onBlur(e) {
      this.runValidations(true);
      this::triggerEventForProps("Blur", e);
    }

    runValidations(doRemote=false, callback=noop) {
      const { validators } = this.props;
      if (!validators || validators::isEmptyObject()) {
        this.setState({ errorText: null });
        callback(true);
      }
      const value = this.getValueInternal();
      /* 
       * If remote validations are included, first find any
       * local errors. If there is an error without needing
       * to perform remote validations, show it now.
       */
      const errorText = Validator.firstErrorMessage(validators, value);
      this.setState({ errorText });
      if (errorText) {
        callback(false);
        /* Halt execution if a local error was found */
        return
      }
      /* No local errors found, but we're not out of the woods
         yet ... time to perform remote validations if needed
       */
      if (doRemote) {
        Validator.firstRemoteErrorMessage(validators, value, errorText => {
          this.setState({ errorText })
          callback(!!errorText)
        });
        return
      }
      /* No error and not doing remote. The field is valid */
      callback(true)
    }
  }
}
