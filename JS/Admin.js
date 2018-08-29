Controls.Product.Edit = Foundation.Controls.Validation.Control.extend({
    Container: '<form action=""></form>',

    Template: '<table class="form center">' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;"><label for="type">' + Resource.Dictionary.Type + '</label></td>' +
                    '<td class="value" id="typePlaceholder"></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;"><label for="price">' + Resource.Dictionary.Price + '</label></td>' +
                    '<td class="value" id="pricePlaceholder"></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;"><label for="attributes">' + Resource.Dictionary.Attributes + '</label></td>' +
                    '<td class="value" id="attributesPlaceholder"></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;"><label for="title">' + Resource.Dictionary.Title + '</label></td>' +
                    '<td class="value">' +
                        '<textarea id="title" name="title" class="textWrap" cols="47" rows="2"></textarea>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;"><label for="richText">' + Resource.Dictionary.Description + '</label></td>' +
                    '<td id="rtePlaceholder">' +
                        '<textarea id="richText" name="richText" style="display:none;"></textarea>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;">' + Resource.Dictionary.Images + '</td>' +
                    '<td class="value" id="imagesPlaceholder"></td>' +
                '</tr>' +
    '</tr></table>',

    Title: function (title) {
        if (title != undefined) {
            $('#title', this.$container).val(title);
        }
        else
            return $('#title', this.$container).val();
    },

    RichText: function (richText) {
        if (richText != undefined) {
            this.richTextEditor.Html(richText);
        }
        else
            return this.richTextEditor.Html();
    },

    EnabledAttributes: function (enabledAttributes) {
        this.attributes.Enabled(enabledAttributes);
    },

    ProductConfig: function (productConfig) {
        this.type.ProductConfig(productConfig);
        this.attributes.ProductConfig(productConfig);
    },

    LocationSettings: function (locationSettings) {
        this.price.LocationSettings(locationSettings);
    },

    Enabled: function (enabled) {
        if (enabled != undefined) {
            this.$enabled = enabled;
            //setDisabled($('#', this.$container), enabled ? false : true);
        }
        else
            return this.$enabled;
    },

    ValidatorOptions: {
        rules: {
            title: {
                required: true,
                maxlength: 250
            },
            richText: "validateText" //required
        },

        messages: {
            title: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Title),
            richText: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Description)
        },

        ignore: '' //to validate hidden text textarea
    },

    validationElement: function (elementName) {
        switch (elementName) {
            case "richText":
                return this.richTextEditor.$container;
            case "type":
                return this.type.$productType;
            /*case "side":
                return this.type.$productSide;*/
        }
    },

    ctor: function (formMaster) {
        Foundation.Controls.Validation.Control.prototype.ctor.call(this, formMaster);
        this.type = new Controls.Product.Type(formMaster || this);
        this.price = new Controls.Product.Price(formMaster || this);
        this.attributes = new Controls.Product.Attribute.Edit(formMaster || this);
        this.richTextEditor = new Foundation.Controls.RichText.Editor();
        Foundation.Validator.addMethod("validateText", function (value, element) {
            return !String.isNullOrWhiteSpace(value);
        });
        this.images = new Controls.Image.Edit();
    },

    Initialize: function (container, options) {
        Foundation.Controls.Validation.Control.prototype.Initialize.call(this, container, $.extend(options || {}, { tmplData: {} }));
        this.type.Initialize($("#typePlaceholder", this.$container));
        this.price.Initialize($("#pricePlaceholder", this.$container));
        this.attributes.Initialize($("#attributesPlaceholder", this.$container));
        this.richTextEditor.Initialize($("#rtePlaceholder", this.$container), { width: 500, height: 200 });
        this.richTextEditor.Show({
            //zIndex: this._popupContainer.zIndex
        });
        this.images.Initialize($("#imagesPlaceholder", this.$container));
    },

    ValidationSteps: function (ctx) {
        var $this = this;
        var mv = ctx.MultiValidator();
        mv.AddStep(jQuery.proxy(this.ValidateStep, this));
        //Type, Price and Attributes do not derive from Foundation.Controls.Validation.Control for simplicity
        mv.AddStep(function (proceed_, typeParam) { //Product.Type doesn't extend Validation.Control
            $this.type.Validate(function (typeValid) {
                if (!typeValid)
                    $('label[for=type]', $this.$container).addClass('errorLabel');
                proceed_(typeValid, typeParam);
            });
        });
        mv.AddStep(function (proceed_, priceParam) { //Product.Price doesn't extend Validation.Control
            $this.price.Validate(function (priceValid) { 
                if (!priceValid)
                    $('label[for=price]', $this.$container).addClass('errorLabel');
                proceed_(priceValid, priceParam);
            });
        });
        mv.AddStep(function (proceed_, attributesParam) { //Product.Attribute.Edit doesn't extend Validation.Control
            $this.attributes.Validate(function (attributesValid) {
                if (!attributesValid) //just to highlight the Attributes label, the actual message will not be displayed
                    $('label[for=attributes]', $this.$container).addClass('errorLabel'); //$this.$errorInfo.SetError('attributes', Resource.Product.Edit_Error_Attributes);
                proceed_(attributesValid, attributesParam);
            });
        });
    },

    Validate: function (proceed) {
        $('label[for=type]', this.$container).removeClass('errorLabel');
        $('label[for=price]', this.$container).removeClass('errorLabel');
        $('label[for=attributes]', this.$container).removeClass('errorLabel');

        this.product.Master.Title = this.Title();
        this.$validator.validate('title');
        var htmlText = this.richTextEditor.HtmlText();
        $('#richText', this.$container).val(htmlText.text);
        this.product.Master.RichText = htmlText.html;
        this.$validator.validate('richText');

        proceed(!this.$errorInfo.HasErrors);
    },

    Populate: function (product, productConfig) {
        this.product = product;
        this.type.populate(product, productConfig);
        this.price.populate(product);
        if (product.Master.Title)
            this.Title(product.Master.Title);
        if (product.Master.RichText)
            this.RichText(product.Master.RichText);
        this.attributes.populate(product.Attributes, productConfig);
        this.images.populate(product.Images);
    }
});

