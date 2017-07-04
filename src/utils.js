import Sugar from "./sugar"
import { actionMatch, singleRecordProps, recordProps, versioningProps, restVerbs } from "./constants"
/* ReactiveRecord */
export function isEmptyObject(obj){
  for (let name in obj) {
    return false;
  }
  return true;
}

export function generateID() {
  function s4(){
    return Math
      .floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `_${s4()+s4()+s4()}${s4()+s4()+s4()}`;
}

export function pruneDeep(obj){
  return function prune(current){
    for (let key in current) {
      if (current.hasOwnProperty(key)) {
        if (current[key] instanceof Array){
          current[key] = pruneArray(current[key])
        }

        let value = current[key];
        if (typeof value === "undefined" || value == null ||
            (value != null && typeof value === "object" && isEmptyObject(prune(value))) ||
            (value instanceof Array && value.length === 0)
           ) {
          delete current[key]
        }
      }
    }
    return current
  }(Object.assign({}, obj))
}

export function pruneArray(arr) {
  const newArray = new Array();
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] != null && typeof arr[i] === "object")
      arr[i] = pruneDeep(arr[i])

    if (typeof arr[i] === "undefined" || arr[i] === null) continue;
    if (typeof arr[i] === "object" && isEmptyObject(arr[i])) continue;
    if (typeof arr[i] === "number" && isNaN(arr[i])) continue;

    newArray.push(arr[i]);
  }
  return newArray;
}

