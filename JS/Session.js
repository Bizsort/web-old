$.extend(Session, {
    OutOfBand: function () {
        return navigator.userAgent == "adscrl_headless" || Navigation.ForeignOrigin();
    },
   
    CaptchaRef: function () {
        return Settings.Image.Url + '/captcha?token=' + Service.SessionToken + '&user=' + Session.User.Id + '&ts=' + (new Date()).getTime();
    },

    GenerateCaptcha: function (callback) {
        Service.Post('/master/session/GenerateCaptcha', {
            data: {
                User: Session.User.Id,
                Pass: false
            },
            callback: callback
        });
    },

    Recover: function (controlCookie) {
        //Prevent refresh loop for page snapshot by search engine or other site
        if (Session.OutOfBand())
            return;
        if (!controlCookie || controlCookie.Value != "Recover") {
            controlCookie = { Name: Settings.Session.ControlCookieName };
            var expires = new Date();
            expires.setSeconds(expires.getSeconds() + Settings.Session.CookieTimeout);
            controlCookie.Expires = expires;
            controlCookie.Value = "Recover";
            Session.Cookies.Set(controlCookie);
            //Prevent refresh loop if cookies are disabled
            if (navigator.cookieEnabled || document.cookie.indexOf(Settings.Session.ControlCookieName) != -1) {
                Navigation.Main.Refresh();
                return true;
            }
        }
    },

    Handoff: function () {
        var sessionCookie = { Name: Settings.Session.HandoffCookieName };
        var expires = new Date();
        expires.setSeconds(expires.getSeconds() + Settings.Session.CookieTimeout);
        sessionCookie.Expires = expires;

        if (Service.SessionToken)
            sessionCookie.Value = { Token: Service.SessionToken };
        else if ((Settings.Session.Handling & Model.Session.HandlingType.Strict) > 0)
            throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotInitialized);
        else
            sessionCookie.Value = {};

        if (Session.User.Id > 0)
            sessionCookie.Value.User = Session.User;
        else { //Propagate Location and Category
            sessionCookie.Value.User = { Id: 0 };
            if (Session.User.LocationId)
                sessionCookie.Value.User.LocationId = Session.User.LocationId;
            if (Session.User.CategoryId)
                sessionCookie.Value.User.CategoryId = Session.User.CategoryId;
            if (Session.User.SuppressGuidelines)
                sessionCookie.Value.User.SuppressGuidelines = true;
            if (Session.SignInForward)
                sessionCookie.Value.User.SignInForward = true;
        }

        //Could handoff via storage, but would need to review SessionExists and service logic
        /*if (Session.Enabled) {
            Session.Storage.setItem(Settings.Session.HandoffCookieName, JSON.stringify(sessionCookie.Value));
        } else*/
        Session.Cookies.Set(sessionCookie);

        if (Session.Enabled && !Session.Flags.Cleanup)
            Session.Cache.Preserve();
    },

    Enter: function (callback, faultCallback) {
        return Service.Post('/master/session/Enter', {
            data: {
                User: Session.User.Id
            },
            xhrFields: { //to transmit the session cookie
                withCredentials: true
            },
            callback: function (response) {
                //var headers = {};
                //headers[Settings.Session.TokenHeader] = sessionToken;
                //jQuery.ajaxSetup(headers); //doesn't seem to take effect

                if (response) {
                    if (response.Token && response.Token.length > 0) {
                        response.Token = Guid.Deserialize(response.Token);
                    }

                    if (response.Key && response.Key.length > 0)
                        response.Key = Guid.Deserialize(response.Key);
                }

                callback(response);
            },
            faultCallback: faultCallback
        });
    },

    TryLoginUser: function (callback) {
        if (!Session.Enabled)
            return;

        var loginCookie = Session.Cookies.Get(Settings.Session.AutoLogin.UserCookieName);
        if (loginCookie) {
            var token = loginCookie.Value.Token;
            var expireAfter = Settings.Session.AutoLogin.ExpireAfter;
            var cb = function (loginResponse) {
                if (loginResponse && loginResponse.Status == Model.Session.LoginStatus.Success) {
                    Session.User.AutoLogin = loginCookie.Value.Type;
                    Session.User.AutoLoginToken = token;
                    var date = new Date();
                    date.setDate(date.getDate() + expireAfter);
                    loginCookie.Expires = date;
                    Session.Cookies.Set(loginCookie);
                }
                else
                    Session.Cookies.Delete(Settings.Session.AutoLogin.UserCookieName);
                callback(loginResponse);
            }
            switch (loginCookie.Value.Type) {
                case Model.Session.AutoLoginType.AdScrl:
                    Session.UserLogin(token, cb);
                    break;
                case Model.Session.AutoLoginType.Facebook:
                    //Make sure that div#fb-root is there
                    $(document).ready(function () {
                        Service.Facebook.LoginStatus(function (output) {
                            Session.UserLogin(token, cb);
                        });
                    });
                    break;
            }
        }
        else
            callback(null);
    },

    TryLoginGuest: function () {
        var cookie = Session.Cookies.Get(Settings.Instance.Session.AutoLogin.GuestCookieName);
        if (cookie) {
            Session.GuestLogin(cookie.Value, function (success) {
                //Session.Cookies.Set(cookie);
            });
        }
    },

    GuestLogin: function (token, callback) {
        if (Session.User.Id == 0) {
            Service.Post('/master/session/GuestLogin', {
                secure: true,
                data: {
                    Token: token
                },
                callback: function (loginResponse) {
                    callback(Session.login(loginResponse));
                },
                faultCallback: function (error) {
                    Session.User.Exit();
                }
            });
        }
        else
            callback(null);
    },

    LoginExternal: function (provider, providerId, accessToken, callback, faultCallback) {
        if (Session.User.Id == 0) {
            Service.Post('/master/session/UserLogin_External', {
                secure: true,
                data: {
                    Provider: provider,
                    ProviderId: providerId,
                    AccessToken: accessToken
                },
                callback: function (loginResponse) {
                    callback(Session.login(loginResponse));
                },
                faultCallback: function (error) {
                    Session.User.Exit();
                    if (faultCallback)
                        faultCallback(error);
                }
            });
        }
        else
            faultCallback(new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid));
    },

    Logout: function () {
        var user = Session.User.Id;
        Session.User.Exit();
        Session.Token.Reset(false);
        Session.Cache.Reset();
        var logout = function () {
            Service.Post.Key();
        }
        if (user > 0) {
            var data = {
                User: user
            };
            if (Session.User.AutoLogin != Model.Session.AutoLoginType.None && Session.User.AutoLoginToken)
                data.Forget = Session.User.AutoLoginToken;
            Service.Post('/master/session/Logout', {
                authorize: true,
                data: data,
                callback: logout,
                faultCallback: logout
            });
        }
        else
            logout();
        //if (Session.User.AutoLogin != Model.Session.AutoLoginType.None && user > 0) {
        //    Service.Post('/master/session/Forget', {
        //        data: {
        //            User: user
        //        }
        //    });
        //}
    },

    EvaluateQuota: function (arg_0, callback, faultCallback) {
        if (typeof arguments[0] == "number") {
            var accountType = arguments[0];
            if (Session.User.Id > 0 && (accountType == Model.AccountType.Personal || Session.User.Business.Id > 0)) {
                Service.Post('/master/session/GetProductCount', {
                    data: {
                        Type: accountType,
                        Account: (accountType == Model.AccountType.Business ? Session.User.Business.Id : Session.User.Id)
                    },
                    callback: function (productCount) {
                        if (productCount) {
                            if (accountType == Model.AccountType.Business) {
                                Session.User.Business.ProductStats.Refresh(productCount);
                                callback(Session.User.Business.ProductStats);
                            }
                            else {
                                Session.User.ProductStats.Refresh(productCount);
                                callback(Session.User.ProductStats);
                            }
                        }
                        else
                            callback();
                    },
                    faultCallback: faultCallback
                });
            }
            else
                throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
        }
        else if (typeof arguments[0] == "string") {
            var email = arguments[0];
            if (Session.User.Id == 0) {
                Service.Post('/master/session/GetProductCount_AdHoc', {
                    data: {
                        Email: email
                    },
                    callback: function (productCount) {
                        if (productCount) {
                            Session.User.ProductStats.Refresh(productCount);
                            callback(Session.User.ProductStats);
                        }
                        else
                            callback();
                    },
                    faultCallback: faultCallback
                });
            }
            else
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
        }
    },

    Cookies: (function () {
        var ctor = function () {
            this.domain = Settings.WebSite.Origin.Host/*location.hostname*/ != 'localhost' ? '; domain=.' + Settings.WebSite.Origin.Host/*location.hostname*/ : '';
            this.cookies = {};
            var badCookies = [];
            var cookies = jQuery.map(document.cookie.split(";"), function (cookieStr) {
                try {
                    cookieStr = $.trim(cookieStr);
                    var index = cookieStr.indexOf('=');
                    var cookie;
                    var cookieName = '';
                    var cookieValue = '';
                    if (index > 0 && cookieStr.length > index) {
                        cookieName = cookieStr.substr(0, index);
                        cookie = { Name: cookieName };
                        try {
                            if (cookieName == Settings.Session.HandoffCookieName ||
                                cookieName == Settings.Session.AutoLogin.UserCookieName) {
                                cookieValue = JSON.parse(cookieStr.substr(index + 1));
                            }
                            else {
                                cookieValue = cookieStr.substr(index + 1);
                            }
                        } catch (e) {
                            console.error(errorMessage(e));
                            badCookies.push(cookieName);
                        }
                    }
                    if (!String.isNullOrWhiteSpace(cookieName) && cookieValue) {
                        cookie.Value = cookieValue;
                        return cookie;
                    }
                }
                catch (e) {
                    console.error(errorMessage(e));
                }
            });
            for (var i = 0, l = cookies.length; i < l; i++) {
                if (!this.cookies[cookies[i].Name])
                    this.cookies[cookies[i].Name] = cookies[i];
                else
                    badCookies.push(cookies[i].Name);
            }
            //Chrome allows for diplicate cookies that have the same name but may differ in (sub-)domain, etc
            if (badCookies.length) {
                for (var i = 0, l = badCookies.length; i < l; i++) {
                    this.Delete(badCookies[i]);
                }
            }
        };
        $.extend(ctor.prototype, {
            Get: function (name) {
                if (!String.isNullOrEmpty(name)) {
                    return this.cookies[name];
                }
            },

            Set: function (cookie) {
                if (cookie && !String.isNullOrWhiteSpace(cookie.Name)) {
                    var c = this.cookies[cookie.Name];
                    var remove = cookie.Expires <= new Date() ? true : false;
                    var cookieValue;
                    if (typeof cookie.Value == "object")
                        cookieValue = JSON.stringify(cookie.Value);
                    else if (typeof cookie.Value == "string")
                        cookieValue = cookie.Value;
                    if (cookieValue)
                        document.cookie = cookie.Name + '=' + cookieValue + '; expires=' + cookie.Expires.toUTCString() + '; path=/' + this.domain;
                    if (c) {
                        if (!remove) {
                            c.Value = cookie.Value;
                            c.Expires = cookie.Expires;
                        }
                        else
                            delete this.cookies[cookie.Name];
                    }
                    else if (!remove)
                        this.cookies[cookie.Name] = cookie.Value;
                }
            },

            Delete: function (name) {
                var cookie = this.cookies[name];
                if (cookie) {
                    var expires = new Date();
                    expires.setDate(expires.getDate() - 1);
                    document.cookie = name + '=; expires=' + expires.toUTCString() + '; path=/' + this.domain; //(new Date(0)).toUTCString()
                    delete this.cookies[name];
                }
            }
        });
        return new ctor();
    })(),

    Navigation: {
        StepType: {
            None: 0,
            Current: 1,
            Preserve: 2
        },

        ValidateStatus: {
            Invalid: 0,
            Current: 1,
            SetOwner: 2,
            SignInForward: 3,
            SetUser: 4
        },

        Token: (function () {
            var ctor = function (url, action, cancel, forward) {
                this.setViewUri(url);
                this.Action = action || Model.Session.Action.None;
                this.Properties = {};
                //Workaround if accessor properties are not supported
                if (!System.Features.Accessor_property) {
                    this.LocationId = Settings.Location.Country;
                    this.CategoryId = 0;
                    this.AccountId = 0;
                    this.ProductId = 0;
                    this.CommunityId = 0;
                    this.BusinessCategoryId = 0;
                    this.CommunityCategoryId = 0;
                    this.CommunityForumId = 0;
                    this.CommunityTopicId = 0;
                    this.PersonalListId = 0;
                    this.MessageFolder = 0;
                    this.Page = 0;
                }

                if (cancel && !cancel.ViewUri)
                    throw 'Cancel Url';

                if (forward && !forward.ViewUri)
                    throw 'Forward Url';

                if (cancel)
                    this.Cancel = cancel;
                if (forward)
                    this.Forward = forward;
            };
            $.extend(ctor.prototype, {
                setViewUri: function (viewUri) {
                    if (viewUri)
                        this.ViewUri = viewUri.toLowerCase();
                },

                IsUser: function () {
                    if (this.Action < Model.Session.Action.Admin/*Model.Session.User.AdminAction*/)
                        return true;
                    else if (this.Action == Model.Session.Action.ProductNew || this.Action == Model.Session.Action.ProductEdit)
                        return this.AccountType == undefined ? true : false; //AdHoc Personal product - New or Edit
                    else if (this.Action == Model.Session.Action.ProfileNew && this.AccountType == Model.AccountType.Business)
                        return this.AccountId == 0 ? true : false; //AdHoc Business profile - New
                    else
                        return false;
                },

                IsAdmin: function () {
                    return !this.IsUser();
                }
            });

            //accessor properties (ECMAScript5 - IE9 and higher, FF4)
            //Session.Navigation.Token.prototype = {
            //    get LocationId() {
            //        return this.Properties.LocationId ? this.Properties.LocationId : Settings.Location.Country;
            //    }
            //};

            try {
                Object.defineProperties(ctor.prototype, {
                    LocationId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.LocationId] ? this.Properties[Model.Session.NavigationProperty.LocationId] : Settings.Location.Country;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.LocationId] = value;
                        }
                    },
                    CategoryId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.CategoryId] ? this.Properties[Model.Session.NavigationProperty.CategoryId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.CategoryId] = value;
                        }
                    },
                    SearchQuery: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.SearchQuery];
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.SearchQuery] = value;
                        }
                    },
                    SearchNear: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.SearchNear];
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.SearchNear] = value;
                        }
                    },
                    SearchOptions: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.SearchOptions] ? this.Properties[Model.Session.NavigationProperty.SearchOptions] : Model.Session.SearchOptions.None;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.SearchOptions] = value;
                        }
                    },
                    AccountType: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.AccountType];
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.AccountType] = value;
                        }
                    },
                    AccountId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.AccountId] ? this.Properties[Model.Session.NavigationProperty.AccountId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.AccountId] = value;
                        }
                    },
                    ProductId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.ProductId] ? this.Properties[Model.Session.NavigationProperty.ProductId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.ProductId] = value;
                        }
                    },
                    ProductType: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.ProductType] ? this.Properties[Model.Session.NavigationProperty.ProductType] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.ProductType] = value;
                        }
                    },
                    CommunityId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.CommunityId] ? this.Properties[Model.Session.NavigationProperty.CommunityId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.CommunityId] = value;
                        }
                    },
                    BusinessCategoryId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.BusinessCategoryId] ? this.Properties[Model.Session.NavigationProperty.BusinessCategoryId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.BusinessCategoryId] = value;
                        }
                    },
                    CommunityCategoryId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.CommunityCategoryId] ? this.Properties[Model.Session.NavigationProperty.CommunityCategoryId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.CommunityCategoryId] = value;
                        }
                    },
                    CommunityForumId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.CommunityForumId] ? this.Properties[Model.Session.NavigationProperty.CommunityForumId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.CommunityForumId] = value;
                        }
                    },
                    CommunityTopicId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.CommunityTopicId] ? this.Properties[Model.Session.NavigationProperty.CommunityTopicId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.CommunityTopicId] = value;
                        }
                    },
                    PersonalListId: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.PersonalListId] ? this.Properties[Model.Session.NavigationProperty.PersonalListId] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.PersonalListId] = value;
                        }
                    },
                    MessageFolder: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.MessageFolder] ? this.Properties[Model.Session.NavigationProperty.MessageFolder] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.MessageFolder] = value;
                        }
                    },
                    ConversationPeer: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.ConversationPeer];
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.ConversationPeer] = value;
                        }
                    },
                    PendingStatus: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.PendingStatus] ? this.Properties[Model.Session.NavigationProperty.PendingStatus] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.PendingStatus] = value;
                        }
                    },
                    Key: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.Key];
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.Key] = value;
                        }
                    },
                    Page: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.Page] ? this.Properties[Model.Session.NavigationProperty.Page] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.Page] = value;
                        }
                    },
                    NavigationFlags: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.Flags] ? this.Properties[Model.Session.NavigationProperty.Flags] : 0;
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.Flags] = value;
                        }
                    },
                    Forward: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.Forward];
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.Forward] = value;
                        }
                    }/*,
                    Cancel: {
                        get: function () {
                            return this.Properties[Model.Session.NavigationProperty.Cancel];
                        },
                        set: function (value) {
                            this.Properties[Model.Session.NavigationProperty.Cancel] = value;
                        }
                    }*/
                });
            } catch (e) {
                console.error(errorMessage(e));
                System.Features.Accessor_property = false;
            };
            return ctor;
        })(),

        TokenManager: Class.define({
            Reset: function (preserveSteps) {
                if (!preserveSteps) {
                    if (this.Current.Cancel)
                        delete this.Current.Cancel;
                    if (this.Current.Forward)
                        delete this.Current.Forward;
                }
            },

            SetCurrent: function (token) {
                if (token.IsAdmin()) {
                    var user = Session.User.Id;
                    if (token.AccountType == Model.AccountType.Business && token.Action != Model.Session.Action.ProfileNew) {
                        var business = Session.User.Business.Id;
                        if (user <= 0 || business <= 0 || token.AccountId != business)
                            throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized);
                    }
                    else if (user <= 0 || token.AccountId != user)
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized);
                }

                this.Current = token;
            },

            Validate: function (token) {
                var status = Session.Navigation.ValidateStatus.Invalid;

                if (this.Current == token) //TODO: Token to imlement custom "==" implementation
                    status = Session.Navigation.ValidateStatus.Current; //preserve current token along with Cancel and Froward steps
                else if (token.IsAdmin()) {
                    if (Session.User.Id > 0) {
                        this.SetCurrent(token);
                        status = Session.Navigation.ValidateStatus.SetOwner;
                    }
                    else if (token != null)
                        status = Session.Navigation.ValidateStatus.SignInForward;
                }
                else {
                    this.SetCurrent(token);
                    status = Session.Navigation.ValidateStatus.SetUser;
                }

                return status;
            },

            //Base64 encoded byte array is about 25-30% longer then json encoded token
            Serialize: function (token, nested, bizsrtProps) {
                var props = {}
                props[Model.Session.NavigationProperty.Action] = token.Action;
                if (nested && token.ViewUri)
                    props[Model.Session.NavigationProperty.ViewUri] = token.ViewUri;
                if (token.LocationId > 0 && token.LocationId != Settings.Location.Country)
                    props[Model.Session.NavigationProperty.LocationId] = token.LocationId;
                if (token.CategoryId > 0)
                    props[Model.Session.NavigationProperty.CategoryId] = token.CategoryId;
                if (!String.isNullOrWhiteSpace(token.SearchQuery))
                    props[Model.Session.NavigationProperty.SearchQuery] = token.SearchQuery;
                if (token.SearchNear && !String.isNullOrWhiteSpace(token.SearchNear.Text))
                    props[Model.Session.NavigationProperty.SearchNear] = { 1: token.SearchNear.Text, 2: token.SearchNear.Lat, 3: token.SearchNear.Lng };
                if (token.SearchOptions && token.SearchOptions > 0)
                    props[Model.Session.NavigationProperty.SearchOptions] = token.SearchOptions;
                if (token.AccountType)
                    props[(bizsrtProps && bizsrtProps.AccountType) || Model.Session.NavigationProperty.AccountType] = token.AccountType;
                if (token.AccountId > 0)
                    props[(bizsrtProps && bizsrtProps.AccountId) || Model.Session.NavigationProperty.AccountId] = token.AccountId;
                if (token.ProductId > 0)
                    props[(bizsrtProps && bizsrtProps.ProductId) || Model.Session.NavigationProperty.ProductId] = token.ProductId;
                if (token.ProductType > 0)
                    props[Model.Session.NavigationProperty.ProductType] = token.ProductType;
                if (token.CommunityId > 0)
                    props[Model.Session.NavigationProperty.CommunityId] = token.CommunityId;
                if (token.BusinessCategoryId > 0)
                    props[Model.Session.NavigationProperty.BusinessCategoryId] = token.BusinessCategoryId;
                if (token.CommunityCategoryId > 0)
                    props[Model.Session.NavigationProperty.CommunityCategoryId] = token.CommunityCategoryId;
                if (token.CommunityForumId != 0)
                    props[Model.Session.NavigationProperty.CommunityForumId] = token.CommunityForumId;
                if (token.CommunityTopicId > 0)
                    props[Model.Session.NavigationProperty.CommunityTopicId] = token.CommunityTopicId;
                if (token.PersonalListId > 0)
                    props[Model.Session.NavigationProperty.PersonalListId] = token.PersonalListId;
                if (token.MessageFolder > 0)
                    props[Model.Session.NavigationProperty.MessageFolder] = token.MessageFolder;
                if (token.ConversationPeer > 0 && token.ConversationPeer.Type && token.ConversationPeer.Account > 0)
                    props[Model.Session.NavigationProperty.ConversationPeer] = { 1: token.ConversationPeer.Type, 2: token.ConversationPeer.Account };
                if (token.PendingStatus && token.PendingStatus > 0)
                    props[Model.Session.NavigationProperty.PendingStatus] = token.PendingStatus;
                if (token.Key)
                    props[Model.Session.NavigationProperty.Key] = token.Key;
                if (token.Page > 0)
                    props[Model.Session.NavigationProperty.Page] = token.Page;
                if (token.NavigationFlags > 0)
                    props[Model.Session.NavigationProperty.Flags] = token.NavigationFlags;
                if (token.Forward && !nested)
                    props[Model.Session.NavigationProperty.Forward] = Session.Token.Serialize(token.Forward, true, bizsrtProps);
                //if (token.Cancel && !nested)
                //    props[Model.Session.NavigationProperty.Cancel] = Session.Token.Serialize(token.Cancel, true, bizsrtProps);
                //if (token.Extension && token.Extension.Type) {
                //    switch (token.Extension.Type) {
                //        case "SubjectSearch":
                //            props[Model.Session.NavigationProperty.Extension] = { 1: token.Extension.Type, 2: Extension.SubjectSearch };
                //            break;
                //    }
                //}
                return nested ? props : JSON.stringify(props);
            },

            Deserialize: function (json, nested) {
                var token = new Session.Navigation.Token();
                var props = nested ? json : JSON.parse(json);
                token.Action = props[Model.Session.NavigationProperty.Action];
                delete props[Model.Session.NavigationProperty.Action];
                for (var p in props) {
                    switch (parseInt(p)) {
                        case Model.Session.NavigationProperty.ViewUri:
                            token.setViewUri(props[p]);
                            break;
                        case Model.Session.NavigationProperty.LocationId:
                            token.LocationId = props[p];
                            break;
                        case Model.Session.NavigationProperty.CategoryId:
                            token.CategoryId = props[p];
                            break;
                        case Model.Session.NavigationProperty.SearchQuery:
                            //HttpUtility.UrlEncode uses '+' instead of '%20' for spaces in strings, changed to Uri.EscapeDataString
                            token.SearchQuery = props[p]/*.replace(/\+/g, ' ')*/;
                            break;
                        case Model.Session.NavigationProperty.SearchNear:
                            var searchNear = props[p];
                            //HttpUtility.UrlEncode uses '+' instead of '%20' for spaces in strings, changed to Uri.EscapeDataString
                            token.SearchNear = { Text: searchNear["1"]/*.replace(/\+/g, ' ')*/, Lat: searchNear["2"], Lng: searchNear["3"] };
                            break;
                        case Model.Session.NavigationProperty.SearchOptions:
                            token.SearchOptions = props[p];
                            break;
                        case Model.Session.NavigationProperty.AccountType:
                            token.AccountType = props[p];
                            break;
                        case Model.Session.NavigationProperty.AccountId:
                            token.AccountId = props[p];
                            break;
                        case Model.Session.NavigationProperty.ProductId:
                            token.ProductId = props[p];
                            break;
                        case Model.Session.NavigationProperty.ProductType:
                            token.ProductType = props[p];
                            break;
                        case Model.Session.NavigationProperty.CommunityId:
                            token.CommunityId = props[p];
                            break;
                        case Model.Session.NavigationProperty.BusinessCategoryId:
                            token.BusinessCategoryId = props[p];
                            break;
                        case Model.Session.NavigationProperty.CommunityCategoryId:
                            token.CommunityCategoryId = props[p];
                            break;
                        case Model.Session.NavigationProperty.CommunityForumId:
                            token.CommunityForumId = props[p];
                            break;
                        case Model.Session.NavigationProperty.CommunityTopicId:
                            token.CommunityTopicId = props[p];
                            break;
                        case Model.Session.NavigationProperty.PersonalListId:
                            token.PersonalListId = props[p];
                            break;
                        case Model.Session.NavigationProperty.MessageFolder:
                            token.MessageFolder = props[p];
                            break;
                        case Model.Session.NavigationProperty.ConversationPeer:
                            var conversationPeer = props[p];
                            token.ConversationPeer = { Type: conversationPeer["1"], Account: conversationPeer["2"] };
                            break;
                        case Model.Session.NavigationProperty.PendingStatus:
                            token.PendingStatus = props[p];
                            break;
                        case Model.Session.NavigationProperty.Key:
                            token.Key = props[p];
                            break;
                        case Model.Session.NavigationProperty.Page:
                            token.Page = props[p];
                            break;
                        case Model.Session.NavigationProperty.Flags:
                            token.NavigationFlags = props[p];
                            break;
                        case Model.Session.NavigationProperty.Forward:
                            token.Forward = Session.Token.Deserialize(props[p], true);
                            break;
                        //case Model.Session.NavigationProperty.Cancel:
                        //    token.Cancel = Session.Token.Deserialize(props[p]);
                        //    break;
                        //case Model.Session.NavigationProperty.Extension: 
                        //    var extension = props[p]; 
                        //    switch (extension["1"]) { 
                        //        case "SubjectSearch": 
                        //            token.Extension = { SubjectSearch: extension["2"] }; 
                        //            break; 
                        //    } 
                        //    break; 
                    }
                }

                return token;
            }

            /*Serialize: function (token) {
            var intSize;
            var buffer = [];
            var sb;
            buffer.push(token.Action);
            if (!System.Features.Accessor_property) {
            if (token.LocationId > 0)
            token.Properties.LocationId = token.LocationId;
            if (token.CategoryId > 0)
            token.Properties.CategoryId = token.CategoryId;
            if (!String.isNullOrWhiteSpace(token.SearchQuery))
            token.Properties.SearchQuery = token.SearchQuery;
            if (token.SearchNear && !String.isNullOrWhiteSpace(token.SearchNear.Text))
            token.Properties.SearchNear = token.SearchNear;
            if (token.AccountType)
            token.Properties.AccountType = token.AccountType;
            if (token.AccountId > 0)
            token.Properties.AccountId = token.AccountId;
            if (token.ProductId > 0)
            token.Properties.ProductId = token.ProductId;
            if (token.CommunityId > 0)
            token.Properties.CommunityId = token.CommunityId;
            }
            $.each(token.Properties, function (name, value) {
            intSize = 0;
            switch (name) {
            case 'LocationId':
            if (value && value > 0 && value != Settings.Location.Country) {
            buffer.push(Model.Session.NavigationProperty.LocationId);
            intSize = 4;
            }
            break;
            case 'CategoryId':
            if (value && value > 0) {
            buffer.push(Model.Session.NavigationProperty.CategoryId);
            intSize = 2;
            }
            break;
            case 'SearchQuery':
            if (!String.isNullOrWhiteSpace(value)) {
            buffer.push(Model.Session.NavigationProperty.SearchQuery);
            sb = System.Text.Encoding.Unicode.getBytes(token.SearchQuery);
            buffer.push.apply(buffer, System.BitConverter.getBytes(sb.length, 2));
            buffer.push.apply(buffer, sb);
            }
            return;
            case 'SearchNear':
            if (value && !String.isNullOrWhiteSpace(value.Text) && value.Geolocation && value.Geolocation.Lat != 0 && value.Geolocation.Lng != 0) {
            buffer.push(Model.Session.NavigationProperty.SearchNear);
            sb = System.Text.Encoding.Unicode.getBytes(JSON.stringify(token.SearchNear));
            buffer.push.apply(buffer, System.BitConverter.getBytes(sb.length, 2));
            buffer.push.apply(buffer, sb);
            }
            return;
            case 'AccountType':
            if (value && value > 0) {
            buffer.push(Model.Session.NavigationProperty.AccountType);
            intSize = 1;
            }
            break;
            case 'AccountId':
            if (value && value > 0) {
            buffer.push(Model.Session.NavigationProperty.AccountId);
            intSize = 4;
            }
            break;
            case 'ProductId':
            if (value && value > 0) {
            buffer.push(Model.Session.NavigationProperty.ProductId);
            intSize = 8;
            }
            break;
            case 'CommunityId':
            if (value && value > 0) {
            buffer.push(Model.Session.NavigationProperty.CommunityId);
            intSize = 4;
            }
            break;
            default:
            return;
            }

            if (intSize > 0) {
            var intBytes = System.BitConverter.getBytes(value, intSize);
            buffer.push.apply(buffer, intBytes);
            }
            });
            var base64 = System.Convert.toBase64String(buffer);
            return base64;
            },

            Deserialize: function (base64) {
            var token = System.Convert.fromBase64String(base64);
            var t = new Session.Navigation.Token();
            t.Action = token[0];
            var index = 1, length = token.length;
            var propName;
            var count;
            while (index < length) {
            propName = token[index++];
            switch (propName) {
            case Model.Session.NavigationProperty.LocationId:
            t.LocationId = System.BitConverter.ToInt(token, index, 4);
            index += 4;
            break;
            case Model.Session.NavigationProperty.CategoryId:
            t.CategoryId = System.BitConverter.ToInt(token, index, 2);
            index += 2;
            break;
            case Model.Session.NavigationProperty.SearchQuery:
            count = System.BitConverter.ToInt(token, index, 2);
            index += 2;
            t.SearchQuery = System.Text.Encoding.Unicode.getString(token, index, count);
            index += count;
            break;
            case Model.Session.NavigationProperty.SearchNear:
            count = System.BitConverter.ToInt(token, index, 2);
            index += 2;
            t.SearchNear = JSON.parse(System.Text.Encoding.Unicode.getString(token, index, count));
            index += count;
            break;
            case Model.Session.NavigationProperty.AccountType:
            t.AccountType = System.BitConverter.ToInt(token, index, 1);
            index += 1;
            break;
            case Model.Session.NavigationProperty.AccountId:
            t.AccountId = System.BitConverter.ToInt(token, index, 4);
            index += 4;
            break;
            case Model.Session.NavigationProperty.ProductId:
            t.ProductId = System.BitConverter.ToInt(token, index, 8);
            index += 8;
            break;
            case Model.Session.NavigationProperty.CommunityId:
            t.CommunityId = System.BitConverter.ToInt(token, index, 4);
            index += 4;
            break;
            default:
            throw String.format('Unexpected attribute {0} in token {1}', propName, base64);
            }
            };
            return t;
            }*/
        })
    }
});

