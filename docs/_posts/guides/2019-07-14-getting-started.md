---
layout: page
title: Getting Started
date:   2019-07-14 18:32:13 -0400
category: Guides
nav_order: 1
---
# Getting Started
{: .no_toc }
In this guide, you will learn the minimum required configuration to get Reactive Record up and running in your React application. Reactive Record is still evolving, but a lot has been done to require the least amount of boilerplate code on your part to get going. If you are building a new application, you will find examples below that assume no existing configuration.

#### Contents
{: .no_toc .mt-6 }
1. TOC
{:toc}

## Peer Dependencies
Reactive Record uses the popular Redux state container library under the hood, and assumes you use a <a href="https://facebook.github.io/flux/" target="_blank" rel="noreferrer noopener nofollow">flux architecture</a> in your React application. If you're not, don't worry. This guide will help get your application set up from scratch. Reactive Record requires the following libraries are installed in your own `package.json`.

- `react@16.x`
- `react-redux@5.x`
- `redux@3.x || redux@4.x`

## Installation
##### Yarn
{: .no_toc }
```bash
yarn add reactiverecord
```
##### NPM
{: .no_toc }
```bash
npm install --save reactiverecord
```

## Application Layout
{: .text-alpha }
Though many flux-based React applications get the same result, there's no shortage of file configurations out there. This guide requires a few key components to exist, and makes suggestions on how to structure your application, but ultimately does not enforce any configuration in particular.

This can be daunting for those coming from opinionated frameworks, such as Ruby on Rails. It's still the Wild West here, but that's OK for now.

Depending on what the state is of your application, here are the components we will need to either create or edit to bootstrap Reactive Record:
- Reducer
- Middlewares
- Store

<strong class="text-mono text-red-100">!important</strong><br> Before you go further, you should be familiar with what we're talking about when we mention reducers, middlewares and store. You don't need to become an expert, but you can become as familiar as you need to be for the purpose of this guide by reading the <a href="https://redux.js.org/introduction/getting-started" target="_blank" rel="noreferrer noopener nofollow">Redux getting started guide</a>.
{: .bg-grey-lt-000 .p-4 }

A flux-based application will typically have only one reducer and middleware, which make up the store. Depending on the size of your application, this could all be in the same file.

Follow the steps below to add Reactive Record to these key components.

### Step 1: Edit your reducer
{: .text-beta }
Here's an example reducer file which contains your existing application logic.

**<small>reducer.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
export default function yourReducer(state = {}, action) {
  ...
}
```
Add ReactiveRecord to your reducer by using `combineReducers` from the Redux library.

**<small>reducer.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import { combineReducers } from "redux"
import ReactiveRecord, { reducer } from "reactiverecord"

function yourReducer(state = {}, action) {
  ...
}

export default combineReducers({
  yourReducer: yourReducer,
  models: reducer.call(ReactiveRecord)
})
```

If you don't have an existing reducer, create a new file:

**<small>reducer.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import ReactiveRecord, { reducer } from "reactiverecord"
export default reducer.call(ReactiveRecord)
```

### Step 2: Edit your middleware
{: .text-beta }
If you have existing middleware in your application, it likely looks something like this:

**<small>middleware.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import { compose, applyMiddleware } from "redux"
const yourMiddleware = store => next => action => {
  ...
}
export default compose(applyMiddleware(yourMiddleware), __REDUX_DEVTOOLS_EXTENSION__)
```
Add ReactiveRecord to your middleware as an extra argument to `applyMiddleware`.

**<small>middleware.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import { compose, applyMiddleware } from "redux"
import ReactiveRecord, { middleware } from "reactiverecord"
const yourMiddleware = store => next => action => {
  ...
}
export default compose(applyMiddleware(yourMiddleware, middleware.call(ReactiveRecord)), __REDUX_DEVTOOLS_EXTENSION__)
```
If you don't have an existing middleware, create a new file:

**<small>middleware.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import { compose, applyMiddleware } from "redux"
import ReactiveRecord, { middleware } from "reactiverecord"
export default compose(applyMiddleware(middleware.call(ReactiveRecord)), __REDUX_DEVTOOLS_EXTENSION__)
```

### Step 3: Edit your store
{: .text-beta }
Bringing both the reducer and middlewares together, your createStore call looks something like below. The last step is to pass the instantiated `store` to Reactive Record along with the dispatch.

**<small>store.js</small>**
{: .m-0 .text-mono .text-grey-dk-000 }
```javascript
import { createStore } from "redux"
import reducer from "reducer"
import middleware from "middleware"
import ReactiveRecord from "reactiverecord"
const store = createStore(reducer, middleware)
ReactiveRecord.store = store
ReactiveRecord.dispatch = store.dispatch
export default store
```

## Suggested file layout
Much of the content in this documentation refers to certain folders, which may or may not exist in your application. For clarity, below is an example of a useful file / folder layout that incorporates Reactive Record. While this guide does not go into creating models, the example below shows how one model (Product) exists.

```yaml
root-directory/
  ├ containers/ # Route-based components
  │ └ products/
  │   ├ edit.js
  │   ├ index.js
  │   ├ new.js
  │   └ show.js
  ├ models/
  │ └ Product.js
  ├ resources/ # Model-based components
  │ └ products/
  │   ├ ProductCollection.js
  │   ├ ProductMember.js
  │   └ ProductForm.js
  ├ ui/ # A folder for your UI components (Button, Modal, etc.)
  ├ reducer.js
  ├ middleware.js
  └ store.js
```

## Summary
We went over the minimum required boilerplate to get Reactive Record up and running. If you've made it this far, awesome! Reactive Record is ready to go, but there are no models defined, so nothing useful has happened yet. Continue to the next guide to get started with models.

<div class="text-center mt-7">
  <a class="btn" href="{% post_url guides/2019-07-16-using-models %}">
    Create your first model &raquo;
  </a>
</div>
