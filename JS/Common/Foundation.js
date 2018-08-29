$.extend(Foundation, {
    ErrorMessageType: {
        Operation_Invalid: 11,
        Operation_InvalidInput: 12,
        Operation_InvalidInteraction: 13,
        Operation_UnexpectedState: 14,
        Operation_NotSupported: 15,
        Operation_InternalError: 16,
        Data_RecordNotFound: 21,
        Data_DuplicateRecord: 22,
        Data_ReferentialIntegrity: 23,
        Data_StaleRecord: 24,
        Session_NotInitialized: 31,
        Session_NotAuthenticated: 32,
        Session_Unauthorized: 33,
        Session_QuotaExceeded: 34,
        Argument_Invalid: 41,
        Argument_ValueRequired: 42,
        Unknown: 0
    }
});

System.Type.RegisterNamespace('Foundation.Exception');
Foundation.Exception.UnknownException = function (type, message) {
    this.ErrorMessageType = Foundation.ErrorMessageType.Unknown;
    if (!message)
        message = Resource.Exception.Unknown;
    System.CustomError.call(this, type || "UnknownException", message);
    //Error.prototype.constructor.call(this, this.Message);
};
Foundation.Exception.UnknownException.prototype = new Error();
Foundation.Exception.UnknownException.prototype.constructor = Foundation.Exception.UnknownException;

Foundation.Exception.OperationException = function (type) {
    var message;
    this.Type = type;
    switch (type) {
        case Foundation.Exception.OperationException.Type.Invalid:
            this.ErrorMessageType = Foundation.ErrorMessageType.Operation_Invalid;
            message = Resource.Exception.Operation_Invalid;
            break;
        case Foundation.Exception.OperationException.Type.InvalidInput:
            this.ErrorMessageType = Foundation.ErrorMessageType.Operation_InvalidInput;
            message = Resource.Exception.Operation_InvalidInput;
            break;
        case Foundation.Exception.OperationException.Type.InvalidInteraction:
            this.ErrorMessageType = Foundation.ErrorMessageType.Operation_InvalidInteraction;
            message = Resource.Exception.Operation_InvalidInteraction;
            break;
        case Foundation.Exception.OperationException.Type.UnexpectedState:
            this.ErrorMessageType = Foundation.ErrorMessageType.Operation_UnexpectedState;
            message = Resource.Exception.Operation_UnexpectedState;
            break;
        case Foundation.Exception.OperationException.Type.NotSupported:
            this.ErrorMessageType = Foundation.ErrorMessageType.Operation_NotSupported;
            message = Resource.Exception.Operation_NotSupported;
            break;
        case Foundation.Exception.OperationException.Type.InternalError:
            this.ErrorMessageType = Foundation.ErrorMessageType.Operation_InternalError;
            message = Resource.Exception.Operation_InternalError;
            break;
        default:
            this.ErrorMessageType = Foundation.ErrorMessageType.Unknown;
            message = Resource.Exception.Unknown;
    }

    System.CustomError.call(this, "OperationException", message);
    //Error.prototype.constructor.call(this, this.Message);
};
Foundation.Exception.OperationException.Type = {
    Invalid: 1,
    InvalidInput: 2,
    InvalidInteraction: 3,
    UnexpectedState: 4
};
Foundation.Exception.OperationException.prototype = new Error();
Foundation.Exception.OperationException.prototype.constructor = Foundation.Exception.OperationException;

Foundation.Exception.DataException = function (type) {
    var message;
    this.Type = type;
    switch (type) {
        case Foundation.Exception.DataException.Type.RecordNotFound:
            this.ErrorMessageType = Foundation.ErrorMessageType.Data_RecordNotFound;
            message = Resource.Exception.Data_RecordNotFound;
            break;
        case Foundation.Exception.DataException.Type.DuplicateRecord:
            this.ErrorMessageType = Foundation.ErrorMessageType.Data_DuplicateRecord;
            message = Resource.Exception.Data_DuplicateRecord;
            break;
        case Foundation.Exception.DataException.Type.ReferentialIntegrity:
            this.ErrorMessageType = Foundation.ErrorMessageType.Data_ReferentialIntegrity;
            message = Resource.Exception.Data_ReferentialIntegrity;
            break;
        case Foundation.Exception.DataException.Type.StaleRecord:
            this.ErrorMessageType = Foundation.ErrorMessageType.Data_StaleRecord;
            message = Resource.Exception.Data_StaleRecord;
            break;
        default:
            this.ErrorMessageType = Foundation.ErrorMessageType.Unknown;
            message = Resource.Exception.Unknown;
    }

    System.CustomError.call(this, "DataException", message);
    //Error.prototype.constructor.call(this, this.Message);
};
Foundation.Exception.DataException.Type = {
    RecordNotFound: 1,
    DuplicateRecord: 2,
    ReferentialIntegrity: 3,
    StaleRecord: 4
};
Foundation.Exception.DataException.prototype = new Error();
Foundation.Exception.DataException.prototype.constructor = Foundation.Exception.DataException;

Foundation.Exception.SessionException = function (type, d) {
    var message;
    this.Type = type;
    switch (type) {
        case Foundation.Exception.SessionException.Type.NotInitialized:
            this.ErrorMessageType = Foundation.ErrorMessageType.Session_NotInitialized;
            message = Resource.Exception.Session_NotInitialized;
            break;
        case Foundation.Exception.SessionException.Type.NotAuthenticated:
            this.ErrorMessageType = Foundation.ErrorMessageType.Session_NotAuthenticated;
            message = Resource.Exception.Session_NotAuthenticated;
            break;
        case Foundation.Exception.SessionException.Type.Unauthorized:
            this.ErrorMessageType = Foundation.ErrorMessageType.Session_Unauthorized;
            message = Resource.Exception.Session_Unauthorized;
            break;
        case Foundation.Exception.SessionException.Type.QuotaExceeded:
            this.ErrorMessageType = Foundation.ErrorMessageType.Session_QuotaExceeded;
            message = Resource.Exception.Session_QuotaExceeded;
            break;
        default:
            this.ErrorMessageType = Foundation.ErrorMessageType.Unknown;
            message = Resource.Exception.Unknown;
    }

    System.CustomError.call(this, "SessionException", message);
    //Error.prototype.constructor.call(this, this.Message);
    if (d)
        d(this);
};
Foundation.Exception.SessionException.Type = {
    NotInitialized: 1,
    NotAuthenticated: 2,
    Unauthorized: 3,
    QuotaExceeded: 4
};
Foundation.Exception.SessionException.prototype = new Error();
Foundation.Exception.SessionException.prototype.constructor = Foundation.Exception.SessionException;

Foundation.Exception.ArgumentException = function (type, paramName) {
    var message;
    this.Type = type;
    if (paramName) {
        switch (type) {
            case Foundation.Exception.ArgumentException.Type.Invalid:
                this.ErrorMessageType = Foundation.ErrorMessageType.Argument_Invalid;
                message = String.format(Resource.Exception.Argument_Invalid, paramName);
                break;
            case Foundation.Exception.ArgumentException.Type.ValueRequired:
                this.ErrorMessageType = Foundation.ErrorMessageType.Argument_ValueRequired;
                message = String.format(Resource.Exception.Argument_ValueRequired, paramName);
                break;
            default:
                this.ErrorMessageType = Foundation.ErrorMessageType.Unknown;
                message = Resource.Exception.Unknown;
        }
        this.ParamName = paramName;
    }
    else {
        this.ErrorMessageType = Foundation.ErrorMessageType.Unknown;
        message = Resource.Exception.Unknown;
    }

    System.CustomError.call(this, "ArgumentException", message);
    //Error.prototype.constructor.call(this, this.Message);
};
Foundation.Exception.ArgumentException.Type = {
    Invalid: 1,
    ValueRequired: 2
};
Foundation.Exception.ArgumentException.prototype = new Error();
Foundation.Exception.ArgumentException.prototype.constructor = Foundation.Exception.ArgumentException;

Foundation.EditMode = {
    New: 0,
    Edit: 1
};

Foundation.Inserter = Foundation.Page.extend({
    ctor: function () {
        Foundation.Page.prototype.ctor.call(this);
        this.$errorInfo = new Model.EntityValidation.DataErrorInfo(this);
        var $this = this;
        if (typeof this._focusCtrl == "string")
            $(_focusCtrl).focus();
        this.document_keydown = function (e) {
            if (e.keyCode == 9) {//https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.dialog.js#L295-313
                if (!$this._tabbable) {
                    Foundation.Controls.Layout.TabHelper.setTabbable.call($this, $);
                    Foundation.Controls.Layout.TabHelper.Focus.call($this, $(':focus'), true);
                }
                else
                    Foundation.Controls.Layout.TabHelper.Focus.call($this, null, true);
                /*if ($this._tabbable && $this._tabbable.length) {
                    if (++$this._tabIndex >= $this._tabbable.length)
                        $this._tabIndex = 0;
                    $this._tabbable[$this._tabIndex].focus();
                }*/
                e.preventDefault();  //Do not propagate
            }
        };
    },

    //Same as Foundation.Controls.Validation.Control
    Initialize: function (options) {
        Foundation.Page.prototype.Initialize.call(this, options);
        this.$container = $('#form');
        if (this.ValidatorOptions) {
            this.$validator = new Foundation.Validator(this);
        }
        this.$successMessage = $('#successMessage');
        this.$errorMessage = $('#errorMessage');
        this.$errorContainer = $('#error');
        this.$submit = $('#submit');
        var $this = this;
        this.$submit.click(function (event) {
            $this.prepareCommand("Submit");
            return false; //Important
        });
    },

    prepareCommand: function (command, suppress) {
        if (this.$successMessage)
            this.$successMessage.hide();
        if (this.$errorMessage)
            this.$errorMessage.hide();
        if (this.$errorInfo && this.$errorInfo.HasErrors)
            this.$errorInfo.Clear();
        if (!suppress)
            this.onCommand(command);
    },

    Load: function () {
        Foundation.Page.prototype.Load.call(this); //Set the loaded flag
        Foundation.Controls.Layout.TabHelper.setTabbable.call(this, $);
        Foundation.Controls.Layout.TabHelper.Focus.call(this, this.$focusCtrl ? $(this.$focusCtrl) : null, false);
    },

    Ready: function (ready) {
        setDisabled(this.$submit, !ready);
    },

    //Validate: function (proceed) {
    //    if (!this.Entity || this.Entity.$errorInfo != this.$errorInfo)
    //        this.$errorInfo.Clear();
    //    var valid = this.$validator ? this.$validator.form() : true;
    //    proceed(valid && !this.$errorInfo.HasErrors);
    //},

    onCommand: function (command) {
        switch (command) {
            case "Submit":
                if (getDisabled(this.$submit))
                    return false;
                this.$errorInfo.Clear();
                var $this = this;
                /*this.Validate(function (valid) {
                    if (valid) {
                        $this.Ready(false);
                        try {
                            $this.Save(true);
                        }
                        catch (ex) {
                            $this.Invalidate(ex);
                        }
                    }
                    else if ($this.$errorMessage)
                        $this.$errorMessage.show();
                });*/
                new Foundation.Controls.Validation.Context(function (valid) {
                    if (valid) {
                        $this.Ready(false);
                        try {
                            $this.Save(true);
                        }
                        catch (ex) {
                            $this.Invalidate(ex);
                        }
                    }
                    else if ($this.$errorMessage)
                        $this.$errorMessage.show();
                }).Validate(jQuery.proxy(this.Validate, this));
                break;
            case "Cancel":
                if (!Navigation.Main.TryBackward())
                    Navigation.Main.Home();
                break;
        }
    },

    SaveComplete: function (suppressMessage) {
        this.Ready(true);
        if (this.$successMessage && !suppressMessage)
            this.$successMessage.show();
    },

    Invalidate: function (ex) {
        var message = this.GetErrorMessage(ex.ErrorMessageType || Foundation.ErrorMessageType.Unknown, ex);
        this.$errorInfo.SetError('', message);
        if (this.$successMessage)
            this.$successMessage.hide();
        if (this.$errorMessage)
            this.$errorMessage.show();
        this.Ready(true);
    }
});

