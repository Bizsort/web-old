View = {
    IAccount: Foundation.Page.extend({
        ctor: function () {
            Foundation.Page.prototype.ctor.call(this);
            this.actionPanel = new Controls.Action.Panel();
            this.messageAction = new Controls.Action.Message();
            this.message = this.messageAction.PopupForm();
        }
    }),

    Error: Foundation.Controls.Layout.PopupControl.extend({
        ctor: function (error) {
            this.$error = error;
        },

        Template: $.templates(
            '<div class="header" style="padding:3px 8px">' +
                '<span>' + Resource.Dictionary.Error + '</span>' +
            '</div>' +
            '<table style="margin:8px 8px 3px"><tbody>' +
                '<tr>' +
                    '<td class="formError">' + Resource.Exception.Unknown + '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding-top:5px;">' + Resource.Dictionary.Error_details + '</td>' +
                '</tr>' +
            '</tbody></table>' +
            '<div style="margin:0px 8px; padding:3px; background-color: #ebebeb; border:1px solid #AAA; min-height:60px; overflow:auto;">' +
                '<span id="errorDetails">' + Resource.Dictionary.Error + '</span>' +
            '</div>' +
            '<div class="buttonPanel right" style="padding:8px;">' +
                '<a id="cancel" data-command="Cancel" class="button active" style="width:75px;"><span class="button-content">' + Resource.Action.Ok + '</span></a>' +
            '</div>'),

        Show: function () {
            if (!this._popupContainer) {
                Foundation.Controls.Layout.PopupControl.prototype.Initialize.call(this, { tmplData: {} });
                $("#errorDetails", this.$container).text(this.$error);
            }
            Foundation.Controls.Layout.PopupControl.prototype.Show.call(this);
        }
    })
};

Business = {
    ListView: Foundation.List.View.extend({
        fetchPage: function (page, callback, faultCallback) {
            var $this = this;
            User.Service.Business.Profile.ToPreview(page, function (businesses) {
                callback($this.preparePage(page, businesses));
            }, faultCallback);
        }
    })
};

Product = {
    ListView: Foundation.List.Filter.View.extend({
        ctor: function (listView) {
            Foundation.List.Filter.View.prototype.ctor.call(this, listView);
            this.KnownFacetNames = User.Service.Product.Profile.FacetNames;
        },

        fetchPage: function (page, callback, faultCallback) {
            if (!this._admin) {
                var $this = this;
                User.Service.Product.Profile.ToPreview(page, this.List.View.OptionalColumns(), function (products) {
                    callback($this.preparePage(page, products));
                }, faultCallback, this.Account);
            }
            else
                Admin.Service.Product.Profile.ToPreview(page, this.List.View.OptionalColumns(), callback, faultCallback);
        }
    }),

    FolderView: Foundation.List.Folder.View.extend({
        ctor: function (listView, folders, folderPath) {
            Foundation.List.Folder.View.prototype.ctor.call(this, listView, folders, folderPath);
            this.KnownFacetNames = User.Service.Product.Profile.FacetNames;
        },

        fetchPage: function (page, callback, faultCallback) {
            if (!this._admin) {
                var $this = this;
                User.Service.Product.Profile.ToPreview(page, this.List.View.OptionalColumns(), function (products) {
                    callback($this.preparePage(page, products));
                }, faultCallback, this.Account);
            }
            else
                Admin.Service.Product.Profile.ToPreview(page, this.List.View.OptionalColumns(), callback, faultCallback);
        }
    }),

    FolderEdit: Foundation.List.Folder.Edit.extend({
        ctor: function (listView, folders, folderPath) {
            Foundation.List.Folder.Edit.prototype.ctor.call(this, listView, folders, folderPath);
            this.KnownFacetNames = User.Service.Product.Profile.FacetNames;
        },

        fetchPage: function (page, callback, faultCallback) {
            Admin.Service.Product.Profile.ToPreview(page, this.List.View.OptionalColumns(), callback, faultCallback);
        }
    })
};

Community = {
    ListView: Foundation.List.View.extend({
        fetchPage: function (page, callback, faultCallback) {
            var $this = this;
            User.Service.Community.Profile.ToPreview(page, function (communities) {
                callback($this.preparePage(page, communities));
            }, faultCallback);
        },

        ReflectUser: function () {
            Foundation.Page.prototype.ReflectUser.call(this);
            this.Pager.RefreshPage();
        }
    })
};

System.Type.RegisterNamespace('Controls.Navigation');

Controls.Navigation.MenuStrip = Foundation.Controls.Layout.ItemSelector.extend({

    Template: jQuery.templates(
        '<li data-itemIndex="{{:#index}}"{{if !$visible}} style="display:none;"{{/if}}>' +
            '<a>{{:Text}}</a>' +
        '</li>'
    ),

    itemFromType: function (type) {
        for (var i = 0, l = this.Items.length; i < l; i++) {
            if (this.Items[i].Type == type)
                return this.Items[i];
        }
    },

    prepareContainerForItem: function (container, item) {
        Foundation.Controls.Layout.ItemsControl.prototype.prepareContainerForItem.call(this, container, item);
        if (item.Command)
            container.addClass('active');
    },

    onItemClick: function (menuItem) {
        if (menuItem.Command && (this._selectedItem != menuItem || this.SelectedItemClickable)) {
            console.log('Item click - executing command');
            return menuItem.Command();
        }
        console.log('Item click - command skipped');
    },

    SelectItem: function (oldValue, newValue) {
        Foundation.Controls.Layout.ItemSelector.prototype.SelectItem.call(this, oldValue, newValue);
        var container;
        if (oldValue) {
            if (oldValue.Command) {
                container = this.containerFromItem(oldValue);
                /*oldValue.Container*/container.addClass('active');
            }
        }
        if (newValue) {
            container = this.containerFromItem(newValue);
            if (!this.SelectedItemClickable)
                /*newValue.Container*/ container.removeClass('active');
            //if (container.css('display') == 'none')
            //    container.show();
            if (!newValue.Visible())
                newValue.Visible(true);
        }
    }
});

Controls.Navigation.SubMenu = Controls.Navigation.MenuStrip.extend({
    ctor: function (menu) {
        this.$containerId = 'Container';
    },

    Initialize: function (container) {
        this.Container = $('<div id="menuSub">' +
        '<table style="width: 100%"><tr>' +
            '<td style="text-align:left; vertical-align:middle;">' +
                '<ul id="menuSubList"></ul>' +
            '</td>' +
            '<td style="text-align:right; float:right;" id="searchPlaceholder"></td>' +
        '</tr></table>' +
        '</div>');
        Controls.Navigation.MenuStrip.prototype.Initialize.call(this, this.Container);
    },

    ReflectMenu: function (itemType, selectedItemClickable) {
        if (selectedItemClickable)
            this.SelectedItemClickable = true;
        else if (this.SelectedItemClickable) {
            this.SelectedItemClickable = false;
            delete this.SelectedItemClickable;
        }

        var subMenuItem = this.itemFromType(itemType);
        if (subMenuItem) {
            this.SelectedItem(subMenuItem);
        }
    }
});

Controls.Navigation.MenuControl = Controls.Navigation.MenuStrip.extend({

    PopupTemplate: jQuery.templates(
        '<li data-itemIndex="{{:Index}}"{{if !Item.$visible}} style="display:none;"{{/if}}>' +
            '<a>{{:Item.Text}}</a>' +
        '</li>'
    ),

    ctor: function (menu) {
        this.$containerId = 'Container';
        this.Items = menu;
        this.subMenu = new Controls.Navigation.SubMenu();

        this.$popup = new Foundation.Controls.Layout.Popup(this);
        this.$popup.Closed = jQuery.proxy(this._popup_Closed, this);
        //this._popupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$popup);

        this.cancelPopupClose = false;
        this.popupToggled = false;

        var $this = this;
        this.window_resize = function () {
            if (this.popupToggled && this.$popup.IsOpen && this.$popup.Tag) {
                this.ArrangePopup(this.$popup.Tag.Container);
            }
        };
        //Could also use click, but it may be trapped in some handlers
        this.document_mousedown = function () {
            console.log('Document mousedown - closing menu');
            $this.deactivate(true);
        };
    },

    Container:
        '<div id="menuMain"><ul id="menuMainList"></ul></div>',

    HighlightedItem: function (highlightedItem) {
        var oldValue = this._highlightedItem;
        this._highlightedItem = highlightedItem;
        this.HighlightItem(oldValue, highlightedItem);
    },

    Initialize: function (container) {
        Controls.Navigation.MenuStrip.prototype.Initialize.call(this, container);
        this.$popup.Initialize($('<div id="menuMainPopup"><ul></ul></div>'));
        var $this = this;
        this.$popup.$container.hover(function () {
            $this.openPopup(false);
            return false;
        },
        function () {
            $this.closePopup(true);
            return false;
        });

        this._popupItems = $('ul', this.$popup.$container);
        this._popupItems.delegate('a', 'click', function () {
            var index = parseInt($(this).parent('li').attr('data-itemIndex'));
            if ($this.$popup.Tag) {
                var items = $this.$popup.Tag.SubItems;
                if (!isNaN(index) && items && items.length > index && $this.onItemClick) {
                    $this.onItemClick(items[index], index);  //$.view(this).data if Template.link() was used
                }
            }
            return false;
        });

        this.$container.delegate('ul#menuMainList > li > a', 'mouseenter', function () {
            var menuItem = $this.itemFromContainer($(this).parent('li'));
            console.log('Mouseenter - opening menu');
            return $this.activate(menuItem);
        });

        this.$container.delegate('ul#menuMainList > li > a', 'mouseleave', function () {
            //we could try and see if the mouse is over the popup and close it if it's not
            //...e.Position... instead of using delay timer
            console.log('Mouseleave - closing menu');
            return $this.deactivate();
        });

        this.subMenu.Initialize();
        this.Populate(this.Items);
    },

    //Stay open when clicked (for touch)
    onItemClick: function (menuItem) {
        if (!Controls.Navigation.MenuStrip.prototype.onItemClick.call(this, menuItem)) {
            console.log('Item click - opening menu');
            return this.activate(menuItem, true);
        }
    },

    activate: function (menuItem, toggle) {
        var open = menuItem && this._selectedItem != menuItem ? true : false;
        if (!this.$popup.IsOpen || !this.popupToggled || open/*different item clicked or hovered over*/) {
            //Moved above
            //var open = menuItem && this._selectedItem != menuItem ? true : false;
            if (open) {
                if(this.$popup.Tag != menuItem) {
                    this.HighlightedItem(menuItem);
                    this.openPopup(toggle, menuItem);
                }
                else 
                {
                    if(toggle)
                        this.togglePopup(true);
                    this.cancelClose();
                }
            }
        }
        return false;
    },

    deactivate: function (force) {
        if (this.$popup.IsOpen) {
            if (!this.popupToggled || force)
                this.closePopup(true);
        }
        else {
            if (this.$popup.Tag)
                this.$popup.Tag = undefined;
            this.togglePopup(false);
        }
        return false;
    },

    SelectItem: function (oldValue, menuItem) {
        Controls.Navigation.MenuStrip.prototype.SelectItem.call(this, oldValue, menuItem);
        if (menuItem) {
            if (menuItem && menuItem.SubItems && menuItem.SubItems.length > 0) {
                this.subMenu.Populate(jQuery.map(menuItem.SubItems, function (si) {
                    if (!si.Exclude || (si.Exclude & Navigation.Menu.Type.SubMenu) == 0)
                        return si;
                }));
            }
            else
                this.subMenu.Populate();

            this.subMenu.Container.appendTo(menuItem.Container);
        }
        else
            this.subMenu.Populate();

        //Adding the bottom line and pushing down page content (div#menuSub padding-bottom: 1px)
        this.$container.parent().height(this.$container.height() + this.subMenu.Container.height() - 1);
    },

    openPopup: function (toggle, mainMenuItem) {
        if (mainMenuItem) {
            if (mainMenuItem.SubItems && mainMenuItem.SubItems.length > 0) {
                this._popupItems.empty().append(this.PopupTemplate.render(jQuery.map(mainMenuItem.SubItems, function (si, idx) {
                    if (!si.Exclude || (si.Exclude & Navigation.Menu.Type.PopupMenu) == 0)
                        return { Item: si, Index: idx };
                })));
                this.$popup.Tag = mainMenuItem;
                this.openPopup(toggle);
                return;
            }

            this.closePopup(false);
        }
        else {
            this.cancelClose();

            if (!this.$popup.IsOpen)
                this.$popup.Show();

            mainMenuItem = this.$popup.Tag;
            this.togglePopup(toggle);
            this.ArrangePopup(mainMenuItem.Container);
        }
    },

    togglePopup : function(toggled) {
        if(toggled) {
            if(!this.popupToggled) {
                this.popupToggled = true;
                $(document).resize(this.window_resize);
                $(document).mousedown(this.document_mousedown);
            }
        }
        else if(this.popupToggled) {
            $(document).unbind('resize', this.window_resize);
            $(document).unbind('mousedown', this.document_mousedown);
            this.popupToggled = false;
        }
    },

    ArrangePopup: function (element) {
        //this._popupHelper.ArrangePopup(element, this.MaxDropDownHeight);
        var offset = element.offset();
        this._popupItems.css('min-width', element.outerWidth() + 'px');
        this.$popup.Position({ left: offset.left + 3, top: offset.top + element.outerHeight() - (this.subMenu.Items ? 1 : 0) });
    },

    _popup_Closed: function () {
        this.togglePopup(false);
        this.$popup.Tag = undefined;
        this.HighlightedItem();
    },

    popupTimer_Tick: function () {
        delete this.popupTimer;
        if (!this.cancelPopupClose)
            this.closePopup(false);
    },

    Hide: function () {
        this.closePopup(false);
    },

    closePopup: function (wait) {
        if (wait) {
            this.cancelPopupClose = false;
            this.popupTimer = setTimeout(jQuery.proxy(this.popupTimer_Tick, this), 200);
        }
        else if (!this.cancelPopupClose) {
            if (this.$popup.IsOpen)
                this.$popup.Hide();
            this.togglePopup(false);
            this.$popup.Tag = undefined;
            this.HighlightedItem(undefined);
        }
    },

    cancelClose: function () {
        this.cancelPopupClose = true;

        if (this.popupTimer) {
            clearTimeout(this.popupTimer);
        }
    },

    HighlightItem: function (oldValue, newValue) {
        if (oldValue && oldValue.Container)
            oldValue.Container.removeClass('highlighted');
        if (newValue && newValue.Container)
            newValue.Container.addClass('highlighted');
    },

    ReflectMenu: function (mainType, subType, selectedItemClickable) {
        var mainMenuItem = this.itemFromType(mainType);
        if (mainMenuItem) {
            this.SelectedItem(mainMenuItem);
            this.subMenu.ReflectMenu(subType, selectedItemClickable);
        }
    }
});

