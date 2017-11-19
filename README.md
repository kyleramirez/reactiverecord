# Reactive Record — Declarative models in React

## What does it do?
All on its own, Reactive Record is a front-end-only Object Data-store Mapping (ODM) implementation that lets you interact with RESTful APIs. By defining models on the front end and integrating closely with the popular state container, Redux, Reactive Record offers a Ruby-on-Rails-esque, Active Record-ey syntax. Think Active Record for JavaScript. Reactive Record is agnostic to back-end architecture. It's built for APIs which respond to GET/POST/POST/DELETE requests for resources identified by predefined keys, so Rails, Express, Sinatra, CouchDB UNAMEIT! Reactive Record allows you to write syntax like this:

    const userAddress = new Address()

    userAddress.address1 = "1100 Congress Ave"
    userAddress.city = "Austin"
    userAddress.state = "TX"

    userAddress.save()
    /* 
      REQUEST:
        Method: POST 
        URL: /api/addresses
        Data: {
          "address1": "1100 Congress Ave",
          "city": "Austin",
          "state": "TX"
        }
      RESPONSE:
        Status: 201 Created
        Body: {
          "_id": "583132c8edc3b79a853b8d69",
          "createdAt": "2016-11-20T05:21:12.988Z",
          "updatedAt": "2016-11-20T05:21:12.988Z",
          "userId": "580432279153ea2679095acd",
          "address1": "1100 Congress Ave",
          "city": "Austin",
          "state": "TX"
        }
    */
    userAddress.id
    // Returns 583132c8edc3b79a853b8d69
    userAddress.destroy()
    // Does what you would expect (A DELETE request to the same resource)

## What does it look like?
Reactive Record comes with 3 extremely helpful React components, and one higher order component, which allow you to create, read, update and delete API resources. Those components are `Member`, `Collection`, `Form` and `validated`.

    import ReactiveRecord, { Member, Collection } from "reactiverecord"
    const Post = ReactiveRecord.model("Post")

    function Posts() {
      return (
        <Collection for={Post} where={status: "published"}>
          { posts => (
            <div className="post-excerpts">
              {posts.map( post => <PostExcerpt resource={post} /> )}
            </div>
          )}
        </Collection>
      )
    }

    function FullArticle({ params:{ id } }) {
      return (
        <Member for={Post} find={parseInt(id)}>
          { post => (
            <div className="the-content">
              <h1>{post.title}</h1>
              <small>Published: {post.createdAt}</small>
              <div>{post.content}</div>
            </div>
          )}
        </Member>
      )
    }

Using this pattern, you get an API request to `/posts?status=published`, or `/posts/:id`, and inside the *function as children* component, you'll receive exactly those API resources, but as `#<Post>` Reactive Record model instances. So you can do `post.title` and `post.updateAttributes({ status: "unpublished" })`. If you're used to Redux reducers, you're done writing them for your data. You're done writing `mapStateToProps`, writing `mapDispatchToProps` and that sort of thing. You can stop writing boileplate functions and know this is an extremely optimized way of organizing your data.


### Installation
    npm install --save reactiverecord

### Prerequisites
This library was made to solve problems in our project stack at Rentalutions (insert buzz words: React/Redux/Webpack/ES6). The only real assumptions are:

 - You use Redux (a single store) to manage your state
 - You use React, and React Redux
 - Your JavaScript build can transpile ES6 to current JavaScript.

If you're coming from a Ruby-on-Rails background, this library is for you. It's somewhat opinionated, and borrows a lot of the same method names from Active Record. It borrows schema definitions from the Mongoose, for those of you who have worked with MongoDB.

# Minimum Setup

### Defining Models
    /* In a file like /models/Story.js */
    import ReactiveRecord, { Model } from "reactiverecord"
    class Story extends Model {
      static schema = {
        title: String,
        body: String,
        status: {
          default: "published",
          tyle: String
        },
        userId: String,
        _timestamps: true
      }
    }
    export default ReactiveRecord.model("Story", Story);

### In your reducers setup

    // In a file like /reducers.js
    import { combineReducers } from "redux"
    import ReactiveRecord, { reducer } from "reactiverecord"
    ReactiveRecord.setAPI({ prefix: "/api" }) /* optional */
    import "models"
    export default combineReducers({
      models: ReactiveRecord::reducer() /* call it models or anything */
      ...yourOtherReducers
    })