Foundation.Editor = Foundation.Inserter.extend({
    ctor: function () {
        Foundation.Inserter.prototype.ctor.call(this);
        this.RequiresAuthentication = true;
        this._mode = Foundation.EditMode.New;
    },

    Initialize: function (options) {
        this._delete = $('#delete');
        var $this = this;
        this._delete.click(function () {
            $this.prepareCommand("Delete");
            return false; //Important
        });
        if (this._delete.length && this._confirmDelete) {
            this._confirmDelete.Submit = function () {
                setDisabled($this._delete, false);
                try {
                    $this.Delete();
                }
                catch (ex) {
                    $this.DeleteComplete(ex);
                }
            };

            this._confirmDelete.Error = jQuery.proxy(this.GetErrorMessage, this); //TODO: replace with GetErrorMessage_Ctrl override
        }
        Foundation.Inserter.prototype.Initialize.call(this, options);
    },

    Entity: function (entity) {
        if (entity) {
            this.$entity = entity;
            this.enableEdit();
        }
        else
            return this.$entity;
    },

    enableEdit: function () {
        if (!this.Ready())
            this.Ready(true);
    },

    onCommand: function (command) {
        switch (command) {
            case "Submit":
                if (Session.User.Id > 0 || !this.RequiresAuthentication)
                    Foundation.Inserter.prototype.onCommand.call(this, command);
                else
                    _signIn.Show();
                break;
            case "Delete":
                if (this._confirmDelete)
                    this._confirmDelete.Show();
                break;
            default:
                Foundation.Inserter.prototype.onCommand.call(this, command);
                break;
        }
    },

    Ready: function (ready) {
        Foundation.Inserter.prototype.Ready.call(this, ready);
        if (this._delete) {
            if (!ready) {
                this._deleteEnabled = !getDisabled(this._delete);
                setDisabled(this._delete, true);
            }
            else if (this._deleteEnabled != undefined)
                setDisabled(this._delete, !this._deleteEnabled);
        }
    },

    DeleteComplete: function (ex) {
        if (ex) {
            this._confirmDelete.Invalidate(ex);
        }
        else
            this._confirmDelete.SubmitComplete();
    }
});

Foundation.Validator = Class.define({
    settings: {
        errorClass: "error",
        ignore: ":hidden"
    },

    //Foundation.Validator
    ctor: function (master, options) {
        this.$master = master;
        this.$form = master.$container;
        this.$options = master.ValidatorOptions;
        if (options) {
            if (options.form)
                this.$form = options.form;
        }
        this.$invalid = {};
    },

    elements: function () {
        var $this = this, name;
        return this.$form
            .find("input, select, textarea")
            .not(":submit, :reset, :image")
            .not(typeof this.$options.ignore == "string" ? this.$options.ignore : this.settings.ignore)
            .map(function () {
                if (this.name && $this.$options.rules[this.name]) {
                    return {
                        name: this.name,
                        dom: this
                    }
                }
            });
    },

    getElement: function (name) {
        return Foundation.Validator.findByName(this.$form, name);
    },

    reset: function () {
        for (var name in this.$invalid) {
            this.resetError(name, this.$invalid[name]);
        }
        this.$invalid = {};
    },

    validate: function (element) {
        var elementName;
        if (element) {
            if (typeof element == "string") {
                elementName = element;
                element = this.getElement(element);
            }
            else if (element instanceof jQuery && element.length) {
                elementName = element[0].name;
            }
            else
                throw 'Invalid argument: ' + element;
            return this.validateElement(elementName, element) ? false : true;
        }
        else {
            var valid = true;
            for (var i = 0, elements = this.elements() ; elements[i]; i++) {
                if (this.validateElement(elements[i].name, $(elements[i].dom)))
                    valid = false;
            }
            return valid;
        }
    },

    validateElement: function (name, element) {
        var rules = this.$options.rules ? this.$options.rules[name] : null;
        if (rules) {
            var val = Foundation.Validator.elementValue(element);
            var error = null, param;
            for (var method in rules) {
                if (typeof rules == "string") {
                    method = rules;
                    param = null;
                }
                else
                    param = rules[method];
                error = this.executeRule(method, val, {
                    name: name,
                    $: element,
                    dom: element[0]
                }, {
                    name: method,
                    param: param
                });

                if (error)
                    break;
            }

            if (error)
                this.setError(name, element, error);
            return error;
        }
        else
            throw 'No rules defined for ' + name;
    },

    executeRule: function (method, val, elem, rule) {
        var result;
        if (typeof method == "string") {
            if (Foundation.Validator.methods[method])
                result = Foundation.Validator.methods[method].call(this, val, elem, rule);
            else
                throw 'Method ' + method + ' is not defined';
        }
        else if (typeof method == "function") {
            result = method(val, elem, rule);
        }
        else
            throw 'Invalid argument: ' + method;

        if (result !== true)
            return typeof result !== "string" ? this.getErrorMessage(rule, elem) : result;
    },

    getErrorMessage: function (rule, element) {
        var message;
        if (this.$options && this.$options.messages) {
            message = this.$options.messages[element.name];
            if (message && $.isPlainObject(message))
                message = message[rule.name];
        }

        if (!message) {
            message = Foundation.Validator.messages[rule.name];
            if (message && typeof message == "function")
                message = message.call(this, rule.param);
        }

        if (!message) {
            message = '<strong>Warning: No ' + rule.name + ' message defined for " + element.name + "</strong>';
        }
        else if (typeof message == "function") {
            var regex = /\$?\{(\d+)\}/g;
            if (regex.test(message)) {
                message = String.format2(message.replace(regex, "{$1}"), rule.param);
            }
        }

        return message;
    },

    setError: function (name, element, error) {
        var errorMsg = error.toString();
        this.$master.$errorInfo.SetError(name, errorMsg, true);
        this.showError(name, errorMsg, element);
    },

    showError: function (elementName, errorMsg, element) {
        if (!element)
            element = this.getElement(elementName);
        if (!this.$invalid[elementName])
            this.$invalid[elementName] = element;
        if (this.$master.validationElement)
            element = this.$master.validationElement(elementName) || element;
        element.addClass(this.settings.errorClass)/*.removeClass(validClass)*/;
        addErrorTipsy(this.$form.find('label[for=' + elementName + ']'), element, errorMsg);
    },

    resetError: function (elementName, element) {
        if (!element)
            element = this.getElement(elementName);
        if (this.$master.validationElement)
            element = this.$master.validationElement(elementName) || element;
        element.removeClass(this.settings.errorClass)/*.addClass(validClass)*/;
        removeErrorTipsy($('label[for=' + elementName + ']', this.$form), element, true);
    }
});

//jQuery Validation
Foundation.Validator = $.extend(Foundation.Validator, {
    methods: {
        required: function (value, element, rule) {
            // check if dependency is met
            /*not sure what this is
            if (!Foundation.Validator.depend(rule.param, element.dom)) {
                return "dependency-mismatch";
            }*/
            if (element.dom.nodeName.toLowerCase() === "select") {
                // could be an array for select-multiple or a string, both are fine this way
                var val = element.$.val();
                return val && val.length > 0;
            }
            if (Foundation.Validator.checkable(element.dom)) {
                return Foundation.Validator.getLength(value, element.dom) > 0;
            }
            return $.trim(value).length > 0;
        },

        equalTo: function (value, element, rule) {
            // bind to the blur event of the target in order to revalidate whenever the target field is updated
            // TODO find a way to bind the event just once, avoiding the unbind-rebind overhead
            var target = $(rule.param);
            /*if (this.settings.onfocusout) {
                target.unbind(".validate-equalTo").bind("blur.validate-equalTo", function () {
                    $(element).valid();
                });
            }*/
            return value === target.val();
        },

        // http://docs.jquery.com/Plugins/Validation/Methods/maxlength
        maxlength: function (value, element, rule) {
            var length = $.isArray(value) ? value.length : Foundation.Validator.getLength($.trim(value), element.dom);
            return /*Foundation.Validator.optional(element, rule) ||*/ length <= rule.param;
        },

        // http://docs.jquery.com/Plugins/Validation/Methods/range
        range: function (value, element, rule) {
            return /*Foundation.Validator.optional(element) ||*/ (value >= rule.param[0] && value <= rule.param[1]);
        },

        // http://docs.jquery.com/Plugins/Validation/Methods/rangelength
        rangelength: function (value, element, rule) {
            var length = $.isArray(value) ? value.length : Foundation.Validator.getLength($.trim(value), element.dom);
            return /*Foundation.Validator.optional(element, rule) ||*/ (length >= rule.param[0] && length <= rule.param[1]);
        }
    },

    messages: {
        required: "This field is required.",
        equalTo: "Please enter the same value again.",
        maxlength: String.format2("Please enter no more than {0} characters."),
        range: String.format2("Please enter a value between {0} and {1}.")
    },

    /*not sure what this is
    depend: function (param, element) {
        return Foundation.Validator.dependTypes[typeof param] ? Foundation.Validator.dependTypes[typeof param](param, element) : true;
    },

    dependTypes: {
        "boolean": function (param, element) {
            return param;
        },
        "string": function (param, element) {
            return !!$(param, element.form).length;
        },
        "function": function (param, element) {
            return param(element);
        }
    },
    
    optional: function (element, rule) {
        var val = Foundation.Validator.elementValue(element.$);
        return !Foundation.Validator.methods.required(val, element, rule) && "dependency-mismatch";
    },*/

    checkable: function (element) {
        return (/radio|checkbox/i).test(element.type);
    },

    getLength: function (value, element) {
        switch (element.nodeName.toLowerCase()) {
            case "select":
                return $("option:selected", element).length;
            case "input":
                if (Foundation.Validator.checkable(element)) {
                    return Foundation.Validator.findByName($(element.form), element.name).filter(":checked").length;
                }
        }
        return value.length;
    },

    findByName: function (form, name) {
        return form.find("[name='" + name + "']");
    },

    elementValue: function (element) {
        var type = element.attr("type");
        if (type === "radio" || type === "checkbox") {
            return $("input[name='" + element.attr("name") + "']:checked").val();
        }
        else {
            var val = element.val()

            if (typeof val === "string") {
                return val.replace(/\r/g, "");
            }
            return val;
        }
    },

    addMethod: function (name, method, message) {
        Foundation.Validator.methods[name] = method;
        message = message || Foundation.Validator.messages[name];
        if (message)
            Foundation.Validator.messages[name] = message;
    }
});

System.Type.RegisterNamespace('Foundation.Controls');

