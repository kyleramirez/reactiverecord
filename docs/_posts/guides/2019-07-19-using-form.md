---
layout: page
title: Using Form
date: 2019-07-19 12:13:00 -0500
category: Guides
nav_order: 4
---
# Using Form
{: .no_toc }

Almost every web application implements the **C.R.U.D.** model. So far, we've gone over [several ways]({% post_url guides/2019-07-17-using-member-and-collection %}) to **R**ead data from your API using powerful declarative React components. The ability to **C**reate and **U**pdate data is the purpose of the `<Form />` component.

The `<Form />` component provides a way to ... 

- Use `Model` schemas to keep track of form fields
- Use `Model` routes to avoid hard-coding API routes
- Perform client-side form validations and populate error messages
- Create or update data in your JSON API
- Hook into form callbacks that give you granular control over data

...all while skipping a ton of boilerplate!

#### Contents
{: .no_toc .mt-6 }
1. TOC
{:toc}

## Basic Example
If you can read JSX, you can learn a lot about how the `<Form />` component operates by viewing how it's used. Here's a basic example of the `<Form />` component in a typical sign-up form.
```jsx
import ReactiveRecord, { Form } from "reactiverecord"
const User = ReactiveRecord.model("User")
...
return (
  <Form for={new User()}>
    {fields => (
      <Fragment>
        <Input {...fields.full_name} />
        <Input {...fields.email} />
        <Input {...fields.password} />
        <Button {...fields.submit}>Sign Up</Button>
      </Fragment>
    )}
  </Form>
)
```
<table>
  <thead>
    <tr>
      <th style="text-align: left">Generated</th>
      <th style="text-align: left"><samp>onSubmit()</samp></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
<div class="language-html highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nt">&lt;form&gt;</span>
  <span class="nt">&lt;label&gt;</span>
    Full Name <span class="nt">&lt;input</span> <span class="nt">/&gt;</span>
  <span class="nt">&lt;/label&gt;</span>
  <span class="nt">&lt;label&gt;</span>
    Email <span class="nt">&lt;input</span> <span class="nt">/&gt;</span>
  <span class="nt">&lt;/label&gt;</span>
  <span class="nt">&lt;label&gt;</span>
    Password <span class="nt">&lt;input</span> <span class="nt">/&gt;</span>
  <span class="nt">&lt;/label&gt;</span>
  <span class="nt">&lt;button&gt;</span>Sign Up<span class="nt">&lt;/button&gt;</span>
<span class="nt">&lt;/form&gt;</span>
</code></pre></div></div>
      </td>
      <td style="vertical-align: top;">
        <span class="label">POST</span> <code>/users</code> 201 Created<br><br>
<div class="language-json highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="p">{</span><span class="w">
  </span><span class="s2">"full_name"</span><span class="p">:</span><span class="w"> </span><span class="s2">"General Tzo"</span><span class="p">,</span><span class="w">
  </span><span class="s2">"email"</span><span class="p">:</span><span class="w"> </span><span class="s2">"general@tzo.com"</span><span class="p">,</span><span class="w">
  </span><span class="s2">"password"</span><span class="p">:</span><span class="w"> </span><span class="s2">"chickens-23"</span><span class="w">
</span><span class="p">}</span><span class="w">
</span></code></pre></div></div>
      </td>
    </tr>
  </tbody>
</table>

Amazing! Let's talk about what's written here.
1. By passing in a `new User()` instance as the `for` prop, we're telling the `<Form />` component to expect fields based on the `User` model's schema.
1. Because it's a `new` user, it's assumed the resource doesn't exist, which means the appropriate form method is `POST`.
1. We know the route configuration from the model class, so the form action will be `/users`.
1. Like other Reactive Record components, the `<Form />` component expects a function as its child. The function received a form object, which contains properties that help build the individual form fields. We can pass those properties directly to our `<Input />` components, which we'll go over in detail later.

## Available Props

