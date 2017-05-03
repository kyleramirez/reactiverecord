import Sugar from "./sugar"
import "whatwg-fetch"
import diff from "object-diff"

export class ReactiveRecord {
  
}

export class Model {
}

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
// instance.isPristine() ?
// instance.isDirty() ?
// instance.changedAttributes()
// instance.attributeChanged(attributeName) ?
// instance.diff()
// instance.isValid(includeRemoteValidations) ?
// instance.isInvalid(includeRemoteValidations) ?
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
