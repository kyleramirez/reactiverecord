import Sugar from "./sugar"
import { ROUTE_TOKENIZER, ROUTE_NOT_FOUND_ERROR } from "./constants"

export function skinnyObject(...args) {
  return args.reduce(function(final, arg) {
    return Object.assign(final, JSON.parse(JSON.stringify(arg)))
  }, Object.create(null, {}))
}

export function interpolateRoute(route, originalAttributes, routeInflection, apiConfig, originalQuery) {
  let query = { ...originalQuery }
  let attributes = { ...originalAttributes }
  const { prefix } = apiConfig
  const delimiter = delimiterType(apiConfig.delimiter)
  const modelWithDelimiter = `${Sugar.String[delimiter](routeInflection)}`
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
        attributes = without.call(attributes, attributeName)
        query = without.call(query, attributeName)
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
  const { constructor } = this
  const {
    schema: { _primaryKey = "id", _timestamps }
  } = constructor
  const {
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
  const { constructor } = this
  const { schema, prototype } = constructor
  /* eslint-disable guard-for-in */
  for (let prop in without.call(schema, "_primaryKey", "_timestamps")) {
    // Establish initial value but fallback to default value
    const initialValue = JSON.parse(JSON.stringify(attrs.hasOwnProperty(prop) ? attrs[prop] : null))
    // Establish type from descriptor
    const name = schema[prop].type.displayName || schema[prop].type.name

    // Write default value
    this._attributes[prop] = initialValue

    const manuallyDefinedGetter = (Object.getOwnPropertyDescriptor(prototype, prop) || {})["get"]
    const manuallyDefinedSetter = (Object.getOwnPropertyDescriptor(prototype, prop) || {})["set"]

    let get = manuallyDefinedGetter

    let set = manuallyDefinedSetter

    if (!manuallyDefinedGetter) {
      get = () => this._attributes[prop]
      if (name === "Object") {
        get = () => this._attributes[prop] || {}
      }
      if (name === "Array") {
        get = () => this._attributes[prop] || []
      }
      if (name === "Date") {
        get = () => (this._attributes[prop] === null ? null : new Date(this._attributes[prop]))
      }
      if (name === "Number") {
        get = () => (this._attributes[prop] === null ? null : Number(this._attributes[prop]))
      }
    }

    if (!manuallyDefinedSetter) {
      set = newValue => (this._attributes[prop] = newValue)
      if (name === "Boolean") {
        set = newValue => {
          let next = Boolean(newValue)
          if (newValue === null) {
            next = null
          }
          if (newValue === "false") {
            next = false
          }
          return (this._attributes[prop] = next)
        }
      }
    }

    if (name === "Boolean" && this._attributes[prop] !== null) {
      this._attributes[prop] = initialValue === "false" ? false : Boolean(initialValue)
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
  if (a !== null && typeof a === "object" && b !== null && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return a === b
}

export function diff(...subjects) {
  const length = subjects.length
  const ref = subjects[0]
  const diff = {}
  for (let i = 1; i < length; i++) {
    const current = subjects[i]
    const keys = Object.keys(current)
    const keysLength = keys.length
    for (let u = 0; u < keysLength; u++) {
      const key = keys[u]
      if (!recordDiff(current[key], ref[key])) {
        diff[key] = current[key]
      }
    }
  }
  return diff
}

function arrayToQueryString(array, key) {
  return array.reduce(function(final, value) {
    const delimiter = final ? "&" : ""
    if (Object(value) === value) {
      throw new TypeError("Arrays may only contain primitive types.")
    }
    return `${final}${delimiter}${key}%5B%5D=${encodeURIComponent(value)}`
  }, "")
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
    let key = keyPrefix ? `${keyPrefix}%5B${encodeURIComponent(current)}%5D` : encodeURIComponent(current)
    let value = null
    if (typeof initialValue === "object" && initialValue !== null && !isEmptyObject(initialValue)) {
      value = Array.isArray(initialValue) ? arrayToQueryString(initialValue, key) : objToQueryString(initialValue, key)
      return `${final}${delimiter}${value}`
    } else {
      value = encodeURIComponent(obj[current])
      return `${final}${delimiter}${key}=${value}`
    }
  }, "")
}

function tryTypeCastFromString(item) {
  if (item === "") {
    return ""
  }
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
    str
      .replace(/^\?/, "")
      .split(/&/g)
      .forEach(function(keyValue) {
        const [key, value] = keyValue.split("=").map(string => decodeURIComponent(string).replace(/\+/g, " "))
        if (value) {
          if (key.slice(-2) === "[]") {
            const keyWithoutArray = key.slice(0, -2)
            response[keyWithoutArray] = response[keyWithoutArray] || []
            response[keyWithoutArray].push(value)
          } else {
            response[key] = value
          }
        }
      })
    Object.keys(response).forEach(function(key) {
      const properties = key.split(/[[\]]/).filter(Boolean)
      if (properties.length > 1) {
        properties.reduce((ref, nextKey, index) => {
          const isFinalValue = index + 1 === properties.length
          ref[nextKey] = ref[nextKey] || (isFinalValue ? tryTypeCastFromString(response[key]) : {})
          return ref[nextKey]
        }, response)
        delete response[key]
      } else {
        response[key] = response[key] || tryTypeCastFromString(response[key])
      }
    })
  }
  return response
}

export function buildRouteFromInstance(action, query) {
  const {
    constructor: { routes, routeInflection },
    _attributes,
    ReactiveRecord: { API: config }
  } = this

  if (!routes[action]) {
    throw new ROUTE_NOT_FOUND_ERROR()
  }

  const [route] = interpolateRoute(routes[action], _attributes, routeInflection, config, query)

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
  } = this
  const attributes = {}
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
  for (let prop in without.call(schema, "_primaryKey", "_timestamps")) {
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
  const obj = {}
  const { indexOf } = Array.prototype
  for (let i in this) {
    if (indexOf.call(arguments, i) >= 0) {
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
    /* eslint-disable guard-for-in */
    for (const key in obj) {
      /* eslint-enable guard-for-in */
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
  return obj !== null && typeof obj === "object" && !(obj instanceof Array)
}

export function onlyReactiveRecord() {
  if ("_isReactiveRecord" in this) {
    return this
  }
  const chunks = Object.values(this).filter(onlyObjects)
  for (let i = 0; i < chunks.length; i++) {
    if ("_isReactiveRecord" in chunks[i]) {
      return chunks[i]
    }
    chunks.push(...Object.values(chunks[i]).filter(onlyObjects))
  }
}

export function handleFormEvent(attr, arg) {
  if (typeof this.props[attr] === "function") {
    return this.props[attr](arg)
  }
  return Promise.resolve(arg)
}

export function isEmptyObject(object) {
  /* eslint-disable guard-for-in */
  for (let name in object) {
    /* eslint-enable guard-for-in */
    return false
  }
  return true
}

export function formatWith(obj) {
  const pattern = /%{([^}]*)}/g
  const matches = []
  let input = this
  let match
  /* eslint-disable no-cond-assign */
  while ((match = pattern.exec(input)) !== null) {
    /* eslint-enable no-cond-assign */
    matches.push(match)
  }
  matches.reverse()
  for (let i = 0; i < matches.length; i++) {
    if (obj.hasOwnProperty([matches[i][1]])) {
      let startPoint = matches[i].index
      let endPoint = matches[i].index + matches[i][0].length
      input = `${input.substring(0, startPoint)}${obj[matches[i][1]]}${input.substring(endPoint, input.length)}`
      continue
    }
    throw new ReferenceError(`Translation key not found for ${matches[i][1]}`)
  }
  return input
}
