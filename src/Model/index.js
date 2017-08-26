export default class Model {
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
