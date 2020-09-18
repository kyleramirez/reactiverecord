import React, { Component } from 'react';
import { without, isEmptyObject } from '../utils';
import Validator from '../Validator';

/**
 * Validated HOC
 *
 * Assigns model validations to the wrapped component. The component should be a simple
 * input which responds to the following props:
 * - `ref` which exposes a `value` attribute or getter
 * - `onChange` called each time the input changes
 * - `onBlur` called each time the input is blurred
 * - `errorText` which will be a string, present only if the value is invalid
 * - `validating` which is true only when async validations are occurring. When this is true, it's a good opportunity to disable your input or show a loading indicator
 *
 * @param {Component} WrappedComponent An input component which accepts a ref that responds to value
 * @return {Component} The wrapped component.
 */
export default function validated(WrappedComponent) {
  const { name = 'Unknown', displayName: wrappedComponentName = name } = WrappedComponent;

  return class extends Component {
    static displayName = `validated(${wrappedComponentName})`;
    state = {
      errorText: null,
      propsErrorTextStale: false,
      validating: false,
    };

    componentDidUpdate(prevProps) {
      const { props } = this;
      if (props.errorText && prevProps.errorText !== props.errorText) {
        this.safeSetState({
          propsErrorTextStale: false,
        });
      }
    }

    render() {
      const { state, props } = this;

      let errorText = state.errorText;
      if (props.errorText && !state.propsErrorTextStale) {
        errorText = props.errorText;
      }

      return (
        <WrappedComponent
          validating={state.validating}
          {...without.call(props, 'validators')}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          errorText={errorText}
          ref={this.storeInput}
        />
      );
    }

    storeInput = ref => {
      this.input = ref;
    };

    get value() {
      return this.input.value;
    }

    isValid(callback) {
      this.runValidations(true /* Include async validations */, callback);
    }

    handleChange = e => {
      if (this.props.onChange) {
        this.props.onChange(e);
        if (e.defaultPrevented) {
          return;
        }
      }
      this.runValidations(false /* Skip async validations */);
    };

    handleBlur = e => {
      if (this.props.onBlur) {
        this.props.onBlur(e);
        if (e.defaultPrevented) {
          return;
        }
      }
      this.runValidations(true /* Include async validations */);
    };

    safeSetState = nextState => {
      if (this.input) {
        this.setState(nextState);
      }
    };

    runValidations(includeAsyncValidations, callback) {
      const { props, state } = this;
      /* Return early if no validations */
      if (!props.validators || isEmptyObject(props.validators)) {
        if (state.errorText !== null) {
          this.safeSetState({ errorText: null });
        }
        if (callback) {
          callback(true /* Is valid */);
        }
        return;
      }
      /* Get the value */
      let { value } = this;
      if (typeof value === 'function') {
        value = value({});
      }
      /* 
       * 1. Find and return an error message from synchronous validators
       * 2. Find and return an error message from async validators
       */
      const errorText = Validator.firstErrorMessage(props.validators, value);
      const nextState = {};
      /* When the state error text is no longer valid ... */
      if (state.errorText !== errorText) {
        nextState.errorText = errorText;
      }
      /* When the props error text is no longer valid ... */
      if (errorText && props.errorText) {
        nextState.propsErrorTextStale = true;
      }
      /* Only trigger update if there's a need */
      if (Object.keys(nextState).length) {
        this.safeSetState(nextState);
      }
      /* Return early if there was a synchronous error */
      if (errorText) {
        if (callback) {
          callback(false /* Is not valid */);
        }
        return;
      }
      /* Return early if skipping async validations */
      if (!includeAsyncValidations) {
        if (callback) {
          callback(true /* Is valid */);
        }
        return;
      }
      /* Perform async validations */
      const beginValidation = () => {
        props.validators.form.increaseValidation();
        this.safeSetState({ validating: true });
      };
      const endValidation = errorText => {
        const { state } = this;
        const nextState = {};
        const validationOccurred = state.validating;
        /* When we are no longer validating ... */
        if (validationOccurred) {
          nextState.validating = false;
        }
        /* When the state error text is no longer valid ... */
        if (state.errorText !== errorText) {
          nextState.errorText = errorText;
        }
        /* When the props error text is no longer valid ... */
        if (errorText && props.errorText) {
          nextState.propsErrorTextStale = true;
        }
        /* Only trigger update if there's a need */
        if (Object.keys(nextState).length) {
          this.safeSetState(nextState);
        }
        if (validationOccurred) {
          props.validators.form.decreaseValidation();
        }
        if (callback) {
          callback(!errorText /* Is valid when error text is falsy */);
        }
      };
      Validator.firstAsyncErrorMessage(props.validators, value, beginValidation, endValidation);
    }
  };
}