| Prop | Type | Description | Required |
|:-----|:-----|:------------|:---------|
| <samp>children</samp> | Function | Function receives one argument: a Reactive Record form object. It contains properties named after the given model's schema, and is used to manage form controls within the form. You can read more about what's available in the form object [below](#the-form-object). | Yes |
| <samp>for</samp> | Model instance | Pass in the resource being acted upon. This resource must be an instance of a class which inherits from <code>Model</code>. Example: <code>new&nbsp;User()</code>. | Yes |
| <samp>beforeValidation</samp> | Promise | Called before form validation occurs after form is submitted. The given <samp>Promise</samp> receives the form's internal <code>fields</code> object, which contains refs to mounted form controls. At this point in the form submission, no data validation has occurred. You can use this callback as an opportunity to edit form values before validation occurs. The given <samp>Promise</samp> must be resolved in order to continue form submission. | No |
| <samp>afterValidationFail</samp> | Function | Called after all validation has occurred, but at least one field has failed validation after form submission. The given function receives an object containing all field values. | No |
| <samp>beforeSave</samp> | Promise | Called after form validation succeeds and the form is ready for final submission. The given <samp>Promise</samp> receives an object containing all field values which will be submitted. You can use this callback as an opportunity to cancel form submission and do something else with the form data, or to edit fields just before an API request is made. The given <samp>Promise</samp> must be resolved <strong>with the original or mutated form values object</strong> in order to continue form submission. | No |
| <samp>afterSave</samp> | Function | Called after an API request succeeds with a successful HTTP status code (greater than 199 and less than 400). The function receives the latest version of the resource being acted upon. This callback is called immediately before the next action is dispatched, thereby triggering a re-render. | No |
| <samp>afterRollback</samp> | Function | Called after an API request fails due to an HTTP status code (greater than or equal to 400), or an error that occurred while processing the response. The given function receives a resource when available or the resulting error. This callback is called immediately before the next action is dispatched, thereby triggering a re-render. | No |
| <samp>builder</samp> | Function | Used to build field props for custom form controls. Read more about the builder API in the next guide. | No |
| <samp>query</samp> | Object&#124;String | Used to add extra parameters not in the model's schema to the request body. The query can either be an object, which will be serialized, or a query string.<br>Examples:<br>`{ utm_source: 'google', utm_medium: 'cpc' }`<br><br>`utm_source=google&utm_medium=cpc` | No |
| <samp>*</samp> | any | Any props given that are not listed above will be passed directly to the inner <samp>&lt;form&gt;</samp> DOM element, except <samp>onSubmit()</samp>, which is ignored. Example: <samp>className</samp>, <samp>aria-&#42;</samp>. | No |

## The Form Object
The function passed in as children for the `<Form />` component receives an object containing properties used to build form controls within the form. The properties map directly to the form resource's schema. For instance, if the schema for a model called `Session` is:

```javascript
Session.schema = {
  username: String,
  password: String
}
```
... the resulting form object would contain:
```javascript
{
  username: {…},
  password: {…},
  submit: {…},
  submitting: false,
  validating: false,
  fieldsFor: ƒ()
}
```
There are additional properties in the above object that are not in the schema, which we will go over shortly. Let's start with the first property, `username`. It contains individual **field props**.

### Field Props
The `<Form />` component builds field props for each attribute in the schema. These field props can be passed directly to form controls to render the correct data. Here is a list of the default field props given for each schema attribute:

| Attribute | Value |
|:----------|:------|
| <samp>ref</samp> | Function needed to track the form control element. Pass directly to the form control. |
| <samp>labelText</samp> | Text describing the form control. By default, this is the humanized name of the attribute. An attribute called `email` will by default have the label text "Email." It can be overridden by [configuring the model schema]({% post_url guides/2019-07-16-using-models %}#schema-attribute-configuration). |
| <samp>defaultValue</samp> | Contains the default value for the attribute. If the resource is existing, expect the existing value to be present. Otherwise, the default value will be `null` or the default value set in the model schema. |
| <samp>errorText</samp> | Contains the specific error text related to the form control, either from client-side validations or an API response. |
| <samp>validators</samp> | If the attribute has validators, they will be present here. |

### Submit Props
The form object contains a `submit` property, which can be passed directly to a `<button>` element, which submits the form. It contains the following attributes:

| Attribute | Value |
|:----------|:------|
| <samp>disabled</samp> | True only while the form is submitting or validating to prevent consecutive form submissions or "rage clicking." |
| <samp>children</samp> | The value is "Saving" while the form is submitting, and is otherwise `undefined`. Use this to easily override the button children while an API request is made. |

### Other Form Object Properties

| Attribute | Value |
|:----------|:------|
| <samp>submitting</samp> | True only while an API request is made. |
| <samp>validating</samp> | True only while field validations are occurring. |
| <samp>fieldsFor</samp> | Function used to create fields for nested attributes. Learn more about using `fieldsFor` later. |

<!-- ## Creating Resources

## Updating Resources

## Error Handling

## Form Events

## Summary

<div class="text-center mt-7">
  <a class="btn" href="">
    Create form controls
  </a>
</div> -->
