import React, { forwardRef, useState, useEffect, useRef, useMemo } from "react"
// import { without, isEmptyObject } from "../utils"
// import Validator from "../Validator"

function useUpdateEffect(fn, inputs) {
  const didMountRef = useRef(false)
  useEffect(
    function() {
      if (didMountRef.current) {
        fn()
        return
      }
      didMountRef.current = true
    },
    inputs
  )
}

function getValueInternal({ current }) {
  if (current) {
    const { value } = current
    if (typeof value === "function") {
      return value({})
    }
    return value
  }
  return null
}

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

  const ValidatedComponent = forwardRef(
    function({ errorText: propsErrorText, ...props }/*, forwardedRef*/) {
      const [state, setState] = useState({
        errorText: null,
        valueThatCausedError: propsErrorText ? props.value || props.defaultValue : null,
        validating: false,
      })
      const storeInput = useRef(null)
      /* Provide a way to get the value */
      // useEffect(function() {
      //   console.log("Running the useEffect for forwardedRef")
      //   if (forwardedRef) {
      //     forwardedRef({
      //       get value() {
      //         return getValueInternal(storeInput)
      //       },
      //     })
      //   }
      // }, [forwardedRef, storeInput])
      /* Record the value of the form field whenever an error was added */
      // useEffect(function() {
      //   console.log("Setting the valueForPropsErrorText")
      //   setState({ valueForPropsErrorText: getValueInternal(storeInput) })
      // }, [propsErrorText])
      useUpdateEffect(
        function() {
          console.log("setting value that caused error")
          if (propsErrorText) {
            setState({ valueThatCausedError: getValueInternal(storeInput) })
          }
        },
        [propsErrorText]
      )
      const errorText = useMemo(
        function() {
          console.log("Computing error text", propsErrorText, state.errorText)
          if (propsErrorText) {
            return propsErrorText
          }
          return state.errorText
        },
        [propsErrorText, state.errorText]
      )

      return (
        <WrappedComponent
          {...props}
          errorText={errorText}
          ref={storeInput}
        />
      )
    }
  )

  ValidatedComponent.displayName = `validated(${wrappedComponentName})`

  return ValidatedComponent
}