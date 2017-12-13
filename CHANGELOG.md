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
