import Model from "../Model"
import {
  isEmptyObject,
  generateId,
  interpolateRoute,
  skinnyObject,
  checkResponseStatus,
  without, pick
} from "../utils"
import {
  collectionProps,
  ACTION_MATCHER,
  ACTION_METHODS,
  ROUTE_NOT_FOUND_ERROR,
  MODEL_NOT_FOUND_ERROR,
  MODEL_NOT_VALID_ERROR,
  memberProps
} from "../constants"
import Collection from "./Collection"
import Request from "./Request"

export default class ReactiveRecord {
  models = {}
  model(modelStr, modelClass=false){
    /* If we're just retrieving a model */
    if (!modelClass) {
      if (typeof this.models[modelStr] === "undefined")
        throw new MODEL_NOT_FOUND_ERROR(modelStr)
      return this.models[modelStr];
    }
    /* Check if it's an instance of model */
    if (!(modelClass.prototype instanceof Model))
      throw new MODEL_NOT_VALID_ERROR(modelStr)
    // Assign the model's parent
    modelClass.ReactiveRecord = this;
    // Assign the model's name
    modelClass.displayName = modelStr;

    // Interpolate the model's routes
    const {
            routes:{
              only=[], except=[], ...definedRoutes
            }={},
            schema:{
              _primaryKey="id"
            }
          } = modelClass,
          defaultRoutes = ["index", "create", "show", "update", "destroy"]
            // Removes routes if except defined
            .filter(function(action){ return except.indexOf(action) == -1 })
            // Remove routes if only defined
            .filter(function(action){ return !only.length || only.indexOf(action) > -1 });
    modelClass.routes = defaultRoutes.reduce((routes, action) => {
      let generatedRoute = ":prefix/:modelname"
      if (action.match(/^(show|update|destroy)$/)) generatedRoute += `/:${_primaryKey}`
      routes[action] = routes[action] || generatedRoute;
      return routes;
    }, definedRoutes)

    // Assign the model
    return this.models[modelStr] = modelClass;
  }

  API = {
    prefix: "",
    delimiter: "-",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    patchMode: true
  }

  setAPI(opts){
    const { prefix, delimiter, credentials, patchMode } = this.API,
    { headers={} } = opts;
    ({
      prefix:this.API.prefix=prefix,
      delimiter:this.API.delimiter=delimiter,
      credentials:this.API.credentials=credentials,
      patchMode:this.API.patchMode=patchMode
    } = opts);
    Object.assign(this.API.headers, headers);
  }

  performAsync(action) {
    return new Promise((resolve, reject)=>{
      const [,, actionName, modelName] = action.type.match(ACTION_MATCHER),
            model = this.models[modelName];

      if (!model) throw new MODEL_NOT_FOUND_ERROR(modelName);

      const {
              store: { singleton=false },
              schema: { _primaryKey="id" }
            } = model,
            { _attributes={} } = action,
            { headers, credentials, ...apiConfig } = this.API,
            routeTemplate = model.routes[actionName.toLowerCase()],
            method = ACTION_METHODS[actionName.toLowerCase()],
            query = method == "GET" ? _attributes : _attributes::without(...Object.keys(model.schema)),
            body = method == "GET" ? {} : _attributes::pick(...Object.keys(model.schema));

      if (!routeTemplate) throw new ROUTE_NOT_FOUND_ERROR;

      /* interpolateRoute will mutate body as needed */
      const route = interpolateRoute(routeTemplate, body, modelName, singleton, apiConfig, query);
      /* skinnyObject will remove body if it it's null */
      const request = skinnyObject({ method, body, headers, credentials });

      let responseStatus = null;
      fetch(route, request)
        .then(checkResponseStatus)
        .then(res=>{
          responseStatus = res.status;
          return res.json()
        })
        .then(this.handleSuccess.bind(this, responseStatus, method, action, model, _primaryKey, actionName, modelName, resolve))
        .catch(this.handleError.bind(this, actionName, reject))
    })
  }

  handleSuccess(responseStatus, method, action, model, _primaryKey, actionName, modelName, resolve, data) {
    /* 
     *  Getting this far means no errors occured processing
     *  the returned JSON or with the HTTP statuses
     */
    const isCollection = data instanceof Array;
    let resource = null;
    const _request = { status: responseStatus, dispatch: this.dispatch }
    if (method == "GET") _request.action = action;
    /* Successful requests don't need a body */
    if (!isCollection) {
      resource = new model({ ...data, _request }, true)
    }
    else {
      const _collection = data.map( attrs => new model({...attrs, _request: { status: responseStatus }}, true) )
      resource = new Collection({ _collection, _request, _primaryKey });
    }
    resolve(resource)
    this.dispatch({ ...resource.serialize(), type:`@OK_${actionName}(${modelName})` })
  }

  handleError(actionName, reject, error) {
    const { status, response } = error;
    /* 
     *  If the error does not have a response property,
     *  it's a generic error, which should be rejected
     *  immediately.
     */
    if (!response) return reject(error);

    if (response && response.hasOwnProperty("json")) {
      response.json().then( body =>{
        const wasCollection = actionName == "INDEX" || actionName == "SHOW"
        if (wasCollection) reject({ status, body })
        else {

        }
      })
    }
  }

  get initialState() {
    const { models } = this;
    this.instanceId = generateId();

    return Object.keys(models).reduce(function(state, modelName){
      state[modelName] = models[modelName].store.singleton?
        {...memberProps}
      :
        {...collectionProps}
      return state;
    }, { instanceId: this.instanceId })
  }
}
