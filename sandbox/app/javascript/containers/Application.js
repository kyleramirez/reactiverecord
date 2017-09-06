// FRONT END VERSION
import React from "react"
import { Provider } from "react-redux"
import storeBuilder from "storeBuilder"
import { BrowserRouter, Route } from "react-router-dom"
import ReactiveRecord from "reactiverecord"
import Home from "./welcome/Home"
import { DogResources } from "./dog-breeds"

export default function Application({ INITIAL_STATE }) {

  const store = storeBuilder(INITIAL_STATE);
  ReactiveRecord.setAPI({ prefix: "/api" })
  ReactiveRecord.dispatch = store.dispatch;

  return(
    <Provider store={store}>
      <BrowserRouter>
        <div>
          <Route path="/" exact component={Home} />
          {DogResources}
        </div>
      </BrowserRouter>
    </Provider>
  )
}
