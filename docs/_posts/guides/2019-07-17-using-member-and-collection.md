---
layout: page
title: Using Member and Collection
date:   2019-07-17 00:19:00 -0500
category: Guides
nav_order: 3
---
# Using Member and Collection
{: .no_toc }

In previous guides, we've gone over [how to bootstrap Reactive Record]({% post_url guides/2019-07-14-getting-started %}) in your React application, and [how to create models]({% post_url guides/2019-07-16-using-models %}) and use them to manipulate resources from a JSON API using a simple query interface.

In this guide, we're going to begin using two powerful React components included with Reactive Record that greatly simplify the retrieval of resources from an API. Those components are:

- `<Member />`
- `<Collection />`

These components are React implementations of the same query interface in the [previous guide]({% post_url guides/2019-07-16-using-models %}#making-api-requests), but they're going to save you a TON of boilerplate, and let you spend your time focusing on your core logic.

#### Contents
{: .no_toc .mt-6 }
1. TOC
{:toc}

<div class="bg-grey-lt-000 p-4">
  <strong class="text-mono text-grey-dk-000">/**</strong>
  <blockquote class="mt-0 mb-0">
    <h2>What we call "boilerplate"</h2>
    <p>
      Much of what led to the creation of Reactive Record was frustration surrounding the amount of code required to simply get API resources on the page. There's no shortage of ways to do this out there in the wild. If you read about flux, you probably came across Redux, and your first API request might have looked something like this **inhales deeply**:
    </p>
    <ol>
      <li>Your component mounted, calling <code class="text-red-000">componentDidMount()</code> on your React Component, which called <code class="text-red-000">this.props.LOAD_COMMENTS()</code></li>
      <li><code class="text-red-000">LOAD_COMMENTS()</code> was a function you wrote and passed in as the <code class="text-red-000">mapDispatchToProps</code> argument for the <code class="text-red-000">connect()</code> function. It dispatches an action for which your Redux middleware and reducer are listening, and triggers an asynchronous API request.</li>
      <li>When the request succeeded, you dispatched a <code class="text-red-000">COMMENTS_LOADED</code> action, which stored the comments in state.</li>
      <li>The state change was passed to a <code class="text-red-000">mapStateToProps</code> function, which provided your component with a prop you named <code class="text-red-000">comments</code>.</li>
      <li>The comments are rendered.</li>
      <li>Repeat for every type of resource you render.</li>
    </ol>
    <p>
      This pattern is reliable, and well-documented on the Redux website and in countless tutorials online. But it can quickly make a bloated mess of your application when you're really trying to get stuff done. This is the exact boilerplate that Reactive Record can remove.
    </p>
  </blockquote>
  <strong class="text-mono text-grey-dk-000">*/</strong>
</div>

## What are members and collections?
Member and collection are terms borrowed from Ruby on Rails, which indicate the number of resources being requested. The simplest way to see the difference is in the final route that is generated from using either.

| Component | Route | Description |
|:----------|:------|:------------|
| <samp>Member</samp> | <samp>/products/123</samp> | Requests an individual resource |
| <samp>Collection</samp> | <samp>/products</samp> | Requests a list of resources |

Members are single members of collections. So if you use the `<Member />` component, expect for only a single resource to be returned.

If you use the `<Collection />` component, expect a collection of results to be returned.

## Using <samp>&lt;Collection /&gt;</samp>
The `<Collection />` component can request a collection of resources from an API endpoint, using props to control what is requested or returned.

##### Basic example
```jsx
import ReactiveRecord, { Collection } from "reactiverecord"
const Product = ReactiveRecord.model("Product")
...
return (
  <Collection for={Product}>
    {products => (
      <ul>
        {products.map(product => (
          <li key={product.id}>{product.title}</li>
        ))}
      </ul>
    )}
  </Collection>
)
```
> &#9495; <span class="label">GET</span> `/products` 200 OK

Let's go over what's happening here. Rendering a `Collection` for `Product` makes a GET request to the `/products` endpoint when the component mounts. The `<Collection />` expects a function as its children. Once the API request succeeds, another render is triggered, which contains an array of products, each an instance of the `Product` model. Very cool!

##### Available props for <samp>&lt;Collection /&gt;</samp>

| Prop | Type | Description | Required |
|:-----|:-----|:------------|:---------|
| <samp>children</samp> | Function | Function receives one argument: a Reactive Record `<Collection[]>`, which is normal `<Array[]>` with some extra properties. The `<Collection[]>` contains instances of the model passed in as the `for` prop when available. | Yes |
| <samp>for</samp> | Model | Must be a `class` that inherits from a Reactive Record `Model`. | Yes |
| <samp>fetch</samp> | Boolean | Indicates whether to perform an API request upon mount or prop changes. Defaults to `true`. | No |
| <samp>where</samp> | Object | Used to filter requests and results. If `{ published: true }` is passed in, the final URL would have the query string `?published=true`. If `published` is in the model schema, resources returned would also need to have `published: true` in order to be returned. | No |
| <samp>select</samp> | Function | Used to filter results only. When present, resources in the response are filtered by this function. This function receives one argument: a Reactive Record model instance. Example: `select={resource => resource.published}` | No |
| <samp>then</samp> | Function | When present, is chained to the end of the request Promise. This function will be called immediately before results from a successful response are rendered. Example: `then={() => this.setState({ loaded: true })}` | No |
| <samp>catch</samp> | Function | When present, is chained to the end of the request Promise. This function will be called immediately before results from a error response are rendered, or if any type of error occurs processing the request or response. Example: `catch={() => this.setState({ hasError: true })}` | No |

## Using <samp>&lt;Member /&gt;</samp>
The `<Member />` component can request a single resource from an API endpoint. Usually, this resource has a unique identifier, but that may not always be required. For instance, a shopping cart available at `/api/cart`.

##### Basic example
```jsx
import ReactiveRecord, { Member } from "reactiverecord"
const Product = ReactiveRecord.model("Product")
...
return (
  <Member for={Product} find={123}>
    {product => (
      <div>
        {product._request.status === 200 ? product.title : "Loading ..."}
      </div>
    )}
  </Member>
)
```
> &#9495; <span class="label">GET</span> `/products/123` 200 OK

The `<Member />` component behaves very similarly to `<Collection />`. By passing in the `find` prop, we've asked Reactive Record to retrieve a single resource. We're also conditionally showing the product title based on whether the resource is loaded. We'll go over more techniques for determining successful responses later.

##### Available props for <samp>&lt;Collection /&gt;</samp>

| Prop | Type | Description | Required |
|:-----|:-----|:------------|:---------|
| <samp>children</samp> | Function | Function receives one argument: a Reactive Record model instance. While the request is still processing, a resource is still passed in to this function, however all its properties other than its identifier are `null`, because the resource isn't yet available. The resource will be an instance of the model passed in as the `for` prop. | Yes |
| <samp>for</samp> | Model | Must be a `class` that inherits from a Reactive Record `Model`. | Yes |
| <samp>fetch</samp> | Boolean | Indicates whether to perform an API request upon mount or prop changes. Defaults to `true`. | No |
| <samp>find</samp> | Number OR String OR Function | When a primitive value is given, is used to identify the requested and returned resource. When a function is given, is used to find the resource in the local store. | No |
| <samp>where</samp> | Object | Used to filter the request only. If `{ published: true }` is passed in, the final URL would have the query string `?published=true`. Another use case is when the URL requires more than one ID. If the route for the member is `/api/companies/:company_id/employees/:id`, you would use `{ company_id: 123 }` here to help construct the route. | No |
| <samp>then</samp> | Function | When present, is chained to the end of the request Promise. This function will be called immediately before results from a successful response are rendered. Example: `then={() => this.setState({ loaded: true })}` | No |
| <samp>catch</samp> | Function | When present, is chained to the end of the request Promise. This function will be called immediately before results from a error response are rendered, or if any type of error occurs processing the request or response. Example: `catch={() => this.setState({ hasError: true })}` | No |

## Component Organization
Following the [suggested file layout]({% post_url guides/2019-07-14-getting-started %}#suggested-file-layout), you should try to keep your components which use the `<Member />` and `<Collection />` components in the `/containers` directory only. This is a suggestion to help you separate concerns in your React application. Only route-based components should be making API requests. Components in the `/resources` directory should be concerned with rendering resources only. This helps make components in the `/resources` directory more portable, able to be used in different contexts, such as in tests or in other builds where the default `XMLHttpRequest` used in Reactive Record may not be available, such as when rendering components on the server. Components in `/resources` should have a guarantee that the resource prop they receive is already loaded, whereas components in the `/containers` directory are responsible for loading the resources. Thus, the components in the `/containers` directory serve a similar purpose to a controller in a model-view-controller framework.

Consider the following flow:
1. A user navigates to the `/cart` page in the browser.
1. The React application renders `/containers/cart.js`, which contains:

   **<small>/containers/cart.js</small>**
   {: .m-0 .text-mono .text-grey-dk-000 }
   ```jsx
   import ReactiveRecord, { Member } from "reactiverecord"
   import Cart from "resources/carts/Cart"
   ...
   return (
     <Member for={ReactiveRecord.model("Cart")}>
       {cart => (
         <div>
          {cart._request.status === 200 ? <Cart cart={cart} /> : "Loading..."}
         </div>
       )}
     </Member>
   )
   ```
1. The component at the route for `/cart` is responsible for making the API request to `/api/carts`. While the request is loading, it renders "Loading..." instead of rendering the `<Cart />` component.
1. The component in `/resources/carts/Cart.js` accepts one prop, a `#<Cart>`. No logic should exist in this component to check if the cart is loaded in the browser environment. It should be guaranteed that by the time this component is rendered, a `#<Cart>` exists and is ready to be rendered.

## Summary
We've gone over the basic usage of `<Member />` and `<Collection />`. These components should save you a ton of boilerplate code used to retrieve records from an API endpoint. Gone are the days of writing repetitive actions, dispatchers, reducers and `mapStateToProps` functions. But we're missing a key aspect of a basic CRUD application: the ability to create and update resources. Our next step is to use the included `<Form />` component to do this in readable, composable JSX!

<div class="text-center mt-7">
  <a class="btn" href="{% post_url guides/2019-07-19-using-form %}">
    Use the Form component
  </a>
</div>
