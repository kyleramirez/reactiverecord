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

// SHOULD MAKE A LOT OF THESE "GETTERS", which don't require a () after the method unless parameters are required
// Index     Model.all(params)
//
// Create    instance.save(options)
//           instance.updateAttributes(attributes)
//           instance.updateAttribute(key, value)
//           Model.create(attributes)
//
// Show      instance.reload()
//           Model.find(key)
//           Model.load(key)
//
// Update    instance.save(options)
//           instance.updateAttributes(attributes)
//           instance.updateAttribute(key, value)
//           Model.update(attributes) <- for singletons
//
// Destroy   instance.destroy()
//           instance.delete()
//           Model.delete(key)
//
// Model.schema._primaryKey
//
// instance.serialize()

/*** Dirty ***/
// instance.diff
// instance.changedAttributes
// instance.isPristine ?
// instance.isDirty ?
// instance.attributeChanged(attributeName) ?

/*** Persistence ***/
// instance._persisted ?

/*** Routes ***/
// Model.routes
// instance.routeFor(action)

/*** Validations ***/
// Model.validations()
// Model.validationsFor(attributeName)
// instance.isValid(includeRemoteValidations) ?
// instance.isInvalid(includeRemoteValidations) ?


// Model.attributeNames()
// Model.associationNames()
//
// // On collections
// class ReactiveRecordCollection extends Array { first(){} last(){} sortBy(){} }
// collection.first()
// collection.last()
// collection.sortBy(keyStr)
//
// @beforeValidation
// @afterValidation
// @beforeSave
// @afterSave
// @beforeCreate
// @afterCreate
// @afterError
// @beforeUpdate
// @afterUpdate
// @beforeDestroy
// @afterDestroy
//
// schema {
//   attr: String,
//   attr: { type: Boolean, default: false }
// }
// routes = {
//   only: ["index", "create", "show", "update", "destroy"],
//   except: ["index", "create", "show", "update", "destroy"],
//   index: "",
//   create: "",
//   show: "",
//   update: "",
//   destroy: "",
// }
// actions possible attributes { type, attributes, key, query }
// { type:"@DESTROY(Contact)", key:123 }
// Fart.create({}, { query:{ page: 2 } })
// {"type":"@CREATE(Fart)","attributes":{},"query":{"page":2}}
//
// Fart.destroy(123, { page: 2 })
// {"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}}
//
// Fart.find(123, { page: 2 })
// {"type":"@SHOW(Fart)","query":{"page":2},"attributes":{}}
//
// Fart.all({ page: 2 })
// {"type":"@INDEX(Fart)","query":{"page":2}}
//
// Fart.load({ page: 2 })
// {"type":"@INDEX(Fart)","query":{"page":2}}
//
// fart.reload({ page: 2 })
// {"type":"@INDEX(Fart)","query":{"page":2}}
//
// fart.updateAttributes({cling:"sing"}, { query:{ page: 2 } })
// {"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}}
//
// fart.updateAttribute("cling", "sing", { query:{ page: 2 } })
// {"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}}
//
// fart.save({ query:{ page: 2 } })
// {"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}}
//
// fart.destroy({ page: 2 })
// {"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}}
//
//
//
//
// store.dispatch({"type":"@CREATE(Fart)","attributes":{},"query":{"page":2}})
// store.dispatch({"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}})
// store.dispatch({"type":"@SHOW(Fart)","query":{"page":2},"attributes":{}})
// store.dispatch({"type":"@INDEX(Fart)","query":{"page":2}})
// store.dispatch({"type":"@INDEX(Fart)","query":{"page":2}})
// store.dispatch({"type":"@INDEX(Fart)","query":{"page":2}})
// store.dispatch({"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}})
// store.dispatch({"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}})
// store.dispatch({"type":"@UPDATE(Fart)","attributes":{"cling":"sing"},"query":{"page":2}})
// store.dispatch({"type":"@DESTROY(Fart)","query":{"page":2},"attributes":{}})

Model.prototype.updateAttributes(attrs, { query })
Model.prototype.updateAttribute(name, value, { query })
Model.prototype.save({ query })
Model.prototype.destroy(query)
Model.prototype.reload(query)
Model.all(query)
Model.load(query)
Model.create(attrs, { query })
Model.destroy(key, query)
Model.find(key, query)

"@INDEX(Person)"
"@OK_INDEX(Person)"
"@ERROR_INDEX(Person)"
"@CREATE(Person)"
"@OK_CREATE(Person)"
"@ERROR_CREATE(Person)"
"@SHOW(Person)"
"@OK_SHOW(Person)"
"@ERROR_SHOW(Person)"
"@UPDATE(Person)"
"@OK_UPDATE(Person)"
"@ERROR_UPDATE(Person)"
"@DESTROY(Person)"
"@OK_DESTROY(Person)"
"@ERROR_DESTROY(Person)"

`Only initialized collections and resources which where initialized after a successful get request
should be "reloadable" from their _request object. This information shouldn't be serialized because
not every request is the same, so a reload serialized from one request could grab the incorrect
information if given to another collection. All collections and resources should support a reload
method which firsts checks the request for a specific reload, or falls back to the default action
  - so remove that whole functionality from the models and collections, and from performAsync
  - remove that whole functionality from the default store props
  - make sure no actions even mention doing it, remove tests for it since the functionality technically never existed


performAsync should apply the 200 status to every single resource in the collection for an index

errors in performAsync should also dispatch the original attributes requested, so the reducer knows what to update
`

Declare models like .model("ModelName", ModelClass)
No need for mangling exceptions
added method .serialize to model, returns JSON safe object
define _primaryKey in model, not in schema with _key