System.Type.RegisterNamespace('Controls.SignIn');
Controls.SignIn.Form = Foundation.Controls.Validation.PopupControl.extend({
    ctor: function () {
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this);
        $.views.helpers({
            visibilityFromBool: Foundation.ValueConverter.Visibility.FromBool
        });
        $.observable(this).setProperty('FacebookInProgress', false);
        this.$focusCtrl = '#email';
    },

    //<fb:login-button perms="email" size="small" onlogin="check_login_session()">Sign Up Using Facebook</fb:login-button>
    //<div class="fb-login-button"><a class="href" data-command="LoginWithFacebook">' + Resource.Global.SignIn_Facebook + '</a></div>
    Template: jQuery.templates(
        '<form action="">' +
        '<div class="header" data-link="visible{:~visibilityFromBool(FacebookInProgress, \'!\')}">' +
            '<table style="width:100%"><tbody>' +
                '<tr>' +
                    '<th class="title" style="text-align:left; vertical-align:middle;">' + Resource.Action.Sign_in + '</th>' +
                    '<td>&nbsp;</td>' +
                    '<th style="text-align:right; vertical-align:middle;"><table class="fbButton" style="float:right;"><tbody><tr><td style="border-right-width: 0px; border-right-color:#405b91;"><img src="' + Settings.WebSite.Origin.ServerPath + '/images/fb.png" /></td><td style="border-left-width: 0px;"><a data-command="LoginWithFacebook"><span>' + Resource.Global.SignIn_Facebook + '</span></a></td></tr></tbody></table></th>' +
                    //<div class="fb-login-button">' + Resource.Global.SignIn_Facebook + '</div>
                '</tr>' +
            '</tbody></table>' +
        '</div>' +
        '<div class="header" data-link="visible{:FacebookInProgress}">' +
            '<span class="title">' + Resource.Global.SignIn_Facebook_InProgress + '</span>' +
        '</div>' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr>' +
                    '<td class="label"><label for="email">' + Resource.Dictionary.Email + '</label></td>' +
                    '<td class="value"><input type="text" id="email" name="email" /></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label"><label for="password">' + Resource.Dictionary.Password + '</label></td>' +
                    '<td class="value"><input type="password" id="password" name="password" /></td>' +
                '</tr>' +
                '<tr>' +
                    '<td></td>' +
                    '<td class="value"><input type="checkbox" id="remember" name="remember" />&nbsp;' + Resource.Dictionary.Remember_me + '</td>' +
                '</tr>' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer">' +
            '<table style="width:100%"><tbody>' +
                '<tr>' +
                    '<td style="text-align:left; vertical-align:bottom;">' +
                        '<a id="recoverPassword" class="href" data-command="RecoverPassword">' + Resource.Dictionary.Forgot_password + '</a>' +
                    '</td>' +
                    '<td>&nbsp;&nbsp;&nbsp;</td>' +
                    '<td class="buttonPanel" style="padding:0; text-align:right; vertical-align:middle;">' +
                        '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Sign_in + '</span></a>' +
                        '&nbsp; &nbsp;' +
                        '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
                    '</td>' +
                '</tr>' +
            '</tbody></table>' +
        '</div>' +
    '</form>'
    ),

    $validationItems: {},

    ValidatorOptions: {
        rules: {
            email: "validateEmail",
            /*email: {
            required: true,
            email: true
            }*/
            password: "required"
        },

        messages: {
            email: String.format(Resource.Global.Editor_Error_Enter_X_Valid, Resource.Dictionary.Email),
            password: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Password)
        }
    },

    Initialize: function (options) {
        Foundation.Validator.addMethod("validateEmail", jQuery.proxy(Model.LocationSettings.ValidateEmail, this));
        var $this = this;
        User.Service.Master.Location.GetSettings(Settings.Location.Country, function (locationSettings) {
            $this.$validationItems.LocationSettings = locationSettings;
        });

        try {
            Service.Facebook.EnsureInit();
        }
        catch (e) {
            console.error(errorMessage(e));
        }
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, { 
            tmplData: this,
            tmplOptions: {
                link: true
            }
        }));
    },

    RecoverPassword: function () {
        Navigation.Main.RecoverPassword();
        this.Hide();
    },

    RequiresAuthentication: function () {
        return false;
    },

    OnSubmit: function () {
        var email = $('#email', this.$container).val();
        var password = $('#password', this.$container).val();
        var remember = $('#remember', this.$container).prop('checked');

        var $this = this;
        Session.Login(email, password, function (loginResponse) {
            if (loginResponse && loginResponse.Status == Model.Session.LoginStatus.Success) {
                $this.SubmitComplete(); //will close the form and reset remember.checked
                $this.SignedIn({ ShowTerms: (loginResponse.Flags && (loginResponse.Flags & Model.Session.LoginFlags.ShowTerms) > 0 ? true : false) });

                if (remember && (!loginResponse.Flags || (loginResponse.Flags & Model.Session.LoginFlags.AdminLogon) == 0)) {
                    $this.remember(Model.Session.AutoLoginType.AdScrl);
                }
            }
            else if (loginResponse && loginResponse.Status == Model.Session.LoginStatus.AccountLocked)
                $this.Invalidate(Resource.Global.SignIn_Error_AccountLocked);
            else
                $this.Invalidate(new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState));
        }, jQuery.proxy(this.Invalidate, this));
    },

    GetErrorMessage: function (error, data) {
        switch (error) {
            case Foundation.ErrorMessageType.Data_DuplicateRecord:
                var email;
                if(data.KeyValue)
                    email = data.KeyValue;
                return String.format(Resource.Global.Account_Email_Error_Duplicate, email || $('#email', this.$container).val());
            case Foundation.ErrorMessageType.Argument_Invalid:
                if (data.ParamName == "EmailPassword")
                    return Resource.Global.SignIn_Error_InvalidEmailPassword;
                else if (data.ParamName == "Country" && data.ParamValue)
                    return String.format(Resource.Global.Account_Country_Error_NotSupported, data.ParamValue);
                else
                    return Foundation.Controls.Validation.PopupControl.prototype.GetErrorMessage.call(this, error, data);
            case Foundation.ErrorMessageType.Data_RecordNotFound:
                return Resource.Global.SignIn_Error_InvalidEmailPassword;
            case Foundation.ErrorMessageType.Operation_UnexpectedState:
                return Resource.Global.SignIn_Error_AccountInactive;
            default:
                return Foundation.Controls.Validation.PopupControl.prototype.GetErrorMessage.call(this, error, data);
        }
    },

    LoginWithFacebook: function () {
        var $this = this;
        this.$errorInfo.Clear();
        setDisabled(this.$submit, true);
        $.observable(this).setProperty('FacebookInProgress', true);
        var faultCallback = jQuery.proxy(this.Invalidate, this);
        try {
            Service.Facebook.Login(function (fbLoginResponse) {
                if (fbLoginResponse && fbLoginResponse.AccessToken && fbLoginResponse.UserId) {

                    Session.LoginExternal(Model.ServiceProvider.Facebook, fbLoginResponse.UserId, fbLoginResponse.AccessToken, function (loginResponse) {
                        if (loginResponse && loginResponse.Status == Model.Session.LoginStatus.Success) {
                            $this.SubmitComplete();
                            $this.SignedIn({ ShowTerms: (loginResponse.Flags && (loginResponse.Flags & Model.Session.LoginFlags.ShowTerms) > 0 ? true : false) });

                            //Not sure how to check if "Keep me logged in" option was selected, so assume that it was
                            $this.remember(Model.Session.AutoLoginType.Facebook);
                        }
                        else
                            $this.Invalidate(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                    }, jQuery.proxy($this.Invalidate, $this));

                    //Updating account - not utilized
                    //try {
                    //    Service.Facebook.AccountInfo(function (apiResponse) {
                    //        if (apiResponse && apiResponse.Id == fbLoginResponse.UserId && apiResponse.Email && apiResponse.Name) {
                    //            if (apiResponse.Location && apiResponse.Location.length > 0) {
                    //                try {
                    //                    Service.Geocoder.Geocode(apiResponse.Location, function (geocoderResponse) {
                    //                        if (geocoderResponse && geocoderResponse.Address) {
                    //                            var location;
                    //                            if (geocoderResponse.Address.City && geocoderResponse.Address.State && geocoderResponse.Address.Country) {
                    //                                location = {
                    //                                    Name: geocoderResponse.Address.City,
                    //                                    State: geocoderResponse.Address.State,
                    //                                    Country: geocoderResponse.Address.Country
                    //                                };
                    //                            }
                    //                            else if (geocoderResponse.Address.State && geocoderResponse.Address.Country) {
                    //                                location = {
                    //                                    State: geocoderResponse.Address.State,
                    //                                    Country: geocoderResponse.Address.Country
                    //                                };
                    //                            }
                    //                            else if (geocoderResponse.Address.Country) {
                    //                                location = {
                    //                                    Country: geocoderResponse.Address.Country
                    //                                };
                    //                            }
                    //                            Service.Master.Account.UpdateExternal(Model.ServiceProvider.Facebook, apiResponse.Id, apiResponse.Email, apiResponse.Name, location, callback, faultCallback);
                    //                        }
                    //                        else
                    //                            Service.Master.Account.UpdateExternal(Model.ServiceProvider.Facebook, apiResponse.Id, apiResponse.Email, apiResponse.Name, undefined, callback, faultCallback);
                    //                    }, function (errorMessage) {
                    //                        Service.Master.Account.UpdateExternal(Model.ServiceProvider.Facebook, apiResponse.Id, apiResponse.Email, apiResponse.Name, undefined, callback, faultCallback);
                    //                    });
                    //                }
                    //                catch (ex) {
                    //                    $this.Invalidate(ex);
                    //                }
                    //            }
                    //            else
                    //                Service.Master.Account.UpdateExternal(Model.ServiceProvider.Facebook, apiResponse.Id, apiResponse.Email, apiResponse.Name, undefined, callback, faultCallback);
                    //        }
                    //    }, faultCallback);
                    //}
                    //catch (ex) {
                    //    $this.Invalidate(ex);
                    //}
                }
                else
                    $this.Invalidate(Resource.Global.SignIn_Facebook_Error);
            }, faultCallback);
        }
        catch (ex) {
            $this.Invalidate(ex);
        }
    },

    remember: function (autoLoginType) {
        Session.Remember(function (token) {
            if (token && token.length > 0) {
                token = Guid.Deserialize(token);
            }
            if (!Guid.isEmpty(token)) {
                Session.User.AutoLogin = autoLoginType;
                Session.User.AutoLoginToken = token;

                var cookie = Session.Cookies[Settings.Session.AutoLogin.UserCookieName];
                if (cookie == undefined)
                    cookie = { Name: Settings.Session.AutoLogin.UserCookieName };

                var date = new Date();
                date.setDate(date.getDate() + Settings.Session.AutoLogin.ExpireAfter);
                cookie.Expires = date;
                cookie.Value = { Type: autoLoginType, Token: token };

                Session.Cookies.Set(cookie);
            }
        });
    },

    Invalidate: function (ex) {
        $.observable(this).setProperty('FacebookInProgress', false);
        return Foundation.Controls.Validation.PopupControl.prototype.Invalidate.call(this, ex);
    },

    Closing: function () {
        $('#email', this.$container).val('');
        $('#password', this.$container).val('');
        $('#remember', this.$container).prop('checked', false);
        $.observable(this).setProperty('FacebookInProgress', false);
        return Foundation.Controls.Validation.PopupControl.prototype.Closing.call(this);
    }
});

Controls.SignIn.Prompt = function (prefix, postfix) {
    return (prefix || Resource.Global.SignIn_Prompt_Prefix) + '<a class="href" onclick="SignIn(); return false;">' + Resource.Action.Sign_in + '</a>' + (postfix || Resource.Global.SignIn_Prompt_Postfix)
};

System.Type.RegisterNamespace('Controls.Location');
Controls.Location.Current = Foundation.Controls.Location.Current.extend({
    Container: '<span>' + Resource.Dictionary.Location + '&nbsp;<a id="location" data-Id="-1" data-command="changeLocation"></a></span>', //<span> -> <b>

    Id: function () {
        return $("#location", this.$container).attr('data-Id');
    },

    populate: function (locationId) {
        if (locationId > 0) {
            var $this = this;
            return User.Service.Master.Location.Get(locationId, Model.Group.DisplayType.Text, function (location) {
                $("#location", $this.$container).text(location.Name).attr('data-Id', locationId);
                $this.notifyPopulated(location, true); //Used to set Title and Keywords
            });
        }
        else {
            $("#location", this.$container).text(Resource.Dictionary.Everywere).attr('data-Id', 0);
            this.notifyPopulated({ //Used to set Title and Keywords
                Id: 0,
                Name: Resource.Dictionary.Everywere
            }, true);
        }
    }
});

Controls.Location.Current_Home = Foundation.Controls.Location.Current.extend({
    Container: '<span><span class="groupPath"></span>&nbsp;[<a class="group active" data-command="changeLocation">' + Resource.Action.Change + '</a>]</span>', //-<b>

    Id: function () {
        return this.$path ? this.$path.Id() : -1;
    },

    ctor: function () {
        Foundation.Controls.Location.Current.prototype.ctor.call(this);
        this.$path = new Foundation.Controls.Group.Path(User.Service.Master.Location, this._root);
        this.$path.CanSelectSuper = true;
        this.$path.CanSelectCurrent = false;
        var $this = this;
        this.$path.Populated = function (location) {
            $this.notifyPopulated(location, false);
        }
        this.$path.GroupSelected = function (location) {
            Session.User.LocationId = location.Id;
            if (!$this.Change || !$this.Change(location))
                $this.Populate(location.Id);
        };
    },

    //Initialize: function (container) {
    //    Foundation.Controls.Location.Current.prototype.Initialize.call(this, container);
    //    this.$path.Initialize($('span.groupPath', this.$container));
    //},

    populate: function (location) {
        return this.$path.Populate(location, $('span.groupPath', this.$container));
    }
});

System.Type.RegisterNamespace('Controls.Category');

Controls.Category.Current = Foundation.Controls.Category.Current.extend({
    Container: '<span>' + Resource.Dictionary.Category + '&nbsp;<a id="category" data-Id="-1" data-command="changeCategory"></a></span>', //<span> -> <b>

    Id: function () {
        return $("#category", this.$container).attr('data-Id');
    },

    populate: function (categoryId) {
        if (categoryId > 0) {
            var $this = this;
            return User.Service.Master.Category.Get(categoryId, Model.Group.DisplayType.Text, function (category) {
                $("#category", $this.$container).text(category.Name).attr('data-Id', categoryId);
                $this.notifyPopulated(category, true); //Used to set Title and Keywords
            });
        }
        else {
            $("#category", this.$container).text(Resource.Global.Category_All).attr('data-Id', 0);
            this.notifyPopulated({ //Used to set Title and Keywords
                Id: 0,
                Name: Resource.Global.Category_All
            }, true);
        }
    }
});

Controls.Category.Current_Home = Foundation.Controls.Category.Current.extend({
    Container: '<span><span class="groupPath"></span>&nbsp;[<a class="group active" data-command="changeCategory">' + Resource.Action.Change + '</a>]</span>', //-<b>

    Id: function () {
        return this.$path ? this.$path.Id() : -1;
    },

    ctor: function () {
        Foundation.Controls.Category.Current.prototype.ctor.call(this);
        this.$select.CanSelectSuper = true;
        this.$path = new Foundation.Controls.Group.Path(User.Service.Master.Category, this._root);
        this.$path.CanSelectSuper = true;
        this.$path.CanSelectCurrent = false;
        var $this = this;
        this.$path.Populated = function (category) {
            $this.notifyPopulated(category, false);
        }
        this.$path.GroupSelected = function (category) {
            Session.User.CategoryId = category.Id;
            if (!$this.Change || !$this.Change(category))
                $this.Populate(category.Id);
        };
    },

    //Initialize: function (container) {
    //    Foundation.Controls.Location.Current.prototype.Initialize.call(this, container);
    //    this.$path.Initialize($('span.groupPath', this.$container));
    //},

    populate: function (category) {
        return this.$path.Populate(category, $('span.groupPath', this.$container));
    }
});

System.Type.RegisterNamespace('Controls.Image');
Controls.Image.FlipView = Foundation.Controls.Control.extend({

    Container: '<table class="imageFlipView"></table>',

    Template: jQuery.templates(
        '<tr>' +
            '<td>' +
                '<img id="image" itemprop="image"/>' +
            '</td>' +
        '</tr>' +
        '<tr id="flipButtons" style="display:none;">' +
            '<td style="text-align:center; padding-top: 10px;">' +
                '<a id="prevImage" class="rounded shadow active" data-command="FlipImageCommand" title="' + Resource.Global.Image_Previous + '"></a>' + //&#9668;
                '&nbsp;<a id="nextImage" class="rounded shadow active" data-command="FlipImageCommand" title="' + Resource.Global.Image_Next + '"></a>' + //&#9658;
            '</td>' +
        '</tr>'
    ),

    Initialize: function (container) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container, { tmplData: {} });
        this._flipButtons = $('#flipButtons', this.$container);
        this._prevImage = $('#prevImage', this._flipButtons);
        this._nextImage = $('#nextImage', this._flipButtons);
    },

    FlipImageCommand: function (_, imageButton) {
        if (getDisabled(imageButton))
            return;

        var index = imageButton.data('index');
        if (index == 0) {
            this.setPrevIndex(-1);
            this.setNextIndex(1);
        }
        else if (index == this._images.length - 1) {
            this.setPrevIndex(this._images.length - 2);
            this.setNextIndex(-1);
        }
        else if (0 < index && index < (this._images.length - 1)) {
            this.setPrevIndex(index - 1);
            this.setNextIndex(index + 1);
        }
        else {
            this.setPrevIndex(-1);
            this.setNextIndex(-1);

            this.setFlipButtonVisible(false);

            return;
        }

        this.setImage(index);
    },

    Populate: function (images, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        this._images = jQuery.map(images.Refs, function (ir) {
            return ir.Id;
        });
        this._entity = images.Entity;

        if (this._images.length > 0) {
            container.show();

            this.setImage(0);

            if (this._images.length > 1) {
                this.setPrevIndex(-1);
                this.setNextIndex(1);

                this.setFlipButtonVisible(true);
            }
        }
        else
            container.hide();
    },

    setPrevIndex: function (index) {
        this._prevImage.data('index', index);
        setDisabled(this._prevImage, index >= 0 ? false : true);
    },

    setNextIndex: function (index) {
        this._nextImage.data('index', index);
        setDisabled(this._nextImage, index >= 0 ? false : true);
    },

    setFlipButtonVisible: function (visibility) {
        if (visibility)
            this._flipButtons.show();
        else
            this._flipButtons.hide();
    },

    setImage: function (index) {
        this.$container.find('#image').attr('src', Model.Thumbnail.GetImageRef(this._entity, this._images[index], Settings.Image.Small));
    }
});
Controls.Image.List = Foundation.Controls.Control.extend({
    Container: '<div class="thumbnails" style="display: none;"></div>',

    Template: jQuery.templates(
        '<table class="thumbnail"><tr>' +
            '<td>' +
                '<a class="href" data-command="ItemCommand" data-itemIndex="{{:#index}}">{{:Name}}</a>' +
            '</td>' +
        '</tr>' +
        '<tr>' +
            '<td style="min-height=60px; min-width=55px;">' +
                '<img src="{{:ImageRef}}" />' +
            '</td>' +
        '</tr></table>'
    ),

    Populate: function (images, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        if (images && images.length > 0) {
            this.Items = images; //To use command, Param and #index without linking
            this.applyTemplate(images);
            this.Visible(true);
        }
    }
});

