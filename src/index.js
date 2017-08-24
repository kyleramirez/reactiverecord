import Sugar from "./sugar"
import diff from "object-diff"
import { combineReducers } from "redux"
import {
  isEmptyObject, setReadOnlyProps,
  setWriteableProps, recordDiff,
  buildRouteFromInstance, pruneDeep,
  getKey, interpolateRoute,
  getRouteAttributes, checkResponseStatus,
  skinnyObject, generateID
} from "./utils"
import {
  requestProps, memberProps,
  collectionProps, ACTION_MATCHER,
  ROUTE_NOT_FOUND_ERROR, ROUTE_TOKENIZER,
  ACTION_STATUSES, ACTION_METHODS,
  MODEL_NOT_FOUND_ERROR
} from "./constants"
export reducer from "./reducer"
export middleware from "./middleware"
export ReactiveRecordProvider from "./components/Provider"
export withTransformed from "./components/withTransformed"

export class ReactiveRecord {
  /* ReactiveModel */
  models = {}
  model(modelStr, modelClass=false){
    // If we're just retrieving a model
    if (!modelClass) {
      if (typeof this.models[modelStr] === "undefined")
        throw new ReferenceError(`Model ${modelStr} is not a recognized ReactiveRecord Model.`);
      return this.models[modelStr];
    }
    // Check if it's an instance of model
    if (!(modelClass.prototype instanceof Model))
      throw new TypeError(`Model ${modelStr} needs to inherit from ReactiveRecord's Model.`)
    // Check if there's a schema that isn't empty
    if (typeof modelClass.schema === "undefined" || isEmptyObject(modelClass.schema))
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
    this.models[modelStr] = modelClass;
  }

  /* ReactiveAPI */
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

  /* ReactiveStore */
  get combineReducers() {
    return reducers => combineReducers({
      ...reducers,
      ReactiveRecord: this::reducer()
    })
  }

