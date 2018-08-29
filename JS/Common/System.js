//http://ejohn.org/blog/simple-javascript-inheritance/
(function () {
    /*var suppressCtor = false;
    this.Class = function () { };
    Class.extend = function (prop) {

        var base = this.prototype;

        suppressCtor = true;
        var prototype = new this();
        suppressCtor = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            prototype[name] = prop[name];
        }

        function Class() {
            if (!suppressCtor) {
                //this.base = base;
                if (this.ctor)
                    this.ctor.apply(this, arguments);
            }
        };

        Class.prototype = prototype;
        Class.constructor = Class;
        Class.extend = arguments.callee;

        return Class;
    };*/
    var suppressCtor = false;
    this.Class = function () { };
    Class.extend = function callee (prop) {

        var base = this.prototype;

        suppressCtor = true;
        var prototype = new this();
        suppressCtor = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            prototype[name] = prop[name];
        }

        function Class() {
            if (!suppressCtor) {
                //this.base = base;
                if (this.ctor)
                    this.ctor.apply(this, arguments);
            }
        };

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        //Class.extend = arguments.callee;
        //https://johnresig.com/blog/ecmascript-5-strict-mode-json-and-more/
        Class.extend = callee;

        return Class;
    };

    this.Class.define = function (prop) {
        var ctor = prop.ctor;
        if (ctor == undefined)
            ctor = function () { };
        for (var name in prop) {
            if (name != 'ctor')
                ctor.prototype[name] = prop[name];
        }
        return ctor;
    };
})();