Session.Token = new Session.Navigation.TokenManager();

(function () {
    Session.Storage = window.sessionStorage;
     if (Session.Storage)
        Session.Enabled = true;
    else
        Session.Enabled = false;
})();

(function() {
    var masterCache = {};
    Session.Cache = {
        Type: {
            MasterDictionary: 1,
            PersonalList: 2,
            Community: 3,
            CommunityInvitation: 4,
            CommunityMembership: 4,
            CommunityRequest: 5,
            Affiliation: 6,
            AffiliationInvitation: 7,
            BusinessCategory: 8,
            CommunityCategory: 9,
            CommunityForum: 10,
            Promotion: 11,
            ProductTag: 12,
            MessageFolder: 13,
            ConversationPeer: 14,
            LocationSettings: 15
        },

        Get: function (cacheType, factory) {
            var cache = masterCache[cacheType];
            if (cache == undefined)
            {
                cache = factory(cacheType);
                masterCache[cacheType] = cache;
            }
            return cache;
        },

        Preserve: function () {
            for (var cacheType in masterCache)
                masterCache[cacheType].Preserve();
        },

        Reset: function (full) {
            var cache;
            for (var cacheType in masterCache) {
                cache = masterCache[cacheType];
                if(cache.IsUserSpecific || full)
                    cache.Reset();
            }
        }
    };
})();