Controls.Image.Slider = Foundation.Controls.Control.extend({

    ctor: function () {
        Foundation.Controls.Control.prototype.ctor.call(this);
        this.pageSize = 8;
        this.currentPage = 0;
    },

    Container:
        '<table class="imageSlider" style="display:none; width:100%"><tbody>' +
            '<tr>' +
                '<td class="auto">' +
                    '<a id="prevPage" class="rounded shadow active" data-command="PrevCommand"></a>' + //&#9668;
                '</td>' +
                '<td><div class="thumbnails"></div></td>' +
                '<td class="auto">' +
                    '<a id="nextPage" class="rounded shadow active" data-command="NextCommand"></a>' + //&#9658;
                '</td>' +
            '</tr>' +
        '</tbody></table>',

    ItemTemplate: jQuery.templates(
        '<table class="thumbnail"><tr>' +
            '<td>' +
                '<a class="href" {{if NavToken}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-command="ItemCommand" data-itemIndex="{{:#index}}">{{:Name}}</a>' +
            '</td>' +
        '</tr>' +
        '<tr>' +
            '<td style="min-height=60px; min-width=55px;">' +
                '<img src="{{:ImageRef}}" />' +
            '</td>' +
        '</tr></table>'),

    Initialize: function (container, options) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container, options);
        this.$imageContainer = $('div.thumbnails', this.$container);
        this._prevPage = $('#prevPage', this.$container);
        this._nextPage = $('#nextPage', this.$container);
    },

    PageSize: function (pageSize) {
        if (pageSize != undefined) {
            this.pageSize = pageSize
        }
        else
            return this.pageSize;
    },

    PrevCommand: function (_) {
        if (this.currentPage > 0) {
            this.currentPage -= 1;
            this.populate();
        }
    },

    NextCommand: function (_) {
        this.currentPage += 1;
        this.populate();
    },

    Populate: function (provider, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        this._provider = provider;
        this.populate();
    },

    populate: function () {
        if (this._provider) {
            var $this = this;
            this._provider.GetItems(this.currentPage * this.pageSize, this.pageSize, function (queryOutput) {
                var data, remaining = 0;
                if (queryOutput) {
                    data = queryOutput.Thumbnails;
                    remaining = queryOutput.Remaining;
                }
                if ($this.currentPage == 0 && (!data || remaining <= 0)) {
                    if (data && (data.length > 0 || $this.ShowEmpty)) {
                        $this._prevPage.hide();
                        $this._nextPage.hide();

                        //$this.Items = data; //To use command, Param and #index without linking
                        //$this.$imageContainer.empty().append($this.ItemTemplate.render($this.Items));
                        $this.setItems(data);

                        $this.Visible(true);
                    }
                    else {
                        $this.Visible(false);
                    }
                }
                else if (data && data.length > 0) {
                    if (remaining > 0)
                        setDisabled($this._nextPage, false);
                    else //if !getDisabled($this._nextPage)
                        setDisabled($this._nextPage, true);

                    if ($this.currentPage > 0)
                        setDisabled($this._prevPage, false);
                    else //if !getDisabled($this._prevPage)
                        setDisabled($this._prevPage, true);

                    //$this.Items = data.slice(0, $this.pageSize); //To use command, Param and #index without linking
                    //$this.$imageContainer.empty().append($this.ItemTemplate.render($this.Items));
                    $this.setItems(data.slice(0, $this.pageSize));

                    $this.Visible(true);
                }
                //else {  //Could hapen if user clicks too fast
                //    throw 'Invalid Operation';
                //}
            });
        }
    },

    setItems: function (items) {
        if (items) {
            this.Items = items; //To use command, Param and #index without linking
            this.$imageContainer.empty().append(this.ItemTemplate.render(this.Items));
        }
        else {
            delete this.Items;
            this.$imageContainer.empty();
        }
    }
});

System.Type.RegisterNamespace('Controls.Product');

Controls.Product.ListView = Foundation.Controls.List.View.extend({
    Container:  '<table class="preview" style="width:100%">' +
                    '<thead><tr>' +
                        '<th id="Selectable" style="display:none;"></th>' +
                        '<th></th>' +
                        '<th>' + Resource.Dictionary.Description + '</th>' +
                        '<th id="Category">' + Resource.Dictionary.In + '</th>' +
                        '<th>' + Resource.Dictionary.Posted + '</th>' +
                        '<th id="Distance" style="display:none;">' + Resource.Dictionary.Distance + '</th>' +
                        '<th id="Status" style="display:none;">' + Resource.Dictionary.Status + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>',

    Template: $.templates(
        '<tr class="separated" data-rowPart="1of2">' +
            '<td rowspan="2" style="vertical-align:top;{{if ~DynamicColumns.Selectable}}" class="auto"><input type="checkbox" {{if Selected}}checked="checked"{{/if}} data-command="ItemSelectCommand" data-itemIndex="{{:#getIndex()}}"/>{{else}} display:none;">{{/if}}</td>' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.Thumbnail.Width}}px;"><img src="{{:Image.ImageRef}}" /></td>' +
            '<td><a {{if NavToken}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-command="ItemViewCommand" data-itemIndex="{{:#index}}">{{:Name}}</a>{{if ~isNullOrWhiteSpace(WebUrl) === false}}&nbsp;|&nbsp;<a href="{{:WebUrl}}" target="_blank">Web page</a>{{/if}}</td>' +
            '<td id="Category" {{if ~DynamicColumns.Category === false}}style="display:none;">{{else}}><a data-command="CategoryCommand" data-commandParam="Category" data-itemIndex="{{:#getIndex()}}">{{:Category.Name}}</a>{{/if}}</td>' +
            '<td>{{:~dateFormatter(Date)}}</td>' +
            '<td id="Distance" {{if ~DynamicColumns.Distance}}>{{:Distance}}{{else}}style="display:none;">{{/if}}</td>' +
            '<td id="Status" {{if ~DynamicColumns.Status}}>{{:StatusText}}{{else}}style="display:none;">{{/if}}</td>' +
        '</tr>' +
        '<tr data-rowPart="2of2">' +
            '<td colspan="5">' +
                '<table style="width:100%;"><tbody>' +
                '<tr>' +
                    '<td id="Account" {{if ~DynamicColumns.Account}}><a data-command="AccountCommand" data-commandParam="Account" data-itemIndex="{{:#getIndex()}}">{{:Account.Name}}</a>{{else}}style="display:none;">{{/if}}</td>' +
                    //'<td id="Side" {{if ~DynamicColumns.Side === false}}style="display:none;">{{else}}>{{:Side}}{{/if}}</td>' +
                    //'<td>{{:Price}}</td>' +
                    '<td id="Status" style="text-align:right;{{if ~DynamicColumns.Status && RejectReasonText}}">{{:RejectReasonText}}{{else}} display:none;">{{/if}}</td>' +
                '</tr>' +
                '{{if Text}}<tr><td colspan="2" style="padding-top:5px;">{{:Text}}</td></tr>{{/if}}' +
                '</tbody></table>' +
            '</td>' +
        '</tr>'
        ),

    TemplateOptions: function () {
        var options = Foundation.Controls.List.View.prototype.TemplateOptions.call(this);
        options.Settings = Settings;
        options.isNullOrWhiteSpace = String.isNullOrWhiteSpace;
        return options;
    },

    ItemViewCommand: function (product) {
        Navigation.Product.View(product.Account.AccountType, product.Account.Id, product.Id);
    },

    CategoryCommand: function (category) {
        Navigation.Product.Search(0, category.Id, undefined, Session.User.LocationId);
    },

    AccountCommand: function (account) {
        switch (account.AccountType) {
            case Model.AccountType.Personal:
                Navigation.Personal.ProfileView(account.Id);
                break;
            case Model.AccountType.Business:
                Navigation.Business.ProfileView(account.Id);
                break;
        }
    },

    Category: function (value) {
        this.ChangeColumnOption("Category", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    },

    Account: function (value) {
        this.ChangeColumnOption("Account", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    },

    Distance: function (value) {
        this.ChangeColumnOption("Distance", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    },

    Status: function (value) {
        this.ChangeColumnOption("Status", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    }
});

System.Type.RegisterNamespace('Controls.Action');
Controls.Action.Panel = Foundation.Controls.Control.extend({
    ctor: function () {
        Foundation.Controls.Control.prototype.ctor.call(this);
        this.Actions = [];
        if (Session.User.Id > 0)
            this.HeaderVisible(false);
        else
            this.HeaderVisible(true);
    },

    Container: '<div class="side right" style="margin-bottom:5px;"><span class="header" style="display:none;">' + Controls.SignIn.Prompt() + '</span><ul class="actions"></ul></div>',

    Initialize: function (container, options) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container, $.extend(options || {}, { 
            wireEvents: false
        }));
        var $this = this;
        this.$itemsContainer = $('ul', this.$container);
        this.$itemsContainer.delegate('a.action', 'click', function (e) {
            var index = parseInt($(this).closest('li').attr('data-itemIndex'));
            if (!isNaN(index) && $this.Actions.length > index && $this.Actions[index] instanceof Controls.Action.Interaction)
                $this.Actions[index].actionCommand($(this).attr('data-command'));
            else { //NewProduct action in Admin.Personal.Product(s)
                var command = $(this).attr('data-command');
                if (command)
                    Page.onCommand(command, $(this).attr('data-commandParam'));
            }
            return false;
        });
    },

    HeaderVisible: TemplateProperty('HeaderVisible', function () {
        return $('span.header', this.$container).css('display') != 'none' ? true : false;
    }, function (headerVisible) {
        if (headerVisible === true)
            $('span.header', this.$container).show();
        else if (headerVisible === false)
            $('span.header', this.$container).hide();
    }),

    Add: function (action, options) {
        var index = this.Actions.length;
        this.Actions.push(action);

        if (action instanceof Foundation.Controls.Action.ActionBase) {
            var container = $('<li data-itemIndex="' + index + '"></li>');
            if (options && options.separated)
                container.addClass("separated");
            action.Initialize(container);
            container.appendTo(this.$itemsContainer);
            action.StateChanged = jQuery.proxy(this.action_StateChanged, this);
        }
        else
            throw (String.format('The value "{0}" is not a type of "Foundation.Controls.Action.ActionBase" and cannot be used in this collection', action));
    },

    action_StateChanged: function () {
        this.EnsureVisibility();
    },

    EnsureVisibility: function () {
        var actions = $('li', this.$itemsContainer);
        for (var i = 0, l = actions.length; i < l; i++) {
            if ($(actions[i]).css('display') != 'none') {
                this.Visible(true);
                return;
            }
        }

        this.$container.hide();
    }
});

Controls.Action.Interaction = Foundation.Controls.Action.ActionBase.extend({
    //ActionTemplate: jQuery.templates('<a class="action{{if Enabled}} active{{/if}}">{{:Text}}</a>'),
    ActionTemplate: jQuery.templates('<a data-link="{:Text()} class{:~canExecute(Enabled())}"></a>'),

    Initialize: function (container, options) {
        Foundation.Controls.Action.ActionBase.prototype.Initialize.call(this, container, $.extend(options || {}, {
            tmplData: this,
            tmplOptions: {
                link: true,
                canExecute: this.canExecute
            }
        }));
        //moved to Foundation.Controls.Action.ActionBase.applyTemplate
        //this.$action = $('.action', this.$container);

        if (options && options.wireEvents) {
            var $this = this;
            this.$container.delegate('a.action', 'click', function (e) {
                $this.actionCommand($(this).attr('data-command'));
                return false;
            });
        }
    },

    canExecute: Foundation.Controls.Action.CanExecute,

    actionCommand: function (command) {
        if (this.$action.hasClass('active') && this.Enabled() && this.$popupForm)
            this.$popupForm.Show();
    },

    //Replaced with data-link
    //Text: function (text) {
    //    if (text != undefined) {
    //        Foundation.Controls.Action.ActionBase.prototype.Text.call(this, text);
    //        if (this.$action)
    //            this.$action.text(text);
    //    }
    //    else
    //        return Foundation.Controls.Action.ActionBase.prototype.Text.call(this);
    //},

    //Enabled: function (enabled) {
    //    if (enabled != undefined) {
    //        Foundation.Controls.Action.ActionBase.prototype.Enabled.call(this, enabled);
    //        if (enabled)
    //            this.$action.addClass('active');
    //        else
    //            this.$action.removeClass('active');
    //    }
    //    else
    //        return Foundation.Controls.Action.ActionBase.prototype.Enabled.call(this);
    //},

    Exercised: function (exercised) {
        if (exercised != undefined) {
            Foundation.Controls.Action.ActionBase.prototype.Exercised.call(this, exercised);
            if (this.ExercisedTemplate) {
                if (exercised) {
                    this.applyTemplate(this, {
                        link: true,
                        canExecute: this.canExecute
                    }, this.ExercisedTemplate, this.$container);
                    //this.$container.empty().append(this.ExercisedTemplate.render({ Text: this.Text(), Enabled: this.Enabled() }));
                    //this.$action = $('.action', this.$container);
                }
                else {
                    this.applyTemplate(this, {
                        link: true,
                        canExecute: this.canExecute
                    }, this.ActionTemplate, this.$container);
                    //this.$container.empty().append(this.ActionTemplate.render({ Text: this.Text(), Enabled: this.Enabled() }));
                    //this.$action = $('.action', this.$container);
                }
            }
        }
        else
            return Foundation.Controls.Action.ActionBase.prototype.Exercised.call(this);
    }
});

Controls.Action.SelfAction = Controls.Action.Interaction.extend({
    Type: function () {
        return Foundation.Controls.Action.Type.Self;
    },

    Addressee: function () {
        return Session.User.Id;
    }
});

Controls.Action.Message = Controls.Action.Interaction.extend({
    ExercisedTemplate: jQuery.templates('<span class="action">' + Resource.Global.Message_Sent + ' [<a data-link="class{:~canExecute(Enabled())}" data-command="AnotherMessage">' + Resource.Global.Message_Another + '</a>]</span>'),

    ctor: function () {
        Foundation.Controls.Action.ActionBase.prototype.ctor.call(this, new Controls.Message.Form());
        this.Text(Resource.Global.Message_Action);
    },

    actionCommand: function (command) {
        if (command == 'AnotherMessage')
            this.$popupForm.Another();
        else
            Controls.Action.Interaction.prototype.actionCommand.call(this, command);
    },

    Exercised: function (exercised) {
        if (exercised != undefined) {
            Controls.Action.Interaction.prototype.Exercised.call(this, exercised);
            if (!this.Enabled()) //To enable "Another Message" hyperlink
                this.Enabled(true);
        }
        else
            return Controls.Action.Interaction.prototype.Exercised.call(this);
    }
});

Controls.Action.JoinLeaveCommunity = Controls.Action.Interaction.extend({
    Type: function () {
        return Foundation.Controls.Action.Type.Self;
    },

    Addressee: function () {
        return Session.User.Id;
    },

    //ExercisedTemplate: jQuery.templates('<a class="action{{if Enabled}} active{{/if}}" data-command="LeaveCommunity">' + Resource.Community.Leave + '</a>'),
    ExercisedTemplate: jQuery.templates('<a data-link="class{:~canExecute(Enabled(), CanLeave)}" data-command="LeaveCommunity">' + Resource.Community.Leave + '</a>'),

    ctor: function (popupForm, confirmLeave) {
        if (!popupForm) {
            popupForm = new Foundation.Controls.Confirm.Form();
            popupForm.MessageFormat = Resource.Community.Confirm_Join;
            popupForm.OptionTemplate = '<table><tr><td><label for="memberType">' + Resource.Dictionary.Member_type + '</label>&nbsp;<select id="memberType" name="memberType"></select></td></tr>' +
                                       '<tr id="requestMessagePlaceholder" style="display:none;"><td style="padding-top:10px;"><center><textarea id="requestMessage" style="margin-top:5px; margin-bottom:5px;" placeholder="' + Resource.Community.Moderator_Message + '" rows="8" cols="35"></textarea></center></td></tr>' +
                                       '<tr id="noApprovalPlaceholder" style="display:none;"><td style="padding-top:10px;">' + Resource.Community.Approval_NotRequired + '</td></tr></table>';
            var memberType = new Controls.Community.Member.SelectType(popupForm, Model.Community.MemberType.Content_Producer);
            popupForm.OnApplyTemplate = function () {
                memberType.Container = $('#memberType', popupForm.$container);
                memberType.Initialize(memberType.Container);
                memberType.OnTypeChange = function (memberType) {
                    if (memberType) {
                        if (memberType == Model.Community.MemberType.Member && popupForm.Content.Open_To_Join) {
                            $('#requestMessagePlaceholder', popupForm.$container).hide();
                            $('#noApprovalPlaceholder', popupForm.$container).show();
                            return;
                        }
                        else {
                            $('#requestMessagePlaceholder', popupForm.$container).show();
                            $('#noApprovalPlaceholder', popupForm.$container).hide();
                            return;
                        }
                    }
                    $('#requestMessagePlaceholder', popupForm.$container).hide();
                    $('#noApprovalPlaceholder', popupForm.$container).hide();
                };
            };
        }
        Foundation.Controls.Action.ActionBase.prototype.ctor.call(this, popupForm);
        this.Text(Resource.Community.Join);
        this.ExercisedText = Resource.Community.Membership_Requested;
        if (!confirmLeave) {
            confirmLeave = new Foundation.Controls.Confirm.Form();
            confirmLeave.MessageFormat = Resource.Community.Confirm_Leave;
        }
        this.ConfirmLeave = confirmLeave;
    },

    canExecute: function (enabled, canLeave) {
        if (typeof canLeave == 'boolean') {
            if (canLeave)
                return 'action active';
        }
        else if (enabled === true)
            return 'action active';

        return 'action';
    },

    actionCommand: function (command) {
        if (command == 'LeaveCommunity') {
            if (this.CanLeave && this.ConfirmLeave) {
                this.ConfirmLeave.Show();
            }
        }
        else
            Controls.Action.Interaction.prototype.actionCommand.call(this, command);
    },

    Exercised: function (exercised) {
        if (exercised != undefined) {
            Controls.Action.Interaction.prototype.Exercised.call(this, exercised);
            if (!this.Enabled()) //To enable "Leave Community" hyperlink
                this.Enabled(true);
        }
        else
            return Controls.Action.Interaction.prototype.Exercised.call(this);
    }
});

System.Type.RegisterNamespace('Controls.Message');
Controls.Message.PersonalBusinessMessages = function (accountType, param) {
    if (accountType != undefined) {
        switch (param) {
            case '!':
                switch (accountType) {
                    case Model.AccountType.Business:
                        accountType = Model.AccountType.Personal;
                        break;
                    case Model.AccountType.Personal:
                        accountType = Model.AccountType.Business;
                        break;
                }
                break;
            /*case 'Received':
                switch (accountType) {
                    case Model.AccountType.Business:
                        return Resource.Business.Messages_Received;
                    case Model.AccountType.Personal:
                        return Resource.Personal.Messages_Received;
                }
                break;
            case 'Sent':
                switch (accountType) {
                    case Model.AccountType.Business:
                        return Resource.Business.Messages_Sent;
                    case Model.AccountType.Personal:
                        return Resource.Personal.Messages_Sent;
                }
                break;*/
        }
        switch (accountType) {
            case Model.AccountType.Business:
                return Resource.Business.Messages;
            case Model.AccountType.Personal:
                return Resource.Personal.Messages;
        }
    }
};

