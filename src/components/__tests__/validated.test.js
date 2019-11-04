import React, { forwardRef } from "react"
import { render, fireEvent } from "@testing-library/react"
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
// })
test("error text", () => {
  const { container } = render(<ValidatedInput labelText="Name" errorText="Invalid name!" />)
  const input = container.querySelector("input")
  fireEvent.change(input, { target: { value: "Duude" } })
  console.log(input.value)
  // expect(container).toMatchSnapshot()
})
// const setup = () => {
//   const utils = render(<CostInput />)
//   const input = utils.getByLabelText('cost-input')
//   return {
//     input,
//     ...utils,
//   }
// }

// test('It should keep a $ in front of the input', () => {
//   const { input } = setup()
//   fireEvent.change(input, { target: { value: '23' } })
//   expect(input.value).toBe('$23')
// })

// test('loads and displays greeting', async () => {
//   const url = '/greeting'
//   const { getByText, getByRole } = render(<Fetch url={url} />)

//   axiosMock.get.mockResolvedValueOnce({
//     data: { greeting: 'hello there' },
//   })

//   fireEvent.click(getByText('Load Greeting'))

//   const greetingTextNode = await waitForElement(() => getByRole('heading'))

//   expect(axiosMock.get).toHaveBeenCalledTimes(1)
//   expect(axiosMock.get).toHaveBeenCalledWith(url)
//   expect(getByRole('heading')).toHaveTextContent('hello there')
//   expect(getByRole('button')).toHaveAttribute('disabled')
// })
