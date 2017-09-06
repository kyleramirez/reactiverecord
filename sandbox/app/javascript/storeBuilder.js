import { createStore, compose } from "redux"
import reducer from "reducers"
import middlewares from "middlewares"

const stubDevTool = function(cs) { return cs },
      reduxDevTools = typeof window === "object" && window.devToolsExtension ? window.devToolsExtension() : stubDevTool;

export default function storeBuilder(initialState) {

  const createStoreArgs = [reducer],
        storeEnhancers = [middlewares];

  if(initialState) createStoreArgs.push(initialState);

  if(process.env.NODE_ENV !== "production") storeEnhancers.push(reduxDevTools);

  return createStore(...createStoreArgs, compose(...storeEnhancers));
}