Controls.Message.Form = Foundation.Controls.Action.Message.extend({
    Template: jQuery.templates(
    '<form action="">' +
        '<div class="header">' +
            '<span>' + Resource.Global.Message_to + '</span>' +
            '&nbsp;<span id="to"></span>' +
        '</div>' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr style="display: none;">' +
                    //'<td class="label" style="vertical-align:top;">' + Resource.Dictionary.About + '</td>' +
                    '<td id="product" colspan="2" class="value" style="padding-bottom:10px;"></td>' +
                '</tr>' +
                '<tr>' +
                    '<td colspan="2">' +
                        '<textarea id="text" name="text" placeholder="' + Resource.Global.Message_Text + '" rows="12" cols="40"></textarea>' +
                    '</td>' +
                '</tr>' +
                '{{for ~FromBusiness.TemplateData tmpl=~FromBusiness.Template/}}' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel">' +
            '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Send + '</span></a>' +
            '&nbsp;&nbsp;' +
            '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>' +
    '</form>'
    ),

    ctor: function () {
        Foundation.Controls.Action.Message.prototype.ctor.call(this);
        this._locked = false;
    },

    To: function (to) {
        if (to != undefined) {
            $('#to', this.$container).text(to);
        }
    },

    Populate: function (page, to, product) {
        if (!this.$container)
            this.Initialize();

        this._page = page;
        if (page) {
            if (page._token.AccountType != to.AccountType || page._token.AccountId != to.Id || page._token.ProductId != (product ? product.Id : 0))
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
        }

        this.To(to.Name);

        if (product && !String.isNullOrWhiteSpace(product.Name)) {
            $('#product', this.$container).text(product.Name).parent('tr').show();
        }
        else
            $('#product', this.$container).text('').parent('tr').hide();
    },

    Validate: function (proceed) {
        if (this._locked) {
            this.$errorInfo.SetError('', this.GetErrorMessage(Foundation.ErrorMessageType.Data_DuplicateRecord, null));
            proceed(false);
        }
        else
            Foundation.Controls.Validation.PopupControl.prototype.Validate.call(this, proceed);
    },

    SubmitComplete: function (notifyExternal) {
        this._locked = true;
        Foundation.Controls.Validation.PopupControl.prototype.SubmitComplete.call(this, notifyExternal);
    },

    save: function (message) {
        message.Account = this._page._token.AccountId;
        message.AccountType = this._page._token.AccountType;
        var productId = this._page._token.ProductId;
        if (productId > 0)
            message.Product = productId;
    },

    Another: function () {
        this.Reset();
        this.Show();
    },

    Reset: function () {
        this._locked = false;
        Foundation.Controls.Action.Message.prototype.Reset.call(this);
        this._fromBusiness.Reset();
    }
});

System.Type.RegisterNamespace('Controls.Message.Reply');
Controls.Message.Reply.Form = Foundation.Controls.Action.Message.extend({

    AccountType: function (accountType) {
        if (accountType != undefined) {
            this.accountType = accountType;
            if (accountType == Model.AccountType.Business)
                this.Business(Session.User.Business.Id);
            else
                this.Business(0);
        }
        else
            return this.accountType;
    },

    Business: function (business) {
        if (business != undefined) {
            this.business = business;
            this.reflectBusiness();
        }
        else
            return this.business;
    },

    reflectBusiness: function() {
        if (this._fromBusiness && this._fromBusiness.$container)
        {
            this._fromBusiness.BusinessId(this.business);
            this._fromBusiness.IsPersonalEnabled(false);
        }
    },

    Initialize: function (options) {
        Foundation.Controls.Action.Message.prototype.Initialize.call(this, options);
        this.reflectBusiness();
    },

    Populate: function (message) {
        if (!this.$container)
            this.Initialize();

        if (message) {
            this.Message = message;

            this.reflectBusiness(); //Just in case

            //To = message.From.Name;

            //var subject = message.Subject;
            //if (!subject.Contains("Re:"))
            //    subject = "Re: " + subject;
            //Subject = subject;

            //if (message.Product != null)
            //{
            //    Product = message.Product.Name;
            //    if (ProductVisibility != Visibility.Visible)
            //        ProductVisibility = Visibility.Visible;
            //}
            //else if (ProductVisibility != Visibility.Collapsed)
            //    ProductVisibility = Visibility.Collapsed;
        }
    },

    save: function (message) {
        if (this.Message && this.AccountType()) {
            message.Account = this.Message.From.Id;
            message.AccountType = this.Message.From.AccountType;

            message.Reference = this.Message.Id;
            if (this.Message.Product)
                message.Product = this.Message.Product.Id;

            //message.Subject = Subject;
        }
        else
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
    },

    Closing: function () {
        if (this.Message) {
            delete this.Message;
            Foundation.Controls.Action.Message.prototype.Reset.call(this);
        }
        return Foundation.Controls.Validation.PopupControl.prototype.Closing.call(this);
    }
});

//similar to Controls.Community.Topic.Post.InlineForm
Controls.Message.Reply.InlineForm = Controls.Message.Reply.Form.extend({
    Template: jQuery.templates(
    '<form action="">' +
        '<table class="form"><tbody>' +
            '<tr>' +
                '<td class="label" style="vertical-align:top;">' + Resource.Dictionary.Your_reply + '</td>' +
                '<td colspan="2" class="value">' +
                    '<textarea id="text" name="text" placeholder="' + Resource.Dictionary.Text + '" rows="8" cols="70"></textarea>' +
                '</td>' +
            '</tr>' +
            '<tr>' +
                '<td rowspan="2" class="label" style="vertical-align:top;"><span class="fromBusiness" style="display: none;">' + Resource.Business.From + '</span></td>' +
                '<td class="value" style="font-weight:bold;"><span id="businessName" class="fromBusiness" style="display: none;"></span></td>' +
                '<td rowspan="2" class="buttonPanel right">' +
                    '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Send + '</span></a>' +
                    '&nbsp;&nbsp;' +
                    '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
                '</td>' +
            '</tr>' +
            '<tr>' +
                '<td class="value" style="vertical-align:top;"><span class="isPersonal" style="display: none;"><input type="checkbox" id="personalMessage" />&nbsp;' + Resource.Personal.Message + '</span></td>' +
            '</tr>' +
            '<tr>' +
                '<td colspan="3" id="error" style="display:none; text-align:center; padding-top:15px;">' +
                '</td>' +
            '</tr>' +
        '</tbody></table>' +
    '</form>'
    ),

    ctor: function () {
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this, { visible: false });
        this._fromBusiness = new Foundation.Controls.Action.FromBusiness(this);
    },

    Initialize: function (options) {
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, {
            tmplData: {}
        }));
        this._fromBusiness.Initialize(this.$container);
        this.reflectBusiness();
    }
});

Controls.Message.ListView = Foundation.Controls.List.View.extend({
    ctor: function () {
        this.selectable = true;
        Foundation.Controls.List.View.prototype.ctor.call(this);
    },

    AccountCommand: function (account) {
        if (account.AccountType === Model.AccountType.Business)
            Navigation.Business.ProfileView(account.Id);
        else if (account.AccountType === Model.AccountType.Personal)
            Navigation.Personal.ProfileView(account.Id);
    },

    ProductCommand: function (product) {
        Navigation.Product.View(product.AccountType, product.Account, product.Id);
    }
});

System.Type.RegisterNamespace('Controls.Message.Received');
Controls.Message.Received.ListView = Controls.Message.ListView.extend({
    Container: '<table class="preview" style="width:100%">' +
                    '<thead><tr>' +
                        '<th id="Selectable"></th>' +
                        '<th colspan="2">' + Resource.Dictionary.From + '</th>' +
                        '<th>' + Resource.Dictionary.About + '</th>' +
                        '<th style="text-align:right;">' + Resource.Dictionary.Date + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>',

    Template: $.templates(
        '<tr class="separated" data-rowPart="1of2">' +
            '<td rowspan="2" class="auto" style="vertical-align:top;"><input type="checkbox" data-link="Selected" data-command="ItemSelectCommand" data-itemIndex="{{:#index}}"/></td>' + //{{if Selected link=false}}checked="checked"{{/if}} jsViews throws error when tmpl is refreshed with Selected=true, so using data linking instead
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:From.Image.ImageRef}}" /></td>' +
            '<td style="text-align:left;"><a data-command="AccountCommand" data-commandParam="From" data-itemIndex="{{:#index}}">{{:From.Name}}</a></td>' +
            '<td>{{if Product link=false}}<a data-command="ProductCommand" data-commandParam="Product" data-itemIndex="{{:#getIndex()}}">{{:Product.Name}}</a>{{/if}}</td>' +
            '<td style="text-align:right;">{{:~dateFormatter(Date)}}</td>' +
        '</tr>' +
        '<tr data-rowPart="2of2">' +
            '<td colspan="2" style="text-align:left;">{{:Text}}</td>' +
            //style="display: table-cell; vertical-align: middle;"
            '<td style="text-align:right; float:right;">{{if SentBy link=false}}<a style="display:block;" data-command="AccountCommand" data-commandParam="SentBy" data-itemIndex="{{:#getIndex()}}">{{:SentBy.Name}}</a>{{/if}}' +
            '<span style="display:block;">{{if Replied link=false}}' + Resource.Dictionary.Replied + '{{else link=false}}[&nbsp;<a data-command="ReplyCommand" data-itemIndex="{{:#getIndex()}}" data-link="class{:~cssClassFromBool(~ReplyForm.Visible(), undefined, \'href\')}">' + Resource.Action.Reply + '</a>&nbsp;]{{/if}}</span></td>' +
        '</tr>'),

    ReplyTemplate: $.templates(
        '<tr class="separated" data-rowPart="1of3">' +
            '<td rowspan="2" class="auto" style="vertical-align:top;"><input type="checkbox" data-link="Selected" data-command="ItemSelectCommand" data-itemIndex="{{:#index}}"/></td>' + //{{if Selected link=false}}checked="checked"{{/if}} jsViews throws error when tmpl is refreshed with Selected=true, so using data linking instead
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:From.Image.ImageRef}}" /></td>' +
            '<td style="text-align:left;"><a data-command="AccountCommand" data-commandParam="From" data-itemIndex="{{:#index}}">{{:From.Name}}</a></td>' +
            '<td>{{if Product link=false}}<a data-command="ProductCommand" data-commandParam="Product" data-itemIndex="{{:#getIndex()}}">{{:Product.Name}}</a>{{/if}}</td>' +
            '<td style="text-align:right;">{{:~dateFormatter(Date)}}</td>' +
        '</tr>' +
        '<tr data-rowPart="2of3">' +
            '<td colspan="2" style="text-align:left;">{{:Text}}</td>' +
            '<td style="text-align:right; float:right;">{{if SentBy link=false}}<a data-command="AccountCommand" data-commandParam="SentBy" data-itemIndex="{{:#getIndex()}}">{{:SentBy.Name}}</a>{{/if}}</td>' +
        '</tr>' +
        '<tr data-rowPart="3of3">' +
            '<td colspan="5" id="reply"></td>' +
        '</tr>'),

    ReplyForm: function (replyForm) {
        this.replyForm = replyForm;
        var $this = this;
        replyForm.Cancel = function () {
            $this.Message(null);
            $this.replyForm.Hide();
        };

        replyForm.Submit = function () {
            $this.$message.Replied = true;
            $this.Message(null);
        };
    },

    TemplateOptions: function () {
        var options = Foundation.Controls.List.View.prototype.TemplateOptions.call(this);
        options.Settings = Settings;
        options.ReplyForm = this.replyForm;
        options.link = true;
        return options;
    },

    onItemsChanged: function () {
        if (this.$message) {
            this.replyForm.$container.detach();
            delete this.$message;
        }
    },

    //https://github.com/BorisMoore/jsviews/issues/89
    //could add link=false and remove .parent
    Message: function (value, elem) {
        if (this.$message)
        {
            this.replyForm.$container.detach();
            this.$messageView.tmpl = this.Template;
            this.$messageView.refresh(/*this.TemplateOptions()*/);
        }
        if (value) {
            this.$elem = elem;
            this.$message = value;
            this.$messageView = $.view(/*this.$message*/this.$elem)/*.parent*/;
            this.$messageView.tmpl = this.ReplyTemplate;
            var view = this.$messageView.refresh(/*this.TemplateOptions()*/);
            this.replyForm.$container.appendTo($('#reply', this.$contentContainer)/*view.content('#reply')*/);
        }
        else {
            delete this.$message;
            delete this.$messageView;
        }
    },

    ReplyCommand: function (message, elem) {
        if (!this.$message && !this.replyForm.Visible() && message && !message.Replied /*&& message.Account == (message.AccountType == Model.AccountType.Business ? Service.Session.Current.User.Business.Id : Service.Session.Current.User.Id)*/)
        {
            this.Message(message, elem);
            this.replyForm.Populate(message);
            this.replyForm.Show();
        }
    }
});

System.Type.RegisterNamespace('Controls.Message.Folder');
Controls.Message.Folder.Edit = Foundation.Controls.Folder.Edit.extend({
    NameLength: Settings.Personal.Message.Folder.MaxLength,

    Template: jQuery.templates(
    '<form action="">' +
        '<div class="header">' +
            '<span id="headerText"></span>' +
        '</div>' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr style="display:none;">' +
                    '<td class="label">' + Resource.Dictionary.Parent_folder + '</td>' +
                    '<td class="value" id="parentFolderName"></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label"><label id="nameText" for="folderName"></label></td>' +
                    '<td class="value">' +
                        '<input type="text" id="folderName" name="folderName" />' +
                    '</td>' +
                '</tr>' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel right">' +
            '<a id="submit" data-command="Submit" class="button active"><span class="button-content"></span></a>' +
            '&nbsp;&nbsp;' +
            '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>' +
    '</form>'
    ),

    ctor: function () {
        this.EntityName = Resource.Dictionary.Folder;
        Foundation.Controls.Folder.Edit.prototype.ctor.call(this);
    },

    Validate: function (proceed) {
        var $this = this;
        Foundation.Controls.Validation.PopupControl.prototype.Validate.call(this, function (valid) {
            Admin.Service.Interaction.Message.Folder.Exists($this.FolderName(), 0/*$this.$folder.Id rename only for now*/, function (exists) {
                if (exists) {
                    $this.$errorInfo.SetError('folderName', $this.GetErrorMessage(Foundation.ErrorMessageType.Data_DuplicateRecord));
                }
                else if (valid)
                    proceed(true);
            });
        });
    }
});

Controls.Message.Folder.TwoLevelSelect = Foundation.Controls.Folder.TwoLevelSelect.extend({
    ctor: function (popup) {
        Foundation.Controls.Folder.TwoLevelSelect.prototype.ctor.call(this, popup);
        this.NewItemText(Resource.Global.Folder_Create);
    },

    Addressee: function () {
        return Session.User.Id;
    },

    Type: function () {
        return Foundation.Controls.Action.Type.Self;
    },

    //parentFolder: function (folder, callback) {
    //    Admin.Service.Interaction.Message.Folder.GetParent(folder, callback);
    //},

    populateChildren: function (parentFolder, callback) {
        Admin.Service.Interaction.Message.Folder.Get(parentFolder, callback);
    }
});

System.Type.RegisterNamespace('Controls.Product.Availability');
Controls.Product.Availability.View = Class.define({

    Template: jQuery.templates(
    '{{if Locations && Locations.length > 0}}' +
        '<td class="label" style="vertical-align:top;">' + Resource.Dictionary.Availability + '</td>' +
        '<td class="values">' +
        '<table>{{for Locations}}' +
            '<tr><td class="value">{{:#data}}</td></tr>' +
        '{{/for}}</table></td>' +
    '{{/if}}'),

    Populate: function (locations, container) {
        if (container && !this.$container) {
            if (locations && locations.length > 0) {
                this.$container = container;
                this.$container.append(this.Template.render({ Locations: locations })).show();
            }
        }
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);
    }
});

System.Type.RegisterNamespace('Controls.Review');
Controls.Review.ListView = Foundation.Controls.List.View.extend({

    Container: '<table class="preview" style="width:100%">' +
                    '<tbody></tbody>' +
                '</table>',

    Template: $.templates(
        '<tr class="separated" data-rowPart="1of2">' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:From.Image.ImageRef}}" /></td>' +
            '<td style="text-align:left; vertical-align:middle;"><a data-command="AccountCommand" data-commandParam="From" data-itemIndex="{{:#index}}">{{:From.Name}}</a>' +
            '&nbsp;<div class="rateit" data-rateit-value="{{:Rating}}" data-rateit-ispreset="true" data-rateit-readonly="true"></div></td>' +
            '<td style="text-align:right;">{{:~dateFormatter(Date)}}</td>' +
            //'<td style="width:auto;"><a data-command="FlagCommand" data-itemIndex="{{:#index}}">{{:~Resource.Action.Flag}}</a></td>' +
        '</tr>' +
        '<tr data-rowPart="2of2">' +
            '<td colspan="2">{{:Text}}{{if ~CanEdit(#data)}}&nbsp;[&nbsp;<a data-command="EditCommand" data-itemIndex="{{:#getIndex()}}">{{:~Resource.Action.Edit}}</a>&nbsp;]{{/if}}</td>' +
        '</tr>'),

    AccountCommand: function (account) {
        if (account.AccountType === Model.AccountType.Business)
            Navigation.Business.ProfileView(account.Id);
        else if (account.AccountType === Model.AccountType.Personal)
            Navigation.Personal.ProfileView(account.Id);
    },

    Populate: function (data) {
        Foundation.Controls.List.ViewBase.prototype.Populate.call(this, data);
        $('div.rateit', this.$container).rateit();
    },

    TemplateOptions: function () {
        var options = Foundation.Controls.List.View.prototype.TemplateOptions.call(this);
        options.Resource = Resource;
        options.Settings = Settings;
        var user = Session.User.Id;
        if (user > 0) {
            options.CanEdit = function (review) {
                if (review.From.Id === (review.From.AccountType == Model.AccountType.Business ? Session.User.Business.Id : user))
                    return true;
                return false;
            };
        }
        else
            options.CanEdit = function () {
                return false;
            };
        return options;
    }
});

