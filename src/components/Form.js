import React, { Component } from 'react';
import Sugar from '../sugar';
import { without, handleFormEvent, onlyObjects, isEmptyObject } from '../utils';

function isStoreManaged() {
  return !!('_isStoreManaged' in this && this._isStoreManaged);
}

export default class Form extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { submitting: false, validating: false };
    this.validating = 0;
    this.fields = [];
    this.safeSetState = (...args) => {
      if (this.form) {
        this.setState(...args);
      }
    };
  }

  render() {
    const { state, props } = this;
    const submitting = props.for._request.status.toString().match(/ING$/) || state.submitting;
    const { schema = {}, validations = {} } = props.for.constructor;
    const formProps = without.call(
      this.props,
      'children',
      'for',
      'beforeValidation',
      'afterValidationFail',
      'beforeSave',
      'afterSave',
      'afterRollback',
      'builder',
      'query'
    );

    const submit = {
      disabled: submitting || state.validating,
    };
    if (submitting) {
      submit.children = 'Saving';
    }

    const formObject = this.buildFieldProps(schema, validations, this, props.for);

    return (
      <form {...formProps} ref={ref => (this.form = ref)} onSubmit={this.handleSubmit}>
        {props.children({ ...formObject, submit, submitting, validating: state.validating })}
      </form>
    );
  }

  buildFieldProps = (schema, validations, fieldsObj, resource = {}) => {
    const { fieldsFor } = this;
    const defaultProps = { fieldsFor, ...this.applyBuilder(resource, fieldsObj) };
    return Object.keys(without.call(schema, '_primaryKey', '_timestamps')).reduce((form, field) => {
      const { type, labelText } = schema[field];
      const name = type.displayName || type.name;
      if (name !== 'Object' && !/^(_timestamps|_primaryKey)$/.test(field)) {
        form[field] = form[field] || {
          ref: ref => (fieldsObj.fields[field] = ref),
          labelText,
          defaultValue: resource[field],
        };
        if (resource._errors && resource._errors[field].length) {
          form[field].errorText = resource._errors[field][0];
        }
        if (validations && validations[field]) {
          form[field].validators = {
            ...validations[field],
            form: this,
            attribute: field,
            labelText,
          };
        }
      }

      return form;
    }, defaultProps);
  };

  applyBuilder(resource, fieldsObj) {
    if (typeof this.props.builder === 'function') {
      const builder = this.props.builder(resource, fieldsObj);
      if (!onlyObjects(builder)) {
        throw new TypeError(`Expected prop builder to return a plain object, got ${builder}`);
      }
      return builder;
    }
    return {};
  }

  fieldsFor = (association, key, existingResource) => {
    const { buildFieldProps } = this;
    const { ReactiveRecord } = this.props.for;
    const { displayName: modelName, attributesName } = existingResource.constructor;
    const {
      schema,
      schema: { _primaryKey = 'id' },
      validations,
    } = ReactiveRecord.model(modelName);
    const isMany = association === Sugar.String.pluralize(association);
    const persisted = existingResource._persisted;
    const idForFields = persisted ? existingResource[_primaryKey] : key;
    const fieldsObj = {
      fields: {},
      _primaryKey,
      persisted,
      resource: existingResource,
    };

    const formObject = buildFieldProps(schema, validations, fieldsObj, existingResource);

    this.fields[attributesName] = { ...this.fields[attributesName] };

    Object.defineProperty(this.fields[attributesName], 'isValid', {
      value: function(callback) {
        let allFieldsValid = true;
        let fieldsChecked = 0;
        const relevantFields = Object.keys(this.resources).reduce((final, identifier) => {
          const { fields } = this.resources[identifier];
          const attrs = Object.values(fields).filter(Boolean);
          return [...final, ...attrs];
        }, []);
        const fieldsToCheck = relevantFields.length;
        const fieldValidator = isValid => {
          fieldsChecked++;
          if (!isValid) {
            allFieldsValid = false;
          }
          if (fieldsChecked === fieldsToCheck) {
            callback.call(this, allFieldsValid);
          }
        };
        if (!relevantFields.length) {
          return callback.call(this, true);
        }
        relevantFields.forEach(field => {
          if ('isValid' in field) {
            return field.isValid(fieldValidator);
          }
          return fieldValidator(true);
        });
      },
    });

    Object.defineProperty(this.fields[attributesName], 'value', {
      get: function() {
        return Object.keys(this.resources).reduce((finalValue, identifier) => {
          const { fields, _primaryKey, persisted, resource } = this.resources[identifier];
          const attrs = Object.keys(fields)
            .filter(fieldName => !!fields[fieldName])
            .reduce((final, currentValue) => {
              if (typeof fields[currentValue].value === 'function') {
                return { ...final, ...fields[currentValue].value(final) };
              }
              final[currentValue] = fields[currentValue].value;
              return final;
            }, {});

          /* Don't submit deleted form objects */
          if (isEmptyObject(attrs)) {
            return finalValue;
          }

          Object.assign(resource, attrs);
          const nextValue = resource.diff;

          /* Don't submit unchanged resources */
          if (isEmptyObject(nextValue)) {
            return finalValue;
          }

          if (persisted) {
            nextValue[_primaryKey] = identifier;
          }

          if (isMany) {
            finalValue.push(nextValue);
            return finalValue;
          }

          return { ...finalValue, ...attrs };
          /* returning attrs here is for singleton objects. It cascades down the form, as a normal form would.
             Example:
              ...
              f.fieldsFor("building_attributes", building.id, building)( buildingFields => (
                <Input {...buildingFields.address1} />
              ))
              f.fieldsFor("building_attributes", building.id, building)( buildingFields => (
                <Input {...buildingFields.address2} />
              ))
              f.fieldsFor("building_attributes", building.id, building)( buildingFields => (
                <Input {...buildingFields.city} />
              ))
              ...
              and final submitted attributes would be { building_attributes:{ address1:"...", address2:"...", city:"..." } }
           */
        }, isMany ? [] : {});
      },
    });

    this.fields[attributesName].resources = {
      ...this.fields[attributesName].resources,
      [idForFields]: fieldsObj,
    };

    return fieldsFn => fieldsFn.call(this, formObject);
  };

  handleSubmit = event => {
    if (this.props.onSubmit) {
      this.props.onSubmit(event);
      if (event.defaultPrevented) {
        return;
      }
    }
    event.preventDefault();
    this.submit();
  };

  submit = () => {
    const { commitResource } = this;
    let allFieldsValid = true;
    let fieldsChecked = 0;
    const relevantFields = Object.keys(this.fields).filter(fieldName => !!this.fields[fieldName]);
    const fieldsToCheck = relevantFields.length;
    const getFieldValues = () => {
      return relevantFields.reduce((final, currentValue) => {
        const fieldsCurrentValue = this.fields[currentValue].value;
        if (typeof fieldsCurrentValue === 'function') {
          return { ...final, ...fieldsCurrentValue(final) };
        }
        const originalValue = fieldsCurrentValue;
        /* If these are nested attributes as in fieldsFor */
        if (
          currentValue.indexOf('_attributes') > -1 &&
          currentValue.lastIndexOf('_attributes') === currentValue.length - '_attributes'.length
        ) {
          /* If these nested attributes are empty */
          /* If it's an empty array */
          if (Array.isArray(originalValue) && !originalValue.length) {
            return final;
          }
          /* If it's an empty object */
          if (isEmptyObject(originalValue)) {
            return final;
          }
        }
        final[currentValue] = fieldsCurrentValue;
        return final;
      }, {});
    };
    const fieldValidator = isValid => {
      fieldsChecked++;
      if (!isValid) {
        allFieldsValid = false;
      }
      if (fieldsChecked === fieldsToCheck) {
        if (allFieldsValid) {
          return handleFormEvent.call(this, 'beforeSave', getFieldValues()).then(commitResource);
        }
        return handleFormEvent.call(this, 'afterValidationFail', getFieldValues());
      }
    };
    handleFormEvent.call(this, 'beforeValidation', this.fields).then(() => {
      relevantFields.forEach(key => {
        if ('isValid' in this.fields[key]) {
          return this.fields[key].isValid(fieldValidator);
        }
        return fieldValidator(true);
      });
    });
  };

  commitResource = attrs => {
    if (!isStoreManaged.call(this.props.for)) {
      this.props.for._errors.clear();
      this.safeSetState({ submitting: true });
    }
    const query = this.props.query || {};
    this.props.for
      .updateAttributes(attrs, { query })
      .then(resource => {
        if (this.state.submitting) {
          this.safeSetState({ submitting: false });
        }
        handleFormEvent.call(this, 'afterSave', resource);
      })
      .catch(resource => {
        if (this.state.submitting) {
          this.safeSetState({ submitting: false });
        }
        handleFormEvent.call(this, 'afterRollback', resource);
      });
  };

  increaseValidation = () => {
    this.validating = this.validating + 1;
    if (!!this.validating !== this.state.validating) {
      this.safeSetState({ validating: !!this.validating });
    }
  };

  decreaseValidation = () => {
    this.validating = Math.max(this.state.validating - 1, 0);
    if (!!this.validating !== this.state.validating) {
      this.safeSetState({ validating: !!this.validating });
    }
  };
}
