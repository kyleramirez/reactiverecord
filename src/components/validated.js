import React, { Component } from "react"
import { without, triggerEventForProps, isEmptyObject } from "../utils"
import Validator from "../Validator"
function noop() {}

export default function validated(WrappedComponent) {
  const { name = "Unknown", displayName: wrappedComponentName = name } = WrappedComponent

  return class extends Component {
    static displayName = `validated(${wrappedComponentName})`

    constructor(props, context) {
      super(props, context)
      const state = {
        errorText: null,
        valueForPropsErrorText: null,
        validating: false
      }
      if (props.errorText) {
        state.valueForPropsErrorText = props.value || props.defaultValue
      }
      this.state = state

      this.safeSetState = (...args) => {
        if (this.input) {
          this.setState(...args)
        }
      }
      this.beginValidation = () => this.safeSetState({ validating: true })
    }

    componentWillReceiveProps({ errorText }) {
      if (errorText && this.props.errorText !== errorText) {
        this.safeSetState({
          valueForPropsErrorText: this.getValueInternal()
        })
      }
    }

    render() {
      const {
        onChange,
        onBlur,
        errorText,
        state: { validating }
      } = this

      return (
        <WrappedComponent
          {...without.call(this.props, "onChange", "onBlur", "errorText", "validators")}
          {...{ onChange, onBlur, errorText, validating }}
          ref={ref => {
            this.input = ref
          }}
        />
      )
    }

    get errorText() {
      const { props, state, input } = this
      if (props.errorText) {
        /* 
         * Props says there's an error. The
         * component has not yet mounted.
         */
        if (!input) {
          return props.errorText
        }
        /* 
         * Props says there's an error and the value that
         * caused the error is unchanged.
         */
        if (JSON.stringify(this.getValueInternal()) === JSON.stringify(state.valueForPropsErrorText)) {
          return props.errorText
        }
      }
      /* 
       * The state error text will be
       * the latest error or null
       */
      return state.errorText
    }

    getValueInternal() {
      if (typeof this.value === "function") {
        return this.value({})
      }
      return this.value
    }

    get value() {
      return this.input.value
    }

    isValid(callback) {
      this.runValidations(true, callback)
    }

    onChange = e => {
      this.runValidations()
      triggerEventForProps.call(this, "Change", e)
    }

    onBlur = e => {
      this.runValidations(true)
      triggerEventForProps.call(this, "Blur", e)
    }

    runValidations(doRemote = false, callback = noop) {
      const { validators } = this.props
      if (!validators || isEmptyObject.call(validators)) {
        this.safeSetState({ errorText: null })
        callback(true)
        return
      }
      const value = this.getValueInternal()
      /* 
       * If remote validations are included, first find any
       * local errors. If there is an error without needing
       * to perform remote validations, show it now.
       */
      const errorText = Validator.firstErrorMessage(validators, value)
      this.safeSetState({ errorText })
      if (errorText) {
        callback(false)
        return
      }
      if (!doRemote) {
        callback(true)
        return
      }
      /* No local errors found, but we're not out of the woods
         yet ... time to perform remote validations if needed
       */
      Validator.firstRemoteErrorMessage(validators, value, this.beginValidation, errorText => {
        this.safeSetState({ errorText, validating: false })
        validators.form.decreaseValidation()
        callback(!!!errorText)
      })
    }
  }
}