Controls.Product.Type = Class.define({
    Container: '<table><tr><td id="productType"></td></tr>' /*+ '<tr><td id="productSide"></td></tr>'*/ + '</table>',

    TypeTemplate: jQuery.templates('<input type="radio" name="type" value="{{:ItemKey}}" data-itemIndex="{{:#index}}"{{if ItemKey == ~selectedType}} checked{{/if}}>{{:ItemText}}</input>'),
    SideTemplate: jQuery.templates('<input type="radio" name="side" value="{{:ItemKey}}" data-itemIndex="{{:#index}}"{{if ItemKey == ~selectedSide}} checked{{/if}}>{{:ItemText}}</input>'),

    ctor: function (formMaster) {
        this._formMaster = formMaster;
        if (formMaster && formMaster.$errorInfo) {
            this._formMaster = formMaster;
            this.$errorInfo = formMaster.$errorInfo;
            if (formMaster.ValidatorOptions && this.ValidatorOptions)
                formMaster.ValidatorOptions = $.extend(formMaster.ValidatorOptions, this.ValidatorOptions);
        }
    },

    Initialize: function (container) {
        this.$container = $(this.Container);
        this.$container.appendTo(container);
        this.$productType = $('#productType', this.$container);
        //this.$productSide = $('#productSide', this.$container);
    },

    ProductConfig: function (productConfig) {
        this.populate(this.product, productConfig);
    },

    populate: function (product, productConfig) {
        var $this = this;
        this.product = product;
        this.productConfig = productConfig;
        if (this.product && this.productConfig) {
            User.Service.Master.Dictionary.Get(Model.DictionaryType.ProductType, function (types) {
                $this.types = jQuery.map(types, function (t) {
                    if (($this.productConfig.Type & t.ItemKey) > 0)
                        return t; //{ Id: t.Id, Text: t.Text }
                });

                var selectedType = -1;
                if ($this.product.Id > 0) {
                    for (var i = 0, l = $this.types.length; i < l; i++) {
                        if ($this.types[i].ItemKey == $this.product.Master.Type) {
                            selectedType = $this.types[i].ItemKey;
                            break;
                        }
                    }
                }

                $this.$productType.empty().append($this.TypeTemplate.render($this.types, { selectedType: selectedType }));
            });

            User.Service.Master.Dictionary.Get(Model.DictionaryType.ProductSide, function (sides) {
                $this.sides = jQuery.map(sides, function (s) {
                    if (($this.productConfig.Side & s.ItemKey) > 0)
                        return s; //{ Id: s.Id, Text: s.Text }
                });

                var selectedSide = -1;
                if ($this.product.Id > 0) {
                    for (var i = 0, l = $this.sides.length; i < l; i++) {
                        if ($this.sides[i].ItemKey == $this.product.Side) {
                            selectedSide = $this.sides[i].ItemKey;
                            break;
                        }
                    }
                }

                //$this.$productSide.empty().append($this.SideTemplate.render($this.sides, { selectedSide: selectedSide }));
            });

            delete Page._tabbable;
        }
    },

    Validate: function (proceed) {
        var valid = true;
        //var typeIndex = $('input[type="radio"]:checked', this.$productType).attr('data-itemIndex');
        //var type = typeIndex ? this.types[typeIndex] : null;
        var type = parseInt($('input[type="radio"]:checked', this.$productType).val());
        if (!type) {
            valid = false;
            this.$errorInfo.SetError('type', String.format(Resource.Product.Edit_Error_Select_X, Resource.Dictionary.Type));
        }
        else if (this.product.Master.Type != type/*.Id*/)
            this.product.Master.Type = type/*.Id*/;

        /*var side = parseInt($('input[type="radio"]:checked', this.$productSide).val());
        if (!side) {
            valid = false;
            this.$errorInfo.SetError('side', String.format(Resource.Product.Edit_Error_Select_X, Resource.Dictionary.Side));
        }
        else if (this.product.Side != side)
            this.product.Side = side;*/

        proceed(valid);
    }
});

