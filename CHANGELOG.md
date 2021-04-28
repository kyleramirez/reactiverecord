### 0.8.6
Bump React version
### 0.8.5
Validated components will not run validations when the `disabled` prop is `true`. This is to avoid showing errors near a form field where the user is unable to make a correction.
### 0.8.4
- Fixed a bug that would re-order collections returned from a request based on their primary key if the primary key was numerical.
### 0.8.3
- **Validation Triggers**<br>Each validation now accepts an `on:` option to control when specific validations occur. This is useful in cases where a specific validation is better to occur when the user is finished typing, rather than as they type. For example, a format validator that validates a ZIP code is in the correct format will validate as the user types, showing an error message before they have completed typing the ZIP code. By adding `on: 'BLUR'` to the validation, the format validator will only check on the BLUR event.
  The three validation `on:` options are:
   - `CHANGE`
   - `BLUR`
   - `VALIDATE`

   By using the `on:` option, the validation will only occur when a form field triggers the `onChange` or `onBlur` event, or if the form is being validated as a whole (`VALIDATE`), i.e. before form submission.
   ```js
   <Input
     {...fields.zip_code}
     validators={{
      format: [
        /* Only validates on blur */
        { with: /\d{5}/, message: 'A ZIP code must have 5 digits.', on: 'BLUR' },
      ],
      /* Validates on all events */
      length: [{ maximum: 10, messages: { maximum: 'A ZIP code must be no more than 10 characters.' } }]
    }}
   />
   ```
   The validation trigger may also be an array to support multiple triggers.
   ```js
   format: [
     { with: /\d{5}/, message: 'A ZIP code must have 5 digits.', on: ['BLUR', 'VALIDATE'] },
   ]
   ```
   If the validation is to occur for all events, no `on:` option is necessary. For the event type, e.g. `'BLUR'`, the case does not matter.
### 0.8.2
- Updates package homepage to https://reactiverecord.com
### 0.8.1
- Length validator now has ability to check length of Arrays
## 0.8.0
- Improved performance of `validated` HOC. Updates are only triggered if absolutely needed.
- All new `<Validate />` component is an alternative to the `validated` HOC. It accepts a function as children, which is passed input props, error text and validating as arguments. This will make composing custom inputs easier. The third argument, validating, will only be true if async validations are occurring.
  ```js
  <Validate {...propsFromFormFieldObject}>
    {(props, errorText, validating) => (
      <Fragment>
        <input disabled={validating} {...props} />
        {errorText}
      </Fragment>
    )}
  </Validate>
  ```
- Form now exposes a `submit` method, which submits the data. The `handleSubmit` API is no longer recommended.
- Warning: **BREAKING CHANGES**
   - `Validators.local` has been changed to `Validators.sync`
   - `Validators.remote` has been changed to `Validators.async`
### 0.7.8
Form no longer throws errors
### 0.7.7
Transforms classes for non-ES6 environment
### 0.7.6
- This package as a whole is no longer an ES6 package for better compatibility
- No longer using `componentWillReceiveProps`
- Updates react-redux version (5.1.2 recommended)
- Small refactors
### 0.7.5
Bug fix: Form field should not generate fields for `_primaryKey` or `_timestamps`
### 0.7.4
Bug fix: Fixes `window.postMessage` cloning, JSON parsing errors
### 0.7.3
Bug fix: `_timestamps` attribute was visible in serialized model attributes.
### 0.7.2
Bug fix
### 0.7.1
Query string parsing now supports arrays via the `key[]=value` format.
## 0.7.0
Inflections updates
- Specify label text in schema descriptors. An attribute called `address1` can have a different default label than "Address1."

      OrderAddress { static schema = { address1: { type: String, labelText: "Address" } } }
- The `labelText` is also used to build validation error messages if the `%{attribute}` must be interpolated.
- Generated routes can have a custom inflection defined in `Model.routeInflection`. A model called `PostTag` would be interpolated as `/post-tags`, unless defined this way:

      PostTag { static routeInflection = 'tags' }
- Generated nested attributes can have a custom parameter name defined as `Model.attributesName`. A model called `Building` when used as a nested attribute will automatically be in a parameter called `building_attributes` if in a has-many association. This can be overridden to just `building` this way:

      Building { static attributesName = 'building' }
### 0.6.4
Bug fix
### 0.6.3
Prop updates
- `Member` prop `find` now accepts a Function, which will be used to find the correct resource in the store
- `Member` and `Collection` prop `then` and `catch` are now called before the next render
- Fixed a bug that would incorrectly handle errors in API response
### 0.6.2
Bug fix
### 0.6.1
Bug fix
## 0.6.0
Performance updates
- Fixed issue that hid some uncaught errors
- Improved efficiency of renders from `Member` and `Collection`
- No longer restricting `Member` or `Collection` with `React.Children.only`
- No longer requiring primary key (ID) for `Member`
   - This will make building search-style components easier
- Fixed query-parsing bug for encoded strings
## 0.5.0
Removes dependencies
- Babel removed
- Fetch removed (now relying on XMLHttpRequest)
- `credentials` removed from API config
### 0.4.8
Type accuracy enhancements
- Improved query string parsing for arrays
- Allow Boolean type fields to be set to null
### 0.4.7
Fixes bug with numericality validator
### 0.4.6
Bug fix
### 0.4.5
Bug fix
### 0.4.4
Bug fix, codebase improvements, updated `where` to accept array of values, updated query string generation
### 0.4.3
Added Promise functionality to handleSubmit method
### 0.4.2
Better handling of form submission if not connected to `store`
### 0.4.1
Add optional query prop for `<Form />`
### 0.4.0
Only apply confirmation validation if the confirmation field is part of the form object.
### 0.3.9
Allow non-model parameters in `where` clause for `<Collection />` and `<Member />` components
### 0.3.8
Fixed a bug on the form that would not show submitting if a resource was not connected to the store.
### 0.3.7
Fixed a bug that would continuously make API requests if props changed.
### 0.3.6
Added the ability to re-run request if relevant props have changed for `Collection` and `Member`
### 0.3.5
Fixed a bug that would delete attributes after calling `Model.prototype.routeFor`
### 0.3.4
Bug fix on `Model.prototype.reload`
### 0.3.3
Another bug fix on form
### 0.3.2
Bug fix on form
### 0.3.1
Fixed a bug that would submit empty nested attributes in a form
## 0.3.0
Added diffing to fieldsFor in Form component. Nested attributes are no longer submitted if empty.
### 0.2.9
Fixed a bug that would remove the existing primaryKey on an error
### 0.2.8
Handle 204 No Content responses properly
### 0.2.7
Removed empty fieldsets from Form
### 0.2.6
Fixed a bug in Form component
### 0.2.5
Added extra argument "key" to "fieldsFor" function in form object returned by
Form component to avoid orphaned nested attributes. Other bug fixes.
### 0.2.4
Added "fetch" prop to Member and Collection, defaults to true
### 0.2.3
Added query to Member component by way of "where" prop
### 0.2.2
Bug fixes
### 0.2.1
Bug fixes, linting.
## 0.2.0
Added `validated` higher order component, which takes validations defined in
the model. Still a huge need for documentation and testing.
## 0.1.0
Major release with fully completed API. Needs more testing, full documentation.
