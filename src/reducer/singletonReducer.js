import {
  ACTION_MATCHER,
  ACTION_STATUSES,
  memberProps, collectionProps
} from "../constants"

export default function singletonReducer(modelName, _primaryKey, state=memberProps, action) {
  if (!ACTION_MATCHER.test(action.type)) return state;
  return state;
}
