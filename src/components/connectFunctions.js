import Collection from "../ReactiveRecord/Collection"
import { where, select, onlyReactiveRecord, queryStringToObj, pick, without } from "../utils"

export function mapStateToProps(type) {
  return (state, { for: Model, find, where: _where, select: _select }) => {
    const {
      store: { singleton },
      schema: { _primaryKey = "id" },
      displayName
    } = Model
    const stateModels = onlyReactiveRecord.call(state)

    if (type === "Member") {
      if (singleton) {
        return {
          resource: new Model(
            {
              ...stateModels[displayName]._attributes,
              _errors: stateModels[displayName]._errors,
              _request: stateModels[displayName]._request
            },
            true,
            true
          )
        }
      }
      if (find !== undefined) {
        let member
        if (typeof find === "function") {
          const { _collection } = stateModels[displayName]
          member = Object.values(_collection).find(find)
        } else {
          member = stateModels[displayName]._collection[find]
        }
        if (member) {
          return {
            resource: new Model(
              {
                ...member._attributes,
                _errors: member._errors,
                _request: member._request
              },
              true,
              true
            )
          }
        }
      }
      return { resource: new Model({ _request: { status: null } }, false, true) }
    }

    let whereQuery = null
    if (_where) {
      whereQuery = _where
      if (typeof _where === "string") {
        whereQuery = queryStringToObj(_where)
      }
      const schemaAttrs = Object.keys(without.call(Model.schema, "_primaryKey", "_timestamps"))
      whereQuery = pick.call(whereQuery, ...schemaAttrs)
    }

    const { _collection, _request } = stateModels[displayName]
    function modelFromStore({ _attributes, _request, _errors }) {
      return new Model({ ..._attributes, _errors, _request }, true, true)
    }
    let transformedCollection = Object.values(_collection).map(modelFromStore)
    if (whereQuery) {
      transformedCollection = where.call(transformedCollection, whereQuery)
    }
    if (_select) {
      transformedCollection = select.call(transformedCollection, _select)
    }
    return {
      resource: new Collection({
        _collection: transformedCollection,
        _request,
        _primaryKey
      })
    }
  }
}

export const areStatePropsEqual = (prev, next) => {
  return JSON.stringify(prev.resource.serialize()) === JSON.stringify(next.resource.serialize())
}

export const areStatesEqual = ({ for: { displayName } }) => (prev, next) => {
  return onlyReactiveRecord.call(prev)[displayName] === onlyReactiveRecord.call(next)[displayName]
}

export function ReactiveResource({ children, resource }) {
  return children(resource)
}
ReactiveResource.displayName = "ReactiveResource"
