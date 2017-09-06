// BACK END VERSION
import React from "react"
import { Provider } from "react-redux"
import storeBuilder from "storeBuilder"
import { Route } from "react-router-dom"
import { StaticRouter } from "react-router"
import Home from "containers/welcome/Home"
import { DogResources } from "containers/dog-breeds"

export default function Application({ INITIAL_STATE, location }) {
  return(
    <Provider store={storeBuilder(INITIAL_STATE)}>
      <StaticRouter location={location} context={{}}>
        <div>
          <Route path="/" exact component={Home} />
          {DogResources}
        </div>
      </StaticRouter>
    </Provider>
  )
}