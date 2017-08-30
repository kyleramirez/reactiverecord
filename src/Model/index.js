import diff from "object-diff"
import {
  setReadOnlyProps, setWriteableProps, getKey,
  skinnyObject, getRouteAttributes, recordDiff,
  setDefaultValues, buildRouteFromInstance, assignLeft,
  without, queryStringToObj
} from "../utils"
import Request from "../ReactiveRecord/Request"
import Errors from "./Errors"

export default class Model {
  constructor(attrs={}, persisted=false) {
    const modelName = this.constructor.displayName,
          model = this.ReactiveRecord.models[modelName];

    Object.defineProperty(this, "_attributes", { value:{} })
    Object.defineProperty(this, "_request", { value:new Request({...attrs._request}) });
    Object.defineProperty(this, "_errors", { value:new Errors({...attrs._errors}) });

    this::setReadOnlyProps(attrs, persisted);
    this::setWriteableProps(attrs);

    Object.defineProperty(this, "_pristine", { value: skinnyObject(this._attributes) })
    Object.freeze(this._pristine)

    this::setDefaultValues(attrs)
  }

  /* ReactiveRecord */
  get ReactiveRecord() { return this.constructor.ReactiveRecord }
  static dispatch({ action, attributes }) {
    const { displayName, ReactiveRecord } = this,
          type = `@${action}(${displayName})`;
    return ReactiveRecord.dispatch({ type, attributes })
  }
  static store = { singleton: false }
  static schema = {}

  /* Serialization */
  serialize() {
    return skinnyObject(this)
  }
  toJSON() {
    return {
      _attributes: this._attributes,
      _errors: this._errors,
      _request: this._request
    }
  }

  /* Dirty */
  get diff() {
    return diff.custom(
      { equal: recordDiff },
      this._persisted ? this._pristine : (new this.constructor)._pristine,
      skinnyObject(this._attributes)
    )
  }
  get changedAttributes() { return Object.keys(this.diff) }
  get isPristine() { return !!!this.changedAttributes.length }
  get isDirty() { return !this.isPristine }
  get attributeChanged() {
    return attr => (this.changedAttributes.indexOf(attr) > -1)
  }

  /* Routes */
  get routeFor() {
    return (action, query={}) => this::buildRouteFromInstance(action, query);
  }
  get routeAttributes(){
    /* Returns all attributes needed from this resource to build the route */
    return (action, query={}) => this::getRouteAttributes(action, query);
  }

  /* Persistence */
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
      return this.save({ ...options, validate: false })
    }
  }
  get save() {
    const action = this._persisted ? "UPDATE" : "CREATE";
    return ({ query:_query={} }={}) => {
      const shouldDiff = this.ReactiveRecord.API.patchMode,
            attributesForRequest = shouldDiff ? this.diff : skinnyObject(this._attributes),
            query = typeof _query === "string" ? queryStringToObj(_query) : _query,
            attributes = Object.assign(attributesForRequest, this.routeAttributes(action, query), query);
      return this.constructor.dispatch({ action, attributes })
    }
  }
  get destroy() {
    const action = "DESTROY";
    return (_query={}) => {
      const query = typeof _query === "string" ? queryStringToObj(_query) : _query,
            attributes = Object.assign(this.routeAttributes(action, query), query);
      return this.constructor.dispatch({ action:"DESTROY", attributes })
    }
  }

  static destroy(key, _query={}) {
    const query = typeof _query === "string" ? queryStringToObj(_query) : _query,
          { _primaryKey="id" } = this.schema,
          attributes = Object.assign({ [_primaryKey]:key }, query);
    return this.dispatch({ action:"DESTROY", attributes });
  }

  /* Remote */
  static find(key, _query={}) {
    const query = typeof _query === "string" ? queryStringToObj(_query) : _query,
          { _primaryKey="id" } = this.schema,
          attributes = Object.assign({ [_primaryKey]:key }, query);
    return this.dispatch({ action:"SHOW", attributes });
  }
  static all(query={}) {
    const attributes = typeof query === "string" ? queryStringToObj(query) : query;
    return this.dispatch({ action:"INDEX", attributes })
  }
  static load(query) { return this.all(query) }
  get reload() {
    const { singleton=false } = this.constructor.store;
    return _query => {
      const query = typeof _query === "string" ? queryStringToObj(_query) : _query;
      if (singleton) return this.constructor.all(query)
      const [ _primaryKey, key ] = this::getKey(),
            findQuery = Object.assign(this.routeAttributes("SHOW", query), query)
      return this.constructor.find(findQuery[_primaryKey] || key, findQuery::without(_primaryKey))
    } 
  }

  /* Validations */
  static validations = {}
  static validationsFor() {}
  get isValid() {}
  get isInvalid() {}
}
