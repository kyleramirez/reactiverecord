import React, { forwardRef, useState, useEffect, useRef } from "react"
import { without } from "../utils"
import PropTypes from "prop-types"
// import Validator from "../Validator"

function useUpdateEffect(fn, inputs) {
  const didMountRef = useRef(false)
  useEffect(function() {
    if (didMountRef.current) {
      fn()
      return
    }
    didMountRef.current = true
  }, inputs)
}

// function getValue({ current }) {
//   const { value } = current
//   if (typeof value === "function") {
//     return value({})
//   }
//   return value
// }
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

  const ValidatedComponent = forwardRef(function({ errorText: propsErrorText, ...props }) {
    const [state, setState] = useState({
      propsErrorTextStale: false,
      errorText: null,
      validating: false
    })
    const inputRef = useRef(null)
    useUpdateEffect(
      function() {
        setState({ ...state, propsErrorTextStale: false })
      },
      [propsErrorText]
    )
    let errorText = state.errorText
    if (propsErrorText && !state.propsErrorTextStale) {
      errorText = propsErrorText
    }
    function handleChange(event) {
      if (props.onChange) {
        props.onChange(event)
        if (event.defaultPrevented) {
          return
        }
      }
    }
    function handleBlur(event) {
      if (props.onBlur) {
        props.onBlur(event)
        if (event.defaultPrevented) {
          return
        }
      }
    }
    return (
      <WrappedComponent
        disabled={state.validating}
        {...without.call(props, "validators")}
        onChange={handleChange}
        onBlur={handleBlur}
        errorText={errorText}
        ref={inputRef}
      />
    )
  })

  ValidatedComponent.propTypes = {
    onChange: PropTypes.func,
    onBlur: PropTypes.func
  }

  ValidatedComponent.displayName = `validated(${wrappedComponentName})`

  return ValidatedComponent
}
/* Provide a way to get the value */
// useEffect(function() {
//   console.log("Running the useEffect for forwardedRef")
//   if (forwardedRef) {
//     forwardedRef({
//       get value() {
//         return getValue(inputRef)
//       },
//     })
//   }
// }, [forwardedRef, inputRef])
/* Record the value of the form field whenever an error was added */
// useEffect(function() {
//   console.log("Setting the valueForPropsErrorText")
//   setState({ valueForPropsErrorText: getValue(inputRef) })
// }, [propsErrorText])
