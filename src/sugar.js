/*
 *  Sugar Custom 2017.02.20
 *
 *  has pluralize, underscore, dasherize, camelize
 * ---------------------------- */
(function() {
  'use strict';

  /***
   * @module Core
   * @description Core functionality including the ability to define methods and
   *              extend onto natives.
   *
   ***/

  // The global to export.
  var Sugar;

  // The name of Sugar in the global namespace.
  var SUGAR_GLOBAL = 'Sugar';

  // Natives available on initialization. Letting Object go first to ensure its
  // global is set by the time the rest are checking for chainable Object methods.
  var NATIVE_NAMES = 'Object Number String Array Date RegExp Function';

  // Static method flag
  var STATIC   = 0x1;

  // Instance method flag
  var INSTANCE = 0x2;

  // IE8 has a broken defineProperty but no defineProperties so this saves a try/catch.
  var PROPERTY_DESCRIPTOR_SUPPORT = !!(Object.defineProperty && Object.defineProperties);

  // The global context. Rhino uses a different "global" keyword so
  // do an extra check to be sure that it's actually the global context.
  var globalContext = typeof global !== 'undefined' && global.Object === Object ? global : this;

  // Is the environment node?
  var hasExports = typeof module !== 'undefined' && module.exports;

  // Whether object instance methods can be mapped to the prototype.
  var allowObjectPrototype = false;

  // A map from Array to SugarArray.
  var namespacesByName = {};

  // A map from [object Object] to namespace.
  var namespacesByClassString = {};

  // Defining properties.
  var defineProperty = PROPERTY_DESCRIPTOR_SUPPORT ?  Object.defineProperty : definePropertyShim;

  // A default chainable class for unknown types.
  var DefaultChainable = getNewChainableClass('Chainable');


  // Global methods

  function setupGlobal() {
    Sugar = globalContext[SUGAR_GLOBAL];
    // istanbul ignore if
    if (Sugar) {
      // Reuse already defined Sugar global object.
      return;
    }
    Sugar = function(arg) {
      forEachProperty(Sugar, function(sugarNamespace, name) {
        // Although only the only enumerable properties on the global
        // object are Sugar namespaces, environments that can't set
        // non-enumerable properties will step through the utility methods
        // as well here, so use this check to only allow true namespaces.
        if (hasOwn(namespacesByName, name)) {
          sugarNamespace.extend(arg);
        }
      });
      return Sugar;
    };
    // istanbul ignore else
    if (hasExports) {
      module.exports = Sugar;
    } else {
      try {
        globalContext[SUGAR_GLOBAL] = Sugar;
      } catch (e) {
        // Contexts such as QML have a read-only global context.
      }
    }
    forEachProperty(NATIVE_NAMES.split(' '), function(name) {
      createNamespace(name);
    });
    setGlobalProperties();
  }

  /***
   * @method createNamespace(name)
   * @returns SugarNamespace
   * @namespace Sugar
   * @short Creates a new Sugar namespace.
   * @extra This method is for plugin developers who want to define methods to be
   *        used with natives that Sugar does not handle by default. The new
   *        namespace will appear on the `Sugar` global with all the methods of
   *        normal namespaces, including the ability to define new methods. When
   *        extended, any defined methods will be mapped to `name` in the global
   *        context.
   *
   * @example
   *
   *   Sugar.createNamespace('Boolean');
   *
   * @param {string} name - The namespace name.
   *
   ***/
  function createNamespace(name) {

    // Is the current namespace Object?
    var isObject = name === 'Object';

    // A Sugar namespace is also a chainable class: Sugar.Array, etc.
    var sugarNamespace = getNewChainableClass(name, true);

    /***
     * @method extend([opts])
     * @returns Sugar
     * @namespace Sugar
     * @short Extends Sugar defined methods onto natives.
     * @extra This method can be called on individual namespaces like
     *        `Sugar.Array` or on the `Sugar` global itself, in which case
     *        [opts] will be forwarded to each `extend` call. For more,
     *        see `extending`.
     *
     * @options
     *
     *   methods           An array of method names to explicitly extend.
     *
     *   except            An array of method names or global namespaces (`Array`,
     *                     `String`) to explicitly exclude. Namespaces should be the
     *                     actual global objects, not strings.
     *
     *   namespaces        An array of global namespaces (`Array`, `String`) to
     *                     explicitly extend. Namespaces should be the actual
     *                     global objects, not strings.
     *
     *   enhance           A shortcut to disallow all "enhance" flags at once
     *                     (flags listed below). For more, see `enhanced methods`.
     *                     Default is `true`.
     *
     *   enhanceString     A boolean allowing String enhancements. Default is `true`.
     *
     *   enhanceArray      A boolean allowing Array enhancements. Default is `true`.
     *
     *   objectPrototype   A boolean allowing Sugar to extend Object.prototype
     *                     with instance methods. This option is off by default
     *                     and should generally not be used except with caution.
     *                     For more, see `object methods`.
     *
     * @example
     *
     *   Sugar.Array.extend();
     *   Sugar.extend();
     *
     * @option {Array<string>} [methods]
     * @option {Array<string|NativeConstructor>} [except]
     * @option {Array<NativeConstructor>} [namespaces]
     * @option {boolean} [enhance]
     * @option {boolean} [enhanceString]
     * @option {boolean} [enhanceArray]
     * @option {boolean} [objectPrototype]
     * @param {ExtendOptions} [opts]
     *
     ***
     * @method extend([opts])
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Extends Sugar defined methods for a specific namespace onto natives.
     * @param {ExtendOptions} [opts]
     *
     ***/
    var extend = function (opts) {

      var nativeClass = globalContext[name], nativeProto = nativeClass.prototype;
      var staticMethods = {}, instanceMethods = {}, methodsByName;

      function objectRestricted(name, target) {
        return isObject && target === nativeProto &&
               (!allowObjectPrototype || name === 'get' || name === 'set');
      }

      function arrayOptionExists(field, val) {
        var arr = opts[field];
        if (arr) {
          for (var i = 0, el; el = arr[i]; i++) {
            if (el === val) {
              return true;
            }
          }
        }
        return false;
      }

      function arrayOptionExcludes(field, val) {
        return opts[field] && !arrayOptionExists(field, val);
      }

      function disallowedByFlags(methodName, target, flags) {
        // Disallowing methods by flag currently only applies if methods already
        // exist to avoid enhancing native methods, as aliases should still be
        // extended (i.e. Array#all should still be extended even if Array#every
        // is being disallowed by a flag).
        if (!target[methodName] || !flags) {
          return false;
        }
        for (var i = 0; i < flags.length; i++) {
          if (opts[flags[i]] === false) {
            return true;
          }
        }
      }

      function namespaceIsExcepted() {
        return arrayOptionExists('except', nativeClass) ||
               arrayOptionExcludes('namespaces', nativeClass);
      }

      function methodIsExcepted(methodName) {
        return arrayOptionExists('except', methodName);
      }

      function canExtend(methodName, method, target) {
        return !objectRestricted(methodName, target) &&
               !disallowedByFlags(methodName, target, method.flags) &&
               !methodIsExcepted(methodName);
      }

      opts = opts || {};
      methodsByName = opts.methods;

      if (namespaceIsExcepted()) {
        return;
      } else if (isObject && typeof opts.objectPrototype === 'boolean') {
        // Store "objectPrototype" flag for future reference.
        allowObjectPrototype = opts.objectPrototype;
      }

      forEachProperty(methodsByName || sugarNamespace, function(method, methodName) {
        if (methodsByName) {
          // If we have method names passed in an array,
          // then we need to flip the key and value here
          // and find the method in the Sugar namespace.
          methodName = method;
          method = sugarNamespace[methodName];
        }
        if (hasOwn(method, 'instance') && canExtend(methodName, method, nativeProto)) {
          instanceMethods[methodName] = method.instance;
        }
        if(hasOwn(method, 'static') && canExtend(methodName, method, nativeClass)) {
          staticMethods[methodName] = method;
        }
      });

      // Accessing the extend target each time instead of holding a reference as
      // it may have been overwritten (for example Date by Sinon). Also need to
      // access through the global to allow extension of user-defined namespaces.
      extendNative(nativeClass, staticMethods);
      extendNative(nativeProto, instanceMethods);

      if (!methodsByName) {
        // If there are no method names passed, then
        // all methods in the namespace will be extended
        // to the native. This includes all future defined
        // methods, so add a flag here to check later.
        setProperty(sugarNamespace, 'active', true);
      }
      return sugarNamespace;
    };

    function defineWithOptionCollect(methodName, instance, args) {
      setProperty(sugarNamespace, methodName, function(arg1, arg2, arg3) {
        var opts = collectDefineOptions(arg1, arg2, arg3);
        defineMethods(sugarNamespace, opts.methods, instance, args, opts.last);
        return sugarNamespace;
      });
    }

    /***
     * @method defineStatic(methods)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Defines static methods on the namespace that can later be extended
     *        onto the native globals.
     * @extra Accepts either a single object mapping names to functions, or name
     *        and function as two arguments. If `extend` was previously called
     *        with no arguments, the method will be immediately mapped to its
     *        native when defined.
     *
     * @example
     *
     *   Sugar.Number.defineStatic({
     *     isOdd: function (num) {
     *       return num % 2 === 1;
     *     }
     *   });
     *
     * @signature defineStatic(methodName, methodFn)
     * @param {Object} methods - Methods to be defined.
     * @param {string} methodName - Name of a single method to be defined.
     * @param {Function} methodFn - Function body of a single method to be defined.
     ***/
    defineWithOptionCollect('defineStatic', STATIC);

    /***
     * @method defineInstance(methods)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Defines methods on the namespace that can later be extended as
     *        instance methods onto the native prototype.
     * @extra Accepts either a single object mapping names to functions, or name
     *        and function as two arguments. All functions should accept the
     *        native for which they are mapped as their first argument, and should
     *        never refer to `this`. If `extend` was previously called with no
     *        arguments, the method will be immediately mapped to its native when
     *        defined.
     *
     *        Methods cannot accept more than 4 arguments in addition to the
     *        native (5 arguments total). Any additional arguments will not be
     *        mapped. If the method needs to accept unlimited arguments, use
     *        `defineInstanceWithArguments`. Otherwise if more options are
     *        required, use an options object instead.
     *
     * @example
     *
     *   Sugar.Number.defineInstance({
     *     square: function (num) {
     *       return num * num;
     *     }
     *   });
     *
     * @signature defineInstance(methodName, methodFn)
     * @param {Object} methods - Methods to be defined.
     * @param {string} methodName - Name of a single method to be defined.
     * @param {Function} methodFn - Function body of a single method to be defined.
     ***/
    defineWithOptionCollect('defineInstance', INSTANCE);

    /***
     * @method defineInstanceAndStatic(methods)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short A shortcut to define both static and instance methods on the namespace.
     * @extra This method is intended for use with `Object` instance methods. Sugar
     *        will not map any methods to `Object.prototype` by default, so defining
     *        instance methods as static helps facilitate their proper use.
     *
     * @example
     *
     *   Sugar.Object.defineInstanceAndStatic({
     *     isAwesome: function (obj) {
     *       // check if obj is awesome!
     *     }
     *   });
     *
     * @signature defineInstanceAndStatic(methodName, methodFn)
     * @param {Object} methods - Methods to be defined.
     * @param {string} methodName - Name of a single method to be defined.
     * @param {Function} methodFn - Function body of a single method to be defined.
     ***/
    defineWithOptionCollect('defineInstanceAndStatic', INSTANCE | STATIC);


    /***
     * @method defineStaticWithArguments(methods)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Defines static methods that collect arguments.
     * @extra This method is identical to `defineStatic`, except that when defined
     *        methods are called, they will collect any arguments past `n - 1`,
     *        where `n` is the number of arguments that the method accepts.
     *        Collected arguments will be passed to the method in an array
     *        as the last argument defined on the function.
     *
     * @example
     *
     *   Sugar.Number.defineStaticWithArguments({
     *     addAll: function (num, args) {
     *       for (var i = 0; i < args.length; i++) {
     *         num += args[i];
     *       }
     *       return num;
     *     }
     *   });
     *
     * @signature defineStaticWithArguments(methodName, methodFn)
     * @param {Object} methods - Methods to be defined.
     * @param {string} methodName - Name of a single method to be defined.
     * @param {Function} methodFn - Function body of a single method to be defined.
     ***/
    defineWithOptionCollect('defineStaticWithArguments', STATIC, true);

    /***
     * @method defineInstanceWithArguments(methods)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Defines instance methods that collect arguments.
     * @extra This method is identical to `defineInstance`, except that when
     *        defined methods are called, they will collect any arguments past
     *        `n - 1`, where `n` is the number of arguments that the method
     *        accepts. Collected arguments will be passed to the method as the
     *        last argument defined on the function.
     *
     * @example
     *
     *   Sugar.Number.defineInstanceWithArguments({
     *     addAll: function (num, args) {
     *       for (var i = 0; i < args.length; i++) {
     *         num += args[i];
     *       }
     *       return num;
     *     }
     *   });
     *
     * @signature defineInstanceWithArguments(methodName, methodFn)
     * @param {Object} methods - Methods to be defined.
     * @param {string} methodName - Name of a single method to be defined.
     * @param {Function} methodFn - Function body of a single method to be defined.
     ***/
    defineWithOptionCollect('defineInstanceWithArguments', INSTANCE, true);

    /***
     * @method defineStaticPolyfill(methods)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Defines static methods that are mapped onto the native if they do
     *        not already exist.
     * @extra Intended only for use creating polyfills that follow the ECMAScript
     *        spec. Accepts either a single object mapping names to functions, or
     *        name and function as two arguments. Note that polyfill methods will
     *        be immediately mapped onto their native prototype regardless of the
     *        use of `extend`.
     *
     * @example
     *
     *   Sugar.Object.defineStaticPolyfill({
     *     keys: function (obj) {
     *       // get keys!
     *     }
     *   });
     *
     * @signature defineStaticPolyfill(methodName, methodFn)
     * @param {Object} methods - Methods to be defined.
     * @param {string} methodName - Name of a single method to be defined.
     * @param {Function} methodFn - Function body of a single method to be defined.
     ***/
    setProperty(sugarNamespace, 'defineStaticPolyfill', function(arg1, arg2, arg3) {
      var opts = collectDefineOptions(arg1, arg2, arg3);
      extendNative(globalContext[name], opts.methods, true, opts.last);
      return sugarNamespace;
    });

    /***
     * @method defineInstancePolyfill(methods)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Defines instance methods that are mapped onto the native prototype
     *        if they do not already exist.
     * @extra Intended only for use creating polyfills that follow the ECMAScript
     *        spec. Accepts either a single object mapping names to functions, or
     *        name and function as two arguments. This method differs from
     *        `defineInstance` as there is no static signature (as the method
     *        is mapped as-is to the native), so it should refer to its `this`
     *        object. Note that polyfill methods will be immediately mapped onto
     *        their native prototype regardless of the use of `extend`.
     *
     * @example
     *
     *   Sugar.Array.defineInstancePolyfill({
     *     indexOf: function (arr, el) {
     *       // index finding code here!
     *     }
     *   });
     *
     * @signature defineInstancePolyfill(methodName, methodFn)
     * @param {Object} methods - Methods to be defined.
     * @param {string} methodName - Name of a single method to be defined.
     * @param {Function} methodFn - Function body of a single method to be defined.
     ***/
    setProperty(sugarNamespace, 'defineInstancePolyfill', function(arg1, arg2, arg3) {
      var opts = collectDefineOptions(arg1, arg2, arg3);
      extendNative(globalContext[name].prototype, opts.methods, true, opts.last);
      // Map instance polyfills to chainable as well.
      forEachProperty(opts.methods, function(fn, methodName) {
        defineChainableMethod(sugarNamespace, methodName, fn);
      });
      return sugarNamespace;
    });

    /***
     * @method alias(toName, from)
     * @returns SugarNamespace
     * @namespace SugarNamespace
     * @short Aliases one Sugar method to another.
     *
     * @example
     *
     *   Sugar.Array.alias('all', 'every');
     *
     * @signature alias(toName, fn)
     * @param {string} toName - Name for new method.
     * @param {string|Function} from - Method to alias, or string shortcut.
     ***/
    setProperty(sugarNamespace, 'alias', function(name, source) {
      var method = typeof source === 'string' ? sugarNamespace[source] : source;
      setMethod(sugarNamespace, name, method);
      return sugarNamespace;
    });

    // Each namespace can extend only itself through its .extend method.
    setProperty(sugarNamespace, 'extend', extend);

    // Cache the class to namespace relationship for later use.
    namespacesByName[name] = sugarNamespace;
    namespacesByClassString['[object ' + name + ']'] = sugarNamespace;

    mapNativeToChainable(name);
    mapObjectChainablesToNamespace(sugarNamespace);


    // Export
    return Sugar[name] = sugarNamespace;
  }

  function setGlobalProperties() {
    setProperty(Sugar, 'extend', Sugar);
    setProperty(Sugar, 'toString', toString);
    setProperty(Sugar, 'createNamespace', createNamespace);

    setProperty(Sugar, 'util', {
      'hasOwn': hasOwn,
      'getOwn': getOwn,
      'setProperty': setProperty,
      'classToString': classToString,
      'defineProperty': defineProperty,
      'forEachProperty': forEachProperty,
      'mapNativeToChainable': mapNativeToChainable
    });
  }

  function toString() {
    return SUGAR_GLOBAL;
  }


  // Defining Methods

  function defineMethods(sugarNamespace, methods, type, args, flags) {
    forEachProperty(methods, function(method, methodName) {
      var instanceMethod, staticMethod = method;
      if (args) {
        staticMethod = wrapMethodWithArguments(method);
      }
      if (flags) {
        staticMethod.flags = flags;
      }

      // A method may define its own custom implementation, so
      // make sure that's not the case before creating one.
      if (type & INSTANCE && !method.instance) {
        instanceMethod = wrapInstanceMethod(method, args);
        setProperty(staticMethod, 'instance', instanceMethod);
      }

      if (type & STATIC) {
        setProperty(staticMethod, 'static', true);
      }

      setMethod(sugarNamespace, methodName, staticMethod);

      if (sugarNamespace.active) {
        // If the namespace has been activated (.extend has been called),
        // then map this method as well.
        sugarNamespace.extend(methodName);
      }
    });
  }

  function collectDefineOptions(arg1, arg2, arg3) {
    var methods, last;
    if (typeof arg1 === 'string') {
      methods = {};
      methods[arg1] = arg2;
      last = arg3;
    } else {
      methods = arg1;
      last = arg2;
    }
    return {
      last: last,
      methods: methods
    };
  }

  function wrapInstanceMethod(fn, args) {
    return args ? wrapMethodWithArguments(fn, true) : wrapInstanceMethodFixed(fn);
  }

  function wrapMethodWithArguments(fn, instance) {
    // Functions accepting enumerated arguments will always have "args" as the
    // last argument, so subtract one from the function length to get the point
    // at which to start collecting arguments. If this is an instance method on
    // a prototype, then "this" will be pushed into the arguments array so start
    // collecting 1 argument earlier.
    var startCollect = fn.length - 1 - (instance ? 1 : 0);
    return function() {
      var args = [], collectedArgs = [], len;
      if (instance) {
        args.push(this);
      }
      len = Math.max(arguments.length, startCollect);
      // Optimized: no leaking arguments
      for (var i = 0; i < len; i++) {
        if (i < startCollect) {
          args.push(arguments[i]);
        } else {
          collectedArgs.push(arguments[i]);
        }
      }
      args.push(collectedArgs);
      return fn.apply(this, args);
    };
  }

  function wrapInstanceMethodFixed(fn) {
    switch(fn.length) {
      // Wrapped instance methods will always be passed the instance
      // as the first argument, but requiring the argument to be defined
      // may cause confusion here, so return the same wrapped function regardless.
      case 0:
      case 1:
        return function() {
          return fn(this);
        };
      case 2:
        return function(a) {
          return fn(this, a);
        };
      case 3:
        return function(a, b) {
          return fn(this, a, b);
        };
      case 4:
        return function(a, b, c) {
          return fn(this, a, b, c);
        };
      case 5:
        return function(a, b, c, d) {
          return fn(this, a, b, c, d);
        };
    }
  }

  // Method helpers

  function extendNative(target, source, polyfill, override) {
    forEachProperty(source, function(method, name) {
      if (polyfill && !override && target[name]) {
        // Method exists, so bail.
        return;
      }
      setProperty(target, name, method);
    });
  }

  function setMethod(sugarNamespace, methodName, method) {
    sugarNamespace[methodName] = method;
    if (method.instance) {
      defineChainableMethod(sugarNamespace, methodName, method.instance, true);
    }
  }


  // Chainables

  function getNewChainableClass(name) {
    var fn = function SugarChainable(obj, arg) {
      if (!(this instanceof fn)) {
        return new fn(obj, arg);
      }
      if (this.constructor !== fn) {
        // Allow modules to define their own constructors.
        obj = this.constructor.apply(obj, arguments);
      }
      this.raw = obj;
    };
    setProperty(fn, 'toString', function() {
      return SUGAR_GLOBAL + name;
    });
    setProperty(fn.prototype, 'valueOf', function() {
      return this.raw;
    });
    return fn;
  }

  function defineChainableMethod(sugarNamespace, methodName, fn) {
    var wrapped = wrapWithChainableResult(fn), existing, collision, dcp;
    dcp = DefaultChainable.prototype;
    existing = dcp[methodName];

    // If the method was previously defined on the default chainable, then a
    // collision exists, so set the method to a disambiguation function that will
    // lazily evaluate the object and find it's associated chainable. An extra
    // check is required to avoid false positives from Object inherited methods.
    collision = existing && existing !== Object.prototype[methodName];

    // The disambiguation function is only required once.
    if (!existing || !existing.disambiguate) {
      dcp[methodName] = collision ? disambiguateMethod(methodName) : wrapped;
    }

    // The target chainable always receives the wrapped method. Additionally,
    // if the target chainable is Sugar.Object, then map the wrapped method
    // to all other namespaces as well if they do not define their own method
    // of the same name. This way, a Sugar.Number will have methods like
    // isEqual that can be called on any object without having to traverse up
    // the prototype chain and perform disambiguation, which costs cycles.
    // Note that the "if" block below actually does nothing on init as Object
    // goes first and no other namespaces exist yet. However it needs to be
    // here as Object instance methods defined later also need to be mapped
    // back onto existing namespaces.
    sugarNamespace.prototype[methodName] = wrapped;
    if (sugarNamespace === Sugar.Object) {
      mapObjectChainableToAllNamespaces(methodName, wrapped);
    }
  }

  function mapObjectChainablesToNamespace(sugarNamespace) {
    forEachProperty(Sugar.Object && Sugar.Object.prototype, function(val, methodName) {
      if (typeof val === 'function') {
        setObjectChainableOnNamespace(sugarNamespace, methodName, val);
      }
    });
  }

  function mapObjectChainableToAllNamespaces(methodName, fn) {
    forEachProperty(namespacesByName, function(sugarNamespace) {
      setObjectChainableOnNamespace(sugarNamespace, methodName, fn);
    });
  }

  function setObjectChainableOnNamespace(sugarNamespace, methodName, fn) {
    var proto = sugarNamespace.prototype;
    if (!hasOwn(proto, methodName)) {
      proto[methodName] = fn;
    }
  }

  function wrapWithChainableResult(fn) {
    return function() {
      return new DefaultChainable(fn.apply(this.raw, arguments));
    };
  }

  function disambiguateMethod(methodName) {
    var fn = function() {
      var raw = this.raw, sugarNamespace;
      if (raw != null) {
        // Find the Sugar namespace for this unknown.
        sugarNamespace = namespacesByClassString[classToString(raw)];
      }
      if (!sugarNamespace) {
        // If no sugarNamespace can be resolved, then default
        // back to Sugar.Object so that undefined and other
        // non-supported types can still have basic object
        // methods called on them, such as type checks.
        sugarNamespace = Sugar.Object;
      }

      return new sugarNamespace(raw)[methodName].apply(this, arguments);
    };
    fn.disambiguate = true;
    return fn;
  }

  function mapNativeToChainable(name, methodNames) {
    var sugarNamespace = namespacesByName[name],
        nativeProto = globalContext[name].prototype;

    if (!methodNames && ownPropertyNames) {
      methodNames = ownPropertyNames(nativeProto);
    }

    forEachProperty(methodNames, function(methodName) {
      if (nativeMethodProhibited(methodName)) {
        // Sugar chainables have their own constructors as well as "valueOf"
        // methods, so exclude them here. The __proto__ argument should be trapped
        // by the function check below, however simply accessing this property on
        // Object.prototype causes QML to segfault, so pre-emptively excluding it.
        return;
      }
      try {
        var fn = nativeProto[methodName];
        if (typeof fn !== 'function') {
          // Bail on anything not a function.
          return;
        }
      } catch (e) {
        // Function.prototype has properties that
        // will throw errors when accessed.
        return;
      }
      defineChainableMethod(sugarNamespace, methodName, fn);
    });
  }

  function nativeMethodProhibited(methodName) {
    return methodName === 'constructor' ||
           methodName === 'valueOf' ||
           methodName === '__proto__';
  }


  // Util

  // Internal references
  var ownPropertyNames = Object.getOwnPropertyNames,
      internalToString = Object.prototype.toString,
      internalHasOwnProperty = Object.prototype.hasOwnProperty;

  // Defining this as a variable here as the ES5 module
  // overwrites it to patch DONTENUM.
  var forEachProperty = function (obj, fn) {
    for(var key in obj) {
      if (!hasOwn(obj, key)) continue;
      if (fn.call(obj, obj[key], key, obj) === false) break;
    }
  };

  // istanbul ignore next
  function definePropertyShim(obj, prop, descriptor) {
    obj[prop] = descriptor.value;
  }

  function setProperty(target, name, value, enumerable) {
    defineProperty(target, name, {
      value: value,
      enumerable: !!enumerable,
      configurable: true,
      writable: true
    });
  }

  // PERF: Attempts to speed this method up get very Heisenbergy. Quickly
  // returning based on typeof works for primitives, but slows down object
  // types. Even === checks on null and undefined (no typeof) will end up
  // basically breaking even. This seems to be as fast as it can go.
  function classToString(obj) {
    return internalToString.call(obj);
  }

  function hasOwn(obj, prop) {
    return !!obj && internalHasOwnProperty.call(obj, prop);
  }

  function getOwn(obj, prop) {
    if (hasOwn(obj, prop)) {
      return obj[prop];
    }
  }

  setupGlobal();

  /***
   * @module Common
   * @description Internal utility and common methods.
   ***/


  // For type checking, etc. Excludes object as this is more nuanced.
  var NATIVE_TYPES = 'Boolean Number String Date RegExp Function Array Error Set Map';

  // Namespace aliases
  var sugarObject   = Sugar.Object,
      sugarArray    = Sugar.Array,
      sugarDate     = Sugar.Date,
      sugarString   = Sugar.String,
      sugarNumber   = Sugar.Number,
      sugarFunction = Sugar.Function,
      sugarRegExp   = Sugar.RegExp;

  // Core utility aliases
  var hasOwn               = Sugar.util.hasOwn,
      getOwn               = Sugar.util.getOwn,
      setProperty          = Sugar.util.setProperty,
      classToString        = Sugar.util.classToString,
      defineProperty       = Sugar.util.defineProperty,
      forEachProperty      = Sugar.util.forEachProperty,
      mapNativeToChainable = Sugar.util.mapNativeToChainable;

  // Class checks
  var isSerializable,
      isBoolean, isNumber, isString,
      isDate, isRegExp, isFunction,
      isArray, isSet, isMap, isError;

  function buildClassChecks() {

    var knownTypes = {};

    function addCoreTypes() {

      var names = spaceSplit(NATIVE_TYPES);

      isBoolean = buildPrimitiveClassCheck(names[0]);
      isNumber  = buildPrimitiveClassCheck(names[1]);
      isString  = buildPrimitiveClassCheck(names[2]);

      isDate   = buildClassCheck(names[3]);
      isRegExp = buildClassCheck(names[4]);

      // Wanted to enhance performance here by using simply "typeof"
      // but Firefox has two major issues that make this impossible,
      // one fixed, the other not, so perform a full class check here.
      //
      // 1. Regexes can be typeof "function" in FF < 3
      //    https://bugzilla.mozilla.org/show_bug.cgi?id=61911 (fixed)
      //
      // 2. HTMLEmbedElement and HTMLObjectElement are be typeof "function"
      //    https://bugzilla.mozilla.org/show_bug.cgi?id=268945 (won't fix)
      isFunction = buildClassCheck(names[5]);


      isArray = Array.isArray || buildClassCheck(names[6]);
      isError = buildClassCheck(names[7]);

      isSet = buildClassCheck(names[8], typeof Set !== 'undefined' && Set);
      isMap = buildClassCheck(names[9], typeof Map !== 'undefined' && Map);

      // Add core types as known so that they can be checked by value below,
      // notably excluding Functions and adding Arguments and Error.
      addKnownType('Arguments');
      addKnownType(names[0]);
      addKnownType(names[1]);
      addKnownType(names[2]);
      addKnownType(names[3]);
      addKnownType(names[4]);
      addKnownType(names[6]);

    }

    function addArrayTypes() {
      var types = 'Int8 Uint8 Uint8Clamped Int16 Uint16 Int32 Uint32 Float32 Float64';
      forEach(spaceSplit(types), function(str) {
        addKnownType(str + 'Array');
      });
    }

    function addKnownType(className) {
      var str = '[object '+ className +']';
      knownTypes[str] = true;
    }

    function isKnownType(className) {
      return knownTypes[className];
    }

    function buildClassCheck(className, globalObject) {
      // istanbul ignore if
      if (globalObject && isClass(new globalObject, 'Object')) {
        return getConstructorClassCheck(globalObject);
      } else {
        return getToStringClassCheck(className);
      }
    }

    // Map and Set may be [object Object] in certain IE environments.
    // In this case we need to perform a check using the constructor
    // instead of Object.prototype.toString.
    // istanbul ignore next
    function getConstructorClassCheck(obj) {
      var ctorStr = String(obj);
      return function(obj) {
        return String(obj.constructor) === ctorStr;
      };
    }

    function getToStringClassCheck(className) {
      return function(obj, str) {
        // perf: Returning up front on instanceof appears to be slower.
        return isClass(obj, className, str);
      };
    }

    function buildPrimitiveClassCheck(className) {
      var type = className.toLowerCase();
      return function(obj) {
        var t = typeof obj;
        return t === type || t === 'object' && isClass(obj, className);
      };
    }

    addCoreTypes();
    addArrayTypes();

    isSerializable = function(obj, className) {
      // Only known objects can be serialized. This notably excludes functions,
      // host objects, Symbols (which are matched by reference), and instances
      // of classes. The latter can arguably be matched by value, but
      // distinguishing between these and host objects -- which should never be
      // compared by value -- is very tricky so not dealing with it here.
      className = className || classToString(obj);
      return isKnownType(className) || isPlainObject(obj, className);
    };

  }

  function isClass(obj, className, str) {
    if (!str) {
      str = classToString(obj);
    }
    return str === '[object '+ className +']';
  }

  // Wrapping the core's "define" methods to
  // save a few bytes in the minified script.
  function wrapNamespace(method) {
    return function(sugarNamespace, arg1, arg2) {
      sugarNamespace[method](arg1, arg2);
    };
  }

  // Method define aliases
  var alias                       = wrapNamespace('alias'),
      defineStatic                = wrapNamespace('defineStatic'),
      defineInstance              = wrapNamespace('defineInstance'),
      defineStaticPolyfill        = wrapNamespace('defineStaticPolyfill'),
      defineInstancePolyfill      = wrapNamespace('defineInstancePolyfill'),
      defineInstanceAndStatic     = wrapNamespace('defineInstanceAndStatic'),
      defineInstanceWithArguments = wrapNamespace('defineInstanceWithArguments');

  function isObjectType(obj, type) {
    return !!obj && (type || typeof obj) === 'object';
  }

  function isPlainObject(obj, className) {
    return isObjectType(obj) &&
           isClass(obj, 'Object', className) &&
           hasValidPlainObjectPrototype(obj) &&
           hasOwnEnumeratedProperties(obj);
  }

  function hasValidPlainObjectPrototype(obj) {
    var hasToString = 'toString' in obj;
    var hasConstructor = 'constructor' in obj;
    // An object created with Object.create(null) has no methods in the
    // prototype chain, so check if any are missing. The additional hasToString
    // check is for false positives on some host objects in old IE which have
    // toString but no constructor. If the object has an inherited constructor,
    // then check if it is Object (the "isPrototypeOf" tapdance here is a more
    // robust way of ensuring this if the global has been hijacked). Note that
    // accessing the constructor directly (without "in" or "hasOwnProperty")
    // will throw a permissions error in IE8 on cross-domain windows.
    return (!hasConstructor && !hasToString) ||
            (hasConstructor && !hasOwn(obj, 'constructor') &&
             hasOwn(obj.constructor.prototype, 'isPrototypeOf'));
  }

  function hasOwnEnumeratedProperties(obj) {
    // Plain objects are generally defined as having enumerated properties
    // all their own, however in early IE environments without defineProperty,
    // there may also be enumerated methods in the prototype chain, so check
    // for both of these cases.
    var objectProto = Object.prototype;
    for (var key in obj) {
      var val = obj[key];
      if (!hasOwn(obj, key) && val !== objectProto[key]) {
        return false;
      }
    }
    return true;
  }

  function isArrayIndex(n) {
    return n >>> 0 == n && n != 0xFFFFFFFF;
  }

  function iterateOverSparseArray(arr, fn, fromIndex, loop) {
    var indexes = getSparseArrayIndexes(arr, fromIndex, loop), index;
    for (var i = 0, len = indexes.length; i < len; i++) {
      index = indexes[i];
      fn.call(arr, arr[index], index, arr);
    }
    return arr;
  }

  // It's unclear whether or not sparse arrays qualify as "simple enumerables".
  // If they are not, however, the wrapping function will be deoptimized, so
  // isolate here (also to share between es5 and array modules).
  function getSparseArrayIndexes(arr, fromIndex, loop, fromRight) {
    var indexes = [], i;
    for (i in arr) {
      if (isArrayIndex(i) && (loop || (fromRight ? i <= fromIndex : i >= fromIndex))) {
        indexes.push(+i);
      }
    }
    indexes.sort(function(a, b) {
      var aLoop = a > fromIndex;
      var bLoop = b > fromIndex;
      // This block cannot be reached unless ES5 methods are being shimmed.
      // istanbul ignore if
      if (aLoop !== bLoop) {
        return aLoop ? -1 : 1;
      }
      return a - b;
    });
    return indexes;
  }

  function spaceSplit(str) {
    return str.split(' ');
  }

  function forEach(arr, fn) {
    for (var i = 0, len = arr.length; i < len; i++) {
      if (!(i in arr)) {
        return iterateOverSparseArray(arr, fn, i);
      }
      fn(arr[i], i);
    }
  }

  function simpleCapitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  var Inflections = {};

  function getAcronym(str) {
    return Inflections.acronyms && Inflections.acronyms.find(str);
  }

  buildClassChecks();

  /***
   * @module String
   * @description String manupulation, encoding, truncation, and formatting, and more.
   *
   ***/


  // Matches non-punctuation characters except apostrophe for capitalization.
  var CAPITALIZE_REG = /[^\u0000-\u0040\u005B-\u0060\u007B-\u007F]+('s)?/g;

  // Regex matching camelCase.
  var CAMELIZE_REG = /(^|_)([^_]+)/g;

  function stringUnderscore(str) {
    var areg = Inflections.acronyms && Inflections.acronyms.reg;
    return str
      .replace(/[-\s]+/g, '_')
      .replace(areg, function(acronym, index) {
        return (index > 0 ? '_' : '') + acronym.toLowerCase();
      })
      .replace(/([A-Z\d]+)([A-Z][a-z])/g,'$1_$2')
      .replace(/([a-z\d])([A-Z])/g,'$1_$2')
      .toLowerCase();
  }

  function stringCamelize(str, upper) {
    str = stringUnderscore(str);
    return str.replace(CAMELIZE_REG, function(match, pre, word, index) {
      var cap = upper !== false || index > 0, acronym;
      acronym = getAcronym(word);
      if (acronym && cap) {
        return acronym;
      }
      return cap ? stringCapitalize(word, true) : word;
    });
  }

  function stringCapitalize(str, downcase, all) {
    if (downcase) {
      str = str.toLowerCase();
    }
    return all ? str.replace(CAPITALIZE_REG, simpleCapitalize) : simpleCapitalize(str);
  }

  defineInstance(sugarString, {

    /***
     * @method dasherize()
     * @returns String
     * @short Converts underscores and camel casing to hypens.
     *
     * @example
     *
     *   'a_farewell_to_arms'.dasherize() -> 'a-farewell-to-arms'
     *   'capsLock'.dasherize()           -> 'caps-lock'
     *
     ***/
    'dasherize': function(str) {
      return stringUnderscore(str).replace(/_/g, '-');
    },

    /***
     * @method underscore()
     * @returns String
     * @short Converts hyphens and camel casing to underscores.
     *
     * @example
     *
     *   'a-farewell-to-arms'.underscore() -> 'a_farewell_to_arms'
     *   'capsLock'.underscore()           -> 'caps_lock'
     *
     ***/
    'underscore': function(str) {
      return stringUnderscore(str);
    },

    /***
     * @method camelize([upper] = true)
     * @returns String
     * @short Converts underscores and hyphens to camel case.
     * @extra If [upper] is true, the string will be UpperCamelCase. If the
     *        inflections module is included, acronyms can also be defined that
     *        will be used when camelizing.
     *
     * @example
     *
     *   'caps_lock'.camelize()              -> 'CapsLock'
     *   'moz-border-radius'.camelize()      -> 'MozBorderRadius'
     *   'moz-border-radius'.camelize(false) -> 'mozBorderRadius'
     *   'http-method'.camelize()            -> 'HTTPMethod'
     *
     * @param {boolean} [upper]
     *
     ***/
    'camelize': function(str, upper) {
      return stringCamelize(str, upper);
    }

  });

  /***
   * @module Inflections
   * @namespace String
   * @description Pluralization and support for acronyms and humanized strings in
   *              string inflecting methods.
   *
   ***/


  var InflectionSet;

  function buildInflectionSet() {

    InflectionSet = function() {
      this.map = {};
      this.rules = [];
    };

    InflectionSet.prototype = {

      add: function(rule, replacement) {
        if (isString(rule)) {
          this.map[rule] = replacement;
        } else {
          this.rules.unshift({
            rule: rule,
            replacement: replacement
          });
        }
      },

      inflect: function(str) {
        var arr, idx, word;

        arr = str.split(' ');
        idx = arr.length - 1;
        word = arr[idx];

        arr[idx] = this.find(word) || this.runRules(word);
        return arr.join(' ');
      },

      find: function(str) {
        return getOwn(this.map, str);
      },

      runRules: function(str) {
        for (var i = 0, r; r = this.rules[i]; i++) {
          if (r.rule.test(str)) {
            str = str.replace(r.rule, r.replacement);
            break;
          }
        }
        return str;
      }

    };

  }

  // Global inflection runners. Allowing the build functions below to define
  // these functions so that common inflections will also be bundled together
  // when these methods are modularized.
  var inflectPlurals;

  function buildCommonPlurals() {

    inflectPlurals = function(type, str) {
      return Inflections[type] && Inflections[type].inflect(str) || str;
    };

    addPlural(/$/, 's');
    addPlural(/s$/i, 's');
    addPlural(/(ax|test)is$/i, '$1es');
    addPlural(/(octop|fung|foc|radi|alumn|cact)(i|us)$/i, '$1i');
    addPlural(/(census|alias|status|fetus|genius|virus)$/i, '$1es');
    addPlural(/(bu)s$/i, '$1ses');
    addPlural(/(buffal|tomat)o$/i, '$1oes');
    addPlural(/([ti])um$/i, '$1a');
    addPlural(/([ti])a$/i, '$1a');
    addPlural(/sis$/i, 'ses');
    addPlural(/f+e?$/i, 'ves');
    addPlural(/(cuff|roof)$/i, '$1s');
    addPlural(/([ht]ive)$/i, '$1s');
    addPlural(/([^aeiouy]o)$/i, '$1es');
    addPlural(/([^aeiouy]|qu)y$/i, '$1ies');
    addPlural(/(x|ch|ss|sh)$/i, '$1es');
    addPlural(/(tr|vert)(?:ix|ex)$/i, '$1ices');
    addPlural(/([ml])ouse$/i, '$1ice');
    addPlural(/([ml])ice$/i, '$1ice');
    addPlural(/^(ox)$/i, '$1en');
    addPlural(/^(oxen)$/i, '$1');
    addPlural(/(quiz)$/i, '$1zes');
    addPlural(/(phot|cant|hom|zer|pian|portic|pr|quart|kimon)o$/i, '$1os');
    addPlural(/(craft)$/i, '$1');
    addPlural(/([ft])[eo]{2}(th?)$/i, '$1ee$2');

    addSingular(/s$/i, '');
    addSingular(/([pst][aiu]s)$/i, '$1');
    addSingular(/([aeiouy])ss$/i, '$1ss');
    addSingular(/(n)ews$/i, '$1ews');
    addSingular(/([ti])a$/i, '$1um');
    addSingular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, '$1$2sis');
    addSingular(/(^analy)ses$/i, '$1sis');
    addSingular(/(i)(f|ves)$/i, '$1fe');
    addSingular(/([aeolr]f?)(f|ves)$/i, '$1f');
    addSingular(/([ht]ive)s$/i, '$1');
    addSingular(/([^aeiouy]|qu)ies$/i, '$1y');
    addSingular(/(s)eries$/i, '$1eries');
    addSingular(/(m)ovies$/i, '$1ovie');
    addSingular(/(x|ch|ss|sh)es$/i, '$1');
    addSingular(/([ml])(ous|ic)e$/i, '$1ouse');
    addSingular(/(bus)(es)?$/i, '$1');
    addSingular(/(o)es$/i, '$1');
    addSingular(/(shoe)s?$/i, '$1');
    addSingular(/(cris|ax|test)[ie]s$/i, '$1is');
    addSingular(/(octop|fung|foc|radi|alumn|cact)(i|us)$/i, '$1us');
    addSingular(/(census|alias|status|fetus|genius|virus)(es)?$/i, '$1');
    addSingular(/^(ox)(en)?/i, '$1');
    addSingular(/(vert)(ex|ices)$/i, '$1ex');
    addSingular(/tr(ix|ices)$/i, 'trix');
    addSingular(/(quiz)(zes)?$/i, '$1');
    addSingular(/(database)s?$/i, '$1');
    addSingular(/ee(th?)$/i, 'oo$1');

    addIrregular('person', 'people');
    addIrregular('man', 'men');
    addIrregular('human', 'humans');
    addIrregular('child', 'children');
    addIrregular('sex', 'sexes');
    addIrregular('move', 'moves');
    addIrregular('save', 'saves');
    addIrregular('goose', 'geese');
    addIrregular('zombie', 'zombies');

    addUncountable('equipment information rice money species series fish deer sheep jeans');

  }

  function addPlural(singular, plural) {
    plural = plural || singular;
    addInflection('plural', singular, plural);
    if (isString(singular)) {
      addSingular(plural, singular);
    }
  }

  function addSingular(plural, singular) {
    addInflection('singular', plural, singular);
  }

  function addIrregular(singular, plural) {
    var sReg = RegExp(singular + '$', 'i');
    var pReg = RegExp(plural + '$', 'i');
    addPlural(sReg, plural);
    addPlural(pReg, plural);
    addSingular(pReg, singular);
    addSingular(sReg, singular);
  }

  function addUncountable(set) {
    forEach(spaceSplit(set), function(str) {
      addPlural(str);
    });
  }

  function addInflection(type, rule, replacement) {
    if (!Inflections[type]) {
      Inflections[type] = new InflectionSet;
    }
    Inflections[type].add(rule, replacement);
  }

  defineInstance(sugarString, {

    /***
     * @method pluralize([num])
     * @returns String
     * @short Returns the plural form of the last word in the string.
     * @extra If [num] is passed, the word will be singularized if equal to 1.
     *        Otherwise it will be pluralized. Custom pluralization rules can be
     *        added using `addPlural`.
     *
     * @example
     *
     *   'post'.pluralize()    -> 'posts'
     *   'post'.pluralize(1)   -> 'post'
     *   'post'.pluralize(2)   -> 'posts'
     *   'octopus'.pluralize() -> 'octopi'
     *   'sheep'.pluralize()   -> 'sheep'
     *
     * @param {number} [num]
     *
     ***/
    'pluralize': function(str, num) {
      str = String(str);
      // Reminder that this pretty much holds true only for English.
      return num === 1 || str.length === 0 ? str : inflectPlurals('plural', str);
    }

  });

  buildInflectionSet();

  buildCommonPlurals();

}).call(this);