Controls.Review.Form = Foundation.Controls.Validation.PopupControl.extend({

    Template: jQuery.templates(
    '<form action="">' +
        '<div class="header">' +
            '<span>' + Resource.Global.Review_for + '</span>' +
            '&nbsp;<span id="to"></span>' +
        '</div>' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr>' +
                    '<td id="product" colspan="2" class="value" style="padding-bottom:10px;"></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="label"><label for="rating">' + Resource.Dictionary.Rating + '</label></td>' +
                    '<td class="value">' +
                        '<select id="rating" name="rating">' +
                            //having these affects the validation highlight/unhighlight - element is becoming an array with no name
                            //'<option value="0"></option>' + 
                            //'<option value="1">1</option>' +
                            //'<option value="2">2</option>' +
                            //'<option value="3">3</option>' +
                            //'<option value="4">4</option>' +
                            //'<option value="5">5</option>' +
                        '</select>' +
                        '<div class="rateit" id="ratingCtrl" data-rateit-resetable="false" data-rateit-backingfld="#rating"></div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td colspan="2">' +
                        '<textarea id="text" name="text" placeholder="' + Resource.Global.Review_Text + '" rows="12" cols="40"></textarea>' +
                    '</td>' +
                '</tr>' +
                '{{for ~FromBusiness.TemplateData tmpl=~FromBusiness.Template/}}' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel">' +
            '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Send + '</span></a>' +
            '&nbsp;&nbsp;' +
            '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>' +
    '</form>'
    ),

    ValidatorOptions: {
        rules: {
            //title: "required",
            text: "required",
            rating: "validateRating"
        },

        messages: {
            //title: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Title),
            text: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Global.Review_Text),
            rating: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Rating)
        },

        ignore: '' //to validate hidden rating select
    },

    validationElement: function (elementName) {
        if (elementName == "rating") {
            return this.$container.find('#ratingCtrl');
        }
    },

    ctor: function () {
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this);
        this._fromBusiness = new Foundation.Controls.Action.FromBusiness(this);
        this._fromBusiness.TemplateData = { BusinessPrompt: Resource.Business.From, PersonalPrompt: Resource.Personal.Review };
        this.reviewId = 0;
        this.$focusCtrl = '#text';
    },

    Initialize: function (options) {
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, {
            tmplData: {},
            tmplOptions: {
                FromBusiness: this._fromBusiness
            }
        }));
        this._fromBusiness.Initialize(this.$container);
        var $this = this;
        Foundation.Validator.addMethod("validateRating", function (value, element) {
            var rating = $this.Rating();
            if (!rating || rating <= 0)
                return false;
            else
                return true;
        });
        //http://rateit.codeplex.com/documentation
        $('#ratingCtrl', this.$container).rateit({
            min: 0,
            max: 5,
            step: 1
        });
        $("#ratingCtrl").bind('rated', function (event, value) {
            removeErrorTipsy($('label[for=rating].errorLabel', this.$container), $('#ratingCtrl', this.$container), true);
        });
    },

    To: function (to) {
        if (to != undefined) {
            $('#to', this.$container).text(to);
        }
    },

    //Title: function (title) {
    //    if (title != undefined) {
    //        $('#title', this.$container).val(title);
    //    }
    //    else
    //        return $('#title', this.$container).val();
    //},

    Text: function (text) {
        if (text != undefined) {
            $('#text', this.$container).val(text);
        }
        else
            return $('#text', this.$container).val();
    },

    Rating: function (rating) {
        if (rating != undefined) {
            $('#ratingCtrl', this.$container).rateit('value', Math.round(rating));
        }
        else {
            return Math.round($('#ratingCtrl', this.$container).rateit('value'));
        }
    },

    Populate: function (page, id, product) {
        if (arguments.length == 2 && typeof arguments[1] == "number") {
            var id = arguments[1];
            this._page = page;
            setDisabled(this.$submit, true);
            var $this = this;
            Admin.Service.Interaction.Review.Edit(page._token.ProductId, id, function (review) {
                if (review) {
                    if (review.From == Session.User.Id && (review.FromBusiness == 0 || review.FromBusiness == Session.User.Business.Id) && review.AccountType == page._token.AccountType && review.Account == page._token.AccountId && review.Product == page._token.ProductId) {
                        $this.reviewId = review.Id;
                        $this.from = review.From;
                        $this.updated = review.Updated;
                        $this._fromBusiness.BusinessId(review.FromBusiness);
                        if (review.From != Session.User.Id) {
                            if (review.FromBusiness == 0)
                                $this._fromBusiness.Visible(false);
                            else
                                $this._fromBusiness.IsPersonalEnabled(false);
                        }
                        //$this.Title(review.Title);
                        $this.Text(review.Text);
                        $this.Rating(review.Rating);
                        setDisabled($this.$submit, false);
                    }
                }
            }, jQuery.proxy(this.Invalidate, this));
        }
        else {
            var to = arguments[1], product = arguments[2];
            if (!this.$container)
                this.Initialize();

            this._page = page;
            if (page) {
                if (page._token.AccountType != to.AccountType || page._token.AccountId != to.Id || (product == undefined && page._token.ProductId != 0) || (product != undefined && page._token.ProductId != product.Id))
                    throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
            }

            this.To(to.Name);
            $('#product', this.$container).text(product.Name);
        }
    },

    GetErrorMessage: function (error, data) {
        if (error == Foundation.ErrorMessageType.Argument_ValueRequired && data == 'Rating')
            return String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Rating);
        else if (error == Foundation.ErrorMessageType.Data_DuplicateRecord)
            return String.format(Resource.Global.Editor_Error_processing_request_X, Resource.Global.Review_Exists);
        else
            return Foundation.Controls.Action.Message.prototype.GetErrorMessage.call(this, error, data);
    },

    OnSubmit: function () {
        var review = {};

        if (this.reviewId > 0) {
            review.Id = this.reviewId;
            review.From = this.from;
            review.Updated = this.updated;
        }
        else
            review.From = Session.User.Id;

        if(review.From == Session.User.Id)
            review.FromBusiness = this._fromBusiness.GetValue();
        else
            review.FromBusiness = this._fromBusiness.BusinessId();

        review.AccountType = this._page._token.AccountType;
        review.Account = this._page._token.AccountId;
        review.Product = this._page._token.ProductId;

        //review.Title = this.Title();
        review.Text = this.Text();
        review.Rating = this.Rating();
        if (review.Rating > 5)
            review.Rating = 5;
        else if (review.Rating < 1)
            review.Rating = 1;

        var $this = this;
        Admin.Service.Interaction.Review.Save(review, function (reviewId) {
            $this.SubmitComplete(true);
            $this.Reset();
        }, jQuery.proxy(this.Invalidate, this));
    },

    Closing: function () {
        if (this.reviewId > 0) {
            this.reviewId = 0;
            delete this.from;
            delete this.updated;
            this.Reset();
        }
        return Foundation.Controls.Validation.PopupControl.prototype.Closing.call(this);
    },

    Reset: function () {
        if (this.$container) {
            this._fromBusiness.Reset();
            //this.Title('');
            this.Text('');
            this.Rating(0);
        }
    }
});
    
System.Type.RegisterNamespace('Controls.Product.Attribute');

Controls.Product.Attribute.View = Class.define({

    Template: jQuery.templates(
    '<tr>' +
        '<td class="label">{{:Name}}</td>' +
        '<td class="value">{{:Value}}</td>' +
    '</tr>'),

    Populate: function (attributes, placeholder) {
        if (placeholder && !this.$container) {
            if (attributes && attributes.length > 0) {
                this.$container = this.Template.render(attributes);
                placeholder.replaceWith(this.$container);
            }
        }
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);
    }
});

System.Type.RegisterNamespace('Controls.Product.Option');
Controls.Product.Option.View = Class.define({

    Template: jQuery.templates(
    '{{if Options}}{{for Options}}' +
        '<tr><td class="label" style="vertical-align:top;">{{:Name}}</td>' +
        '<td class="values">' +
        '<table>{{for Values}}' +
            '<tr><td class="value">{{:Value}}&nbsp;{{:~GetDisplayPrice(Price.Value, Price.Type, Price.Currency)}}</td></tr>' +
        '{{/for}}</table>' +
    '{{/for}}{{/if}}'),

    Populate: function (options, placeholder) {
        if (placeholder && !this.$container) {
            if (options && options.length > 0) {
                this.$container = this.Template.render( { Options: options }, { GetDisplayPrice: Model.Product.Option.GetDisplayPrice });
                placeholder.replaceWith(this.$container);
            }
        }
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);
    }
});

Controls.Product.Report = Foundation.Controls.Action.DropDown.extend({
    populate: function (callback) {
        var data = [];
        for (var rr in Model.Product.RejectReason) {
            data.push({ Id: Model.Product.RejectReason[rr], Name: Resource.Product['RejectReason_' + rr] })
        }
        callback(data);
    }
});

Controls.Product.Status = Class.define({
    //Template: '<span style="display=none;">' + Resource.Dictionary.Status + ':&nbsp;<span id ="text"></span></span>' +
    //          '<span id="reason" style="display=none;">&nbsp;' + Resource.Dictionary.Reason + ': <span id ="reasonText"></span></span>',

    Initialize: function (container) {
        //this.$container = $(this.Template).appendTo(container);
        this.$container = container;
        this._text = $('#text', this.$container);
        this._reasonText = $('#reasonText', this.$container);
    },

    Text: function (text) {
        if (text != undefined) {
            this._text.text(text);
        }
        else
            return this._text.text();
    },

    ReasonText: function (reasonText) {
        if (reasonText != undefined) {
            this._reasonText.text(reasonText);
            $('#reason', this.$container).show();
        }
        else
            return this._reasonText.text();
    },

    Populate: function (product, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        this.Text(Model.Product.Profile.GetStatusText(product));
        var reasonText = Model.Product.Profile.GetRejectReasonText(product);
        if (reasonText != null)
            this.ReasonText(reasonText);

        this.$container.show();
    },

    Hide: function() {
        this.$container.hide();
    }
});

Controls.Product.Tags = Foundation.Controls.Control.extend({

    ctor: function () {
        Foundation.Controls.Control.prototype.ctor.call(this);
        this.Enabled = false;
    },

    Container: '<div class="side right" style="display: none;"></div>',

    Template: jQuery.templates(//a class="button flat active"
        '<span class="header">' + Resource.Dictionary.Search_tags + '</span>' +
        '<ul class="productTags">' +
        '{{if Tags}}{{for Tags}}' +
        '<li>{{:Name}}' +
            '{{if ~Enabled}}' +
            '{{if Own}}<a class="image-button active right" data-command="Demote" data-itemIndex="{{:#getIndex()}}"><span style="background-position: 0 -32px;"></span></a>' +
            '{{else}}<a class="image-button active right" data-command="Promote" data-itemIndex="{{:#getIndex()}}"><span style="background-position: 0 -16px;"></span></a>{{/if}}' +
            '{{/if}}' +
            '</li>' +
        '{{/for}}{{/if}}' +
        '{{if ~Enabled}}' +
        '<li style="padding:0; vertical-align:middle; position:relative;">' + //AdminOffencive.List -> AddCustom
            '<input type="text" id="newTag" style="width: 100px;"/>' +
            '<a class="image-button active right" style="position:absolute;" data-command="Add"><span class="add"></span></a>' +
        '</li>' +
        '{{/if}}' +
        '</ul>'
    ),

    //Initialize: function(container) {
    //    Foundation.Controls.Control.prototype.Initialize.call(this, container);
    //    this.$container.delegate('#newTag', 'change', function () {
    //        var newTag = this.value;
    //        if(newTag && newTag.length > 0)
    //            setDisabled($('...'), false).addClass('active');
    //        else
    //            setDisabled($('...'), true).removeClass('active');
    //    });
    //},

    Populate: function (product, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        var userId = Session.User.Id;
        if (product && product.Account && (userId > 0 || (product.Tags && product.Tags.length > 0))) {
            var account = product.Account;
            var tmplData = {};
            if ((product.Tags && product.Tags.length > 0)) {
                tmplData.Tags = product.Tags;
                this.Items = product.Tags;
            }
            else if (this.Items)
                delete this.Items;
            if (userId > 0) {
                if (!this.Enabled)
                    this.Enabled = true;
                if (product.Tags && product.Tags.length > 0) {
                    if ((account.AccountType == Model.AccountType.Business && account.Id == Session.User.Business.Id) || (account.AccountType == Model.AccountType.Personal && account.Id == userId)) {
                        tmplData.Tags = jQuery.map(product.Tags, function (t) {
                            t.Own = true;
                            return t;
                        });
                    }
                    else {
                        var $this = this;
                        Admin.Service.Product.Tag.Personalize(product.Id, product.Tags, function (personalizedTags) {
                            $this.applyTemplate({ Tags: personalizedTags }, { Enabled: $this.Enabled });
                            $this.Visible(true);
                        });
                        return;
                    }
                }
            }
            else {
                if (this.Enabled)
                    this.Enabled = false;

                if (tmplData.Tags) {
                    for (var i = 0, l = tmplData.Tags.length; i < l; i++)
                        tmplData.Tags[i].Own = false;
                }
            }

            this.applyTemplate(tmplData, { Enabled: this.Enabled });
            this.Visible(true);
        }
        else {
            if (this.Enabled)
                this.Enabled = false;
            this.applyTemplate({}, { Enabled: false });
            this.Visible(false);
        }
    },

    NewTag: function (newTag) {
        if (newTag != undefined) {
            $('#newTag', this.$container).val(newTag);
        }
        else
            return $('#newTag', this.$container).val();
    }
});

Controls.Product.Stats = Foundation.Controls.Control.extend({
    Container: '<div class="side right" style="display: none;"></div>',

    Template: $.templates('<span class="header">' + Resource.Product.Summary + '</span><ul class="productStats">' +
        '<li>' + Resource.Product.Stats_Total + ' {{:Total}} / {{:TotalQuota}}</li>' +
        '<li>' + Resource.Product.Stats_Active + ' {{:Active}} / {{:ActiveQuota}}</li>' +
        '<li>' + Resource.Product.Stats_Pending + ' {{:Pending}} / {{:PendingQuota}}</li>' +
        '<li>' + Resource.Product.Stats_Inactive + ' {{:Inactive}}</li>' +
    '</ul>'),

    Populate: function (stats, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        if (stats) {
            this.Count = stats;
            this.applyTemplate(stats);
            $.observable(this).setProperty('CanList', stats.CanList());
            this.Visible(true);
        }
    }
});

System.Type.RegisterNamespace('Controls.Address');
Model.Address.Requirement = {
    None: 0,
    Country: 1,
    City: 2,
    PostalCode: 3,
    StreetAddress: 4
};
Controls.Address.View = Foundation.Controls.Control.extend({
    Container: '<tr style="display:none;" itemprop="address" itemscope itemtype="http://schema.org/PostalAddress"></tr>',

    Template: jQuery.templates(
    '<td class="label" style="vertical-align:top;">' + Resource.Dictionary.Location + '</td>' +
    '<td class="values">' +
        '<table><tbody>' +
            '<tr>' +
                '<td class="value" id="location"></td>' + //itemprop="addressLocality"
                '<td class="value" style="vertical-align:top;" rowspan="3"><a class="form-button active" style="display:none;" id="map" data-command="Map"><span class="button-content">' + Resource.Action.Map + '</span></a></td>' +
            '</tr>' +
            '<tr style="display:none;">' +
                '<td class="value" id="streetAddress"></td>' + //itemprop="streetAddress"
            '</tr>' +
            '<tr style="display:none;">' +
                '<td class="value" id="address1"></td>' +
            '</tr>' +
        '</tbody></table>' +
    '</td>'),

    Populate: function (location, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        if (!location)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.ValueRequired, "Location");

        this.GeoLocation = location; //To use command, Param and #index without linking
        this.applyTemplate();

        var address = location.Address;
        var checkAddress1 = true;
        if (address.City) {
            $('#location', this.$container).html('<span itemprop="addressLocality">' + address.City + '</span>, <span itemprop="addressRegion">' + address.State + '</span>, <span itemprop="addressCountry">' + address.Country + '</span>');
            if (address.StreetName) {
                if (address.StreetNumber) {
                    var streetAddress;
                    if (address.Address1 && address.Address1.length <= Settings.Location.Address1Threshold)
                    {
                        streetAddress = '<span itemprop="streetAddress">' + address.StreetNumber + ' ' + address.StreetName + '</span> <span>' + address.Address1 + '</span>';
                        checkAddress1 = false;
                    }
                    else
                        streetAddress = '<span itemprop="streetAddress">' + address.StreetNumber + ' ' + address.StreetName + '</span>';

                    if (address.PostalCode)
                        $('#streetAddress', this.$container).html(streetAddress + ', <span itemprop="postalCode">' + address.PostalCode + '</span>').parent('tr').show();
                    else
                        $('#streetAddress', this.$container).html(streetAddress).parent('tr').show();
                }
                else if (address.PostalCode) {
                    $('#streetAddress', this.$container).html('<span itemprop="streetAddress">' + address.StreetName + '</span>, <span itemprop="postalCode">' + address.PostalCode + '</span>').parent('tr').show();
                }
                else {
                    $('#streetAddress').html('<span itemprop="streetAddress">' + address.StreetName + '</span>').parent('tr').show();
                }

                if (checkAddress1 && address.Address1) {
                    $('#address1', this.$container).text(address.Address1).parent('tr').show();
                    //$('#location', this.$container).prev().attr('rowspan', '3');
                }
                //else
                //    $('#location', this.$container).prev().attr('rowspan', '2');

                $('#map', this.$container).show();
            }
            else if (address.PostalCode) {
                $('#streetAddress', this.$container).html('<span itemprop="postalCode">' + address.PostalCode + '</span>').parent('tr').show();
                //$('#location', this.$container).prev().attr('rowspan', '2');
                $('#map', this.$container).show();
            }
        }
        else if (address.State) {
            $('#location', this.$container).text(address.State + ', ' + address.Country);
        }
        else if (address.Country) {
            $('#location', this.$container).text(address.Country);
        }
        else
            return;

        this.Visible(true);
    },

    Map: function () {
        var location = this.GeoLocation;
        if (location && location.Address) {
            var marker = { Address: location.Address };
            if (this.PlaceName)
                marker.PlaceName = this.PlaceName;
            if (location.Geolocation)
                marker.Geolocation = location.Geolocation;
            Foundation.Controls.Geocoder.ShowMap(Foundation.Controls.Geocoder.MapType.View, JSON.stringify(marker));
        }
    }
});

