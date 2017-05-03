import Sugar from "./sugar"
import "whatwg-fetch"
import diff from "object-diff"

export class ReactiveRecord {
  
}

export class Model {
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
