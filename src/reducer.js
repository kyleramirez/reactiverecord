import {
  MODEL_NOT_FOUND_ERROR,
  ACTION_MATCHER,
  ACTION_STATUSES
} from "./constants"

export default function reducer() {
  return (state = this.initialState, action) => {
    if (!ACTION_MATCHER.test(action.type)) return state
    const [,asyncStatus, actionNameUpper, modelName] = action.type.match(ACTION_MATCHER),
          actionName = actionNameUpper.toLowerCase(),
          nextState = {...state},
          modelClass = this.models[modelName],
          { schema:{ _primaryKey="id" } } = modelClass;

    if (!modelClass) throw new MODEL_NOT_FOUND_ERROR(modelName)
    const { attributes:{ [_primaryKey]:key }={} } = action,
          { [modelName]:{ collection:{ [key]:member }={} } } = nextState;

    let nextModel = nextState[modelName];
    if (!asyncStatus) {
      nextState[modelName] = {
        ...nextModel,
        request: {
          ...nextModel.request,
          status: ACTION_STATUSES[actionName]
        }
      }
      if (member) {
        nextState[modelName].collection = {
          ...nextModel.collection,
          [key]: {
            ...member,
            request: {
              ...member.request,
              status: ACTION_STATUSES[actionName]
            }
          }
        }
      }
    }
    console.log(action)
    return nextState;
  }
}
