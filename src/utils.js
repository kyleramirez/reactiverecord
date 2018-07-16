import Sugar from "./sugar"
import { ROUTE_TOKENIZER, ROUTE_NOT_FOUND_ERROR } from "./constants"

export function skinnyObject(...args) {
  return args.reduce(function(final, arg) {
    return Object.assign(final, JSON.parse(JSON.stringify(arg)))
  }, Object.create(null, {}))
}

export function checkResponseStatus(response) {
  const { status } = response,
    error = new Error()
  /* If no error, great, return the response. */
  if (status >= 200 && status < 300) {
    return response
  }
  /* Begin parsing this error */
  error.status = status
  error.response = response
  throw error
}

export function interpolateRoute(
  route,
  originalAttributes,
  resourceName,
  singular,
  apiConfig,
  originalQuery
) {
  let query = { ...originalQuery }
  let attributes = { ...originalAttributes }
  const { prefix } = apiConfig,
    delimiter = delimiterType(apiConfig.delimiter),
    modelInflection = singular
      ? resourceName
      : Sugar.String.pluralize(resourceName),
    modelWithDelimiter = `${Sugar.String[delimiter](modelInflection)}`
  const interpolatedRoute =
    route
      .replace(":modelname", modelWithDelimiter)
      .replace(":prefix", prefix)
      .replace(ROUTE_TOKENIZER, (token, attributeName) => {
        let match = null
        if (attributes.hasOwnProperty(attributeName)) {
          match = attributes[attributeName]
        }
        if (query.hasOwnProperty(attributeName)) {
          match = query[attributeName]
        }
        attributes = attributes::without(attributeName)
        query = query::without(attributeName)
        return match || token
      }) + objToQueryString(query)
  return [interpolatedRoute, attributes]
}

export function delimiterType(delim = "") {
  if (delim.match(/^(underscores?|_)$/)) {
    return "underscore"
  }
  return "dasherize"
}

export function setReadOnlyProps(attrs, persisted) {
  const { constructor } = this,
    {
      schema: { _primaryKey = "id", _timestamps }
    } = constructor,
    {
      // Single primary key
      [_primaryKey]: tmpKeyValue = null,
      // Allow id or _id by default
      [_primaryKey === "id" ? "_id" : _primaryKey]: finalKeyValue = tmpKeyValue
    } = attrs
  this._attributes[_primaryKey] = finalKeyValue

  Object.defineProperty(this, "_persisted", {
    value: !!persisted,
    configurable: true
  })

  Object.defineProperty(this, _primaryKey, {
    enumerable: true,
    value: this._attributes[_primaryKey],
    configurable: true
  })

  if (_timestamps) {
    // Timestamps aren't something we're going to ever
    // update on the record, so let's separate it early on
    // createdAt and updatedAt can be either created_at or updated_at on the model

    const createdAt = attrs.created_at || attrs.createdAt || null
    Object.defineProperty(this, "createdAt", {
      enumerable: true,
      value: createdAt ? new Date(createdAt) : null,
      configurable: true
    })

    const updatedAt = attrs.updated_at || attrs.updatedAt || null
    Object.defineProperty(this, "updatedAt", {
      enumerable: true,
      value: updatedAt ? new Date(updatedAt) : null,
      configurable: true
    })
  }
}