System.Type.RegisterNamespace('Controls.Personal.List');
Controls.Personal.List.Select = Foundation.Controls.Action.DropDown.extend({
    ctor: function (popup) {
        Foundation.Controls.Action.DropDown.prototype.ctor.call(this, popup);
        this.NewItemText(Resource.Personal.List_Create);
    },

    populate: function (callback) {
        Admin.Service.Personal.List.Get(callback);
    }
});

Controls.Personal.List.Edit = Foundation.Controls.Folder.Edit.extend({
    NameLength: Settings.Personal.List.MaxLength,

    Template: jQuery.templates(
    '<form action="">' +
        '<div class="header">' +
            '<span id="headerText"></span>' +
        '</div>' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;"><label id="nameText" for="folderName"></label></td>' +
                    '<td class="value">' +
                        '<textarea id="folderName" name="folderName" class="textWrap" cols="25" rows="2"></textarea>' +
                    '</td>' +
                '</tr>' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel right">' +
            '<a id="submit" data-command="Submit" class="button active"><span class="button-content"></span></a>' +
            '&nbsp;&nbsp;' +
            '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>' +
    '</form>'
    ),

    ctor: function () {
        this.EntityName = Resource.Personal.List;
        Foundation.Controls.Folder.Edit.prototype.ctor.call(this, {
            Create: Resource.Personal.List_Create,
            Rename: Resource.Personal.List_Rename
        }, {
            Create: Resource.Personal.List_Name_New,
            Rename: Resource.Personal.List_Name_New
        });
    },

    Validate: function (proceed) {
        var $this = this;
        Foundation.Controls.Validation.PopupControl.prototype.Validate.call(this, function (valid) {
            Admin.Service.Personal.List.Exists($this.FolderName(), 0/*$this.$folder.Id rename only for now*/, function (exists) {
                if (exists) {
                    $this.$errorInfo.SetError('folderName', $this.GetErrorMessage(Foundation.ErrorMessageType.Data_DuplicateRecord));
                }
                else if (valid)
                    proceed(true);
            });
        });
    }
});

System.Type.RegisterNamespace('Controls.Business');
Controls.Business.ListView = Foundation.Controls.List.View.extend({
    Container: '<table class="preview" style="width:100%">' +
                '<thead><tr>' +
                    '<th></th>' +
                    '<th>' + Resource.Dictionary.Business + '</th>' +
                    '<th id="Category">' + Resource.Dictionary.In + '</th>' +
                    '<th colspan="2"></th>' +
                    '<th id="Distance" style="display:none;">' + Resource.Dictionary.Distance + '</th>' +
                '</tr></thead>' +
               '<tbody></tbody>' +
               '</table>',

    Template: $.templates(
        '<tr class="separated" data-rowPart="1of2">' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:Image.ImageRef}}" /></td>' +
            '<td><a {{if NavToken}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-command="ItemViewCommand" data-itemIndex="{{:#index}}">{{:Name}}</a></td>' +
            '<td id="Category" {{if ~DynamicColumns.Category === false || !Category}}style="display:none;">{{else}}><a data-command="CategoryCommand" data-commandParam="Category" data-itemIndex="{{:#getIndex()}}">{{:Category.Name}}</a>{{/if}}</td>' +
            '<td>{{if ProductsView link=false}}<a {{if ProductsNavToken}}href="{{:~Navigation.Main.Href(ProductsNavToken)}}" {{/if}}data-command="ProductsCommand" data-itemIndex="{{:#getIndex()}}">' + Resource.Dictionary.Products + '</a>{{/if}}</td>' +
            '<td>{{:Phone}}</td>' +
            '<td id="Distance" {{if ~DynamicColumns.Distance}}>{{:Distance}}{{else}}style="display:none;">{{/if}}</td>' +
        '</tr>' +
        '<tr data-rowPart="2of2">' +
            '<td colspan="5">' +
                '<table style="width:100%;"><tbody>' +
                '<tr>' +
                    '<td><a data-command="MapCommand" data-itemIndex="{{:#index}}">{{:~Stringify(Location.Address)}}</a></td>' +
                    '<td style="text-align:right;{{if ~isNullOrWhiteSpace(WebSite) === false}}"><a href="{{:WebSite}}" target="_blank">{{:WebSite}}</a>{{else}} display:none;">{{/if}}</td>' +
                '</tr>' +
                '{{if Text}}<tr><td colspan="2" style="padding-top:5px;">{{:Text}}</td></tr>{{/if}}' +
                '</tbody></table>' +
            '</td>' +
        '</tr>'),

    ItemViewCommand: function (business) {
        Navigation.Business.ProfileView(business.Id);
    },

    CategoryCommand: function (category) {
        if (category)
            Navigation.Business.Search(category.Id, undefined, Session.User.LocationId);
    },

    ProductsCommand: function (business) {
        Controls.Business.ListView.ViewProducts(business);
    },

    MapCommand: function (business) {
        var location = business.Location;
        if (location && location.Address) {
            var marker = { Address: location.Address, PlaceName: business.Name };
            if (location.Geolocation)
                marker.Geolocation = location.Geolocation;
            Foundation.Controls.Geocoder.ShowMap(Foundation.Controls.Geocoder.MapType.View, JSON.stringify(marker));
        }
    },

    Category: function (value) {
        this.ChangeColumnOption("Category", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    },

    Distance: function (value) {
        this.ChangeColumnOption("Distance", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    },

    TemplateOptions: function () {
        var options = Foundation.Controls.List.View.prototype.TemplateOptions.call(this);
        options.Settings = Settings;
        options.isNullOrWhiteSpace = String.isNullOrWhiteSpace;
        options.Stringify = Service.Geocoder.Stringify;
        return options;
    }
});

//Succeeded by Navigation.Business.ViewProducts
Controls.Business.ListView.ViewProducts = function (business, options) {
    switch (business.ProductsView) {
        case Model.Business.ProductsView.ProductList:
            return Navigation.Product.ListView(Model.AccountType.Business, business.Id, null, options);
            break;
        case Model.Business.ProductsView.Multiproduct:
            return Navigation.Business.ProfileView(business.Id, $.extend(options || {}, { navigationFlags: Model.Session.NavigationFlags.Tab_Products }));
            break;
        case Model.Business.ProductsView.ProductCatalog:
            return Navigation.Business.CatalogView(business.Id, 0, options);
            break;
    }
};

System.Type.RegisterNamespace('Controls.Community');
Controls.Community.Select = Foundation.Controls.Action.DropDown.extend({
    ctor: function (popup) {
        Foundation.Controls.Action.DropDown.prototype.ctor.call(this, popup);
        this.NewItemText(Resource.Community.Create);
        this.MemberType(Model.Community.MemberType.Moderator);
    },

    MemberType: function (memberType) {
        if (memberType != undefined) {
            switch (memberType) {
                case Model.Community.MemberType.Moderator:
                    this.memberType = 'Moderator';
                    break;
                case Model.Community.MemberType.Content_Producer:
                    this.memberType = 'Content_Producer';
                    break;
                default:
                    throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "MemberType");
            }
        }
        else
            return this.memberType;
    },

    Ready: function () {
        return this.Actor() > 0 && (!(this.Page instanceof View.IAccount) || this.Addressee() > 0) ? true : false;
    },

    NotApplicable: function () {
        //when used to invite, need to check if invitee is not the user
        return this.Page instanceof View.IAccount && this.Actor() == this.Addressee() ? true : false;
    },

    populate: function (callback) {
        Admin.Service.Community.Profile.GetByMembership(this.MemberType(), callback);
    }
});

Controls.Action.CommunityProduct = Controls.Community.Select.extend({
    ctor: function (popupForm) {
        if (!popupForm) {
            popupForm = new Foundation.Controls.Confirm.Form();
            popupForm.MessageFormat = Resource.Community.Ad_Confirm_Publish;
            popupForm.OptionTemplate = '<table><tr><td class="label"><label for="communityCategory">' + Resource.Dictionary.Category + '</label>&nbsp;</td><td class="value" id="communityCategoryPlaceholder"><select id="communityCategory" name="communityCategory" style="display:none;"></select>' +
                                       '<tr id="textPlaceholder"><td colspan="2" style="padding-top:10px;"><center><textarea id="productText" name="productText" class="textWrap" placeholder="' + Resource.Community.Ad_Text + '" rows="8" cols="35"></textarea></center></td></tr>' +
                                       '<tr><td colspan="2" class="value" style="padding-top:10px;"><input type="checkbox" id="overwrite" name="overwrite" />&nbsp;' + Resource.Global.Overwrite_if_exists + '</td></tr></table>';
            popupForm.ValidatorOptions = {
                rules: {
                    communityCategory: "validateCommunityCategory",
                    productText: {
                        maxlength: 500
                    }
                },

                messages: {
                    communityCategory: String.format(Resource.Global.Editor_Error_Select_X, Resource.Community.Category)
                },

                ignore: '' //to validate hidden communityCategory select
            };
            popupForm.validationElement = function (elementName) {
                if (elementName == "communityCategory") {
                    return $this.CommunityCategory.$dropDown.$container;
                }
            };
            Foundation.Validator.addMethod("validateCommunityCategory", function (value, element) {
                if ($this.CommunityCategory.Value) {
                    if ($this.CommunityCategory.Value.Locked) {
                        return Resource.Community.Category_Locked;
                    }
                }
                else //if (!$this.CommunityCategory.Allow_PostProducts_Uncategorized)
                    return String.format(Resource.Global.Editor_Error_Select_X, Resource.Community.Category);

                return true;
            });
        }
        Controls.Community.Select.prototype.ctor.call(this, popupForm);
        this.MemberType(Model.Community.MemberType.Content_Producer);
        this.Text(Resource.Product.Post_to_Community);
        this.$popupForm.TextVisible = true;
        this.CommunityCategory = new Controls.Community.Category.TwoLevelSelect_Post(popupForm);
        this.CommunityCategory.Text(Resource.Global.Category_Select);
        var $this = this;
        popupForm.OnApplyTemplate = function () {
            $this.CommunityCategory.Container = $('#communityCategoryPlaceholder', popupForm.$container);
            $this.CommunityCategory.Initialize($this.CommunityCategory.Container);
            if (!popupForm.TextVisible) {
                $('#textPlaceholder', popupForm.$container).hide();
            }
        };
        this.CommunityCategory.ItemSelected = function () {
            //unless we unbind mouse events, tipsy will still show with 'undefined' text
            //removeErrorTipsy($('label[for=communityCategory].errorLabel', $this.confirmCommunity.$container), $this.confirmCommunity_Category.$dropDown.$container)
        };
    }
});

Controls.Community.PersonalBusinessCommunities = function (accountType, param) {
    if (accountType != undefined) {
        if (param && param == '!') {
            switch (accountType) {
                case Model.AccountType.Business:
                    accountType = Model.AccountType.Personal;
                    break;
                case Model.AccountType.Personal:
                    accountType = Model.AccountType.Business;
                    break;
            }
        }
        switch (accountType) {
            case Model.AccountType.Business:
                return Resource.Business.Communities;
            case Model.AccountType.Personal:
                return Resource.Personal.Communities;
        }
    }
};

