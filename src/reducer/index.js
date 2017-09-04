import { combineReducers } from "redux"

export default function reducer() {
  return combineReducers(Object.keys(this.models).reduce((finalReducer, modelName) => {
    finalReducer[modelName] = this.models[modelName].store.reducer;
    return finalReducer;
  }, { _isReactiveRecord: ()=>true }))
}


// export default function reducer() {
//   return (state = this.initialState, action) => {
//     if (!ACTION_MATCHER.test(action.type)) return state
//     const [,asyncStatus, actionNameUpper, modelName] = action.type.match(ACTION_MATCHER),
//           actionName = actionNameUpper.toLowerCase(),
//           nextState = {...state},
//           modelClass = this.models[modelName],
//           { schema:{ _primaryKey="id" } } = modelClass;
//
//     if (!modelClass) throw new MODEL_NOT_FOUND_ERROR(modelName)
//
//     const {
//             _collection:actionCollection={},
//             _request:actionRequest={},
//             _attributes:actionAttributes={},
//             _attributes:{
//               [_primaryKey]:key
//             }={},
//             _errors:actionErrors={}
//           } = action,
//           {
//             [modelName]:{
//               _collection,
//               _collection:{
//                 [key]:member=memberProps,
//                 [key]:{
//                   _request:memberRequest={},
//                   _attributes:memberAttributes={},
//                   _errors:memberErrors={}
//                 }={}
//               }={}
//           } } = nextState;
//
//     if (!asyncStatus) {
//       /* Update the request status for the model */
//       if (!key) {
//         nextState[modelName] = {
//           ...nextState[modelName],
//           _request: {
//             ...nextState[modelName]._request,
//             status: ACTION_STATUSES[actionName]
//           }
//         }
//       }
//       if (_collection && key) {
//         /* Update or create request status on the member */
//         nextState[modelName]._collection = {
//           ..._collection,
//           [key]: {
//             ...member,
//             _request: {
//               ...memberRequest,
//               status: ACTION_STATUSES[actionName]
//             }
//           }
//         }
//       }
//     }
//
//     if (asyncStatus) {
//       if (_collection) {
//         nextState[modelName]._collection = {
//           ..._collection,
//           ...actionCollection
//         }
//       }
//       if (!key || !_collection) {
//         nextState[modelName]._request = {
//           ...nextState[modelName]._request,
//           ...actionRequest
//         }
//       }
//       if (!_collection) {
//         nextState[modelName]._attributes = {
//           ...nextState[modelName]._attributes,
//           ...actionAttributes
//         }
//       }
//       if (key && actionName != "index") {
//         nextState[modelName]._collection = {
//           ...nextState[modelName]._collection,
//           [key]: {
//             ...member,
//             _request: {
//               ...memberRequest,
//               ...actionRequest
//             },
//             _attributes: {
//               ...memberAttributes,
//               ...actionAttributes
//             },
//             _errors: {
//               ...memberErrors,
//               ...actionErrors
//             }
//           }
//         }
//       }
//     }
//
//     return nextState;
//   }
// }
