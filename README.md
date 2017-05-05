# Reactive Record — Object data-store mapping in React

### What does it do?
Reactive Record is a front-end-only Object Data-store Mapping (ODM) implementation that lets you interact with RESTful APIs. By defining models on the front end and integrating closely with the popular state container, Redux, Reactive Record offers a Ruby-on-Rails-esque, Active Record-ey syntax. Think Active Record for JavaScript. Reactive Record is agnostic to back-end architecture. It's built for APIs which respond to GET/POST/POST/DELETE requests for resources identified by predefined keys, so Rails, Express, Sinatra, CouchDB UNAMEIT! Reactive Record allows you to write syntax like this:

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


### Installation
    npm install --save reactiverecord
    
### Prerequisites
This library was made to solve problems in my current project stacks (insert buzz words: React/Redux/Webpack/ES6). The only real assumptions are:

 - You are using NPM as a package manager
 - You are using Redux

The nice-to-haves are:

 - React
 - React Redux

I'm open to suggestion on making this library more widely supported.

# Minimum Setup

### In your app
    import ReactiveRecord from "reactiverecord";
    const Story = ReactiveRecord.model("Story"),

    const newStory = new Story;
    newStory.save().then(savedRecord=>(this.setState({ ...savedRecord }));
    // Also works ...
    Story.create({ title: "A working title", body: "Once upon a time..."})  // Makes an API request
      .then(savedRecord=>(this.setState({ ...savedRecord }));  // Returns a promise ... as do the following methods
    newStory.updateAttribute("title", "A working title") // Makes an API request
    newStory.updateAttributes({ title: "A working title", body: "Once upon a time..."})  // Makes an API request

    newStory.destroy() // Makes an API request

    Story.all() // Makes an API request to the model's index, returns array of records
    Story.find("583132c8edc3b79a853b8d69") // Makes an API request to this resource, returns single record

    // Passing extra URL query parameters
    Story.all({month:"05", year:2017}) // Makes an API request to /stories?month=05&year=2017
    Story.all("?month=05&year=2017") // Also works
    Story.find("first-post", { include_comments: true }) // Makes an API request to /stories/first-post?include_comments=true
    Story.find("first-post", "?include_comments=true") // Also works
    // Use cases for extra query params
    Search.all({q: "Am I being detained?"}) // Generates /search?q=Am%20I%20being%20detained%3F

### Defining Models
    // In a file like /models/Story.js
    import ReactiveRecord, { Model } from "reactiverecord";
    class Story extends Model {
      static schema = {
        title: String,
        body: String,
        isActive: Boolean,
        userId: String,
        _timestamps: true
      }
    }
    export default ReactiveRecord.model(Story);


### In your reducers setup

    // In a file like /reducers.js
    import { combineReducers } from "redux"
    import ReactiveRecord, { reducer as models } from "reactiverecord"
    ReactiveRecord.setAPI({ prefix: "/api" })
    import "models"
    export default combineReducers({
      models,
      // your other reducers
    });

### In your store setup

    // In a file like /store.js
    import { createStore, applyMiddleware, compose } from "redux";
    import reducer from "./reducers";
    import { middleware as reactiveRecordMiddleware } from "reactiverecord";
    export default createStore(reducer, compose( applyMiddleware(reactiveRecordMiddleware /* , ...your other middlewares*/)));


### Minification
If you are running your build through something like Uglify, or part of a Webpack build, you'll need to exclude the class names of your models. Uglify supports excluding certain keywords from the minification/mangle process. Below is an example configuration for Webpack, in the plugins section of your webpack config.

    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        except: ["BankAccount", "CreditCard","User"]
      }
    })

# Coming Soon!

 - **Model associations** syntax a-la `userAddress.user` with declarations like:

        const User = ReactiveRecord.model("User")
        class Address extends Model {
          static associations = [
            {belongsTo: User}
          ]
        }
 
- **Validations**, with the ability to exclude local validation like `userAddress.save({validate: false})`, with declarations a-la Mongoose like:

        class Address extends Model {
          static schema = {
            address1: {
              type: String,
              required: [true, "A street address is required."]
            }
            zip: {
              type: String,
              length: {
                min: 5,
                message: "ZIP codes must be at least 5 numbers."
              }
            }
           // ... other schema
          }
        }

 Also planned is the creation of a ReactiveRecord validations API, with the ability to include local and remote validations.
 - **Scopes** and default scope syntax like `orders.completed`
 - **Order** and default ordering `cards.orderBy("price", "ASC")`
 - **Custom schema types** such as automatic conversions to U.S. dollar