/* Extending <Form /> with a custom builder */
/*
 * Builders take precendence over normal schema
 * items, or don't have to exist in the schema
 */
function AddressBuilder(resource, fieldsObj) {
  let {
        address1:defaultAddress1, city:defaultCity,
        region:defaultRegion, postal_code:defaultPostalCode,
        country:defaultCountry
      } = resource,
      defaultValue = `${defaultAddress1}, ${defaultCity}, ${defaultRegion}`;
  const addressFields = {
    ref: ref => (fieldsObj.fields.address = ref)
  }
  if (defaultAddress1) {
    addressFields.defaultValue = defaultValue;
    addressFields.defaultAddress1 = defaultAddress1;
    addressFields.defaultCity = defaultCity;
    addressFields.defaultRegion = defaultRegion;
    addressFields.defaultPostalCode = defaultPostalCode;
  }
  if (defaultCountry) {
    addressFields.defaultValue += `, ${defaultCountry}`;
    addressFields.defaultCountry = defaultCountry;
  }
  return { addressFields }
}
<Form builder={AddressBuilder} />
/* combineFormBuilders */
<Form builder={combineFormBuilders(AddressBuilder, ContactBuilder, AvatarBuilder)} />

/* Return a function as value to get low-level access to the form object */
/* in a component */
/* normally */ get value() { /* return the value for the field name */ }
value(valuesObject) {
  /* must return an object immediately
   * any properties returned not in the
   * schema will be ignored
   */ 
}

### TODO
  - be able to specify a pluralization inflection at the model, and have it be used everywhere
  - internationalization of validation messages
  - model validations like isValid

### Validations
- can use %{attribute} or %{value} in message
/*
       * attr: {
         *   absence: [{ message: "%{attribute} must not be present" }]
       * }
       */
/*
      * attr: {
        *   presence: [{ message: "%{attribute} must be present" }]
      * }
      */
/*
      * attr: {
        *   acceptance: [
        *     {
        *       message: "%{attribute} must be accepted",
      *       accept: true || "yes"
      *     }
      *   ]
      * }
      */
/*
      * attr: {
        *   format: [
        *     {
        *       message: "Please enter a valid %{attribute}",
      *       with: /regex/,
      *       without: /regex/,
      *       allow_blank: false|true
      *     }
      *   ]
      * }
      */
/*
      * attr: {
        *   numericality: [
        *     {
        *       only_integer: true,
        *       messages:{
        *         only_integer: "%{attribute} must only be an integer."
      *       }
      *       ...
      *       allow_blank: true,
      *       messages: {
        *         numericality: "%{attribute} must be a number."
      *       }
      *       ...
      *       greater_than: 0 || "other_attr"
      *       messages: {
        *         greater_than: "%{attribute} must be greater than 0."
      *       }
      *       ...
      *       odd: true,
      *       messages: {
        *         odd: "%{attribute} must be an odd number."
      *       }
      *       ...
      *       even: true,
      *       messages: {
        *         even: "%{attribute} must be an even number."
      *       }
      *     }
      *   ]
      * }
      */
/*
      * attr: {
        *   length: [
        *     {
        *       allow_blank: true,
        *       is: 10
        *       messages: {
        *         is: "%{attribute} must be 10 characters."
      *       }
      *     }
      *     ...
      *     {
        *       minimum: 10,
        *       maximum: 255,
        *       messages: {
        *         minimum: "%{attribute} must be at least 10 characters.",
      *         maximum: "%{attribute} must be no more than 255 characters."
      *       }
      *     }
      *     ...
      *   ]
      * }
      */
*
      * attr: {
        *   exclusion: [
        *     {
        *       allow_blank: true
        *       in: ["Maryland, Texas"]
      *       message: "%{attribute} is reserved."
      *     }
      *     ...
      *     {
        *       range: [18,24]
        *       message: "%{attribute} is reserved."
      *     }
      *   ]
      * }
      */
/*
      * attr: {
        *   inclusion: [
        *     {
        *       allow_blank: true
        *       in: ["Rent, Security deposit"]
      *       message: "%{attribute} is not included in the list."
      *     }
      *     ...
      *     {
        *       range: [1,12]
        *       message: "%{attribute} is not included in the list."
      *     }
      *   ]
      * }
      */
/*
      * attr: {
        *   confirmation: [
        *     {
        *       case_sensitive: true
        *       message: "%{attribute} does not match %{} confirmation."
      *     }
      *   ]
      * }


### Custom local and remote validators
import { Validator } from "reactiverecord"
Validator.validators.local.phone_number = function(value, options, form, attribute) {
  return message or null
}
Validator.validators.remote.routing_number = function(value, options, form, attribute, callback) {
  return callback with message or null
}

- show loading state on form by access
- form children function is passed (...attributes, submit, submitting, validating)
  - show a loading state or validating state of the form by using the props here
  - show different button text by using the props here "Save", "Saving"
  - submit is disabled automatically during form submission or validation
- disable validations completely by passing in validate={false} to form
  
Button must respond to
  - disabled

Inputs must respond to
  - errorText
  - labelText
  - defaultValue
  - validators
  - validating
  
  # TODO - add a way to validate the form like formRef.isValid(callback)
  # TODO add .babelrc to npm ignore
  # TODO document that stage-0 is needed as well as need for babel loader to include this module
    - exclude: /node_modules(?!\/reactiverecord).*$/,
---
`fieldsFor`

    { resource.applicants.map( (applicant, index) => (
      /* Fields for real persisted applicants */
      fields.fieldsFor("applicants", index, new Applicant)( applicantFields => (
        <div style={{border:"1px solid black"}}>
          <Input {...applicantFields.full_name} />
          <Input {...applicantFields.email} />
        </div>
      ))
    ))}