//http://www.webreference.com/authoring/languages/html/HTML5-Client-Side/
Session.CacheBase = Class.extend({
    ctor: function (type, items) {
        this.type = type;
        this.PreservePending = false;
        this.IsUserSpecific = true;
        this.IsBusinessSpecific = false;
        if (Session.Enabled) {
            this.Enabled = true;
            try {
                var cachedItems = Session.Storage.getItem(type);
                if (cachedItems)
                    this.items = this.Deserialize(cachedItems);
                else
                    this.items = items;
            }
            catch (e) {
                console.error(errorMessage(e));
                this.items = items;
            }
        }
        else
            this.Enabled = false;
    },

    Deserialize: function (items) {
        return JSON.parse(items)
    },

    CheckSession: function () {
        if (this.IsUserSpecific)
        {
            if (Session.User.Id > 0 && (!this.IsBusinessSpecific || Session.User.Business.Id > 0))
                return true;
            else
                throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
        }
        else
            return true; 
    },

    Preserve: function () {
        if (this.Enabled && this.PreservePending) {
            Session.Storage.setItem(this.type, this.Serialize(this.items));
        }
    },

    Reset: function () {
        if (this.Enabled) {
            Session.Storage.removeItem(this.type);

            if (this.items && this.items.length > 0)
                this.items.length = 0;

            this.PreservePending = false;
        }
    },

    Add: function (item) {
        if (this.Enabled) {
            this.items.push(item);
            this.PreservePending = true;
        }
    },

    Remove: function (key) {
        if (this.Enabled) {
            var index = -1;
            for (var i = 0, l = this.items.length; i < l; i++) {
                if (this.items[i][this.ItemKey] == key) {
                    index = i;
                    break;
                }
            }
            if (index >= 0)
                this.items.splice(index, 1);
            this.PreservePending = true;
        }
    },

    GetItemInner: function (items, key, itemKey) {
        if (this.Enabled && items) {
            for (var i = 0, l = items.length; i < l; i++)
                if (items[i][itemKey||this.ItemKey] == key) {
                    return items[i];
                }
        }
    },

    GetItem: function (key, callback) {
        if (this.Enabled) {
            var $this = this;
            return this.GetItems(function (items) {
                callback($this.GetItemInner(items, key));
            });
        }
    },

    //2 overloads
    //void Exists(string name, K key, Action<bool> callback)
    //bool Exists(string name, K key, IdName<K>[] items)
    Exists: function (name, key) {
        if(arguments.length == 3) 
        {
            if(typeof arguments[2] == 'function')
            {
                var callback = arguments[2];
                if (this.Enabled) {
                    var $this = this;
                    this.GetItems(function (items) {
                        callback($this.Exists(name, key, items));
                    });
                }
            }
            else if (arguments[2] && arguments[2].any)
            {
                name = name.toLowerCase();
                return arguments[2].any(function (i) { return i != key && i.Name.toLowerCase() == name ? true : false });
            }
        }
    }
});