Controls.Product.Price = Class.define({
    Container: '<select id="priceType" name="priceType" style="width:120px"></select>' +
               '<span style="display:none; padding-left:3px;"><input type="text" id="priceValue" name="priceValue" style="width:80px"/><select id="currency" name="currency" style="width:60px; margin-left:3px;" disabled></select></span>', //&nbsp;

    PriceTypeTemplate: jQuery.templates('<option value="{{:ItemKey}}">{{:ItemText}}</option>'),
    CurrencyTemplate: jQuery.templates('<option value="{{:ItemKey}}">{{:ItemText}}</option>'),

    ctor: function (formMaster) {
        this._formMaster = formMaster;
        if (formMaster && formMaster.$errorInfo) {
            this._formMaster = formMaster;
            this.$errorInfo = formMaster.$errorInfo;
            if (formMaster.ValidatorOptions && this.ValidatorOptions)
                formMaster.ValidatorOptions = $.extend(formMaster.ValidatorOptions, this.ValidatorOptions);
        }
    },

    Initialize: function (container) {
        this.$container = container;
        this.$container.append(this.Container);
        this.$priceType = $('#priceType', this.$container);
        this.$priceValue = $('#priceValue', this.$container);
        this.$currency = $('#currency', this.$container);
        var $this = this;
        this.$priceType.change(function () {
            $this.ensurePriceVisibility();
        });
        if (!(this.currencies && this.currencies.Length)) {
            User.Service.Master.Dictionary.Get(Model.DictionaryType.Currency, function (currencies) {
                $this.currencies = currencies;
                $this.$currency.empty().append($this.CurrencyTemplate.render(currencies));
                $this.setCurrency();
            });
        };
    },

    LocationSettings: function (locationSettings) {
        this.locationSettings = locationSettings;
        if (this.locationSettings && this.locationSettings.Currency) {
            setDisabled(this.$currency, true);
            if (this.product && this.product.Price.Currency != this.locationSettings.Currency) {
                this.product.Price.Currency = this.locationSettings.Currency;
                this.setCurrency();
            }
        }
        else
            setDisabled(this.$currency, false);
    },

    ensurePriceVisibility: function () {
        var selectedIndex = this.$priceType.prop('selectedIndex');
        if (selectedIndex >= 0) {
            var priceType = this.priceTypes[selectedIndex];
            if (priceType && priceType.ValueOption == Model.Product.PriceType.ValueOptionType.NotApplicable)
                this.$priceValue.parent('span').hide();
            else
                this.$priceValue.parent('span').show();
        }
    },

    setCurrency: function () {
        if (this.currencies && this.currencies.length && this.product && this.product.Price && this.product.Price.Currency) {
            for (var i = 0, l = this.currencies.length; i < l; i++) {
                if (this.currencies[i].ItemKey == this.product.Price.Currency) {
                    this.$currency.prop('selectedIndex', i);
                    return;
                }
                this.$currency.prop('selectedIndex', 0);
            }
        }
        this.$currency.prop('selectedIndex', -1);
    },

    populate: function (product) {
        this.product = product;
        if (this.product) {
            this.LocationSettings(this.locationSettings)
            if (this.product.Price.Value) {
                this.$priceValue.val(Model.Product.PriceType.ConvertPrice(this.product.Price.Value));
            }
            this.setCurrency();
            var $this = this;
            User.Service.Master.Dictionary.Get(Model.DictionaryType.ProductPriceType, function (priceTypes) {
                switch ($this.product.Account.AccountType) {
                    case Model.AccountType.Business:
                        $this.priceTypes = jQuery.map(priceTypes, function (pt) {
                            if ((pt.Applicability & Model.AccountType.Business) > 0)
                                return pt;
                        });
                        break;
                    case Model.AccountType.Personal:
                        $this.priceTypes = jQuery.map(priceTypes, function (pt) {
                            if ((pt.Applicability & Model.AccountType.Personal) > 0)
                                return pt;
                        });
                        break;
                }

                $this.$priceType.empty().append($this.PriceTypeTemplate.render($this.priceTypes));
                if ($this.product.Id > 0 && $this.priceTypes.length) {
                    var priceType;
                    for (var i = 0, l = $this.priceTypes.length; i < l; i++) {
                        if ($this.priceTypes[i].ItemKey == $this.product.Price.Type) {
                            $this.$priceType.prop('selectedIndex', i);
                            priceType = $this.priceTypes[i].ItemKey;
                            break;
                        }
                    }
                    if (!priceType) {
                        $this.$priceType.prop('selectedIndex', 0);
                        $this.product.Price.Type = $this.priceTypes[0].ItemKey;
                    }
                }
                else
                    $this.$priceType.prop('selectedIndex', -1);
                $this.ensurePriceVisibility();
            });
        }
    },

    Validate: function (proceed) {
        var priceType;
        var selectedIndex = this.$priceType.prop('selectedIndex');
        if (selectedIndex >= 0) {
            priceType = this.priceTypes[selectedIndex];
            this.product.Price.Type = priceType.ItemKey;
        }
        else
            this.product.Price.Type = 0;

        if (priceType && priceType.ValueOption == Model.Product.PriceType.ValueOptionType.NotApplicable) {
            if (/*this.$priceValue.parent('span').css('display') == 'none' &&*/ this.product.Price.Value != 0)
                this.product.Price.Value = 0;
        }
        else
            this.product.Price.Value = Model.Product.PriceType.ConvertPrice(this.$priceValue.val());

        selectedIndex = this.$currency.prop('selectedIndex');
        if (selectedIndex >= 0 && this.currencies && this.currencies.length > selectedIndex)
            this.product.Price.Currency = this.currencies[selectedIndex].ItemKey;
        else
            this.product.Price.Currency = 0;

        proceed(Admin.Model.Product.Price.Validate.call(this, this.product.Price, { ValueOption: priceType }) ? false : true);
    }
});

System.Type.RegisterNamespace('Controls.Product.Attribute');

Controls.Product.Attribute.EnabledType = {
    None: 0,
    Preset: 1,
    Full: 2
};

Controls.Product.Attribute.EditorSelector = {
    TextBox: jQuery.templates(
        '<input type="text" id="attrValue{{:tempId}}" name="attrValue{{:tempId}}" data-link="Value" style="width:100px;"/>'
    ),

    SelectTemplate: function (arrtbute) {
        switch (arrtbute.EditorType)
        {
            case Model.EditorType.TextBox:
            default:
                return this.TextBox;
        }
    }
};