export function setWriteableProps(attrs) {
  const { constructor } = this,
    {
      schema: { _primaryKey, _timestamps, ...schema },
      prototype
    } = constructor
  /* eslint-disable guard-for-in */
  for (let prop in schema) {
    const hasDescriptor =
        typeof schema[prop] === "object" && schema[prop].hasOwnProperty("type"),
      // Establish initial value but fallback to default value
      initialValue = JSON.parse(
        JSON.stringify(attrs.hasOwnProperty(prop) ? attrs[prop] : null)
      ),
      // Establish type from descriptor
      type = hasDescriptor
        ? schema[prop].type.displayName || schema[prop].type.name
        : schema[prop].name

    // Write default value
    this._attributes[prop] = initialValue

    const manuallyDefinedGetter = (Object.getOwnPropertyDescriptor(
        prototype,
        prop
      ) || {})["get"],
      manuallyDefinedSetter = (Object.getOwnPropertyDescriptor(
        prototype,
        prop
      ) || {})["set"]

    let get = manuallyDefinedGetter

    let set = manuallyDefinedSetter

    if (!manuallyDefinedGetter) {
      get = () => this._attributes[prop]
      if (type === "Object") {
        get = () => this._attributes[prop] || {}
      }
      if (type === "Array") {
        get = () => this._attributes[prop] || []
      }
      if (type === "Date") {
        get = () =>
          this._attributes[prop] === null
            ? null
            : new Date(this._attributes[prop])
      }
      if (type === "Number") {
        get = () =>
          this._attributes[prop] === null
            ? null
            : Number(this._attributes[prop])
      }
    }

    if (!manuallyDefinedSetter) {
      set = newValue => (this._attributes[prop] = newValue)
      if (type === "Boolean") {
        set = newValue => {
          return (this._attributes[prop] =
            newValue === "false" ? false : Boolean(newValue))
        }
      }
    }

    if (type === "Boolean") {
      if (this._attributes[prop] !== null) {
        this._attributes[prop] =
          initialValue === "false" ? false : Boolean(initialValue)
      }
    }

    Object.defineProperty(this, prop, {
      get,
      set,
      enumerable: true,
      configurable: true
    })
  }
  /* eslint-enable guard-for-in */
}

export function recordDiff(a, b) {
  if (a instanceof Array && b instanceof Array) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  if (a instanceof Date && b instanceof Date) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  if (
    a !== null &&
    typeof a === "object" &&
    b !== null &&
    typeof b === "object"
  ) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return a === b
}

export function diff(...subjects) {
  const length = subjects.length,
    ref = subjects[0],
    diff = {}
  for (let i = 1; i < length; i++) {
    const current = subjects[i],
      keys = Object.keys(current),
      keysLength = keys.length
    for (let u = 0; u < keysLength; u++) {
      const key = keys[u]
      if (!recordDiff(current[key], ref[key])) {
        diff[key] = current[key]
      }
    }
  }
  return diff
}

export function objToQueryString(obj, keyPrefix = "") {
  return Object.keys(obj).reduce((final, current) => {
    let delimiter = "?"
    if (final.length) {
      delimiter = "&"
    }
    if (keyPrefix && !final) {
      delimiter = ""
    }

    const initialValue = obj[current]
    let key = keyPrefix
      ? `${keyPrefix}[${encodeURIComponent(current)}]`
      : encodeURIComponent(current)
    let value = null
    if (typeof initialValue === "object" && !initialValue::isEmptyObject()) {
      value = objToQueryString(initialValue, key)
      return `${final}${delimiter}${value}`
    } else {
      value = encodeURIComponent(obj[current])
      return `${final}${delimiter}${key}=${value}`
    }
  }, "")
}

function tryTypeCastFromURL(item) {
  if (isNaN(item)) {
    if (item === "null") {
      return null
    }
    if (item === "undefined") {
      return undefined
    }
    if (item === "true") {
      return true
    }
    if (item === "false") {
      return false
    }
    return item
  }
  return parseFloat(item)
}

export function queryStringToObj(str) {
  let response = {}
  if (str) {
    response = JSON.parse(
      `{"${str
        .replace(/^\?/, "")
        .replace(/&/g, '","')
        .replace(/=/g, '":"')}"}`,
      function(k, v) {
        return k === "" ? v : decodeURIComponent(v)
      }
    )
    Object.keys(response).map(key => {
      const matches = key.split(/[\[\]]/).filter(Boolean)
      if (matches.length > 1) {
        matches.reduce((ref, nextKey, index, { length }) => {
          ref[nextKey] =
            ref[nextKey] ||
            (index + 1 === length ? tryTypeCastFromURL(response[key]) : {})
          return ref[nextKey]
        }, response)
        delete response[key]
      } else {
        response[key] = tryTypeCastFromURL(response[key])
      }
    })
  }
  return response
}

export function buildRouteFromInstance(action, query) {
  const {
    constructor: {
      routes,
      displayName,
      store: { singleton: singular = false } = {}
    },
    _attributes,
    ReactiveRecord: { API: config }
  } = this

  if (!routes[action]) {
    throw new ROUTE_NOT_FOUND_ERROR()
  }

  const [route] = interpolateRoute(
    routes[action],
    _attributes,
    displayName,
    singular,
    config,
    query
  )

  return route
}

export function getKey() {
  const {
    constructor: {
      schema: { _primaryKey = "id" }
    },
    [_primaryKey]: key
  } = this
  return [_primaryKey, key]
}