Foundation.Controls.Control = Class.extend({
    ctor: function (options) {
        this.$tmpl_properties = [];
        this.Visible.bind.call(this, options ? options.visible : undefined);
    },

    parent: function (type) {
        var parent = this.$parent || (this.$container ? this.$container.parent().$ctrl : undefined);
        while (parent) {
            if (parent instanceof type)
                return parent;
            else
                parent = parent.$parent || (parent.$container ? parent.$container.parent().$ctrl : undefined);
        }
    },

    init: function (container) {
        this.$container = container;
        this.initialize();
    },

    Initialize: function (container, options) {
        /*Tring to attach to static content - doesn't work
        if (options && options.Loaded === true && container) {
            var children = container.children();
            if (children && children.length == 1) {
                this.Container = null;
                container = $(children[0]);
            }
        }*/
        if (this.Container && this.Container != container) {
            this.$container = $(this.Container);
            this.$container.appendTo(container);
        }
        else if (container)
            this.$container = container;
        else
            throw new 'Unable to initialize';

        this.initialize(options);
    },

    initialize: function (options) {
        if (options) {
            if (options.css) {
                this.$container.css(options.css);
            }

            if (options.cssClass) {
                this.$container.addClass(options.cssClass);
            }

            if (options.tmplData) {
                this.applyTemplate(options.tmplData, options.tmplOptions, options.template);
            }
        }

        //Apply $tmpl_properties after the template, so getters/setters that access dom elements work
        //Foundation.Controls.Confirm.Form.CommandText
        this.applyTmplProperties();

        if (!options || options.wireEvents !== false)
            this.wireEvents();
    },

    applyTmplProperties: function () {
        if (this.$tmpl_properties) {
            for (var i = 0, l = this.$tmpl_properties.length; i < l; i++) {
                this.$tmpl_properties[i].Apply.call(this);
            }
            delete this.$tmpl_properties;
        }
    },

    wireEvents: function (options) {
        var $this = this;
        var container = options && options.container ? options.container : this.$container;
        container.delegate('a[data-command]', 'click', function (e) {
            var elem = $(this);
            var command = elem.attr('data-command');
            $this.itemCommand.call(this, command, elem, $this)
            return false;
        });
    },

    itemCommand: function (command, elem, $this) {
        var item = $this;
        var index = elem.attr('data-itemIndex');
        if (index) {
            index = parseInt(index);
            if (!isNaN(index)) {
                if (index >= 0) {
                    var commandItems = elem.attr('data-items');
                    var items = commandItems ? $this[commandItems] : $this.Items;
                    if (items && jQuery.isArray(items) && items.length > index)
                        item = items[index];
                }
                else if (index == -1)
                    item = $.view(this).data;
            }
            else
                console.error('Unable to parse item Index: ' + elem.attr('data-itemIndex'));
        }
        var commandParam = elem.attr('data-commandParam');
        if (commandParam) {
            var parts = commandParam.split('.');
            for (var i = 0, l = parts.length; i < l; i++) {
                var part = parts[i];
                if (item[part])
                    item = item[part];
                else
                    break;
            }
        }
        $this.onCommand(command, item, elem, index);
    },

    onCommand: function (command, data, elem, index) {
        if (this[command]) {
            this[command](data, elem, index);
        }
    },

    applyTemplate: function (data, options, template, container) {
        template = template || this.Template;
        container = container || this.$contentContainer || this.$container;
        if (container) {
            data = data || {};
            if (typeof template == "string") {
                $(template).appendTo(container);
            }
            else if (template.render) {
                //updating does not seem to be working
                //if (!this.$view) {
                if (options && options.link) {
                    delete options.link;
                    template.link(container, data, options);
                }
                else
                    container.empty().append(template.render(data, options));
                /*}
                else {
                this.$view.data = data;
                this.$view.render();
                }*/
            }
            //else if (!this.$tmplItem || this.$tmplItem.key == 0) {
            //    var tmpl = jQuery.tmpl(this.Template, data)
            //    tmpl.appendTo(container);
            //    this.$tmplItem = tmpl.tmplItem();
            //}
            //else {
            //    this.$tmplItem.data = data;
            //    this.$tmplItem.update();
            //}

            if (this.OnApplyTemplate)
                this.OnApplyTemplate();
        }
    },

    Visible: ObservableProperty('Visible', function (container) {
        container = container || this.$container;
        return container.css('display') != 'none' ? true : false;
    }, function (visible, container) {
        container = container || this.$container;
        if (visible === true) {
            if (container.css('display') == 'none') {
                container.show();
            }
        }
        else if (visible === false) {
            if (container.css('display') != 'none') {
                container.hide();
            }
        }
    }, { templateProperty: true, changeDelegate: true })
});

System.Type.RegisterNamespace("Foundation.Controls.Group");
Foundation.Controls.Group.Edit = Foundation.Controls.Control.extend({
    //Container: '<span style="display:none;"><span class="groupPath" id="group"></span>&nbsp;[<a id="change" class="group" data-command="ChangeGroup">' + Resource.Action.Change + '</a>]</span>',
    Container: '<table style="display:none;"><tr><td class="groupPath" id="group"></td><td>&nbsp;</td><td style="vertical-align:top;">[<a id="change" class="group" data-command="ChangeGroup">' + Resource.Action.Change + '</a>]</td></tr></table>',

    Template: jQuery.templates(
    '{{if #index > 0}}&nbsp;&gt;&nbsp;{{/if}}' +
    '<a class="group" data-itemIndex="{{:#getIndex()}}">{{:Name}}</a>'),

    ctor: function (service, select) {
        this._groupId = 0;
        this._enabled = false;
        this.$service = service;
        if (this._root)
            this.$select.Root(this._root);
        this.$select = select;
        this.IsValueRequired = true;
    },

    Root: function (root) {
        if (root != undefined) {
            this._root = root;
            if (this.$select)
                this.$select.Root(this._root);
        }
    },

    Enabled: function (enabled) {
        if (enabled != undefined) {
            this.$enabled = enabled;
            if (!enabled)
                $('#change', this.$container).removeClass('active');
            else
                $('#change', this.$container).addClass('active');
        }
        else
            return this.$enabled;
    },

    Initialize: function (container) {
        if (/*container.is('span') && */container.hasClass('groupPath'))
            this.Container = container;
        Foundation.Controls.Control.prototype.Initialize.call(this, container);
    },

    applyTemplate: function (data, options) {
        this.Items = data; //To use command, Param and #index without linking
        $('#group', this.$container).empty().append(this.Template.render(data, options));
    },

    ChangeGroup: function () {
        if (this.$enabled && this.$select)
            this.$select.Show();
    },

    Populate: function (group, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        if (group != undefined) {
            this._groupId = group;
            return this._populate();
        }
    },

    _populate: function () {
        var $this = this;
        if (this._groupId == 0 && this._root && this._root.Name) {
            this.applyTemplate([{ Id: this._root.Id, Name: this._root.Name, NodeType: Model.Group.NodeType.Super }]);
            this.Visible(true);
        }
        else if (this._groupId > 0) {
            return this.$service.GetPath(this._groupId, null, function (groups) {
                $this.applyTemplate(groups);
                $this.Visible(true);
            });
        }
    },

    Validate: function (proceed) {
        if (this._groupId > 0) {
            var $this = this;
            this.$service.Get(this._groupId, function (group) {
                proceed(((group.NodeType & Model.Group.NodeType.Super) == 0 && (group.NodeType & Model.Group.NodeType.Class) > 0) || ((group.NodeType & Model.Group.NodeType.Super) > 0 && $this.$select && $this.$select.CanSelectSuper));
            });
        }
        else
            proceed(!this.IsValueRequired);
    }
});

System.Type.RegisterNamespace('Foundation.Controls.Layout');
Foundation.Controls.Layout.ModalPopup = Class.define({
    ctor: function (master) {
        this._foregroundElement = null;
        this._backgroundElement = null;
        this.IsOpen = false;

        this.master = master;
        var $this = this;
        master.Resized = function () {
            if ($this.IsOpen)
                $this._layout();
        };

        this.window_resize = function () {
            $this._layout();
        };

        this.document_keydown = function (e) {
            if ($this.IsOpen) {
                if (e.keyCode == 27)     //Esc
                    $this.Hide();
                else if (e.keyCode == 9) {//https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.dialog.js#L295-313
                    Foundation.Controls.Layout.TabHelper.Focus.call($this, null, true);
                    /*if ($this._tabbable.length) {
                        if (++$this._tabIndex >= $this._tabbable.length)
                            $this._tabIndex = 0;
                        $this._tabbable[$this._tabIndex].focus();
                    }*/
                    e.preventDefault();  //Do not propagate
                }
            }
        };
    },

    Initialize: function (container) {
        if (!container)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.ValueRequired, 'container');
        else if (this._foregroundElement)
            throw 'Popup is already initialized for ' + this.master.toString();

        this._foregroundElement = container;

        this._backgroundElement = $('<div style="display:none; position:fixed; top:0; left:0; height:100%; width:100%; background-color:#000000;"></div>');
        this._backgroundElement.css('opacity', '0.5'); //IE workaround
        this._backgroundElement.appendTo(document.body);

        //position:fixed; does not work in IE in quirks mode, may need to set to absolute
        //if (System.Browser.agent == System.Browser.InternetExplorer && document.compatMode != "CSS1Compat") {
        //    this._foregroundElement.style.position = 'absolute';
        //    this._backgroundElement.style.position = 'absolute';
        //}
    },

    Show: function (focusCtrl) {
        if (!this.IsOpen) {

            //Foundation.Controls.Layout.PopupHelper.Show
            this.zIndex = Foundation.Controls.Layout.PopupHelper.zIndex.increment();
            this.IsOpen = true;

            //Foundation.Controls.Layout.PopupHelperWithOverlay.Show
            this._backgroundElement.css('zIndex', this.zIndex - 1);
            this._foregroundElement.css('zIndex', this.zIndex);

            //this.populate();

            $(window).resize(this.window_resize);
            $(document).keydown(this.document_keydown);

            this._backgroundElement.show();
            this._foregroundElement.fadeIn('fast');

            //Foundation.Controls.Layout.Shadow.Drop(this._foregroundElement, '#666666', 3);

            Foundation.Controls.Layout.TabHelper.setTabbable.call(this, this._foregroundElement);
            Foundation.Controls.Layout.TabHelper.Focus.call(this, focusCtrl, false);

            this._layout();
        }
    },

    Hide: function () {
        if (this.IsOpen) {
            //Foundation.Controls.Layout.PopupHelper.Hide
            Foundation.Controls.Layout.PopupHelper.zIndex.decrement();
            this.IsOpen = false;

            this._backgroundElement.hide();
            this._foregroundElement.hide();

            //Foundation.Controls.Layout.Shadow.Remove(this._foregroundElement);

            $(window).unbind('resize', this.window_resize);
            $(document).unbind('keydown', this.document_keydown);
        }
    },

    _layout: function (reset) {
        var w = $(window);
        var maxHeight, maxWidth;
        var windowHeight = w.height();
        var windowWidth = w.width();
        this._foregroundElement.css({
            top: 0,
            left: 0,
            maxHeight: 'none',
            maxWidth: 'none'
        });
        var popupHeight = this._foregroundElement.height();
        if (popupHeight > windowHeight) {
            maxHeight = windowHeight - 10;
        }
        var popupWidth = this._foregroundElement.width();
        if (popupWidth > windowWidth) {
            maxWidth = windowWidth - 10;
        }
        var css = {
            top: windowHeight / 2 - (maxHeight ? maxHeight : popupHeight) / 2,
            left: windowWidth / 2 - (maxWidth ? maxWidth : popupWidth) / 2
        };
        if (maxHeight && maxWidth) {
            css.overflow = 'scroll';
            css.maxHeight = maxHeight;
            css.maxWidth = maxWidth;
        }
        else if (maxHeight) {
            css.overflowY = 'scroll';
            css.maxHeight = maxHeight;
        }
        else if (maxWidth) {
            css.overflowX = 'scroll';
            css.maxWidth = maxWidth;
        }
        else
            css.overflow = 'visible';

        this._foregroundElement.css(css);

        //Foundation.Controls.Layout.Shadow.Move(this._foregroundElement);
    },

    _layoutBackground: function (windowHeight, windowWidth) {

        //IE6 workaround
        //_backgroundElement.css({
        //    "height": windowHeight
        //});  
    }
});

