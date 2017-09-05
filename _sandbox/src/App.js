import React, { Component } from "react";
import ReactiveRecord, { reducer, middleware, Collection, Member } from "./reactiverecord"
import { createStore, applyMiddleware, compose } from "redux"
import { Provider } from "react-redux"
import Post from "./models/Post"
import CurrentUser from "./models/CurrentUser"
window.Post = Post
window.CurrentUser = CurrentUser;
const reduxDevTools = window.devToolsExtension ? window.devToolsExtension() : f => f;

const store = createStore(
  reducer.call(ReactiveRecord),
  compose(applyMiddleware(middleware.call(ReactiveRecord)), reduxDevTools)
);

function ShowPost({ POST }) {
  return(
    <pre style={{whiteSpace: "pre-wrap"}}>{JSON.stringify(POST, null, 2)}</pre>
  )
}

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div>
          <Member for={CurrentUser}>
            { CURRENT_USER => (
              <div>
                {console.log(`rendering CurrentUser (${CURRENT_USER._request.status})`) || null}
                {
                  CURRENT_USER._request.status === 200?
                    <ShowPost POST={CURRENT_USER} />
                  :
                    "Loading current user ..."
                }
              </div>
            )}
          </Member>
          <Member for={Post} find={2}>
            { POST => (
              <div style={{border:"1px solid red"}}>
                {console.log(`rendering post 2 (${POST._request.status})`) || null}
                {
                  POST._request.status === 200?
                    <ShowPost POST={POST} />
                  :
                    "Loading 2"
                }
              </div>
            )}
          </Member>
          <Collection for={ReactiveRecord.model("Post")} where={{ userId: 2 }}>
            { POSTS => (
              <div>
              {console.log(`rendering posts collection (${POSTS._request.status})`) || null}
              {
                POSTS._request.status === 200?
                  POSTS.map(POST => <ShowPost POST={POST} key={POST.id} />)
                :
                  "Loading ..."
              }
              </div>
            )}
          </Collection>
        </div>
      </Provider>
    );
  }
}