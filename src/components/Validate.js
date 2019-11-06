import { forwardRef } from "react"
import validated from "./validated"

/** Implements the `validated` HOC. */
const Validate = forwardRef(
  /**
   * @param {Object} props Component props
   * @param {boolean} props.validating True when async validations are occurring.
   * @param {*} props.errorText Typically a string describing the error
   * @param {function} props.children Function which receives props that can be given to a native HTML input
   * @param {Object} ref Forwarded Ref
   */
  function({ validating, errorText, children, ...props }, ref) {
    return children({ ...props, ref }, errorText, validating)
  }
)
Validate.displayName = "Validate"

export default validated(Validate)
