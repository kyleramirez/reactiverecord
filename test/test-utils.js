import chai, { expect } from "chai"
import spies from "chai-spies"

/*******************************/
/**           Stubs           **/
/*******************************/
chai.use(spies);

const fetchMap = new Map;

export const fetchRequests = {
  get: function(args) {
    const query = JSON.stringify(args),
          req = fetchMap.get(query);
    fetchMap.delete(query);
    return req;
  },
  set: function(key, value) {
    return fetchMap.set(JSON.stringify(key), value);
  },
  reset: function(){
    return fetchMap.clear()
  }
}

export class FetchResponse {
  constructor({ status, body }) {
    this.status = status;
    this.body = body;
  }
  json() {
    return new Promise( resolve => {
      resolve(JSON.parse(this.body))
    })
  }
}

function fetch(...args) {
  return new Promise( (resolve, reject) => {
    fetchRequests.set(args, [resolve, reject]);
  })
}

global.fetch = chai.spy(fetch);

// const request = [
//   "/people",
//   { method: "POST",
//     body: { name: "Kyle" },
//     headers: { "Accept": "application/json", "Content-Type": "application/json" },
//     credentials: "same-origin" }
// ]
// expect(fetch).to.have.been.called.with(...request);
// const [ resolve, reject ] = fetchRequests.get(request);
// resolve(new FetchResponse({ status: 200, body: { id: 123, name: "Kyle", level: "customer" } }))
// fetchRequests.reset()