Controls.Product.Attribute.Edit = Class.define({
    Container: '<table>' +
        '<tr>' +
            '<td><table class="list"><thead><tr>' +
            '<th class="header">' + Resource.Dictionary.Name + '</th>' +
            '<th class="header">' + Resource.Dictionary.Value + '</th>' +
            '<th></th>' +
            '</tr></thead>' +
            '<tbody id="presetAttributes">' +
            '</tbody>' +
            '<tbody id="userAttributes">' +
            '</tbody></table></td>' +
        '</tr>' +
        '<tr>' +
            '<td id="attrError" class="formError" style="display:none;"></td>' +
        '</tr>' +
        '<tr>' +
            '<td>' +
                '<div data-ctrl="Foundation.Controls.Layout.DropDown" data-ctrl-Text="' + Resource.Product.Attribute_Add_new + '"><ul></ul></div>' +
            '</td>' +
        '</tr></table>',

    AttributeTypeTemplate: jQuery.templates(
        '<li data-itemIndex="{{:#index}}">' +
            '<a>{{:Text}}</a>' +
        '</li>'
    ),

    PresetAttributeTemplate: jQuery.templates(
        '<tr>' +
            '<td class="name"><label for="attrValue{{:tempId}}">{{:Name}}</label></td>' +
            '<td class="value">{{for #data tmpl=~Editor.SelectTemplate(#data)/}}</td>' +
            '<td></td>' +
        '</tr>'
    ),

    UserAttributeTemplate: jQuery.templates(
        '<tr>' +
            '<td class="name"><input type="text" id="attrName{{:tempId}}" name="attrName{{:tempId}}" data-link="Name" style="width:100px"/></td>' +
            '<td class="value">{{for #data tmpl=~Editor.SelectTemplate(#data)/}}</td>' +
            '<td class="meta">[<a class="href" data-command="RemoveAttribute">x</a>]</td>' +
        '</tr>'
    ),

    ctor: function (formMaster) {
        this._formMaster = formMaster;
        if (formMaster && formMaster.$errorInfo) {
            this._formMaster = formMaster;
            this.$errorInfo = formMaster.$errorInfo;
            if (formMaster.ValidatorOptions && this.ValidatorOptions)
                formMaster.ValidatorOptions = $.extend(formMaster.ValidatorOptions, this.ValidatorOptions);
        }

        this.$tmpl_properties = [];
        this.Enabled(Controls.Product.Attribute.EnabledType.Preset);

        this.newAttributeDropdown = new Foundation.Controls.Layout.DropDown(this);
        this.newAttributeDropdown.Text(Resource.Product.Attribute_Add_new);
        this.attrCount = 0;
    },

    Initialize: function (container) {
        this.$container = $(this.Container);
        this.$container.appendTo(container);
        this.$presetAttributes = $('#presetAttributes', this.$container);
        this.$userAttributes = $('#userAttributes', this.$container);
        this.$attrError = $('#attrError', this.$container);
        this.newAttributeDropdown.init($('div[data-ctrl]', this.$container));
        this.$attributeType = $('ul', this.newAttributeDropdown.$popup.$container);
        var $this = this;
        this.$attributeType.delegate('a', 'click', function () {
            var elem = $(this);
            var itemIndex = parseInt(elem.parent('li').attr('data-itemIndex'));
            if(itemIndex >= 0) {
                $this.NewAttribute($this.attributeTypes[itemIndex].Type);
            }
            return false;
        });
        this.$userAttributes.delegate('a[data-command]', 'click', function () {
            var elem = $(this);
            var itemIndex = $.view(elem).index;
            var command = elem.attr('data-command');
            if (!isNaN(itemIndex) && itemIndex >= 0) {
                if (command == "RemoveAttribute")
                    $this.RemoveAttribute($this.userAttributes[itemIndex], null, itemIndex);
            }
            return false;
        });
        User.Service.Master.Dictionary.Get(Model.DictionaryType.ProductAttributeType, function (attributeTypes) {
            $this.attributeTypes = [];
            for (var i = 0, l = attributeTypes.length; i < l; i++) {
                for (var pat in Model.Product.Attribute.PrimitiveType) {
                    if (Model.Product.Attribute.PrimitiveType[pat] == attributeTypes[i].ItemKey) {
                        $this.attributeTypes.push({ Type: attributeTypes[i], Text: Resource.Product['Attribute_Type_' + pat] });
                        break;
                    }
                }
            }
            $this.$attributeType.append($this.AttributeTypeTemplate.render(attributeTypes));
        });
        Foundation.Controls.Control.prototype.applyTmplProperties.call(this);
    },

    applyAttributeTemplate: function (container, template, attributes) {
        template.link(container, attributes, { Editor: Controls.Product.Attribute.EditorSelector });
    },

    PresetAttributes: function (presetAttributes) {
        if (presetAttributes != undefined) {
            this.presetAttributes = presetAttributes;
            //this.PresetAttributeTemplate.link(this.$presetAttributes, this.presetAttributes, { Editor: Controls.Product.Attribute.EditorSelector });
            this.applyAttributeTemplate(this.$presetAttributes, this.PresetAttributeTemplate, this.presetAttributes);
        }
        else if (this.presetAttributes)
            delete this.presetAttributes;
    },

    UserAttributes: function (userAttributes) {
        if (userAttributes != undefined) {
            this.userAttributes = userAttributes;
            //this.UserAttributeTemplate.link(this.$userAttributes, this.userAttributes, { Editor: Controls.Product.Attribute.EditorSelector });
            this.applyAttributeTemplate(this.$userAttributes, this.UserAttributeTemplate, this.userAttributes);
        }
        else if (this.userAttributes)
            delete this.userAttributes;
    },

    NewAttribute: function (type) {
        if (this.Enabled() == Controls.Product.Attribute.EnabledType.Full && type)
        {
            var attribute = Admin.Model.Product.Attributes.NewAttribute.call(this.attributes, type.ItemKey, type.EditorType, type.ValueType);
            if (attribute) {
                attribute.UserDefined = true;
                attribute.tempId = this.attrCount++;
                $.observable(this.userAttributes).insert(attribute); //this.userAttributes.push(attribute);
                delete Page._tabbable;
            }
        }
        this.newAttributeDropdown.Hide();
    },

    RemoveAttribute: function (attribute, elem, index) {
        if (attribute && attribute.UserDefined) {
            if (Admin.Model.Product.Attributes.RemoveAttribute.call(this.attributes, attribute, index)) {
                $.observable(this.userAttributes).remove(index);
                delete Page._tabbable;
            }
            return false;
        }
    },

    Enabled: TemplateProperty('Enabled', function () {
        return this.$enabledType;
    }, function (enabledType) {
        this.$enabledType = enabledType;
        this.newAttributeDropdown.Enabled(enabledType == Controls.Product.Attribute.EnabledType.Full ? true : false);
    }),

    ProductConfig: function (productConfig) {
        this.populate(this.attributes, productConfig);
    },

    populate: function (attributes, productConfig) {
        var $this = this;
        this.attrCount = 0;
        $.each(attributes, function(a) {
            a.tempId = $this.attrCount++;
        });
        this.attributes = attributes;
        this.productConfig = productConfig;
        if (this.attributes) {
            var existingAttributes = this.attributes.Available;
            var presetAttributes = [], productAttribute, categoryAttribute;

            if (this.productConfig && this.productConfig.ProductAttributes && this.productConfig.ProductAttributes.length) {
                for (var i = 0, l = this.productConfig.ProductAttributes.length; i < l; i++) {
                    categoryAttribute = this.productConfig.ProductAttributes[i];
                    productAttribute = null;
                    for (var j = 0; j < existingAttributes.length; j++) {
                        if (existingAttributes[j].Name == categoryAttribute.Name) {
                            productAttribute = existingAttributes[j];
                            break;
                        }
                    }
                    if (!productAttribute) {
                        productAttribute = Admin.Model.Product.Attributes.NewAttribute.call(this.attributes, categoryAttribute.Type, categoryAttribute.EditorType, categoryAttribute.ValueType);
                        productAttribute.Name = categoryAttribute.Name;
                        productAttribute.UserDefined = false;
                        productAttribute.tempId = this.attrCount++;
                    }
                    else if (productAttribute.UserDefined)
                        productAttribute.UserDefined = false;

                    presetAttributes.push(productAttribute);
                }
            }

            var aa = jQuery.map(this.attributes.Available, function (a) {
                var pa = null;
                for (var i = 0, l = presetAttributes.length; i < l; i++) {
                    if (presetAttributes[i].Name == a.Name) {
                        pa = presetAttributes[i];
                        break;
                    }
                }
                if (!a.UserDefined && pa == null)
                    return a;
            });
            for (var i = aa.length - 1; i >= 0; i--) {
                if (!(aa[i].Id || aa[i].Value))
                    this.attributes.Available.splice(i, 1);
                else
                    aa[i].UserDefined = true;
            }
            this.PresetAttributes(presetAttributes);
            this.UserAttributes(this.attributes.UserDefined);
            delete Page._tabbable;
        }
        else {
            if (this.presetAttributes)
                delete this.presetAttributes;
            if (this.userttributes)
                delete this.userAttributes;
        }
    },

    Validate: function (proceed) {
        var valid = true, error;
        this.$attrError.hide();
        if (this.attributes && this.attributes.Available) {
            var items = {}, attribute;

            if (this.attributes.UserDefined.length) {
                var temp = Admin.Service.Product.Profile.FacetNames.slice();
                for (var i = 0, a = this.attributes.Preset; a[i]; i++)
                    temp.push(a[i].Name);

                var reserved = jQuery.map(this.attributes.UserDefined, function (a) {
                    var index = temp.indexOf(a.Name);
                    if (index >= 0)
                        return temp[index];
                });
                if (reserved && reserved.length) {
                    //var names = errors.Aggregate((a, b) => { return a + ", " + b; });
                    this.$attrError.text(String.format(Resource.Global.X_Y_reserved, Resource.Product.Attribute_name, reserved.join(", "))).show();
                    valid = false;
                }

                items.Reserved = reserved;

                temp.length = 0;
                items.InUse = temp;

                for (var i = 0, l = this.attributes.UserDefined.length; i < l; i++) {
                    attribute = this.attributes.UserDefined[i];
                    if (error = Admin.Model.Product.Attribute.ValidateName(attribute.Name, items)) {
                        this.$errorInfo.SetError('attrName' + attribute.tempId, error);
                        valid = false;
                    }
                    if (!String.isNullOrWhiteSpace(attribute.Name)) {
                        temp.push(attribute.Name);
                        items.InUse = temp;
                    }
                }
            }

            items = {
                Requirement: Model.Product.Attribute.Requirement.Required
            };

            for (var i = 0, l = this.attributes.Preset.length; i < l; i++) {
                attribute = this.attributes.Preset[i];
                var presetAttribute = null;
                for (var j = 0; j < this.productConfig.ProductAttributes.length; j++) {
                    if (this.productConfig.ProductAttributes[j].Name == attribute.Name) {
                        presetAttribute = this.productConfig.ProductAttributes[j];
                        break;
                    }
                }
                if (presetAttribute && presetAttribute.Requirement == Model.Product.Attribute.Requirement.Required) {
                    if (error = Admin.Model.Product.Attribute.ValidateValue(attribute.Value, items)) {
                        this.$errorInfo.SetError('attrValue' + attribute.tempId, error);
                        valid = false;
                    }
                }
            }

            for (var i = 0, l = this.attributes.UserDefined.length; i < l; i++) {
                attribute = this.attributes.UserDefined[i];
                if (error = Admin.Model.Product.Attribute.ValidateValue(attribute.Value, items)) {
                    this.$errorInfo.SetError('attrValue' + attribute.tempId, error);
                    valid = false;
                }
            }
        }
        proceed(valid /*&& !this.$errorInfo.HasErrors*/); //$errorInfo is shared and may contain other errors
    }
});

