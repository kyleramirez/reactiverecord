---
layout: page
title: Creating Models
date:   2019-07-16 00:19:00 -0400
category: Guides
nav_order: 2
---
# Creating Models
{: .no_toc }
Reactive Record interacts with JSON APIs using predefined models and schemas, which represent resources in your application, and usually maps to records in your application's database. It's similar to the purpose of creating models in a model-view-controller framework.

In this guide, we'll cover creating your first model with a schema, and making an API request.

#### Contents
{: .no_toc .mt-6 }
1. TOC
{:toc}

## A short note about resources

A model called `Comment` will map to a `/comments` API endpoint, which maps to a database table called `comments`.<br><br>A model called `Session` will map to a `/sessions` API endpoint. Even though you may not have a `sessions` database table, a session can still be thought of as a resource that is created or destroyed in your application, for instance, when a user logs in:

```javascript
  Session.create({ username: "generaltzo", password: "chickens-23" })
```
> &#9495; <span class="label">POST</span> `/sessions` 201 Created

or logs out:

```javascript
Session.destroy()
```
> &#9495; <span class="label">DELETE</span> `/sessions` 204 No Content

Reactive Record can interact with the data as long as the resource is manipulated via a RESTful interface.

## Your first model
For organization, you should keep each of your models together. Following the [suggested file layout]({% post_url guides/2019-07-14-getting-started %}#suggested-file-layout), place your models in a top-level `/models` folder. Each file should contain only one model, and should be the singular name of the model itself.

For your first model, we will be creating a `Comment` model.

**<small>/models/Comment.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```js
import ReactiveRecord, { Model } from "reactiverecord"
class Comment extends Model {}
export default ReactiveRecord.model("Comment", Comment)
```

## Add schema attributes
All we've done here is defined a single `Comment` model with no attributes. We need to define a `schema`. A `schema` describes each of the attributes on a model instance. The `schema` attributes are very much like descriptors for database columns.

**<small>/models/Comment.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```js
import ReactiveRecord, { Model } from "reactiverecord"
class Comment extends Model {
  static schema = {
    body: String,
    email: String,
    name: String,
    postId: Number,
    _timestamps: true
  }
}
export default ReactiveRecord.model("Comment", Comment)
```

### About Timestamps
Each of the schema attributes here are pretty self-explanatory, except `_timestamps`. By writing `_timestamps: true`, we're telling Reactive Record to look for either `created_at` and `updated_at` attributes, or `createdAt` and `updatedAt` attributes in the JSON. This is to simplify the differences between default timestamp naming conventions from Rails or MongoDB. Whether your timestamp attributes are camel cased or snake cased, they will be accessible via `model.createdAt` and `model.updatedAt`.

### About the ID
You'll notice we did NOT define an `id` or `_id` attribute. This is the only implicit attribute in Reactive Record. There's no need to define an `id` attribute in your model schema, because unless configured otherwise, it will be assumed that every model has an `id` or `_id` attribute acting as its primary key. You'll learn more about configuring models to your exact specifications later.

We've now defined a few attributes along with their types. The next step is importing your model in the correct location.

## Importing your model
The location to import your models for your application is just before the ReactiveRecord reducer is built. We'll import them to the top-level `reducer.js` file we created in the [Getting Started guide]({% post_url guides/2019-07-14-getting-started %}#step-1-edit-your-reducer).

**<small>reducer.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```js
import ReactiveRecord, { reducer } from "reactiverecord"
import "models/Comment"
/* import more models here before the call to the reducer function */
export default reducer.call(ReactiveRecord)
```

From now on, your `Comment` model can be retrieved by making a call to ReactiveRecord directly. Avoid re-importing the `/models/Comment.js` file more than once in your application.

```js
const Comment = ReactiveRecord.model("Comment")
```

We have enough now to begin interacting with a JSON API!

## Model basics
{: .text-alpha }

Now that you have a `Comment` model defined, it's time to start interacting with it. That is, creating instances, making API requests, and persisting data. Let's start by creating an instance of `Comment`.

<div class="bg-grey-lt-000 p-4">
  <strong class="text-mono text-grey-dk-000">/**</strong>
  <blockquote class="mt-0 mb-0">
  For clarity, model instances in this documentation are represented like <samp class="text-blue-000">#&lt;Comment&gt;</samp> instead of <samp>Comment</samp>.
  </blockquote>
  <strong class="text-mono text-grey-dk-000">*/</strong>
</div>

### Creating instances
Make your `Comment` model available to the window.
```js
import ReactiveRecord from "reactiverecord"
window.Comment = ReactiveRecord.model("Comment")
```
Familiarize yourself with model instances by trying out the following in a browser JavaScript console and inspecting what is returned.
```js
> var comment = new Comment()
=>   'Comment {body: null, ...}'

> var comment = new Comment({ body: "Hello world!" })
=>   'Comment {body: "Hello world!", ...}'

> JSON.stringify(comment, null, 2)
=>   '{
        "createdAt": null,
        "updatedAt": null,
        "id": null,
        "body": "Hello world!",
        "email": null,
        "name": null,
        "postId": null
     }'
```
## Making API requests
##### Configuration
{: .no_toc }
We're going to experiment by making API calls to a placeholder API on a different origin. To do that, we'll need to tell Reactive Record how to build routes for this API, by setting an `apiPrefix`.

By default, Reactive Record will assume your `Comment` model has API endpoints available at `/comments`. You will learn more about configuring routes in a later guide.

Set the `apiPrefix` using ReactiveRecord.

```js
import ReactiveRecord from "reactiverecord"
window.Comment = ReactiveRecord.model("Comment")
ReactiveRecord.setAPI({ prefix: "https://jsonplaceholder.typicode.com" })
```

### Get the index
In a browser JavaScript console, log your first request to the comments endpoint of this API.
```js
> Comment.all().then(console.log)
=>   'Collection(500) [Comment, Comment, Comment, ...]'
```
> &#9495; <span class="label">GET</span> `https://jsonplaceholder.typicode.com/comments` 200 OK

Wow! The API request returned 500 results! So exciting! Let's try creating data.

### Create a record
```js
> var comment = new Comment({ body: "Hello world!" })
=>   'Comment {body: "Hello world!", ...}'
> comment.save().then(console.log)
=>   'Comment {id: 501, ...}'
> comment.id
=>   '501'
```
> &#9495; <span class="label">POST</span> `https://jsonplaceholder.typicode.com/comments` 201 Created

It looks like our `#<Comment>` was persisted per the API response with an ID of 501! How exciting! Let's find an individual comment.

### Show an individual record
```js
> var comment
> Comment.find(13).then(response => comment = response)
> comment.name
=>   'lorem ipsum...'
> comment.id
=>   '13'
```
> &#9495; <span class="label">GET</span> `https://jsonplaceholder.typicode.com/comments/13` 200 OK

Looks like calling `.find(13)` on the model made an API request to load the correct comment. Now, let's update this record.

### Update an individual record
```js
> comment.updateAttributes({ name: "Abraham Lincoln" })
> comment.name
=>   'Abraham Lincoln'
```
> &#9495; <span class="label">PUT</span> `https://jsonplaceholder.typicode.com/comments/13` 202 Accepted

This is what we want. You'll learn more about the different methods which update a record in a later guide, but calling 'updateAttributes` is a simple way. Now let's destroy this record.

### Destroy an individual record
```js
> comment.destroy()
```
> &#9495; <span class="label">DELETE</span> `https://jsonplaceholder.typicode.com/comments/501` 200 OK

Calling `.destroy()` on the `#<Comment>` triggered a `DELETE` request to the API. Sweet! This test API returns all the right responses for testing purposes, but don't expect it to remember what you've done.

## Summary
At this point, you've created your first model and started making some API requests to a test API. The possibilities must seem endless. But if your wheels aren't spinning already, just wait. We're about to demonstrate how to perform these same type of requests safely with JSX, using the included components!

<div class="text-center mt-7">
  <a class="btn" href="#">
    Retrieve records with JSX
  </a>
</div>
