# Reactive Record — Object data-store mapping in React

### What does it do?
Reactive Record is a front-end-only Object Data-store Mapping (ODM) implementation that lets you interact with RESTful APIs. By defining models on the front end and integrating closely with the popular state container, Redux, Reactive Record offers a Ruby-on-Rails-esque, Active Record-ey syntax. Think Active Record for JavaScript. Reactive Record is agnostic to back-end architecture. It's built for APIs which respond to GET/POST/POST/DELETE requests for resources identified by predefined keys, so Rails, Express, Sinatra, CouchDB UNAMEIT! Reactive Record allows you to write syntax like this:

```js
const userAddress = new Address

userAddress.address1 = "1100 Congress Ave"
userAddress.city = "Austin"
userAddress.state = "TX"

userAddress.save()
/* 
  REQUEST:
    Method: POST 
    URL: /api/addresses
    Data: {
      "address1": "1100 Congress Ave",
      "city": "Austin",
      "state": "TX"
    }
  RESPONSE:
    Status: 201 Created
    Body: {
      "_id": "583132c8edc3b79a853b8d69",
      "createdAt": "2016-11-20T05:21:12.988Z",
      "updatedAt": "2016-11-20T05:21:12.988Z",
      "userId": "580432279153ea2679095acd",
      "address1": "1100 Congress Ave",
      "city": "Austin",
      "state": "TX"
    }
*/
userAddress.id
// Returns 583132c8edc3b79a853b8d69
userAddress.destroy()
// Does what you would expect (A DELETE request to the same resource)
```

### Installation

    npm install --save-dev reactiverecord
