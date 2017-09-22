import React, { Component } from "react"
import Sugar from "../sugar"
import { without, getTypeName, handleFormEvent, onlyObjects, isEmptyObject } from "../utils"

function isNewResource() {
  return !!("_persisted" in this && !this._persisted)
}

export default class Form extends Component {
  constructor(...args) {
    super(...args);
    this.state = { submitting: false, validating: 0 };
    this.fields = [];
    this.handleSubmit = this::this.handleSubmit;
    this.commitResource = this::this.commitResource;
    this.fieldsFor = this::this.fieldsFor;
    this.buildFieldProps = this::this.buildFieldProps;
    this.increaseValidation = this::this.increaseValidation;
    this.decreaseValidation = this::this.decreaseValidation;
    this.safeSetState = (...args) => {
      if (this.form) this.setState(...args)
    }
  }

  render() {
    const { handleSubmit, state, buildFieldProps } = this,
          { for:resource, children } = this.props,
          submitting = !!(resource._request.status.toString().match(/ING$/) || state.submitting),
          validating = !!state.validating,
          { schema={}, validations={} } = resource.constructor,
          props = this.props::without(
            "children", "for", "beforeValidation",
            "afterValidationFail", "beforeSave", "afterSave",
            "afterRollback", "builder"
          );

    const submit = {
      disabled: submitting || validating
    }
    if (!!submitting) {
      submit.children = "Saving";
    }

    const formObject = buildFieldProps(schema, validations, this, resource);

    return(
      <form {...props} ref={ ref => this.form = ref } onSubmit={handleSubmit}>
        {children({...formObject, submit, submitting, validating })}
      </form>
    )
  }

  buildFieldProps(schema, validations, fieldsObj, resource={}) {
    const { fieldsFor } = this,
          defaultProps = { fieldsFor, ...this.applyBuilder(resource, fieldsObj) };

    return Object.keys(schema).reduce( (form, field) => {
      const type = schema[field]::getTypeName();
      if (type !== "Object" && !/^(_timestamps|_primaryKey|user_?[iI]d)$/.test(field)) {
        const fieldHumanizedAndTitleized = Sugar.String.titleize(Sugar.String.humanize(field));
        form[field] = form[field] || {
          ref: ref => (fieldsObj.fields[field] = ref),
          labelText: fieldHumanizedAndTitleized,
          defaultValue: resource[field]
        }
        if (resource._errors && resource._errors[field].length) form[field].errorText = resource._errors[field][0];
        if (validations && validations[field]) form[field].validators = { ...validations[field], form:this, attribute: field };
      }

      return form;
    }, defaultProps)
  }

  applyBuilder(resource, fieldsObj) {
    if (typeof this.props.builder === "function") {
      const builder = this.props.builder(resource, fieldsObj);
      if (!onlyObjects(builder)) throw new TypeError(`Expected prop builder to return a plain object, got ${builder}`);
      return builder;
    }
    return {}
  }

  fieldsFor(resourceType, key, existingResource={}) {
    const { buildFieldProps } = this,
          { ReactiveRecord } = this.props.for,
          modelName = Sugar.String.camelize(Sugar.String.singularize(resourceType)),
          { schema, schema:{ _primaryKey="id" }, validations } = ReactiveRecord.model(modelName);

    const attributesName = `${resourceType}_attributes`,
          persisted = existingResource._persisted,
          idForFields = persisted ? existingResource[_primaryKey] : key,
          fieldsObj = { fields:{}, _primaryKey, persisted };

    const formObject = buildFieldProps(schema, validations, fieldsObj, existingResource);

    this.fields[attributesName] = { ...this.fields[attributesName] }

    Object.defineProperty(this.fields[attributesName], "isValid", {
      value: function(callback) {
        let allFieldsValid = true,
            fieldsChecked = 0;
        const relevantFields = Object.keys(this.resources).reduce(( final, identifier)=>{
                const { fields } = this.resources[identifier],
                      attrs = Object.values(fields).filter(Boolean);
                return [...final, ...attrs ]
              },[]),
              fieldsToCheck = relevantFields.length,
              fieldValidator = isValid =>{
                fieldsChecked++;
                if (!isValid) allFieldsValid = false;
                if (fieldsChecked === fieldsToCheck) this::callback(allFieldsValid)
              };
        if (!relevantFields.length) return this::callback(true);
        relevantFields.map((field)=>{
          if ("isValid" in field) return field.isValid(fieldValidator)
          return fieldValidator(true)
        })
      }
    })

    Object.defineProperty(this.fields[attributesName], "value", {
      get: function() {
        const isMany = resourceType === Sugar.String.pluralize(resourceType);

        return Object.keys(this.resources)
        .reduce( (finalValue, identifier) => {
          const { fields, _primaryKey, persisted } = this.resources[identifier],
                attrs = Object.keys(fields)
                              .filter(fieldName => !!fields[fieldName])
                              .reduce((final, currentValue)=>{
                                if (typeof fields[currentValue].value === "function")
                                  return { ...final, ...fields[currentValue].value(final) }
                                final[currentValue] = fields[currentValue].value;
                                return final;
                              }, {});

          if (persisted) attrs[_primaryKey] = identifier;
          if (isMany) {
            if (!attrs::isEmptyObject()) finalValue.push(attrs);
            return finalValue;
          }
          return attrs;
        }, isMany ? [] : {})
      }
    })

    this.fields[attributesName].resources = {
      ...this.fields[attributesName].resources,
      [idForFields]:fieldsObj
    }

    return fieldsFn => fieldsFn.call(this, formObject)

  }

  handleSubmit(e) {
    e.preventDefault();
    const { commitResource } = this;
    let allFieldsValid = true,
        fieldsChecked = 0;
    const relevantFields = Object.keys(this.fields).filter(fieldName => !!this.fields[fieldName]),
          fieldsToCheck = relevantFields.length,
          getFieldValues = () => {
            return relevantFields.reduce((final, currentValue)=>{
              if (typeof this.fields[currentValue].value === "function")
                return { ...final, ...this.fields[currentValue].value(final) }
              final[currentValue] = this.fields[currentValue].value;
              return final;
            }, {});
          },
          fieldValidator = isValid =>{
            // debugger;
            fieldsChecked++;
            if (!isValid) allFieldsValid = false;
            if (fieldsChecked === fieldsToCheck) {
              if (allFieldsValid) return this::handleFormEvent("beforeSave", getFieldValues()).then(commitResource)
              return this::handleFormEvent("afterFailValidation", getFieldValues())
            }
          };

    this::handleFormEvent("beforeValidation", this.fields).then(()=>{
      relevantFields.map((key)=>{
        if ("isValid" in this.fields[key]) return this.fields[key].isValid(fieldValidator)
        return fieldValidator(true)
      })
    })
  }

  commitResource(attrs) {
    if (this.props.for::isNewResource()) this.safeSetState({ submitting: true })
    return this.props.for.updateAttributes(attrs)
                         .then( resource => {
                           if (this.state.submitting)
                             this.safeSetState({ submitting: false })
                           this::handleFormEvent("afterSave", resource)
                         })
                         .catch( resource => {
                           if (this.state.submitting)
                             this.safeSetState({ submitting: false })
                           this::handleFormEvent("afterRollback", resource)
                         })
  }

  increaseValidation() {
    this.safeSetState({ validating: this.state.validating + 1 })
  }

  decreaseValidation() {
    this.safeSetState({ validating: Math.max(this.state.validating - 1, 0) })
  }
}
