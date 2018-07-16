import { combineReducers } from "redux"

export default function reducer() {
  return combineReducers(
    Object.keys(this.models).reduce(
      (finalReducer, modelName) => {
        finalReducer[modelName] = this.models[modelName].store.reducer
        return finalReducer
      },
      { _isReactiveRecord: () => true }
    )
  )
}