Foundation.Controls.Layout.PopupControl = Foundation.Controls.Control.extend({
    Container: '<div class="popup" style="display:none;"></div>',

    Initialize: function (options) {
        if (options && options.Container) { //Not a popup (embedded Foundation.Controls.Group.Select, Controls.Community.Topic.Post.InlineForm)
            this.Container = options.Container;
            Foundation.Controls.Control.prototype.Initialize.call(this, options.Container, options)
        }
        else
            Foundation.Controls.Control.prototype.Initialize.call(this, document.body, options)

        if (this.$container.hasClass('popup')) {
            this.$container.css({
                display: 'none'
            });
            this._popupContainer = new Foundation.Controls.Layout.ModalPopup(this);
            this._popupContainer.Initialize(this.$container);
            var $this = this;
            /*this.$container.find('#cancel').click(function () {
            if ($this.Cancel)
            $this.Cancel();
            else
            $this.Hide();
            return false;
            });*/
        }
        //else
        //    throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid);

        this.$errorContainer = this.$container.find('#error');
        this.$submit = this.$container.find('#submit');
    },

    onCommand: function (command, data, elem) {
        switch (command) {
            case "Cancel":
                if (this.Cancel)
                    this.Cancel();
                else
                    this.Hide();
                break;
            default:
                Foundation.Controls.Control.prototype.onCommand.call(this, command, data, elem);
        }
    },

    IsOpen: function () {
        return this._popupContainer.IsOpen;
    },

    Show: function () {
        if (!this.$container) {
            if (this.Template)
                this.Initialize({ tmplData: {} });
            else
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);
        }

        //would capture the link that was clicked to open the popup
        //this.$prevFocused = $(document.activeElement);

        var focusCtrl = this.$focusCtrl ? $(this.$focusCtrl, this.$container) : null;
        if (this._popupContainer) {
            if (this.Opening())
                this._popupContainer.Show(focusCtrl);
        }
        else if (!this.Visible() && this.Opening()) {
            this.Visible(true);
            if (focusCtrl)
                focusCtrl.focus();
        }
    },

    Hide: function () {
        if (this._popupContainer) {
            if (this._popupContainer.IsOpen && this.Closing())
                this._popupContainer.Hide();
        }
        else if (this.Visible() && this.Closing())
            this.Visible(false);

        /*if (this.$prevFocused) {
            this.$prevFocused.focus();
            delete this.$prevFocused;
        }*/
    },

    Opening: function () {
        return true;
    },

    Closing: function () {
        return true;
    }
});

Foundation.Controls.Layout.PopupHelper = {
    zIndex: (function () {
        var zIndex = 0;
        var increment = function () {
            return 100 + zIndex++ * 10;
        };
        var decrement = function () {
            zIndex--;
        };
        return {
            increment: increment,
            decrement: decrement
        };
    })()
};

Foundation.Controls.Layout.PopupHelper = $.extend(Class.extend({
    ctor: function (popup, master) {
        this.$popup = popup;
        if (master) {
            this.$master = master;
            var $this = this;
            this.window_resize = function () {
                $this._layout();
            };
        }
    },

    Show: function () {
        if (!this.$popup.IsOpen) {
            //Foundation.Controls.Layout.ModalPopup.Show
            this.zIndex = Foundation.Controls.Layout.PopupHelper.zIndex.increment();
            this.$popup.Show(this.zIndex);
            $(window).resize(this.window_resize);
            this._layout();
            return true;
        }
        else
            this._layout();
    },

    Hide: function () {
        if (this.$popup.IsOpen) {
            //Foundation.Controls.Layout.ModalPopup.Hide
            Foundation.Controls.Layout.PopupHelper.zIndex.decrement();
            this.$popup.Hide();
            if (this.$overlay)
                this.$overlay.hide();
            $(window).unbind('resize', this.window_resize);
            return true;
        }
    },

    _layout: function () {
        if (this.$master && this.$popup.IsOpen)
            this.ArrangePopup(this.$master, this.MaxDropDownHeight || Number.POSITIVE_INFINITY);
    }
}), Foundation.Controls.Layout.PopupHelper);

Foundation.Controls.Layout.PopupHelperNoOverlay = Foundation.Controls.Layout.PopupHelper.extend({
    ctor: function (popup, master) {
        Foundation.Controls.Layout.PopupHelper.prototype.ctor.call(this, popup, master);
        var $this = this;
        //Could also use click, but it may be trapped in some handlers
        this.document_mousedown = function (e) {
            var pointer = {
                x: e.pageX,
                y: e.pageY
            };
            //http://stackoverflow.com/questions/8597663/jquery-how-to-check-if-the-mouse-is-over-an-element
            //http://formativeinnovations.wordpress.com/2013/05/21/jquery-plugin-is-mouse-inside-bounds/
            //Controls.Image.Add.openImage.buttonMenu
            if (!insideBounds(pointer, toBounds($this.$popup.$container)) &&
                (!$this.ClickExclude || !insideBounds(pointer, toBounds($this.ClickExclude)))) {
                $this.Hide();
            }
        };
    },

    /*toBounds: function (elem) {
        var offset = elem.offset();
        return {
            x1: offset.left, 
            y1: offset.top,
            x2: offset.left + elem.width(),
            y2: offset.top + elem.height()
        };
    },

    insideBounds: function (pointer, bounds) {
        if (pointer.x >= bounds.x1 && pointer.x <= bounds.x2) {
            if (pointer.y >= bounds.y1 && pointer.y <= bounds.y2) {
                return true;
            }
        }
        return false;
    },*/

    Show: function () {
        if (Foundation.Controls.Layout.PopupHelper.prototype.Show.call(this)) {
            $(document).mousedown(this.document_mousedown);
            return true;
        }
    },

    Hide: function () {
        if (Foundation.Controls.Layout.PopupHelper.prototype.Hide.call(this)) {
            $(document).unbind('mousedown', this.document_mousedown);
            return true;
        }
    },

    ArrangePopup: function (anchor, maxHeight) {
        var offset = anchor.offset();

        var w = $(window);
        var appWidth = w.width();
        var appHeight = w.height();

        var scrollLeft = w.scrollLeft();
        var scrollTop = w.scrollTop();

        var childWidth = this.$popup.$container.width();
        var childHeight = this.$popup.$container.height();

        if (appWidth > 0 && appHeight > 0) {

            var x = offset.left;
            var y = offset.top;

            var height = anchor.outerHeight();
            var width = anchor.outerWidth();

            if (width > 0 && height > 0) {
                if (!isFinite(maxHeight)) {
                    maxDropDownHeight = ((appHeight - height) * 3) / 5;
                }

                childWidth = Math.min(childWidth, appWidth);
                childHeight = Math.min(childHeight, maxDropDownHeight);
                childWidth = Math.max(width, childWidth);

                var childX = x - 1;
                if (appWidth < (x - scrollLeft + childWidth)) {
                    if (appWidth > (x + width))
                        childX = appWidth - childWidth;
                    else
                        childX = x + width - childWidth;
                }
                var childY = y + height - 1;
                if (appHeight < (childY - scrollTop + childHeight)) {
                    if (childHeight < (y - scrollTop))
                        childY = y - childHeight;
                }
            }

            this.$popup.$container.css('min-width', anchor.outerWidth() + 'px');
            this.$popup.Position({ left: childX, top: childY });
        }
    }
});

Foundation.Controls.Layout.TabHelper = {
    setTabbable: function (container, focusCtrl) {
        this._tabbable = container.find("input, select, textarea, div.rte-wysiwyg")/*.not(":hidden")*/;
    },

    Focus: function (focusCtrl, tabClick) {
        if (this._tabbable.length) {
            var i = this._tabbable.length,
                focusIdx = -1, tabbable;
            while (i--) {
                tabbable = $(this._tabbable[i]);
                if (focusCtrl && tabbable[0] == focusCtrl[0]) {
                    focusIdx = i;
                    break;
                }
                if (tabbable.is(":focus")) {
                    focusIdx = (tabClick === true ? i + 1 : i);
                    if (!focusCtrl)
                        break;
                }
            }
            if (focusIdx == -1) {
                if (this._tabIndex === undefined) {
                    focusIdx = 0;
                }
                else
                    focusIdx = this._tabIndex + 1;
            }
            if (focusIdx >= this._tabbable.length)
                focusIdx = 0;

            i = focusIdx;
            while (i < this._tabbable.length) {
                tabbable = $(this._tabbable[i]);
                if (tabbable.is(":visible") && !tabbable.is(":disabled") && tabbable.attr("tabindex") != -1) {
                    Foundation.Controls.Layout.TabHelper.focus.call(this, tabbable, i);
                    return;
                }
                i++;
            }

            i = 0;
            while (i < focusIdx) {
                tabbable = $(this._tabbable[i]);
                if (tabbable.is(":visible") && !tabbable.is(":disabled") && tabbable.attr("tabindex") != -1) {
                    Foundation.Controls.Layout.TabHelper.focus.call(this, tabbable, i);
                    return;
                }
                i++;
            }

            if (this._tabIndex !== undefined)
                delete this._tabIndex;
        }
    },

    focus: function (tabbable, i) {
        tabbable.focus();
        this._tabIndex = i;
        console.log('Focused ' + tabbable[0].tagName + ' ' + tabbable[0].id);
    }
};

Foundation.Controls.Layout.DropDownBehavior = Class.extend({
    ctor: function (master) {
        this.master = master;
    },

    Initialize: function (content) {
        this.$popup = new Foundation.Controls.Layout.Popup(this, 'item-dropDown');
        this._popupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$popup, this.master.$container);
        var $this = this;
        this.$popup.Closed = function () {
            if (!$this.Closed || $this.Closed()) {
                $this.setActive(false);
            }
        };
        this.$popup.Initialize(content);
    },

    Show: function () {
        this._popupHelper.Show();
        this.setActive(true);
    },

    Hide: function (suppressActive) {
        this._popupHelper.Hide();
        if (!suppressActive) {
            this.setActive(false);
        }
    },

    setActive: function (active) {
        if(active === true)
            this.master.$container.addClass("active");
        else if(active === false)
            this.master.$container.removeClass("active");
        else throw 'Unexpected argument: ' + active
        this._popupHelper._layout();
        if (this.master.Resized)
            this.master.Resized();
    }
});

Foundation.Controls.Layout.ItemsControl = Foundation.Controls.Control.extend({
    Container: '<ul></ul>',

    Template: jQuery.templates(
        '<li data-itemIndex="{{:#index}}">' +
            '<a>{{:Name}}</a>' +
        '</li>'
    ),

    ctor: function () {
        this.$containerId = 'Container' + Foundation.Controls.Layout.ItemsControl.nextId++;
    },

    Initialize: function (container, options) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container, options);
        this.$itemsContainer = this.$container.is('ul') ? this.$container : $('ul', this.$container).first();
    },

    wireEvents: function (clickSelector) {
        var $this = this;
        this.$container.delegate(clickSelector || 'a', 'click', function () {
            var item;
            var elem = $(this);
            if ($this.Items && $this.Items.length) {
                var index = $this.indexFromContainer(elem.parent('li'));
                if (!isNaN(index) && $this.Items.length > index)
                    item = $this.Items[index];
            }
            else
                item = $.view(this).data; //if .link() was used (currently in TreeView)
            if (item && $this.onItemClick) {
                $this.onItemClick(item, index, elem);
            }
            return false;
        });
    },

    indexFromContainer: function (container) {
        if (container && container.attr) {
            var index = parseInt(container.attr('data-itemIndex'));
            if (!isNaN(index))
                return index;
        }
        return -1;
    },

    itemFromContainer: function (container) {
        var index = this.indexFromContainer(container);
        if (!isNaN(index) && this.Items.length > index) {
            return this.Items[index];
        }
    },

    Populate: function (items, context) {
        if (items) {
            if (context && context.link) {
                this.Template.link(this.$itemsContainer, items, context);
            }
            else {
                this.Items = items; //Used in wireEvents for onItemClick
                this.$itemsContainer.empty().append(this.Template.render(items, context));
            }
            var liItems = this.$itemsContainer.children();
            if (liItems.length == items.length) {
                for (var index = 0, l = items.length; index < l; index++) {
                    var liItem = $(liItems[index]);
                    if (parseInt(liItem.attr('data-itemIndex')) == index) {
                        this.prepareContainerForItem(liItem, items[index]);
                    }
                }
            }
        }
        else {
            if (this.$itemsContainer)
                this.$itemsContainer.empty();
            if (this.Items)
                delete this.Items;
        }
    },

    prepareContainerForItem: function (container, item) {
        //Maintaining a mapping would have been cleaner, smth like ItemContainerGenerator in SL
        item[this.$containerId] = container;
    },

    containerFromItem: function (item) {
        //Maintaining a mapping would have been cleaner, smth like ItemContainerGenerator in SL
        return item[this.$containerId];
    }
});
Foundation.Controls.Layout.ItemsControl.nextId = 1;

