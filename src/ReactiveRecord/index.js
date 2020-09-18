import Model from '../Model';
import { interpolateRoute, without, pick } from '../utils';
import {
  ACTION_MATCHER,
  ACTION_METHODS,
  ROUTE_NOT_FOUND_ERROR,
  MODEL_NOT_FOUND_ERROR,
  MODEL_NOT_VALID_ERROR,
} from '../constants';
import singletonReducer from '../reducer/singletonReducer';
import collectionReducer from '../reducer/collectionReducer';
import Collection from './Collection';
import Sugar from '../sugar';

function parseIt(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: error.message };
  }
}

export default class ReactiveRecord {
  models = {};
  model(modelStr, modelClass = false) {
    /* If we're just retrieving a model */
    if (!modelClass) {
      if (typeof this.models[modelStr] === 'undefined') {
        throw new MODEL_NOT_FOUND_ERROR(modelStr);
      }
      return this.models[modelStr];
    }
    /* Check if it's an instance of model */
    if (!(modelClass.prototype instanceof Model)) {
      throw new MODEL_NOT_VALID_ERROR(modelStr);
    }
    // Assign the model's parent
    modelClass.ReactiveRecord = this;
    // Assign the model's name
    modelClass.displayName = modelStr;
    // Assign the model's attributes name if not already defined
    if (!modelClass.attributesName) {
      modelClass.attributesName = `${Sugar.String.underscore(modelStr)}_attributes`;
    }
    // Assign the model's route inflection if not already defined
    if (!modelClass.routeInflection) {
      const { store: { singleton = false } = {} } = modelClass;
      modelClass.routeInflection = singleton ? modelStr : Sugar.String.pluralize(modelStr);
    }
    // Interpolate the model's schema
    const { schema = {} } = modelClass;
    /* eslint-disable guard-for-in */
    for (let prop in without.call(schema, '_primaryKey', '_timestamps')) {
      /* eslint-enable guard-for-in */
      const hasDescriptor = typeof schema[prop] === 'object' && schema[prop].hasOwnProperty('type');
      if (!hasDescriptor) {
        modelClass.schema[prop] = {
          type: schema[prop],
        };
      }
      if (!schema[prop].labelText) {
        schema[prop].labelText = Sugar.String.titleize(Sugar.String.humanize(prop));
      }
    }
    // Interpolate the model's routes
    const {
      routes: { only = [], except = [], ...definedRoutes } = {},
      schema: { _primaryKey = 'id' },
      store = {},
      store: { singleton = false } = {},
    } = modelClass;
    const defaultRoutes = ['index', 'create', 'show', 'update', 'destroy']
      // Removes routes if except defined
      .filter(function(action) {
        return except.indexOf(action) === -1;
      })
      // Remove routes if only defined
      .filter(function(action) {
        return !only.length || only.indexOf(action) > -1;
      });
    modelClass.routes = defaultRoutes.reduce((routes, action) => {
      let generatedRoute = ':prefix/:modelname';
      if (action.match(/^(show|update|destroy)$/)) {
        generatedRoute += `/:${_primaryKey}`;
      }
      routes[action] = routes[action] || generatedRoute;
      return routes;
    }, definedRoutes);

    modelClass.store = {
      singleton,
      reducer: singleton ? singletonReducer.bind(this, modelStr) : collectionReducer.bind(this, modelStr, _primaryKey),
      ...store,
    };
    // Assign the model
    return (this.models[modelStr] = modelClass);
  }

  API = {
    prefix: '',
    delimiter: '-',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    patchMode: true,
  };

  setAPI(opts) {
    const { prefix, delimiter, patchMode } = this.API;
    const { headers = {} } = opts;
    ({
      prefix: this.API.prefix = prefix,
      delimiter: this.API.delimiter = delimiter,
      patchMode: this.API.patchMode = patchMode,
    } = opts);
    Object.assign(this.API.headers, headers);
  }

