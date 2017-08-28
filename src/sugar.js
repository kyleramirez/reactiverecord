/*
 *  Sugar Custom 2017.07.22
 *
 * Includes:
 *  - pluralize
 *  - singularize
 *  - addPlural
 *  - humanize
 *  - addHuman
 *  - underscore
 *  - dasherize
 *  - camelize
 *  - titleize
 *
 *  Freely distributable and licensed under the MIT-style license.
 *  Copyright (c)  Andrew Plummer
 *  https://sugarjs.com/
 *
 * ---------------------------- */
(function() {
  var Sugar;
  var SUGAR_GLOBAL = "Sugar";
  var NATIVE_NAMES = "Object Number String Array Date RegExp Function";
  var STATIC = 1;
  var INSTANCE = 2;
  var PROPERTY_DESCRIPTOR_SUPPORT = !!(Object.defineProperty && Object.defineProperties);
  var globalContext = typeof global !== "undefined" && global.Object === Object ? global : this;
  var hasExports = typeof module !== "undefined" && module.exports;
  var allowObjectPrototype = false;
  var namespacesByName = {};
  var namespacesByClassString = {};
  var defineProperty = PROPERTY_DESCRIPTOR_SUPPORT ? Object.defineProperty : definePropertyShim;
  var DefaultChainable = getNewChainableClass("Chainable");
  function setupGlobal() {
    Sugar = globalContext[SUGAR_GLOBAL];
    if (Sugar) {
      return;
    }
    Sugar = function(arg) {
      forEachProperty(Sugar, function(sugarNamespace, name) {
        if (hasOwn(namespacesByName, name)) {
          sugarNamespace.extend(arg);
        }
      });
      return Sugar;
    };
    if (hasExports) {
      module.exports = Sugar;
    } else {
      try {
        globalContext[SUGAR_GLOBAL] = Sugar;
      } catch (e) {
      }
    }
    forEachProperty(NATIVE_NAMES.split(" "), function(name) {
      createNamespace(name);
    });
    setGlobalProperties();
  }
  function createNamespace(name) {
    var isObject = name === "Object";
    var sugarNamespace = getNewChainableClass(name, true);
    var extend = function(opts) {
      var nativeClass = globalContext[name], nativeProto = nativeClass.prototype;
      var staticMethods = {}, instanceMethods = {}, methodsByName;
      function objectRestricted(name, target) {
        return isObject && target === nativeProto && (!allowObjectPrototype || name === "get" || name === "set");
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
        return arrayOptionExists("except", nativeClass) || arrayOptionExcludes("namespaces", nativeClass);
      }
      function methodIsExcepted(methodName) {
        return arrayOptionExists("except", methodName);
      }
      function canExtend(methodName, method, target) {
        return !objectRestricted(methodName, target) && !disallowedByFlags(methodName, target, method.flags) && !methodIsExcepted(methodName);
      }
      opts = opts || {};
      methodsByName = opts.methods;
      if (namespaceIsExcepted()) {
        return;
      } else {
        if (isObject && typeof opts.objectPrototype === "boolean") {
          allowObjectPrototype = opts.objectPrototype;
        }
      }
      forEachProperty(methodsByName || sugarNamespace, function(method, methodName) {
        if (methodsByName) {
          methodName = method;
          method = sugarNamespace[methodName];
        }
        if (hasOwn(method, "instance") && canExtend(methodName, method, nativeProto)) {
          instanceMethods[methodName] = method.instance;
        }
        if (hasOwn(method, "static") && canExtend(methodName, method, nativeClass)) {
          staticMethods[methodName] = method;
        }
      });
      extendNative(nativeClass, staticMethods);
      extendNative(nativeProto, instanceMethods);
      if (!methodsByName) {
        setProperty(sugarNamespace, "active", true);
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
    defineWithOptionCollect("defineStatic", STATIC);
    defineWithOptionCollect("defineInstance", INSTANCE);
    defineWithOptionCollect("defineInstanceAndStatic", INSTANCE | STATIC);
    defineWithOptionCollect("defineStaticWithArguments", STATIC, true);
    defineWithOptionCollect("defineInstanceWithArguments", INSTANCE, true);
    setProperty(sugarNamespace, "defineStaticPolyfill", function(arg1, arg2, arg3) {
      var opts = collectDefineOptions(arg1, arg2, arg3);
      extendNative(globalContext[name], opts.methods, true, opts.last);
      return sugarNamespace;
    });
    setProperty(sugarNamespace, "defineInstancePolyfill", function(arg1, arg2, arg3) {
      var opts = collectDefineOptions(arg1, arg2, arg3);
      extendNative(globalContext[name].prototype, opts.methods, true, opts.last);
      forEachProperty(opts.methods, function(fn, methodName) {
        defineChainableMethod(sugarNamespace, methodName, fn);
      });
      return sugarNamespace;
    });
    setProperty(sugarNamespace, "alias", function(name, source) {
      var method = typeof source === "string" ? sugarNamespace[source] : source;
      setMethod(sugarNamespace, name, method);
      return sugarNamespace;
    });
    setProperty(sugarNamespace, "extend", extend);
    namespacesByName[name] = sugarNamespace;
    namespacesByClassString["[object " + name + "]"] = sugarNamespace;
    mapNativeToChainable(name);
    mapObjectChainablesToNamespace(sugarNamespace);
    return Sugar[name] = sugarNamespace;
  }
  function setGlobalProperties() {
    setProperty(Sugar, "extend", Sugar);
    setProperty(Sugar, "toString", toString);
    setProperty(Sugar, "createNamespace", createNamespace);
    setProperty(Sugar, "util", {"hasOwn":hasOwn, "getOwn":getOwn, "setProperty":setProperty, "classToString":classToString, "defineProperty":defineProperty, "forEachProperty":forEachProperty, "mapNativeToChainable":mapNativeToChainable});
  }
  function toString() {
    return SUGAR_GLOBAL;
  }
  function defineMethods(sugarNamespace, methods, type, args, flags) {
    forEachProperty(methods, function(method, methodName) {
      var instanceMethod, staticMethod = method;
      if (args) {
        staticMethod = wrapMethodWithArguments(method);
      }
      if (flags) {
        staticMethod.flags = flags;
      }
      if (type & INSTANCE && !method.instance) {
        instanceMethod = wrapInstanceMethod(method, args);
        setProperty(staticMethod, "instance", instanceMethod);
      }
      if (type & STATIC) {
        setProperty(staticMethod, "static", true);
      }
      setMethod(sugarNamespace, methodName, staticMethod);
      if (sugarNamespace.active) {
        sugarNamespace.extend(methodName);
      }
    });
  }
  function collectDefineOptions(arg1, arg2, arg3) {
    var methods, last;
    if (typeof arg1 === "string") {
      methods = {};
      methods[arg1] = arg2;
      last = arg3;
    } else {
      methods = arg1;
      last = arg2;
    }
    return {last:last, methods:methods};
  }
  function wrapInstanceMethod(fn, args) {
    return args ? wrapMethodWithArguments(fn, true) : wrapInstanceMethodFixed(fn);
  }
  function wrapMethodWithArguments(fn, instance) {
    var startCollect = fn.length - 1 - (instance ? 1 : 0);
    return function() {
      var args = [], collectedArgs = [], len;
      if (instance) {
        args.push(this);
      }
      len = Math.max(arguments.length, startCollect);
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
  function extendNative(target, source, polyfill, override) {
    forEachProperty(source, function(method, name) {
      if (polyfill && !override && target[name]) {
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
  function getNewChainableClass(name) {
    var fn = function SugarChainable(obj, arg) {
      if (!(this instanceof fn)) {
        return new fn(obj, arg);
      }
      if (this.constructor !== fn) {
        obj = this.constructor.apply(obj, arguments);
      }
      this.raw = obj;
    };
    setProperty(fn, "toString", function() {
      return SUGAR_GLOBAL + name;
    });
    setProperty(fn.prototype, "valueOf", function() {
      return this.raw;
    });
    return fn;
  }
  function defineChainableMethod(sugarNamespace, methodName, fn) {
    var wrapped = wrapWithChainableResult(fn), existing, collision, dcp;
    dcp = DefaultChainable.prototype;
    existing = dcp[methodName];
    collision = existing && existing !== Object.prototype[methodName];
    if (!existing || !existing.disambiguate) {
      dcp[methodName] = collision ? disambiguateMethod(methodName) : wrapped;
    }
    sugarNamespace.prototype[methodName] = wrapped;
    if (sugarNamespace === Sugar.Object) {
      mapObjectChainableToAllNamespaces(methodName, wrapped);
    }
  }
  function mapObjectChainablesToNamespace(sugarNamespace) {
    forEachProperty(Sugar.Object && Sugar.Object.prototype, function(val, methodName) {
      if (typeof val === "function") {
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
        sugarNamespace = namespacesByClassString[classToString(raw)];
      }
      if (!sugarNamespace) {
        sugarNamespace = Sugar.Object;
      }
      return (new sugarNamespace(raw))[methodName].apply(this, arguments);
    };
    fn.disambiguate = true;
    return fn;
  }
  function mapNativeToChainable(name, methodNames) {
    var sugarNamespace = namespacesByName[name], nativeProto = globalContext[name].prototype;
    if (!methodNames && ownPropertyNames) {
      methodNames = ownPropertyNames(nativeProto);
    }
    forEachProperty(methodNames, function(methodName) {
      if (nativeMethodProhibited(methodName)) {
        return;
      }
      try {
        var fn = nativeProto[methodName];
        if (typeof fn !== "function") {
          return;
        }
      } catch (e) {
        return;
      }
      defineChainableMethod(sugarNamespace, methodName, fn);
    });
  }
  function nativeMethodProhibited(methodName) {
    return methodName === "constructor" || methodName === "valueOf" || methodName === "__proto__";
  }
  var ownPropertyNames = Object.getOwnPropertyNames, internalToString = Object.prototype.toString, internalHasOwnProperty = Object.prototype.hasOwnProperty;
  var forEachProperty = function(obj, fn) {
    for (var key in obj) {
      if (!hasOwn(obj, key)) {
        continue;
      }
      if (fn.call(obj, obj[key], key, obj) === false) {
        break;
      }
    }
  };
  function definePropertyShim(obj, prop, descriptor) {
    obj[prop] = descriptor.value;
  }
  function setProperty(target, name, value, enumerable) {
    defineProperty(target, name, {value:value, enumerable:!!enumerable, configurable:true, writable:true});
  }
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
  var NATIVE_TYPES = "Boolean Number String Date RegExp Function Array Error Set Map";
  var sugarObject = Sugar.Object, sugarArray = Sugar.Array, sugarDate = Sugar.Date, sugarString = Sugar.String, sugarNumber = Sugar.Number, sugarFunction = Sugar.Function, sugarRegExp = Sugar.RegExp;
  var hasOwn = Sugar.util.hasOwn, getOwn = Sugar.util.getOwn, setProperty = Sugar.util.setProperty, classToString = Sugar.util.classToString, defineProperty = Sugar.util.defineProperty, forEachProperty = Sugar.util.forEachProperty, mapNativeToChainable = Sugar.util.mapNativeToChainable;
  var isSerializable, isBoolean, isNumber, isString, isDate, isRegExp, isFunction, isArray, isSet, isMap, isError;
  function buildClassChecks() {
    var knownTypes = {};
    function addCoreTypes() {
      var names = spaceSplit(NATIVE_TYPES);
      isBoolean = buildPrimitiveClassCheck(names[0]);
      isNumber = buildPrimitiveClassCheck(names[1]);
      isString = buildPrimitiveClassCheck(names[2]);
      isDate = buildClassCheck(names[3]);
      isRegExp = buildClassCheck(names[4]);
      isFunction = buildClassCheck(names[5]);
      isArray = Array.isArray || buildClassCheck(names[6]);
      isError = buildClassCheck(names[7]);
      isSet = buildClassCheck(names[8], typeof Set !== "undefined" && Set);
      isMap = buildClassCheck(names[9], typeof Map !== "undefined" && Map);
      addKnownType("Arguments");
      addKnownType(names[0]);
      addKnownType(names[1]);
      addKnownType(names[2]);
      addKnownType(names[3]);
      addKnownType(names[4]);
      addKnownType(names[6]);
    }
    function addArrayTypes() {
      var types = "Int8 Uint8 Uint8Clamped Int16 Uint16 Int32 Uint32 Float32 Float64";
      forEach(spaceSplit(types), function(str) {
        addKnownType(str + "Array");
      });
    }
    function addKnownType(className) {
      var str = "[object " + className + "]";
      knownTypes[str] = true;
    }
    function isKnownType(className) {
      return knownTypes[className];
    }
    function buildClassCheck(className, globalObject) {
      if (globalObject && isClass(new globalObject, "Object")) {
        return getConstructorClassCheck(globalObject);
      } else {
        return getToStringClassCheck(className);
      }
    }
    function getConstructorClassCheck(obj) {
      var ctorStr = String(obj);
      return function(obj) {
        return String(obj.constructor) === ctorStr;
      };
    }
    function getToStringClassCheck(className) {
      return function(obj, str) {
        return isClass(obj, className, str);
      };
    }
    function buildPrimitiveClassCheck(className) {
      var type = className.toLowerCase();
      return function(obj) {
        var t = typeof obj;
        return t === type || t === "object" && isClass(obj, className);
      };
    }
    addCoreTypes();
    addArrayTypes();
    isSerializable = function(obj, className) {
      className = className || classToString(obj);
      return isKnownType(className) || isPlainObject(obj, className);
    };
  }
  function isClass(obj, className, str) {
    if (!str) {
      str = classToString(obj);
    }
    return str === "[object " + className + "]";
  }
  function wrapNamespace(method) {
    return function(sugarNamespace, arg1, arg2) {
      sugarNamespace[method](arg1, arg2);
    };
  }
  var alias = wrapNamespace("alias"), defineStatic = wrapNamespace("defineStatic"), defineInstance = wrapNamespace("defineInstance"), defineStaticPolyfill = wrapNamespace("defineStaticPolyfill"), defineInstancePolyfill = wrapNamespace("defineInstancePolyfill"), defineInstanceAndStatic = wrapNamespace("defineInstanceAndStatic"), defineInstanceWithArguments = wrapNamespace("defineInstanceWithArguments");
  function defineAccessor(namespace, name, fn) {
    setProperty(namespace, name, fn);
  }
  function isDefined(o) {
    return o !== undefined;
  }
  function isObjectType(obj, type) {
    return !!obj && (type || typeof obj) === "object";
  }
  function isPlainObject(obj, className) {
    return isObjectType(obj) && isClass(obj, "Object", className) && hasValidPlainObjectPrototype(obj) && hasOwnEnumeratedProperties(obj);
  }
  function hasValidPlainObjectPrototype(obj) {
    var hasToString = "toString" in obj;
    var hasConstructor = "constructor" in obj;
    return !hasConstructor && !hasToString || hasConstructor && !hasOwn(obj, "constructor") && hasOwn(obj.constructor.prototype, "isPrototypeOf");
  }
  function hasOwnEnumeratedProperties(obj) {
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
    return n >>> 0 == n && n != 4294967295;
  }
  function iterateOverSparseArray(arr, fn, fromIndex, loop) {
    var indexes = getSparseArrayIndexes(arr, fromIndex, loop), index;
    for (var i = 0, len = indexes.length; i < len; i++) {
      index = indexes[i];
      fn.call(arr, arr[index], index, arr);
    }
    return arr;
  }
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
      if (aLoop !== bLoop) {
        return aLoop ? -1 : 1;
      }
      return a - b;
    });
    return indexes;
  }
  function spaceSplit(str) {
    return str.split(" ");
  }
  function forEach(arr, fn) {
    for (var i = 0, len = arr.length; i < len; i++) {
      if (!(i in arr)) {
        return iterateOverSparseArray(arr, fn, i);
      }
      fn(arr[i], i);
    }
  }
  function indexOf(arr, el) {
    for (var i = 0, len = arr.length; i < len; i++) {
      if (i in arr && arr[i] === el) {
        return i;
      }
    }
    return -1;
  }
  function trim(str) {
    return str.trim();
  }
  function simpleCapitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  var Inflections = {};
  function getAcronym(str) {
    return Inflections.acronyms && Inflections.acronyms.find(str);
  }
  function getHumanWord(str) {
    return Inflections.human && Inflections.human.find(str);
  }
  function runHumanRules(str) {
    return Inflections.human && Inflections.human.runRules(str) || str;
  }
  function getRegExpFlags(reg, add) {
    var flags = "";
    add = add || "";
    function checkFlag(prop, flag) {
      if (prop || add.indexOf(flag) > -1) {
        flags += flag;
      }
    }
    checkFlag(reg.global, "g");
    checkFlag(reg.ignoreCase, "i");
    checkFlag(reg.multiline, "m");
    checkFlag(reg.sticky, "y");
    return flags;
  }
  function escapeRegExp(str) {
    if (!isString(str)) {
      str = String(str);
    }
    return str.replace(/([\\\/\'*+?|()\[\]{}.^$-])/g, "\\$1");
  }
  buildClassChecks();
  var CAPITALIZE_REG = /[^\u0000-\u0040\u005B-\u0060\u007B-\u007F]+('s)?/g;
  var CAMELIZE_REG = /(^|_)([^_]+)/g;
  var DOWNCASED_WORDS = ["and", "or", "nor", "a", "an", "the", "so", "but", "to", "of", "at", "by", "from", "into", "on", "onto", "off", "out", "in", "over", "with", "for"];
  function stringEach(str, search, fn) {
    var chunks, chunk, reg, result = [];
    if (isFunction(search)) {
      fn = search;
      reg = /[\s\S]/g;
    } else {
      if (!search) {
        reg = /[\s\S]/g;
      } else {
        if (isString(search)) {
          reg = RegExp(escapeRegExp(search), "gi");
        } else {
          if (isRegExp(search)) {
            reg = RegExp(search.source, getRegExpFlags(search, "g"));
          }
        }
      }
    }
    chunks = runGlobalMatch(str, reg);
    if (chunks) {
      for (var i = 0, len = chunks.length, r; i < len; i++) {
        chunk = chunks[i];
        result[i] = chunk;
        if (fn) {
          r = fn.call(str, chunk, i, chunks);
          if (r === false) {
            break;
          } else {
            if (isDefined(r)) {
              result[i] = r;
            }
          }
        }
      }
    }
    return result;
  }
  function runGlobalMatch(str, reg) {
    var result = [], match, lastLastIndex;
    while ((match = reg.exec(str)) != null) {
      if (reg.lastIndex === lastLastIndex) {
        reg.lastIndex += 1;
      } else {
        result.push(match[0]);
      }
      lastLastIndex = reg.lastIndex;
    }
    return result;
  }
  function eachWord(str, fn) {
    return stringEach(trim(str), /\S+/g, fn);
  }
  function stringUnderscore(str) {
    var areg = Inflections.acronyms && Inflections.acronyms.reg;
    return str.replace(/[-\s]+/g, "_").replace(areg, function(acronym, index) {
      return (index > 0 ? "_" : "") + acronym.toLowerCase();
    }).replace(/([A-Z\d]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").toLowerCase();
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
  function stringSpacify(str) {
    return stringUnderscore(str).replace(/_/g, " ");
  }
  function stringCapitalize(str, downcase, all) {
    if (downcase) {
      str = str.toLowerCase();
    }
    return all ? str.replace(CAPITALIZE_REG, simpleCapitalize) : simpleCapitalize(str);
  }
  function stringTitleize(str) {
    var fullStopPunctuation = /[.:;!]$/, lastHadPunctuation;
    str = runHumanRules(str);
    str = stringSpacify(str);
    return eachWord(str, function(word, index, words) {
      word = getHumanWord(word) || word;
      word = getAcronym(word) || word;
      var hasPunctuation, isFirstOrLast;
      var first = index == 0, last = index == words.length - 1;
      hasPunctuation = fullStopPunctuation.test(word);
      isFirstOrLast = first || last || hasPunctuation || lastHadPunctuation;
      lastHadPunctuation = hasPunctuation;
      if (isFirstOrLast || indexOf(DOWNCASED_WORDS, word) === -1) {
        return stringCapitalize(word, false, true);
      } else {
        return word;
      }
    }).join(" ");
  }
  defineInstance(sugarString, {"dasherize":function(str) {
    return stringUnderscore(str).replace(/_/g, "-");
  }, "underscore":function(str) {
    return stringUnderscore(str);
  }, "camelize":function(str, upper) {
    return stringCamelize(str, upper);
  }, "titleize":function(str) {
    return stringTitleize(str);
  }});
  var InflectionSet;
  function buildInflectionAccessors() {
    defineAccessor(sugarString, "addAcronym", addAcronym);
    defineAccessor(sugarString, "addPlural", addPlural);
    defineAccessor(sugarString, "addHuman", addHuman);
  }
  function buildInflectionSet() {
    InflectionSet = function() {
      this.map = {};
      this.rules = [];
    };
    InflectionSet.prototype = {add:function(rule, replacement) {
      if (isString(rule)) {
        this.map[rule] = replacement;
      } else {
        this.rules.unshift({rule:rule, replacement:replacement});
      }
    }, inflect:function(str) {
      var arr, idx, word;
      arr = str.split(" ");
      idx = arr.length - 1;
      word = arr[idx];
      arr[idx] = this.find(word) || this.runRules(word);
      return arr.join(" ");
    }, find:function(str) {
      return getOwn(this.map, str);
    }, runRules:function(str) {
      for (var i = 0, r; r = this.rules[i]; i++) {
        if (r.rule.test(str)) {
          str = str.replace(r.rule, r.replacement);
          break;
        }
      }
      return str;
    }};
  }
  var inflectPlurals;
  var inflectHumans;
  function buildCommonPlurals() {
    inflectPlurals = function(type, str) {
      return Inflections[type] && Inflections[type].inflect(str) || str;
    };
    addPlural(/$/, "s");
    addPlural(/s$/i, "s");
    addPlural(/(ax|test)is$/i, "$1es");
    addPlural(/(octop|fung|foc|radi|alumn|cact)(i|us)$/i, "$1i");
    addPlural(/(census|alias|status|fetus|genius|virus)$/i, "$1es");
    addPlural(/(bu)s$/i, "$1ses");
    addPlural(/(buffal|tomat)o$/i, "$1oes");
    addPlural(/([ti])um$/i, "$1a");
    addPlural(/([ti])a$/i, "$1a");
    addPlural(/sis$/i, "ses");
    addPlural(/f+e?$/i, "ves");
    addPlural(/(cuff|roof)$/i, "$1s");
    addPlural(/([ht]ive)$/i, "$1s");
    addPlural(/([^aeiouy]o)$/i, "$1es");
    addPlural(/([^aeiouy]|qu)y$/i, "$1ies");
    addPlural(/(x|ch|ss|sh)$/i, "$1es");
    addPlural(/(tr|vert)(?:ix|ex)$/i, "$1ices");
    addPlural(/([ml])ouse$/i, "$1ice");
    addPlural(/([ml])ice$/i, "$1ice");
    addPlural(/^(ox)$/i, "$1en");
    addPlural(/^(oxen)$/i, "$1");
    addPlural(/(quiz)$/i, "$1zes");
    addPlural(/(phot|cant|hom|zer|pian|portic|pr|quart|kimon)o$/i, "$1os");
    addPlural(/(craft)$/i, "$1");
    addPlural(/([ft])[eo]{2}(th?)$/i, "$1ee$2");
    addSingular(/s$/i, "");
    addSingular(/([pst][aiu]s)$/i, "$1");
    addSingular(/([aeiouy])ss$/i, "$1ss");
    addSingular(/(n)ews$/i, "$1ews");
    addSingular(/([ti])a$/i, "$1um");
    addSingular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis");
    addSingular(/(^analy)ses$/i, "$1sis");
    addSingular(/(i)(f|ves)$/i, "$1fe");
    addSingular(/([aeolr]f?)(f|ves)$/i, "$1f");
    addSingular(/([ht]ive)s$/i, "$1");
    addSingular(/([^aeiouy]|qu)ies$/i, "$1y");
    addSingular(/(s)eries$/i, "$1eries");
    addSingular(/(m)ovies$/i, "$1ovie");
    addSingular(/(x|ch|ss|sh)es$/i, "$1");
    addSingular(/([ml])(ous|ic)e$/i, "$1ouse");
    addSingular(/(bus)(es)?$/i, "$1");
    addSingular(/(o)es$/i, "$1");
    addSingular(/(shoe)s?$/i, "$1");
    addSingular(/(cris|ax|test)[ie]s$/i, "$1is");
    addSingular(/(octop|fung|foc|radi|alumn|cact)(i|us)$/i, "$1us");
    addSingular(/(census|alias|status|fetus|genius|virus)(es)?$/i, "$1");
    addSingular(/^(ox)(en)?/i, "$1");
    addSingular(/(vert)(ex|ices)$/i, "$1ex");
    addSingular(/tr(ix|ices)$/i, "trix");
    addSingular(/(quiz)(zes)?$/i, "$1");
    addSingular(/(database)s?$/i, "$1");
    addSingular(/ee(th?)$/i, "oo$1");
    addIrregular("person", "people");
    addIrregular("man", "men");
    addIrregular("human", "humans");
    addIrregular("child", "children");
    addIrregular("sex", "sexes");
    addIrregular("move", "moves");
    addIrregular("save", "saves");
    addIrregular("goose", "geese");
    addIrregular("zombie", "zombies");
    addUncountable("equipment information rice money species series fish deer sheep jeans");
  }
  function buildCommonHumans() {
    inflectHumans = runHumanRules;
    addHuman(/_id$/g, "");
  }
  function addPlural(singular, plural) {
    plural = plural || singular;
    addInflection("plural", singular, plural);
    if (isString(singular)) {
      addSingular(plural, singular);
    }
  }
  function addSingular(plural, singular) {
    addInflection("singular", plural, singular);
  }
  function addIrregular(singular, plural) {
    var sReg = RegExp(singular + "$", "i");
    var pReg = RegExp(plural + "$", "i");
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
  function addHuman(src, humanized) {
    addInflection("human", src, humanized);
  }
  function addAcronym(str) {
    addInflection("acronyms", str, str);
    addInflection("acronyms", str.toLowerCase(), str);
    buildAcronymReg();
  }
  function buildAcronymReg() {
    var tokens = [];
    forEachProperty(Inflections.acronyms.map, function(val, key) {
      if (key === val) {
        tokens.push(val);
      }
    });
    tokens.sort(function(a, b) {
      return b.length - a.length;
    });
    Inflections.acronyms.reg = RegExp("\\b" + tokens.join("|") + "\\b", "g");
  }
  function addInflection(type, rule, replacement) {
    if (!Inflections[type]) {
      Inflections[type] = new InflectionSet;
    }
    Inflections[type].add(rule, replacement);
  }
  defineInstance(sugarString, {"pluralize":function(str, num) {
    str = String(str);
    return num === 1 || str.length === 0 ? str : inflectPlurals("plural", str);
  }, "singularize":function(str) {
    return inflectPlurals("singular", String(str));
  }, "humanize":function(str) {
    str = inflectHumans(str);
    str = str.replace(/(_)?([a-z\d]*)/gi, function(match, _, word) {
      word = getHumanWord(word) || word;
      word = getAcronym(word) || word.toLowerCase();
      return (_ ? " " : "") + word;
    });
    return simpleCapitalize(str);
  }});
  buildInflectionAccessors();
  buildInflectionSet();
  buildCommonPlurals();
  buildCommonHumans();
}).call(this);