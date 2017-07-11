import React, { Component } from "react";
import ReactiveRecord, { Model } from "./reactiverecord";
import { createStore, applyMiddleware, compose as reduxCompose } from "redux"

ReactiveRecord.model("Story", class Story extends Model {
  static schema = {
    // slug: String,
    title: String,
    _primaryKey: "slug"
  }
})
ReactiveRecord.model("Post", class Story extends Model {
  static schema = {
    userId: Number,
    title: String,
    body: String
  }
  static routes = {
    index: "https://jsonplaceholder.typicode.com/:modelname",
    create: "https://jsonplaceholder.typicode.com/:modelname",
    show: "https://jsonplaceholder.typicode.com/:modelname/:id",
    update: "https://jsonplaceholder.typicode.com/:modelname/:id",
    destroy: "https://jsonplaceholder.typicode.com/:modelname/:id"
  }
})
ReactiveRecord.model("Fart", class Fart extends Model {
  static schema = {
    crisp: String,
    cling: Array,
    spring: Object,
    ding: { default: "DINGALING!", type: String },
    _timestamps: true,
    _primaryKey: "token"
  }
  static routes = {
    create: ":prefix/:modelname/:ding/:crisp/:token",
    // only: "create"
    // except: ["destroy","update"]
  }
  static store = {
    singleton: true
  }
})
window.Fart = ReactiveRecord.model("Fart")
window.Post = ReactiveRecord.model("Post")

const genericMiddleware = store => next => action => {
  console.log("Generic Middleware", JSON.stringify(action))
  return next(action);
}

const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || reduxCompose;

const store = createStore(
        ReactiveRecord.combineReducers({
          counter: (state={ count:0 }, action) => {
            return({ count:++state.count })
          }
        }),
        {
          "counter": {
            "count": 9
          },
          "ReactiveRecord": {
            "Fart": {
              "request": {
                "status": 200,
                "body": null
              },
              "errors": {},
              "attributes":{"crisp":"Guantanamera","cling":[1,2,3,4],"spring":{"one":{"two":3}},"ding":"DINGALING!","createdAt":"2017-07-07T19:17:26Z","updatedAt":"2017-07-07T19:17:26Z","token":"H264"}
            },
            Post: {
              request: {
                status: null,
                body: null
              },
              collection: {}
            },
            Story: {
              request: {
                status: 200,
                body: null
              },
              collection: {
                "you-are-the-best":{
                  attributes: {
                    title:"You are the best",
                    slug:"you-are-the-best"
                  }
                },
                "guantanamera": {
                  attributes: {
                    title:"The Guantanamera",
                    slug:"guantanamera"
                  }
                }
              }
            }
          }
        },
        compose(
          applyMiddleware(genericMiddleware),
          ReactiveRecord.storeEnhancer
        )
      );
ReactiveRecord.registerStore(store)
window.store = store;


export default class App extends Component {
  render() {
    return (
      <div>
        Mkay
      </div>
    );
  }
}