Controls.Community.ListView = Foundation.Controls.Community.ListView.extend({
    Container: '<table class="preview" style="width:100%">' +
                    '<thead><tr>' +
                        '<th colspan="2">' + Resource.Dictionary.Business + '</th>' +
                        '<th colspan="3">' + Resource.Dictionary.Community + '</th>' +
                        '<th id="Membership" style="display:none;">' + Resource.Dictionary.Membership + '</th>' +
                        '<th id="Distance" style="display:none;">' + Resource.Dictionary.Distance + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>',

    Template: $.templates(
        '{{if Business}}<tr class="separated" data-rowPart="1of3">' +
            '<td colspan="7" style="text-align:left;"><a {{if Business.NavToken}}href="{{:~Navigation.Main.Href(Business.NavToken)}}" {{/if}}data-command="BusinessCommand" data-itemIndex="{{:#getIndex()}}">{{:Business.Name}}</a></td>' +
        '</tr>{{/if}}' +
        '<tr{{if Business}} data-rowPart="2of3">{{else}} class="separated" data-rowPart="1of2">{{/if}}' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;">{{if Business}}<img src="{{:Business.Image.ImageRef}}" />{{/if}}</td>' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.Thumbnail.Width}}px;"><img src="{{:Image.ImageRef}}" /></td>' +
            '<td><a {{if NavToken}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-command="ItemViewCommand" data-itemIndex="{{:#index}}">{{:Name}}</a></td>' +
            '<td>{{if ~ForumsVisible(#data)}}<a data-command="ForumsCommand" data-itemIndex="{{:#getIndex()}}">' + Resource.Dictionary.Forums + '</a>{{/if}}</td>' +
            '<td>{{if ~ProductsVisible(#data)}}<a data-command="ProductsCommand" data-itemIndex="{{:#getIndex()}}">' + Resource.Dictionary.Ads + '</a>{{/if}}</td>' +
            '<td id="Membership" {{if ~DynamicColumns.Membership}}>' +
                '{{:~dateFormatter(Membership.Date)}}' +
                '{{if Membership.Pending}}' +
                    '(' + Resource.Dictionary.Pending + ')' +
                '{{/if}}' +
            '{{else}}style="display:none;">{{/if}}</td>' +
            '<td id="Distance" {{if ~DynamicColumns.Distance}}>{{:Distance}}{{else}}style="display:none;">{{/if}}</td>' +
        '</tr>' +
        '<tr{{if Business}} data-rowPart="3of3">{{else}} data-rowPart="2of2">{{/if}}' +
            '<td colspan="3" style="text-align:left;">' +
                '<table><tbody>' +
                '{{if Location}}<tr><td>' +
                    '<a data-command="MapCommand" data-itemIndex="{{:#getIndex()}}">{{:~Stringify(Location.Address)}}</a>' +
                '</td></tr>{{/if}}' +
                '{{if Text}}<tr><td {{if Location}} style="padding-top:5px;"{{/if}}>{{>Text}}</td></tr>{{/if}}' +
                '</tbody></table>' +
            '</td>' +
            '<td id="Membership" {{if ~DynamicColumns.Membership}}>' +
                '<table><tbody>' +
                '<tr><td>' +
                    '{{:~memberTypeConverter(Membership.Type)}}' +
                '</td></tr>' +
                '{{if Membership.Type != ~memberType.Owner}}<tr><td>' +
                    '<a data-command="Leave" data-itemIndex="{{:#getIndex()}}">' + Resource.Action.Leave + '</a>' +
                '</td></tr>{{/if}}' +
                '</tbody></table>' +
            '{{else}}style="display:none;">{{/if}}</td>' +
            '<td {{if ~DynamicColumns.Distance}}>{{else}}style="display:none;">{{/if}}</td>' +
        '</tr>'),

    ConfirmLeave: function (confirmLeave) {
        var $this = this;
        if (confirmLeave != undefined) {
            this.confirmLeave = confirmLeave;
            confirmLeave.Submit = function () {
                if (Session.User.Id > 0 && typeof $this.confirmLeave.CommandArgument == "number") {
                    var community = $this.confirmLeave.CommandArgument;

                    Admin.Service.Community.Membership.LeaveCommunity(community, function (success) {
                        $this.confirmLeave.SubmitComplete();

                        if (success && $this.Refresh)
                            $this.Refresh();
                    }, jQuery.proxy($this.confirmLeave.Invalidate, $this.confirmLeave));
                }
            };
        }
        else
            return this.confirmLeave;
    },

    BusinessCommand: function (community) {
        if (community.Business)
            Navigation.Business.ProfileView(community.Business.Id);
    },

    Leave: function (community) {
        if (community.Membership && community.Membership.Type > 0 && community.Membership.Type != Model.Community.MemberType.Owner) {
            this.confirmLeave.Content["Community"] = community.Name;
            this.confirmLeave.CommandArgument = community.Id;
            this.confirmLeave.Show();
        }
    },

    Membership: function (value) {
        this.ChangeColumnOption("Membership", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    },

    Distance: function (value) {
        this.ChangeColumnOption("Distance", (value ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
    }
});

Controls.Community.Requests = Foundation.Controls.Community.ListView.extend({
    Container: '<table class="preview" style="width:100%">' +
                    '<thead><tr>' +
                        '<th>' + Resource.Dictionary.From + '</th>' +
                        '<th colspan="4">' + Resource.Dictionary.Community + '</th>' +
                        '<th colspan="2" style="text-align:left;">' + Resource.Dictionary.Membership_request + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>',

    Template: $.templates(
        '<tr class="separated" data-rowPart="1of3">' +
            '<td colspan="5" style="text-align:left;"><a data-command="AccountCommand" data-commandParam="MembershipRequest" data-itemIndex="{{:#index}}">{{:MembershipRequest.From.Name}}</a></td>' +
            '<td>{{:~dateFormatter(MembershipRequest.Date)}}</td>' +
            '<td><a data-command="Accept" data-itemIndex="{{:#index}}">' + Resource.Action.Accept + '</a></td>' +
        '</tr>' +
        '<tr data-rowPart="2of3">' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:MembershipRequest.From.Image.ImageRef}}" /></td>' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.Thumbnail.Width}}px;"><img src="{{:Image.ImageRef}}" /></td>' +
            '<td><a data-command="ItemViewCommand" data-itemIndex="{{:#index}}">{{:Name}}</a></td>' +
            '<td>{{if ~ForumsVisible(#data)}}<a data-command="ForumsCommand" data-itemIndex="{{:#getIndex()}}">' + Resource.Dictionary.Forums + '</a>{{/if}}</td>' +
            '<td>{{if ~ProductsVisible(#data)}}<a data-command="ProductsCommand" data-itemIndex="{{:#getIndex()}}">' + Resource.Dictionary.Ads + '</a>{{/if}}</td>' +
            '<td>{{:~memberTypeConverter(MembershipRequest.Type)}}</td>' +
            '<td><a data-command="Decline" data-itemIndex="{{:#index}}">' + Resource.Action.Decline + '</a></td>' +
        '</tr>' +
        '<tr data-rowPart="3of3">' +
            '<td colspan="3" style="text-align:left;">' +
                '<table><tbody>' +
                '{{if Location}}<tr><td>' +
                    '<a data-command="MapCommand" data-itemIndex="{{:#getIndex()}}">{{:~Stringify(Location.Address)}}</a>' +
                '</td></tr>{{/if}}' +
                '{{if Text}}<tr><td {{if Location}} style="padding-top:5px;"{{/if}}>{{>Text}}</td></tr>{{/if}}' +
                '</tbody></table>' +
            '</td>' +
            '<td colspan="2">{{if MembershipRequest.Text}}{{:MembershipRequest.Text}}{{/if}}</td>' +
        '</tr>'),

    ConfirmApprove: function (confirmApprove) {
        var $this = this;
        if (confirmApprove != undefined) {
            this.confirmApprove = confirmApprove;
            confirmApprove.Submit = function () {
                if (Session.User.Id > 0 && typeof $this.confirmApprove.CommandArgument == "object") {
                    var communityRequest = $this.confirmApprove.CommandArgument;
                    var confirmMembership_Type = $this.confirmApprove.Content.Type;

                    if (communityRequest.Community > 0 && confirmMembership_Type > 0) {
                        Admin.Service.Community.Membership.AcceptRequest(communityRequest.Id, communityRequest.Community, communityRequest.Member, confirmMembership_Type, function (success) {
                            $this.confirmApprove.SubmitComplete();

                            if (success && $this.Refresh)
                                $this.Refresh();
                        }, jQuery.proxy($this.confirmApprove.Invalidate, $this.confirmApprove));
                    }
                }
            };
            confirmApprove.Error = function (error, data) {
                if (error == Foundation.ErrorMessageType.Operation_InvalidInteraction)
                    return Resource.Community.Business_Mismatch_Moderator;
            };
        }
        else
            return this.confirmApprove;
    },

    ConfirmDecline: function (confirmDecline) {
        var $this = this;
        if (confirmDecline != undefined) {
            this.confirmDecline = confirmDecline;
            confirmDecline.Submit = function () {
                if (Session.User.Id > 0 && typeof $this.confirmDecline.CommandArgument == "object") {
                    var communityRequest = $this.confirmDecline.CommandArgument;

                    if (communityRequest.Invitation) {
                        Admin.Service.Community.Membership.DeclineInvitation(communityRequest.Id, communityRequest.Community, false, function (success) {
                            $this.confirmDecline.SubmitComplete();

                            if (success && $this.Refresh)
                                $this.Refresh();
                        }, jQuery.proxy($this.confirmDecline.Invalidate, $this.confirmDecline));
                    }
                    else {
                        Admin.Service.Community.Membership.DeclineRequest(communityRequest.Id, communityRequest.Community, communityRequest.Member, false, function (success) {
                            $this.confirmDecline.SubmitComplete();

                            if (success && $this.Refresh)
                                $this.Refresh();
                        }, jQuery.proxy($this.confirmDecline.Invalidate, $this.confirmDecline));
                    }
                }
            };
        }
        else
            return this.confirmDecline;
    },

    AccountCommand: function (community) {
        var account = community.From;
        if (account.AccountType == Model.AccountType.Business)
            Navigation.Business.ProfileView(account.Id);
        else
            Navigation.Personal.ProfileView(account.Id);
    },

    Accept: function (community) {
        var $this = this;
        var request = community.MembershipRequest;
        if (!community.MembershipRequest.Invitation) {
            Admin.Service.Community.Profile.CanManage(community.Id, function (canManage) {
                if (canManage) {
                    var moderator = Session.User.Id;
                    if (moderator > 0 && request.From.Id > 0 && request.From.Id != moderator) {
                        $this.confirmApprove.Content["Member"] = request.From.Name;
                        $this.confirmApprove.Content["Community"] = community.Name;
                        $this.confirmApprove.Content.Type = request.Type;
                        $this.confirmApprove.CommandArgument = { Id: request.Id, Community: community.Id, Invitation: request.Invitation, Member: request.From.Id };
                        //$this.confirmApprove.Show(); //Moderators of a Business community must share the same business
                        var businessId = typeof request.From.Business != "undefined" ? request.From.Business : 0;
                        Admin.Service.Community.Profile.Get(community.Id, function (cachedCommunity) {
                            $this.confirmApprove.Content.Post_Products(cachedCommunity.Post_Products);
                            if (cachedCommunity.BusinessId == 0 || cachedCommunity.BusinessId == businessId)
                                $this.confirmApprove.Content.TypeLimit(Model.Community.MemberType.Moderator);
                            else
                                $this.confirmApprove.Content.TypeLimit(Model.Community.MemberType.Content_Producer);
                            $this.confirmApprove.Show();
                        });
                    }
                }
            });
        }
        else {
            Admin.Service.Community.Membership.AcceptInvitation(request.Id, community.Id, function (success) {
                if ($this.Refresh)
                    $this.Refresh();
            });
        }
    },

    Decline: function (community) {
        var request = community.MembershipRequest;
        if (request) {
            this.confirmDecline.Content["From"] = request.From.Name;
            this.confirmDecline.Content["Community"] = community.Name;
            this.confirmDecline.CommandArgument = { Id: request.Id, Community: community.Id, Invitation: request.Invitation, Member: request.From.Id };
            //if (_confirmDeclineBlock.IsChecked != false)
            //    _confirmDeclineBlock.IsChecked = false;
            this.confirmDecline.Show();
        }
    }
});

System.Type.RegisterNamespace('Controls.Community.Member');
Controls.Community.Member.SelectType = Foundation.Controls.Control.extend({
    ctor: function (confirm, memberType) {
        Foundation.Controls.Control.prototype.ctor.call(this);
        confirm.ValidatorOptions = {
            rules: {
                memberType: "validateMemberType"
            },

            messages: {
                memberType: String.format(Resource.Global.Editor_Error_Select_X, Resource.Dictionary.Member_type)
            }
        }
        
        var $this = this;
        Foundation.Validator.addMethod("validateMemberType", function (value, element) {
            if ($this.typeConfirm.Type)
                return true;
            else
                return false;
        });
        this.typeConfirm = confirm.Content;
        this.memberType = memberType || Model.Community.MemberType.Content_Producer;
        this.typeConfirm.Post_Products = function (post_Products) {
            if ($this.post_Products != post_Products) {
                $this.post_Products = post_Products;
                $this.populate();
                if ($this.$container) {
                    $this.applyTemplate($this.Items);
                    $this.$container.prop('selectedIndex', -1);
                }
            }
        }
        this.typeConfirm.TypeLimit = function (memberType) {
            if ($this.memberType != memberType) {
                $this.memberType = memberType;
                $this.populate();
                if ($this.$container) {
                    $this.applyTemplate($this.Items);
                    $this.$container.prop('selectedIndex', -1);
                }
            }
        }
        confirm.Opening = function () {
            if ($this.typeConfirm.Type) {
                for (var i = 0, l = $this.Items.length; i < l; i++) {
                    if ($this.Items[i].MemberType == $this.typeConfirm.Type) {
                        $this.$container.prop('selectedIndex', i);
                        break;
                    }
                }
            }
            else if ($this.$container.prop('selectedIndex') >= 0)
                $this.$container.prop('selectedIndex', -1);
            return Foundation.Controls.Validation.PopupControl.prototype.Opening.call(confirm);
        };
        confirm.Closing = function () {
            if ($this.$container.prop('selectedIndex') >= 0)
                $this.$container.prop('selectedIndex', -1);
            if ($this.typeConfirm.Type)
                delete $this.typeConfirm.Type;
            return Foundation.Controls.Validation.PopupControl.prototype.Closing.call(confirm);
        };

        this.populate();
    },

    populate: function() {
        //Account for MemberType and Post_Products and sort
        //Moderators of a Business community must share the same business
        var data = [{ MemberType: Model.Community.MemberType.Member, Text: Resource.Community['Member_Type_Member'] }];
        if (this.productsEnabled && (this.memberType == Model.Community.MemberType.Content_Producer || this.memberType == Model.Community.MemberType.Moderator))
            data.push({ MemberType: Model.Community.MemberType.Content_Producer, Text: Resource.Community['Member_Type_Producer'] });
        if (this.memberType == Model.Community.MemberType.Moderator)
            data.push({ MemberType: Model.Community.MemberType.Moderator, Text: Resource.Community['Member_Type_Moderator'] });
        //for (var ms in Model.Community.MemberType) {
        //    var memberType = Model.Community.MemberType[ms];
        //    if (memberType != Model.Community.MemberType.Owner)
        //        data.push({ MemberType: memberType, Text: Resource.Community['Member_Type_' + ms] });
        //}
        this.Items = data;
    },

    Container: '<select id=\"memberType\" name=\"memberType\"></select>',

    Template: jQuery.templates('<option data-MemberType="{{:MemberType}}">{{:Text}}</option>'),

    Initialize: function (container) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container, { tmplData: this.Items });
        this.$container.prop('selectedIndex', -1);
    },

    wireEvents: function () {
        var $this = this;
        this.$container.change(function () {
            var selectedIndex = $this.$container.prop('selectedIndex');
            if (selectedIndex >= 0) {
                $this.typeConfirm.Type = $this.Items[selectedIndex].MemberType;
            }
            else if ($this.typeConfirm.Type) {
                delete $this.typeConfirm.Type;
            }

            if ($this.OnTypeChange)
                $this.OnTypeChange($this.typeConfirm.Type);
        });
    }
});

Controls.Community.Member.OwnType = Class.define({
    //Template: '<span style="display=none;">' + Resource.Dictionary.Member_type + ':&nbsp;<span id ="text"></span></span>',

    Initialize: function (container) {
        //this.$container = $(this.Template).appendTo(container);
        this.$container = container;
        this._text = $('#text', this.$container);
    },

    ctor: function () {
        this.canManage = false;
        this.canLeave = false;
        this.isMember = false;
        this.value = 0;
    },

    Text: function (text) {
        if (text != undefined) {
            this._text.text(text);
        }
        else
            return this._text.text();
    },

    Populate: function (community, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        if (community > 0 && Session.User.Id > 0) {
            var $this = this;
            Admin.Service.Community.Profile.Get(community, function (membership) {
                var memberType = (membership && !membership.Pending ? membership.Type : 0);
                switch (memberType) {
                    case Model.Community.MemberType.Owner:
                        $this.CanManage(true);
                        $this.CanLeave(false);
                        $this.IsMember(true);
                        break;
                    case Model.Community.MemberType.Moderator:
                        $this.CanManage(true);
                        $this.CanLeave(true);
                        $this.IsMember(true);
                        break;
                    case Model.Community.MemberType.Content_Producer:
                    case Model.Community.MemberType.Member:
                        $this.CanManage(false);
                        $this.CanLeave(true);
                        $this.IsMember(true);
                        break;
                    default:
                        $this.CanManage(false);
                        $this.CanLeave(false);
                        $this.IsMember(false);
                        break;
                }
                $this.Value(memberType);
                if (memberType > 0) {
                    $this.Text(Model.Community.MemberTypeText(memberType));
                    $this.$container.show();
                }
            });
        }
        else {
            if (this.CanManage())
                this.CanManage(false);
            if (this.CanLeave())
                this.CanLeave(false);
            if (this.IsMember())
                this.IsMember(false);
            if (this.Value() != 0)
                this.Value(0);
            this.$container.hide();
        }
    },

    CanManage: function (canManage) {
        if (canManage != undefined) {
            this.canManage = canManage;
        }
        else
            return this.canManage;
    },

    CanLeave: function (canLeave) {
        if (canLeave != undefined) {
            this.canLeave = canLeave;
        }
        else
            return this.canLeave;
    },

    IsMember: function (isMember) {
        if (isMember != undefined) {
            this.isMember = isMember;
        }
        else
            return this.isMember;
    },

    Value: function (value) {
        if (value != undefined) {
            this.value = value;
            if(this.ValueChanged)
                this.ValueChanged();
        }
        else
            return this.value;
    }
});

System.Type.RegisterNamespace('Controls.Community.Category');
Controls.Community.Category.TwoLevelSelect_Post = Foundation.Controls.Community.Category.TwoLevelSelect.extend({
    onItem: function (item, itemType) {
        if (itemType == Foundation.Controls.Action.ItemType.Existing) {
            this.setCategory(item);
            this.$dropDown.Hide();
            if (this.ItemSelected)
                this.ItemSelected(item, itemType);
        }
        else
            this.setCategory();
    },

    ResetItems: function (resetState) {
        Foundation.Controls.Action.DropDown.prototype.ResetItems.call(this, resetState);
        this.setCategory();
    },

    Community: function (community) {
        if (community != undefined) {
            if (this.$comunity != community) {
                this.$comunity = community;
                this.ResetItems();
                this.Evaluate(false);
            }
        }
        else
            return this.$comunity;
    },

    setCategory: function (category) {
        this.Value = category;
        if (category != undefined) {
            this.Text(category.Name);
        }
        else
            this.Text(Resource.Global.Category_Select);
    }
});

System.Type.RegisterNamespace('Controls.Community.Topic');
Controls.Community.Topic.ListView = Foundation.Controls.List.View.extend({
    ctor: function () {
        Foundation.Controls.List.View.prototype.ctor.call(this);
        this.canManage = false;
    },

    Container: '<table class="preview" style="width:100%">' +
                    '<thead><tr>' +
                        '<th colspan="2">' + Resource.Dictionary.By + '</th>' +
                        '<th>' + Resource.Dictionary.Topic + '</th>' +
                        '<th>' + Resource.Dictionary.Posts + '</th>' +
                        '<th>' + Resource.Dictionary.Created + '</th>' +
                        '<th>' + Resource.Dictionary.Last_post + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>',

    Template: $.templates(
        '<tr class="separated" data-rowPart="1of2">' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:PostedBy.Image.ImageRef}}" /></td>' +
            '<td><a data-command="AccountCommand" data-commandParam="PostedBy" data-itemIndex="{{:#index}}">{{:PostedBy.Name}}</a></td>' +
            '<td><a {{if NavToken}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-command="ItemViewCommand" data-itemIndex="{{:#index}}">{{:Title}}</a>{{if ~CanEdit(#data)}}&nbsp;[&nbsp;<a data-command="EditCommand" data-itemIndex="{{:#getIndex()}}">{{:~Resource.Action.Edit}}</a>&nbsp;]{{/if}}</td>' +
            '<td>{{:PostCount}}</td>' +
            '<td>{{:~dateFormatter(Date)}}</td>' +
            '<td>{{:~dateFormatter(LastPostDate)}}</td>' +
        '</tr>' +
        '<tr data-rowPart="2of2">' +
            '<td colspan="5">{{:Text}}</td>' +
        '</tr>'),

    AccountCommand: function (account) {
        if (account.AccountType === Model.AccountType.Business)
            Navigation.Business.ProfileView(account.Id);
        else if (account.AccountType === Model.AccountType.Personal)
            Navigation.Personal.ProfileView(account.Id);
    },

    TemplateOptions: function () {
        var options = Foundation.Controls.List.View.prototype.TemplateOptions.call(this);
        options.Resource = Resource;
        options.Settings = Settings;
        if (Session.User.Id > 0) {
            options.CanEdit = function (topic) {
                if (Session.User.Id > 0 && topic.Id > 0 && topic.PostedBy.Id == (topic.PostedBy.AccountType == Model.AccountType.Business ? Session.User.Business.Id : Session.User.Id))
                    return true;
                return false;
            };
        }
        else
            options.CanEdit = function () {
                return false;
            };
        return options;
    },

    CanManage: function (canManage) {
        if (canManage != undefined) {
            this.canManage = canManage;
        }
        else
            return this.canManage;
    }
});

