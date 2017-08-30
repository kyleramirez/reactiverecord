import diff from "object-diff"
import {
  setReadOnlyProps, setWriteableProps, getKey,
  skinnyObject, getRouteAttributes, recordDiff,
  setDefaultValues, buildRouteFromInstance, assignLeft,
  without
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
  static dispatch({ action, ...args }) {
    const { displayName, ReactiveRecord } = this,
          type = `@${action}(${displayName})`;
    return ReactiveRecord.dispatch({ type, ...args })
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
    const action = this._persisted? "UPDATE" : "CREATE",
          attributes = this.diff;
    return ({ query={} }={}) => {
      const submit = { action, attributes, query }
      Object.assign(submit.attributes, this.routeAttributes(action, query))
      return this.constructor.dispatch(submit)
    }
  }
  get destroy() {
    return (_query={}) => {
      const attributes = this.routeAttributes("DESTROY", _query),
            query = _query::without(...Object.keys(attributes));
      return this.constructor.dispatch({ action:"DESTROY", attributes, query })
    }
  }

  static destroy(key, _query={}) {
    const { _primaryKey="id" } = this.schema;
    const [ attributes, query ] = assignLeft({ [_primaryKey]:key }, _query)
    return this.dispatch({ action:"DESTROY", attributes, query })
  }

  /* Remote */
  static find(key, _query={}) {
    const { _primaryKey="id" } = this.schema;
    const [ attributes, query ] = assignLeft({ [_primaryKey]:key }, _query)

    return this.dispatch({ action:"SHOW", attributes, query })
  }
  static all(query={}) {
    return this.dispatch({ action:"INDEX", attributes: {}, query })
  }
  static load(query) { return this.all(query) }
  get reload() {
    const {constructor:{store:{singleton=false}}} = this;
    return query => {
      if (singleton) return this.constructor.all(query)
      return this.constructor.find(this::getKey()[1], query)
    } 
  }

  /* Validations */
  static validations = {}
  static validationsFor() {}
  get isValid() {}
  get isInvalid() {}
}
