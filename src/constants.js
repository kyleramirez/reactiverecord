export const ACTION_METHODS = {
  index: "GET",
  create: "POST",
  show: "GET",
  update: "PUT",
  destroy: "DELETE"
}
export const ACTION_STATUSES = {
  index: "GETTING",
  create: "POSTING",
  show: "GETTING",
  update: "PUTTING",
  destroy: "DELETING"
}
export const _request = {
  status: null,
  body: null
}
export const memberProps = {
  _request,
  _attributes: {},
  _errors: {}
}
export const collectionProps = {
  _request,
  _collection: {}
}
export const ACTION_MATCHER = /^@(OK_|ERROR_)?(INDEX|CREATE|SHOW|UPDATE|DESTROY)\(([^)]+)\)$/
export const ROUTE_TOKENIZER = /:([^/?]*)/g
export const ROUTE_NOT_FOUND_ERROR = function() {
  return ReferenceError("The specified route is either not found or not permitted")
}
export const MODEL_NOT_FOUND_ERROR = function(modelName) {
  return ReferenceError(`#<${modelName}> is not a recognized ReactiveRecord model`)
}
export const MODEL_NOT_VALID_ERROR = function(modelName) {
  return TypeError(`Class #<${modelName}> needs to inherit from ReactiveRecord's Model.`)
}