//Suceeded by RegExp.Patterns
RegEx_Patterns = {
    //http: //stackoverflow.com/questions/206384/how-to-format-a-json-date
    //http://james.newtonking.com/archive/2009/04/12/native-json-in-ie8-firefox-3-5-plus-json-net.aspx
    //Date_ISO: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(?:([\+-])(\d{2})\:(\d{2}))?Z?$/
    Date_ISO: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d*))?Z?$/,
    //http://stackoverflow.com/questions/8809876/can-i-get-divs-background-image-url
    /*Background_Image: {
        match: /url\(|\)|"|'/g,
        replace: ""
    }*/
    Background_Image: {
        match: /url\((['"])?(.*)\1\)/,
        replace: '$2'
    }
}

Date.Deserialize = function (jsonDate) {
    var parser = RegEx_Patterns.Date_ISO.exec(jsonDate);
    if (parser) {
        var msec = parser.length > 6 ? parser[7] || "000" : "000";
        while (msec.length < 3) {
            msec += "0";
        }
        var utcMilliseconds = Date.UTC(+parser[1], +parser[2] - 1, +parser[3], +parser[4], +parser[5], +parser[6], +msec || 0);
        return new Date(utcMilliseconds);
    }
};

//http://www.west-wind.com/weblog/posts/2009/Sep/15/Making-jQuery-calls-to-WCFASMX-with-a-ServiceProxy-Client
Date.Serialize = function (date) {
    var wcfDate = '/Date(' + date.valueOf() + ')/';
    return wcfDate;
};

function getDisabled(element) {
    return element.prop('disabled');
}

function setDisabled(element, disabled) {
    if (disabled) {
        element.prop('disabled', true);
        if (element.is('a') || element.is('button'))
            element.removeClass('active');
        return element;
    }
    else {
        element.prop('disabled', false);
        if (element.is('a') || element.is('button'))
            element.addClass('active');
        return element;
    }
};

//Suceeded by Error.getMessage
function errorMessage(e) {
    if (e)
        return (e.message || e.description || e.toString ? e.toString() : e);
}

addErrorTipsy = function (elementLabel, element, errorMsg) {
    elementLabel.addClass('errorLabel');
    if (!element.attr('data-error')) {
        var tipsyCount = ++System.tipsyCount;
        element.attr('data-error', errorMsg).attr('data-errTipsy', tipsyCount);
        var tipsy = element.tipsy({ title: 'data-error', gravity: 'w', className: ('errTipsy' + tipsyCount), opacity: 0.95 });
    }
    else
        element.attr('data-error', errorMsg);
};

//http://stackoverflow.com/questions/13861312/javascript-merge-object-with-nested-properties
mergeObjects = function (firstObject, secondObject) {
    var finalObject = {};

    for (var propertyKey in firstObject) {
        finalObject[propertyKey] = mergeProperties(propertyKey, firstObject, secondObject);
    }

    // Merge second object and its properties.
    for (var propertyKey in secondObject) {
        finalObject[propertyKey] = mergeProperties(propertyKey, secondObject, firstObject);
    }

    return finalObject;
};

function mergeProperties(propertyKey, firstObject, secondObject) {
    if (firstObject && secondObject) {
        var firstProperty = firstObject[propertyKey];
        var secondProperty = secondObject[propertyKey];

        if (typeof (firstProperty) === "object" && typeof (secondProperty) === "object") {
            return mergeObjects(firstProperty, secondProperty);
        } else if (typeof (secondProperty) === "undefined") {
            return firstProperty;
        } else if (typeof (firstProperty) === "undefined") {
            return secondProperty;
        }

        throw 'Unable to merge ' + typeof (firstProperty) + ' with ' + typeof (secondProperty);
    }
    else if (firstObject)
        return firstObject[propertyKey];
    else if (secondObject)
        return secondObject[propertyKey];
};

removeErrorTipsy = function (elementLabel, element, unbind) {
    elementLabel.removeClass('errorLabel');
    var tipsyCount = element.attr('data-errTipsy');
    element.removeClass('error').removeAttr('data-error').removeAttr('original-title').removeAttr('data-errTipsy');
    if (unbind) {
        element.unbind('mouseenter').unbind('mouseleave');
    }
    $('.errTipsy' + tipsyCount).remove();
};

//Suceeded by System.Event
EventDelegate = function () {
    var invokationList = [];
    var event = function (arg0) {
        if (arguments.length == 1 && typeof arg0 == 'function')
            invokationList.push(arg0);
        else {
            for (var i = 0, l = invokationList.length; i < l; i++)
                invokationList[i](arg0);
        }
    }
    //event.Remove = function (callback) {
    //    for (var i = 0, l = invokationList.length; i < l; i++)
    //        if (invokationList[i] == callback)
    //            this.Facets.splice(i, 1);
    //}
    return event;
};

Guid = {
    isEmpty: function (guid) {
        return guid && guid.length > 0 && guid.indexOf('0000') == -1 ? false : true;
    },

    Deserialize: function (guid) {
        return guid.replace(/-/g, '')
    },

    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    //http://guid.us/GUID/JavaScript
    newGuid: function () {
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4();
    },

    s4: function () {
        return Math.floor(((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
};

LinkableProperty = function (prop) {
    prop.set = true;
    return prop;
};

ObservableProperty = function (name, getter, setter, options) {
    var defaultValuePath = '$' + name + '_defaultValue';
    //var settingValuePath = '$' + name + '_settingValue';
    var valueChangedPath = '$' + name + '_valueChanged';
    var prop = function (value, container) {
        if (value !== undefined) {
            if (!prop.Apply || this.$container) {
                if (getter.call(this, container) != value) {
                    $.observable(this).setProperty(name, value);
                    if (this[valueChangedPath]) {
                        this[valueChangedPath](value);
                    }
                    //ObjectObservable._setProperty will call the setter directly
                    //if (!this[settingValuePath]) {
                    //    this[settingValuePath] = true;
                    //    $.observable(this).setProperty(name, value);
                    //}
                    //else {
                    //    if (this[settingValuePath]) {
                    //        delete this[settingValuePath];
                    //    }
                    //    setter.call(this, value, container);
                    //    if (this[valueChangedPath]) {
                    //        this[valueChangedPath](value);
                    //    }
                    //}
                }
            }
            else {
                if (this.$tmpl_properties)
                    this.$tmpl_properties.push(prop);
                this[defaultValuePath] = value;
            }
        }
        else if (!prop.Apply || this.$container)
            return getter.call(this, container);
        else
            return this[defaultValuePath];
    };
    prop.get = getter;
    prop.set = setter;
    prop.bind = function (defaultValue) {
        if (options && options.changeDelegate) {
            this[name + 'Changed'] = function (handler) {
                if (!this[valueChangedPath])
                    this[valueChangedPath] = EventDelegate();
                this[valueChangedPath](handler);
            }
        }
        if (defaultValue == undefined && options)
            defaultValue = options.defaultValue;
        if (defaultValue != undefined) {
            prop.call(this, defaultValue);
        }
    };
    if (options && options.templateProperty) {
        prop.Apply = function (container) {
            var defaultValue = this[defaultValuePath];
            if (defaultValue != undefined) {
                prop.call(this, defaultValue, container);
                delete this[defaultValuePath];
            }
        };
    }
    return prop;
};

TemplateProperty = function (name, getter, setter) {
    var defaultValuePath = '$' + name + '_defaultValue';
    var prop = function (value) {
        if (value != undefined) {
            if (!this.$container) {
                if (this.$tmpl_properties)
                    this.$tmpl_properties.push(prop);
                this[defaultValuePath] = value;
            }
            else
                setter.call(this, value);
        }
        else if (this.$container)
            return getter.call(this);
        else
            return this[defaultValuePath];
    };
    prop.Apply = function () {
        var defaultValue = this[defaultValuePath];
        if (defaultValue != undefined) {
            prop.call(this, defaultValue);
            delete this[defaultValuePath];
        }
    };
    return prop;
};

String.format = function (format) {
    var result = '';

    if (arguments == undefined || arguments.length <= 1)
        return result;

    var argOffset = 1;
    var args = arguments;
    if (arguments.length == 2 && jQuery.isArray(arguments[1])) {
        argOffset = 0;
        args = arguments[1];
    }

    for (var i = 0; ;) {
        // Find the next opening or closing brace
        var open = format.indexOf('{', i);
        var close = format.indexOf('}', i);
        if ((open < 0) && (close < 0)) {
            // Not found: copy the end of the string and break
            result += format.slice(i);
            break;
        }
        if ((close > 0) && ((close < open) || (open < 0))) {
            result += format.slice(i, close + 1);
            i = close + 2;
            continue;
        }

        // Copy the string before the brace
        result += format.slice(i, open);
        i = open + 1;

        // Check for double braces (which display as one and are not arguments)
        if (format.charAt(i) === '{') {
            result += '{';
            i++;
            continue;
        }

        // Find the closing brace

        // Get the string between the braces, and split it around the ':' (if any)
        var brace = format.substring(i, close);
        var colonIndex = brace.indexOf(':');
        var argNumber = parseInt((colonIndex < 0) ? brace : brace.substring(0, colonIndex), 10) + argOffset;
        var argFormat = (colonIndex < 0) ? '' : brace.substring(colonIndex + 1);

        var arg = args[argNumber];
        if (typeof (arg) === "undefined" || arg === null) {
            arg = '';
        }

        // If it has a toFormattedString method, call it.  Otherwise, call toString()
        if (arg.toFormattedString) {
            result += arg.toFormattedString(argFormat);
        }
            //else if (useLocale && arg.localeFormat) {
            //    result += arg.localeFormat(argFormat);
            //}
        else if (arg.format) {
            result += arg.format(argFormat);
        }
        else
            result += arg.toString();

        i = close + 1;
    }

    return result;
};

//From jQuery Validation Plugin
String.format2 = function (source, params) {
    if (arguments.length === 1) {
        return function () {
            var args = $.makeArray(arguments);
            args.unshift(source);
            return String.format2.apply(this, args);
        };
    }
    if (arguments.length > 2 && params.constructor !== Array) {
        params = $.makeArray(arguments).slice(1);
    }
    if (params.constructor !== Array) {
        params = [params];
    }
    $.each(params, function (i, n) {
        source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
            return n;
        });
    });
    return source;
};

String.isNullOrEmpty = function (value) {
    if (value) {
        var type = typeof value;
        if (type == 'undefined')
            return true;
        else if (type == 'string')
            return value.length == 0 ? true : false;
        else
            throw String.format('Expected string, got {0}', type);
    }
    else
        return true;
};

String.isNullOrWhiteSpace = function (value) {
    if (value) {
        var type = typeof value;
        if (type == 'undefined')
            return true;
        else if (type == 'string')
            return value.length == 0 || value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').length == 0 ? true : false;
        else
            throw String.format('Expected string, got {0} ({1})', type, value);
    }
    else
        return true;
};

System = {
    Type: {
        RegisterNamespace: function (namespace) {
            var parentNs = window;
            var nsParts = namespace.split('.');

            for (var i = 0, l = nsParts.length; i < l; i++) {
                var nsPart = nsParts[i];
                var ns = parentNs[nsPart];
                if (!ns) {
                    ns = parentNs[nsPart] = {};
                }
                parentNs = ns;
            }
        }
    },

    CustomError: function (name, message) {
        this.name = name;
        this.message = message;
        /*var stack = (new Error).stack.split("\n").slice(1); 
        [undefined, undefined, this.fileName, this.lineNumber] = 
        /^(.*?)@@(.*?):(.*?)$/.exec( stack[1] );
        this.stack = stack.join("\n");*/

        try {
            Object.defineProperty(this, "Message", {
                get: function () {
                    return this.message;
                },
                set: function (value) {
                    this.message = value;
                }
            });
        } catch (e) {
            this.Message = message;
        }

        this.toString = function () {
            if (this.EventLogId) {
                return this.name + ': ' + this.message + '\n[' + this.EventLogId + ']';
            }
            else
                return Error.prototype.toString.call(this);
        };
    },

    tipsyCount: 0
};

toBounds = function (elem) {
    var offset = elem.offset();
    return {
        x1: offset.left,
        y1: offset.top,
        x2: offset.left + elem.width(),
        y2: offset.top + elem.height()
    };
};

insideBounds = function (pointer, bounds) {
    if (pointer.x >= bounds.x1 && pointer.x <= bounds.x2) {
        if (pointer.y >= bounds.y1 && pointer.y <= bounds.y2) {
            return true;
        }
    }
    return false;
};