Foundation.Controls.Layout.AutocompleteBehavior = Foundation.Controls.Layout.DropDownBehavior.extend({
    ContentContainer: '<div></div>',

    ctor: function (master) {
        Foundation.Controls.Layout.DropDownBehavior.prototype.ctor.call(this, master);
        this.itemsControl = new Foundation.Controls.Layout.ItemsControl();
        this.itemsControl.onItemClick = jQuery.proxy(this.ItemCommand, this);
    },

    Initialize: function () {
        this.$contentContainer = $(this.ContentContainer);
        this.itemsControl.Initialize(this.$contentContainer);
        Foundation.Controls.Layout.DropDownBehavior.prototype.Initialize.call(this, this.$contentContainer);
        var $this = this;
        $("#query", this.master.$container).on({
            focus: function () {
                $this.setActive(true);
            },
            blur: function () {
                if (!$this._popupHelper.$popup.IsOpen)
                    $this.setActive(false);
            },
            input: function (e) {
                var val = $(this).val();
                if (val.length) {
                    $this.master.Autocomplete(val, function (items) {
                        if (items && items.length) {
                            $this.itemsControl.Populate(items);
                            $this.Show();
                        }
                        else {
                            $this.itemsControl.Populate();
                            $this.Hide(true);
                        }
                    });
                }
                else {
                    $this.itemsControl.Populate();
                    $this.Hide(true);
                }
            }
        }).attr('autocomplete', 'off');
        this.Closed = function () {
            return !$("#query", $this.master.$container).is(":focus");
        };
    },

    ItemCommand: function (item) {
        this.onItem(item/*, Foundation.Controls.Action.ItemType.Existing*/);
    },

    onItem: function (item/*, itemType*/) {
        this.Hide();
        if (item.Id/* > 0 || itemType == Foundation.Controls.Action.ItemType.New*/)
            this.ItemSelected(item/*, itemType*/);
    }
});

Foundation.Controls.Action = {
    State: {
        Active: 1,
        Inactive: 2,
        Hidden: 3
    },

    Type: {
        Any: 1,
        Self: 2,
        Inter: 3
    },

    ItemType: {
        Existing: 1,
        New: 2,
        Root: 3
    }
};

Foundation.Controls.Layout.Popup = Class.define({
    ctor: function (master, className) {
        this.IsOpen = false;
        this._master = master;
        this.className = className;
    },

    Initialize: function (content) {
        if (!content)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.ValueRequired, 'content');
        else if (this.$container)
            throw 'Popup has already been initialized' + this.master.toString();

        if (content.is('div')) {
            content.css({
                'display': 'none',
                'position': 'absolute'
            });
            content.addClass(this.className);
            this.$container = content;
        }
        else {
            this.$container = $('<div class="' + this.className + '" style="display:none; position:absolute;"></div>').append(content);
        }

        this.$container.click(function (e) {
            //stop clicks within the dropdown from being bubbled up
            e.stopPropagation();
        })

        this.$container.prependTo(document.body);
    },

    Show: function (zIndex) {
        if (this.IsOpen) {
            return;
        }

        this.$container.css('zIndex', zIndex || 100);
        this.$container.show();
        this.IsOpen = true;

        //this.$container.bgiframe();

        //Foundation.Controls.Layout.Shadow.Drop(this.$container, '#666666', 2);
    },

    Hide: function () {
        if (!this.IsOpen) {
            return;
        }

        this.IsOpen = false;
        this.$container.hide();

        if (this.Closed)
            this.Closed();

        //Foundation.Controls.Layout.Shadow.Remove(this.$container);
    },

    Position: function (offset) {
        this.$container.offset(offset);
        //Foundation.Controls.Layout.Shadow.Move(this.$container);
    }
});

System.Type.RegisterNamespace('Foundation.Controls.Search');
Foundation.Controls.Search.TextBoxBase = Foundation.Controls.Control.extend({
    Container: '<table id="searchBox" style="float:right;"><tbody>' +
        '<tr>' +
            '<td>' +
                '<input type="text" id="query" />' +
            '</td>' +
            '<td>' +
                '<a id="search" class="active" data-command="onSearch" title="' + Resource.Action.Search + '"></a>' + //&#9658;
            '</td>' +
        '</tr>' +
    '</tbody></table>',

    Initialize: function (container, popupContainer) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container);

        var $this = this;
        this.$search = this.$container.find('#search');
        this.$container.keyup(function (event) {
            if (event.keyCode == 13) {
                $this.$search.click();
            }
        });

        if (popupContainer) {
            if (!this.$dropDown)
                this.$dropDown = new Foundation.Controls.Layout.DropDownBehavior(this);
            this.$dropDown.Initialize(popupContainer);
        }
    },

    Prompt: function (prompt) {
        if (prompt && !String.isNullOrEmpty(prompt)) {
            $('#query', this.$container).attr('placeholder', prompt);
        }
        else
            $('#query', this.$container).removeAttr('placeholder');
    },

    Text: function (text) {
        if (text != undefined) {
            $('#query', this.$container).val(text);
        }
        else
            return $('#query', this.$container).val();
    },

    onSearch: function () {
        var query = $('#query', this.$container).val();
        if (this.Search)
            this.Search(query);
        if (this.$dropDown)
            this.$dropDown.Hide();
    }
});

Foundation.Controls.Search.TextBox_Autocomplete = Foundation.Controls.Search.TextBoxBase.extend({
    ctor: function (options) {
        Foundation.Controls.Control.prototype.ctor.call(this, options);
        this.$dropDown = new Foundation.Controls.Layout.AutocompleteBehavior(this);
    },

    Initialize: function (container) {
        Foundation.Controls.Search.TextBoxBase.prototype.Initialize.call(this, container);
        this.$dropDown.Initialize();
    }
});

Foundation.Controls.Group.HideParentType = {
    None: 0,
    Header: 1,
    Command: 2,
    Both: 3
};

Foundation.Controls.Group.Select = Foundation.Controls.Layout.PopupControl.extend({
    Template: $.templates(
        '<div class="header" id="parentsPlaceholder" style="display:none;">' +
            '<table style="width:100%"><tbody>' +
                '<tr><td style="text-align:left; vertical-align:middle;">' +
                    '<span id="parents"></span>' +
                    '<span id="parentLock" class="lock" style="display:none;margin-top:-6px;margin-bottom:-4px;"></span>' +
                '</td><td>&nbsp;&nbsp;</td>' +
                '<td id="searchPlaceholder" style="text-align:right; vertical-align:middle;"></td></tr>' +
            '</tbody></table>' +
        '</div>' +
        '<div class="content">' +
            '<ul id="groups" class="groupSelect"></ul>' +
        '</div>' +
        '<div class="footer buttonPanel">' +
            '<a id="parentCommand" data-command="ParentCommand" data-commandParam="ParentGroup" class="button" style="margin-right:10px; display:none;"><span class="button-content">{{:ParentGroup.Name}}</span></a>' + //data-link="visible{:~visibilityFromString(ParentGroup.Name)}" data-link="{:ParentGroup.Name}"
            '{{if CancelVisible link=false}}' +
                '<span>&nbsp;&nbsp;</span>' +
                '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
            '{{/if}}' +
        '</div>'),

    ctor: function (service, popup) {
        this._groupId = 0;
        this.ParentGroup = { Id: 0 };
        this.$service = service;
        if (service.Search) {
            var $this = this;
            this._searchBox = new Foundation.Controls.Search.TextBox_Autocomplete();
            this._searchBox.Resized = function () {
                if ($this.Resized)
                    $this.Resized();
            };
            this._searchBox.$dropDown.ItemSelected = function (group) {
                var command = $this.groupCommand(group, this.CanSelectSuper);

                if (!String.isNullOrEmpty(command))
                    $this.onGroup(group, command);
            };
        }
        this.CanSelectSuper = false;
        this._root = null;
        this.CancelVisible = true;
        this.ShowNested = true;

        $.views.helpers({
            groupCommand: this.groupCommand
        });
    },

    Root: function(root) {
        if(root) {
            this._root = root;
            if (this.ParentGroup.Id == 0 && (this.HideParentAtRoot & Foundation.Controls.Group.HideParentType.Command) == 0)
                this.setParentGroup(root);
        }
    },

    setParentGroup: function(parentGroup) {
        if (parentGroup) {
            //$.observable(this).setProperty('ParentGroup', parentGroup);
            this.ParentGroup = parentGroup;
            if (this._parentCommand) {
                if (parentGroup.Name) {
                    $('span', this._parentCommand).text(parentGroup.Name);
                    if ((parentGroup.Id > 0 && this.parentCommand(parentGroup, this.CanSelectSuper)) || (parentGroup == this._root && this._root.Name))
                        setDisabled(this._parentCommand, false);
                    else
                        setDisabled(this._parentCommand, true);
                    this._parentCommand.show();
                }
                else
                    this._parentCommand.hide();
            }
        }
    },

    GroupTemplate: $.templates('<li style="display:inline-block; vertical-align:top; list-style-type:none; margin: 10px 10px 10px 10px;">' + //float:left;
                                   '{{if ~groupCommand(#data, ~CanSelectSuper) link=false}}' +
                                        '<a class="group active" {{if NavToken link=false}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-command="GroupCommand" data-itemIndex="-1">{{:Name}}' +
                                        '{{if HasChildren link=false}}<span class="drillDown"></span>{{/if}}</a>' + //&#9698;
                                   '{{else}}' +
                                        '<a class="group">{{:Name}}</a>' +
                                   '{{/if}}' +
                                   '{{if HasChildren && ~ShowNested}}' + //Important: link nested template
                                        '<ul>{{for Children tmpl=~SubGroupTemplate/}}</ul>' +
                                   '{{/if}}' +
                                '</li>'),

    SubGroupTemplate: $.templates('<li style="list-style-type:disc">' +
                                      '{{if ~groupCommand(#data, ~CanSelectSuper) link=false}}' +
                                          '<a class="group active" {{if NavToken link=false}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-command="GroupCommand" data-itemIndex="-1">{{:Name}}' +
                                          '{{if HasChildren link=false}}<span class="drillDown"></span>{{/if}}</a>' + //&#9698;
                                      '{{else}}' +
                                          '<a class="group">{{:Name}}</a>' +
                                      '{{/if}}' +
                                    '</li>'),

    ParentTemplate: $.templates('{{if #index > 0}}&nbsp;&gt;&nbsp;{{/if}}' +
                                '{{if Id != ~ParentGroup.Id || (Id > 0 && ~parentCommand(#data, ~CanSelectSuper)) || (#data == ~Root && ~Root.Name)}}' +
                                    '<a class="group active" data-command="ParentCommand" data-items="Parents" data-itemIndex="{{:#getIndex()}}">{{:Name}}</a>' + //{{if NavToken link=false}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}
                                '{{else}}' +
                                    '<a class="group">{{:Name}}</a>' +
                                '{{/if}}'),

    groupCommand: function (group, canSelectSuper) {
        if (group.HasChildren || (group.Children != null && group.Children.length > 0))
            return "Populate";
        else if ((!group.HasChildren && !Model.Group.IsLocked.call(group)/*(group.NodeType & Model.Group.NodeType.Class) > 0*/) || ((group.NodeType & Model.Group.NodeType.Super) > 0 && canSelectSuper))
            return "Select";
        //else
        //    return null;
    },

    parentCommand: function (group, canSelectSuper) {
        return group.NodeType && (canSelectSuper || !Model.Group.IsLocked.call(group)/*(group.NodeType & Model.Group.NodeType.Class) > 0*/);
    },

    GroupCommand: function (group) {
        var command = this.groupCommand(group, this.CanSelectSuper);

        if (!String.isNullOrEmpty(command))
            this.onGroup(group, command);
    },

    ParentCommand: function (group) {
        if (group.Id != this.ParentGroup.Id)
            this.onGroup(group, "Populate");
        else if ((group.Id != 0 && this.parentCommand(group, this.CanSelectSuper)) || (group == this._root && this._root.Name))
            this.onGroup(group, "Select");
    },

    onGroup: function (group, command) {
        switch (command) {
            case "Populate":
                this._populate(group.Id, Model.SubType.Children + (this.ShowNested ? Model.SubType.GrandChildren : 0));
                break;
            case "Select":
                if (this.GroupSelected)
                    this.GroupSelected(group);
                this.Hide();
                break;
        }
    },

    Initialize: function (container) {
        Foundation.Controls.Layout.PopupControl.prototype.Initialize.call(this, {
            Container: container,
            tmplData: { CancelVisible: this.CancelVisible, ParentGroup: this.ParentGroup } /*this,
            tmplOptions: {
                link: true,
                visibilityFromString: Foundation.ValueConverter.Visibility.FromString
            }*/
        });
        this._groups = $('#groups', this.$container);
        this._parents = $('#parents', this.$container);
        this._parentsPlaceholder = $('#parentsPlaceholder', this.$container);
        this._parentLock = $('#parentLock', this.$container);
        this._parentCommand = $('#parentCommand', this.$container);
        if(this.ParentGroup.Name)
            this._parentCommand.show();
        if (this._searchBox) {
            this._searchBox.Initialize($('#searchPlaceholder', this.$container));
            var $this = this;
            this._searchBox.Autocomplete = function (val, callback) {
                $this.$service.Search(($this._root/*ParentGroup*/ ? $this._root.Id : 0), val, $this._root, function (items) {
                    callback(items);
                });
            };
        }
    },

    Populate: function (group, container) {
        if (!this.$container)
            this.Initialize(container)

        if (group != undefined) {
            this._groupId = group;
            return this._populate(this._groupId, Model.SubType.Siblings + Model.SubType.Children + (this.ShowNested ? Model.SubType.GrandChildren : 0), true);
        }
    },

    _populate: function (groupId, type, reflectParent) {
        var rootId = this._root ? this._root.Id : 0;
        if (this._root && this._root.Id > 0 && groupId == this._root.Id)
            type &= ~Model.SubType.Siblings;
        var $this = this;
        return this.$service.PopulateWithChildren(groupId, type, function (node) {
            if (groupId != rootId) {
                $this._setParents(node);
            }
            else if (reflectParent || $this.ParentGroup != this._root || $this.ParentGroup.Id != rootId/*$this._parentGroup != 0*/)
                $this._resetParents(node);
            if ((type & Model.SubType.Children) > 0) {
                var tmplCtx = { CanSelectSuper: $this.CanSelectSuper };
                if ($this.ShowNested && $this.SubGroupTemplate) {
                    tmplCtx.ShowNested = true;
                    tmplCtx.SubGroupTemplate = $this.SubGroupTemplate;
                }
                else
                    tmplCtx.ShowNested = false;
                $this.GroupTemplate.link($this._groups, node.Children, tmplCtx);
            }
            if ($this.Resized) //layout the modal popup (if applicable)
                $this.Resized();
        });
    },

    _setParents: function (node) {
        var parent = node;
        var parents = new Array();
        var rootId = this._root ? this._root.Id : 0;
        while (parent)
        {
            parents.push(parent);
            parent = parent.Id > rootId ? parent.Parent : null;
        }
        if (parents.length > 0) {
            this.setParentGroup(parents[0]);
            this.Parents = parents.reverse(); //To use command, Param and #index without linking
            this._parents.empty().append(this.ParentTemplate.render(this.Parents, { CanSelectSuper: this.CanSelectSuper, Root: this._root, ParentGroup: this.ParentGroup, parentCommand: this.parentCommand }));
            this._parentsPlaceholder.show();
            this.reflectParentLock(this.Parents);
        }
        else
            throw "Array is empty: parents";
    },

    _resetParents: function (node) {
        var parent = node;
        if ((this.HideParentAtRoot & Foundation.Controls.Group.HideParentType.Header) == 0) {
            var rootId = this._root ? this._root.Id : 0;
            while (parent && parent.Id != rootId) {
                parent = parent.Parent;
            }
        }
        else
            parent = null;

        var parentGroup = this._root || parent;
        if ((this.HideParentAtRoot & Foundation.Controls.Group.HideParentType.Command) > 0 || !parentGroup)
            this.setParentGroup({ Id: 0 });
        else
            this.setParentGroup(parentGroup);

        if (parent) {
            this.Parents = [parent];
            this._parents.empty().append(this.ParentTemplate.render(this.Parents, { CanSelectSuper: this.CanSelectSuper, Root: this._root, ParentGroup: this.ParentGroup, parentCommand: this.parentCommand }));
            this._parentsPlaceholder.show();
        }
        else {
            delete this.Parents;
            this._parents.empty();
            this._parentsPlaceholder.hide();
        }
        this.reflectParentLock(this.Parents);
    },

    reflectParentLock: function (parents) {
        if (parents != null && parents.length > 0 && Model.Group.IsLocked.call(parents[parents.length - 1]) && !this.CanSelectSuper)
            this._parentLock.show();
        else
            this._parentLock.hide();
    },

    Closing: function () {
        if (this._searchBox)
            this._searchBox.Text('');
        return Foundation.Controls.Layout.PopupControl.prototype.Closing.call(this);
    }
});