System.Type.RegisterNamespace('Controls.Image');
Controls.Image.Edit = Foundation.Controls.Control.extend({
    Container: '<table>' + 
        '<tr>' + 
            '<td><ul class="img-edit" id="images"></ul></td>' + 
        '</tr>' + 
        '<tr>' + 
            '<td style="padding-top:5px;">' +
                '<a id="addImage" class="form-button active" data-command="AddImage"><span class="button-content">' + Resource.Global.Image_Add_new + '</span></a>' +
            '</td>' + 
        '</tr></table>',

    ImageTemplate: jQuery.templates('<li{{if IsDefault link=false}} class="default"{{/if}}>' +
            '<div class="img-default-border"></div>' +
            '<img src="{{:ImageRef}}" />' +
            '<span class="img-controls">' +
                '<a class="image-button active" title="' + Resource.Global.Image_MakeDefault + '" data-command="MakeDefault" data-itemIndex="{{:#index+~startIndex}}"></a>' +
                '<a class="image-button active" title="' + Resource.Action.Remove + '" style="background-position: 0 -22px;" data-command="RemoveImage" data-itemIndex="{{:#index+~startIndex}}"></a>' +
            '</span>' +
        '</li>'),

    applyTemplate: function (images, options, empty) {
        //this.imagesContainer.link(this.ImageTemplate, images, options); //Linking allows for $.view(this).index
        if (empty)
            this.imagesContainer.empty();
        this.imagesContainer.append(this.ImageTemplate.render(images, options));
    },

    ctor: function () {
        this.maxImages = 4;
        this.$enabled = true;
        this.addForm = new Controls.Image.Add();
    },

    Initialize: function (container) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container);
        this.imagesContainer = $('#images', this.$container);
        var $this = this;
        this.addForm.NewImage = function (newImages) {
            if (newImages && newImages.length) {
                var makeDefault;
                if (!$($this.Images.Refs).is(function (index) {
                    return this.IsDefault;
                }))
                    makeDefault = true;
                for (var i = 0, l = newImages.length; i < l; i++) {
                    var token = Service.Image.Cache.Add(newImages[i])
                    var image = {
                        Token: token,
                        IsOwned: true,
                        ImageRef: newImages[i].Preview
                    };
                    delete newImages[i].Preview;
                    if (makeDefault && i == 0)
                        image.IsDefault = true;
                    $this.Images.Refs.push(image); //$.observable($this.Images.Refs).insert(image);
                    newImages[i] = image;
                }
                $this.applyTemplate(newImages, { startIndex: $this.Images.Refs.length - newImages.length });
            }
        };
    },

    Enabled: function (enabled) {
        if (enabled != undefined) {
            this.$enabled = enabled;
        }
        else
            return this.$enabled;
    },

    populate: function (images) {
        for (var i = 0, l = images.Refs.length; i < l; i++) {
            images.Refs[i].ImageRef = Model.Thumbnail.GetImageRef(images.Entity, images.Refs[i].Id, Settings.Image.Small);
        }
        this.Images = images;
        this.Items = images.Refs; //image commands
        this.applyTemplate(images.Refs, { startIndex: 0}, true);
        this.addForm.Entity = images.Entity;
    },

    AddImage: function () {
        if (this.Enabled() && this.Images)
            this.addForm.Show();
    },

    MakeDefault: function (image, elem, index) {
        if (this.Enabled() && !image.IsDefault) {
            $(this.Images.Refs).each(function () {
                if (this.IsDefault)
                    delete this.IsDefault;
            });
            $('li.default', this.imagesContainer).removeClass('default');
            image.IsDefault = true;
            elem.parents('li').first().addClass('default');
        }
    },

    RemoveImage: function (image, elem, index) {
        if (this.Enabled() && this.Images.Refs.length > 1 && image.IsOwned) {
            this.Images.Refs.splice(index, 1);

            if (image.Id)
                this.Images.Deleted.push(image.Id);
            if (image.IsDefault && this.Images.Refs.length)
                this.Images.Refs[0].IsDefault = true;
            if (image.Token)
                delete Service.Image.Cache[image.Token];

            this.applyTemplate(this.Images.Refs, { startIndex: 0 }, true);
            //$.observable(this.Images.Refs).remove(index);
        }
    }
});

