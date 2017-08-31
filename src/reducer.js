import {
  MODEL_NOT_FOUND_ERROR,
  ACTION_MATCHER,
  ACTION_STATUSES
} from "./constants"

/*
 *  @INDEX(Model)    @OK_INDEX(Model)    @ERROR_INDEX(Model)
 *                   _collection         _collection
 *                   _request            _request
 *                   ** singleton **     ** singleton **
 *                   _attributes
 *                   _request            _request
 *
 *  @CREATE(Model)   @OK_CREATE(Model)   @ERROR_CREATE(Model)
 *  _attributes†     _attributes
 *                   _request            _request
 *                                       _errors
 *
 *  @SHOW(Model)     @OK_SHOW(Model)     @ERROR_SHOW(Model)
 *  _attributes†     _attributes
 *                   _request            _request
 *
 *  @UPDATE(Model)   @OK_UPDATE(Model)   @ERROR_UPDATE(Model)
 *  _attributes†     _attributes
 *                   _request            _request
 *                                       _errors
 *
 *  @DESTROY(Model)  @OK_DESTROY(Model)  @ERROR_DESTROY(Model)
 *  _attributes†
 *                                       _request
 *
 *  † : We need the primary key from this resource to update
 *      the store with the resource being created || updated
 */

export default function reducer() {
  return (state = this.initialState, action) => {
    if (!ACTION_MATCHER.test(action.type)) return state
    const [,asyncStatus, actionNameUpper, modelName] = action.type.match(ACTION_MATCHER),
          actionName = actionNameUpper.toLowerCase(),
          nextState = {...state},
          modelClass = this.models[modelName],
          { schema:{ _primaryKey="id" } } = modelClass;

    if (!modelClass) throw new MODEL_NOT_FOUND_ERROR(modelName)
    const { _attributes:{ [_primaryKey]:key }={} } = action,
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
    return nextState;
  }
}
