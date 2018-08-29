Navigation = {

    UrlParams: {},
    ForeignOrigin: function () {
        return document.referrer && !document.referrer.indexOf(Settings.WebSite.Origin.Host) == -1 ? true : false;
    },

    Target: {
        Application: 1,
        Html: 2
    },

    Menu: {
        Type:  {
            MainMenu: 1,
            SubMenu: 2,
            PopupMenu: 4
        },

        Item: Class.define({
            ctor: function (type, item) {
                this.Type = type;
                if (item.Exclude)
                    this.Exclude = item.Exclude;
                this.Text = item.Text;
                if (item.Command)
                    this.Command = item.Command;
                if (item.SubItems) {
                    this.SubItems = item.SubItems;
                    this.SubItems.itemFromType = function (type) {
                        for (var i = 0, l = this.length; i < l; i++) {
                            if (this[i].Type == type)
                                return this[i];
                        }
                    };
                }
                this.$visible = item.Visible ? true : false;
            },

            Visible: function (visible) {
                if (visible != undefined) {
                    this.$visible = visible;
                    if (this.Container) {
                        if (visible)
                            this.Container.show();
                        else
                            this.Container.hide();
                    }
                }
                else
                    return this.$visible;
            }
        }),

        MainItem: {
            ItemType: {
                Scroll: 1,
                Advertise: 2,
                Personal: 3,
                Business: 4,
                Community: 5,
                Messages: 6,
                Admin: 7
            }
        },

        SubItem: {
            ItemType: {
                Scroll_Businesses: 1,
                Scroll_Products: 2,
                Scroll_Communities: 3,
                Advertise_Personal: 4,
                Advertise_Business: 5,
                Advertise_Review: 6,
                Advertise_Review_Peer: 7,
                Advertise_Review_Staff: 8,
                Advertise_NewlyPosted: 9,
                Advertise_Offensive: 10,
                Personal_Profile: 11,
                Personal_Products: 12,
                Personal_Lists: 13,
                Personal_Messages: 14,
                Personal_Communities: 15,
                Business_Profile: 16,
                Business_Products: 17,
                Business_Product_Catalog: 18,
                Business_Promotions: 19,
                Business_Connections: 20,
                Business_Messages: 21,
                Business_Communities: 22,
                Community_Profile: 23,
                Community_Forums: 24,
                Community_Products: 25,
                Community_Members: 26,
                Messages_Received: 27,
                Messages_Sent: 28,
                Messages_Conversations: 29,
                Admin_Categories: 30,
                Admin_Locations: 31
            }
        }
    },

    Main: {
        //Suceeded by ValidateToken
        Validate: function () {
            try {
                //http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
                var paramIdx = location.search.indexOf('?');
                if (paramIdx >= 0 && location.search.length > 1) {
                    var params = location.search.slice(paramIdx + 1).split('&'), param;
                    for (var i = 0, l = params.length; i < l; i++) {
                        param = $.trim(params[i]).split('=');
                        Navigation.UrlParams[param[0]] = param[1];
                    }
                }

                var token = null;
                var valid = false;
                var query;

                var url = location.pathname/*.replace(/.cshtml/g, '')*/;
                var pageUri = url;
                var homePage = url.match(/home$/i);

                if (Navigation.UrlParams[Settings.WebSite.NavToken.QueryParamName])
                    query = Navigation.UrlParams[Settings.WebSite.NavToken.QueryParamName];
                else if (location.hash.indexOf(Settings.WebSite.NavToken.FragmentPrefix) == 0 && location.hash.length > 1)
                    query = location.hash.substring(Settings.WebSite.NavToken.FragmentPrefix.length, location.hash.length);
                else if (Navigation.UrlParams._escaped_fragment_)
                    query = Navigation.UrlParams._escaped_fragment_;
                
                if (query) {
                    token = Session.Token.Deserialize(decodeURIComponent(query));
                    //Currently Url is not preserved during token conversion, so when new token is created from byte[] it will have empty Url
                    if (!token.ViewUri || token.ViewUri.length == 0)
                        token.setViewUri(pageUri);

                    switch (Session.Token.Validate(token)) {
                        case Session.Navigation.ValidateStatus.Current:
                        case Session.Navigation.ValidateStatus.SetOwner:
                            valid = true;
                            break;
                        case Session.Navigation.ValidateStatus.SignInForward:
                            token = new Session.Navigation.Token(Settings.WebSite.HomePage, Model.Session.Action.Default, null, token);
                            //Suceeded by Session.Flags.SignInForwardToken
                            Session.SignInForward = token;
                            break;
                        case Session.Navigation.ValidateStatus.SetUser:
                            if (token.CategoryId > 0)
                                Session.User.CategoryId = token.CategoryId;
                            if (token.LocationId > 0 && token.LocationId != Settings.Location.Country)
                                Session.User.LocationId = token.LocationId;
                            valid = true;
                            break;
                    }
                }
                else if (this.GetToken || homePage) {
                    if (this.GetToken)
                        token = this.GetToken(pageUri);
                    else if (homePage)
                        token = new Session.Navigation.Token(pageUri, Model.Session.Action.Default);
                    if (token) {
                        Session.Token.SetCurrent(token);
                        valid = true;
                    }
                }

                return valid;
            }
            catch (e) {
                console.error(errorMessage(e));
                return false;
            }
        },

        Go: function (token, options) {

            if (!token.Action)
                throw 'Action is required';

            if (!token.ViewUri)
                throw 'View Uri is required';

            var url, page, query;
            options = options || { Target: Navigation.Target.Html };

            Session.Flags.Navigating = true;
            //need to handoff session and preserve cache regardless of the Navigating flag as if Browser Back button was clicked it will bypass the Navigation routine
            //it is currently done in the window.onbeforeunload event in _Master.cshtml
            //Session.Handoff();

            if (options.Target == Navigation.Target.Html) {
                page = token.ViewUri;
                if (!token.ViewUri.match(/home$/i) || token.CategoryId || (token.LocationId && token.LocationId != Settings.Location.Country) || token.Forward) {
                    query = Session.Token.Serialize(token);
                }

                var reload;
                //https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history?redirectlocale=en-US&redirectslug=Web%2FGuide%2FDOM%2FManipulating_the_browser_history#The_pushState().C2.A0method
                if (!history.pushState) {
                    url = Settings.WebSite.Origin.ServerPath + page + (query ? Settings.WebSite.NavToken.FragmentPrefix + encodeURIComponent(query) : '');
                    location.href = url; //IE 8 won't set referrer this way, referrer may not be set in other cases too (back button)

                    //Setting location.href won't seem to navigate if page is the same and only hash is changing (IE, Chrome, FF)
                    if (location.pathname == token.ViewUri && query) {
                        //Also, the new hash value seems to be ignored when pathname stays the same, so when page refreshes - it may create a token from an old hash
                        location.hash = Settings.WebSite.NavToken.FragmentPrefix + encodeURIComponent(query);
                        reload = true;
                    }
                }
                else {
                    url = Settings.WebSite.Origin.ServerPath + page + (query ? '?' + Settings.WebSite.NavToken.QueryParamName + '=' + encodeURIComponent(query) : '');
                    if (location.pathname == token.ViewUri) {
                        history.pushState(token, null, url);
                        reload = true;
                    }
                    else
                        location.href = url;
                }

                //https://developer.mozilla.org/en-US/docs/Web/API/window.location?redirectlocale=en-US&redirectslug=DOM%2Fwindow.location
                if (reload)
                    window.location.reload();

                //location.href = //IE 8 won't set referrer this way, referrer may not be set in other cases too (back button)
                /*var a = document.createElement('a');
                if (a.click) {
                a.href = page;
                document.body.appendChild(a);
                a.click();
                }
                else
                location.href = page;*/
            }
            else if (options.Target == Navigation.Target.Application) {
                if (token.ViewUri) {
                    page = '/app#' + token.ViewUri;
                    if (!token.ViewUri.match(/home$/i) || token.CategoryId || token.LocationId) {
                        query = Session.Token.Serialize(token);
                    }
                }
                else if (token.Action == Model.Session.Action.Default)
                    page = '/app';
                else
                    throw 'Invalid Url and/or Action';

                Session.Flags.Cleanup = true;

                url = Settings.WebSite.Origin.ServerPath + page + (query ? '/' + encodeURIComponent(query) : '');
                location.href = url;
            }

            return url;
        },

        Href: function (token, options) {
            switch(typeof token)
            {
                case "object":
                    if (token.Action && token.ViewUri) {
                        var origAction;
                        if (options && options.bizsrtAction) {
                            origAction = token.Action;
                            token.Action = options.bizsrtAction;
                        }
                        var query = Session.Token.Serialize(token, false, (options && options.bizsrtProps) || {});
                        if (origAction)
                            token.Action = origAction;
                        if (!options || !options.baseUri) {
                            var target = token.ViewUri;
                            if (!token.ViewUri.match(/home$/i) || token.CategoryId || token.LocationId || token.Forward) {
                                target += ('?' + Settings.WebSite.NavToken.QueryParamName + '=' + encodeURIComponent(query));
                            }
                            return Settings.WebSite.Origin.AbsoluteUri + target;
                        }
                        else
                            return options.baseUri + (options.queryPrefix || ('?' + Settings.WebSite.NavToken.QueryParamName + '=')) + encodeURIComponent(query);
                    }
                    break;
                case "string":
                    return token;
            }
            return '#';
        },

        Reflect: function (token) {
            var query = Session.Token.Serialize(token);
            if (history.replaceState)
                history.replaceState(token, null, Settings.WebSite.Origin.ServerPath + token.ViewUri + (query ? '?' + Settings.WebSite.NavToken.QueryParamName + '=' + encodeURIComponent(query) : ''));
            else
                location.replace(Settings.WebSite.NavToken.FragmentPrefix + encodeURIComponent(query));  //location.hash = encodeURIComponent(query) would add to history
            return;
        },

        CreateAccount: function (options) {
            var token = new Session.Navigation.Token("/Account/Create", Model.Session.Action.AccountCreate);
            return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
        },

        RecoverPassword: function () {
            return Navigation.Main.Go(new Session.Navigation.Token("/Account/Password/Recover", Model.Session.Action.PasswordRecover));
        },

        Refresh: function (token) {
            Session.Flags.Navigating = true;
            window.location.reload();
        },

        TryForward: function (setProp, carryCancel) {
            try {
                var token = Session.Token.Current;
                //if (setProp)
                //    setProp(token.Forward);
                if (token.Forward && token.Forward.Action != Model.Session.Action.None && token.Forward.ViewUri) {
                    Navigation.Main.Go(token.Forward);
                    return true;
                }
            }
            catch (e) {
                console.error(errorMessage(e));
            }

            return false;
        },

        TryBackward: function ()
        {
            try
            {
                var token = Session.Token.Current;
                if (token.Cancel && token.Cancel.Action != Model.Session.Action.None && token.Cancel.ViewUri) {
                    Navigation.Main.Go(token.Cancel);
                    return true;
                }
                else if (history.length) {
                    history.back();
                    return true;
                }
            }
            catch (e) {
                console.error(errorMessage(e));
            }

            return false;
        },

        Error: function (type, data) {
            if (Session.OutOfBand())
                return;
            switch (type) {
                case 'Session':
                    var errMessage = errorMessage(data) || Resource.Exception.Unknown;
                    location.href = Settings.WebSite.Origin.ServerPath + '/error/session#' + encodeURIComponent(errMessage);
                    break;
            }
        },

        NotFound: function (entity) {
            return Navigation.Main.Go(new Session.Navigation.Token("/Error/NotFound", Model.Session.Action.Error));
        },

        Home: function () {
            return Navigation.Main.Go(new Session.Navigation.Token(Settings.WebSite.HomePage, Model.Session.Action.Default));
        }
    },

    Product: {
        Home: function () {
            return Navigation.Main.Go(new Session.Navigation.Token("/Product/Home", Model.Session.Action.Default));
        },

        Search: function (type, category, query, location, near, options) {
            if (category > 0 || !String.isNullOrWhiteSpace(query)) {
                var token = new Session.Navigation.Token("/Product/Search", Model.Session.Action.ProductSearch);

                if (type)
                    token.ProductType = type;

                if (category > 0)
                    token.CategoryId = category;

                if (!String.isNullOrWhiteSpace(query))
                    token.SearchQuery = query;

                if (near && !String.isNullOrWhiteSpace(near.Text))
                    token.SearchNear = near;
                else
                    token.LocationId = location;

                return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
            }
        },

        View: function (type, account, productId, options) {
            var token;

            switch (type) {
                case Model.AccountType.Business:
                    token = new Session.Navigation.Token("/Business/Product", Model.Session.Action.ProductView);
                    break;
                case Model.AccountType.Personal:
                    token = new Session.Navigation.Token("/Personal/Product", Model.Session.Action.ProductView);
                    break;
            }

            if (token) {
                token.AccountType = type;
                token.AccountId = account;
                token.ProductId = productId;
                return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
            }
            else if (!options || !options.suppressNavigate)
                return Navigation.Main.Home();
        },

        ListView: function (type, accountId, query, options) {
            var token;

            switch (type) {
                case Model.AccountType.Business:
                    token = new Session.Navigation.Token("/Business/Products", Model.Session.Action.ProductsView);
                    if (!String.isNullOrWhiteSpace(query))
                        token.SearchQuery = query;
                    break;
                case Model.AccountType.Personal:
                    token = new Session.Navigation.Token("/Personal/Products", Model.Session.Action.ProductsView);
                    break;
            }

            if (token) {
                token.AccountType = type;
                token.AccountId = accountId;
                return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
            }
            else if (!options || !options.suppressNavigate)
                return Navigation.Main.Home();
        },

        New: function (type, category, cancel)
        {
            //if (!cancel)
            //    cancel = Session.Token.Current;

            var url, options;
            var action = Model.Session.Action.None;
            var accountType;
            var accountId = 0;
            if ((type & Model.Session.PostType.Business) > 0)
            {
                accountId = Session.User.Business.Id;
                accountType = Model.AccountType.Business;
                action = Model.Session.Action.ProductNew;
                url = "/Admin/Business/Product";
                options = { Target: Navigation.Target.Application };
            }
            else if ((type & Model.Session.PostType.Personal) > 0)
            {
                accountId = Session.User.Id;
                accountType = Model.AccountType.Personal;
                action = Model.Session.Action.ProductNew;
                url = "/Admin/Personal/Product";
                
            }
            else if ((type & Model.Session.PostType.NoAccount) > 0)
            {
                action = Model.Session.Action.ProductNew;
                url = "/Admin/Personal/Product";
            }

            //if (category > 0 && (addSteps & Session.Navigation.StepType.Cancel) == 0)
            //    addSteps |= Session.Navigation.StepType.Cancel;

            if (action != Model.Session.Action.None && url)
            {
                var currentToken;
                var productToken;

                if (category <= 0)
                {
                    productToken = new Session.Navigation.Token(url, action);
                    currentToken = new Session.Navigation.Token("/Product/Category", Model.Session.Action.CategorySelect, cancel, productToken);
                }
                else
                {
                    currentToken = new Session.Navigation.Token(url, action, cancel);
                    productToken = currentToken;
                }

                if(accountType)
                {
                    productToken.AccountId = accountId;
                    productToken.AccountType = accountType;
                    if(accountType == Model.AccountType.Business)
                        productToken.AccountId = Session.User.Business.Id;
                    else
                        productToken.AccountId = Session.User.Id;
                }
                else if (category > 0)
                    currentToken.CategoryId = category;

                //currentToken.ProductId = 0;
                Session.User.CategoryId = category;

                return Navigation.Main.Go(currentToken, options/*{ Target: Navigation.Target.Application }*/);
            }
            else
                return Navigation.Main.Home();
        },

        Category: function(productToken)
        {
            var token = new Session.Navigation.Token("/Product/Category", Model.Session.Action.CategorySelect, null, productToken);
            return Navigation.Main.Go(token);
        },

        Review: function (staff) {
            if (typeof staff != 'boolean')
                staff = Session.User.SecurityProfile.CanReview_Staff ? true : false;
            var token = new Session.Navigation.Token("/Admin/Product/Review", Model.Session.Action.AdReview);
            if (staff && Session.User.SecurityProfile.CanReview_Staff)
                token.PendingStatus = Model.Product.PendingStatus.StaffReview;
            else
                token.PendingStatus = Model.Product.PendingStatus.PeerReview;
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token);
        },

        NewlyPosted: function () {
            var token = new Session.Navigation.Token("/Admin/Product/Feed", Model.Session.Action.AdReview);
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token);
        },

        Edit: function(type, productId, key, cancel, forward) {
            var token, options;

            switch (type) {
                case Model.AccountType.Business:
                    token = new Session.Navigation.Token("/Admin/Business/Product", Model.Session.Action.ProductEdit);
                    token.AccountType = Model.AccountType.Business;
                    token.AccountId = Session.User.Business.Id;
                    options = { Target: Navigation.Target.Application };
                    break;
                case Model.AccountType.Personal:
                    token = new Session.Navigation.Token("/Admin/Personal/Product", Model.Session.Action.ProductEdit);
                    if (Session.User.Id > 0) {
                        token.AccountType = Model.AccountType.Personal;
                        token.AccountId = Session.User.Id;
                    }
                    else if (key)
                        token.Key = key;
                    break;
            }

            if (token) {
                token.ProductId = productId;
                return Navigation.Main.Go(token, options/*{ Target: Navigation.Target.Application }*/);
            }
            else
                return Navigation.Main.Home();
        },

        Offensive: function (product) {
            var token = new Session.Navigation.Token("/Admin/Offensive/List", Model.Session.Action.OffensiveList);
            if (product > 0)
                token.ProductId = product;
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token);
        },

        ListEdit: function(type, query) {
            var token, options;

            switch (type) {
                case Model.AccountType.Business:
                    token = new Session.Navigation.Token("/Admin/Business/Products", Model.Session.Action.ProductsEdit);
                    token.AccountType = Model.AccountType.Business;
                    token.AccountId = Session.User.Business.Id;
                    if (!String.isNullOrWhiteSpace(query))
                        token.SearchQuery = query;
                    options = { Target: Navigation.Target.Application };
                    break;
                case Model.AccountType.Personal:
                    token = new Session.Navigation.Token("/Admin/Personal/Products", Model.Session.Action.ProductsEdit);
                    token.AccountType = Model.AccountType.Personal;
                    token.AccountId = Session.User.Id;
                    break;
            }

            if (token)
                return Navigation.Main.Go(token, options);
            else
                return Navigation.Main.Home();
        },

        Pending: function(product, pendingStatus) {
            var token = new Session.Navigation.Token("/Admin/Product/Pending", Model.Session.Action.ProductPending);
            token.ProductId = product;
            token.PendingStatus = pendingStatus;
            Navigation.Main.Go(token);
        }
    },

    Business: {
        Home: function () {
            return Navigation.Main.Go(new Session.Navigation.Token("/Business/Home", Model.Session.Action.Default));
        },

        Search: function (category, query, location, near, options) {
            if (category > 0 || !String.isNullOrWhiteSpace(query)) {
                var token = new Session.Navigation.Token("/Business/Search", Model.Session.Action.BusinessSearch);

                if (category > 0)
                    token.CategoryId = category;

                if (!String.isNullOrWhiteSpace(query))
                    token.SearchQuery = query;

                if (near && !String.isNullOrWhiteSpace(near.Text))
                    token.SearchNear = near;
                else
                    token.LocationId = location;

                return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
            }
        },

        ProfileView: function (businessId, options) {
            var token = new Session.Navigation.Token("/Business/Profile", Model.Session.Action.ProfileView);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = businessId;
            if (options && options.navigationFlags)
                token.NavigationFlags = options.navigationFlags;
            return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
        },

        CatalogView: function (businessId, businessCategoryId, options) {
            var token = new Session.Navigation.Token("/Business/Catalog", Model.Session.Action.CatalogView);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = businessId;
            if (businessCategoryId)
                token.BusinessCategoryId = businessCategoryId;
            return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
        },

        PromotionProductsView: function (businessId, promotionId, query) {
            var token = new Session.Navigation.Token("/Business/Promotion/Products", Model.Session.Action.PromotionProductsView);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = businessId;
            token.CommunityId = promotionId;
            if (!String.isNullOrWhiteSpace(query))
                token.SearchQuery = query;
            return Navigation.Main.Go(token);
        },

        ConnectionsView: function (businessId) {
            var token = new Session.Navigation.Token("/Business/Connections", Model.Session.Action.ConnectionsView);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = businessId;
            return Navigation.Main.Go(token);
        },

        ProfileNew: function () {
            var token = new Session.Navigation.Token("/Admin/Business/Profile", Model.Session.Action.ProfileNew, Session.Token.Current);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        },

        ProfileEdit: function () {
            var token = new Session.Navigation.Token("/Admin/Business/Profile", Model.Session.Action.ProfileEdit, Session.Token.Current);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = Session.User.Business.Id;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        },

        CatalogEdit: function (query) {
            var token = new Session.Navigation.Token("/Admin/Business/Catalog", Model.Session.Action.CatalogEdit);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = Session.User.Business.Id;
            if (!String.isNullOrWhiteSpace(query))
                token.SearchQuery = query;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        },

        MultiproductEdit: function () {
            var token = new Session.Navigation.Token("/Admin/Business/Multiproduct", Model.Session.Action.ProductsEdit);
            token.AccountType = Model.AccountType.Business;
            token.AccountId = Session.User.Business.Id;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        }
    },

    Personal: {
        ProfileEdit: function () {
            var token = new Session.Navigation.Token("/Admin/Personal/Profile", Model.Session.Action.ProfileEdit, Session.Token.Current);
            token.AccountType = Model.AccountType.Personal;
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token);
        },

        ProfileView: function (accountId) {
            var token = new Session.Navigation.Token("/Personal/Profile", Model.Session.Action.ProfileView);
            token.AccountType = Model.AccountType.Personal;
            token.AccountId = accountId;
            return Navigation.Main.Go(token);
        },

        ListProductsEdit: function () {
            var token = new Session.Navigation.Token("/Admin/Personal/Lists", Model.Session.Action.PersonalListProductsEdit);
            token.AccountType = Model.AccountType.Personal;
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token);
        },

        EmailChange: function () {
            var token = new Session.Navigation.Token("/Admin/Account/Email/Change", Model.Session.Action.EmailChange, Session.Token.Current);
            token.AccountType = Model.AccountType.Personal;
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        },
            
        PasswordChange: function () {
            var token = new Session.Navigation.Token("/Admin/Account/Password/Change", Model.Session.Action.PasswordChange, Session.Token.Current);
            token.AccountType = Model.AccountType.Personal;
            token.AccountId = Session.User.Id;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        }
    },

    Community: {
        Home: function () {
            return Navigation.Main.Go(new Session.Navigation.Token("/Community/Home", Model.Session.Action.Default));
        },

        Search: function (category, query, location, near, options) {
            if (category > 0 || !String.isNullOrWhiteSpace(query)) {
                var token = new Session.Navigation.Token("/Community/Search", Model.Session.Action.CommunitySearch);

                if (category > 0)
                    token.CategoryId = category;

                if (!String.isNullOrWhiteSpace(query))
                    token.SearchQuery = query;

                if (near && !String.isNullOrWhiteSpace(near.Text))
                    token.SearchNear = near;
                else
                    token.LocationId = location;

                return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
            }
        },

        ProfileView: function (communityId, options) {
            var token = new Session.Navigation.Token("/Community/Profile", Model.Session.Action.CommunityProfileView);
            token.CommunityId = communityId;
            return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
        },

        ProductsView: function (communityId, communityCategoryId, options) {
            var token = new Session.Navigation.Token("/Community/Products", Model.Session.Action.CommunityProductsView);
            token.CommunityId = communityId;
            if (communityCategoryId)
                token.CommunityCategoryId = communityCategoryId;
            return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
        },

        TopicsView: function (communityId, communityForumId, options) {
            var token = new Session.Navigation.Token("/Community/Topics", Model.Session.Action.CommunityTopicsView);
            token.CommunityId = communityId;
            if (communityForumId)
                token.CommunityForumId = communityForumId;
            return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
        },

        TopicPostsView: function (communityId, topicId, options) {
            var token = new Session.Navigation.Token("/Community/Topic/Posts", Model.Session.Action.CommunityTopicPostsView);
            token.CommunityId = communityId;
            token.CommunityTopicId = topicId;
            return options && options.suppressNavigate ? token : Navigation.Main.Go(token);
        },

        ProfileNew: function () {
            return Navigation.Community.ProfileEdit(Session.User.Business.Id > 0 ? Model.AccountType.Business : Model.AccountType.Personal, 0, Session.Token.Current);
        },

        ProfileEdit: function (type, communityId, cancel, forward) {
            var token = new Session.Navigation.Token("/Admin/Community/Profile", (communityId == 0 ? Model.Session.Action.CommunityProfileNew : Model.Session.Action.CommunityProfileEdit), cancel, forward);
            token.AccountType = type;
            switch (type) {
                case Model.AccountType.Business:
                    token.AccountId = Session.User.Business.Id;
                    break;
                case Model.AccountType.Personal:
                    token.AccountId = Session.User.Id;
                    break;
            }
            token.CommunityId = communityId;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        },

        ListEdit: function (type) {
            var token = new Session.Navigation.Token("/Admin/Community/List", Model.Session.Action.CommunitiesEdit);
            token.AccountType = type;
            var options;
            switch (type) {
                case Model.AccountType.Business:
                    token.AccountId = Session.User.Business.Id;
                    //options = { Target: Navigation.Target.Application };
                    break;
                case Model.AccountType.Personal:
                    token.AccountId = Session.User.Id;
                    break;
            }
            return Navigation.Main.Go(token, options);
        },

        ProductsEdit: function (type, communityId, query) {
            var token = new Session.Navigation.Token("/Admin/Community/Products", Model.Session.Action.CommunityProductsEdit);
            token.AccountType = type;
            switch (type) {
                case Model.AccountType.Business:
                    token.AccountId = Session.User.Business.Id;
                    break;
                case Model.AccountType.Personal:
                    token.AccountId = Session.User.Id;
                    break;
            }
            token.CommunityId = communityId;
            if (!String.isNullOrWhiteSpace(query))
                token.SearchQuery = query;
            Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        },

        TopicsEdit: function (type, communityId, query) {
            var token = new Session.Navigation.Token("/Admin/Community/Topics", Model.Session.Action.CommunityTopicsEdit);
            token.AccountType = type;
            switch (type) {
                case Model.AccountType.Business:
                    token.AccountId = Session.User.Business.Id;
                    break;
                case Model.AccountType.Personal:
                    token.AccountId = Session.User.Id;
                    break;
            }
            token.CommunityId = communityId;
            if (!String.isNullOrWhiteSpace(query))
                token.SearchQuery = query;
            return Navigation.Main.Go(token, { Target: Navigation.Target.Application });
        }
    },

    Message: {
        Received: function (type, query) {
            var token = new Session.Navigation.Token("/Admin/Message/Received", Model.Session.Action.MessagesReceived);
            token.AccountType = type;
            switch (type)
            {
                case Model.AccountType.Business:
                    token.AccountId = Session.User.Business.Id;
                    //options = { Target: Navigation.Target.Application };
                    break;
                case Model.AccountType.Personal:
                    token.AccountId = Session.User.Id;
                    break;
            }
            if (!String.isNullOrWhiteSpace(query))
                token.SearchQuery = query;
            return Navigation.Main.Go(token);
        }
    }
}