//Controls.Image.Add
//Admin.Personal.Profile
Controls.Image.Browse = Class.define({
    Template: '<button id="openImage" class="form-button active" data-command="OpenImage"><span class="rte-button-content">' + Resource.Action.Browse + '</span><span id="buttonMenu" class="rte-button-content separated" style="padding-top:2px;padding-right:2px;margin-right:-2px;margin-bottom:-2px;">▼</span></button>',

    Initialize: function (container) {
        this._inputFile = $('#inputFile', container);
        var $this = this;
        var openImage = $("#openImage");
        var buttonMenu = $('#buttonMenu', openImage);
        openImage.click(function (e) {
            var pointer = {
                x: e.pageX,
                y: e.pageY
            };
            //Foundation.Controls.Layout.PopupHelperNoOverlay
            if (insideBounds(pointer, toBounds(buttonMenu))) {
                $this.$openImagePopupHelper.Show();
            }
            else
                $this.OpenImage();
            return false;
        });
        var openImageOptionContainer = $('<ul></ul>').delegate('a', 'click', function (e) {
            $this.OpenImage($(this).attr('data-commandParam'));
            $this.$openImagePopupHelper.Hide();
            return false;
        });
        var imageOptions = [{
            Text: Resource.Global.Image_Jpeg,
            Format: "Jpeg"
        }, {
            Text: Resource.Global.Image_Original,
            Format: "Original"
        }];
        for (var i = 0, l = imageOptions.length; i < l; i++) {
            openImageOptionContainer.append($('<li><a data-command="OpenImage" data-commandParam="' + imageOptions[i].Format + '">' + imageOptions[i].Text + '</a></li>'));
        };
        this.$openImagePopup = new Foundation.Controls.Layout.Popup(this, 'dropDownPopup');
        this.$openImagePopup.Initialize($('<div class="item-dropDown"></div>').append(openImageOptionContainer));
        this.$openImagePopupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$openImagePopup, openImage);
    },

    OpenImage: function (format) {
        this.preserveFormat = format == "Original" ? true : false;
        this._inputFile.trigger("click");
    }
});

