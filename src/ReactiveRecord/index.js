import Model from "./Model"
import {
  isEmptyObject, generateId, interpolateRoute,
  skinnyObject, checkResponseStatus
} from "./utils"
import {
  collectionProps, ACTION_MATCHER, ACTION_METHODS,
  ROUTE_NOT_FOUND_ERROR
} from "./constants"
import Collection from "./Collection"
import Request from "./Request"

export default class ReactiveRecord {
  models = {}
  model(modelStr, modelClass=false){
    /* If we're just retrieving a model */
    if (!modelClass) {
      if (typeof this.models[modelStr] === "undefined")
        throw new ReferenceError(`Model ${modelStr} is not a recognized ReactiveRecord Model.`);
      return this.models[modelStr];
    }
    /* Check if it's an instance of model */
    if (!(modelClass.prototype instanceof Model))
      throw new TypeError(`Model ${modelStr} needs to inherit from ReactiveRecord's Model.`)
    /* Check if there's a schema that isn't empty */
    if (modelClass.schema === undefined || isEmptyObject(modelClass.schema))
      throw new TypeError(`Model #<${modelStr}> needs a valid schema.`)
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
            },
            store:{
              singleton=false
            }={}
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
    diffMode: true
  }
  setAPI(opts){
    const { prefix, delimiter, credentials, diffMode } = this.API,
    { headers={} } = opts;
    ({
      prefix:this.API.prefix=prefix,
      delimiter:this.API.delimiter=delimiter,
      credentials:this.API.credentials=credentials,
      diffMode:this.API.diffMode=diffMode
    } = opts);
    Object.assign(this.API.headers, headers);
  }

  performAsync(action) {
    return new Promise((resolve, reject)=>{
      const [,, actionName, modelName] = action.type.match(ACTION_MATCHER),
            model = this.models[modelName],
            { store:{ singleton=false } } = model,
            { query={}, attributes:body={} } = action,
            { headers, credentials, ...apiConfig } = this.API,
            routeTemplate = model.routes[actionName.toLowerCase()];

      if (!routeTemplate) throw new ROUTE_NOT_FOUND_ERROR;

      /* interpolateRoute will mutate body as needed */
      const route = interpolateRoute(routeTemplate, body, modelName, singleton, apiConfig, query),
            method = ACTION_METHODS[actionName.toLowerCase()];
      /* skinnyObject will remove body if it it's null */
      const request = skinnyObject({ method, body, headers, credentials });

      let responseStatus = null;
      fetch(route, request)
        .then(checkResponseStatus)
        .then(res=>{
          responseStatus = res.status;
          return res.json()
        })
        .then(data=>{
          /* Getting this far means no errors occured */
          const isCollection = data instanceof Array;
          let resource = null;
          const _request = { status: responseStatus, original:{ route, request } }
          if (!isCollection) {
            resource = new model({...data, _request }, true)
          }
          else {
            const collection = data.map( attrs => (new model({...attrs, _request:{ status: responseStatus } }, true)))
            resource = new Collection(...collection)
            resource._request = new Request({ ..._request })
          }
          resolve(resource)
          this.dispatch({ ...resource.serialize(), type:`@OK_${actionName}(${modelName})` })
        })
        .catch(({ status, response }) =>{
          response.json().then(body=>{
            // const wasCollection = actionName == "INDEX" || actionName == "SHOW"
            // if (wasCollection) reject({ status, body })
            // else {
            //
            // }
          })
        })
    })
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
