import chai from "chai"
import spies from "chai-spies"

/*******************************/
/**           Stubs           **/
/*******************************/
chai.use(spies)

const xhrMap = new Map()

export const xhrRequests = {
  get: function(args) {
    const query = JSON.stringify(args)
    const req = xhrMap.get(query)
    xhrMap.delete(query)
    return req
  },
  set: function(key, value) {
    const storedResponse = xhrMap.get(JSON.stringify(key))
    if (storedResponse) {
      const [actualResponse] = storedResponse.filter(Boolean)
      if (actualResponse) {
        xhrMap.delete(JSON.stringify(key))
        return value[storedResponse.indexOf(actualResponse)](actualResponse)
      }
    }
    xhrMap.set(JSON.stringify(key), value)
  },
  reset: function() {
    return xhrMap.clear()
  },
  expect: request => ({
    andResolveWith: response => xhrMap.set(JSON.stringify(request), [response, null]),
    andRejectWith: response => xhrMap.set(JSON.stringify(request), [null, response])
  })
}

export class XHRResponse {
  constructor({ status, body }) {
    this.status = status
    this.body = body
  }
  json() {
    return new Promise(resolve => {
      resolve(JSON.parse(this.body))
    })
  }
}

class XMLHttpRequest {
  static DONE = "DONE"
  headers = {}
  eventListeners = {
    load: [],
    error: []
  }
  open = (method, route) => {
    this.method = method
    this.route = route
  }

  setRequestHeader = (key, value) => {
    this.headers[key] = value
  }

  addEventListener = (kind, callback) => {
    this.eventListeners[kind].push(callback)
  }

  send = body => {
    this.body = body
  }
}

global.XMLHttpRequest = XMLHttpRequest

/* Stub out a fetch
const request = [
  "/people",
  {
    method: "POST",
    body: { name: "Kyle" },
    headers: { "Accept": "application/json", "Content-Type": "application/json" }
  }
]
expect(fetch).to.have.been.called.with(...request);
const [ resolve, reject ] = xhrRequests.get(request);
resolve(new XHRResponse({ status: 200, body: { id: 123, name: "Kyle", level: "customer" } }))
xhrRequests.reset()
*/
