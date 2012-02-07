var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____2868 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____2868)) {
    return or__3548__auto____2868
  }else {
    var or__3548__auto____2869 = p["_"];
    if(cljs.core.truth_(or__3548__auto____2869)) {
      return or__3548__auto____2869
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2870 = coll;
    if(cljs.core.truth_(and__3546__auto____2870)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____2870
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____2871 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2871)) {
        return or__3548__auto____2871
      }else {
        var or__3548__auto____2872 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____2872)) {
          return or__3548__auto____2872
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2873 = coll;
    if(cljs.core.truth_(and__3546__auto____2873)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____2873
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____2874 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2874)) {
        return or__3548__auto____2874
      }else {
        var or__3548__auto____2875 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____2875)) {
          return or__3548__auto____2875
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2876 = coll;
    if(cljs.core.truth_(and__3546__auto____2876)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____2876
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____2877 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2877)) {
        return or__3548__auto____2877
      }else {
        var or__3548__auto____2878 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____2878)) {
          return or__3548__auto____2878
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2885 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____2879 = coll;
      if(cljs.core.truth_(and__3546__auto____2879)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____2879
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____2880 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____2880)) {
          return or__3548__auto____2880
        }else {
          var or__3548__auto____2881 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____2881)) {
            return or__3548__auto____2881
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__2886 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____2882 = coll;
      if(cljs.core.truth_(and__3546__auto____2882)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____2882
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____2883 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____2883)) {
          return or__3548__auto____2883
        }else {
          var or__3548__auto____2884 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____2884)) {
            return or__3548__auto____2884
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2885.call(this, coll, n);
      case 3:
        return _nth__2886.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2888 = coll;
    if(cljs.core.truth_(and__3546__auto____2888)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____2888
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____2889 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2889)) {
        return or__3548__auto____2889
      }else {
        var or__3548__auto____2890 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____2890)) {
          return or__3548__auto____2890
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2891 = coll;
    if(cljs.core.truth_(and__3546__auto____2891)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____2891
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____2892 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2892)) {
        return or__3548__auto____2892
      }else {
        var or__3548__auto____2893 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____2893)) {
          return or__3548__auto____2893
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2900 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____2894 = o;
      if(cljs.core.truth_(and__3546__auto____2894)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____2894
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____2895 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____2895)) {
          return or__3548__auto____2895
        }else {
          var or__3548__auto____2896 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____2896)) {
            return or__3548__auto____2896
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__2901 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____2897 = o;
      if(cljs.core.truth_(and__3546__auto____2897)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____2897
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____2898 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____2898)) {
          return or__3548__auto____2898
        }else {
          var or__3548__auto____2899 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____2899)) {
            return or__3548__auto____2899
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2900.call(this, o, k);
      case 3:
        return _lookup__2901.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2903 = coll;
    if(cljs.core.truth_(and__3546__auto____2903)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____2903
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____2904 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2904)) {
        return or__3548__auto____2904
      }else {
        var or__3548__auto____2905 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____2905)) {
          return or__3548__auto____2905
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2906 = coll;
    if(cljs.core.truth_(and__3546__auto____2906)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____2906
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____2907 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2907)) {
        return or__3548__auto____2907
      }else {
        var or__3548__auto____2908 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____2908)) {
          return or__3548__auto____2908
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2909 = coll;
    if(cljs.core.truth_(and__3546__auto____2909)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____2909
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____2910 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2910)) {
        return or__3548__auto____2910
      }else {
        var or__3548__auto____2911 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____2911)) {
          return or__3548__auto____2911
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2912 = coll;
    if(cljs.core.truth_(and__3546__auto____2912)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____2912
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____2913 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2913)) {
        return or__3548__auto____2913
      }else {
        var or__3548__auto____2914 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____2914)) {
          return or__3548__auto____2914
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2915 = coll;
    if(cljs.core.truth_(and__3546__auto____2915)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____2915
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____2916 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2916)) {
        return or__3548__auto____2916
      }else {
        var or__3548__auto____2917 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____2917)) {
          return or__3548__auto____2917
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2918 = coll;
    if(cljs.core.truth_(and__3546__auto____2918)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____2918
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____2919 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2919)) {
        return or__3548__auto____2919
      }else {
        var or__3548__auto____2920 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____2920)) {
          return or__3548__auto____2920
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2921 = coll;
    if(cljs.core.truth_(and__3546__auto____2921)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____2921
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____2922 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____2922)) {
        return or__3548__auto____2922
      }else {
        var or__3548__auto____2923 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____2923)) {
          return or__3548__auto____2923
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2924 = o;
    if(cljs.core.truth_(and__3546__auto____2924)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____2924
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____2925 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2925)) {
        return or__3548__auto____2925
      }else {
        var or__3548__auto____2926 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____2926)) {
          return or__3548__auto____2926
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2927 = o;
    if(cljs.core.truth_(and__3546__auto____2927)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____2927
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____2928 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2928)) {
        return or__3548__auto____2928
      }else {
        var or__3548__auto____2929 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____2929)) {
          return or__3548__auto____2929
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2930 = o;
    if(cljs.core.truth_(and__3546__auto____2930)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____2930
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____2931 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2931)) {
        return or__3548__auto____2931
      }else {
        var or__3548__auto____2932 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____2932)) {
          return or__3548__auto____2932
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2933 = o;
    if(cljs.core.truth_(and__3546__auto____2933)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____2933
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____2934 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2934)) {
        return or__3548__auto____2934
      }else {
        var or__3548__auto____2935 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____2935)) {
          return or__3548__auto____2935
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2942 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____2936 = coll;
      if(cljs.core.truth_(and__3546__auto____2936)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____2936
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____2937 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____2937)) {
          return or__3548__auto____2937
        }else {
          var or__3548__auto____2938 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____2938)) {
            return or__3548__auto____2938
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__2943 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____2939 = coll;
      if(cljs.core.truth_(and__3546__auto____2939)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____2939
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____2940 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____2940)) {
          return or__3548__auto____2940
        }else {
          var or__3548__auto____2941 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____2941)) {
            return or__3548__auto____2941
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2942.call(this, coll, f);
      case 3:
        return _reduce__2943.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2945 = o;
    if(cljs.core.truth_(and__3546__auto____2945)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____2945
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____2946 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2946)) {
        return or__3548__auto____2946
      }else {
        var or__3548__auto____2947 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____2947)) {
          return or__3548__auto____2947
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2948 = o;
    if(cljs.core.truth_(and__3546__auto____2948)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____2948
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____2949 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2949)) {
        return or__3548__auto____2949
      }else {
        var or__3548__auto____2950 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____2950)) {
          return or__3548__auto____2950
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2951 = o;
    if(cljs.core.truth_(and__3546__auto____2951)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____2951
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____2952 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2952)) {
        return or__3548__auto____2952
      }else {
        var or__3548__auto____2953 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____2953)) {
          return or__3548__auto____2953
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2954 = o;
    if(cljs.core.truth_(and__3546__auto____2954)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____2954
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____2955 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____2955)) {
        return or__3548__auto____2955
      }else {
        var or__3548__auto____2956 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____2956)) {
          return or__3548__auto____2956
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2957 = d;
    if(cljs.core.truth_(and__3546__auto____2957)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____2957
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____2958 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____2958)) {
        return or__3548__auto____2958
      }else {
        var or__3548__auto____2959 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____2959)) {
          return or__3548__auto____2959
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2960 = this$;
    if(cljs.core.truth_(and__3546__auto____2960)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____2960
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____2961 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____2961)) {
        return or__3548__auto____2961
      }else {
        var or__3548__auto____2962 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____2962)) {
          return or__3548__auto____2962
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2963 = this$;
    if(cljs.core.truth_(and__3546__auto____2963)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____2963
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____2964 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____2964)) {
        return or__3548__auto____2964
      }else {
        var or__3548__auto____2965 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____2965)) {
          return or__3548__auto____2965
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____2966 = this$;
    if(cljs.core.truth_(and__3546__auto____2966)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____2966
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____2967 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____2967)) {
        return or__3548__auto____2967
      }else {
        var or__3548__auto____2968 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____2968)) {
          return or__3548__auto____2968
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__2969 = null;
  var G__2969__2970 = function(o, k) {
    return null
  };
  var G__2969__2971 = function(o, k, not_found) {
    return not_found
  };
  G__2969 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__2969__2970.call(this, o, k);
      case 3:
        return G__2969__2971.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__2969
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__2973 = null;
  var G__2973__2974 = function(_, f) {
    return f.call(null)
  };
  var G__2973__2975 = function(_, f, start) {
    return start
  };
  G__2973 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__2973__2974.call(this, _, f);
      case 3:
        return G__2973__2975.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__2973
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return cljs.core.nil_QMARK_.call(null, o)
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__2977 = null;
  var G__2977__2978 = function(_, n) {
    return null
  };
  var G__2977__2979 = function(_, n, not_found) {
    return not_found
  };
  G__2977 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__2977__2978.call(this, _, n);
      case 3:
        return G__2977__2979.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__2977
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2987 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__2981 = cljs.core._nth.call(null, cicoll, 0);
      var n__2982 = 1;
      while(true) {
        if(cljs.core.truth_(n__2982 < cljs.core._count.call(null, cicoll))) {
          var G__2991 = f.call(null, val__2981, cljs.core._nth.call(null, cicoll, n__2982));
          var G__2992 = n__2982 + 1;
          val__2981 = G__2991;
          n__2982 = G__2992;
          continue
        }else {
          return val__2981
        }
        break
      }
    }
  };
  var ci_reduce__2988 = function(cicoll, f, val) {
    var val__2983 = val;
    var n__2984 = 0;
    while(true) {
      if(cljs.core.truth_(n__2984 < cljs.core._count.call(null, cicoll))) {
        var G__2993 = f.call(null, val__2983, cljs.core._nth.call(null, cicoll, n__2984));
        var G__2994 = n__2984 + 1;
        val__2983 = G__2993;
        n__2984 = G__2994;
        continue
      }else {
        return val__2983
      }
      break
    }
  };
  var ci_reduce__2989 = function(cicoll, f, val, idx) {
    var val__2985 = val;
    var n__2986 = idx;
    while(true) {
      if(cljs.core.truth_(n__2986 < cljs.core._count.call(null, cicoll))) {
        var G__2995 = f.call(null, val__2985, cljs.core._nth.call(null, cicoll, n__2986));
        var G__2996 = n__2986 + 1;
        val__2985 = G__2995;
        n__2986 = G__2996;
        continue
      }else {
        return val__2985
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2987.call(this, cicoll, f);
      case 3:
        return ci_reduce__2988.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__2989.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__2997 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3010 = null;
  var G__3010__3011 = function(coll, f) {
    var this__2998 = this;
    return cljs.core.ci_reduce.call(null, coll, f, this__2998.a[this__2998.i], this__2998.i + 1)
  };
  var G__3010__3012 = function(coll, f, start) {
    var this__2999 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start, this__2999.i)
  };
  G__3010 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3010__3011.call(this, coll, f);
      case 3:
        return G__3010__3012.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3010
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3000 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3001 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3014 = null;
  var G__3014__3015 = function(coll, n) {
    var this__3002 = this;
    var i__3003 = n + this__3002.i;
    if(cljs.core.truth_(i__3003 < this__3002.a.length)) {
      return this__3002.a[i__3003]
    }else {
      return null
    }
  };
  var G__3014__3016 = function(coll, n, not_found) {
    var this__3004 = this;
    var i__3005 = n + this__3004.i;
    if(cljs.core.truth_(i__3005 < this__3004.a.length)) {
      return this__3004.a[i__3005]
    }else {
      return not_found
    }
  };
  G__3014 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3014__3015.call(this, coll, n);
      case 3:
        return G__3014__3016.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3014
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__3006 = this;
  return this__3006.a.length - this__3006.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__3007 = this;
  return this__3007.a[this__3007.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__3008 = this;
  if(cljs.core.truth_(this__3008.i + 1 < this__3008.a.length)) {
    return new cljs.core.IndexedSeq(this__3008.a, this__3008.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__3009 = this;
  return this$
};
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__3018 = null;
  var G__3018__3019 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__3018__3020 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__3018 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3018__3019.call(this, array, f);
      case 3:
        return G__3018__3020.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3018
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__3022 = null;
  var G__3022__3023 = function(array, k) {
    return array[k]
  };
  var G__3022__3024 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__3022 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3022__3023.call(this, array, k);
      case 3:
        return G__3022__3024.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3022
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__3026 = null;
  var G__3026__3027 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__3026__3028 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__3026 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3026__3027.call(this, array, n);
      case 3:
        return G__3026__3028.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3026
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____3030 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____3030)) {
    var s__3031 = temp__3698__auto____3030;
    return cljs.core._first.call(null, s__3031)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__3032 = cljs.core.next.call(null, s);
      s = G__3032;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__3033 = cljs.core.seq.call(null, x);
  var n__3034 = 0;
  while(true) {
    if(cljs.core.truth_(s__3033)) {
      var G__3035 = cljs.core.next.call(null, s__3033);
      var G__3036 = n__3034 + 1;
      s__3033 = G__3035;
      n__3034 = G__3036;
      continue
    }else {
      return n__3034
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__3037 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3038 = function() {
    var G__3040__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__3041 = conj.call(null, coll, x);
          var G__3042 = cljs.core.first.call(null, xs);
          var G__3043 = cljs.core.next.call(null, xs);
          coll = G__3041;
          x = G__3042;
          xs = G__3043;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__3040 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3040__delegate.call(this, coll, x, xs)
    };
    G__3040.cljs$lang$maxFixedArity = 2;
    G__3040.cljs$lang$applyTo = function(arglist__3044) {
      var coll = cljs.core.first(arglist__3044);
      var x = cljs.core.first(cljs.core.next(arglist__3044));
      var xs = cljs.core.rest(cljs.core.next(arglist__3044));
      return G__3040__delegate.call(this, coll, x, xs)
    };
    return G__3040
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__3037.call(this, coll, x);
      default:
        return conj__3038.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3038.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__3045 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__3046 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__3045.call(this, coll, n);
      case 3:
        return nth__3046.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__3048 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3049 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__3048.call(this, o, k);
      case 3:
        return get__3049.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3052 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__3053 = function() {
    var G__3055__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__3051 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__3056 = ret__3051;
          var G__3057 = cljs.core.first.call(null, kvs);
          var G__3058 = cljs.core.second.call(null, kvs);
          var G__3059 = cljs.core.nnext.call(null, kvs);
          coll = G__3056;
          k = G__3057;
          v = G__3058;
          kvs = G__3059;
          continue
        }else {
          return ret__3051
        }
        break
      }
    };
    var G__3055 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3055__delegate.call(this, coll, k, v, kvs)
    };
    G__3055.cljs$lang$maxFixedArity = 3;
    G__3055.cljs$lang$applyTo = function(arglist__3060) {
      var coll = cljs.core.first(arglist__3060);
      var k = cljs.core.first(cljs.core.next(arglist__3060));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3060)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3060)));
      return G__3055__delegate.call(this, coll, k, v, kvs)
    };
    return G__3055
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3052.call(this, coll, k, v);
      default:
        return assoc__3053.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__3053.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__3062 = function(coll) {
    return coll
  };
  var dissoc__3063 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3064 = function() {
    var G__3066__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3061 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3067 = ret__3061;
          var G__3068 = cljs.core.first.call(null, ks);
          var G__3069 = cljs.core.next.call(null, ks);
          coll = G__3067;
          k = G__3068;
          ks = G__3069;
          continue
        }else {
          return ret__3061
        }
        break
      }
    };
    var G__3066 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3066__delegate.call(this, coll, k, ks)
    };
    G__3066.cljs$lang$maxFixedArity = 2;
    G__3066.cljs$lang$applyTo = function(arglist__3070) {
      var coll = cljs.core.first(arglist__3070);
      var k = cljs.core.first(cljs.core.next(arglist__3070));
      var ks = cljs.core.rest(cljs.core.next(arglist__3070));
      return G__3066__delegate.call(this, coll, k, ks)
    };
    return G__3066
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__3062.call(this, coll);
      case 2:
        return dissoc__3063.call(this, coll, k);
      default:
        return dissoc__3064.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3064.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__417__auto____3071 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3072 = x__417__auto____3071;
      if(cljs.core.truth_(and__3546__auto____3072)) {
        var and__3546__auto____3073 = x__417__auto____3071.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____3073)) {
          return cljs.core.not.call(null, x__417__auto____3071.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____3073
        }
      }else {
        return and__3546__auto____3072
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__417__auto____3071)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__3075 = function(coll) {
    return coll
  };
  var disj__3076 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3077 = function() {
    var G__3079__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3074 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3080 = ret__3074;
          var G__3081 = cljs.core.first.call(null, ks);
          var G__3082 = cljs.core.next.call(null, ks);
          coll = G__3080;
          k = G__3081;
          ks = G__3082;
          continue
        }else {
          return ret__3074
        }
        break
      }
    };
    var G__3079 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3079__delegate.call(this, coll, k, ks)
    };
    G__3079.cljs$lang$maxFixedArity = 2;
    G__3079.cljs$lang$applyTo = function(arglist__3083) {
      var coll = cljs.core.first(arglist__3083);
      var k = cljs.core.first(cljs.core.next(arglist__3083));
      var ks = cljs.core.rest(cljs.core.next(arglist__3083));
      return G__3079__delegate.call(this, coll, k, ks)
    };
    return G__3079
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__3075.call(this, coll);
      case 2:
        return disj__3076.call(this, coll, k);
      default:
        return disj__3077.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3077.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
    return false
  }else {
    var x__417__auto____3084 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3085 = x__417__auto____3084;
      if(cljs.core.truth_(and__3546__auto____3085)) {
        var and__3546__auto____3086 = x__417__auto____3084.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____3086)) {
          return cljs.core.not.call(null, x__417__auto____3084.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____3086
        }
      }else {
        return and__3546__auto____3085
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__417__auto____3084)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
    return false
  }else {
    var x__417__auto____3087 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3088 = x__417__auto____3087;
      if(cljs.core.truth_(and__3546__auto____3088)) {
        var and__3546__auto____3089 = x__417__auto____3087.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____3089)) {
          return cljs.core.not.call(null, x__417__auto____3087.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____3089
        }
      }else {
        return and__3546__auto____3088
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__417__auto____3087)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__417__auto____3090 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3091 = x__417__auto____3090;
    if(cljs.core.truth_(and__3546__auto____3091)) {
      var and__3546__auto____3092 = x__417__auto____3090.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____3092)) {
        return cljs.core.not.call(null, x__417__auto____3090.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____3092
      }
    }else {
      return and__3546__auto____3091
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__417__auto____3090)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__417__auto____3093 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3094 = x__417__auto____3093;
    if(cljs.core.truth_(and__3546__auto____3094)) {
      var and__3546__auto____3095 = x__417__auto____3093.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____3095)) {
        return cljs.core.not.call(null, x__417__auto____3093.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____3095
      }
    }else {
      return and__3546__auto____3094
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__417__auto____3093)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__417__auto____3096 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3097 = x__417__auto____3096;
    if(cljs.core.truth_(and__3546__auto____3097)) {
      var and__3546__auto____3098 = x__417__auto____3096.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____3098)) {
        return cljs.core.not.call(null, x__417__auto____3096.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____3098
      }
    }else {
      return and__3546__auto____3097
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__417__auto____3096)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
    return false
  }else {
    var x__417__auto____3099 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3100 = x__417__auto____3099;
      if(cljs.core.truth_(and__3546__auto____3100)) {
        var and__3546__auto____3101 = x__417__auto____3099.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____3101)) {
          return cljs.core.not.call(null, x__417__auto____3099.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____3101
        }
      }else {
        return and__3546__auto____3100
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__417__auto____3099)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__417__auto____3102 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3103 = x__417__auto____3102;
    if(cljs.core.truth_(and__3546__auto____3103)) {
      var and__3546__auto____3104 = x__417__auto____3102.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____3104)) {
        return cljs.core.not.call(null, x__417__auto____3102.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____3104
      }
    }else {
      return and__3546__auto____3103
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__417__auto____3102)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__3105 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__3105.push(key)
  });
  return keys__3105
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, s))) {
    return false
  }else {
    var x__417__auto____3106 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3107 = x__417__auto____3106;
      if(cljs.core.truth_(and__3546__auto____3107)) {
        var and__3546__auto____3108 = x__417__auto____3106.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____3108)) {
          return cljs.core.not.call(null, x__417__auto____3106.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____3108
        }
      }else {
        return and__3546__auto____3107
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__417__auto____3106)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____3109 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3109)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____3110 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____3110)) {
        return or__3548__auto____3110
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____3109
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____3111 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3111)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____3111
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____3112 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3112)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____3112
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____3113 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____3113)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____3113
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3114 = coll;
    if(cljs.core.truth_(and__3546__auto____3114)) {
      var and__3546__auto____3115 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____3115)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____3115
      }
    }else {
      return and__3546__auto____3114
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___3120 = function(x) {
    return true
  };
  var distinct_QMARK___3121 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3122 = function() {
    var G__3124__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__3116 = cljs.core.set([y, x]);
        var xs__3117 = more;
        while(true) {
          var x__3118 = cljs.core.first.call(null, xs__3117);
          var etc__3119 = cljs.core.next.call(null, xs__3117);
          if(cljs.core.truth_(xs__3117)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__3116, x__3118))) {
              return false
            }else {
              var G__3125 = cljs.core.conj.call(null, s__3116, x__3118);
              var G__3126 = etc__3119;
              s__3116 = G__3125;
              xs__3117 = G__3126;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__3124 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3124__delegate.call(this, x, y, more)
    };
    G__3124.cljs$lang$maxFixedArity = 2;
    G__3124.cljs$lang$applyTo = function(arglist__3127) {
      var x = cljs.core.first(arglist__3127);
      var y = cljs.core.first(cljs.core.next(arglist__3127));
      var more = cljs.core.rest(cljs.core.next(arglist__3127));
      return G__3124__delegate.call(this, x, y, more)
    };
    return G__3124
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___3120.call(this, x);
      case 2:
        return distinct_QMARK___3121.call(this, x, y);
      default:
        return distinct_QMARK___3122.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3122.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__3128 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__3128))) {
        return r__3128
      }else {
        if(cljs.core.truth_(r__3128)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__3130 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__3131 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__3129 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__3129, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__3129)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__3130.call(this, comp);
      case 2:
        return sort__3131.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__3133 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3134 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__3133.call(this, keyfn, comp);
      case 3:
        return sort_by__3134.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__3136 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__3137 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__3136.call(this, f, val);
      case 3:
        return reduce__3137.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__3143 = function(f, coll) {
    var temp__3695__auto____3139 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____3139)) {
      var s__3140 = temp__3695__auto____3139;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__3140), cljs.core.next.call(null, s__3140))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3144 = function(f, val, coll) {
    var val__3141 = val;
    var coll__3142 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__3142)) {
        var G__3146 = f.call(null, val__3141, cljs.core.first.call(null, coll__3142));
        var G__3147 = cljs.core.next.call(null, coll__3142);
        val__3141 = G__3146;
        coll__3142 = G__3147;
        continue
      }else {
        return val__3141
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__3143.call(this, f, val);
      case 3:
        return seq_reduce__3144.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__3148 = null;
  var G__3148__3149 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__3148__3150 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__3148 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3148__3149.call(this, coll, f);
      case 3:
        return G__3148__3150.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3148
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___3152 = function() {
    return 0
  };
  var _PLUS___3153 = function(x) {
    return x
  };
  var _PLUS___3154 = function(x, y) {
    return x + y
  };
  var _PLUS___3155 = function() {
    var G__3157__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, _PLUS_.call(null, x, y), more)
    };
    var G__3157 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3157__delegate.call(this, x, y, more)
    };
    G__3157.cljs$lang$maxFixedArity = 2;
    G__3157.cljs$lang$applyTo = function(arglist__3158) {
      var x = cljs.core.first(arglist__3158);
      var y = cljs.core.first(cljs.core.next(arglist__3158));
      var more = cljs.core.rest(cljs.core.next(arglist__3158));
      return G__3157__delegate.call(this, x, y, more)
    };
    return G__3157
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___3152.call(this);
      case 1:
        return _PLUS___3153.call(this, x);
      case 2:
        return _PLUS___3154.call(this, x, y);
      default:
        return _PLUS___3155.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3155.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___3159 = function(x) {
    return-x
  };
  var ___3160 = function(x, y) {
    return x - y
  };
  var ___3161 = function() {
    var G__3163__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, _.call(null, x, y), more)
    };
    var G__3163 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3163__delegate.call(this, x, y, more)
    };
    G__3163.cljs$lang$maxFixedArity = 2;
    G__3163.cljs$lang$applyTo = function(arglist__3164) {
      var x = cljs.core.first(arglist__3164);
      var y = cljs.core.first(cljs.core.next(arglist__3164));
      var more = cljs.core.rest(cljs.core.next(arglist__3164));
      return G__3163__delegate.call(this, x, y, more)
    };
    return G__3163
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___3159.call(this, x);
      case 2:
        return ___3160.call(this, x, y);
      default:
        return ___3161.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3161.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___3165 = function() {
    return 1
  };
  var _STAR___3166 = function(x) {
    return x
  };
  var _STAR___3167 = function(x, y) {
    return x * y
  };
  var _STAR___3168 = function() {
    var G__3170__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, _STAR_.call(null, x, y), more)
    };
    var G__3170 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3170__delegate.call(this, x, y, more)
    };
    G__3170.cljs$lang$maxFixedArity = 2;
    G__3170.cljs$lang$applyTo = function(arglist__3171) {
      var x = cljs.core.first(arglist__3171);
      var y = cljs.core.first(cljs.core.next(arglist__3171));
      var more = cljs.core.rest(cljs.core.next(arglist__3171));
      return G__3170__delegate.call(this, x, y, more)
    };
    return G__3170
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___3165.call(this);
      case 1:
        return _STAR___3166.call(this, x);
      case 2:
        return _STAR___3167.call(this, x, y);
      default:
        return _STAR___3168.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3168.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___3172 = function(x) {
    return 1 / x
  };
  var _SLASH___3173 = function(x, y) {
    return x / y
  };
  var _SLASH___3174 = function() {
    var G__3176__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__3176 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3176__delegate.call(this, x, y, more)
    };
    G__3176.cljs$lang$maxFixedArity = 2;
    G__3176.cljs$lang$applyTo = function(arglist__3177) {
      var x = cljs.core.first(arglist__3177);
      var y = cljs.core.first(cljs.core.next(arglist__3177));
      var more = cljs.core.rest(cljs.core.next(arglist__3177));
      return G__3176__delegate.call(this, x, y, more)
    };
    return G__3176
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___3172.call(this, x);
      case 2:
        return _SLASH___3173.call(this, x, y);
      default:
        return _SLASH___3174.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3174.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___3178 = function(x) {
    return true
  };
  var _LT___3179 = function(x, y) {
    return x < y
  };
  var _LT___3180 = function() {
    var G__3182__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_LT_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3183 = y;
            var G__3184 = cljs.core.first.call(null, more);
            var G__3185 = cljs.core.next.call(null, more);
            x = G__3183;
            y = G__3184;
            more = G__3185;
            continue
          }else {
            return _LT_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3182 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3182__delegate.call(this, x, y, more)
    };
    G__3182.cljs$lang$maxFixedArity = 2;
    G__3182.cljs$lang$applyTo = function(arglist__3186) {
      var x = cljs.core.first(arglist__3186);
      var y = cljs.core.first(cljs.core.next(arglist__3186));
      var more = cljs.core.rest(cljs.core.next(arglist__3186));
      return G__3182__delegate.call(this, x, y, more)
    };
    return G__3182
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___3178.call(this, x);
      case 2:
        return _LT___3179.call(this, x, y);
      default:
        return _LT___3180.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3180.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___3187 = function(x) {
    return true
  };
  var _LT__EQ___3188 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3189 = function() {
    var G__3191__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_LT__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3192 = y;
            var G__3193 = cljs.core.first.call(null, more);
            var G__3194 = cljs.core.next.call(null, more);
            x = G__3192;
            y = G__3193;
            more = G__3194;
            continue
          }else {
            return _LT__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3191 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3191__delegate.call(this, x, y, more)
    };
    G__3191.cljs$lang$maxFixedArity = 2;
    G__3191.cljs$lang$applyTo = function(arglist__3195) {
      var x = cljs.core.first(arglist__3195);
      var y = cljs.core.first(cljs.core.next(arglist__3195));
      var more = cljs.core.rest(cljs.core.next(arglist__3195));
      return G__3191__delegate.call(this, x, y, more)
    };
    return G__3191
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___3187.call(this, x);
      case 2:
        return _LT__EQ___3188.call(this, x, y);
      default:
        return _LT__EQ___3189.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3189.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___3196 = function(x) {
    return true
  };
  var _GT___3197 = function(x, y) {
    return x > y
  };
  var _GT___3198 = function() {
    var G__3200__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_GT_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3201 = y;
            var G__3202 = cljs.core.first.call(null, more);
            var G__3203 = cljs.core.next.call(null, more);
            x = G__3201;
            y = G__3202;
            more = G__3203;
            continue
          }else {
            return _GT_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3200 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3200__delegate.call(this, x, y, more)
    };
    G__3200.cljs$lang$maxFixedArity = 2;
    G__3200.cljs$lang$applyTo = function(arglist__3204) {
      var x = cljs.core.first(arglist__3204);
      var y = cljs.core.first(cljs.core.next(arglist__3204));
      var more = cljs.core.rest(cljs.core.next(arglist__3204));
      return G__3200__delegate.call(this, x, y, more)
    };
    return G__3200
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___3196.call(this, x);
      case 2:
        return _GT___3197.call(this, x, y);
      default:
        return _GT___3198.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3198.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___3205 = function(x) {
    return true
  };
  var _GT__EQ___3206 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3207 = function() {
    var G__3209__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_GT__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3210 = y;
            var G__3211 = cljs.core.first.call(null, more);
            var G__3212 = cljs.core.next.call(null, more);
            x = G__3210;
            y = G__3211;
            more = G__3212;
            continue
          }else {
            return _GT__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3209 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3209__delegate.call(this, x, y, more)
    };
    G__3209.cljs$lang$maxFixedArity = 2;
    G__3209.cljs$lang$applyTo = function(arglist__3213) {
      var x = cljs.core.first(arglist__3213);
      var y = cljs.core.first(cljs.core.next(arglist__3213));
      var more = cljs.core.rest(cljs.core.next(arglist__3213));
      return G__3209__delegate.call(this, x, y, more)
    };
    return G__3209
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___3205.call(this, x);
      case 2:
        return _GT__EQ___3206.call(this, x, y);
      default:
        return _GT__EQ___3207.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3207.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__3214 = function(x) {
    return x
  };
  var max__3215 = function(x, y) {
    return x > y ? x : y
  };
  var max__3216 = function() {
    var G__3218__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, max.call(null, x, y), more)
    };
    var G__3218 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3218__delegate.call(this, x, y, more)
    };
    G__3218.cljs$lang$maxFixedArity = 2;
    G__3218.cljs$lang$applyTo = function(arglist__3219) {
      var x = cljs.core.first(arglist__3219);
      var y = cljs.core.first(cljs.core.next(arglist__3219));
      var more = cljs.core.rest(cljs.core.next(arglist__3219));
      return G__3218__delegate.call(this, x, y, more)
    };
    return G__3218
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__3214.call(this, x);
      case 2:
        return max__3215.call(this, x, y);
      default:
        return max__3216.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3216.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__3220 = function(x) {
    return x
  };
  var min__3221 = function(x, y) {
    return x < y ? x : y
  };
  var min__3222 = function() {
    var G__3224__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, min.call(null, x, y), more)
    };
    var G__3224 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3224__delegate.call(this, x, y, more)
    };
    G__3224.cljs$lang$maxFixedArity = 2;
    G__3224.cljs$lang$applyTo = function(arglist__3225) {
      var x = cljs.core.first(arglist__3225);
      var y = cljs.core.first(cljs.core.next(arglist__3225));
      var more = cljs.core.rest(cljs.core.next(arglist__3225));
      return G__3224__delegate.call(this, x, y, more)
    };
    return G__3224
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__3220.call(this, x);
      case 2:
        return min__3221.call(this, x, y);
      default:
        return min__3222.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3222.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__3226 = n % d;
  return cljs.core.fix.call(null, (n - rem__3226) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__3227 = cljs.core.quot.call(null, n, d);
  return n - d * q__3227
};
cljs.core.rand = function() {
  var rand = null;
  var rand__3228 = function() {
    return Math.random.call(null)
  };
  var rand__3229 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__3228.call(this);
      case 1:
        return rand__3229.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___3231 = function(x) {
    return true
  };
  var _EQ__EQ___3232 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3233 = function() {
    var G__3235__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3236 = y;
            var G__3237 = cljs.core.first.call(null, more);
            var G__3238 = cljs.core.next.call(null, more);
            x = G__3236;
            y = G__3237;
            more = G__3238;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3235 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3235__delegate.call(this, x, y, more)
    };
    G__3235.cljs$lang$maxFixedArity = 2;
    G__3235.cljs$lang$applyTo = function(arglist__3239) {
      var x = cljs.core.first(arglist__3239);
      var y = cljs.core.first(cljs.core.next(arglist__3239));
      var more = cljs.core.rest(cljs.core.next(arglist__3239));
      return G__3235__delegate.call(this, x, y, more)
    };
    return G__3235
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___3231.call(this, x);
      case 2:
        return _EQ__EQ___3232.call(this, x, y);
      default:
        return _EQ__EQ___3233.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3233.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return 0 < n
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return 0 === n
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__3240 = n;
  var xs__3241 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3242 = xs__3241;
      if(cljs.core.truth_(and__3546__auto____3242)) {
        return n__3240 > 0
      }else {
        return and__3546__auto____3242
      }
    }())) {
      var G__3243 = n__3240 - 1;
      var G__3244 = cljs.core.next.call(null, xs__3241);
      n__3240 = G__3243;
      xs__3241 = G__3244;
      continue
    }else {
      return xs__3241
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__3249 = null;
  var G__3249__3250 = function(coll, n) {
    var temp__3695__auto____3245 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3245)) {
      var xs__3246 = temp__3695__auto____3245;
      return cljs.core.first.call(null, xs__3246)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__3249__3251 = function(coll, n, not_found) {
    var temp__3695__auto____3247 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3247)) {
      var xs__3248 = temp__3695__auto____3247;
      return cljs.core.first.call(null, xs__3248)
    }else {
      return not_found
    }
  };
  G__3249 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3249__3250.call(this, coll, n);
      case 3:
        return G__3249__3251.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3249
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___3253 = function() {
    return""
  };
  var str_STAR___3254 = function(x) {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___3255 = function() {
    var G__3257__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3258 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__3259 = cljs.core.next.call(null, more);
            sb = G__3258;
            more = G__3259;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__3257 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3257__delegate.call(this, x, ys)
    };
    G__3257.cljs$lang$maxFixedArity = 1;
    G__3257.cljs$lang$applyTo = function(arglist__3260) {
      var x = cljs.core.first(arglist__3260);
      var ys = cljs.core.rest(arglist__3260);
      return G__3257__delegate.call(this, x, ys)
    };
    return G__3257
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___3253.call(this);
      case 1:
        return str_STAR___3254.call(this, x);
      default:
        return str_STAR___3255.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___3255.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__3261 = function() {
    return""
  };
  var str__3262 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__3263 = function() {
    var G__3265__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__3265 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3265__delegate.call(this, x, ys)
    };
    G__3265.cljs$lang$maxFixedArity = 1;
    G__3265.cljs$lang$applyTo = function(arglist__3266) {
      var x = cljs.core.first(arglist__3266);
      var ys = cljs.core.rest(arglist__3266);
      return G__3265__delegate.call(this, x, ys)
    };
    return G__3265
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__3261.call(this);
      case 1:
        return str__3262.call(this, x);
      default:
        return str__3263.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__3263.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__3267 = function(s, start) {
    return s.substring(start)
  };
  var subs__3268 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__3267.call(this, s, start);
      case 3:
        return subs__3268.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__3270 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__3271 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__3270.call(this, ns);
      case 2:
        return symbol__3271.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__3273 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__3274 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__3273.call(this, ns);
      case 2:
        return keyword__3274.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__3276 = cljs.core.seq.call(null, x);
    var ys__3277 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, xs__3276))) {
        return cljs.core.nil_QMARK_.call(null, ys__3277)
      }else {
        if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, ys__3277))) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__3276), cljs.core.first.call(null, ys__3277)))) {
            var G__3278 = cljs.core.next.call(null, xs__3276);
            var G__3279 = cljs.core.next.call(null, ys__3277);
            xs__3276 = G__3278;
            ys__3277 = G__3279;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__3280_SHARP_, p2__3281_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__3280_SHARP_, cljs.core.hash.call(null, p2__3281_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3282__3283 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__3282__3283)) {
    var G__3285__3287 = cljs.core.first.call(null, G__3282__3283);
    var vec__3286__3288 = G__3285__3287;
    var key_name__3289 = cljs.core.nth.call(null, vec__3286__3288, 0, null);
    var f__3290 = cljs.core.nth.call(null, vec__3286__3288, 1, null);
    var G__3282__3291 = G__3282__3283;
    var G__3285__3292 = G__3285__3287;
    var G__3282__3293 = G__3282__3291;
    while(true) {
      var vec__3294__3295 = G__3285__3292;
      var key_name__3296 = cljs.core.nth.call(null, vec__3294__3295, 0, null);
      var f__3297 = cljs.core.nth.call(null, vec__3294__3295, 1, null);
      var G__3282__3298 = G__3282__3293;
      var str_name__3299 = cljs.core.name.call(null, key_name__3296);
      obj[str_name__3299] = f__3297;
      var temp__3698__auto____3300 = cljs.core.next.call(null, G__3282__3298);
      if(cljs.core.truth_(temp__3698__auto____3300)) {
        var G__3282__3301 = temp__3698__auto____3300;
        var G__3302 = cljs.core.first.call(null, G__3282__3301);
        var G__3303 = G__3282__3301;
        G__3285__3292 = G__3302;
        G__3282__3293 = G__3303;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3304 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3305 = this;
  return new cljs.core.List(this__3305.meta, o, coll, this__3305.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3306 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3307 = this;
  return this__3307.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3308 = this;
  return this__3308.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3309 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3310 = this;
  return this__3310.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3311 = this;
  return this__3311.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3312 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3313 = this;
  return new cljs.core.List(meta, this__3313.first, this__3313.rest, this__3313.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3314 = this;
  return this__3314.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3315 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3316 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3317 = this;
  return new cljs.core.List(this__3317.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3318 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3319 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3320 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3321 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3322 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3323 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3324 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3325 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3326 = this;
  return this__3326.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3327 = this;
  return coll
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__3328) {
    var items = cljs.core.seq(arglist__3328);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3329 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3330 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3331 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3332 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3332.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3333 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3334 = this;
  return this__3334.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3335 = this;
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, this__3335.rest))) {
    return cljs.core.List.EMPTY
  }else {
    return this__3335.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3336 = this;
  return this__3336.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3337 = this;
  return new cljs.core.Cons(meta, this__3337.first, this__3337.rest)
};
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3338 = null;
  var G__3338__3339 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3338__3340 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3338 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3338__3339.call(this, string, f);
      case 3:
        return G__3338__3340.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3338
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3342 = null;
  var G__3342__3343 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3342__3344 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3342 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3342__3343.call(this, string, k);
      case 3:
        return G__3342__3344.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3342
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3346 = null;
  var G__3346__3347 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3346__3348 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3346 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3346__3347.call(this, string, n);
      case 3:
        return G__3346__3348.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3346
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String["prototype"]["call"] = function() {
  var G__3350 = null;
  var G__3350__3351 = function(_, coll) {
    return cljs.core.get.call(null, coll, this.toString())
  };
  var G__3350__3352 = function(_, coll, not_found) {
    return cljs.core.get.call(null, coll, this.toString(), not_found)
  };
  G__3350 = function(_, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3350__3351.call(this, _, coll);
      case 3:
        return G__3350__3352.call(this, _, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3350
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__3354 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__3354
  }else {
    lazy_seq.x = x__3354.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3355 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3356 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3357 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3358 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3358.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3359 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3360 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3361 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3362 = this;
  return this__3362.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3363 = this;
  return new cljs.core.LazySeq(meta, this__3363.realized, this__3363.x)
};
cljs.core.to_array = function to_array(s) {
  var ary__3364 = cljs.core.array.call(null);
  var s__3365 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__3365))) {
      ary__3364.push(cljs.core.first.call(null, s__3365));
      var G__3366 = cljs.core.next.call(null, s__3365);
      s__3365 = G__3366;
      continue
    }else {
      return ary__3364
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__3367 = s;
  var i__3368 = n;
  var sum__3369 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3370 = i__3368 > 0;
      if(cljs.core.truth_(and__3546__auto____3370)) {
        return cljs.core.seq.call(null, s__3367)
      }else {
        return and__3546__auto____3370
      }
    }())) {
      var G__3371 = cljs.core.next.call(null, s__3367);
      var G__3372 = i__3368 - 1;
      var G__3373 = sum__3369 + 1;
      s__3367 = G__3371;
      i__3368 = G__3372;
      sum__3369 = G__3373;
      continue
    }else {
      return sum__3369
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, arglist))) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, cljs.core.next.call(null, arglist)))) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__3377 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__3378 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__3379 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__3374 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__3374)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3374), concat.call(null, cljs.core.rest.call(null, s__3374), y))
      }else {
        return y
      }
    })
  };
  var concat__3380 = function() {
    var G__3382__delegate = function(x, y, zs) {
      var cat__3376 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__3375 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__3375)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__3375), cat.call(null, cljs.core.rest.call(null, xys__3375), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__3376.call(null, concat.call(null, x, y), zs)
    };
    var G__3382 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3382__delegate.call(this, x, y, zs)
    };
    G__3382.cljs$lang$maxFixedArity = 2;
    G__3382.cljs$lang$applyTo = function(arglist__3383) {
      var x = cljs.core.first(arglist__3383);
      var y = cljs.core.first(cljs.core.next(arglist__3383));
      var zs = cljs.core.rest(cljs.core.next(arglist__3383));
      return G__3382__delegate.call(this, x, y, zs)
    };
    return G__3382
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__3377.call(this);
      case 1:
        return concat__3378.call(this, x);
      case 2:
        return concat__3379.call(this, x, y);
      default:
        return concat__3380.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3380.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___3384 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___3385 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3386 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___3387 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___3388 = function() {
    var G__3390__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3390 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3390__delegate.call(this, a, b, c, d, more)
    };
    G__3390.cljs$lang$maxFixedArity = 4;
    G__3390.cljs$lang$applyTo = function(arglist__3391) {
      var a = cljs.core.first(arglist__3391);
      var b = cljs.core.first(cljs.core.next(arglist__3391));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3391)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3391))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3391))));
      return G__3390__delegate.call(this, a, b, c, d, more)
    };
    return G__3390
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___3384.call(this, a);
      case 2:
        return list_STAR___3385.call(this, a, b);
      case 3:
        return list_STAR___3386.call(this, a, b, c);
      case 4:
        return list_STAR___3387.call(this, a, b, c, d);
      default:
        return list_STAR___3388.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___3388.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__3401 = function(f, args) {
    var fixed_arity__3392 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__3392 + 1) <= fixed_arity__3392)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3402 = function(f, x, args) {
    var arglist__3393 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__3394 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3393, fixed_arity__3394) <= fixed_arity__3394)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3393))
      }else {
        return f.cljs$lang$applyTo(arglist__3393)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3393))
    }
  };
  var apply__3403 = function(f, x, y, args) {
    var arglist__3395 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__3396 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3395, fixed_arity__3396) <= fixed_arity__3396)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3395))
      }else {
        return f.cljs$lang$applyTo(arglist__3395)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3395))
    }
  };
  var apply__3404 = function(f, x, y, z, args) {
    var arglist__3397 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__3398 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3397, fixed_arity__3398) <= fixed_arity__3398)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3397))
      }else {
        return f.cljs$lang$applyTo(arglist__3397)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3397))
    }
  };
  var apply__3405 = function() {
    var G__3407__delegate = function(f, a, b, c, d, args) {
      var arglist__3399 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__3400 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3399, fixed_arity__3400) <= fixed_arity__3400)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__3399))
        }else {
          return f.cljs$lang$applyTo(arglist__3399)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3399))
      }
    };
    var G__3407 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3407__delegate.call(this, f, a, b, c, d, args)
    };
    G__3407.cljs$lang$maxFixedArity = 5;
    G__3407.cljs$lang$applyTo = function(arglist__3408) {
      var f = cljs.core.first(arglist__3408);
      var a = cljs.core.first(cljs.core.next(arglist__3408));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3408)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3408))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3408)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3408)))));
      return G__3407__delegate.call(this, f, a, b, c, d, args)
    };
    return G__3407
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__3401.call(this, f, a);
      case 3:
        return apply__3402.call(this, f, a, b);
      case 4:
        return apply__3403.call(this, f, a, b, c);
      case 5:
        return apply__3404.call(this, f, a, b, c, d);
      default:
        return apply__3405.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__3405.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3409) {
    var obj = cljs.core.first(arglist__3409);
    var f = cljs.core.first(cljs.core.next(arglist__3409));
    var args = cljs.core.rest(cljs.core.next(arglist__3409));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___3410 = function(x) {
    return false
  };
  var not_EQ___3411 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3412 = function() {
    var G__3414__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3414 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3414__delegate.call(this, x, y, more)
    };
    G__3414.cljs$lang$maxFixedArity = 2;
    G__3414.cljs$lang$applyTo = function(arglist__3415) {
      var x = cljs.core.first(arglist__3415);
      var y = cljs.core.first(cljs.core.next(arglist__3415));
      var more = cljs.core.rest(cljs.core.next(arglist__3415));
      return G__3414__delegate.call(this, x, y, more)
    };
    return G__3414
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___3410.call(this, x);
      case 2:
        return not_EQ___3411.call(this, x, y);
      default:
        return not_EQ___3412.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3412.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, cljs.core.seq.call(null, coll)))) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3416 = pred;
        var G__3417 = cljs.core.next.call(null, coll);
        pred = G__3416;
        coll = G__3417;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____3418 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____3418)) {
        return or__3548__auto____3418
      }else {
        var G__3419 = pred;
        var G__3420 = cljs.core.next.call(null, coll);
        pred = G__3419;
        coll = G__3420;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3421 = null;
    var G__3421__3422 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3421__3423 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3421__3424 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3421__3425 = function() {
      var G__3427__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3427 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3427__delegate.call(this, x, y, zs)
      };
      G__3427.cljs$lang$maxFixedArity = 2;
      G__3427.cljs$lang$applyTo = function(arglist__3428) {
        var x = cljs.core.first(arglist__3428);
        var y = cljs.core.first(cljs.core.next(arglist__3428));
        var zs = cljs.core.rest(cljs.core.next(arglist__3428));
        return G__3427__delegate.call(this, x, y, zs)
      };
      return G__3427
    }();
    G__3421 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3421__3422.call(this);
        case 1:
          return G__3421__3423.call(this, x);
        case 2:
          return G__3421__3424.call(this, x, y);
        default:
          return G__3421__3425.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__3421.cljs$lang$maxFixedArity = 2;
    G__3421.cljs$lang$applyTo = G__3421__3425.cljs$lang$applyTo;
    return G__3421
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3429__delegate = function(args) {
      return x
    };
    var G__3429 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3429__delegate.call(this, args)
    };
    G__3429.cljs$lang$maxFixedArity = 0;
    G__3429.cljs$lang$applyTo = function(arglist__3430) {
      var args = cljs.core.seq(arglist__3430);
      return G__3429__delegate.call(this, args)
    };
    return G__3429
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__3434 = function() {
    return cljs.core.identity
  };
  var comp__3435 = function(f) {
    return f
  };
  var comp__3436 = function(f, g) {
    return function() {
      var G__3440 = null;
      var G__3440__3441 = function() {
        return f.call(null, g.call(null))
      };
      var G__3440__3442 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3440__3443 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3440__3444 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3440__3445 = function() {
        var G__3447__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3447 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3447__delegate.call(this, x, y, z, args)
        };
        G__3447.cljs$lang$maxFixedArity = 3;
        G__3447.cljs$lang$applyTo = function(arglist__3448) {
          var x = cljs.core.first(arglist__3448);
          var y = cljs.core.first(cljs.core.next(arglist__3448));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3448)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3448)));
          return G__3447__delegate.call(this, x, y, z, args)
        };
        return G__3447
      }();
      G__3440 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3440__3441.call(this);
          case 1:
            return G__3440__3442.call(this, x);
          case 2:
            return G__3440__3443.call(this, x, y);
          case 3:
            return G__3440__3444.call(this, x, y, z);
          default:
            return G__3440__3445.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3440.cljs$lang$maxFixedArity = 3;
      G__3440.cljs$lang$applyTo = G__3440__3445.cljs$lang$applyTo;
      return G__3440
    }()
  };
  var comp__3437 = function(f, g, h) {
    return function() {
      var G__3449 = null;
      var G__3449__3450 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3449__3451 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3449__3452 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3449__3453 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3449__3454 = function() {
        var G__3456__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__3456 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3456__delegate.call(this, x, y, z, args)
        };
        G__3456.cljs$lang$maxFixedArity = 3;
        G__3456.cljs$lang$applyTo = function(arglist__3457) {
          var x = cljs.core.first(arglist__3457);
          var y = cljs.core.first(cljs.core.next(arglist__3457));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3457)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3457)));
          return G__3456__delegate.call(this, x, y, z, args)
        };
        return G__3456
      }();
      G__3449 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3449__3450.call(this);
          case 1:
            return G__3449__3451.call(this, x);
          case 2:
            return G__3449__3452.call(this, x, y);
          case 3:
            return G__3449__3453.call(this, x, y, z);
          default:
            return G__3449__3454.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3449.cljs$lang$maxFixedArity = 3;
      G__3449.cljs$lang$applyTo = G__3449__3454.cljs$lang$applyTo;
      return G__3449
    }()
  };
  var comp__3438 = function() {
    var G__3458__delegate = function(f1, f2, f3, fs) {
      var fs__3431 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__3459__delegate = function(args) {
          var ret__3432 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__3431), args);
          var fs__3433 = cljs.core.next.call(null, fs__3431);
          while(true) {
            if(cljs.core.truth_(fs__3433)) {
              var G__3460 = cljs.core.first.call(null, fs__3433).call(null, ret__3432);
              var G__3461 = cljs.core.next.call(null, fs__3433);
              ret__3432 = G__3460;
              fs__3433 = G__3461;
              continue
            }else {
              return ret__3432
            }
            break
          }
        };
        var G__3459 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3459__delegate.call(this, args)
        };
        G__3459.cljs$lang$maxFixedArity = 0;
        G__3459.cljs$lang$applyTo = function(arglist__3462) {
          var args = cljs.core.seq(arglist__3462);
          return G__3459__delegate.call(this, args)
        };
        return G__3459
      }()
    };
    var G__3458 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3458__delegate.call(this, f1, f2, f3, fs)
    };
    G__3458.cljs$lang$maxFixedArity = 3;
    G__3458.cljs$lang$applyTo = function(arglist__3463) {
      var f1 = cljs.core.first(arglist__3463);
      var f2 = cljs.core.first(cljs.core.next(arglist__3463));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3463)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3463)));
      return G__3458__delegate.call(this, f1, f2, f3, fs)
    };
    return G__3458
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__3434.call(this);
      case 1:
        return comp__3435.call(this, f1);
      case 2:
        return comp__3436.call(this, f1, f2);
      case 3:
        return comp__3437.call(this, f1, f2, f3);
      default:
        return comp__3438.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__3438.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__3464 = function(f, arg1) {
    return function() {
      var G__3469__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__3469 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3469__delegate.call(this, args)
      };
      G__3469.cljs$lang$maxFixedArity = 0;
      G__3469.cljs$lang$applyTo = function(arglist__3470) {
        var args = cljs.core.seq(arglist__3470);
        return G__3469__delegate.call(this, args)
      };
      return G__3469
    }()
  };
  var partial__3465 = function(f, arg1, arg2) {
    return function() {
      var G__3471__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__3471 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3471__delegate.call(this, args)
      };
      G__3471.cljs$lang$maxFixedArity = 0;
      G__3471.cljs$lang$applyTo = function(arglist__3472) {
        var args = cljs.core.seq(arglist__3472);
        return G__3471__delegate.call(this, args)
      };
      return G__3471
    }()
  };
  var partial__3466 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__3473__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__3473 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3473__delegate.call(this, args)
      };
      G__3473.cljs$lang$maxFixedArity = 0;
      G__3473.cljs$lang$applyTo = function(arglist__3474) {
        var args = cljs.core.seq(arglist__3474);
        return G__3473__delegate.call(this, args)
      };
      return G__3473
    }()
  };
  var partial__3467 = function() {
    var G__3475__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__3476__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__3476 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3476__delegate.call(this, args)
        };
        G__3476.cljs$lang$maxFixedArity = 0;
        G__3476.cljs$lang$applyTo = function(arglist__3477) {
          var args = cljs.core.seq(arglist__3477);
          return G__3476__delegate.call(this, args)
        };
        return G__3476
      }()
    };
    var G__3475 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3475__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__3475.cljs$lang$maxFixedArity = 4;
    G__3475.cljs$lang$applyTo = function(arglist__3478) {
      var f = cljs.core.first(arglist__3478);
      var arg1 = cljs.core.first(cljs.core.next(arglist__3478));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3478)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3478))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3478))));
      return G__3475__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__3475
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__3464.call(this, f, arg1);
      case 3:
        return partial__3465.call(this, f, arg1, arg2);
      case 4:
        return partial__3466.call(this, f, arg1, arg2, arg3);
      default:
        return partial__3467.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__3467.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__3479 = function(f, x) {
    return function() {
      var G__3483 = null;
      var G__3483__3484 = function(a) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a)
      };
      var G__3483__3485 = function(a, b) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, b)
      };
      var G__3483__3486 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, b, c)
      };
      var G__3483__3487 = function() {
        var G__3489__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, b, c, ds)
        };
        var G__3489 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3489__delegate.call(this, a, b, c, ds)
        };
        G__3489.cljs$lang$maxFixedArity = 3;
        G__3489.cljs$lang$applyTo = function(arglist__3490) {
          var a = cljs.core.first(arglist__3490);
          var b = cljs.core.first(cljs.core.next(arglist__3490));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3490)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3490)));
          return G__3489__delegate.call(this, a, b, c, ds)
        };
        return G__3489
      }();
      G__3483 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__3483__3484.call(this, a);
          case 2:
            return G__3483__3485.call(this, a, b);
          case 3:
            return G__3483__3486.call(this, a, b, c);
          default:
            return G__3483__3487.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3483.cljs$lang$maxFixedArity = 3;
      G__3483.cljs$lang$applyTo = G__3483__3487.cljs$lang$applyTo;
      return G__3483
    }()
  };
  var fnil__3480 = function(f, x, y) {
    return function() {
      var G__3491 = null;
      var G__3491__3492 = function(a, b) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b)
      };
      var G__3491__3493 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, c)
      };
      var G__3491__3494 = function() {
        var G__3496__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, c, ds)
        };
        var G__3496 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3496__delegate.call(this, a, b, c, ds)
        };
        G__3496.cljs$lang$maxFixedArity = 3;
        G__3496.cljs$lang$applyTo = function(arglist__3497) {
          var a = cljs.core.first(arglist__3497);
          var b = cljs.core.first(cljs.core.next(arglist__3497));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3497)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3497)));
          return G__3496__delegate.call(this, a, b, c, ds)
        };
        return G__3496
      }();
      G__3491 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3491__3492.call(this, a, b);
          case 3:
            return G__3491__3493.call(this, a, b, c);
          default:
            return G__3491__3494.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3491.cljs$lang$maxFixedArity = 3;
      G__3491.cljs$lang$applyTo = G__3491__3494.cljs$lang$applyTo;
      return G__3491
    }()
  };
  var fnil__3481 = function(f, x, y, z) {
    return function() {
      var G__3498 = null;
      var G__3498__3499 = function(a, b) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b)
      };
      var G__3498__3500 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, c)) ? z : c)
      };
      var G__3498__3501 = function() {
        var G__3503__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, c)) ? z : c, ds)
        };
        var G__3503 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3503__delegate.call(this, a, b, c, ds)
        };
        G__3503.cljs$lang$maxFixedArity = 3;
        G__3503.cljs$lang$applyTo = function(arglist__3504) {
          var a = cljs.core.first(arglist__3504);
          var b = cljs.core.first(cljs.core.next(arglist__3504));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3504)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3504)));
          return G__3503__delegate.call(this, a, b, c, ds)
        };
        return G__3503
      }();
      G__3498 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3498__3499.call(this, a, b);
          case 3:
            return G__3498__3500.call(this, a, b, c);
          default:
            return G__3498__3501.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3498.cljs$lang$maxFixedArity = 3;
      G__3498.cljs$lang$applyTo = G__3498__3501.cljs$lang$applyTo;
      return G__3498
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__3479.call(this, f, x);
      case 3:
        return fnil__3480.call(this, f, x, y);
      case 4:
        return fnil__3481.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__3507 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3505 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3505)) {
        var s__3506 = temp__3698__auto____3505;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__3506)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__3506)))
      }else {
        return null
      }
    })
  };
  return mapi__3507.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____3508 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____3508)) {
      var s__3509 = temp__3698__auto____3508;
      var x__3510 = f.call(null, cljs.core.first.call(null, s__3509));
      if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x__3510))) {
        return keep.call(null, f, cljs.core.rest.call(null, s__3509))
      }else {
        return cljs.core.cons.call(null, x__3510, keep.call(null, f, cljs.core.rest.call(null, s__3509)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__3520 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3517 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3517)) {
        var s__3518 = temp__3698__auto____3517;
        var x__3519 = f.call(null, idx, cljs.core.first.call(null, s__3518));
        if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x__3519))) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3518))
        }else {
          return cljs.core.cons.call(null, x__3519, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3518)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__3520.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__3565 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__3570 = function() {
        return true
      };
      var ep1__3571 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__3572 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3527 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3527)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____3527
          }
        }())
      };
      var ep1__3573 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3528 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3528)) {
            var and__3546__auto____3529 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3529)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____3529
            }
          }else {
            return and__3546__auto____3528
          }
        }())
      };
      var ep1__3574 = function() {
        var G__3576__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3530 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3530)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____3530
            }
          }())
        };
        var G__3576 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3576__delegate.call(this, x, y, z, args)
        };
        G__3576.cljs$lang$maxFixedArity = 3;
        G__3576.cljs$lang$applyTo = function(arglist__3577) {
          var x = cljs.core.first(arglist__3577);
          var y = cljs.core.first(cljs.core.next(arglist__3577));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3577)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3577)));
          return G__3576__delegate.call(this, x, y, z, args)
        };
        return G__3576
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__3570.call(this);
          case 1:
            return ep1__3571.call(this, x);
          case 2:
            return ep1__3572.call(this, x, y);
          case 3:
            return ep1__3573.call(this, x, y, z);
          default:
            return ep1__3574.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__3574.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__3566 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__3578 = function() {
        return true
      };
      var ep2__3579 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3531 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3531)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____3531
          }
        }())
      };
      var ep2__3580 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3532 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3532)) {
            var and__3546__auto____3533 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3533)) {
              var and__3546__auto____3534 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3534)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____3534
              }
            }else {
              return and__3546__auto____3533
            }
          }else {
            return and__3546__auto____3532
          }
        }())
      };
      var ep2__3581 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3535 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3535)) {
            var and__3546__auto____3536 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3536)) {
              var and__3546__auto____3537 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____3537)) {
                var and__3546__auto____3538 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____3538)) {
                  var and__3546__auto____3539 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3539)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____3539
                  }
                }else {
                  return and__3546__auto____3538
                }
              }else {
                return and__3546__auto____3537
              }
            }else {
              return and__3546__auto____3536
            }
          }else {
            return and__3546__auto____3535
          }
        }())
      };
      var ep2__3582 = function() {
        var G__3584__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3540 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3540)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3511_SHARP_) {
                var and__3546__auto____3541 = p1.call(null, p1__3511_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3541)) {
                  return p2.call(null, p1__3511_SHARP_)
                }else {
                  return and__3546__auto____3541
                }
              }, args)
            }else {
              return and__3546__auto____3540
            }
          }())
        };
        var G__3584 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3584__delegate.call(this, x, y, z, args)
        };
        G__3584.cljs$lang$maxFixedArity = 3;
        G__3584.cljs$lang$applyTo = function(arglist__3585) {
          var x = cljs.core.first(arglist__3585);
          var y = cljs.core.first(cljs.core.next(arglist__3585));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3585)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3585)));
          return G__3584__delegate.call(this, x, y, z, args)
        };
        return G__3584
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__3578.call(this);
          case 1:
            return ep2__3579.call(this, x);
          case 2:
            return ep2__3580.call(this, x, y);
          case 3:
            return ep2__3581.call(this, x, y, z);
          default:
            return ep2__3582.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__3582.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__3567 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__3586 = function() {
        return true
      };
      var ep3__3587 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3542 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3542)) {
            var and__3546__auto____3543 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3543)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____3543
            }
          }else {
            return and__3546__auto____3542
          }
        }())
      };
      var ep3__3588 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3544 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3544)) {
            var and__3546__auto____3545 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3545)) {
              var and__3546__auto____3546 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3546)) {
                var and__3546__auto____3547 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3547)) {
                  var and__3546__auto____3548 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3548)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____3548
                  }
                }else {
                  return and__3546__auto____3547
                }
              }else {
                return and__3546__auto____3546
              }
            }else {
              return and__3546__auto____3545
            }
          }else {
            return and__3546__auto____3544
          }
        }())
      };
      var ep3__3589 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3549 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3549)) {
            var and__3546__auto____3550 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3550)) {
              var and__3546__auto____3551 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3551)) {
                var and__3546__auto____3552 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3552)) {
                  var and__3546__auto____3553 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3553)) {
                    var and__3546__auto____3554 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____3554)) {
                      var and__3546__auto____3555 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____3555)) {
                        var and__3546__auto____3556 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____3556)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____3556
                        }
                      }else {
                        return and__3546__auto____3555
                      }
                    }else {
                      return and__3546__auto____3554
                    }
                  }else {
                    return and__3546__auto____3553
                  }
                }else {
                  return and__3546__auto____3552
                }
              }else {
                return and__3546__auto____3551
              }
            }else {
              return and__3546__auto____3550
            }
          }else {
            return and__3546__auto____3549
          }
        }())
      };
      var ep3__3590 = function() {
        var G__3592__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3557 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3557)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3512_SHARP_) {
                var and__3546__auto____3558 = p1.call(null, p1__3512_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3558)) {
                  var and__3546__auto____3559 = p2.call(null, p1__3512_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____3559)) {
                    return p3.call(null, p1__3512_SHARP_)
                  }else {
                    return and__3546__auto____3559
                  }
                }else {
                  return and__3546__auto____3558
                }
              }, args)
            }else {
              return and__3546__auto____3557
            }
          }())
        };
        var G__3592 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3592__delegate.call(this, x, y, z, args)
        };
        G__3592.cljs$lang$maxFixedArity = 3;
        G__3592.cljs$lang$applyTo = function(arglist__3593) {
          var x = cljs.core.first(arglist__3593);
          var y = cljs.core.first(cljs.core.next(arglist__3593));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3593)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3593)));
          return G__3592__delegate.call(this, x, y, z, args)
        };
        return G__3592
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__3586.call(this);
          case 1:
            return ep3__3587.call(this, x);
          case 2:
            return ep3__3588.call(this, x, y);
          case 3:
            return ep3__3589.call(this, x, y, z);
          default:
            return ep3__3590.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__3590.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__3568 = function() {
    var G__3594__delegate = function(p1, p2, p3, ps) {
      var ps__3560 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__3595 = function() {
          return true
        };
        var epn__3596 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__3513_SHARP_) {
            return p1__3513_SHARP_.call(null, x)
          }, ps__3560)
        };
        var epn__3597 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__3514_SHARP_) {
            var and__3546__auto____3561 = p1__3514_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3561)) {
              return p1__3514_SHARP_.call(null, y)
            }else {
              return and__3546__auto____3561
            }
          }, ps__3560)
        };
        var epn__3598 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__3515_SHARP_) {
            var and__3546__auto____3562 = p1__3515_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3562)) {
              var and__3546__auto____3563 = p1__3515_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____3563)) {
                return p1__3515_SHARP_.call(null, z)
              }else {
                return and__3546__auto____3563
              }
            }else {
              return and__3546__auto____3562
            }
          }, ps__3560)
        };
        var epn__3599 = function() {
          var G__3601__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____3564 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____3564)) {
                return cljs.core.every_QMARK_.call(null, function(p1__3516_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__3516_SHARP_, args)
                }, ps__3560)
              }else {
                return and__3546__auto____3564
              }
            }())
          };
          var G__3601 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3601__delegate.call(this, x, y, z, args)
          };
          G__3601.cljs$lang$maxFixedArity = 3;
          G__3601.cljs$lang$applyTo = function(arglist__3602) {
            var x = cljs.core.first(arglist__3602);
            var y = cljs.core.first(cljs.core.next(arglist__3602));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3602)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3602)));
            return G__3601__delegate.call(this, x, y, z, args)
          };
          return G__3601
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__3595.call(this);
            case 1:
              return epn__3596.call(this, x);
            case 2:
              return epn__3597.call(this, x, y);
            case 3:
              return epn__3598.call(this, x, y, z);
            default:
              return epn__3599.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__3599.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__3594 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3594__delegate.call(this, p1, p2, p3, ps)
    };
    G__3594.cljs$lang$maxFixedArity = 3;
    G__3594.cljs$lang$applyTo = function(arglist__3603) {
      var p1 = cljs.core.first(arglist__3603);
      var p2 = cljs.core.first(cljs.core.next(arglist__3603));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3603)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3603)));
      return G__3594__delegate.call(this, p1, p2, p3, ps)
    };
    return G__3594
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__3565.call(this, p1);
      case 2:
        return every_pred__3566.call(this, p1, p2);
      case 3:
        return every_pred__3567.call(this, p1, p2, p3);
      default:
        return every_pred__3568.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__3568.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__3643 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__3648 = function() {
        return null
      };
      var sp1__3649 = function(x) {
        return p.call(null, x)
      };
      var sp1__3650 = function(x, y) {
        var or__3548__auto____3605 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3605)) {
          return or__3548__auto____3605
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3651 = function(x, y, z) {
        var or__3548__auto____3606 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3606)) {
          return or__3548__auto____3606
        }else {
          var or__3548__auto____3607 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3607)) {
            return or__3548__auto____3607
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__3652 = function() {
        var G__3654__delegate = function(x, y, z, args) {
          var or__3548__auto____3608 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____3608)) {
            return or__3548__auto____3608
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__3654 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3654__delegate.call(this, x, y, z, args)
        };
        G__3654.cljs$lang$maxFixedArity = 3;
        G__3654.cljs$lang$applyTo = function(arglist__3655) {
          var x = cljs.core.first(arglist__3655);
          var y = cljs.core.first(cljs.core.next(arglist__3655));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3655)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3655)));
          return G__3654__delegate.call(this, x, y, z, args)
        };
        return G__3654
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__3648.call(this);
          case 1:
            return sp1__3649.call(this, x);
          case 2:
            return sp1__3650.call(this, x, y);
          case 3:
            return sp1__3651.call(this, x, y, z);
          default:
            return sp1__3652.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__3652.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__3644 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__3656 = function() {
        return null
      };
      var sp2__3657 = function(x) {
        var or__3548__auto____3609 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3609)) {
          return or__3548__auto____3609
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__3658 = function(x, y) {
        var or__3548__auto____3610 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3610)) {
          return or__3548__auto____3610
        }else {
          var or__3548__auto____3611 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3611)) {
            return or__3548__auto____3611
          }else {
            var or__3548__auto____3612 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3612)) {
              return or__3548__auto____3612
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3659 = function(x, y, z) {
        var or__3548__auto____3613 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3613)) {
          return or__3548__auto____3613
        }else {
          var or__3548__auto____3614 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3614)) {
            return or__3548__auto____3614
          }else {
            var or__3548__auto____3615 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____3615)) {
              return or__3548__auto____3615
            }else {
              var or__3548__auto____3616 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____3616)) {
                return or__3548__auto____3616
              }else {
                var or__3548__auto____3617 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____3617)) {
                  return or__3548__auto____3617
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__3660 = function() {
        var G__3662__delegate = function(x, y, z, args) {
          var or__3548__auto____3618 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____3618)) {
            return or__3548__auto____3618
          }else {
            return cljs.core.some.call(null, function(p1__3521_SHARP_) {
              var or__3548__auto____3619 = p1.call(null, p1__3521_SHARP_);
              if(cljs.core.truth_(or__3548__auto____3619)) {
                return or__3548__auto____3619
              }else {
                return p2.call(null, p1__3521_SHARP_)
              }
            }, args)
          }
        };
        var G__3662 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3662__delegate.call(this, x, y, z, args)
        };
        G__3662.cljs$lang$maxFixedArity = 3;
        G__3662.cljs$lang$applyTo = function(arglist__3663) {
          var x = cljs.core.first(arglist__3663);
          var y = cljs.core.first(cljs.core.next(arglist__3663));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3663)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3663)));
          return G__3662__delegate.call(this, x, y, z, args)
        };
        return G__3662
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__3656.call(this);
          case 1:
            return sp2__3657.call(this, x);
          case 2:
            return sp2__3658.call(this, x, y);
          case 3:
            return sp2__3659.call(this, x, y, z);
          default:
            return sp2__3660.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__3660.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__3645 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__3664 = function() {
        return null
      };
      var sp3__3665 = function(x) {
        var or__3548__auto____3620 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3620)) {
          return or__3548__auto____3620
        }else {
          var or__3548__auto____3621 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____3621)) {
            return or__3548__auto____3621
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__3666 = function(x, y) {
        var or__3548__auto____3622 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3622)) {
          return or__3548__auto____3622
        }else {
          var or__3548__auto____3623 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____3623)) {
            return or__3548__auto____3623
          }else {
            var or__3548__auto____3624 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3624)) {
              return or__3548__auto____3624
            }else {
              var or__3548__auto____3625 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____3625)) {
                return or__3548__auto____3625
              }else {
                var or__3548__auto____3626 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____3626)) {
                  return or__3548__auto____3626
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3667 = function(x, y, z) {
        var or__3548__auto____3627 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3627)) {
          return or__3548__auto____3627
        }else {
          var or__3548__auto____3628 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____3628)) {
            return or__3548__auto____3628
          }else {
            var or__3548__auto____3629 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3629)) {
              return or__3548__auto____3629
            }else {
              var or__3548__auto____3630 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____3630)) {
                return or__3548__auto____3630
              }else {
                var or__3548__auto____3631 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____3631)) {
                  return or__3548__auto____3631
                }else {
                  var or__3548__auto____3632 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____3632)) {
                    return or__3548__auto____3632
                  }else {
                    var or__3548__auto____3633 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____3633)) {
                      return or__3548__auto____3633
                    }else {
                      var or__3548__auto____3634 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____3634)) {
                        return or__3548__auto____3634
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__3668 = function() {
        var G__3670__delegate = function(x, y, z, args) {
          var or__3548__auto____3635 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____3635)) {
            return or__3548__auto____3635
          }else {
            return cljs.core.some.call(null, function(p1__3522_SHARP_) {
              var or__3548__auto____3636 = p1.call(null, p1__3522_SHARP_);
              if(cljs.core.truth_(or__3548__auto____3636)) {
                return or__3548__auto____3636
              }else {
                var or__3548__auto____3637 = p2.call(null, p1__3522_SHARP_);
                if(cljs.core.truth_(or__3548__auto____3637)) {
                  return or__3548__auto____3637
                }else {
                  return p3.call(null, p1__3522_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__3670 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3670__delegate.call(this, x, y, z, args)
        };
        G__3670.cljs$lang$maxFixedArity = 3;
        G__3670.cljs$lang$applyTo = function(arglist__3671) {
          var x = cljs.core.first(arglist__3671);
          var y = cljs.core.first(cljs.core.next(arglist__3671));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3671)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3671)));
          return G__3670__delegate.call(this, x, y, z, args)
        };
        return G__3670
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__3664.call(this);
          case 1:
            return sp3__3665.call(this, x);
          case 2:
            return sp3__3666.call(this, x, y);
          case 3:
            return sp3__3667.call(this, x, y, z);
          default:
            return sp3__3668.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__3668.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__3646 = function() {
    var G__3672__delegate = function(p1, p2, p3, ps) {
      var ps__3638 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__3673 = function() {
          return null
        };
        var spn__3674 = function(x) {
          return cljs.core.some.call(null, function(p1__3523_SHARP_) {
            return p1__3523_SHARP_.call(null, x)
          }, ps__3638)
        };
        var spn__3675 = function(x, y) {
          return cljs.core.some.call(null, function(p1__3524_SHARP_) {
            var or__3548__auto____3639 = p1__3524_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3639)) {
              return or__3548__auto____3639
            }else {
              return p1__3524_SHARP_.call(null, y)
            }
          }, ps__3638)
        };
        var spn__3676 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__3525_SHARP_) {
            var or__3548__auto____3640 = p1__3525_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3640)) {
              return or__3548__auto____3640
            }else {
              var or__3548__auto____3641 = p1__3525_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____3641)) {
                return or__3548__auto____3641
              }else {
                return p1__3525_SHARP_.call(null, z)
              }
            }
          }, ps__3638)
        };
        var spn__3677 = function() {
          var G__3679__delegate = function(x, y, z, args) {
            var or__3548__auto____3642 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____3642)) {
              return or__3548__auto____3642
            }else {
              return cljs.core.some.call(null, function(p1__3526_SHARP_) {
                return cljs.core.some.call(null, p1__3526_SHARP_, args)
              }, ps__3638)
            }
          };
          var G__3679 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3679__delegate.call(this, x, y, z, args)
          };
          G__3679.cljs$lang$maxFixedArity = 3;
          G__3679.cljs$lang$applyTo = function(arglist__3680) {
            var x = cljs.core.first(arglist__3680);
            var y = cljs.core.first(cljs.core.next(arglist__3680));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3680)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3680)));
            return G__3679__delegate.call(this, x, y, z, args)
          };
          return G__3679
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__3673.call(this);
            case 1:
              return spn__3674.call(this, x);
            case 2:
              return spn__3675.call(this, x, y);
            case 3:
              return spn__3676.call(this, x, y, z);
            default:
              return spn__3677.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__3677.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__3672 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3672__delegate.call(this, p1, p2, p3, ps)
    };
    G__3672.cljs$lang$maxFixedArity = 3;
    G__3672.cljs$lang$applyTo = function(arglist__3681) {
      var p1 = cljs.core.first(arglist__3681);
      var p2 = cljs.core.first(cljs.core.next(arglist__3681));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3681)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3681)));
      return G__3672__delegate.call(this, p1, p2, p3, ps)
    };
    return G__3672
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__3643.call(this, p1);
      case 2:
        return some_fn__3644.call(this, p1, p2);
      case 3:
        return some_fn__3645.call(this, p1, p2, p3);
      default:
        return some_fn__3646.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__3646.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__3694 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3682 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3682)) {
        var s__3683 = temp__3698__auto____3682;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__3683)), map.call(null, f, cljs.core.rest.call(null, s__3683)))
      }else {
        return null
      }
    })
  };
  var map__3695 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3684 = cljs.core.seq.call(null, c1);
      var s2__3685 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3686 = s1__3684;
        if(cljs.core.truth_(and__3546__auto____3686)) {
          return s2__3685
        }else {
          return and__3546__auto____3686
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__3684), cljs.core.first.call(null, s2__3685)), map.call(null, f, cljs.core.rest.call(null, s1__3684), cljs.core.rest.call(null, s2__3685)))
      }else {
        return null
      }
    })
  };
  var map__3696 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3687 = cljs.core.seq.call(null, c1);
      var s2__3688 = cljs.core.seq.call(null, c2);
      var s3__3689 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3690 = s1__3687;
        if(cljs.core.truth_(and__3546__auto____3690)) {
          var and__3546__auto____3691 = s2__3688;
          if(cljs.core.truth_(and__3546__auto____3691)) {
            return s3__3689
          }else {
            return and__3546__auto____3691
          }
        }else {
          return and__3546__auto____3690
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__3687), cljs.core.first.call(null, s2__3688), cljs.core.first.call(null, s3__3689)), map.call(null, f, cljs.core.rest.call(null, s1__3687), cljs.core.rest.call(null, s2__3688), cljs.core.rest.call(null, s3__3689)))
      }else {
        return null
      }
    })
  };
  var map__3697 = function() {
    var G__3699__delegate = function(f, c1, c2, c3, colls) {
      var step__3693 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__3692 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__3692))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__3692), step.call(null, map.call(null, cljs.core.rest, ss__3692)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__3604_SHARP_) {
        return cljs.core.apply.call(null, f, p1__3604_SHARP_)
      }, step__3693.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__3699 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3699__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__3699.cljs$lang$maxFixedArity = 4;
    G__3699.cljs$lang$applyTo = function(arglist__3700) {
      var f = cljs.core.first(arglist__3700);
      var c1 = cljs.core.first(cljs.core.next(arglist__3700));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3700)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3700))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3700))));
      return G__3699__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__3699
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__3694.call(this, f, c1);
      case 3:
        return map__3695.call(this, f, c1, c2);
      case 4:
        return map__3696.call(this, f, c1, c2, c3);
      default:
        return map__3697.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__3697.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____3701 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3701)) {
        var s__3702 = temp__3698__auto____3701;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3702), take.call(null, n - 1, cljs.core.rest.call(null, s__3702)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__3705 = function(n, coll) {
    while(true) {
      var s__3703 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3704 = n > 0;
        if(cljs.core.truth_(and__3546__auto____3704)) {
          return s__3703
        }else {
          return and__3546__auto____3704
        }
      }())) {
        var G__3706 = n - 1;
        var G__3707 = cljs.core.rest.call(null, s__3703);
        n = G__3706;
        coll = G__3707;
        continue
      }else {
        return s__3703
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__3705.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__3708 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__3709 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__3708.call(this, n);
      case 2:
        return drop_last__3709.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__3711 = cljs.core.seq.call(null, coll);
  var lead__3712 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__3712)) {
      var G__3713 = cljs.core.next.call(null, s__3711);
      var G__3714 = cljs.core.next.call(null, lead__3712);
      s__3711 = G__3713;
      lead__3712 = G__3714;
      continue
    }else {
      return s__3711
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__3717 = function(pred, coll) {
    while(true) {
      var s__3715 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3716 = s__3715;
        if(cljs.core.truth_(and__3546__auto____3716)) {
          return pred.call(null, cljs.core.first.call(null, s__3715))
        }else {
          return and__3546__auto____3716
        }
      }())) {
        var G__3718 = pred;
        var G__3719 = cljs.core.rest.call(null, s__3715);
        pred = G__3718;
        coll = G__3719;
        continue
      }else {
        return s__3715
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__3717.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____3720 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____3720)) {
      var s__3721 = temp__3698__auto____3720;
      return cljs.core.concat.call(null, s__3721, cycle.call(null, s__3721))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__3722 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__3723 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__3722.call(this, n);
      case 2:
        return repeat__3723.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__3725 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__3726 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__3725.call(this, n);
      case 2:
        return repeatedly__3726.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__3732 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3728 = cljs.core.seq.call(null, c1);
      var s2__3729 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3730 = s1__3728;
        if(cljs.core.truth_(and__3546__auto____3730)) {
          return s2__3729
        }else {
          return and__3546__auto____3730
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__3728), cljs.core.cons.call(null, cljs.core.first.call(null, s2__3729), interleave.call(null, cljs.core.rest.call(null, s1__3728), cljs.core.rest.call(null, s2__3729))))
      }else {
        return null
      }
    })
  };
  var interleave__3733 = function() {
    var G__3735__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__3731 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__3731))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__3731), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__3731)))
        }else {
          return null
        }
      })
    };
    var G__3735 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3735__delegate.call(this, c1, c2, colls)
    };
    G__3735.cljs$lang$maxFixedArity = 2;
    G__3735.cljs$lang$applyTo = function(arglist__3736) {
      var c1 = cljs.core.first(arglist__3736);
      var c2 = cljs.core.first(cljs.core.next(arglist__3736));
      var colls = cljs.core.rest(cljs.core.next(arglist__3736));
      return G__3735__delegate.call(this, c1, c2, colls)
    };
    return G__3735
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__3732.call(this, c1, c2);
      default:
        return interleave__3733.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3733.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__3739 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____3737 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____3737)) {
        var coll__3738 = temp__3695__auto____3737;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__3738), cat.call(null, cljs.core.rest.call(null, coll__3738), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__3739.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__3740 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3741 = function() {
    var G__3743__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__3743 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3743__delegate.call(this, f, coll, colls)
    };
    G__3743.cljs$lang$maxFixedArity = 2;
    G__3743.cljs$lang$applyTo = function(arglist__3744) {
      var f = cljs.core.first(arglist__3744);
      var coll = cljs.core.first(cljs.core.next(arglist__3744));
      var colls = cljs.core.rest(cljs.core.next(arglist__3744));
      return G__3743__delegate.call(this, f, coll, colls)
    };
    return G__3743
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__3740.call(this, f, coll);
      default:
        return mapcat__3741.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3741.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____3745 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____3745)) {
      var s__3746 = temp__3698__auto____3745;
      var f__3747 = cljs.core.first.call(null, s__3746);
      var r__3748 = cljs.core.rest.call(null, s__3746);
      if(cljs.core.truth_(pred.call(null, f__3747))) {
        return cljs.core.cons.call(null, f__3747, filter.call(null, pred, r__3748))
      }else {
        return filter.call(null, pred, r__3748)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__3750 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__3750.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__3749_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__3749_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__3757 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3758 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3751 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3751)) {
        var s__3752 = temp__3698__auto____3751;
        var p__3753 = cljs.core.take.call(null, n, s__3752);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__3753)))) {
          return cljs.core.cons.call(null, p__3753, partition.call(null, n, step, cljs.core.drop.call(null, step, s__3752)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__3759 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3754 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3754)) {
        var s__3755 = temp__3698__auto____3754;
        var p__3756 = cljs.core.take.call(null, n, s__3755);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__3756)))) {
          return cljs.core.cons.call(null, p__3756, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__3755)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__3756, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__3757.call(this, n, step);
      case 3:
        return partition__3758.call(this, n, step, pad);
      case 4:
        return partition__3759.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__3765 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3766 = function(m, ks, not_found) {
    var sentinel__3761 = cljs.core.lookup_sentinel;
    var m__3762 = m;
    var ks__3763 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__3763)) {
        var m__3764 = cljs.core.get.call(null, m__3762, cljs.core.first.call(null, ks__3763), sentinel__3761);
        if(cljs.core.truth_(sentinel__3761 === m__3764)) {
          return not_found
        }else {
          var G__3768 = sentinel__3761;
          var G__3769 = m__3764;
          var G__3770 = cljs.core.next.call(null, ks__3763);
          sentinel__3761 = G__3768;
          m__3762 = G__3769;
          ks__3763 = G__3770;
          continue
        }
      }else {
        return m__3762
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__3765.call(this, m, ks);
      case 3:
        return get_in__3766.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__3771, v) {
  var vec__3772__3773 = p__3771;
  var k__3774 = cljs.core.nth.call(null, vec__3772__3773, 0, null);
  var ks__3775 = cljs.core.nthnext.call(null, vec__3772__3773, 1);
  if(cljs.core.truth_(ks__3775)) {
    return cljs.core.assoc.call(null, m, k__3774, assoc_in.call(null, cljs.core.get.call(null, m, k__3774), ks__3775, v))
  }else {
    return cljs.core.assoc.call(null, m, k__3774, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__3776, f, args) {
    var vec__3777__3778 = p__3776;
    var k__3779 = cljs.core.nth.call(null, vec__3777__3778, 0, null);
    var ks__3780 = cljs.core.nthnext.call(null, vec__3777__3778, 1);
    if(cljs.core.truth_(ks__3780)) {
      return cljs.core.assoc.call(null, m, k__3779, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__3779), ks__3780, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__3779, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__3779), args))
    }
  };
  var update_in = function(m, p__3776, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__3776, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__3781) {
    var m = cljs.core.first(arglist__3781);
    var p__3776 = cljs.core.first(cljs.core.next(arglist__3781));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3781)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3781)));
    return update_in__delegate.call(this, m, p__3776, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3782 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__3807 = null;
  var G__3807__3808 = function(coll, k) {
    var this__3783 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__3807__3809 = function(coll, k, not_found) {
    var this__3784 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__3807 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3807__3808.call(this, coll, k);
      case 3:
        return G__3807__3809.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3807
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__3785 = this;
  var new_array__3786 = cljs.core.aclone.call(null, this__3785.array);
  new_array__3786[k] = v;
  return new cljs.core.Vector(this__3785.meta, new_array__3786)
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3787 = this;
  var new_array__3788 = cljs.core.aclone.call(null, this__3787.array);
  new_array__3788.push(o);
  return new cljs.core.Vector(this__3787.meta, new_array__3788)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3811 = null;
  var G__3811__3812 = function(v, f) {
    var this__3789 = this;
    return cljs.core.ci_reduce.call(null, this__3789.array, f)
  };
  var G__3811__3813 = function(v, f, start) {
    var this__3790 = this;
    return cljs.core.ci_reduce.call(null, this__3790.array, f, start)
  };
  G__3811 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3811__3812.call(this, v, f);
      case 3:
        return G__3811__3813.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3811
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3791 = this;
  if(cljs.core.truth_(this__3791.array.length > 0)) {
    var vector_seq__3792 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__3791.array.length)) {
          return cljs.core.cons.call(null, this__3791.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__3792.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3793 = this;
  return this__3793.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3794 = this;
  var count__3795 = this__3794.array.length;
  if(cljs.core.truth_(count__3795 > 0)) {
    return this__3794.array[count__3795 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3796 = this;
  if(cljs.core.truth_(this__3796.array.length > 0)) {
    var new_array__3797 = cljs.core.aclone.call(null, this__3796.array);
    new_array__3797.pop();
    return new cljs.core.Vector(this__3796.meta, new_array__3797)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__3798 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3799 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3800 = this;
  return new cljs.core.Vector(meta, this__3800.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3801 = this;
  return this__3801.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3815 = null;
  var G__3815__3816 = function(coll, n) {
    var this__3802 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3803 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____3803)) {
        return n < this__3802.array.length
      }else {
        return and__3546__auto____3803
      }
    }())) {
      return this__3802.array[n]
    }else {
      return null
    }
  };
  var G__3815__3817 = function(coll, n, not_found) {
    var this__3804 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3805 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____3805)) {
        return n < this__3804.array.length
      }else {
        return and__3546__auto____3805
      }
    }())) {
      return this__3804.array[n]
    }else {
      return not_found
    }
  };
  G__3815 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3815__3816.call(this, coll, n);
      case 3:
        return G__3815__3817.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3815
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3806 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__3806.meta)
};
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, cljs.core.array.call(null));
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.Vector.prototype.call = function() {
  var G__3819 = null;
  var G__3819__3820 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__3819__3821 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__3819 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3819__3820.call(this, _, k);
      case 3:
        return G__3819__3821.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3819
}();
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.Vector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__3823) {
    var args = cljs.core.seq(arglist__3823);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3824 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__3844 = null;
  var G__3844__3845 = function(coll, k) {
    var this__3825 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__3844__3846 = function(coll, k, not_found) {
    var this__3826 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__3844 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3844__3845.call(this, coll, k);
      case 3:
        return G__3844__3846.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3844
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__3827 = this;
  var v_pos__3828 = this__3827.start + key;
  return new cljs.core.Subvec(this__3827.meta, cljs.core._assoc.call(null, this__3827.v, v_pos__3828, val), this__3827.start, this__3827.end > v_pos__3828 + 1 ? this__3827.end : v_pos__3828 + 1)
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3829 = this;
  return new cljs.core.Subvec(this__3829.meta, cljs.core._assoc_n.call(null, this__3829.v, this__3829.end, o), this__3829.start, this__3829.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3848 = null;
  var G__3848__3849 = function(coll, f) {
    var this__3830 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__3848__3850 = function(coll, f, start) {
    var this__3831 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__3848 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3848__3849.call(this, coll, f);
      case 3:
        return G__3848__3850.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3848
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3832 = this;
  var subvec_seq__3833 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__3832.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__3832.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__3833.call(null, this__3832.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3834 = this;
  return this__3834.end - this__3834.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3835 = this;
  return cljs.core._nth.call(null, this__3835.v, this__3835.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3836 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__3836.start, this__3836.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__3836.meta, this__3836.v, this__3836.start, this__3836.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__3837 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3838 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3839 = this;
  return new cljs.core.Subvec(meta, this__3839.v, this__3839.start, this__3839.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3840 = this;
  return this__3840.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3852 = null;
  var G__3852__3853 = function(coll, n) {
    var this__3841 = this;
    return cljs.core._nth.call(null, this__3841.v, this__3841.start + n)
  };
  var G__3852__3854 = function(coll, n, not_found) {
    var this__3842 = this;
    return cljs.core._nth.call(null, this__3842.v, this__3842.start + n, not_found)
  };
  G__3852 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3852__3853.call(this, coll, n);
      case 3:
        return G__3852__3854.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3852
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3843 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__3843.meta)
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__3856 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3857 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__3856.call(this, v, start);
      case 3:
        return subvec__3857.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.Subvec.prototype.call = function() {
  var G__3859 = null;
  var G__3859__3860 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__3859__3861 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__3859 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3859__3860.call(this, _, k);
      case 3:
        return G__3859__3861.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3859
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3863 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3864 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3865 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3866 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3866.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3867 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3868 = this;
  return cljs.core._first.call(null, this__3868.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3869 = this;
  var temp__3695__auto____3870 = cljs.core.next.call(null, this__3869.front);
  if(cljs.core.truth_(temp__3695__auto____3870)) {
    var f1__3871 = temp__3695__auto____3870;
    return new cljs.core.PersistentQueueSeq(this__3869.meta, f1__3871, this__3869.rear)
  }else {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, this__3869.rear))) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__3869.meta, this__3869.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3872 = this;
  return this__3872.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3873 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__3873.front, this__3873.rear)
};
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3874 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3875 = this;
  if(cljs.core.truth_(this__3875.front)) {
    return new cljs.core.PersistentQueue(this__3875.meta, this__3875.count + 1, this__3875.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____3876 = this__3875.rear;
      if(cljs.core.truth_(or__3548__auto____3876)) {
        return or__3548__auto____3876
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__3875.meta, this__3875.count + 1, cljs.core.conj.call(null, this__3875.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3877 = this;
  var rear__3878 = cljs.core.seq.call(null, this__3877.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____3879 = this__3877.front;
    if(cljs.core.truth_(or__3548__auto____3879)) {
      return or__3548__auto____3879
    }else {
      return rear__3878
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__3877.front, cljs.core.seq.call(null, rear__3878))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3880 = this;
  return this__3880.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3881 = this;
  return cljs.core._first.call(null, this__3881.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3882 = this;
  if(cljs.core.truth_(this__3882.front)) {
    var temp__3695__auto____3883 = cljs.core.next.call(null, this__3882.front);
    if(cljs.core.truth_(temp__3695__auto____3883)) {
      var f1__3884 = temp__3695__auto____3883;
      return new cljs.core.PersistentQueue(this__3882.meta, this__3882.count - 1, f1__3884, this__3882.rear)
    }else {
      return new cljs.core.PersistentQueue(this__3882.meta, this__3882.count - 1, cljs.core.seq.call(null, this__3882.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3885 = this;
  return cljs.core.first.call(null, this__3885.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3886 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3887 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3888 = this;
  return new cljs.core.PersistentQueue(meta, this__3888.count, this__3888.front, this__3888.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3889 = this;
  return this__3889.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3890 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.Vector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__3891 = this;
  return false
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__3892 = array.length;
  var i__3893 = 0;
  while(true) {
    if(cljs.core.truth_(i__3893 < len__3892)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__3893]))) {
        return i__3893
      }else {
        var G__3894 = i__3893 + incr;
        i__3893 = G__3894;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___3896 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___3897 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3895 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____3895)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____3895
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___3896.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___3897.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3900 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__3919 = null;
  var G__3919__3920 = function(coll, k) {
    var this__3901 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__3919__3921 = function(coll, k, not_found) {
    var this__3902 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__3902.strobj, this__3902.strobj[k], not_found)
  };
  G__3919 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3919__3920.call(this, coll, k);
      case 3:
        return G__3919__3921.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3919
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__3903 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__3904 = goog.object.clone.call(null, this__3903.strobj);
    var overwrite_QMARK___3905 = new_strobj__3904.hasOwnProperty(k);
    new_strobj__3904[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___3905)) {
      return new cljs.core.ObjMap(this__3903.meta, this__3903.keys, new_strobj__3904)
    }else {
      var new_keys__3906 = cljs.core.aclone.call(null, this__3903.keys);
      new_keys__3906.push(k);
      return new cljs.core.ObjMap(this__3903.meta, new_keys__3906, new_strobj__3904)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__3903.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__3907 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__3907.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__3908 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3909 = this;
  if(cljs.core.truth_(this__3909.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__3899_SHARP_) {
      return cljs.core.vector.call(null, p1__3899_SHARP_, this__3909.strobj[p1__3899_SHARP_])
    }, this__3909.keys)
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3910 = this;
  return this__3910.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3911 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3912 = this;
  return new cljs.core.ObjMap(meta, this__3912.keys, this__3912.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3913 = this;
  return this__3913.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3914 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__3914.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__3915 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3916 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____3916)) {
      return this__3915.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____3916
    }
  }())) {
    var new_keys__3917 = cljs.core.aclone.call(null, this__3915.keys);
    var new_strobj__3918 = goog.object.clone.call(null, this__3915.strobj);
    new_keys__3917.splice(cljs.core.scan_array.call(null, 1, k, new_keys__3917), 1);
    cljs.core.js_delete.call(null, new_strobj__3918, k);
    return new cljs.core.ObjMap(this__3915.meta, new_keys__3917, new_strobj__3918)
  }else {
    return coll
  }
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, cljs.core.array.call(null), cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.ObjMap.prototype.call = function() {
  var G__3924 = null;
  var G__3924__3925 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__3924__3926 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__3924 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3924__3925.call(this, _, k);
      case 3:
        return G__3924__3926.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3924
}();
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3928 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__3958 = null;
  var G__3958__3959 = function(coll, k) {
    var this__3929 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__3958__3960 = function(coll, k, not_found) {
    var this__3930 = this;
    var bucket__3931 = this__3930.hashobj[cljs.core.hash.call(null, k)];
    var i__3932 = cljs.core.truth_(bucket__3931) ? cljs.core.scan_array.call(null, 2, k, bucket__3931) : null;
    if(cljs.core.truth_(i__3932)) {
      return bucket__3931[i__3932 + 1]
    }else {
      return not_found
    }
  };
  G__3958 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3958__3959.call(this, coll, k);
      case 3:
        return G__3958__3960.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3958
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__3933 = this;
  var h__3934 = cljs.core.hash.call(null, k);
  var bucket__3935 = this__3933.hashobj[h__3934];
  if(cljs.core.truth_(bucket__3935)) {
    var new_bucket__3936 = cljs.core.aclone.call(null, bucket__3935);
    var new_hashobj__3937 = goog.object.clone.call(null, this__3933.hashobj);
    new_hashobj__3937[h__3934] = new_bucket__3936;
    var temp__3695__auto____3938 = cljs.core.scan_array.call(null, 2, k, new_bucket__3936);
    if(cljs.core.truth_(temp__3695__auto____3938)) {
      var i__3939 = temp__3695__auto____3938;
      new_bucket__3936[i__3939 + 1] = v;
      return new cljs.core.HashMap(this__3933.meta, this__3933.count, new_hashobj__3937)
    }else {
      new_bucket__3936.push(k, v);
      return new cljs.core.HashMap(this__3933.meta, this__3933.count + 1, new_hashobj__3937)
    }
  }else {
    var new_hashobj__3940 = goog.object.clone.call(null, this__3933.hashobj);
    new_hashobj__3940[h__3934] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__3933.meta, this__3933.count + 1, new_hashobj__3940)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__3941 = this;
  var bucket__3942 = this__3941.hashobj[cljs.core.hash.call(null, k)];
  var i__3943 = cljs.core.truth_(bucket__3942) ? cljs.core.scan_array.call(null, 2, k, bucket__3942) : null;
  if(cljs.core.truth_(i__3943)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__3944 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3945 = this;
  if(cljs.core.truth_(this__3945.count > 0)) {
    var hashes__3946 = cljs.core.js_keys.call(null, this__3945.hashobj);
    return cljs.core.mapcat.call(null, function(p1__3923_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__3945.hashobj[p1__3923_SHARP_]))
    }, hashes__3946)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3947 = this;
  return this__3947.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3948 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3949 = this;
  return new cljs.core.HashMap(meta, this__3949.count, this__3949.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3950 = this;
  return this__3950.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3951 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__3951.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__3952 = this;
  var h__3953 = cljs.core.hash.call(null, k);
  var bucket__3954 = this__3952.hashobj[h__3953];
  var i__3955 = cljs.core.truth_(bucket__3954) ? cljs.core.scan_array.call(null, 2, k, bucket__3954) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__3955))) {
    return coll
  }else {
    var new_hashobj__3956 = goog.object.clone.call(null, this__3952.hashobj);
    if(cljs.core.truth_(3 > bucket__3954.length)) {
      cljs.core.js_delete.call(null, new_hashobj__3956, h__3953)
    }else {
      var new_bucket__3957 = cljs.core.aclone.call(null, bucket__3954);
      new_bucket__3957.splice(i__3955, 2);
      new_hashobj__3956[h__3953] = new_bucket__3957
    }
    return new cljs.core.HashMap(this__3952.meta, this__3952.count - 1, new_hashobj__3956)
  }
};
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__3962 = ks.length;
  var i__3963 = 0;
  var out__3964 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__3963 < len__3962)) {
      var G__3965 = i__3963 + 1;
      var G__3966 = cljs.core.assoc.call(null, out__3964, ks[i__3963], vs[i__3963]);
      i__3963 = G__3965;
      out__3964 = G__3966;
      continue
    }else {
      return out__3964
    }
    break
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__3967 = null;
  var G__3967__3968 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__3967__3969 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__3967 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3967__3968.call(this, _, k);
      case 3:
        return G__3967__3969.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3967
}();
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__3971 = cljs.core.seq.call(null, keyvals);
    var out__3972 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__3971)) {
        var G__3973 = cljs.core.nnext.call(null, in$__3971);
        var G__3974 = cljs.core.assoc.call(null, out__3972, cljs.core.first.call(null, in$__3971), cljs.core.second.call(null, in$__3971));
        in$__3971 = G__3973;
        out__3972 = G__3974;
        continue
      }else {
        return out__3972
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__3975) {
    var keyvals = cljs.core.seq(arglist__3975);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__3976_SHARP_, p2__3977_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____3978 = p1__3976_SHARP_;
          if(cljs.core.truth_(or__3548__auto____3978)) {
            return or__3548__auto____3978
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__3977_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__3979) {
    var maps = cljs.core.seq(arglist__3979);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__3982 = function(m, e) {
        var k__3980 = cljs.core.first.call(null, e);
        var v__3981 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__3980))) {
          return cljs.core.assoc.call(null, m, k__3980, f.call(null, cljs.core.get.call(null, m, k__3980), v__3981))
        }else {
          return cljs.core.assoc.call(null, m, k__3980, v__3981)
        }
      };
      var merge2__3984 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__3982, function() {
          var or__3548__auto____3983 = m1;
          if(cljs.core.truth_(or__3548__auto____3983)) {
            return or__3548__auto____3983
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__3984, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__3985) {
    var f = cljs.core.first(arglist__3985);
    var maps = cljs.core.rest(arglist__3985);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__3987 = cljs.core.ObjMap.fromObject([], {});
  var keys__3988 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__3988)) {
      var key__3989 = cljs.core.first.call(null, keys__3988);
      var entry__3990 = cljs.core.get.call(null, map, key__3989, "\ufdd0'user/not-found");
      var G__3991 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__3990, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__3987, key__3989, entry__3990) : ret__3987;
      var G__3992 = cljs.core.next.call(null, keys__3988);
      ret__3987 = G__3991;
      keys__3988 = G__3992;
      continue
    }else {
      return ret__3987
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3993 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4006 = null;
  var G__4006__4007 = function(coll, v) {
    var this__3994 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__4006__4008 = function(coll, v, not_found) {
    var this__3995 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__3995.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__4006 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4006__4007.call(this, coll, v);
      case 3:
        return G__4006__4008.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4006
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3996 = this;
  return new cljs.core.Set(this__3996.meta, cljs.core.assoc.call(null, this__3996.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3997 = this;
  return cljs.core.keys.call(null, this__3997.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__3998 = this;
  return new cljs.core.Set(this__3998.meta, cljs.core.dissoc.call(null, this__3998.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3999 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4000 = this;
  var and__3546__auto____4001 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____4001)) {
    var and__3546__auto____4002 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____4002)) {
      return cljs.core.every_QMARK_.call(null, function(p1__3986_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__3986_SHARP_)
      }, other)
    }else {
      return and__3546__auto____4002
    }
  }else {
    return and__3546__auto____4001
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4003 = this;
  return new cljs.core.Set(meta, this__4003.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4004 = this;
  return this__4004.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4005 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__4005.meta)
};
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.Set.prototype.call = function() {
  var G__4010 = null;
  var G__4010__4011 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__4010__4012 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__4010 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4010__4011.call(this, _, k);
      case 3:
        return G__4010__4012.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4010
}();
cljs.core.set = function set(coll) {
  var in$__4015 = cljs.core.seq.call(null, coll);
  var out__4016 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__4015)))) {
      var G__4017 = cljs.core.rest.call(null, in$__4015);
      var G__4018 = cljs.core.conj.call(null, out__4016, cljs.core.first.call(null, in$__4015));
      in$__4015 = G__4017;
      out__4016 = G__4018;
      continue
    }else {
      return out__4016
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__4019 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____4020 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____4020)) {
        var e__4021 = temp__3695__auto____4020;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__4021))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__4019, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__4014_SHARP_) {
      var temp__3695__auto____4022 = cljs.core.find.call(null, smap, p1__4014_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____4022)) {
        var e__4023 = temp__3695__auto____4022;
        return cljs.core.second.call(null, e__4023)
      }else {
        return p1__4014_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__4031 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__4024, seen) {
        while(true) {
          var vec__4025__4026 = p__4024;
          var f__4027 = cljs.core.nth.call(null, vec__4025__4026, 0, null);
          var xs__4028 = vec__4025__4026;
          var temp__3698__auto____4029 = cljs.core.seq.call(null, xs__4028);
          if(cljs.core.truth_(temp__3698__auto____4029)) {
            var s__4030 = temp__3698__auto____4029;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__4027))) {
              var G__4032 = cljs.core.rest.call(null, s__4030);
              var G__4033 = seen;
              p__4024 = G__4032;
              seen = G__4033;
              continue
            }else {
              return cljs.core.cons.call(null, f__4027, step.call(null, cljs.core.rest.call(null, s__4030), cljs.core.conj.call(null, seen, f__4027)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__4031.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__4034 = cljs.core.Vector.fromArray([]);
  var s__4035 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__4035))) {
      var G__4036 = cljs.core.conj.call(null, ret__4034, cljs.core.first.call(null, s__4035));
      var G__4037 = cljs.core.next.call(null, s__4035);
      ret__4034 = G__4036;
      s__4035 = G__4037;
      continue
    }else {
      return cljs.core.seq.call(null, ret__4034)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____4038 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____4038)) {
        return or__3548__auto____4038
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__4039 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__4039 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__4039 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____4040 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____4040)) {
      return or__3548__auto____4040
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__4041 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__4041 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__4041)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__4044 = cljs.core.ObjMap.fromObject([], {});
  var ks__4045 = cljs.core.seq.call(null, keys);
  var vs__4046 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4047 = ks__4045;
      if(cljs.core.truth_(and__3546__auto____4047)) {
        return vs__4046
      }else {
        return and__3546__auto____4047
      }
    }())) {
      var G__4048 = cljs.core.assoc.call(null, map__4044, cljs.core.first.call(null, ks__4045), cljs.core.first.call(null, vs__4046));
      var G__4049 = cljs.core.next.call(null, ks__4045);
      var G__4050 = cljs.core.next.call(null, vs__4046);
      map__4044 = G__4048;
      ks__4045 = G__4049;
      vs__4046 = G__4050;
      continue
    }else {
      return map__4044
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__4053 = function(k, x) {
    return x
  };
  var max_key__4054 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4055 = function() {
    var G__4057__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4042_SHARP_, p2__4043_SHARP_) {
        return max_key.call(null, k, p1__4042_SHARP_, p2__4043_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__4057 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4057__delegate.call(this, k, x, y, more)
    };
    G__4057.cljs$lang$maxFixedArity = 3;
    G__4057.cljs$lang$applyTo = function(arglist__4058) {
      var k = cljs.core.first(arglist__4058);
      var x = cljs.core.first(cljs.core.next(arglist__4058));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4058)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4058)));
      return G__4057__delegate.call(this, k, x, y, more)
    };
    return G__4057
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__4053.call(this, k, x);
      case 3:
        return max_key__4054.call(this, k, x, y);
      default:
        return max_key__4055.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4055.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__4059 = function(k, x) {
    return x
  };
  var min_key__4060 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4061 = function() {
    var G__4063__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4051_SHARP_, p2__4052_SHARP_) {
        return min_key.call(null, k, p1__4051_SHARP_, p2__4052_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__4063 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4063__delegate.call(this, k, x, y, more)
    };
    G__4063.cljs$lang$maxFixedArity = 3;
    G__4063.cljs$lang$applyTo = function(arglist__4064) {
      var k = cljs.core.first(arglist__4064);
      var x = cljs.core.first(cljs.core.next(arglist__4064));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4064)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4064)));
      return G__4063__delegate.call(this, k, x, y, more)
    };
    return G__4063
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__4059.call(this, k, x);
      case 3:
        return min_key__4060.call(this, k, x, y);
      default:
        return min_key__4061.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4061.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__4067 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__4068 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4065 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4065)) {
        var s__4066 = temp__3698__auto____4065;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__4066), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__4066)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__4067.call(this, n, step);
      case 3:
        return partition_all__4068.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4070 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4070)) {
      var s__4071 = temp__3698__auto____4070;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__4071)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4071), take_while.call(null, pred, cljs.core.rest.call(null, s__4071)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__4072 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__4073 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4089 = null;
  var G__4089__4090 = function(rng, f) {
    var this__4074 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__4089__4091 = function(rng, f, s) {
    var this__4075 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__4089 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__4089__4090.call(this, rng, f);
      case 3:
        return G__4089__4091.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4089
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__4076 = this;
  var comp__4077 = cljs.core.truth_(this__4076.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__4077.call(null, this__4076.start, this__4076.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__4078 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__4078.end - this__4078.start) / this__4078.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__4079 = this;
  return this__4079.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__4080 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__4080.meta, this__4080.start + this__4080.step, this__4080.end, this__4080.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__4081 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__4082 = this;
  return new cljs.core.Range(meta, this__4082.start, this__4082.end, this__4082.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__4083 = this;
  return this__4083.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4093 = null;
  var G__4093__4094 = function(rng, n) {
    var this__4084 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4084.start + n * this__4084.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4085 = this__4084.start > this__4084.end;
        if(cljs.core.truth_(and__3546__auto____4085)) {
          return cljs.core._EQ_.call(null, this__4084.step, 0)
        }else {
          return and__3546__auto____4085
        }
      }())) {
        return this__4084.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__4093__4095 = function(rng, n, not_found) {
    var this__4086 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4086.start + n * this__4086.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4087 = this__4086.start > this__4086.end;
        if(cljs.core.truth_(and__3546__auto____4087)) {
          return cljs.core._EQ_.call(null, this__4086.step, 0)
        }else {
          return and__3546__auto____4087
        }
      }())) {
        return this__4086.start
      }else {
        return not_found
      }
    }
  };
  G__4093 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4093__4094.call(this, rng, n);
      case 3:
        return G__4093__4095.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4093
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__4088 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4088.meta)
};
cljs.core.range = function() {
  var range = null;
  var range__4097 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__4098 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__4099 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__4100 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__4097.call(this);
      case 1:
        return range__4098.call(this, start);
      case 2:
        return range__4099.call(this, start, end);
      case 3:
        return range__4100.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4102 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4102)) {
      var s__4103 = temp__3698__auto____4102;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__4103), take_nth.call(null, n, cljs.core.drop.call(null, n, s__4103)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4105 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4105)) {
      var s__4106 = temp__3698__auto____4105;
      var fst__4107 = cljs.core.first.call(null, s__4106);
      var fv__4108 = f.call(null, fst__4107);
      var run__4109 = cljs.core.cons.call(null, fst__4107, cljs.core.take_while.call(null, function(p1__4104_SHARP_) {
        return cljs.core._EQ_.call(null, fv__4108, f.call(null, p1__4104_SHARP_))
      }, cljs.core.next.call(null, s__4106)));
      return cljs.core.cons.call(null, run__4109, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__4109), s__4106))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__4124 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4120 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4120)) {
        var s__4121 = temp__3695__auto____4120;
        return reductions.call(null, f, cljs.core.first.call(null, s__4121), cljs.core.rest.call(null, s__4121))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__4125 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4122 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4122)) {
        var s__4123 = temp__3698__auto____4122;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__4123)), cljs.core.rest.call(null, s__4123))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__4124.call(this, f, init);
      case 3:
        return reductions__4125.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__4128 = function(f) {
    return function() {
      var G__4133 = null;
      var G__4133__4134 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__4133__4135 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__4133__4136 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__4133__4137 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__4133__4138 = function() {
        var G__4140__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__4140 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4140__delegate.call(this, x, y, z, args)
        };
        G__4140.cljs$lang$maxFixedArity = 3;
        G__4140.cljs$lang$applyTo = function(arglist__4141) {
          var x = cljs.core.first(arglist__4141);
          var y = cljs.core.first(cljs.core.next(arglist__4141));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4141)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4141)));
          return G__4140__delegate.call(this, x, y, z, args)
        };
        return G__4140
      }();
      G__4133 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4133__4134.call(this);
          case 1:
            return G__4133__4135.call(this, x);
          case 2:
            return G__4133__4136.call(this, x, y);
          case 3:
            return G__4133__4137.call(this, x, y, z);
          default:
            return G__4133__4138.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4133.cljs$lang$maxFixedArity = 3;
      G__4133.cljs$lang$applyTo = G__4133__4138.cljs$lang$applyTo;
      return G__4133
    }()
  };
  var juxt__4129 = function(f, g) {
    return function() {
      var G__4142 = null;
      var G__4142__4143 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__4142__4144 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__4142__4145 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__4142__4146 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__4142__4147 = function() {
        var G__4149__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4149 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4149__delegate.call(this, x, y, z, args)
        };
        G__4149.cljs$lang$maxFixedArity = 3;
        G__4149.cljs$lang$applyTo = function(arglist__4150) {
          var x = cljs.core.first(arglist__4150);
          var y = cljs.core.first(cljs.core.next(arglist__4150));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4150)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4150)));
          return G__4149__delegate.call(this, x, y, z, args)
        };
        return G__4149
      }();
      G__4142 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4142__4143.call(this);
          case 1:
            return G__4142__4144.call(this, x);
          case 2:
            return G__4142__4145.call(this, x, y);
          case 3:
            return G__4142__4146.call(this, x, y, z);
          default:
            return G__4142__4147.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4142.cljs$lang$maxFixedArity = 3;
      G__4142.cljs$lang$applyTo = G__4142__4147.cljs$lang$applyTo;
      return G__4142
    }()
  };
  var juxt__4130 = function(f, g, h) {
    return function() {
      var G__4151 = null;
      var G__4151__4152 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__4151__4153 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__4151__4154 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__4151__4155 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__4151__4156 = function() {
        var G__4158__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__4158 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4158__delegate.call(this, x, y, z, args)
        };
        G__4158.cljs$lang$maxFixedArity = 3;
        G__4158.cljs$lang$applyTo = function(arglist__4159) {
          var x = cljs.core.first(arglist__4159);
          var y = cljs.core.first(cljs.core.next(arglist__4159));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4159)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4159)));
          return G__4158__delegate.call(this, x, y, z, args)
        };
        return G__4158
      }();
      G__4151 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4151__4152.call(this);
          case 1:
            return G__4151__4153.call(this, x);
          case 2:
            return G__4151__4154.call(this, x, y);
          case 3:
            return G__4151__4155.call(this, x, y, z);
          default:
            return G__4151__4156.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4151.cljs$lang$maxFixedArity = 3;
      G__4151.cljs$lang$applyTo = G__4151__4156.cljs$lang$applyTo;
      return G__4151
    }()
  };
  var juxt__4131 = function() {
    var G__4160__delegate = function(f, g, h, fs) {
      var fs__4127 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__4161 = null;
        var G__4161__4162 = function() {
          return cljs.core.reduce.call(null, function(p1__4110_SHARP_, p2__4111_SHARP_) {
            return cljs.core.conj.call(null, p1__4110_SHARP_, p2__4111_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__4127)
        };
        var G__4161__4163 = function(x) {
          return cljs.core.reduce.call(null, function(p1__4112_SHARP_, p2__4113_SHARP_) {
            return cljs.core.conj.call(null, p1__4112_SHARP_, p2__4113_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__4127)
        };
        var G__4161__4164 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__4114_SHARP_, p2__4115_SHARP_) {
            return cljs.core.conj.call(null, p1__4114_SHARP_, p2__4115_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__4127)
        };
        var G__4161__4165 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__4116_SHARP_, p2__4117_SHARP_) {
            return cljs.core.conj.call(null, p1__4116_SHARP_, p2__4117_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__4127)
        };
        var G__4161__4166 = function() {
          var G__4168__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__4118_SHARP_, p2__4119_SHARP_) {
              return cljs.core.conj.call(null, p1__4118_SHARP_, cljs.core.apply.call(null, p2__4119_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__4127)
          };
          var G__4168 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4168__delegate.call(this, x, y, z, args)
          };
          G__4168.cljs$lang$maxFixedArity = 3;
          G__4168.cljs$lang$applyTo = function(arglist__4169) {
            var x = cljs.core.first(arglist__4169);
            var y = cljs.core.first(cljs.core.next(arglist__4169));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4169)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4169)));
            return G__4168__delegate.call(this, x, y, z, args)
          };
          return G__4168
        }();
        G__4161 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__4161__4162.call(this);
            case 1:
              return G__4161__4163.call(this, x);
            case 2:
              return G__4161__4164.call(this, x, y);
            case 3:
              return G__4161__4165.call(this, x, y, z);
            default:
              return G__4161__4166.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__4161.cljs$lang$maxFixedArity = 3;
        G__4161.cljs$lang$applyTo = G__4161__4166.cljs$lang$applyTo;
        return G__4161
      }()
    };
    var G__4160 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4160__delegate.call(this, f, g, h, fs)
    };
    G__4160.cljs$lang$maxFixedArity = 3;
    G__4160.cljs$lang$applyTo = function(arglist__4170) {
      var f = cljs.core.first(arglist__4170);
      var g = cljs.core.first(cljs.core.next(arglist__4170));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4170)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4170)));
      return G__4160__delegate.call(this, f, g, h, fs)
    };
    return G__4160
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__4128.call(this, f);
      case 2:
        return juxt__4129.call(this, f, g);
      case 3:
        return juxt__4130.call(this, f, g, h);
      default:
        return juxt__4131.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4131.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__4172 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__4175 = cljs.core.next.call(null, coll);
        coll = G__4175;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__4173 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4171 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____4171)) {
          return n > 0
        }else {
          return and__3546__auto____4171
        }
      }())) {
        var G__4176 = n - 1;
        var G__4177 = cljs.core.next.call(null, coll);
        n = G__4176;
        coll = G__4177;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__4172.call(this, n);
      case 2:
        return dorun__4173.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__4178 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__4179 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__4178.call(this, n);
      case 2:
        return doall__4179.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__4181 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__4181), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4181), 1))) {
      return cljs.core.first.call(null, matches__4181)
    }else {
      return cljs.core.vec.call(null, matches__4181)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__4182 = re.exec(s);
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, matches__4182))) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4182), 1))) {
      return cljs.core.first.call(null, matches__4182)
    }else {
      return cljs.core.vec.call(null, matches__4182)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__4183 = cljs.core.re_find.call(null, re, s);
  var match_idx__4184 = s.search(re);
  var match_str__4185 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__4183)) ? cljs.core.first.call(null, match_data__4183) : match_data__4183;
  var post_match__4186 = cljs.core.subs.call(null, s, match_idx__4184 + cljs.core.count.call(null, match_str__4185));
  if(cljs.core.truth_(match_data__4183)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__4183, re_seq.call(null, re, post_match__4186))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  return new RegExp(s)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__4187_SHARP_) {
    return print_one.call(null, p1__4187_SHARP_, opts)
  }, coll))), cljs.core.Vector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(cljs.core.undefined_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____4188 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____4188)) {
            var and__3546__auto____4192 = function() {
              var x__417__auto____4189 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____4190 = x__417__auto____4189;
                if(cljs.core.truth_(and__3546__auto____4190)) {
                  var and__3546__auto____4191 = x__417__auto____4189.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____4191)) {
                    return cljs.core.not.call(null, x__417__auto____4189.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____4191
                  }
                }else {
                  return and__3546__auto____4190
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__417__auto____4189)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____4192)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____4192
            }
          }else {
            return and__3546__auto____4188
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__417__auto____4193 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____4194 = x__417__auto____4193;
            if(cljs.core.truth_(and__3546__auto____4194)) {
              var and__3546__auto____4195 = x__417__auto____4193.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____4195)) {
                return cljs.core.not.call(null, x__417__auto____4193.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____4195
              }
            }else {
              return and__3546__auto____4194
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__417__auto____4193)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__4196 = cljs.core.first.call(null, objs);
  var sb__4197 = new goog.string.StringBuffer;
  var G__4198__4199 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4198__4199)) {
    var obj__4200 = cljs.core.first.call(null, G__4198__4199);
    var G__4198__4201 = G__4198__4199;
    while(true) {
      if(cljs.core.truth_(obj__4200 === first_obj__4196)) {
      }else {
        sb__4197.append(" ")
      }
      var G__4202__4203 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4200, opts));
      if(cljs.core.truth_(G__4202__4203)) {
        var string__4204 = cljs.core.first.call(null, G__4202__4203);
        var G__4202__4205 = G__4202__4203;
        while(true) {
          sb__4197.append(string__4204);
          var temp__3698__auto____4206 = cljs.core.next.call(null, G__4202__4205);
          if(cljs.core.truth_(temp__3698__auto____4206)) {
            var G__4202__4207 = temp__3698__auto____4206;
            var G__4210 = cljs.core.first.call(null, G__4202__4207);
            var G__4211 = G__4202__4207;
            string__4204 = G__4210;
            G__4202__4205 = G__4211;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4208 = cljs.core.next.call(null, G__4198__4201);
      if(cljs.core.truth_(temp__3698__auto____4208)) {
        var G__4198__4209 = temp__3698__auto____4208;
        var G__4212 = cljs.core.first.call(null, G__4198__4209);
        var G__4213 = G__4198__4209;
        obj__4200 = G__4212;
        G__4198__4201 = G__4213;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__4197)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__4214 = cljs.core.first.call(null, objs);
  var G__4215__4216 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4215__4216)) {
    var obj__4217 = cljs.core.first.call(null, G__4215__4216);
    var G__4215__4218 = G__4215__4216;
    while(true) {
      if(cljs.core.truth_(obj__4217 === first_obj__4214)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__4219__4220 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4217, opts));
      if(cljs.core.truth_(G__4219__4220)) {
        var string__4221 = cljs.core.first.call(null, G__4219__4220);
        var G__4219__4222 = G__4219__4220;
        while(true) {
          cljs.core.string_print.call(null, string__4221);
          var temp__3698__auto____4223 = cljs.core.next.call(null, G__4219__4222);
          if(cljs.core.truth_(temp__3698__auto____4223)) {
            var G__4219__4224 = temp__3698__auto____4223;
            var G__4227 = cljs.core.first.call(null, G__4219__4224);
            var G__4228 = G__4219__4224;
            string__4221 = G__4227;
            G__4219__4222 = G__4228;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4225 = cljs.core.next.call(null, G__4215__4218);
      if(cljs.core.truth_(temp__3698__auto____4225)) {
        var G__4215__4226 = temp__3698__auto____4225;
        var G__4229 = cljs.core.first.call(null, G__4215__4226);
        var G__4230 = G__4215__4226;
        obj__4217 = G__4229;
        G__4215__4218 = G__4230;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__4231) {
    var objs = cljs.core.seq(arglist__4231);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__4232) {
    var objs = cljs.core.seq(arglist__4232);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__4233) {
    var objs = cljs.core.seq(arglist__4233);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__4234) {
    var objs = cljs.core.seq(arglist__4234);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__4235) {
    var objs = cljs.core.seq(arglist__4235);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4236 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4236, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____4237 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____4237)) {
        var nspc__4238 = temp__3698__auto____4237;
        return cljs.core.str.call(null, nspc__4238, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____4239 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____4239)) {
          var nspc__4240 = temp__3698__auto____4239;
          return cljs.core.str.call(null, nspc__4240, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4241 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4241, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4242 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__4243 = this;
  var G__4244__4245 = cljs.core.seq.call(null, this__4243.watches);
  if(cljs.core.truth_(G__4244__4245)) {
    var G__4247__4249 = cljs.core.first.call(null, G__4244__4245);
    var vec__4248__4250 = G__4247__4249;
    var key__4251 = cljs.core.nth.call(null, vec__4248__4250, 0, null);
    var f__4252 = cljs.core.nth.call(null, vec__4248__4250, 1, null);
    var G__4244__4253 = G__4244__4245;
    var G__4247__4254 = G__4247__4249;
    var G__4244__4255 = G__4244__4253;
    while(true) {
      var vec__4256__4257 = G__4247__4254;
      var key__4258 = cljs.core.nth.call(null, vec__4256__4257, 0, null);
      var f__4259 = cljs.core.nth.call(null, vec__4256__4257, 1, null);
      var G__4244__4260 = G__4244__4255;
      f__4259.call(null, key__4258, this$, oldval, newval);
      var temp__3698__auto____4261 = cljs.core.next.call(null, G__4244__4260);
      if(cljs.core.truth_(temp__3698__auto____4261)) {
        var G__4244__4262 = temp__3698__auto____4261;
        var G__4269 = cljs.core.first.call(null, G__4244__4262);
        var G__4270 = G__4244__4262;
        G__4247__4254 = G__4269;
        G__4244__4255 = G__4270;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__4263 = this;
  return this$.watches = cljs.core.assoc.call(null, this__4263.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__4264 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__4264.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__4265 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__4265.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__4266 = this;
  return this__4266.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4267 = this;
  return this__4267.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4268 = this;
  return o === other
};
cljs.core.atom = function() {
  var atom = null;
  var atom__4277 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__4278 = function() {
    var G__4280__delegate = function(x, p__4271) {
      var map__4272__4273 = p__4271;
      var map__4272__4274 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4272__4273)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4272__4273) : map__4272__4273;
      var validator__4275 = cljs.core.get.call(null, map__4272__4274, "\ufdd0'validator");
      var meta__4276 = cljs.core.get.call(null, map__4272__4274, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__4276, validator__4275, null)
    };
    var G__4280 = function(x, var_args) {
      var p__4271 = null;
      if(goog.isDef(var_args)) {
        p__4271 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4280__delegate.call(this, x, p__4271)
    };
    G__4280.cljs$lang$maxFixedArity = 1;
    G__4280.cljs$lang$applyTo = function(arglist__4281) {
      var x = cljs.core.first(arglist__4281);
      var p__4271 = cljs.core.rest(arglist__4281);
      return G__4280__delegate.call(this, x, p__4271)
    };
    return G__4280
  }();
  atom = function(x, var_args) {
    var p__4271 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__4277.call(this, x);
      default:
        return atom__4278.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__4278.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____4282 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____4282)) {
    var validate__4283 = temp__3698__auto____4282;
    if(cljs.core.truth_(validate__4283.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3016)))));
    }
  }else {
  }
  var old_value__4284 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__4284, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___4285 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___4286 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4287 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___4288 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___4289 = function() {
    var G__4291__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__4291 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4291__delegate.call(this, a, f, x, y, z, more)
    };
    G__4291.cljs$lang$maxFixedArity = 5;
    G__4291.cljs$lang$applyTo = function(arglist__4292) {
      var a = cljs.core.first(arglist__4292);
      var f = cljs.core.first(cljs.core.next(arglist__4292));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4292)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4292))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4292)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4292)))));
      return G__4291__delegate.call(this, a, f, x, y, z, more)
    };
    return G__4291
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___4285.call(this, a, f);
      case 3:
        return swap_BANG___4286.call(this, a, f, x);
      case 4:
        return swap_BANG___4287.call(this, a, f, x, y);
      case 5:
        return swap_BANG___4288.call(this, a, f, x, y, z);
      default:
        return swap_BANG___4289.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___4289.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__4293) {
    var iref = cljs.core.first(arglist__4293);
    var f = cljs.core.first(cljs.core.next(arglist__4293));
    var args = cljs.core.rest(cljs.core.next(arglist__4293));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__4294 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__4295 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, cljs.core.gensym_counter))) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__4294.call(this);
      case 1:
        return gensym__4295.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__4297 = this;
  return cljs.core.not.call(null, cljs.core.nil_QMARK_.call(null, cljs.core.deref.call(null, this__4297.state)))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4298 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__4298.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__4298.state, this__4298.f)
  }
  return cljs.core.deref.call(null, this__4298.state)
};
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__4299) {
    var body = cljs.core.seq(arglist__4299);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__4300__4301 = options;
    var map__4300__4302 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4300__4301)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4300__4301) : map__4300__4301;
    var keywordize_keys__4303 = cljs.core.get.call(null, map__4300__4302, "\ufdd0'keywordize-keys");
    var keyfn__4304 = cljs.core.truth_(keywordize_keys__4303) ? cljs.core.keyword : cljs.core.str;
    var f__4310 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__481__auto____4309 = function iter__4305(s__4306) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__4306__4307 = s__4306;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__4306__4307))) {
                        var k__4308 = cljs.core.first.call(null, s__4306__4307);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__4304.call(null, k__4308), thisfn.call(null, x[k__4308])]), iter__4305.call(null, cljs.core.rest.call(null, s__4306__4307)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__481__auto____4309.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__4310.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__4311) {
    var x = cljs.core.first(arglist__4311);
    var options = cljs.core.rest(arglist__4311);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__4312 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__4316__delegate = function(args) {
      var temp__3695__auto____4313 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__4312), args);
      if(cljs.core.truth_(temp__3695__auto____4313)) {
        var v__4314 = temp__3695__auto____4313;
        return v__4314
      }else {
        var ret__4315 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__4312, cljs.core.assoc, args, ret__4315);
        return ret__4315
      }
    };
    var G__4316 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4316__delegate.call(this, args)
    };
    G__4316.cljs$lang$maxFixedArity = 0;
    G__4316.cljs$lang$applyTo = function(arglist__4317) {
      var args = cljs.core.seq(arglist__4317);
      return G__4316__delegate.call(this, args)
    };
    return G__4316
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__4319 = function(f) {
    while(true) {
      var ret__4318 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__4318))) {
        var G__4322 = ret__4318;
        f = G__4322;
        continue
      }else {
        return ret__4318
      }
      break
    }
  };
  var trampoline__4320 = function() {
    var G__4323__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__4323 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4323__delegate.call(this, f, args)
    };
    G__4323.cljs$lang$maxFixedArity = 1;
    G__4323.cljs$lang$applyTo = function(arglist__4324) {
      var f = cljs.core.first(arglist__4324);
      var args = cljs.core.rest(arglist__4324);
      return G__4323__delegate.call(this, f, args)
    };
    return G__4323
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__4319.call(this, f);
      default:
        return trampoline__4320.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__4320.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__4325 = function() {
    return rand.call(null, 1)
  };
  var rand__4326 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__4325.call(this);
      case 1:
        return rand__4326.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__4328 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__4328, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__4328, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___4337 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___4338 = function(h, child, parent) {
    var or__3548__auto____4329 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____4329)) {
      return or__3548__auto____4329
    }else {
      var or__3548__auto____4330 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____4330)) {
        return or__3548__auto____4330
      }else {
        var and__3546__auto____4331 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____4331)) {
          var and__3546__auto____4332 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____4332)) {
            var and__3546__auto____4333 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____4333)) {
              var ret__4334 = true;
              var i__4335 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____4336 = cljs.core.not.call(null, ret__4334);
                  if(cljs.core.truth_(or__3548__auto____4336)) {
                    return or__3548__auto____4336
                  }else {
                    return cljs.core._EQ_.call(null, i__4335, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__4334
                }else {
                  var G__4340 = isa_QMARK_.call(null, h, child.call(null, i__4335), parent.call(null, i__4335));
                  var G__4341 = i__4335 + 1;
                  ret__4334 = G__4340;
                  i__4335 = G__4341;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____4333
            }
          }else {
            return and__3546__auto____4332
          }
        }else {
          return and__3546__auto____4331
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___4337.call(this, h, child);
      case 3:
        return isa_QMARK___4338.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__4342 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__4343 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__4342.call(this, h);
      case 2:
        return parents__4343.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__4345 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__4346 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__4345.call(this, h);
      case 2:
        return ancestors__4346.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__4348 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__4349 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__4348.call(this, h);
      case 2:
        return descendants__4349.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__4359 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3308)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__4360 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3312)))));
    }
    var tp__4354 = "\ufdd0'parents".call(null, h);
    var td__4355 = "\ufdd0'descendants".call(null, h);
    var ta__4356 = "\ufdd0'ancestors".call(null, h);
    var tf__4357 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____4358 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__4354.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4356.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4356.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__4354, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__4357.call(null, "\ufdd0'ancestors".call(null, h), tag, td__4355, parent, ta__4356), "\ufdd0'descendants":tf__4357.call(null, "\ufdd0'descendants".call(null, h), parent, ta__4356, tag, td__4355)})
    }();
    if(cljs.core.truth_(or__3548__auto____4358)) {
      return or__3548__auto____4358
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__4359.call(this, h, tag);
      case 3:
        return derive__4360.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__4366 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__4367 = function(h, tag, parent) {
    var parentMap__4362 = "\ufdd0'parents".call(null, h);
    var childsParents__4363 = cljs.core.truth_(parentMap__4362.call(null, tag)) ? cljs.core.disj.call(null, parentMap__4362.call(null, tag), parent) : cljs.core.set([]);
    var newParents__4364 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__4363)) ? cljs.core.assoc.call(null, parentMap__4362, tag, childsParents__4363) : cljs.core.dissoc.call(null, parentMap__4362, tag);
    var deriv_seq__4365 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__4351_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__4351_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__4351_SHARP_), cljs.core.second.call(null, p1__4351_SHARP_)))
    }, cljs.core.seq.call(null, newParents__4364)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__4362.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__4352_SHARP_, p2__4353_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__4352_SHARP_, p2__4353_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__4365))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__4366.call(this, h, tag);
      case 3:
        return underive__4367.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__4369 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____4371 = cljs.core.truth_(function() {
    var and__3546__auto____4370 = xprefs__4369;
    if(cljs.core.truth_(and__3546__auto____4370)) {
      return xprefs__4369.call(null, y)
    }else {
      return and__3546__auto____4370
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____4371)) {
    return or__3548__auto____4371
  }else {
    var or__3548__auto____4373 = function() {
      var ps__4372 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__4372) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__4372), prefer_table))) {
          }else {
          }
          var G__4376 = cljs.core.rest.call(null, ps__4372);
          ps__4372 = G__4376;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____4373)) {
      return or__3548__auto____4373
    }else {
      var or__3548__auto____4375 = function() {
        var ps__4374 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__4374) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__4374), y, prefer_table))) {
            }else {
            }
            var G__4377 = cljs.core.rest.call(null, ps__4374);
            ps__4374 = G__4377;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____4375)) {
        return or__3548__auto____4375
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____4378 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____4378)) {
    return or__3548__auto____4378
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__4387 = cljs.core.reduce.call(null, function(be, p__4379) {
    var vec__4380__4381 = p__4379;
    var k__4382 = cljs.core.nth.call(null, vec__4380__4381, 0, null);
    var ___4383 = cljs.core.nth.call(null, vec__4380__4381, 1, null);
    var e__4384 = vec__4380__4381;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__4382))) {
      var be2__4386 = cljs.core.truth_(function() {
        var or__3548__auto____4385 = cljs.core.nil_QMARK_.call(null, be);
        if(cljs.core.truth_(or__3548__auto____4385)) {
          return or__3548__auto____4385
        }else {
          return cljs.core.dominates.call(null, k__4382, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__4384 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__4386), k__4382, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__4382, " and ", cljs.core.first.call(null, be2__4386), ", and neither is preferred"));
      }
      return be2__4386
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__4387)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__4387));
      return cljs.core.second.call(null, best_entry__4387)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4388 = mf;
    if(cljs.core.truth_(and__3546__auto____4388)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____4388
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____4389 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4389)) {
        return or__3548__auto____4389
      }else {
        var or__3548__auto____4390 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____4390)) {
          return or__3548__auto____4390
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4391 = mf;
    if(cljs.core.truth_(and__3546__auto____4391)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____4391
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____4392 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4392)) {
        return or__3548__auto____4392
      }else {
        var or__3548__auto____4393 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____4393)) {
          return or__3548__auto____4393
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4394 = mf;
    if(cljs.core.truth_(and__3546__auto____4394)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____4394
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4395 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4395)) {
        return or__3548__auto____4395
      }else {
        var or__3548__auto____4396 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____4396)) {
          return or__3548__auto____4396
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4397 = mf;
    if(cljs.core.truth_(and__3546__auto____4397)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____4397
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____4398 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4398)) {
        return or__3548__auto____4398
      }else {
        var or__3548__auto____4399 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____4399)) {
          return or__3548__auto____4399
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4400 = mf;
    if(cljs.core.truth_(and__3546__auto____4400)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____4400
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4401 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4401)) {
        return or__3548__auto____4401
      }else {
        var or__3548__auto____4402 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____4402)) {
          return or__3548__auto____4402
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4403 = mf;
    if(cljs.core.truth_(and__3546__auto____4403)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____4403
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____4404 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4404)) {
        return or__3548__auto____4404
      }else {
        var or__3548__auto____4405 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____4405)) {
          return or__3548__auto____4405
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4406 = mf;
    if(cljs.core.truth_(and__3546__auto____4406)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____4406
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____4407 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4407)) {
        return or__3548__auto____4407
      }else {
        var or__3548__auto____4408 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____4408)) {
          return or__3548__auto____4408
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._invoke = function _invoke(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4409 = mf;
    if(cljs.core.truth_(and__3546__auto____4409)) {
      return mf.cljs$core$IMultiFn$_invoke
    }else {
      return and__3546__auto____4409
    }
  }())) {
    return mf.cljs$core$IMultiFn$_invoke(mf, args)
  }else {
    return function() {
      var or__3548__auto____4410 = cljs.core._invoke[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4410)) {
        return or__3548__auto____4410
      }else {
        var or__3548__auto____4411 = cljs.core._invoke["_"];
        if(cljs.core.truth_(or__3548__auto____4411)) {
          return or__3548__auto____4411
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-invoke", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_invoke = function do_invoke(mf, dispatch_fn, args) {
  var dispatch_val__4412 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__4413 = cljs.core._get_method.call(null, mf, dispatch_val__4412);
  if(cljs.core.truth_(target_fn__4413)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__4412));
  }
  return cljs.core.apply.call(null, target_fn__4413, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4414 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__4415 = this;
  cljs.core.swap_BANG_.call(null, this__4415.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4415.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4415.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4415.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__4416 = this;
  cljs.core.swap_BANG_.call(null, this__4416.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__4416.method_cache, this__4416.method_table, this__4416.cached_hierarchy, this__4416.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__4417 = this;
  cljs.core.swap_BANG_.call(null, this__4417.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__4417.method_cache, this__4417.method_table, this__4417.cached_hierarchy, this__4417.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__4418 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__4418.cached_hierarchy), cljs.core.deref.call(null, this__4418.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__4418.method_cache, this__4418.method_table, this__4418.cached_hierarchy, this__4418.hierarchy)
  }
  var temp__3695__auto____4419 = cljs.core.deref.call(null, this__4418.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____4419)) {
    var target_fn__4420 = temp__3695__auto____4419;
    return target_fn__4420
  }else {
    var temp__3695__auto____4421 = cljs.core.find_and_cache_best_method.call(null, this__4418.name, dispatch_val, this__4418.hierarchy, this__4418.method_table, this__4418.prefer_table, this__4418.method_cache, this__4418.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____4421)) {
      var target_fn__4422 = temp__3695__auto____4421;
      return target_fn__4422
    }else {
      return cljs.core.deref.call(null, this__4418.method_table).call(null, this__4418.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__4423 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__4423.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__4423.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__4423.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__4423.method_cache, this__4423.method_table, this__4423.cached_hierarchy, this__4423.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__4424 = this;
  return cljs.core.deref.call(null, this__4424.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__4425 = this;
  return cljs.core.deref.call(null, this__4425.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_invoke = function(mf, args) {
  var this__4426 = this;
  return cljs.core.do_invoke.call(null, mf, this__4426.dispatch_fn, args)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__4427__delegate = function(_, args) {
    return cljs.core._invoke.call(null, this, args)
  };
  var G__4427 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__4427__delegate.call(this, _, args)
  };
  G__4427.cljs$lang$maxFixedArity = 1;
  G__4427.cljs$lang$applyTo = function(arglist__4428) {
    var _ = cljs.core.first(arglist__4428);
    var args = cljs.core.rest(arglist__4428);
    return G__4427__delegate.call(this, _, args)
  };
  return G__4427
}();
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("HelloPhoneGap");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.events");
goog.require("goog.dom");
goog.require("goog.dom");
HelloPhoneGap.hello = function hello(name) {
  return alert.call(null, cljs.core.str.call(null, "Hello, ", name))
};
goog.exportSymbol("HelloPhoneGap.hello", HelloPhoneGap.hello);
HelloPhoneGap.__GT_js = function __GT_js(o) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, o))) {
    return cljs.core.name.call(null, o)
  }else {
    if(cljs.core.truth_(cljs.core.map_QMARK_.call(null, o))) {
      var out__2838 = cljs.core.js_obj.call(null);
      var G__2839__2840 = cljs.core.seq.call(null, o);
      if(cljs.core.truth_(G__2839__2840)) {
        var G__2842__2844 = cljs.core.first.call(null, G__2839__2840);
        var vec__2843__2845 = G__2842__2844;
        var k__2846 = cljs.core.nth.call(null, vec__2843__2845, 0, null);
        var v__2847 = cljs.core.nth.call(null, vec__2843__2845, 1, null);
        var G__2839__2848 = G__2839__2840;
        var G__2842__2849 = G__2842__2844;
        var G__2839__2850 = G__2839__2848;
        while(true) {
          var vec__2851__2852 = G__2842__2849;
          var k__2853 = cljs.core.nth.call(null, vec__2851__2852, 0, null);
          var v__2854 = cljs.core.nth.call(null, vec__2851__2852, 1, null);
          var G__2839__2855 = G__2839__2850;
          out__2838[__GT_js.call(null, k__2853)] = __GT_js.call(null, v__2854);
          var temp__3698__auto____2856 = cljs.core.next.call(null, G__2839__2855);
          if(cljs.core.truth_(temp__3698__auto____2856)) {
            var G__2839__2857 = temp__3698__auto____2856;
            var G__2858 = cljs.core.first.call(null, G__2839__2857);
            var G__2859 = G__2839__2857;
            G__2842__2849 = G__2858;
            G__2839__2850 = G__2859;
            continue
          }else {
          }
          break
        }
      }else {
      }
      return out__2838
    }else {
      if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, o))) {
        return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, __GT_js, o))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return o
        }else {
          return null
        }
      }
    }
  }
};
HelloPhoneGap.set_text_BANG_ = function set_text_BANG_(id, text) {
  return document.getElement(id).setTextContent(cljs.core.str.call(null, text))
};
HelloPhoneGap.accelerometer_success = function accelerometer_success(acceleration) {

                       document.getElementById("acc-x").innerText = acceleration.x;
                       document.getElementById("acc-y").innerText = acceleration.y;
                       document.getElementById("acc-z").innerText = acceleration.z;
                       document.getElementById("acc-t").innerText = acceleration.timestamp;
};
HelloPhoneGap.accelerometer_error = function accelerometer_error() {
  return console.log("accelerometer error")
};
HelloPhoneGap.watch_acceleration = function watch_acceleration() {
                       return navigator.accelerometer.watchAcceleration(HelloPhoneGap.accelerometer_success);
};
HelloPhoneGap.start = function start() {
  return goog.events.listen.call(null, document, "deviceready", HelloPhoneGap.watch_acceleration)
};
goog.exportSymbol("HelloPhoneGap.start", HelloPhoneGap.start);