Session.FetchOneCache = Session.CacheBase.extend({
    ctor: function (type) {
        Session.CacheBase.prototype.ctor.call(this, type, []);
        this.pending = [];
    },

    //sequence managing:
    //UI logic may issue two subsequent requests to the cache for items with different keys 1 and 2 
    //If second request superseds the first one, that is it replaces it, 
    //If first is a miss it will start asynchronous fetch 
    //If second is a hit and returns requested data immediately
    //asynchronous fetch for first comes back out-of-sequence and may overwrite UI
    get: function (getMethod, key, callback, pendingCallbacks) {
        if (!this.fetching) {
            var promise = getMethod.call(this, key, callback);
            if (promise && promise.then) {
                var $this = this;
                this.fetching = true;
                promise.then(function () {
                    $this.fetching = false;
                    console.log('FetchOneCache.get1(' + key + '): Promise finished');
                    while (pendingCallbacks.length > 0 && !$this.fetching) {
                        var queuedItem = pendingCallbacks.pop();
                        console.log('FetchOneCache.get1(' + queuedItem.Key + '): Processing queued request');
                        $this.get(getMethod, queuedItem.Key, queuedItem.Value, pendingCallbacks);
                    }
                });
                console.log('FetchOneCache.get1(' + key + '): Promise created');
            }
            return promise;
        }
        else {
            console.log('FetchOneCache.get1(' + key + '): Fetch in progress, queuing up request');
            pendingCallbacks.push({ Key: key, Value: callback });
        }
    },

    GetItem: function (key, callback) {
        this.get(function (key, callback) {
            this.CheckSession();
            if (this.Enabled) {
                var item = this.GetItemInner(this.items, key);
                if (item == undefined) {
                    var $this = this;
                    console.log('FetchOneCache.get2(' + key + '): cache miss, fetching data');
                    var promise = this.fetch(key, function (data) {
                        console.log('FetchOneCache.get2(' + key + '): fetch callback');
                        if (data != undefined && !$this.GetItemInner($this.items, data[$this.ItemKey])) {
                            $this.items.push(data);
                            $this.PreservePending = true;
                        }

                        callback(data);
                    });
                    return promise;
                }
                else {
                    console.log('FetchOneCache.get2(' + key + '): cache hit');
                    callback(item);
                }
            }
            else {
                this.fetch(key, function (item) {
                    callback(item);
                });
            }
        }, key, callback, this.pending);
    }

    /*GetItem: function (key, callback) {
        this.CheckSession();
        if (this.Enabled) {
            var item = this.getItem(this.items, key);
            if (item == undefined) {
                var $this = this;
                this.fetch(key, function (data) {
                    if (data != undefined && !$this.getItem($this.items, data[$this.ItemKey])) {
                        $this.items.push(data);
                        $this.PreservePending = true;
                    }

                    callback(data);
                });
            }
            else
                callback(item);
        }
        else {
            this.fetch(key, function (item) {
                callback(item);
            });
        }
    }*/
});