export function getRouteAttributes(action, query) {
  const {
      constructor: {
        routes: { [action.toLowerCase()]: routeTemplate }
      }
    } = this,
    attributes = {}
  if (!routeTemplate) {
    throw new ROUTE_NOT_FOUND_ERROR()
  }
  let matchArr = null
  /* eslint-disable no-cond-assign */
  while ((matchArr = ROUTE_TOKENIZER.exec(routeTemplate))) {
    /* eslint-enable no-cond-assign */
    const [, token] = matchArr
    if (this[token] || query[token]) {
      attributes[token] = this[token] || query[token]
    }
  }
  return attributes
}

export function setDefaultValues(attrs) {
  const { schema } = this.constructor
  /* eslint-disable guard-for-in */
  for (let prop in schema) {
    /* eslint-enable guard-for-in */
    const hasInitialValue = attrs.hasOwnProperty(prop)
    if (hasInitialValue) {
      continue
    }

    const hasDescriptor = typeof schema[prop] === "object"
    if (!hasDescriptor) {
      continue
    }

    const hasDefaultValue = schema[prop].hasOwnProperty("default")
    if (!hasDefaultValue) {
      continue
    }

    this[prop] = schema[prop].default
  }
}

export function without() {
  const obj = {},
    { indexOf } = Array.prototype
  for (let i in this) {
    if (arguments::indexOf(i) >= 0) {
      continue
    }
    if (!Object.prototype.hasOwnProperty.call(this, i)) {
      continue
    }
    obj[i] = this[i]
  }
  return obj
}

export function pick() {
  const obj = {}
  for (let i = 0; i < arguments.length; i++) {
    if (this.hasOwnProperty([arguments[i]])) {
      obj[arguments[i]] = this[arguments[i]]
    }
  }
  return obj
}

export function select(fn) {
  return this.filter(fn)
}

export function where(obj) {
  return this.filter(item => {
    for (const key in obj) {
      if (item.hasOwnProperty(key)) {
        const test = obj[key]
        if (Array.isArray(test) && test.indexOf(item[key]) > -1) {
          continue
        } else if (item[key] === test) {
          continue
        }
      }
      return false
    }
    return true
  })
}

export function onlyObjects(obj) {
  return typeof obj === "object" && !(obj instanceof Array)
}

export function values() {
  const val = []
  for (let key in this) {
    if (this.hasOwnProperty(key)) {
      val.push(this[key])
    }
  }
  return val
}

export function onlyReactiveRecord() {
  if ("_isReactiveRecord" in this) {
    return this
  }
  const chunks = this::values().filter(onlyObjects)
  for (let i = 0; i < chunks.length; i++) {
    if ("_isReactiveRecord" in chunks[i]) {
      return chunks[i]
    }
    chunks.push(...chunks[i]::values().filter(onlyObjects))
  }
}

export function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + s4()
}

export function getTypeName() {
  const hasDescriptor = onlyObjects(this) && this.hasOwnProperty("type")
  return hasDescriptor ? this.type.displayName || this.type.name : this.name
}

export function handleFormEvent(attr, arg) {
  if (typeof this.props[attr] === "function") {
    return this.props[attr](arg)
  }
  return Promise.resolve(arg)
}

export function triggerEventForProps(type, e) {
  const fn = this.props[`on${type}`]
  if (typeof fn === "function") {
    fn.call(this, e)
  }
}

export function isEmptyObject() {
  /* eslint-disable guard-for-in */
  for (let name in this) {
    /* eslint-enable guard-for-in */
    return false
  }
  return true
}

export function formatWith(obj) {
  const pattern = /%{([^}]*)}/g,
    matches = []
  let input = this,
    match
  /* eslint-disable no-cond-assign */
  while ((match = pattern.exec(input)) !== null) {
    /* eslint-enable no-cond-assign */
    matches.push(match)
  }
  matches.reverse()
  for (let i = 0; i < matches.length; i++) {
    if (obj.hasOwnProperty([matches[i][1]])) {
      let startPoint = matches[i].index,
        endPoint = matches[i].index + matches[i][0].length
      input = `${input.substring(0, startPoint)}${
        obj[matches[i][1]]
      }${input.substring(endPoint, input.length)}`
      continue
    }
    throw new ReferenceError(`Translation key not found for ${matches[i][1]}`)
  }
  return input
}
