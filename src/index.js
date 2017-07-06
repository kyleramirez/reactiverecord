import Sugar from "./sugar"
import "whatwg-fetch"
import diff from "object-diff"
import {
  isEmptyObject, setReadOnlyProps, setWriteableProps, recordDiff,
  buildRouteFromInstance, pruneDeep, getKey
} from "./utils"
import {
  actionMatch, singleRecordProps, recordProps, versioningProps, restVerbs
} from "./constants"

export class ReactiveRecord {
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

  dispatch({ type, ...args }) {
    return(JSON.stringify({ type, ...args }))
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
    Object.defineProperty(this, "_pristine",   { value:this.serialize })
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
  get serialize(){ return JSON.parse(JSON.stringify(this)); }

  // Dirty
  get diff() {
    return diff.custom({
      equal: recordDiff
    }, this._pristine, this.serialize)
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

  // Persistence
  static create(attrs) { return new this(attrs).save() }
  get updateAttributes() {
    return (attributes={})=>{
      Object.assign(this, attributes)
      return this.save()
    }
  }
  get updateAttribute() {
    return (name, value)=>{
      this[name] = value;
      return this.save({validate: false})
    }
  }
  get save() {
    const action = this._persisted? "UPDATE" : "CREATE",
          attributes = this._persisted? this.diff : pruneDeep(this._attributes)
    return options => this.constructor.dispatch({ action, attributes })
  }
  get destroy() {
    return query => this.constructor.destroy(getKey.call(this), query)
  }
  static destroy(key, query) {
    return this.dispatch({ action:"DESTROY", key, query })
  }

  // Remote
  static find(key, query) { return this.dispatch({ action:"SHOW", key, query }) }
  static all(query) { return this.dispatch({ action:"INDEX", query }) }
  static load(query) { return this.all(query) }
  get reload() {
    const {constructor:{store:{singleton=false}}} = this;
    return query => singleton? this.constructor.all(query) : this.constructor.find(getKey.call(this), query);
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
