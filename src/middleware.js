import { ACTION_MATCHER } from "./constants"

export default function middleware() {
  return ({ dispatch }) => next => action => {
    next(action);
    let matches = false;
    if (!(matches = action.type.match(ACTION_MATCHER))) return
    const [, requestStatus, actionName, modelName] = matches;
    if (actionName && !requestStatus) return this.performAsync(action);
  }
}

