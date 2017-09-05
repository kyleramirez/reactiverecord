import {
  ACTION_MATCHER,
  ACTION_STATUSES,
  memberProps, collectionProps
} from "../constants"
import { without } from "../utils"

export default function collectionReducer(modelName, _primaryKey, state=collectionProps, action) {
  if (!ACTION_MATCHER.test(action.type)) return state
  const [,asyncStatus, actionNameUpper, actionModelName] = action.type.match(ACTION_MATCHER),
        actionName = actionNameUpper.toLowerCase(),
        requestStatus = asyncStatus ? asyncStatus.replace("_","") : null;
  if (actionModelName != modelName) return state;

  const nextState = { ...state },
        {
          _collection,
          _request:safeActionRequest={},
          _attributes:safeActionAttributes={},
          _attributes:{
            [_primaryKey]:key
          }={},
          _errors:safeActionErrors={}
        } = action,
        hasMemberToUpdate = actionName != "index" && !!key,
        existingVersionOfMember = hasMemberToUpdate ?
            nextState._collection[key] || { ...memberProps }
          :
            null,
        startingAsync = !!!requestStatus,
        returningFromAsync = !!requestStatus,
        statusOK = requestStatus == "OK";

  if (startingAsync) {
    if (actionName == "index") {
      nextState._request = {
        ...nextState._request,
        status: ACTION_STATUSES[actionName]
      }
    }
    if (hasMemberToUpdate) {
      nextState._collection = {
        ...nextState._collection,
        [key]: {
          ...existingVersionOfMember,
          _request: {
            ...existingVersionOfMember._request,
            status: ACTION_STATUSES[actionName]
          },
          _attributes: {
            ...existingVersionOfMember._attributes,
            [_primaryKey]: key
          }
        }
      }
    }
  }

  if (returningFromAsync && actionName == "index") {
    nextState._request = {
      ...nextState._request,
      ...safeActionRequest
    }
  }

  if (action._collection) {
    nextState._collection = {
      ...nextState._collection,
      ...action._collection
    }
  }

  if (hasMemberToUpdate && returningFromAsync) {
    if (!!(actionName.match(/(show|create|update)/) || actionName == "destroy" && !statusOK)) {
      nextState._collection = {
        ...nextState._collection,
        [key]: {
          _request: {
            ...existingVersionOfMember._request,
            ...safeActionRequest
          },
          _attributes: {
            ...existingVersionOfMember._attributes,
            ...safeActionAttributes
          },
          _errors: {
            ...existingVersionOfMember._errors,
            ...safeActionErrors
          }
        }
      }
    }

    if (!!(actionName == "destroy" && statusOK)) {
      nextState._collection = nextState._collection::without(key.toString())
    }
  }

  return nextState;
}