  performAsync(action) {
    return new Promise((resolve, reject) => {
      const [, , actionName, modelName] = action.type.match(ACTION_MATCHER);
      const model = this.models[modelName];

      if (!model) {
        throw new MODEL_NOT_FOUND_ERROR(modelName);
      }

      const {
        schema: { _primaryKey = 'id' },
        routeInflection,
      } = model;
      const { _attributes = {} } = action;
      const { headers, ...apiConfig } = this.API;
      const routeTemplate = model.routes[actionName.toLowerCase()];
      const method = ACTION_METHODS[actionName.toLowerCase()];
      const schemaAttrs = Object.keys(without.call(model.schema, '_primaryKey', '_timestamps'));
      /**
       * The query string should contain...
       * for GET requests: all given attributes
       * for non-GET requests: any attributes not defined in the model schema
       */
      const query = method === 'GET' ? _attributes : without.call(_attributes, ...schemaAttrs);
      /**
       * The request body should contain...
       * for GET requests: nothing
       * for non-GET requests: any attributes defined in the model schema
       */
      const body = method === 'GET' ? {} : pick.call(_attributes, ...schemaAttrs);
      if (!routeTemplate) {
        throw new ROUTE_NOT_FOUND_ERROR();
      }

      const [route, bodyWithoutInterpolations] = interpolateRoute(
        routeTemplate,
        body,
        routeInflection,
        apiConfig,
        query
      );

      const xhr = new XMLHttpRequest();
      const { DONE } = XMLHttpRequest;
      xhr.open(method, route);
      for (let header in headers) {
        if (headers.hasOwnProperty(header)) {
          xhr.setRequestHeader(header, headers[header]);
        }
      }
      xhr.addEventListener('load', e => {
        const { status, responseText } = e.target;
        const { readyState } = xhr;
        if (readyState === DONE) {
          const body = !!responseText ? parseIt(responseText) : {};
          if (199 < status && status < 400) {
            this.handleSuccess(status, action, model, _primaryKey, actionName, modelName, resolve, body);
            return;
          }
          this.handleError(actionName, modelName, _primaryKey, _attributes[_primaryKey], reject, status, body);
        }
      });
      if (method === 'GET') {
        xhr.send();
        return;
      }
      xhr.send(JSON.stringify(bodyWithoutInterpolations));
    });
  }

  handleSuccess(responseStatus, action, model, _primaryKey, actionName, modelName, resolve, data) {
    /* 
     *  Getting this far means no errors occured processing
     *  the returned JSON or with the HTTP statuses
     */
    const isCollection = data instanceof Array;
    let resource = null;
    /* Successful requests don't need a body */
    const _request = { status: responseStatus };
    if (!isCollection) {
      if (!data.hasOwnProperty(_primaryKey) && action._attributes && action._attributes.hasOwnProperty(_primaryKey)) {
        data[_primaryKey] = action._attributes[_primaryKey];
      }
      resource = new model({ ...data, _request }, true);
    } else {
      const _collection = data.map(attrs => new model({ ...attrs, _request }, true));
      resource = new Collection({ _collection, _request, _primaryKey });
    }
    resolve(resource);
    setTimeout(() => this.dispatch({ ...resource.serialize(), type: `@OK_${actionName}(${modelName})` }), 0);
  }

  handleError(actionName, modelName, _primaryKey, key, reject, status, body) {
    const wasCollection = actionName === 'INDEX';
    const hasErrors = body.hasOwnProperty('errors');
    const _request = { status, body };
    const _errors = hasErrors ? body.errors : {};
    const errorObj = { _request };
    if (!wasCollection && key !== undefined) {
      errorObj._attributes = { [_primaryKey]: key };
    }
    if (hasErrors) {
      errorObj._errors = _errors;
    }
    reject(errorObj);
    setTimeout(() => this.dispatch({ ...errorObj, type: `@ERROR_${actionName}(${modelName})` }), 0);
  }
}