Session.FetchAllCache = Session.CacheBase.extend({
    ctor: function (type) {
        Session.CacheBase.prototype.ctor.call(this, type, undefined);
        this.fetching = false;
        this.callbacks = [];
    },

    //overload for void Get(Foundation.Controls.Action<V[]> callback)
    GetItems: function (callback) {
        //void Get(K key, Foundation.Controls.Action<V> callback) in CacheBase
        /*if (arguments.length == 2 && typeof arguments[0] == 'number' && typeof arguments[1] == 'function') {
            return Session.CacheBase.prototype.GetItem.apply(this, arguments);
        }
        else if(arguments.length == 1 && typeof arguments[0] == 'function')*/
        this.CheckSession();
        if (this.Enabled) {
            if (this.items == undefined) {
                if (!this.fetching) {
                    var $this = this;
                    this.fetching = true;
                    return this.fetch(function (items) {
                        $this.fetching = false;
                        if (items) {
                            //Test for duplicates
                            var key;
                            var test = {}; 
                            for (var i = 0, l = items.length; i < l; i++) {
                                key = items[i][$this.ItemKey];
                                if (test[key]) {
                                    throw new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord);
                                }
                                else
                                    test[key] = items[i];
                            }
                            $this.items = items;
                        }
                        else if (!$this.items)
                            $this.items = [];
                        else if ($this.items.length > 0)
                            $this.items.length = 0;
                        $this.PreservePending = true;
                        callback($this.items);
                        while ($this.callbacks.length > 0)
                            $this.callbacks.pop()($this.items);
                    }, function (ex) {
                        $this.fetching = false;
                        showError(ex, true);
                    });
                }
                else
                    this.callbacks.push(callback);
            }
            else
                callback(this.items);
        }
        else {
            return this.fetch(function (items) {
                callback(items);
            });
        }
    },

    Find: function(keys, callback) {
        var $this = this;
        this.GetItems(function (values) {
            var value, q = [];
            for (var i = 0, l = keys.length; i < l; i++) {
                value = $this.GetItemInner(values, keys[i]);
                if(value)
                    q.push(value);
            }
            callback(q);
        });
    },

    Reset: function () {
        Session.CacheBase.prototype.Reset.call(this);
        if (this.Enabled)
            this.items = undefined;
    }
});