Foundation.Controls.Group.Select_Inline = Foundation.Controls.Group.Select.extend({
    Template: $.templates(
        '<div id="parentsPlaceholder" style="display:none;margin:10px;">' +
            '<table style="width:100%"><tbody>' +
                '<tr><td style="text-align:left; vertical-align:middle;">' +
                    '<span id="parents"></span>' +
                    '<span id="parentLock" class="lock" style="display:none;margin-top:-6px;margin-bottom:-4px;"></span>' +
                '</td><td>&nbsp;&nbsp;</td>' +
                '<td id="searchPlaceholder" style="text-align:right; vertical-align:middle;"></td></tr>' +
            '</tbody></table>' +
        '</div>' +
        '<div class="content">' +
            '<ul id="groups" class="groupSelect"></ul>' +
        '</div>' +
        '<div class="footer buttonPanel">' +
            '<a id="parentCommand" data-command="ParentCommand" data-commandParam="ParentGroup" class="button" style="margin-right:10px; display:none;"><span class="button-content">{{:ParentGroup.Name}}</span></a>' + //data-link="visible{:~visibilityFromString(ParentGroup.Name)}" data-link="{:ParentGroup.Name}"
            '{{if CancelVisible link=false}}' +
                '<span>&nbsp;&nbsp;</span>' +
                '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
            '{{/if}}' +
        '</div>')
});

System.Type.RegisterNamespace('Foundation.Controls.Validation');
Foundation.Controls.Validation.Context = Class.extend({
    ctor: function (proceed) {
        this.$multiValidator = new Foundation.Controls.Validation.MultiValidator(proceed);
    },

    MultiValidator: function () {
        return this.$multiValidator;
    },

    Valid: function () {
        return this.$multiValidator.Valid();
    },

    Invalidate: function () {
        this.$multiValidator.Invalidate();
    },

    Validate: function (method) {
        var $this = this;
        //http://stackoverflow.com/questions/932653/how-to-prevent-buttons-from-submitting-forms
        //Worked around with button type="button", may still need to add try/catch to prevent form from auto-submitting on exception or even get rid of form element
        method(function (valid) {
            if (!valid)
                $this.$multiValidator.Invalidate();

            $this.$multiValidator.Execute();
        }, this);
    }
});

Foundation.Controls.Validation.Control = Foundation.Controls.Control.extend({
    ctor: function (formMaster) {
        Foundation.Controls.Control.prototype.ctor.call(this);
        if (formMaster && formMaster.$errorInfo) {
            this._formMaster = formMaster;
            this.$errorInfo = formMaster.$errorInfo;
            if (this.ValidatorOptions) {
                if (formMaster.ValidatorOptions) //http://stackoverflow.com/questions/13861312/javascript-merge-object-with-nested-properties
                    formMaster.ValidatorOptions = mergeObjects(formMaster.ValidatorOptions, this.ValidatorOptions); //$.extend(formMaster.ValidatorOptions, this.ValidatorOptions) //$.extend will not merge nested ojects e.q rules, messages, etc
            }
        }
        else
            this.$errorInfo = new Model.EntityValidation.DataErrorInfo(this);
    },

    //Same as Foundation.Inserter
    Initialize: function (container, options) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container, options);
        if (this._formMaster && this._formMaster.$validator) {
            this.$validator = this._formMaster.$validator;
        }
        else if (this.ValidatorOptions) {
            this.$validator = new Foundation.Validator(this, { form: this.$container.is('form') ? this.$container : this.$container.find('form') });
        }
        this.$errorContainer = this.$container.find('#error');
    },

    //Validator doesn't seem to handle forms with duplicate element ids well
    //Using .element() for duplicates won't work unless specify selector context (prior to call or in validator.clean: return $(selector, this.currentForm)[0])
    //After call to .showErrors(errors) last validated invalid duplicate element(s) will loose highlighting
    //Using .form() with predefined rules for all fields to validate form at once seems to work
    //Validate: function (prop) {
    //    //if (!this.$validator.element($('#' + prop, this.$container))) {
    //    if (!this.$validator.element('#' + prop)) {
    //        return false;
    //    }
    //    else
    //        return true;
    //}
    ValidateStep: function (proceed, param) {
        if (!this._formMaster || this._formMaster.$errorInfo != this.$errorInfo)
            this.$errorInfo.Clear();
        //this.Validate(proceed, param);
        this.Validate(function (valid) {
            proceed(valid, param);
        });
    },

    //Validate was incorrectly used in Multi-step validation and thus required the *param* argument
    //If required it can be wrapped with inline ValidateStep function
    Validate: function (proceed/*, param*/) {
        var valid = this.$validator ? this.$validator.validate() : true;
        proceed(valid && !this.$errorInfo.HasErrors/*, param*/);
    },

    GetErrorMessage: function (error, data) {
        return data.Message || Resource.Exception.Unknown;
    }
});

