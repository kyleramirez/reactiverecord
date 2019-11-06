import React, { forwardRef } from "react"
import { render } from "@testing-library/react"
import validated from "../new-validated"

const Input = forwardRef(function({ labelText, errorText, validating, ...props }, forwardedRef) {
  return (
    <label>
      <input disabled={validating} {...props} ref={forwardedRef} />
      {labelText}
      {errorText}
    </label>
  )
})
const ValidatedInput = validated(Input)

// test("basic rendering", () => {
//   const { container } = render(<ValidatedInput />)
//   expect(container).toMatchSnapshot()
//   const input = container.querySelector("input")
//   fireEvent.change(input, { target: { value: "Teddy" } })
// })
describe("error text", function() {
  it("renders prop error when given", function() {
    const { container, rerender } = render(<ValidatedInput labelText="Name" />)
    /* input rendered with no error message */
    expect(container).toMatchSnapshot()
    /* form submits and returns error */
    rerender(<ValidatedInput errorText="A name is required." labelText="Name" />)
    /* expect error text to be present */
    expect(container).toMatchSnapshot()
  })
})
describe("disabled", function() {
  it("should be disabled while validating", function() {})

  it("should be disabled if the given prop is true", function() {})

  it("should not be disabled while validating if the given prop is false", function() {})
})
