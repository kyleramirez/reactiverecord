import {
  ACTION_MATCHER,
  ACTION_STATUSES,
  memberProps
} from "../constants"

export default function singletonReducer(modelName, _primaryKey, state=memberProps, action) {
  if (!ACTION_MATCHER.test(action.type)) return state;
  const [,asyncStatus, actionNameUpper, actionModelName] = action.type.match(ACTION_MATCHER),
        actionName = actionNameUpper.toLowerCase(),
        requestStatus = asyncStatus ? asyncStatus.replace("_","") : null;
  if (actionModelName !== modelName) return state;

  const nextState = { ...state },
        {
          _request:safeActionRequest={},
          _attributes:safeActionAttributes={},
          _errors:safeActionErrors={}
        } = action,
        startingAsync = !!!requestStatus,
        returningFromAsync = !!requestStatus,
        statusOK = requestStatus === "OK";

  nextState._request = {
    ...nextState._request,
    ...safeActionRequest,
  }
  if (startingAsync) {
    nextState._request.status = ACTION_STATUSES[actionName];
    nextState._errors = {}
  }
  if (returningFromAsync) {
    nextState._attributes = {
      ...nextState._attributes,
      ...safeActionAttributes
    }
    nextState._errors = {
      ...nextState._errors,
      ...safeActionErrors
    }
  }

  if (actionName === "destroy" && statusOK) {
    nextState._attributes = {
      ...memberProps._attributes
    }

    nextState._errors = {
      ...memberProps._errors
    }
  }

  return nextState;
}