export function regexIndexOf(regex, string, startpos=0){
  var indexOf = string.substring(startpos).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

export function checkResponseStatus(response){
  const {status} = response,
        error = new Error;
  // If no error, great, return the response.
  if (status >= 200 && status < 300)
    return response

  // Begin parsing this error
  error.status = status
  error.response = response
  throw error
}

export function routePermitted({ only, except }, method) {
  if ((only instanceof Array && only.indexOf(method) === -1) || (typeof only === "string" && only !== method))
    return false
  if ((except instanceof Array && except.indexOf(method) !== -1) || (typeof except === "string" && except === method))
    return false
  return true
}

export function generateRoute(name, method, apiDelimiter, prefix, index=false, isSingleton) {
  /*
  GET    /stories      #index
  GET    /stories/:id  #show
  POST   /stories      #create
  PUT    /stories/:id  #update
  DELETE /stories/:id  #destroy
  */
  const delimiter = delimiterType(apiDelimiter),
        modelInflection = isSingleton ? name : Sugar.String.pluralize(name),
        modelWithDelimiter = `/${Sugar.String[delimiter](modelInflection)}`,
        id = method === "POST" || index ? "" : "/:id";
  return `${prefix}${modelWithDelimiter}${id}`
}
/* ReactiveRecord */
export function interpolateRoute(route, attributes, resourceName, singular, apiConfig) {
  const { prefix } = apiConfig,
        delimiter = delimiterType(apiConfig.delimiter),
        modelInflection = singular? resourceName : Sugar.String.pluralize(resourceName),
        modelWithDelimiter = `${Sugar.String[delimiter](modelInflection)}`;
  return route.replace(":modelname", modelWithDelimiter)
              .replace(":prefix", prefix)
              .replace(/:([^\/\?]*)/g, (match, capture)=>(
    attributes.hasOwnProperty(capture) && attributes[capture] ? attributes[capture] : match
  ))
}
/* ReactiveRecord */
export function delimiterType(delim="") {
  if (delim.match(/^(underscores?|_)$/)) return "underscore"
  return "dasherize"
}
/* ReactiveRecord */
export function setReadOnlyProps(attrs, persisted) {
  const { constructor } = this,
        { schema:{ _primaryKey="id", _timestamps} } = constructor,
        {
          // Single primary key
          [_primaryKey]:tmpKeyValue=null,
          // Allow id or _id by default
          [_primaryKey=="id"? "_id" : _primaryKey]:finalKeyValue=tmpKeyValue
        } = attrs;
        this._attributes[_primaryKey] = finalKeyValue;

  Object.defineProperty(this, "_persisted", { value: !!persisted })

  Object.defineProperty(this, _primaryKey, {
    enumerable: true,
    value: this._attributes[_primaryKey]
  });

  if (_timestamps) {
    // Timestamps aren't something we're going to ever
    // update on the record, so let's separate it early on
    // createdAt and updatedAt can be either created_at or updated_at on the model

    const createdAt = attrs.created_at || attrs.createdAt || null
    Object.defineProperty(this, "createdAt", {
      enumerable: true,
      value: createdAt? new Date(createdAt) : null
    })

    const updatedAt = attrs.updated_at || attrs.updatedAt || null
    Object.defineProperty(this, "updatedAt", {
      enumerable: true,
      value: updatedAt? new Date(updatedAt) : null
    })
  }
}
/* ReactiveRecord */
export function setWriteableProps(attrs){
  const { constructor } = this,
        { schema:{ _primaryKey, _timestamps, ...schema } } = constructor;
  for (let prop in schema){
    const hasDescriptor = typeof schema[prop] === "object",
          // Establish a default value from the schema
          defaultValue = hasDescriptor? (schema[prop].default || null) : null,
          // Establish initial value but fallback to default value
          initialValue = JSON.parse(JSON.stringify(attrs.hasOwnProperty(prop) ? attrs[prop] : defaultValue)),
          // Establish type from descriptor
          type = hasDescriptor? schema[prop].type : schema[prop].name;

    // Write default value
    this._attributes[prop] = initialValue;

    let get = ()=>(this._attributes[prop])
    // @TODO: The set function should dispatch an action that something was set, which
    // would be used to increase the version number, and thus invalidate errors
    let set = (newValue)=>{
      return this._attributes[prop] = newValue
    }

    if (type === "Object")
      get = ()=> (this._attributes[prop] || {})
    if (type === "Array")
      get = ()=> (this._attributes[prop] || [])
    if (type === "Date")
      get = ()=> (this._attributes[prop] === null ? null : new Date(this._attributes[prop]))
    if (type === "Number")
      get = ()=> (this._attributes[prop] === null ? null : Number(this._attributes[prop]))
    if (type === "Boolean") {
      if (this._attributes[prop] !== null) {
        this._attributes[prop] = initialValue === "false" ? false : Boolean(initialValue)
      }
      set = (newValue)=>{
        return this._attributes[prop] = newValue === "false" ? false : Boolean(newValue)
      }
    }

    Object.defineProperty(this, prop, { get, set, enumerable: true })
  }
}
/* ReactiveRecord */
export function recordDiff(a,b) {
  if (a instanceof Array && b instanceof Array)
    return JSON.stringify(a) === JSON.stringify(b);
  if (a instanceof Date && b instanceof Date)
    return JSON.stringify(a) === JSON.stringify(b);
  if (a !== null && typeof a === "object" && b !== null && typeof b === "object")
    return JSON.stringify(a) === JSON.stringify(b);
  return a === b;
}

export function mergeRecordsIntoCache(cache, records, keyStr, model) {
  // Get the records ready for the cache
  const recordsForCache = records.map(record=>({...singleRecordProps, record: createThisRecord(model, record)}));
        // Remove anything in the cache that matches keys in the records
  const filteredCache = cache.filter(cacheItem=>{
          let match = false;
          recordsForCache.map(recordsItem=>{
            if (recordsItem.record[keyStr] == cacheItem.record[keyStr]) match = true
          })
          return !match
        })
  // Finally, merge the new records and the filtered records
  return [].concat(filteredCache, recordsForCache);
}

export function createThisRecord(model, rawRecord) {
  const newInstance = new model(rawRecord)
  return { ...newInstance.record, ...newInstance.timestamps }
}

export function tmpRecordProps(){
  return({
    id: generateID(),
    ...versioningProps,
    ...recordProps,
    creating: false
  });
};
/* ReactiveRecord */
export function objToQueryString(obj) {
  return Object.keys(obj).reduce( (final, current) => {
    const prefix = final.length? "&" : "?",
          key = encodeURIComponent(current),
          value = encodeURIComponent(obj[current]);
    return `${final}${prefix}${key}=${value}`;
  }, "" )
}
/* ReactiveRecord */
export function buildRouteFromInstance(action, query) {
  const {
    constructor:{ routes, displayName, store:{ singleton:singular=false }={} },
    _attributes,
    ReactiveRecord:{ API:config }
  } = this;
  if (!routes[action]) throw new ReferenceError("The specified route is either not found or not permitted");
  return interpolateRoute(
    routes[action],
    _attributes,
    displayName,
    singular,
    config
  ) + objToQueryString(query)
}