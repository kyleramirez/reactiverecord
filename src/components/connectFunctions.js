import { Children } from "react"
import Collection from "../ReactiveRecord/Collection"
import { where, select, onlyReactiveRecord, queryStringToObj, values, pick, without } from "../utils"

function defaultSelect() {
  return true
}

export function mapStateToProps(state, { for: Model, find, where: _where, select: _select = defaultSelect }) {
  const {
    store: { singleton },
    schema: { _primaryKey = "id" },
    displayName
  } = Model
  const stateModels = onlyReactiveRecord.call(state)

  let whereQuery = _where ? (typeof _where === "string" ? queryStringToObj(_where) : _where) : {}
  const schemaAttrs = Object.keys(without.call(Model.schema, "_primaryKey", "_timestamps"))
  whereQuery = pick.call(whereQuery, ...schemaAttrs)

  if (singleton || find) {
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
    const member = stateModels[displayName]._collection[find]
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
    return { resource: new Model({ _request: { status: null } }, false, true) }
  }

  const { _collection, _request } = stateModels[displayName]
  const transformedCollection = select.call(
    where.call(
      values
        .call(_collection)
        .map(({ _attributes, _request, _errors }) => new Model({ ..._attributes, _errors, _request }, true, true)),
      whereQuery
    ),
    _select
  )
  return {
    resource: new Collection({
      _collection: transformedCollection,
      _request,
      _primaryKey
    })
  }
}

export const areStatePropsEqual = (prev, next) => {
  return JSON.stringify(prev.resource.serialize()) === JSON.stringify(next.resource.serialize())
}

export const areStatesEqual = ({ for: { displayName } }) => (prev, next) => {
  return onlyReactiveRecord.call(prev)[displayName] === onlyReactiveRecord.call(next)[displayName]
}

export function ReactiveResource({ children, resource }) {
  return Children.only(children(resource))
}
ReactiveResource.displayName = "ReactiveResource"