  registerStore(store) {
    this.dispatch = store.dispatch;
    return store;
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

      const route = interpolateRoute(routeTemplate, body, modelName, singleton, apiConfig, query),
            method = ACTION_METHODS[actionName.toLowerCase()];
      let responseStatus = null;

      fetch(route, { method, body:JSON.stringify(body), headers, credentials })
        .then(checkResponseStatus)
        .then(res=>{
          responseStatus = res.status;
          return res.json()
        })
        .then(data=>{
          const isCollection = data instanceof Array;
          let resource = null;
          if (!isCollection) {
            resource = (new model({...data, _request:{ status: responseStatus }}))
          }
          else {
            const collection = data.map( attrs => (new model({...attrs, _request:{ status: responseStatus }})))
            resource = new ReactiveRecordCollection(...collection)
            resource._request = new ReactiveRecordRequest({ status: responseStatus })
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
    this.instanceID = generateID();

    return Object.keys(models).reduce(function(state, modelName){
      state[modelName] = models[modelName].store.singleton?
        {...memberProps}
      :
        {...collectionProps}
      return state;
    }, { instanceId: this.instanceID })
  }
}
export default new ReactiveRecord;

class ReactiveRecordRequest {
  constructor({status=null, body=null}){
    this.status=status;
    this.body=body;
  }
  get clear(){ return ()=>{
    this.status=null;
    this.body=null;
  } }
}
class ReactiveRecordErrors {
  //Each attribute in the schema gets an array, empty or not
  // Also provide a clear function
  // Errors populate in real time according to the value of the
  // field, or server errors populate after returning from
  // a request.
  // Object.defineProperty(_obj, "errors", {
  //   enumerable: false,
  //   value:{...params.errors}
  // })
  // Object.defineProperty(_obj.errors, "clear", {
  //   enumerable: false,
  //   value: ()=>{for (let property in _obj.errors) if (property != "clear") delete _obj.errors[property]}
  // })
  //
}
class ReactiveRecordCollection extends Array {
  _request = {}
  serialize = () => skinnyObject(this)
  toJSON = ()=> {
    let collection = {}
    if (this.length) {
      const [{ constructor:{ schema:{ _primaryKey="id" } } }] = this;
      collection = this.reduce(
        function(collection, member) {
          const { [_primaryKey]:key } = member;
          collection[key] = member.serialize();
          return collection;
        },
        {}
      )
    }
    return {
      request:this._request,
      collection
    }
  }
}

export class Model {
  constructor(attrs={}, persisted=false) {
    const modelName = this.constructor.displayName,
          model = this.ReactiveRecord.models[modelName];
    // Define the internal record
    Object.defineProperty(this, "_attributes", { value:{} })

    setReadOnlyProps.call(this, attrs, persisted);
    setWriteableProps.call(this, attrs);

    Object.defineProperty(this, "_request", {
      value:new ReactiveRecordRequest({...attrs._request})
    });

    Object.defineProperty(this, "_errors", {
      value:new ReactiveRecordErrors({...attrs._errors})
    });

    // Define the internal pristine record
    Object.defineProperty(this, "_pristine",   { value:skinnyObject(this._attributes) })
    Object.freeze(this._pristine)
  }

  // ReactiveRecord
  get ReactiveRecord(){ return this.constructor.ReactiveRecord }
  static dispatch({ action, key, ...args }) {
    const { displayName, ReactiveRecord, schema:{ _primaryKey="id" } } = this,
          type = `@${action}(${displayName})`;
    if (key) {
      args.attributes = args.attributes || {}
      args.attributes[_primaryKey] = key;
    }
    return ReactiveRecord.dispatch({ type, ...args })
  }
  static store = { singleton: false }

  // Serialization
  serialize(){
    return skinnyObject(this)
  }
  toJSON() {
    return {
      attributes: this._attributes,
      errors: this._errors,
      request: this._request
    }
  }

  // Dirty
  get diff() {
    return diff.custom({
      equal: recordDiff
    }, this._pristine, skinnyObject(this._attributes))
  }
  get changedAttributes() { return Object.keys(this.diff) }
  get isPristine() { return !!!this.changedAttributes.length }
  get isDirty() { return !this.isPristine }
  get attributeChanged() {
    return attr => (this.changedAttributes.indexOf(attr) > -1)
  }

  // Routes
  get routeFor() {
    return (action, query={}) => buildRouteFromInstance.call(this, action, query)
  }
  get routeAttributes(){
    return (action, query={}) => getRouteAttributes.call(this, action, query)
  }

  // Persistence
  static create(attrs, options) { return new this(attrs).save(options) }
  get updateAttributes() {
    return (attributes={}, options)=>{
      Object.assign(this, attributes)
      return this.save(options)
    }
  }
  get updateAttribute() {
    return (name, value, options={})=>{
      this[name] = value;
      return this.save({...options, validate: false})
    }
  }
  get save() {
    const action = this._persisted? "UPDATE" : "CREATE",
          attributes = this._persisted? this.diff : pruneDeep(this._attributes)
    return ({ query={} }={}) => {
      const submit = { action, attributes, query }
      Object.assign(submit.attributes, this.routeAttributes(action, query))
      return this.constructor.dispatch(submit)
    }
  }
  get destroy() {
    return (query={}) => {
      Object.assign(query, this.routeAttributes("DESTROY", query))
      return this.constructor.destroy(getKey.call(this), query)
    }
  }
  static destroy(key, query) {
    return this.dispatch({ action:"DESTROY", key, query })
  }

  // Remote
  static find(key, query={}) {
    return this.dispatch({ action:"SHOW", key, query })
  }
  static all(query={}) {
    return this.dispatch({ action:"INDEX", query })
  }
  static load(query) { return this.all(query) }
  get reload() {
    const {constructor:{store:{singleton=false}}} = this;
    return query => {
      if (singleton) return this.constructor.all(query)
      return this.constructor.find(getKey.call(this), query)
    } 
  }

  // Validations
  static validations = {}
  static validationsFor() {}
  get isValid() {}
  get isInvalid() {}
}



// SHOULD MAKE A LOT OF THESE "GETTERS", which don't require a () after the method unless parameters are required
// Index     Model.all(params)
//
// Create    instance.save(options)
//           instance.updateAttributes(attributes)
//           instance.updateAttribute(key, value)
//           Model.create(attributes)
//
// Show      instance.reload()
//           Model.find(key)
//           Model.load(key)
//
// Update    instance.save(options)
//           instance.updateAttributes(attributes)
//           instance.updateAttribute(key, value)
//           Model.update(attributes) <- for singletons
//
// Destroy   instance.destroy()
//           instance.delete()
//           Model.delete(key)
//
// Model.schema._primaryKey
//
// instance.serialize()

/*** Dirty ***/
// instance.diff
// instance.changedAttributes
// instance.isPristine ?
// instance.isDirty ?
// instance.attributeChanged(attributeName) ?

/*** Persistence ***/
// instance._persisted ?

/*** Routes ***/
// Model.routes
// instance.routeFor(action)

/*** Validations ***/
// Model.validations()
// Model.validationsFor(attributeName)
// instance.isValid(includeRemoteValidations) ?
// instance.isInvalid(includeRemoteValidations) ?


// Model.attributeNames()
// Model.associationNames()
//
// // On collections
// class ReactiveRecordCollection extends Array { first(){} last(){} sortBy(){} }
// collection.first()
// collection.last()
// collection.sortBy(keyStr)
//
// @beforeValidation
// @afterValidation
// @beforeSave
// @afterSave
// @beforeCreate
// @afterCreate
// @afterError
// @beforeUpdate
// @afterUpdate
// @beforeDestroy
// @afterDestroy
//
// schema {
//   attr: String,
//   attr: { type: Boolean, default: false }
// }
// routes = {
//   only: ["index", "create", "show", "update", "destroy"],
//   except: ["index", "create", "show", "update", "destroy"],
//   index: "",
//   create: "",
//   show: "",
//   update: "",
//   destroy: "",
// }
// actions possible attributes { type, attributes, key, query }
// { type:"@DESTROY(Contact)", key:123 }
// Fart.create({}, { query:{ page: 2 } })
// {"type":"@CREATE(Fart)","attributes":{},"query":{"page":2}}
//
// Fart.destroy(123, { page: 2 })
// {"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}}
//
// Fart.find(123, { page: 2 })
// {"type":"@SHOW(Fart)","query":{"page":2},"attributes":{}}
//
// Fart.all({ page: 2 })
// {"type":"@INDEX(Fart)","query":{"page":2}}
//
// Fart.load({ page: 2 })
// {"type":"@INDEX(Fart)","query":{"page":2}}
//
// fart.reload({ page: 2 })
// {"type":"@INDEX(Fart)","query":{"page":2}}
//
// fart.updateAttributes({cling:"sing"}, { query:{ page: 2 } })
// {"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}}
//
// fart.updateAttribute("cling", "sing", { query:{ page: 2 } })
// {"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}}
//
// fart.save({ query:{ page: 2 } })
// {"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}}
//
// fart.destroy({ page: 2 })
// {"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}}
//
//
//
//
// store.dispatch({"type":"@CREATE(Fart)","attributes":{},"query":{"page":2}})
// store.dispatch({"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}})
// store.dispatch({"type":"@SHOW(Fart)","query":{"page":2},"attributes":{}})
// store.dispatch({"type":"@INDEX(Fart)","query":{"page":2}})
// store.dispatch({"type":"@INDEX(Fart)","query":{"page":2}})
// store.dispatch({"type":"@INDEX(Fart)","query":{"page":2}})
// store.dispatch({"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}})
// store.dispatch({"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}})
// store.dispatch({"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}})
// store.dispatch({"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}})

