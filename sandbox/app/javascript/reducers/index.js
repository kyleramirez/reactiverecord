import { combineReducers } from "redux"
import "models"
import ReactiveRecord, { reducer } from "reactiverecord"

function UIReducer(state={
}, action) {
  switch(action.type) {
    default:
      return state;
  }
}

export default combineReducers({
  ui: UIReducer,
  models: ReactiveRecord::reducer()
})