Controls.Image.Add = Foundation.Controls.Layout.PopupControl.extend({
    Template: jQuery.templates(
        '<div class="header">' +
            '<span>' + Resource.Global.Image_Upload + '</span>' +
        '</div>' +
        '<div class="content">' +
            '<table><tbody>' +
                '<tr>' +
                    '<td>' + Resource.Global.Image_Preview + '</td>' +
                    '<td id="imagePreview"></td>' +
                    //'<td><a class="form-button active" data-command="OpenImage"><span class="button-content">' + Resource.Action.Browse + '</span></a></td>' +
                    '<td><button id="openImage" class="form-button active" data-command="OpenImage"><span class="rte-button-content">' + Resource.Action.Browse + '</span><span id="buttonMenu" class="rte-button-content separated" style="padding-top:2px;padding-right:2px;margin-right:-2px;margin-bottom:-2px;">▼</span></button></td>' +
                '</tr>' +
                '<tr>' +
                    '<td colspan="3" style="max-width:450px;">' + Resource.Global.Image_Upload_Prompt1 + '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td colspan="3" style="color:red;max-width:450px;">' + Resource.Global.Image_Upload_Prompt2 + '</td>' +
                '</tr>' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel">' +
            '<form action="" style="left: -1000px; top: 0px; position: absolute; display: none;"><input type="file" accept="image/*" id="inputFile" /></form>' + //image/jpeg, image/jpg, image/png, image/gif
            '<a id="submit" data-command="Submit" class="button" style="margin-right:10px;"><span class="button-content">' + Resource.Action.Ok + '</span></a>' +
            '<a data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>'),

    ctor: function() {
        this.imageHandler = new Foundation.Utils.Image(this);
        this.imageBrowse = new Controls.Image.Browse();
        this.newImages = [];
    },

    Initialize: function (options) {
        Foundation.Controls.Layout.PopupControl.prototype.Initialize.call(this, options);
        this.imageBrowse.Initialize(this.$container);
        this._imagePreview = $('#imagePreview', this.$container);
        //this._inputFile = $('#inputFile', this.$container);
        setDisabled(this.$submit, true);
        var $this = this;
        this.imageBrowse._inputFile.bind("change", function (e) {
            $this.imageHandler.FromFile(this.files, $this.Entity, $this.preserveFormat, function (newImage, preview, fileName) {
                if (newImage) {
                    if (preview)
                        $this._imagePreview.append('<img style="width: ' + preview.Width + 'px; height: ' + preview.Height + 'px; margin: 10px;" src="' + preview.Content + '" title="' + fileName + '"/>');
                    newImage.Preview = preview.Content;
                    $this.newImages.push(newImage);
                    setDisabled($this.$submit, false);
                }
            });
            //http://stackoverflow.com/questions/11866757/cant-clear-input-type-file-in-javascript-jquery
            $this.imageBrowse._inputFile.parent('form').trigger('reset');
        });
        /*var openImage = $("#openImage", this.$container);
        var buttonMenu = $('#buttonMenu', openImage);
        openImage.click(function (e) {
            var pointer = {
                x: e.pageX,
                y: e.pageY
            };
            //Foundation.Controls.Layout.PopupHelperNoOverlay
            if (insideBounds(pointer, toBounds(buttonMenu))) {
                $this.$openImagePopupHelper.Show();
            }
            else
                $this.OpenImage();
            return false;
        });
        var openImageOptionContainer = $('<ul></ul>').delegate('a', 'click', function (e) {
            $this.OpenImage($(this).attr('data-commandParam'));
            $this.$openImagePopupHelper.Hide();
            return false;
        });
        var imageOptions = [{
            Text: Resource.Global.Image_Jpeg,
            Format: "Jpeg"
        }, {
            Text: Resource.Global.Image_Original,
            Format: "Original"
        }];
        for (var i = 0, l = imageOptions.length; i < l; i++) {
            openImageOptionContainer.append($('<li><a data-command="OpenImage" data-commandParam="' + imageOptions[i].Format + '">' + imageOptions[i].Text + '</a></li>'));
        };
        this.$openImagePopup = new Foundation.Controls.Layout.Popup(this, 'dropDownPopup');
        this.$openImagePopup.Initialize($('<div class="item-dropDown"></div>').append(openImageOptionContainer));
        this.$openImagePopupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$openImagePopup, openImage);*/
    },

    /*OpenImage: function (format) {
        this.preserveFormat = format == "Original" ? true : false;
        this._inputFile.trigger("click");
    },*/

    Invalidate: function (ex) {
        var error = Foundation.Controls.Validation.PopupControl.prototype.GetErrorMessage.call(this, ex.ErrorMessageType || Foundation.ErrorMessageType.Unknown, ex);
        if (error)
            this.$errorContainer.text(error).show();
    },

    onCommand: function (command, data, elem) {
        switch (command) {
            case "Submit":
                if (!getDisabled(this.$submit)) {
                    this.NewImage(this.newImages);
                    this.Hide();
                }
                break;
            default:
                Foundation.Controls.Layout.PopupControl.prototype.onCommand.call(this, command, data, elem);
        }
    },

    Closing: function () {
        this._imagePreview.empty();
        this.newImages.length = 0;
        this.$errorContainer.empty().hide();
        return Foundation.Controls.Layout.PopupControl.prototype.Closing.call(this);
    }
});

ImageOrientation = {
    Any: 0,
    Landscape: 1
};

