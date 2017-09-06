import Collection from "../ReactiveRecord/Collection"
import { where, select, onlyReactiveRecord, queryStringToObj, values } from "../utils"
import diff from "object-diff"

function defaultSelect() { return true }

export function mapStateToProps(state, { for:Model, find, where:_where, select:_select=defaultSelect }) {
  const { store:{ singleton }, schema:{ _primaryKey="id" }, displayName } = Model,
        stateModels = state::onlyReactiveRecord(),
        whereQuery = _where ? typeof _where === "string" ? queryStringToObj(_where) : _where : false;

  if (singleton || find) {
    if (singleton) {
      return {
        resource: new Model({
          ...stateModels[displayName]._attributes,
          _errors:stateModels[displayName]._errors,
          _request:stateModels[displayName]._request
        }, true)
      }
    }
    const member = stateModels[displayName]._collection[find];
    if (member) {
      return {
        resource: new Model({
          ...member._attributes,
          _errors:member._errors,
          _request:member._request
        }, true)
      }
    }
    return { resource: new Model({ _request:{ status: null } }) }
  }

  const { _collection, _request } = stateModels[displayName],
        transformedCollection = _collection::values()
                                      .map( ({ _attributes, _request, _errors }) => new Model({
                                        ..._attributes,
                                        _errors,
                                        _request
                                      }, true) )
                                      ::where(whereQuery || {})
                                      ::select(_select);
  return { resource: new Collection({ _collection: transformedCollection, _request, _primaryKey }) }
}

export const areStatePropsEqual = (prev, next) => {
  return(JSON.stringify(prev.resource.serialize()) === JSON.stringify(next.resource.serialize()))
}

export const areStatesEqual = ({ for: { displayName } }) => (prev, next) => {
  return (prev::onlyReactiveRecord()[displayName] === next::onlyReactiveRecord()[displayName])
}
