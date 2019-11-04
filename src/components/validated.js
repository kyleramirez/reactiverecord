import React, { Component } from "react"
import { without, isEmptyObject } from "../utils"
import Validator from "../Validator"

/**
 * Validated HOC
 *
 * Assigns model validations to the wrapped component. The component should be a simple
 * input which responds to the following props:
 * - `ref` which exposes a `value` attribute or getter
 * - `onChange` called each time the input changes
 * - `onBlur` called each time the input is blurred
 * - `errorText` which will be a string, present only if the value is invalid
 * - `validating` which is true only when remote validations are occurring
 *
 * @param {Component} WrappedComponent An input component which accepts a ref that responds to value
 * @return {Component} The wrapped component.
 */
export default function validated(WrappedComponent) {
  const { name = "Unknown", displayName: wrappedComponentName = name } = WrappedComponent

  return class extends Component {
    static displayName = `validated(${wrappedComponentName})`

    constructor(props, context) {
      super(props, context)
      const initialState = {
        errorText: null,
        valueForPropsErrorText: null,
        validating: false
      }
      if (props.errorText) {
        initialState.valueForPropsErrorText = props.value || props.defaultValue
      }
      this.state = initialState
      this.safeSetState = nextState => {
        if (this.input) {
          this.setState(nextState)
        }
      }
    }

    componentDidUpdate(prevProps) {
      const { props } = this
      if (props.errorText && prevProps.errorText !== props.errorText) {
        this.safeSetState({
          valueForPropsErrorText: this.getValueInternal()
        })
      }
    }

    render() {
      const { state } = this
      return (
        <WrappedComponent
          {...without.call(this.props, "validators")}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          errorText={this.errorText}
          validating={state.validating}
          ref={this.storeInput}
        />
      )
    }

    storeInput = ref => {
      this.input = ref
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
      this.runValidations(true /* Include remote validations */, callback)
    }

    handleChange = e => {
      if (this.props.onChange) {
        this.props.onChange(e)
        if (e.defaultPrevented) {
          return
        }
      }
      this.runValidations(false /* Skip remote validations */)
    }

    handleBlur = e => {
      if (this.props.onBlur) {
        this.props.onBlur(e)
        if (e.defaultPrevented) {
          return
        }
      }
      this.runValidations(true /* Include remote validations */)
    }

    runValidations(includeRemoteValidations, callback) {
      const { props, state } = this
      /* If no validations */
      if (!props.validators || isEmptyObject(props.validators)) {
        if (state.errorText !== null) {
          this.safeSetState({ errorText: null })
        }
        if (callback) {
          callback(true /* Is valid */)
        }
        return
      }
      const value = this.getValueInternal()
      /* 
       * If remote validations are included, first find any
       * local errors. If there is an error without needing
       * to perform remote validations, show it now.
       */
      const localErrorText = Validator.firstErrorMessage(props.validators, value)
      /* Only trigger update if there's a need */
      if (state.errorText !== localErrorText) {
        this.safeSetState({ errorText: localErrorText })
      }
      /* Return early if there was a local error */
      if (localErrorText) {
        if (callback) {
          callback(false /* Is not valid */)
        }
        return
      }
      /* Return early if skipping remote validations */
      if (!includeRemoteValidations) {
        if (callback) {
          callback(true /* Is valid */)
        }
        return
      }
      /* Perform remote validations */
      const beginValidation = () => {
        props.validators.form.increaseValidation()
        this.safeSetState({ validating: true })
      }
      const endValidation = errorText => {
        const { state } = this
        const nextState = {}
        const validationOccurred = state.validating
        if (validationOccurred) {
          nextState.validating = false
        }
        if (state.errorText !== errorText) {
          nextState.errorText = errorText
        }
        if (Object.keys(nextState).length) {
          this.safeSetState(nextState)
        }
        if (validationOccurred) {
          props.validators.form.decreaseValidation()
        }
        if (callback) {
          callback(!errorText /* Is valid when error text is falsy */)
        }
      }
      Validator.firstRemoteErrorMessage(props.validators, value, beginValidation, endValidation)
    }
  }
}