System.Type.RegisterNamespace('Foundation.Utils');
Foundation.Utils.Image = Class.define({
    ctor: function (master) {
        this.master = master;
        this.supportedFileTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif"
        ];
        this.fileSizeLimit = 20971520;
    },

    getDataURL: function (image, format, quality) {
        if (image.toDataURL) {
            return image.toDataURL(this.getFileType(format), quality);
        }
        else if (image instanceof Image)
            return image.src;
    },

    getFileType: function (format) {
        switch (format) {
            case Model.ImageType.Png:
                return "image/png";
            default:
                return "image/jpeg";
        }
    },

    FromFile: function (files, entity, preserveFormat, callback) {
        if (window.FileReader) {
            for (var i = 0, l = files.length; i < l; i++) {
                var file = files[i];
                if (this.isSupportedType(file)) {
                    var format = Model.ImageType.Jpeg;
                    if (preserveFormat) {
                        switch (file.type) {
                            case "image/png":
                                format = Model.ImageType.Png;
                                break;
                            default:
                                preserveFormat = false;
                                break;
                        }
                    }
                    if (file.size <= this.fileSizeLimit) {
                        this.fromFile(file, entity, preserveFormat, format, callback);
                    }
                    else
                        this.master.Invalidate(Resource.Global.Image_Upload_Error_FileSize);
                }
                else
                    this.master.Invalidate(Resource.Global.Image_Upload_Error_FileType);
            }
        }
        else
            throw 'Your browser does not support File API';
    },

    isSupportedType: function (file) {
        return jQuery.inArray(file.type, this.supportedFileTypes) >= 0;
    },

    fromFile: function (file, entity, preserveFormat, format, callback, faultCallback) {
        var fr = new FileReader();
        var $this = this;
        fr.onloadend = function (e) {
            $this.process(fr.result, entity, preserveFormat, format, function (resized, preview) {
                if (resized) {
                    callback(resized, preview, file.name);
                }
                else
                    $this.master.Invalidate("Error reading image file");
            });
        };
        fr.onabort = function () {
            debugger;
            $this.master.Invalidate("Error reading image file");
        };
        fr.onerror = function () {
            debugger;
            $this.master.Invalidate("Error reading image file");
        };
        fr.readAsDataURL(file);
    },

    process: function (imgSrc, entity, preserveFormat, type, callback) {
        var $this = this;
        var image = new Image();
        image.style.display = "none";
        image.onload = function () {
            var width = 0, height = 0, resized, preview;
            var minSze = (this.minSizeType == Model.ImageSizeType.Thumbnail ? Settings.Image.Thumbnail : Settings.Image.XtraSmall),
                maxSize = (entity == Model.ImageEntity.Person ? Settings.Image.XtraSmall : Settings.Image.Medium);
            if (entity == Model.ImageEntity.Business && this.minSizeType == Model.ImageSizeType.Thumbnail) {
                minSze.AspectRatio = Settings.Image.Wide.AspectRatio;
                maxSize.AspectRatio = Settings.Image.XtraWide.AspectRatio;
            }

            var sizedImage = this.resize(image, maxSize, false);
            if (!sizedImage) {
                var bounds = this.getBounds(image, minSze);
                if (this.fitsThreshold(image, bounds, Settings.Image.SizeThreshold))
                    sizedImage = this.render(image, image.width, image.height);
            }

            if (sizedImage) {
                if (!(type == Model.ImageType.Jpeg || type == Model.ImageType.Png || type == Model.ImageType.Gif)) {
                    type = Model.ImageType.Jpeg;

                    if (preserveFormat)
                        preserveFormat = false;
                }

                resized = {
                    Type: type,
                    Width: sizedImage.width,
                    Height: sizedImage.height,
                    Content: this.getDataURL(sizedImage, type, Settings.Image.JpegQuality / 100)
                };

                sizedImage = this.resize(image, Settings.Image.Small, true);
                if (sizedImage) {
                    preview = {
                        Width: sizedImage.width,
                        Height: sizedImage.height,
                        Content: this.getDataURL(sizedImage, type)
                    };
                }

                callback(resized, preview);
            }
        }.bind(this);
        image.onerror = function () {
            callback(false);
        };
        image.src = imgSrc;
    },

    resize: function (image, target, preview) {
        var bounds = this.getBounds(image, target);
        if (image.width > bounds.width || image.height > bounds.height) {
            var width = image.width;
            var height = image.height;

            //Foundation.Image.Resize
            var newWidth = width;
            var widthD = newWidth / 1000;
            var newHeight = height;
            var heightD = newHeight / 1000;
            while (newWidth > bounds.width || newHeight > bounds.height) {
                newWidth -= widthD;
                newHeight -= heightD;
            }

            var scaleX = 1;
            var scaleY = 1;

            if (width > newWidth)
                scaleX = newWidth / width;
            if (height > newHeight)
                scaleY = newHeight / height;

            var scale = Math.min(scaleX, scaleY);

            height = height * scale;
            width = width * scale;
        }
        else if (this.fitsThreshold(image, bounds, Settings.Image.SizeThreshold) || preview) {
            width = image.width;
            height = image.height;
            //return image; //Image doesn't have toDataURL method that is used to convert to Jpeg, so preview may not be accurate
        }
        else
            return;

        return this.render(image, width, height);
    },

    getBounds: function (image, target) {
        var maxWidth, maxHeight;
        if (target.Orientation == ImageOrientation.Landscape || image.width > image.height) {
            maxWidth = target.Size;
            maxHeight = target.Size / target.AspectRatio;
        }
        else {
            maxHeight = target.Size;
            maxWidth = target.Size / target.AspectRatio;
        }

        return {
            width: maxWidth,
            height: maxHeight
        }
    },

    fitsThreshold: function (image, bounds, threshold) {
        return (image.width / bounds.width * 100) >= threshold || (image.height / bounds.height * 100) >= threshold ? true : false;
    },

    render: function (image, width, height) {
        //http://www.codeforest.net/html5-image-upload-resize-and-crop
        var renderedImage = document.createElement("canvas");
        renderedImage.style.display = "none";
        renderedImage.width = width;
        renderedImage.height = height;
        var ctx = renderedImage.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);

        return renderedImage;  //ctx.getImageData(0, 0, width, height);
    }
});