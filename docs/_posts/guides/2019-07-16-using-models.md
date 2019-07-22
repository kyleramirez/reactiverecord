---
layout: page
title: Using Models
date:   2019-07-16 00:19:00 -0400
category: Guides
nav_order: 2
---
# Using Models
{: .no_toc }
Reactive Record interacts with JSON APIs using predefined models and schemas, which represent resources in your application, and usually map to records in your application's database. It's similar to the purpose of creating models in a model-view-controller framework.

In this guide, we'll cover creating your first model with a schema, and making an API request.

#### Contents
{: .no_toc .mt-6 }
1. TOC
{:toc}

## A short note about resources

A model called `Comment` will map to a `/comments` API endpoint, which maps to a database table called `comments`.<br><br>A model called `Session` will map to a `/sessions` API endpoint. Even though you may not have a `sessions` database table, a session can still be thought of as a *resource* that is created or destroyed in your application. For instance, when a user logs in:

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
For organization, you should keep your models together. Following the [suggested file layout]({% post_url guides/2019-07-14-getting-started %}#suggested-file-layout), place your models in a top-level `/models` folder. Each file should contain only one model. The file name should be the singular name of the model itself in title case.

For your first model, we will be creating a `Comment` model.

**<small>/models/Comment.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import ReactiveRecord, { Model } from "reactiverecord"
class Comment extends Model {}
export default ReactiveRecord.model("Comment", Comment)
```

## Add schema attributes
All we've done here is defined a single `Comment` model with no attributes. We need to define a `schema`. A `schema` describes each of the attributes on a model instance. The `schema` attributes are very much like descriptors for database columns.

**<small>/models/Comment.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
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
Schema attributes can be configured further than a primitive constructor. Instead, an object can be given which contains the following attributes:

| Attribute | Value | Required |
|:----------|:------|:---------|
| <samp>type</samp> | Array&#124;Boolean&#124;Date&#124;Number&#124;Object&#124;String | Yes |
| <samp>default</samp> | The default value of this field, which will be persisted on the next save | No |
| <samp>labelText</samp> | When rendering a form, the text that should serve as this attributes label. By default, the label text will be the humanized translation of the attribute. `remember_me` becomes "Remember me", but can be overridden here to "Remember me next time." | No |
{: #schema-attribute-configuration }

### About Timestamps
Each of the schema attributes here are pretty self-explanatory, except `_timestamps`. By writing `_timestamps: true`, we're telling Reactive Record to look for either `created_at` and `updated_at` attributes, or `createdAt` and `updatedAt` attributes in the JSON. This is to simplify the differences between default timestamp naming conventions from Rails or MongoDB. Whether your timestamp attributes are camel cased or snake cased, they will be accessible via `model.createdAt` and `model.updatedAt`.

### About the ID
You'll notice we did NOT define an `id` or `_id` attribute. This is the only implicit attribute in Reactive Record. There's no need to define an `id` attribute in your model schema. It will be assumed that every model has an `id` or `_id` attribute acting as its primary key, unless configured otherwise. Whether your JSON contains `id` or `_id`, it will be accessible via `model.id`.

If your model uses another attribute as its primary key, you can configure this in the model schema:

```javascript
class Order extends Model {
  schema = {
    _primaryKey: "uuid"
  }
}
```

We've now defined a few attributes along with their types. The next step is importing your model to your application.

### Models based on the current session
Often, you will need to define models which are identified by the current session only. For example: `Cart`, `CurrentUser` or `Session`. These are models for which there exists only one resource per user consuming an API. The response is different depending on who is accessing the server. For these types of models, use the below configuration in your `Model` definition.

```javascript
class Cart extends Model {
  static store = { singleton: true }
}
```
This will adjust the route configuration to no longer expect an ID in the resulting requests. For instance, calling: `Cart.find()` will make a request to `/cart` rather than `/cart/:id`.

## Configuring Routes
By default, each model contains five routes used to create, read, update and delete data. These routes are generated automatically based on the model's name, but are highly customizable. For instance, for a model called `User`, the following routes would be automatically generated:

| Action | Route | Description |
|:-------|:------|:------------|
| <samp>index</samp> | `/users` | Used to `GET` a list of users |
| <samp>create</samp> | `/users` | Used when making a `POST` request to create a user |
| <samp>show</samp> | `/users/:id` | Used to `GET` a single user |
| <samp>update</samp> | `/users/:id` | Used when making a `PUT` request to update a user |
| <samp>destroy</samp> | `/users/:id` | Used when making a `DELETE` request to destroy a user |

### Route Tokens
Each route generated follows a template (`:prefix/:modelname/:id`) which contains tokens. The tokens within the template are interpolated at the time the route is used. The default tokens are `:prefix`, `:modelname` and `:id`.

The `:prefix` token can be defined by setting the API prefix. Doing so will prefix all API requests across all models.

```javascript
ReactiveRecord.setAPI({ prefix: "/api/v1" })
```

The `:modelname` token is the pluralized and dasherized form of the model name. For instance, a model called `CurrentUser` will have `current-user` as its generated `:modelname`. You can change the dashes to underscores across all models by changing the API delimiter. 

```javascript
/**
 * Acceptable values:
 * "_"
 * "underscore"
 * "underscores"
 */
ReactiveRecord.setAPI({ delimiter: "_" })
```

The `:id` token will only be present on a *member* route, and will only be called `:id` if `id` is the primary key of the model. If the primary key is configured as `uuid`, the token `:uuid` will automatically be present in the routes in place of `:id`.

More tokens can be used for more sophisticated routes. When using a custom token, be sure this attribute is present at the time the API request is made. Consider the following example:

```javascript
class Invoices extends Model {
  static routes = {
    show: "/company/:company_id/invoices/:id"
  }
}
Invoice.find(4456, { company_id: 22 })
```
> &#9495; <span class="label">GET</span> `/company/22/invoices/4456` 200 OK

### Disabling Routes
Sometimes it's helpful to exclude certain routes from the model. This doesn't prevent the route from being accessed, but Reactive Record will throw an error if a disabled route is accessed. You can configure this in the model's route settings. The following configurations are each acceptable:

```javascript
class CurrentUser extends Model {
  static routes = {
    only: "show",
    show: "/me"
  }
}

class Session extends Model {
  static routes = {
    except: "index"
  }
}

class Note extends Model {
  static routes = {
    only: ["create", "show"]
  }
}

class BankAccount extends Model {
  static routes = {
    except: ["create", "update", "destroy"]
  }
}
```

## Importing your model
The location to import your models for your application is just before the Reactive Record reducer is built. We'll import them to the top-level `reducer.js` file we created in the [Getting Started guide]({% post_url guides/2019-07-14-getting-started %}#step-1-edit-your-reducer).

**<small>reducer.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import ReactiveRecord, { reducer } from "reactiverecord"
import "models/Comment"
/* import more models here before the call to the reducer function */
export default reducer.call(ReactiveRecord)
```

From now on, your `Comment` model can be retrieved by making a call to ReactiveRecord directly. Avoid re-importing the `/models/Comment.js` file more than once in your application.

```javascript
const Comment = ReactiveRecord.model("Comment")
```

We now have enough to begin interacting with a JSON API!

## Model basics
{: .text-alpha }

Now that you have a `Comment` model defined, it's time to start interacting with it &mdash; that is, creating instances, making API requests, and persisting data. Let's start by creating an instance of `Comment`.

<div class="bg-grey-lt-000 p-4">
  <strong class="text-mono text-grey-dk-000">/**</strong>
  <blockquote class="mt-0 mb-0">
  For clarity, model instances in this documentation are represented like <samp>#&lt;Comment&gt;</samp> instead of <samp>Comment</samp>.
  </blockquote>
  <strong class="text-mono text-grey-dk-000">*/</strong>
</div>

### Creating instances
For demonstration purposes, make your `Comment` model available to the window.
```javascript
import ReactiveRecord from "reactiverecord"
window.Comment = ReactiveRecord.model("Comment")
```
Familiarize yourself with model instances by trying out the following in a browser JavaScript console and inspecting what is returned.
```javascript
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
We're going to experiment by making API calls to a <a href="https://jsonplaceholder.typicode.com/"  target="_blank" rel="noreferrer noopener nofollow">placeholder API</a> on a different origin. To do that, we'll need to tell Reactive Record how to build routes for this API by setting an API prefix.

By default, Reactive Record will assume your `Comment` model has API endpoints available at `/comments` on the same origin. You will learn more about configuring routes later.

Set the API prefix using ReactiveRecord.

```javascript
import ReactiveRecord from "reactiverecord"
window.Comment = ReactiveRecord.model("Comment")
ReactiveRecord.setAPI({ prefix: "https://jsonplaceholder.typicode.com" })
```

### Get the index
In a browser JavaScript console, log your first request to the comments endpoint of this API.
```javascript
> Comment.all().then(console.log)
=>   'Collection(500) [Comment, Comment, Comment, ...]'
```
> &#9495; <span class="label">GET</span> `https://jsonplaceholder.typicode.com/comments` 200 OK

Wow! The API request returned 500 results! So exciting! Let's try creating data.

### Create a record
```javascript
> var comment = new Comment({ body: "Hello world!" })
=>   'Comment {body: "Hello world!", ...}'
> comment.save().then(console.log)
=>   'Comment {id: 501, ...}'
> comment.id
=>   '501'
```
> &#9495; <span class="label">POST</span> `https://jsonplaceholder.typicode.com/comments` 201 Created

It looks like our `#<Comment>` was persisted with an ID of 501! How exciting? Now, let's find an individual comment.

### Show a record
```javascript
> var comment
> Comment.find(13).then(response => comment = response)
> comment.name
=>   'lorem ipsum...'
> comment.id
=>   '13'
```
> &#9495; <span class="label">GET</span> `https://jsonplaceholder.typicode.com/comments/13` 200 OK

Calling `.find(13)` on the model made an API request to load a comment with ID 13. Now, let's update this record.

### Update a record
```javascript
> comment.updateAttributes({ name: "Abraham Lincoln" })
> comment.name
=>   'Abraham Lincoln'
```
> &#9495; <span class="label">PUT</span> `https://jsonplaceholder.typicode.com/comments/13` 202 Accepted

This is what we want. You'll learn more about the different methods that update a record later. Calling `updateAttributes` is a simple way. Now, let's destroy this record.

### Destroy a record
```javascript
> comment.destroy()
```
> &#9495; <span class="label">DELETE</span> `https://jsonplaceholder.typicode.com/comments/501` 200 OK

Calling `.destroy()` on the `#<Comment>` triggered a `DELETE` request to the API. Sweet! This test API returns all the right responses for testing purposes, but don't expect it to remember what you've done.

## Summary
At this point, you've created your first model and started making some API requests to a test API. The possibilities must seem endless. If your wheels aren't spinning already, just wait. We're about to demonstrate how to perform these same type of requests in JSX, using the included components!

<div class="text-center mt-7">
  <a class="btn" href="{% post_url guides/2019-07-17-using-member-and-collection %}">
    Retrieve records with JSX
  </a>
</div>