Foundation.Controls.Validation.PopupControl = Foundation.Controls.Layout.PopupControl.extend({
    ctor: function (options) {
        Foundation.Controls.Control.prototype.ctor.call(this, options);
        this.$errorInfo = new Model.EntityValidation.DataErrorInfo(this);
    },

    RequiresAuthentication: function () {
        return true;
    },

    Initialize: function (options) {
        Foundation.Controls.Layout.PopupControl.prototype.Initialize.call(this, options);
        var $this = this;
        if (this.ValidatorOptions) {
            this.$validator = new Foundation.Validator(this, { form: this.$container.find('form') });
        }
        //Moved to Foundation.Controls.Layout.PopupControl.Initialize (for Controls.Image.Add)
        //this.$errorContainer = this.$container.find('#error');
        //this.$submit = this.$container.find('#submit');

        this.$container.keypress(function (e) {
            if (e.keyCode == 13) {
                //http://stackoverflow.com/questions/5301643/how-can-i-make-event-srcelement-work-in-firefox-and-what-does-it-mean
                var elem = $(e.target || e.srcElement); // event.originalEvent.target || event.originalEvent.srcElement
                if (elem.is('textarea')) {
                    if (elem.hasClass('textWrap')) {
                        $this.submit_Click();
                        return false; //e.preventDefault();
                    }
                }
                else if (!elem.hasClass('rte-wysiwyg')) {
                    $this.submit_Click();
                    return false; //e.preventDefault();
                }
            }
        });

        /*this.$submit.click(function () {
        if (getDisabled($this.$submit))
        return false;
        if (!$this.RequiresAuthentication() || Session.User.Id > 0) {
        $this.$errorInfo.Clear();
        $this.Validate(function (valid) {
        if (valid) {
        setDisabled($this.$submit, true);
        try {
        $this.OnSubmit();
        }
        catch (ex) {
        $this.Invalidate(ex);
        }
        }
        });
        }
        else
        $this.Invalidate(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
        return false;
        });*/
    },

    submit_Click: function () {
        if (!getDisabled(this.$submit)) {
            this.$submit.focus();
            this.$submit.click();
        }
    },

    onCommand: function (command, data, elem) {
        switch (command) {
            case "Submit":
                if (getDisabled(this.$submit))
                    return false;
                if (!this.RequiresAuthentication() || Session.User.Id > 0) {
                    this.$errorInfo.Clear();
                    var $this = this;
                    this.Validate(function (valid) {
                        if (valid) {
                            setDisabled($this.$submit, true);
                            try {
                                $this.OnSubmit();
                            }
                            catch (ex) {
                                $this.Invalidate(ex);
                            }
                        }
                    });
                }
                else
                    this.Invalidate(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                break;
            default:
                Foundation.Controls.Layout.PopupControl.prototype.onCommand.call(this, command, data, elem);
        }
    },

    Show: function () {
        if (!this.$container) {
            this.Initialize({ tmplData: {} });
        }

        this.$errorInfo.Clear();
        if (this.$validator) {
            $('label.errorLabel', this.$container).removeClass('errorLabel');
            $('[data-error]', this.$container).unbind('mouseenter').unbind('mouseleave').removeAttr('data-error').removeClass('error');
        }
        Foundation.Controls.Layout.PopupControl.prototype.Show.call(this);
    },

    SubmitComplete: function (notifyExternal) {
        if (notifyExternal && this.Submit)
            this.Submit();
        setDisabled(this.$submit, false);
        this.Hide();
    },

    Invalidate: function (ex) {
        var message = this.GetErrorMessage(ex.ErrorMessageType || Foundation.ErrorMessageType.Unknown, ex);
        this.$errorInfo.SetError('', message);
        setDisabled(this.$submit, false);
        if (this.Resized) //layout the modal popup
            this.Resized();
    },

    GetErrorMessage: function (error, data) {
        var errMessage;
        if (this.Error) //TODO: replace with GetErrorMessage_Ctrl override
            errMessage = this.Error(error, data);
        return errMessage || Page.GetErrorMessage_Ctrl(error, data, this);
    },

    //Validator doesn't seem to handle forms with duplicate element ids well
    //Using .element() for duplicates won't work unless specify selector context (prior to call or in validator.clean: return $(selector, this.currentForm)[0])
    //After call to .showErrors(errors) last validated invalid duplicate element(s) will loose highlighting
    //Using .form() with predefined rules for all fields to validate form at once seems to work
    //Validate: function (prop) {
    //    //if (!this.$validator.element($('#' + prop, this.$container))) {
    //    if (!this.$validator.element('#' + prop)) {
    //        return false;
    //    }
    //    else
    //        return true;
    //}
    Validate: function (proceed) {
        var valid = this.$validator ? this.$validator.validate() : true;
        proceed(valid && !this.$errorInfo.HasErrors);
    },

    Closing: function () {
        setDisabled(this.$submit, false);
        return Foundation.Controls.Layout.PopupControl.prototype.Closing.call(this);
    }
});

Foundation.Controls.Validation.MultiValidator = Class.extend({
    ctor: function (proceed) {
        this.$steps = 0;
        this.$valid = true;
        this.$proceed = proceed;
        this.$validators = [];
    },

    Valid: function () {
        return this.$valid ? true : false;
    },

    Invalidate: function () {
        this.$valid = false;
    },

    AddStep: function (validator) {
        this.$validators.push(validator);
    },

    HasSteps: function () {
        return this.$validators.length > 0 ? true : false;
    },

    Execute: function () {
        if (this.HasSteps()) {
            var step = 1;
            var size = this.$validators.length;
            if (size > 0) {
                for (var i = 1, l = size; i <= l; i++) {
                    this.$steps |= step;
                    step *= 2;
                }
            }
            step = 1;
            var $this = this;
            for (var i = 0, l = this.$validators.length; i < l; i++) {
                var validator = this.$validators[i];
                validator(function (valid, param) {
                    if ($this.$valid && !valid)
                        $this.$valid = false;

                    $this.$steps &= ~param;
                    if ($this.$steps == 0) {
                        $this.$proceed($this.$valid);
                    }
                }, step);

                step *= 2;
            }
        }
        else
            this.$proceed(this.$valid);
    }
});

Foundation.ValueConverter = {
    //http://blog.stevenlevithan.com/archives/date-time-format
    DateFormatter: (function () {
        var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var func = function (date) {
            if (date) {
                var today = new Date();

                if (date.getFullYear() == today.getFullYear()) {
                    if (date.getMonth() == today.getMonth() && date.getDate() == today.getDate()) {
                        var hours = date.getHours();
                        var ap = hours < 12 ? "AM" : "PM";
                        hours = hours % 12 || 12;
                        var minutes = date.getMinutes();
                        return hours + ':' + (minutes >= 10 ? minutes : '0' + minutes) + ' ' + ap;
                    }
                    else
                        return month[date.getMonth()] + ' ' + date.getDate();
                }
                else
                    return month[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear().toString().slice(2);
            }
        };
        return func;
    })(),

    Visibility: {
        FromString: function (value) {
            if (String.isNullOrWhiteSpace(value))
                return false;
            return true;
        },

        /*FromString: function (value) {
            if (String.isNullOrWhiteSpace(value))
                return 'none';
            //returning undefined or '' will remove the attr - does not work as of commit 44
        },*/

        FromBool: function (value, param) {
            if (param && param == '!')
                value = !value;
            return value;
        }

        /*FromBool: function (value, param) {
            if (param && param == '!')
                value = !value;
            if (value === false)
                return 'none';
            //returning undefined or '' will remove the attr - does not work as of commit 44
        }*/
    },

    Disabled: {
        FromBool: function (value, param) {
            if (param && param == '!')
                value = !value;
            if (value === false)
                return 'disabled';

            //returning undefined or '' will remove the attr
        }
    },

    ConfirmText: {
        SentenceBuilder: function (content, format) {
            var args = content.ToArray();
            if (args)
                for (var i = 0, l = args.length; i < l; i++)
                    args[i] = '<b>' + args[i] + '</b>';
            return String.format(format, args);
        }
    },

    CSS: {
        Class: {
            FromBool: function (value, trueClass, falseClass) {
                if (value === true)
                    return trueClass;
                else
                    return falseClass;
            }
        }
    }
};

System.Type.RegisterNamespace('Foundation.Controls.Popup');
Foundation.Controls.Popup.FormBase = Foundation.Controls.Validation.PopupControl.extend({
    RequiresAuthentication: function () {
        return false;
    },

    OnSubmit: function () {
        if (this.Submit) {
            this.Submit();
        }
        else
            this.SubmitComplete();
    }
});

System.Type.RegisterNamespace('Foundation.Controls.Confirm');
Foundation.Controls.Confirm.Form = Foundation.Controls.Popup.FormBase.extend({
    Template: jQuery.templates(
    '<form action="">' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr>' +
                    '<td id="content" colspan="2"></td>' + //could use a nested template here
                '</tr>' +
                '{{if ~OptionTemplate}}' +
                    '<tr><td style="padding-top:15px;">{{:~OptionTemplate}}</td></tr>' +
                '{{/if}}' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel right">' +
            '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Yes + '</span></a>' +
            '&nbsp;&nbsp;' +
            '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>' +
    '</form>'
    ),

    ctor: function (content) {
        if (content && content.ValidatorOptions)
            this.ValidatorOptions = content.ValidatorOptions;
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this);
        this.Content = content || new Foundation.Controls.Confirm.Form.AttributeCollection();
    },

    ContentTemplate: jQuery.templates('<span>{{:~ConfirmSentenceBuilder(#data, ~MessageFormat)}}</span>'),

    MessageFormat: Resource.Global.Are_you_sure,

    Initialize: function (options) {
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, {
            tmplData: {},
            tmplOptions: { OptionTemplate: this.OptionTemplate }
        }));
        this.$contentContainer = $('#content', this.$container);
        if (typeof this.ContentTemplate == "string")
            this.$contentContainer.append(this.ContentTemplate);
    },

    Show: function () {
        Foundation.Controls.Validation.PopupControl.prototype.Show.call(this);
        if (typeof this.ContentTemplate != "string")
            this.$contentContainer.empty().append(this.ContentTemplate.render(this.Content, { ConfirmSentenceBuilder: Foundation.ValueConverter.ConfirmText.SentenceBuilder, MessageFormat: this.MessageFormat }));
        if (this.OptionChecked) {
            this.OptionChecked(false);
        }
        if (this.Resized) //layout the modal popup
            this.Resized();
    },

    CommandText: TemplateProperty('CommandText', function () {
        return $('#submit > span', this.$container).first().text();
    }, function (commandText) {
        $('#submit > span', this.$container).first().text(commandText);
    }),

    OptionText: function (optionText) {
        if (!String.isNullOrWhiteSpace(optionText)) {
            this.OptionTemplate = '<input type="checkbox" id="option" name="option" />&nbsp;' + optionText;
            this.OptionChecked = function (optionChecked) {
                if (this.$container) {
                    if (optionChecked != undefined) {
                        if (optionChecked)
                            $('#option', this.$container).prop('checked', true);
                        else
                            $('#option', this.$container).prop('checked', false);
                    }
                    else
                        return $('#option', this.$container).prop('checked') ? true : false;
                }
            }
        }
    }
});

Foundation.Controls.Confirm.Form.AttributeCollection = Class.define({
    ToArray: function () {
        var a = [];
        for (var i in this)
            if (typeof this[i] !== 'function')
                a.push(this[i]);
        return a;
    }
});