### In your store setup

    // In a file like /store.js
    import { createStore, applyMiddleware, compose } from "redux"
    import reducer from "./reducers"
    import ReactiveRecord, { middleware } from "reactiverecord"
    export default createStore(
      reducer,
      compose(
        applyMiddleware(
          ReactiveRecord::middleware(),
          ...yourOtherMiddlewares
        )
      )
    );

### In your app
    import ReactiveRecord from "reactiverecord";
    const Story = ReactiveRecord.model("Story"),

    const newStory = new Story;
    newStory.save().then(savedRecord=>(this.setState({ ...savedRecord }));
    // Also works ...
    Story.create({ title: "A working title", body: "Once upon a time..."})  // Makes an API request
      .then(savedRecord=>(this.setState({ ...savedRecord }));  // Returns a promise ... as do the following methods
    newStory.updateAttribute("title", "A working title") // Makes an API request
    newStory.updateAttributes({ title: "A working title", body: "Once upon a time..."})  // Makes an API request

    newStory.destroy() // Makes an API request

    Story.all() // Makes an API request to the model's index, returns array of records
    Story.find("583132c8edc3b79a853b8d69") // Makes an API request to this resource, returns single record

    // Passing extra URL query parameters
    Story.all({month:"05", year:2017}) // Makes an API request to /stories?month=05&year=2017
    Story.all("?month=05&year=2017") // Also works
    Story.find("first-post", { include_comments: true }) // Makes an API request to /stories/first-post?include_comments=true
    Story.find("first-post", "?include_comments=true") // Also works
    // Use cases for extra query params
    Search.load({q: "Am I being detained?"}) // Generates /search?q=Am%20I%20being%20detained%3F

# API

#### Why isn't there a `v1.0` yet?
Once we fully document this API, we'll release version 1.

## ReactiveRecord
Reactive Record's default export is a new instance (`new ReactiveRecord()`). It's also available as a named export `ReactiveRecord`, though it's much easier to just use the default export.

#### `ReactiveRecord.prototype.model()`
Define and retrieve `Models` with this method. A model must be registered with `ReactiveRecord` in order to access it later.

    /* Save a User model */
    class User extends Model {}
    ReactiveRecord.model("User", User)

    /* Retrieve the User model */
    const User = ReactiveRecord.model("User")

#### `ReactiveRecord.prototype.setAPI()`
Reactive Record uses `fetch` as its remote backend. You can register these settings:

- `prefix` (default: `""`) You are able to set a prefix for all API requests. At Rentalutions, we use `/api/v2/landlords` or `/api/v2/tenants` as our prefix. So depending on what kind of user you are, your lease index will make a request to `/api/v2/tenants/leases`
- `delimiter`(default: `"-"`) The difference between `bank_accounts` and `bank-accounts` in your URLs. If you have a mix of the two, you can use the default delimiter (kebob case), and manually write snake case URLs in your model definitions.
- `headers` (default: `{ "Accept": "application/json", "Content-Type": "application/json" }`). Pass in the new headers you'd like to send with every request.
- `credentials` (default: `same-origin`) Specific to `fetch`, this will include your cookie with the request (necessary for authentication in most cases).
- `patchMode` (default: `true`) This assumes you'd like to only send the changed fields in your update (`PUT`) requests to a resource. If you only changed a user's first name, no need to send the entire record. Turning this off will send the entire record every time regardless of changes.

### Model
#### `Model.store`
#### `Model.schema`
#### `Model.create`
#### `Model.destroy`
#### `Model.find`
#### `Model.all`
#### `Model.load`
#### `Model.prototype.diff`
#### `Model.prototype.changedAttributes`
#### `Model.prototype.isPristine`
#### `Model.prototype.isDirty`
#### `Model.prototype.attributeChanged`
#### `Model.prototype.routeFor`
#### `Model.prototype.routeAttributes`
#### `Model.prototype.updateAttributes`
#### `Model.prototype.updateAttribute`
#### `Model.prototype.save`
#### `Model.prototype.destroy`
#### `Model.prototype.reload`
#### `Model.prototype.ReactiveRecord`
#### `Model.prototype.serialize`

### reducer
### middleware

## Reactive Record Components

### `<Member />`
### `<Collection />`
### `<Form />`
### `combineFormBuilders()`
### `validated(WrappedComponent)`
### `Validator`
### `Sugar`
