import Model from "../Model"
import { interpolateRoute, without, pick } from "../utils"
import {
  ACTION_MATCHER,
  ACTION_METHODS,
  ROUTE_NOT_FOUND_ERROR,
  MODEL_NOT_FOUND_ERROR,
  MODEL_NOT_VALID_ERROR
} from "../constants"
import singletonReducer from "../reducer/singletonReducer"
import collectionReducer from "../reducer/collectionReducer"
import Collection from "./Collection"

export default class ReactiveRecord {
  models = {}
  model(modelStr, modelClass = false) {
    /* If we're just retrieving a model */
    if (!modelClass) {
      if (typeof this.models[modelStr] === "undefined") {
        throw new MODEL_NOT_FOUND_ERROR(modelStr)
      }
      return this.models[modelStr]
    }
    /* Check if it's an instance of model */
    if (!(modelClass.prototype instanceof Model)) {
      throw new MODEL_NOT_VALID_ERROR(modelStr)
    }
    // Assign the model's parent
    modelClass.ReactiveRecord = this
    // Assign the model's name
    modelClass.displayName = modelStr

    // Interpolate the model's routes
    const {
      routes: { only = [], except = [], ...definedRoutes } = {},
      schema: { _primaryKey = "id" },
      store = {},
      store: { singleton = false } = {}
    } = modelClass
    const defaultRoutes = ["index", "create", "show", "update", "destroy"]
      // Removes routes if except defined
      .filter(function(action) {
        return except.indexOf(action) === -1
      })
      // Remove routes if only defined
      .filter(function(action) {
        return !only.length || only.indexOf(action) > -1
      })
    modelClass.routes = defaultRoutes.reduce((routes, action) => {
      let generatedRoute = ":prefix/:modelname"
      if (action.match(/^(show|update|destroy)$/)) {
        generatedRoute += `/:${_primaryKey}`
      }
      routes[action] = routes[action] || generatedRoute
      return routes
    }, definedRoutes)

    modelClass.store = {
      singleton,
      reducer: singleton ? singletonReducer.bind(this, modelStr) : collectionReducer.bind(this, modelStr, _primaryKey),
      ...store
    }
    // Assign the model
    return (this.models[modelStr] = modelClass)
  }

  API = {
    prefix: "",
    delimiter: "-",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    patchMode: true
  }

  setAPI(opts) {
    const { prefix, delimiter, patchMode } = this.API
    const { headers = {} } = opts
    ;({
      prefix: this.API.prefix = prefix,
      delimiter: this.API.delimiter = delimiter,
      patchMode: this.API.patchMode = patchMode
    } = opts)
    Object.assign(this.API.headers, headers)
  }

  performAsync(action) {
    return new Promise((resolve, reject) => {
      const [, , actionName, modelName] = action.type.match(ACTION_MATCHER)
      const model = this.models[modelName]

      if (!model) {
        throw new MODEL_NOT_FOUND_ERROR(modelName)
      }

      const {
        store: { singleton = false },
        schema: { _primaryKey = "id" }
      } = model
      const { _attributes = {} } = action
      const { headers, ...apiConfig } = this.API
      const routeTemplate = model.routes[actionName.toLowerCase()]
      const method = ACTION_METHODS[actionName.toLowerCase()]
      const query = method === "GET" ? _attributes : without.call(_attributes, ...Object.keys(model.schema))
      const body = method === "GET" ? {} : pick.call(_attributes, ...Object.keys(model.schema))
      if (!routeTemplate) {
        throw new ROUTE_NOT_FOUND_ERROR()
      }

      const [route, bodyWithoutInterpolations] = interpolateRoute(
        routeTemplate,
        body,
        modelName,
        singleton,
        apiConfig,
        query
      )

      const xhr = new XMLHttpRequest()
      const { DONE } = XMLHttpRequest
      xhr.open(method, route)
      for (let header in headers) {
        if (headers.hasOwnProperty(header)) {
          xhr.setRequestHeader(header, headers[header])
        }
      }
      xhr.addEventListener("load", e => {
        const { status, response } = e.target
        const { readyState } = xhr
        if (readyState === DONE) {
          if (/20(0|1|2|4)/.test(status)) {
            const data = status === 204 ? {} : JSON.parse(response)
            this.handleSuccess(status, action, model, _primaryKey, actionName, modelName, resolve, data)
            return
          }
          const error = new Error()
          error.status = status
          error.response = response
          this.handleError(actionName, modelName, _primaryKey, _attributes[_primaryKey], reject, error)
        }
      })
      xhr.addEventListener("error", error =>
        this.handleError(actionName, modelName, _primaryKey, _attributes[_primaryKey], reject, error)
      )
      if (method === "GET") {
        xhr.send()
        return
      }
      xhr.send(JSON.stringify(bodyWithoutInterpolations))
    })
  }

  handleSuccess(responseStatus, action, model, _primaryKey, actionName, modelName, resolve, data) {
    /* 
     *  Getting this far means no errors occured processing
     *  the returned JSON or with the HTTP statuses
     */
    const isCollection = data instanceof Array
    let resource = null
    /* Successful requests don't need a body */
    const _request = { status: responseStatus }
    if (!isCollection) {
      if (!data.hasOwnProperty(_primaryKey) && action._attributes && action._attributes.hasOwnProperty(_primaryKey)) {
        data[_primaryKey] = action._attributes[_primaryKey]
      }
      resource = new model({ ...data, _request }, true)
    } else {
      const _collection = data.map(attrs => new model({ ...attrs, _request }, true))
      resource = new Collection({ _collection, _request, _primaryKey })
    }
    this.dispatch({
      ...resource.serialize(),
      type: `@OK_${actionName}(${modelName})`
    })
    resolve(resource)
  }

  handleError(actionName, modelName, _primaryKey, key, reject, error) {
    const { status, response } = error
    /* 
     *  If the error does not have a response property,
     *  it's a generic error, which should be rejected
     *  immediately.
     */
    if (!response) {
      return reject(error)
    }
    const handleBody = body => {
      const wasCollection = actionName === "INDEX"
      const hasErrors = body.hasOwnProperty("errors")
      const _request = { status, body }
      const _errors = hasErrors ? body.errors : {}
      const errorObj = { _request }

      if (!wasCollection && key !== undefined) {
        errorObj._attributes = { [_primaryKey]: key }
      }
      if (hasErrors) {
        errorObj._errors = _errors
      }
      this.dispatch({ ...errorObj, type: `@ERROR_${actionName}(${modelName})` })
      reject(errorObj)
    }

    response
      .json()
      .then(handleBody)
      .catch(() => handleBody({ message: "Error processing JSON response." }))
  }
}
