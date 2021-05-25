import { ACTION_MATCHER, ACTION_STATUSES, memberProps } from '../constants';

export default function singletonReducer(modelName, state = memberProps, action) {
  if (!ACTION_MATCHER.test(action.type)) {
    return state;
  }
  const [, asyncStatus, actionNameUpper, actionModelName] = action.type.match(ACTION_MATCHER);
  const actionName = actionNameUpper.toLowerCase();
  const requestStatus = asyncStatus ? asyncStatus.replace('_', '') : null;
  if (actionModelName !== modelName) {
    return state;
  }

  const nextState = { ...state };
  const {
    _request: safeActionRequest = {},
    _attributes: safeActionAttributes = {},
    _errors: safeActionErrors = {},
  } = action;
  const startingAsync = !requestStatus;
  const returningFromAsync = !!requestStatus;
  const statusOK = requestStatus === 'OK';

  nextState._request = {
    ...nextState._request,
    ...safeActionRequest,
  };
  if (startingAsync) {
    nextState._request.status = ACTION_STATUSES[actionName];
    nextState._errors = {};
  }
  if (returningFromAsync) {
    nextState._attributes = {
      ...nextState._attributes,
      ...safeActionAttributes,
    };
    nextState._errors = {
      ...nextState._errors,
      ...safeActionErrors,
    };
  }

  if (actionName === 'destroy' && statusOK) {
    nextState._attributes = {
      ...memberProps._attributes,
    };

    nextState._errors = {
      ...memberProps._errors,
    };
  }

  return nextState;
}