System.Type.RegisterNamespace('Foundation.Controls.Location');
Foundation.Controls.Location.TextBox = Foundation.Controls.Validation.Control.extend({
    Container: '<form action=""></form>',

    Template: '<table><tr style="vertical-align:top;">' +
                '<td>' +
                    '<input type="text" id="location" name="location" style="margin-top:0px;min-width:500px;" placeholder="' + Resource.Global.Address_or_Postal_code + '" />' +
                '</td>' +
                '<td>' +
                    '<a class="form-button active" id="map" style="margin-left:5px;" data-command="Map" title="' + Resource.Action.Lookup + '"><span class="button-content">' + Resource.Action.Map + '</span></a>' +
                '</td>' +
            '</tr></table>',

    Enabled: function (enabled) {
        if (enabled != undefined) {
            setDisabled($('#location', this.$container), enabled ? false : true);
            setDisabled($('#map', this.$container), enabled ? false : true);
        }
        else
            return getDisabled($('#location', this.$container));
    },

    ValidatorOptions: {
        rules: {
            location: "validateLocation"
        }
    },

    ctor: function (formMaster) {
        Foundation.Controls.Validation.Control.prototype.ctor.call(this, formMaster);
        this.Requirement = Model.Address.Requirement.None;
    },

    Initialize: function (container) {
        Foundation.Controls.Validation.Control.prototype.Initialize.call(this, container, this.Template ? { tmplData: {} } : null);
        var $this = this;
        Foundation.Validator.addMethod("validateLocation", function (value, element) {
            //Error should have alredy been shown by $errorInfo.SetError
            return $this.$errorInfo._errors['location'] || true;
        });

        var locationElem = $('#location', this.$container);
        if (window['google']) {
            //https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete?csw=1
            var autocomplete = new google.maps.places.Autocomplete(locationElem[0], { types: ['geocode'] });
            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                var place = autocomplete.getPlace();
                if (place) {
                    $this.FromGeocoder(Service.Geocoder.Parse(place));
                }
            });
        }

        //change is also raised by changing it to Formatted Address returned by geocoder
        locationElem.change(function (e) {
            if ($this.Geocoded && $this.Geocoded.Text != locationElem.val()) {
                delete $this.Geocoded;
                if ($this.Geolocation)
                    delete $this.Geolocation;
            }
        });

        Geocoder.callback = function (data) {
            try {
                $this.FromGeocoder(JSON.parse(data));
            }
            catch (e) {
                console.error(errorMessage(e));
            }
        };
    },

    FromGeocoder: function (geocoded) {
        if (!$.isEmptyObject(geocoded) && geocoded.Text && geocoded.Geolocation) {
            this.setText(geocoded.Text);
            this.Geocoded = geocoded;
        }
        else
            this.resetGeocoded();
    },

    resetGeocoded: function () {
        if (this.Geocoded)
            delete this.Geocoded;
    },

    Text: function (location) {
        if (location != undefined) {
            this.setText(location);
            this.resetGeocoded();
        }
        else
            return $('#location', this.$container).val();
    },

    setText: function (location) {
        $('#location', this.$container).val(location);
    },

    Map: function (location) {
        location = this.Text();
        if (!String.isNullOrWhiteSpace(location))
            Foundation.Controls.Geocoder.ShowMap(Foundation.Controls.Geocoder.MapType.Entry, JSON.stringify({ Text: location }));
    },

    Validate: function (proceed) {
        var valid = true;
        var location = this.Text();
        if (!String.isNullOrWhiteSpace(location)) {
            if (!this.Geocoded || !this.Geocoded.Geolocation) {
                var $this = this;
                Service.Geocoder.Geocode(location, function (geocoded) {
                    $this.FromGeocoder(geocoded, true);
                    $this.ValidateGeocoded(proceed);
                }, function (errorMessage) {
                    $this.$errorInfo.SetError('location', errorMessage);
                    proceed(false);
                });
                return;
            }
            else if (!this.Geolocation) {
                this.ValidateGeocoded(proceed);
                return;
            }
        }
        else if (this.Requirement != Model.Address.Requirement.None) {
            valid = false;
            this.$errorInfo.SetError('location', String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Location));
        }
        proceed((this._formMaster || !this.$errorInfo.HasErrors) && valid); //if $errorInfo is shared it may contain other errors
    },

    ValidateGeocoded: function (proceed) {
        var geocoded = this.Geocoded;
        if (!$.isEmptyObject(this.Geocoded)) {
            var valid = true;
            //this.Text(geocoded.Text);
            if (geocoded.Address && !String.isNullOrEmpty(geocoded.Address.Country)) {
                //State and County may not get populated (London, UK)
                if (!String.isNullOrEmpty(geocoded.Address.City)/* && !String.isNullOrEmpty(geocoded.Address.State)*/) {
                    if (!String.isNullOrEmpty(geocoded.Address.PostalCode)) {
                        if (this.Requirement > Model.Address.Requirement.PostalCode && (String.isNullOrEmpty(geocoded.Address.StreetName) || String.isNullOrEmpty(geocoded.Address.StreetNumber)))
                            valid = false;
                    }
                    else if (this.Requirement > Model.Address.Requirement.City)
                        valid = false;
                }
                else if (this.Requirement > Model.Address.Requirement.Country)
                    valid = false;
            }
            else if (this.Requirement != Model.Address.Requirement.None)
                valid = false;

            if (!valid) {
                var text = '';
                switch (this.Requirement) {
                    case Model.Address.Requirement.Country:
                        text = Resource.Dictionary.Country;
                        break;
                    case Model.Address.Requirement.City:
                        text = Resource.Dictionary.City;
                        break;
                    case Model.Address.Requirement.PostalCode:
                        text = Resource.Dictionary.Postal_code;
                        break;
                    case Model.Address.Requirement.StreetAddress:
                        text = Resource.Dictionary.Street_address;
                        break;
                }
                if (text)
                    this.$errorInfo.SetError('location', String.format(Resource.Global.Location_Error_X, text));
                else
                    this.$errorInfo.SetError('location', String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Location));
            }
            else
                this.Geolocation = geocoded.Geolocation;

            proceed((this._formMaster || !this.$errorInfo.HasErrors) && valid); //if $errorInfo is shared it may contain other errors
        }
    }
});

Foundation.Controls.Location.Edit = Foundation.Controls.Location.TextBox.extend({
    Populate: function (address) {
        if (address && address.Location) {
            var $this = this;
            User.Service.Master.Location.PopulateWithPath(address.Location, address.Street || undefined, function (location_) {
                $this.populate(address, location_);
            }, function (ex) {
                $this.$errorInfo.SetError('location', $this.GetErrorMessage(ex.ErrorMessageType, ex));
            });
        }
    },

    populate: function (address, location_) {
        this.Address(address);
        var geocoded = {
            Address: {}
        };
        while (location_) {
            switch (location_.Type) {
                case Model.LocationType.Country:
                    geocoded.Address.Country = location_.Name;
                    break;
                case Model.LocationType.State:
                    geocoded.Address.State = location_.Name;
                    break;
                case Model.LocationType.County:
                    geocoded.Address.County = location_.Name;
                    break;
                case Model.LocationType.City:
                    geocoded.Address.City = location_.Name;
                    break;
                case Model.LocationType.Street:
                    geocoded.Address.StreetName = location_.Name;
                    if (address.StreetNumber)
                        geocoded.Address.StreetNumber = address.StreetNumber
                    break;
            }
            location_ = location_.Parent;
        }
        if (address.PostalCode)
            geocoded.Address.PostalCode = address.PostalCode
        if (address.Address1)
            geocoded.Address.Address1 = address.Address1

        if (address.Lat != 0 && address.Lng != 0) {
            geocoded.Geolocation = {
                Lat: address.Lat,
                Lng: address.Lng
            }
            this.Geolocation = geocoded.Geolocation;
        }
        this.Geocoded = geocoded;
        //Resolve to fire Changed event with country and set $selected
        this.Resolve(null, true, true); //this.$selected = geocoded.Address;

        var address1 = $('#address1', this.$container);
        var postalCode = $('#postalCode', this.$container);
        var text = Service.Geocoder.Stringify(geocoded.Address, address1.length ? true : false);
        if (!String.isNullOrWhiteSpace(text)) {
            this.setText(text); //Do not reset Geocoded
            if (!String.isNullOrWhiteSpace(geocoded.Address.Address1))
                address1.val(geocoded.Address.Address1);
            if (!String.isNullOrWhiteSpace(geocoded.Address.PostalCode))
                postalCode.val(geocoded.Address.PostalCode);
        }
    },

    FromGeocoder: function (geocoded, supressResolve) {
        if (!$.isEmptyObject(geocoded) && geocoded.Address) {
            var addr1Container = $('#address1', this.$container);
            var addr1Value = addr1Container.val();
            if (geocoded.Address.Address1)
                addr1Container.val(geocoded.Address.Address1);
            else if (addr1Value)
                geocoded.Address.Address1 = addr1Value;

            var postalCodeContainer = $('#postalCode', this.$container);
            var postalCodeValue = postalCodeContainer.val();
            if (geocoded.Address.PostalCode)
                postalCodeContainer.val(geocoded.Address.PostalCode);
            else if (postalCodeValue)
                geocoded.Address.PostalCode = postalCodeValue;
        }
        Foundation.Controls.Location.TextBox.prototype.FromGeocoder.call(this, geocoded);

        if (!supressResolve)
            this.Resolve();
    },
    
    Validate: function (proceed) {
        var $this = this;
        Foundation.Controls.Location.TextBox.prototype.Validate.call(this, function (valid) {
            if (valid) {
                var address1 = $('#address1', $this.$container);
                if (address1.length) {
                    address1 = address1.val();
                    $this.Geocoded.Address.Address1 = address1;
                    if ($this.$address && $this.$address.Address1 != address1)
                        $this.$address.Address1 = address1;
                }
                var postalCode = $('#postalCode', $this.$container);
                if (postalCode.length) {
                    postalCode = postalCode.val();
                    $this.Geocoded.Address.PostalCode = postalCode;
                    if ($this.$address && $this.$address.PostalCode != postalCode)
                        $this.$address.PostalCode = postalCode;
                }
            }
            proceed(valid);
        });
    },

    resetGeocoded: function () {
        Foundation.Controls.Location.TextBox.prototype.resetGeocoded.call(this);
        if (this.$address)
            delete this.$address;
        if (this.$selected)
            delete this.$selected;
    },

    Address: function (address) {
        if (address != undefined) {
            this.$address = address;
        }
        else
            return this.$address;
    },

    //Account.Create
    //User.Data.Master.Location.Resolve
    Resolve: function (callback, raiseChanged, suppressCreate) {
        var geocoded = this.Geocoded;
        if (geocoded && geocoded.Address && geocoded.Address.Country) {
            var match = Model.Geocoder.Address.EqualsTo.call(geocoded.Address, this.$selected);
            if (!this.$address || !match || raiseChanged) {
                if (!match && this.$address)
                    delete this.$address;
                if (!match && this.$selected)
                    delete this.$selected;
                var city = { Country: geocoded.Address.Country };
                //State and County may not get populated (London, UK)
                if (geocoded.Address.State) {
                    city.State = geocoded.Address.State;
                    //if (geocoded.Address.City)
                    //    city.Name = geocoded.Address.City;
                }
                if (geocoded.Address.County)
                    city.County = geocoded.Address.County;
                if (geocoded.Address.City)
                    city.Name = geocoded.Address.City;
                var $this = this;
                var street = geocoded.Address.StreetName ? { Name: geocoded.Address.StreetName } : null;
                User.Service.Master.Location.Resolve(city, street, suppressCreate ? false : true, function (location_) {
                    if (location_ && location_.Id > 0) {
                        var address = {};
                        if (location_.Type == Model.LocationType.Street) {
                            address.Location = location_.Parent.Id;
                            address.Street = location_.Id;
                            if (geocoded.Address.StreetNumber)
                                address.StreetNumber = geocoded.Address.StreetNumber;
                        }
                        else
                            address.Location = location_.Id;
                        if (geocoded.Address.PostalCode)
                            address.PostalCode = geocoded.Address.PostalCode;
                        if (geocoded.Address.StreetNumber)
                            address.StreetNumber = geocoded.Address.StreetNumber;
                        if (geocoded.Address.Address1)
                            address.Address1 = geocoded.Address.Address1;
                        if (geocoded.Geolocation) {
                            address.Lat = geocoded.Geolocation.Lat;
                            address.Lng = geocoded.Geolocation.Lng;
                        }
                        if (!match || !$this.$address)
                            $this.Address(address);
                        if (!match || !$this.$selected)
                            $this.$selected = geocoded.Address;
                        if ($this.Changed) {
                            //Use RequireCounty at State level - not currenly needed
                            var country = Model.Location.Country.call(location_);
                            if (country) {
                                $this.Changed(country);
                            }
                        }
                    }
                    if (callback)
                        callback(true);
                }, function (ex) {
                    $this.$errorInfo.SetError('location', $this.GetErrorMessage(ex.ErrorMessageType, ex));
                    if (callback)
                        callback();
                });
                return;
            }
            else if (this.$address) {
                if (this.$address.PostalCode != geocoded.Address.PostalCode)
                    this.$address.PostalCode = geocoded.Address.PostalCode;
                if (this.$address.StreetNumber != geocoded.Address.StreetNumber)
                    this.$address.StreetNumber = geocoded.Address.StreetNumber;
                if (this.$address.Address1 != geocoded.Address.Address1)
                    this.$address.Address1 = geocoded.Address.Address1;
                if (geocoded.Geolocation) {
                    if ((this.$address.Lat != geocoded.Geolocation.Lat || this.$address.Lng != geocoded.Geolocation.Lng)) {
                        this.$address.Lat = geocoded.Geolocation.Lat;
                        this.$address.Lng = geocoded.Geolocation.Lng;
                    }
                }
                else {
                    if (this.$address.Lat != 0)
                        delete this.$address.Lat;
                    if (this.$address.Lng != 0)
                        delete this.$address.Lng;
                }
            }
        }
        else {
            if (this.$address)
                delete this.$address;
            if (this.$selected)
                delete this.$selected;
        }
        if (callback)
            callback(this.$address ? true : false);
    }
});