Controls.Community.Topic.Form = Foundation.Controls.Validation.PopupControl.extend({
    Template: jQuery.templates(
    '<form action="">' +
        '<div class="header">' +
            '<span class="title" id="prompt">' + Resource.Global.Topic_Create_Blog + '</span>' +
        '</div>' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;">' + Resource.Dictionary.Community + '</td>' +
                    '<td id="community" class="value" style="font-weight:bold;"></td>' +
                '</tr>' +
                '<tr style="display: none;">' +
                    '<td class="label" style="vertical-align:top;">' + Resource.Dictionary.Forum + '</td>' +
                    '<td id="forum" class="value" style="font-weight:bold;"></td>' +
                '</tr>' +
                '{{for ~FromBusiness.TemplateData tmpl=~FromBusiness.Template/}}' +
                '<tr>' +
                    '<td class="label" style="vertical-align:top;"><label for="title">' + Resource.Dictionary.Title + '</label></td>' +
                    '<td class="value">' +
                        '<textarea id="title" name="title" class="textWrap" cols="47" rows="2"></textarea>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td colspan="2" id="rtePlaceholder">' +
                        '<textarea id="richText" name="richText" style="display:none;"></textarea>' + //placeholder="' + Resource.Dictionary.Text + '" rows="15" cols="60"
                    '</td>' +
                '</tr>' +
                '<tr data-link="visible{:~moderatorOptionsVisibility(CanManage, topicId)}">' +
                    '<td><input type="checkbox" id="pinned" data-link="disabled{:~disabledFromBool(CanManage)}" />&nbsp;' + Resource.Global.Topic_Pin + '</td>' +
                    '<td class="value" style="display:none;"><input type="checkbox" id="sortByLastPost" data-link="disabled{:~disabledFromBool(CanManage)}" />&nbsp;' + String.format(Resource.Action.Sort_by_X, Resource.Dictionary.Last_post) + '</td>' +
                '</tr>' +
                '<tr style="display:none;">' +
                    '<td class="label" style="vertical-align:top;"><label for="sortOrder">' + Resource.Dictionary.Sort_order + '</label></td>' +
                    '<td class="value">' +
                        '<input type="number" id="sortOrder" name="sortOrder" style="width:50px;" data-link="disabled{:~disabledFromBool(CanManage)}" />' +
                    '</td>' +
                '</tr>' +
                '<tr data-link="visible{:~moderatorOptionsVisibility(CanManage, topicId)}">' +
                    '<td colspan="2"><input type="checkbox" id="locked" data-link="disabled{:~disabledFromBool(CanManage)}" />&nbsp;' + Resource.Global.Topic_Lock + '</td>' +
                '</tr>' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel">' +
            '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Save + '</span></a>' +
            '&nbsp;&nbsp;' +
            '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>' +
    '</form>'
    ),

    ValidatorOptions: {
        rules: {
            title: {
                required: true,
                maxlength: 250
            },
            richText: "validateText", //required
            sortOrder: {
                required: true,
                range: [0, 255]
            }
        },

        messages: {
            title: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Title),
            richText: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Text)
        },

        ignore: '' //to validate hidden text textarea
    },

    validationElement: function (elementName) {
        if (elementName == "richText") {
            return this.richTextEditor.$container;
        }
    },

    ctor: function () {
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this);
        this._fromBusiness = new Foundation.Controls.Action.FromBusiness(this);
        this._fromBusiness.TemplateData = { BusinessPrompt: Resource.Business.From, PersonalPrompt: Resource.Personal.Topic };
        this.topicId = 0;
        this.CanManage = false;
        this.$focusCtrl = '#title';
        this.richTextEditor = new Foundation.Controls.RichText.Editor();
        Foundation.Validator.addMethod("validateText", function (value, element) {
            return !String.isNullOrWhiteSpace(value);
        });
    },

    Initialize: function (options) {
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, { 
            tmplData: this,
            tmplOptions: {
                link: true,
                FromBusiness: this._fromBusiness,
                moderatorOptionsVisibility: function (canManage, topicId) {
                    if (canManage || topicId > 0) {
                        return true;
                    }
                    return false;
                },
                /*moderatorOptionsVisibility: function (canManage, topicId) {
                    if (canManage || topicId > 0) {
                        return; //returning undefined or '' will remove the attr
                    }
                    return 'none';
                },*/
                disabledFromBool: Foundation.ValueConverter.Disabled.FromBool
            }
        }));
        this._fromBusiness.Initialize(this.$container);
        this.richTextEditor.Initialize($("#rtePlaceholder", this.$container), { width: 500, height: 200 });
        this._pinned = $('#pinned', this.$container);
        this._sortByLastPost = $('#sortByLastPost', this.$container);
        this._sortOrder = $('#sortOrder', this.$container);
        this._sortOrderTr = this._sortOrder.parents('tr').first();
        this.SortByLastPost(true);
        this.SortOrder(255);
        this._ensureSortOrder();
        var $this = this;
        this._pinned.change(function () {
            $this._ensureSortOrder();
        });
        this._sortByLastPost.change(function () {
            $this._ensureSortOrder();
        });
        this.richTextEditor.$container.bind('resize', function (e) {
            if ($this.Resized) //layout the modal popup
                $this.Resized();
        });
    },

    Prompt: function (prompt) {
        if (prompt != undefined) {
            $('#prompt', this.$container).text(prompt);
        }
    },

    Community: function (community) {
        if (community != undefined) {
            this.community = community;
            $('#community', this.$container).text(community.Name);
        }
    },

    Forum: function (forum) {
        if (forum != undefined) {
            this.Prompt(Resource.Global.Topic_Create_Forum);
            $('#forum', this.$container).text(forum.Name).parent('tr').show();
            this.forum = forum;
        }
        else {
            this.Prompt(Resource.Global.Topic_Create_Blog);
            $('#forum', this.$container).text('').parent('tr').hide();
            if (this.forum)
                delete this.forum;
        }
    },

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

    /*Text: function (text) {
        if (text != undefined) {
            $('#text', this.$container).val(text);
        }
        else
            return $('#text', this.$container).val();
    },*/

    Pinned: function (pinned) {
        if (pinned != undefined) {
            this._pinned.prop('checked', pinned);
        }
        else
            return this._pinned.prop('checked');
    },

    SortByLastPost: function (sortByLastPost) {
        if (sortByLastPost != undefined) {
            this._sortByLastPost.prop('checked', sortByLastPost);
        }
        else
            return this._sortByLastPost.prop('checked');
    },

    SortOrder: function (sortOrder) {
        if (sortOrder != undefined) {
            this._sortOrder.val(sortOrder);
        }
        else
            return this._sortOrder.val();
    },

    _ensureSortOrder: function () {
        if (this.Pinned()) {
            this._sortByLastPost.parent('td').show();
            if (!this.SortByLastPost()) {
                this._sortOrderTr.show();
                return;
            }
        }
        else
            this._sortByLastPost.parent('td').hide();

        this._sortOrderTr.hide();
    },

    Locked: function (locked) {
        if (locked != undefined) {
            $('#locked', this.$container).prop('checked', locked);
        }
        else
            return $('#locked', this.$container).prop('checked');
    },

    Populate: function (community, id) {
        setDisabled(this.$submit, true);
        var $this = this;
        Admin.Service.Community.Topic.Edit(community, id, function (topic) {
            Admin.Service.Community.Profile.CanManage(community, function (canManage) {
                if (topic && (canManage || (topic.From == Session.User.Id && (topic.FromBusiness == 0 || topic.FromBusiness == Session.User.Business.Id)))) {
                    $.observable($this).setProperty('topicId', topic.Id); //$this.topicId = topic.Id;
                    $this.from = topic.From;
                    $this.updated = topic.Updated;
                    $this._fromBusiness.BusinessId(topic.FromBusiness);
                    if (topic.From != Session.User.Id) {
                        if (topic.FromBusiness == 0)
                            $this._fromBusiness.Visible(false);
                        else
                            $this._fromBusiness.IsPersonalEnabled(false);
                    }
                    //$this.Forum(topic.Category);
                    $this.Title(topic.Title);
                    $this.RichText(topic.RichText);
                    $this.Pinned(topic.Pinned);
                    $this.SortByLastPost(topic.Pinned && topic.SortOrder != 255 ? false : true);
                    $this._ensureSortOrder();
                    $this.SortOrder(topic.Pinned ? topic.SortOrder : 255);
                    $this.Locked(topic.Locked);
                    setDisabled($this.$submit, false);
                }
            });
        }, jQuery.proxy(this.Invalidate, this));
    },

    Validate: function (proceed) {
        $('#richText', this.$container).val(this.richTextEditor.HtmlText().text);
        this.$validator.validate('title');
        this.$validator.validate('richText');
        if (this.Pinned() && !this.SortByLastPost())
            this.$validator.validate('sortOrder');
        proceed(!this.$errorInfo.HasErrors);
    },

    OnSubmit: function () {
        var topic = {};

        if (this.topicId > 0) {
            topic.Id = this.topicId;
            topic.From = this.from;
            topic.Updated = this.updated;
        }
        else
            topic.From = Session.User.Id;

        if(topic.From == Session.User.Id)
            topic.FromBusiness = this._fromBusiness.GetValue();
        else
            topic.FromBusiness = this._fromBusiness.BusinessId();

        topic.Community = this.community.Id;
        if (this.forum)
            topic.Category = this.forum.Id;

        topic.Title = this.Title();
        var htmlText = this.richTextEditor.HtmlText();
        topic.RichText = htmlText.html; //this.RichText();
        topic.Text = htmlText.text;
        topic.Pinned = this.Pinned();
        topic.SortOrder = topic.Pinned && !this.SortByLastPost() ? this.SortOrder() : 255;
        topic.Locked = this.Locked();

        var $this = this;
        Admin.Service.Community.Topic.Save(topic, function (topicId) {
            $this.SubmitComplete(true);
            $this.Reset();
        }, jQuery.proxy(this.Invalidate, this));
    },

    Show: function () {
        Foundation.Controls.Validation.PopupControl.prototype.Show.call(this);
        this.richTextEditor.Show({
            zIndex: this._popupContainer.zIndex
        });
    },

    Closing: function () {
        if (this.topicId > 0) {
            $.observable(this).setProperty('topicId', 0); //this.topicId = 0;
            delete this.from;
            delete this.updated;
            this.Reset();
        }
        return Foundation.Controls.Validation.PopupControl.prototype.Closing.call(this);
    },

    Reset: function () {
        if (this.$container) {
            this._fromBusiness.Reset();
            this.Title('');
            this.RichText('');
            this.Pinned(false);
            this.SortByLastPost(true);
            this._ensureSortOrder();
            this.SortOrder(255);
            this.Locked(false);
        }
    }
});

System.Type.RegisterNamespace('Controls.Community.Topic.Post');
Controls.Community.Topic.Post.ListView = Foundation.Controls.List.View.extend({
    ctor: function () {
        Foundation.Controls.List.View.prototype.ctor.call(this);
        this.canManage = false;
    },

    Container: '<table class="preview" style="width:100%">' +
                    '<tbody></tbody>' +
                '</table>',

    /*Template: $.templates(
        '<tr class="separated">' +
            '<td class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:From.Image.ImageRef}}" /></td>' +
            '<td>' +
                '<a data-command="AccountCommand" data-commandParam="From" data-itemIndex="{{:#index}}">{{:From.Name}}</a>' +
                '&nbsp;{{:Text}}&nbsp;({{:~dateFormatter(Date)}})' +
                '{{if ~CanEdit(#data)}}&nbsp;[&nbsp;<a data-command="EditCommand" data-itemIndex="{{:#getIndex()}}">{{:~Resource.Action.Edit}}</a>&nbsp;]{{/if}}' +
            '</td>' +
        '</tr>'),*/

    Template: $.templates(
        '<tr class="separated" data-rowPart="1of2">' +
            '<td rowspan="2" class="auto" style="padding:0; max-width:{{:~Settings.Image.WideThumbnail.Width}}px;"><img src="{{:PostedBy.Image.ImageRef}}" /></td>' +
            '<td class="left"><a data-command="AccountCommand" data-commandParam="PostedBy" data-itemIndex="{{:#index}}">{{:PostedBy.Name}}</a>{{if ~CanEdit(#data)}}&nbsp;[&nbsp;<a data-command="EditCommand" data-itemIndex="{{:#getIndex()}}">{{:~Resource.Global.Post_Edit}}</a>&nbsp;]{{/if}}</td>' +
            '<td class="auto">{{:~dateFormatter(Date)}}</td>' +
        '</tr>' +
        '<tr data-rowPart="2of2">' +
            '<td colspan="2"{{if TopicPost link=false}} itemprop="articleBody"{{/if}}>{{:RichText}}</td>' +
        '</tr>'),

    AccountCommand: function (account) {
        if (account.AccountType === Model.AccountType.Business)
            Navigation.Business.ProfileView(account.Id);
        else if (account.AccountType === Model.AccountType.Personal)
            Navigation.Personal.ProfileView(account.Id);
    },

    TemplateOptions: function () {
        var options = Foundation.Controls.List.View.prototype.TemplateOptions.call(this);
        options.Resource = Resource;
        options.Settings = Settings;
        if (Session.User.Id > 0) {
            var $this = this;
            options.CanEdit = function (post) {
                if (Session.User.Id > 0 && post.Id > 0 && ($this.CanManage() || post.PostedBy.Id == (post.PostedBy.AccountType == Model.AccountType.Business ? Session.User.Business.Id : Session.User.Id)))
                    return true;
                return false;
            };
        }
        else
            options.CanEdit = function () {
                return false;
            };
        return options;
    },

    CanManage: function (canManage) {
        if (canManage != undefined) {
            this.canManage = canManage;
        }
        else
            return this.canManage;
    }
});

Controls.Community.Topic.Post.Form = Foundation.Controls.Validation.PopupControl.extend({

    Template: jQuery.templates(
    '<form action="">' +
        '<div class="content">' +
            '<table class="form"><tbody>' +
                '<tr>' +
                    '<td colspan="2" id="rtePlaceholder">' +
                        '<textarea id="richText" name="richText" style="display:none;"></textarea>' + //placeholder="' + Resource.Dictionary.Text + '" rows="15" cols="50"
                    '</td>' +
                '</tr>' +
                '{{for ~FromBusiness.TemplateData tmpl=~FromBusiness.Template/}}' +
            '</tbody></table>' +
            '<span id="error" class="formError" style="display:none;"></span>' +
        '</div>' +
        '<div class="footer buttonPanel">' +
            '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Post + '</span></a>' +
            '&nbsp;&nbsp;' +
            '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
        '</div>' +
    '</form>'
    ),

    ValidatorOptions: {
        rules: {
            richText: "validateText" //required
        },

        messages: {
            richText: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Text)
        },

        ignore: '' //to validate hidden text textarea
    },

    validationElement: function (elementName) {
        if (elementName == "richText") {
            return this.richTextEditor.$container;
        }
    },

    ctor: function () {
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this);
        this._fromBusiness = new Foundation.Controls.Action.FromBusiness(this);
        this._fromBusiness.TemplateData = { BusinessPrompt: Resource.Business.From, PersonalPrompt: Resource.Personal.Post };
        this.postId = 0;
        this.CanManage = false;
        //this.$focusCtrl = '#text';
        this.richTextEditor = new Foundation.Controls.RichText.Editor();
        Foundation.Validator.addMethod("validateText", function (value, element) {
            return !String.isNullOrWhiteSpace(value);
        });
    },

    Initialize: function (options) {
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, {
            tmplData: {},
            tmplOptions: {
                FromBusiness: this._fromBusiness
            }
        }));
        this._fromBusiness.Initialize(this.$container);
        this.richTextEditor.Initialize($("#rtePlaceholder", this.$container), { width: 500, height: 200 });
        var $this = this;
        this.richTextEditor.$container.bind('resize', function (e) {
            if ($this.Resized) //layout the modal popup
                $this.Resized();
        })
    },

    RichText: function (richText) {
        if (richText != undefined) {
            this.richTextEditor.Html(richText);
        }
        else
            return this.richTextEditor.Html();
    },

    /*Text: function (text) {
        if (text != undefined) {
            $('#text', this.$container).val(text);
        }
        else
            return $('#text', this.$container).val();
    },*/

    Populate: function (community, topic, id) {
        setDisabled(this.$submit, true);
        var $this = this;
        Admin.Service.Community.Topic.Post.Edit(community, topic, id, function (post) {
            Admin.Service.Community.Profile.CanManage(community, function (canManage) {
                if (post && (canManage || (post.From == Session.User.Id && (post.FromBusiness == 0 || post.FromBusiness == Session.User.Business.Id)))) {
                    $this.postId = post.Id;
                    $this.from = post.From;
                    $this.updated = post.Updated;
                    $this._fromBusiness.BusinessId(post.FromBusiness);
                    if (post.From != Session.User.Id) {
                        if (post.FromBusiness == 0)
                            $this._fromBusiness.Visible(false);
                        else
                            $this._fromBusiness.IsPersonalEnabled(false);
                    }
                    $this.RichText(post.RichText);
                    setDisabled($this.$submit, false);
                }
            });
        }, jQuery.proxy(this.Invalidate, this));
    },

    Validate: function (proceed) {
        $('#richText', this.$container).val(this.richTextEditor.HtmlText().text);
        Foundation.Controls.Validation.PopupControl.prototype.Validate.call(this, proceed);
    },

    OnSubmit: function () {
        var post = {};

        if (this.postId > 0) {
            post.Id = this.postId;
            post.From = this.from;
            post.Updated = this.updated;
        }
        else
            post.From = Session.User.Id;

        if(post.From == Session.User.Id)
            post.FromBusiness = this._fromBusiness.GetValue();
        else
            post.FromBusiness = this._fromBusiness.BusinessId();

        post.Community = this.Community;
        post.Topic = this.Topic;

        post.RichText = this.RichText();
        //topic.Text = this.Text;

        var $this = this;
        Admin.Service.Community.Topic.Post.Save(post, function (postId) {
            $this.SubmitComplete(true);
            $this.Reset();
        }, jQuery.proxy(this.Invalidate, this));
    },

    Show: function () {
        Foundation.Controls.Validation.PopupControl.prototype.Show.call(this);
        this.richTextEditor.Show({
            focus: true,
            zIndex: this._popupContainer ? this._popupContainer.zIndex : 0
        });
    },

    Closing: function () {
        if (this.postId > 0) {
            this.postId = 0;
            delete this.from;
            delete this.updated;
            this.Reset();
        }
        return Foundation.Controls.Validation.PopupControl.prototype.Closing.call(this);
    },

    Reset: function () {
        if (this.$container) {
            this._fromBusiness.Reset();
            this.RichText('');
        }
    }
});

//similar to Controls.Message.Reply.InlineForm
Controls.Community.Topic.Post.InlineForm = Controls.Community.Topic.Post.Form.extend({
    Template: jQuery.templates(
    '<form action="">' +
        '<table class="form"><tbody>' +
            '<tr>' +
                '<td class="label" style="vertical-align:top;"><label for="text">' + Resource.Dictionary.Your_reply + '</label></td>' +
                '<td colspan="2" id="rtePlaceholder" class="value">' +
                    '<textarea id="richText" name="richText" style="display:none;"></textarea>' + //placeholder="' + Resource.Dictionary.Text + '" rows="8" cols="70"
                '</td>' +
            '</tr>' +
            '<tr>' +
                '<td rowspan="2" class="label" style="vertical-align:top;"><span class="fromBusiness" style="display: none;">' + Resource.Business.From + '</span></td>' +
                '<td class="value" style="font-weight:bold;"><span id="businessName" class="fromBusiness" style="display: none;"></span></td>' +
                '<td rowspan="2" class="buttonPanel right">' +
                    '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Post + '</span></a>' +
                    '&nbsp;&nbsp;' +
                    '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
                '</td>' +
            '</tr>' +
            '<tr>' +
                '<td class="value" style="vertical-align:top;"><span class="isPersonal" style="display: none;"><input type="checkbox" id="personalMessage" />&nbsp;' + Resource.Personal.Post + '</span></td>' +
            '</tr>' +
            '<tr>' +
                '<td colspan="3" id="error" style="display:none; text-align:center; padding-top:15px;">' +
                '</td>' +
            '</tr>' +
        '</tbody></table>' +
    '</form>'
    ),

    ctor: function () {
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this, { visible: false });
        this._fromBusiness = new Foundation.Controls.Action.FromBusiness(this);
        this.postId = 0;
        this.CanManage = false;
        this.richTextEditor = new Foundation.Controls.RichText.Editor();
        Foundation.Validator.addMethod("validateText", function (value, element) {
            return !String.isNullOrWhiteSpace(value);
        });
    },

    Initialize: function (options) {
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, {
            tmplData: {}
        }));
        this._fromBusiness.Initialize(this.$container);
        this.richTextEditor.Initialize($("#rtePlaceholder", this.$container), { width: 600, height: 160 });
    }
});