Session.TreeCache = Session.FetchAllCache.extend({

    Reset: function () {
        Session.FetchAllCache.prototype.Reset.call(this);
        delete this.isFlat;
    },

    Deserialize: function (items) {
        if (this.isFlat != undefined)
            delete this.isFlat;
        items = JSON.parse(items);
        this.build(items);
        return items;
    },

    GetChildren: function (parentKey, callback) {
        var $this = this;
        this.GetItems(function (items) {
            if ($this.isFlat === true && parentKey == 0)
                callback(items);
            else if ($this.isFlat === false) {
                callback(jQuery.map(items, function (n) {
                    if (n.ParentId == parentKey)
                        return n;
                }));
            }
            else
                callback(null);
        });
    },

    GetItems: function (callback) {
        //void Get(K key, Foundation.Controls.Action<V> callback) in CacheBase
        /*if (arguments.length == 2 && typeof arguments[0] == 'number' && typeof arguments[1] == 'function') {
            return Session.CacheBase.prototype.Get.apply(this, arguments);
        }
        else if (arguments.length == 1 && typeof arguments[0] == 'function')*/
        var $this = this;
        return Session.FetchAllCache.prototype.GetItems.call(this, function (items) {
            $this.build(items)
            callback(items);
        });
    },

    build: function(items) {
        if (this.isFlat == undefined) {
            for (var i = 0, l = items.length; i < l; i++) {
                if (items[i].ParentId > 0) {
                    this.isFlat = false;
                    break;
                }
            }
            if (this.isFlat === false) {
                for (var i = 0, l = items.length; i < l; i++) {
                    for (var j = 0; j < items.length; j++) {
                        if (items[j].ParentId == items[i].Id) {
                            items[i].HasChildren = true;
                            this.setChildren(items[i], items);
                        }
                    }
                }
            }
            else
                this.isFlat = true;
        }
    },

    setChildren: function (parent, items)
    {
        if(parent.HasChildren && !parent.Children)
        {
            var children = [];
            for (var i = 0, l = items.length; i < l; i++) {
                if (items[i].ParentId == parent.Id) {
                    children.push(items[i]);
                    items[i].Parent = parent;
                    this.setChildren(items[i], items);
                }
            }

            parent.Children = children;
        }
    },

    Add: function (item) {
        Session.CacheBase.prototype.Add.call(this, item);
        //could simply reset too
        if (item.ParentId > 0 && this.isFlat !== undefined)
        {
            if (this.isFlat)
                this.isFlat = false;
            var $this = this;
            this.GetItems(function (items) {
                var parent = $this.GetItemInner(items, item.ParentId);
                if (parent)
                {
                    item.Parent = parent;
                    if(!parent.Children)
                        parent.Children = [];
                    parent.Children.push(item);
                    parent.HasChildren = true;
                }
            });
        }
    },

    Remove: function (key) {
        var $this = this;
        this.GetItems(function (items) {
            var item = $this.GetItemInner(items, key);
            Session.CacheBase.prototype.Remove.call($this, key);
            //could simply reset too
            if (item && item.ParentId > 0 && $this.isFlat === false)
            {
                var parent = $this.GetItemInner(items, item.ParentId);
                if (parent && parent.Children)
                {
                    if (parent.Children.length == 1 && parent.Children[0].Id == key)
                    {
                        delete parent.Children;
                        delete parent.HasChildren;
                    }
                    else
                    {
                        var index = -1;
                        for (var i = 0, l = parent.Children.length; i < l; i++) {
                            if (parent.Children[i][$this.ItemKey] == key) {
                                index = i;
                                break;
                            }
                        }
                        if (index >= 0)
                            parent.Children.splice(index, 1);
                        if (parent.Children.length == 0)
                        {
                            delete parent.Children;
                            delete parent.HasChildren;
                        }
                    }

                    if (!parent.Children)
                    {
                        var isFlat = true;
                        for (var i = 0, l = items.length; i < l; i++) {
                            for (var j = 0; j < items.length; j++) {
                                if (items[j].ParentId == items[i].Id) {
                                    isFlat = false;
                                    break;
                                }
                            }
                            if(!isFlat)
                                break;
                        }

                        if (isFlat === true)
                            $this.isFlat = true;
                    }
                }
            }
        });
    },

    //GetParent: function(key, callback) {
    //    var $this = this;
    //    this.GetItems(function (items) {
    //        var item = $this.getItem(items, key);
    //        if (item)
    //            callback(item.ParentId);
    //        else
    //            callback(0);
    //    });
    //},

    GetDisplayPath: function (key, callback) {
        var $this = this;
        this.GetItems(function (items) {
            var path = '', parent = key, node;
            while (parent > 0)
            {
                var node = this.GetItemInner(items, parent);
                if (node)
                {
                    if (path.length)
                        path += '\\';
                    path = node.Name + path;
                    parent = node.ParentId;
                }
                else
                    parent = 0;
            }
            callback({ Id: key, Name: path });
        });
    },

    GetPath: function (key, callback) {
        var $this = this;
        this.GetItems(function (items) {
            var path = [];
            $this.getPathInner(items, path, key);
            callback(path);
        });
    },

    getPathInner: function (items, path, key) {
        if (key > 0) {
            var item = this.GetItemInner(items, key);
            if (item) {
                this.getPathInner(items, path, item.ParentId);
                path.push({ Id: item.Id, Name: item.Name, ParentId: item.ParentId });
            }
        }
    }
});