import Sugar from "./sugar"
import "whatwg-fetch"
import diff from "object-diff"
import {
  isEmptyObject, setReadOnlyProps
} from "./utils"
import {
  actionMatch, singleRecordProps, recordProps, versioningProps, restVerbs
} from "./constants"

export class ReactiveRecord {
  models = {}
  model(modelStr, modelClass=false){
    // If we're just retrieving a model
    if (!modelClass) {
      if (typeof this.models[modelStr] === "undefined")
        throw new ReferenceError(`Model ${modelStr} is not a recognized ReactiveRecord Model.`);
      return this.models[modelStr];
    }
    // Check if it's an instance of model
    if (!(modelClass.prototype instanceof Model))
      throw new TypeError(`Model ${modelStr} needs to inherit from ReactiveRecord's Model.`)
    // Check if there's a schema that isn't empty
    if (typeof modelClass.schema === "undefined" || isEmptyObject(modelClass.schema))
      throw new TypeError(`Model #<${modelStr}> needs a valid schema.`)
    // Assign the model's parent
    modelClass.ReactiveRecord = this;
    // Assign the model's name
    modelClass.displayName = modelStr;
    // Assign the model
    this.models[modelStr] = modelClass;
  }

  API = {
    prefix: "",
    delimiter: "-",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    diffMode: true
  }
  setAPI(opts){
    const { prefix, delimiter, credentials, diffMode } = this.API,
    { headers={} } = opts;
    ({
      prefix:this.API.prefix=prefix,
      delimiter:this.API.delimiter=delimiter,
      credentials:this.API.credentials=credentials,
      diffMode:this.API.diffMode=diffMode
    } = opts);
    Object.assign(this.API.headers, headers);
  }
}
export default new ReactiveRecord;

class ReactiveRecordRequest {
  constructor({status=null, body=null}){
    this.status=status;
    this.body=body;
  }
  get clear(){ return ()=>{
    this.status=null;
    this.body=null;
  } }
}
class ReactiveRecordErrors {
  //Each attribute in the schema gets an array, empty or not
  // Also provide a clear function
  // Errors populate in real time according to the value of the
  // field, or server errors populate after returning from
  // a request.
}

export class Model {
  get ReactiveRecord(){ return this.constructor.ReactiveRecord }
  constructor(attrs={}, actAsPersisted=false){
    const modelName = this.constructor.displayName,
          model = this.ReactiveRecord.models[modelName];
    // Define the internal record
    Object.defineProperty(this, "_attributes", { value:{} })

    setReadOnlyProps.call(this, attrs);

    Object.defineProperty(this, "_request", {
      value:new ReactiveRecordRequest({...attrs._request})
    });

    Object.defineProperty(this, "_errors", {
      value:new ReactiveRecordErrors({...attrs._errors})
    });

    Object.defineProperty(this, "_pristine", {
      get: ()=>({ ...this.serialize })
    });
  }

  // Serialized
  get serialize(){ return JSON.parse(JSON.stringify(this._attributes)); }
}



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
// Model.primaryKey
//
// instance.serialize()
// instance.diff()
// instance.changedAttributes()
// instance.isPristine() ?
// instance.isDirty() ?
// instance.attributeChanged(attributeName) ?
// instance.isValid(includeRemoteValidations) ?
// instance.isInvalid(includeRemoteValidations) ?
// instance.exists ?
//
// Model.routes
// Model.routeFor(action, attributes)
// instance.routeFor(action)
// Model.validations()
// Model.validationsFor(attributeName)
//
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
