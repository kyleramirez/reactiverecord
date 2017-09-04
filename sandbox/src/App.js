import React, { Component } from "react";
import ReactiveRecord, { reducer, middleware, Collection } from "./reactiverecord"
import { createStore, applyMiddleware, compose } from "redux"
import { Provider } from "react-redux"
import Post from "./models/Post"
window.Post = Post
const reduxDevTools = window.devToolsExtension ? window.devToolsExtension() : f => f;

const store = createStore(
  reducer.call(ReactiveRecord),
  compose(applyMiddleware(middleware.call(ReactiveRecord)), reduxDevTools)
);

function ShowPost({ POST }) {
  return(
    <pre>{JSON.stringify(POST, null, 2)}</pre>
  )
}

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Collection for={ReactiveRecord.model("Post")}>
          {(POSTS) => (
            <div>
            {
              POSTS?
                POSTS.map(POST => <ShowPost POST={POST} key={POST.id} />)
              :
                <div>Loading ...</div>
            }
            </div>
          )}
        </Collection>
      </Provider>
    );
  }
}