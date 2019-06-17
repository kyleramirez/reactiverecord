import { ACTION_MATCHER } from "./constants"

export default function middleware() {
  return () => next => action => {
    next(action)
    const matches = action.type.match(ACTION_MATCHER)
    if (!!!matches) {
      return
    }
    const [, requestStatus, actionName] = matches
    if (actionName && !requestStatus) {
      return this.performAsync(action)
    }
  }
}
