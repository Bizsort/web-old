Model = $.extend(Model, {

    ServiceProvider: {
        AdScrl: 1,
        Google: 2,
        Facebook: 3
    },

    Account: {
        setImageRef: function () {
            this.ImageRef = Model.Thumbnail.GetImageRef((this.AccountType == Model.AccountType.Business ? Model.ImageEntity.Business : Model.ImageEntity.Person), (this.HasImage && this.ImageSize ? this.ImageSize : Model.ImageSizeType.Thumbnail), (this.HasImage ? (this.AccountType == Model.AccountType.Business && this.ImageSize > Model.ImageSizeType.Thumbnail ? this.ImageId : this.Id) : 0));
        },

        ValidatePassword: function (value, element) {
            if (!String.isNullOrWhiteSpace(value)) {
                return true;
            }
            else
                return false;
        }
    },

    AccountOption: {
        Default: 0,
        Suppress_Product_Guidelines: 1
    },

    DictionaryType: {
        SecurityProfile: 1,
        BusinessType: 2,
        ProductSide: 3,
        ProductType: 5,
        ProductPriceType: 6,
        ProductAttributeType: 7,
        Currency: 8
    },

    EditorType: {
        TextBox: 1
    },

    ImageType: {
        Jpeg: 1,
        Png: 2,
        Gif: 3
    },

    ThumbnailQueryOutput: {
        Deserialize: function (data, navToken) {
            if (data && data.Thumbnails) {
                for (var i = 0, l = data.Thumbnails.length; i < l; i++) {
                    Model.Thumbnail.setImageRef.call(data.Thumbnails[i], Settings.Image.XtraSmall);
                    if (navToken)
                        data.Thumbnails[i].NavToken = navToken(data.Thumbnails[i]);
                }
            }
        }
    },

    Semantic: {
        Facet: {
            Deserialize: function (facets) {
                if (facets && facets.length > 0)
                    for (var i = 0, l = facets.length; i < l; i++) {
                        this._deserialize(facets[i]);
                    }
            },

            _deserialize: function (facet) {
                if (facet.Values && facet.Values.length > 0)
                    for (var i = 0; i < facet.Values.length; i++) {
                        facet.Values[i].Name = facet;
                    }
            }
        },

        FacetFilter: function (facets, excluded) {
            if (facets && facets.length > 0) {
                var fiters = jQuery.map(facets, function (f) {
                    return (f.Exclude == excluded ? f : null);
                });

                var count = fiters.length;
                if (count > 0) {
                    this.NoFilters = count;
                    this.FilterNames = jQuery.map(fiters, function (f) {
                        return f.Name;
                    });
                    this.FilterValues = jQuery.map(fiters, function (f) {
                        return f.Value;
                    });

                    return;
                }
            }
            this.NoFilters = 0;
        }
    },

    List: {
        Filter: {
            QueryInput: function (facets) {
                if (facets && facets.length > 0) {
                    facets = facets.slice(); //make a copy
                    var sorted = facets.sort(function (f1, f2) {
                        return f1.Name - f2.Name;
                    });

                    this.InclFacets = new Model.Semantic.FacetFilter(sorted, false);
                    this.ExclFacets = new Model.Semantic.FacetFilter(sorted, true);
                }
                else {
                    this.InclFacets = new Model.Semantic.FacetFilter();
                    this.ExclFacets = new Model.Semantic.FacetFilter();
                }
            }
        }
    },

    Review: {
        Preview: {
            Deserialize: function (reviews) {
                if (reviews && reviews.length > 0)
                    for (var i = 0, l = reviews.length; i < l; i++) {
                        this._deserialize(reviews[i]);
                    }
            },

            _deserialize: function (review) {
                Model.Thumbnail.setImageRef.call(review.From.Image, Settings.Image.WideThumbnail);
                review.Date = Date.Deserialize(review.Date);
            }
        }
    },

    Community: {
        Category: {
            Blog: 0,
            Uncategorized: 0,
            AllCategories: -1,
            AllTopics: -2
        },

        MemberType: {
            Owner: 1,
            Moderator: 2,
            Content_Manager: 3,
            Content_Producer: 4,
            Member: 5
        },

        Option: {
            Flags: {
                Open_To_View: 1,
                Open_To_Join: 2,
                Open_To_Post: 4,
                Post_Media: 8,
                Post_Businesses: 16,
                Post_Products: 32
            },

            Set: {
                Deserialize: function (options) {
                    if ((options.Value & Model.Community.Option.Flags.Open_To_View) > 0)
                        options.Open_To_View = true;
                    if ((options.Value & Model.Community.Option.Flags.Open_To_Join) > 0)
                        options.Open_To_Join = true;
                    if ((options.Value & Model.Community.Option.Flags.Open_To_Post) > 0)
                        options.Open_To_Post = true;
                    if ((options.Value & Model.Community.Option.Flags.Post_Media) > 0)
                        options.Post_Media = true;
                    if ((options.Value & Model.Community.Option.Flags.Post_Businesses) > 0)
                        options.Post_Businesses = true;
                    if ((options.Value & Model.Community.Option.Flags.Post_Products) > 0)
                        options.Post_Products = true;
                    delete options.Value;
                }
            }
        },

        Preview: {
            Deserialize: function (communities, navToken) {
                for (var i = 0, l = communities.length; i < l; i++) {
                    this._deserialize(communities[i]);
                    if (navToken)
                        communities[i].NavToken = navToken(communities[i]);
                }
            },

            _deserialize: function (community) {
                Model.Thumbnail.setImageRef.call(community.Image);
                if (community.Business)
                    Model.Thumbnail.setImageRef.call(community.Business.Image, Settings.Image.WideThumbnail);
                if (community.Location && community.Location.Address)
                    Model.Geocoder.Address.Deserialize(community.Location.Address);
                if (community.Properties) {
                    for (var propName in community.Properties) {
                        community[propName] = community.Properties[propName];
                    };
                    delete community.Properties;
                }
                if (community.Membership)
                    community.Membership.Date = Date.Deserialize(community.Membership.Date);
                else if (community.MembershipRequest) {
                    community.MembershipRequest.Date = Date.Deserialize(community.MembershipRequest.Date);
                    Model.Thumbnail.setImageRef.call(community.MembershipRequest.From.Image);
                }
                Model.Community.Option.Set.Deserialize(community.Options);
            }
        },

        /*Forum: {
            Blog: 0,
            AllForums: -1,
            AllTopics: -2
        },*/

        Topic: {
            Thumbnail: {
                Deserialize: function (topics, navToken) {
                    for (var i = 0, l = topics.length; i < l; i++) {
                        this._deserialize(topics[i]);
                        if (navToken)
                            topics[i].NavToken = navToken(topics[i]);
                    }
                },

                _deserialize: function (topic) {
                    if (topic.From.Image) {
                        Model.Thumbnail.setImageRef.call(topic.From.Image);
                        if (topic.From.Image.HasImage) {
                            topic.HasImage = true;
                            topic.ImageRef = topic.From.Image.ImageRef;
                            return;
                        }
                    }
                    topic.ImageRef = Model.Thumbnail.GetImageRef(Model.ImageEntity.CommunityTopic, 0);
                }
            },

            Preview: {
                Deserialize: function (topics, navToken) {
                    for (var i = 0, l = topics.length; i < l; i++) {
                        this._deserialize(topics[i], navToken);
                        if (navToken)
                            topics[i].NavToken = navToken(topics[i]);
                    }
                },

                _deserialize: function (topic) {
                    Model.Thumbnail.setImageRef.call(topic.PostedBy.Image);
                    topic.Date = Date.Deserialize(topic.Date);
                    topic.LastPostDate = Date.Deserialize(topic.LastPostDate);
                }
            },

            Post: {
                Preview: {
                    Deserialize: function (posts) {
                        for (var i = 0, l = posts.length; i < l; i++) {
                            this._deserialize(posts[i]);
                        }
                    },

                    _deserialize: function (post) {
                        Model.Thumbnail.setImageRef.call(post.PostedBy.Image);
                        post.Date = Date.Deserialize(post.Date);
                    }
                }
            }
        }
    },

    Message:{
        Received: {
            Deserialize: function (messages) {
                for (var i = 0, l = messages.length; i < l; i++) {
                    this._deserialize(messages[i]);
                }
            },

            _deserialize: function (message) {
                Model.Thumbnail.setImageRef.call(message.From.Image);
                if (message.Product)
                    Model.Thumbnail.setImageRef.call(message.Product);
                if (message.SentBy)
                    Model.Thumbnail.setImageRef.call(message.SentBy);
                message.Date = Date.Deserialize(message.Date);
            }
        }
    }
});

Model.Community.MemberTypeText = Resource.GetValue(Resource.Community, Model.Community.MemberType, 'Member_Type');

Model.Business = $.extend(Model.Business, {
    Preview: {
        Deserialize: function (businesses, navToken) {
            if (businesses && businesses.length > 0)
                for (var i = 0, l = businesses.length; i < l; i++) {
                    this._deserialize(businesses[i]);
                    businesses[i].NavToken = Navigation.Business.ProfileView(businesses[i].Id, { suppressNavigate: true });
                    businesses[i].ProductsNavToken = Controls.Business.ListView.ViewProducts(businesses[i], { suppressNavigate: true });
                }
        },

        _deserialize: function (business) {
            if (business.Properties) {
                for (var propName in business.Properties) {
                    business[propName] = business.Properties[propName];
                };
                delete business.Properties;
            }
            Model.Thumbnail.setImageRef.call(business.Image, Settings.Image.WideThumbnail);
            if (!String.isNullOrWhiteSpace(business.WebSite) && business.WebSite.substr(0, 4) != "http")
                business.WebSite = Resource.Global.Url_Http + business.WebSite;
            if (business.Location && business.Location.Address)
                Model.Geocoder.Address.Deserialize(business.Location.Address);
        }
    }
});

Model.Product = $.extend(Model.Product, {
    Status: {
        Draft: 1,
        Pending: 2,
        Active: 3,
        Rejected: 4,
        Archived: 5,
        Deleted: 6
    },

    Type: {
        Listed: 0,
        Unlisted: 1
    },

    PendingStatus: {
            EmailConfirmation: 1,
            PeerReview: 2,
            StaffReview: 4
    },

    RejectReason: {
            WrongCategory: 1,
            Offensive: 2,
            Unlawful: 4,
            Scam: 8
    },

    FacetName: {
            Status: 1,
            PriceType: 2,
            Side: 3,
            Type: 4,
            Category: 5
    },

    Preview: {
            Deserialize: function (products, navToken) {
                if (products && products.length > 0)
                    for (var i = 0, l = products.length; i < l; i++) {
                        this._deserialize(products[i]);
                        if (navToken)
                            products[i].NavToken = navToken(products[i]);
                    }
            },

            _deserialize: function (product) {
                if (product.Properties) {
                    for (var propName in product.Properties) {
                        product[propName] = product.Properties[propName];
                    };
                    delete product.Properties;
                }
                product.Date = Date.Deserialize(product.Date);
                Model.Thumbnail.setImageRef.call(product.Image, Settings.Image.Thumbnail);
                if (!String.isNullOrWhiteSpace(product.WebUrl) && product.WebUrl.substr(0, 4) != "http")
                    product.WebUrl = Resource.Global.Url_Http + product.WebUrl;
                if (product.Status)
                    product.StatusText = Model.Product.StatusText(product.Status);
            }
    },

    Profile: {
        GetStatusText: function (product) {
            var statusValue = '';
            if (product.PendingStatus > 0) {
                var separate = false;
                for (var ps in Model.Product.PendingStatus) {
                    if ((product.PendingStatus & Model.Product.PendingStatus[ps]) > 0) {
                        statusValue += String.format('{0}{1}', (separate ? ', ' : ''), Resource.Product['PendingStatus_' + ps]);
                        separate = true;
                    }
                }

                if (product.Status == Model.Product.Status.Active)
                    return String.format('{0} ({1} {2})', Model.Product.StatusText(product.Status), Resource.Dictionary.Pending.toLowerCase(), statusValue)
                else
                    return String.format('{0} {1}', Model.Product.StatusText(product.Status), statusValue);
            }
            else if (product.Type === Model.Product.Type.Unlisted)
                return String.format('{0}, {1}', Resource.Dictionary.Unlisted, Model.Product.StatusText(product.Status));
            else
                return Model.Product.StatusText(product.Status);
        },

        GetRejectReasonText: function (product) {
            if (product.PendingStatus > 0 && product.RejectReason > 0) {
                var reasonValue = '';
                separate = false;
                for (var rr in Model.Product.RejectReason) {
                    if ((product.RejectReason & Model.Product.RejectReason[rr]) > 0) {
                        reasonValue += String.format('{0}{1}', (separate ? ', ' : ''), Resource.Product['RejectReason_' + rr]);
                        separate = true;
                    }
                }

                return reasonValue;
            }
        }
    },

    PriceType: {
            ValueOptionType: {
                NotApplicable: 0,
                Optional: 1,
                Required: 2
            },

        ConvertPrice: function (price) {
            if (typeof price == "number")
                return price ? price * 0.01 : 0;
            else if (typeof price == "string")
                return price ? parseFloat(price) * 100 : 0;
        },

        GetDisplayText: function (price, currency) {
            if (this.ValueOption != Model.Product.PriceType.ValueOptionType.NotApplicable && price) {
                if (currency != null && !String.isNullOrEmpty(currency.CountryPriceFormat)) {
                    var priceText = String.format(currency.CountryPriceFormat, price);
                    if (!String.isNullOrEmpty(this.PriceFormat))
                        return String.format(this.PriceFormat, priceText);
                    else
                        return priceText;
                }
                else
                    return price;
            }

            return this.ItemText;
        }
    },

    Option: {
            PriceType: {
                Relative: 1,
                Absolute: 2
            },

        ConvertPrice: function (price) {
            return price * 0.01;
        },

        GetDisplayPrice: function (price, type, currency) {
            if (currency) {
                price = Model.Product.Option.ConvertPrice(price);
                switch (type) {
                    case Model.Product.Option.PriceType.Relative:
                        if (price > 0)
                            return String.format("(+{0})", String.format(currency.PriceFormat, price));
                        else if (price < 0)
                            return String.format("(-{0})", String.format(currency.PriceFormat, Math.abs(price)));
                        break;
                    case Model.Product.Option.PriceType.Absolute:
                        if (price > 0)
                            return String.format(currency.PriceFormat, price);
                        break;
                }
            }
        }
    },

    Attribute: {
            Requirement: {
                Optional: 0,
                Required: 1,
                PresetValue: 2,
                NotApplicable: 3
            },

        PrimitiveType: {
                Text: 1
        }
    }
});

Model.Product.StatusText = Resource.GetValue(Resource.Product, Model.Product.Status, 'Status');

Model.Session = $.extend(Model.Session, {
    ExitResponse: {
        NotFound: 0,
        Closed: 1,
        EnterPending: 2
    },

    HandlingType: {
        Relaxed: 0,
        Strict: 1,
        CreateOnDemand: 2,
        //Handle case when when the page navigated to is retrieved from browser cache (Back button, etc)
        //Previous page would have closed the session, since new page's code behind did not execute
        //Alternative could be to detect when page is retrieved from browser cache and force page refresh
        ReenterClosed: 4,
        SecureKey: 8
    },

    LoginFlags: {
        ShowTerms: 1,
        AdminLogon: 2
    },

    NavigationProperty: {
        Action: 0,
        LocationId: 1,
        CategoryId: 2,
        SearchQuery: 3,
        SearchNear: 4,
        SearchOptions: 5,
        AccountType: 6,
        AccountId: 7,
        ProductId: 8,
        ProductType: 9,
        CommunityId: 10,
        BusinessCategoryId: 11,
        CommunityCategoryId: 12,
        CommunityForumId: 13,
        CommunityTopicId: 14,
        PersonalListId: 15,
        MessageFolder: 16,
        ConversationPeer: 17,
        PendingStatus: 18,
        Key: 19,
        Page: 20,
        Flags: 21,
        ViewUri: 100,
        Forward: 101,
        Cancel: 102
    },

    SearchOptions: {
        None: 0,
        Text: 1,
        Products: 2,
        Posts: 4
    }
});

//Model.Session.User.AdminAction = 64;
Model.Session.Action = {
    None: 0,
    Default: 1,
    ProductSearch: 2,
    ProductView: 9,
    ProductsView: 10,

    ProfileView: 17,

    BusinessSearch: 7,
    CatalogView: 11,
    PromotionProductsView: 12,
    ConnectionsView: 13,

    CommunitySearch: 14,
    CommunityProfileView: 15,
    CommunityTopicsView: 16,
    CommunityTopicPostsView: 17,
    CommunityProductsView: 18,

    CategorySelect: 20,

    Login: 21,
    AccountCreate: 22,
    AccountConfirm: 23,
    PasswordRecover: 24,
    PasswordReset: 25,
    EmailConfirm: 26,
    ConfirmCancel: 27,
    ProductPending: 28,
    ProductConfirm: 29,
    UpdateEmailSubscription: 30,

    Error: 63,
    Admin: 64
};

Model.Session.Action = $.extend(Model.Session.Action, {
    //Actions that require authenticatication
    ProductNew: Model.Session.Action.Admin,
    ProductEdit: Model.Session.Action.Admin + 1,
    ProductsEdit: Model.Session.Action.Admin + 2,

    ProfileNew: Model.Session.Action.Admin + 3,
    ProfileEdit: Model.Session.Action.Admin + 4,

    CatalogEdit: Model.Session.Action.Admin + 5,
    PromotionProfileNew: Model.Session.Action.Admin + 6,
    PromotionProfileEdit: Model.Session.Action.Admin + 7,
    PromotionProductsEdit: Model.Session.Action.Admin + 8,
    ConnectionsEdit: Model.Session.Action.Admin + 9,

    CommunitiesEdit: Model.Session.Action.Admin + 10,
    CommunityProfileNew: Model.Session.Action.Admin + 11,
    CommunityProfileEdit: Model.Session.Action.Admin + 12,
    CommunityTopicsEdit: Model.Session.Action.Admin + 13,
    CommunityProductsEdit: Model.Session.Action.Admin + 14,
    CommunityCategoryNew: Model.Session.Action.Admin + 15,
    CommunityMembersEdit: Model.Session.Action.Admin + 16,

    PersonalListProductsEdit: Model.Session.Action.Admin + 17,
    EmailChange: Model.Session.Action.Admin + 18,
    PasswordChange: Model.Session.Action.Admin + 19,

    MessagesReceived: Model.Session.Action.Admin + 20,
    MessagesSent: Model.Session.Action.Admin + 21,
    MessageConversations: Model.Session.Action.Admin + 22,

    AdReview: Model.Session.Action.Admin + 23,
    OffensiveList: Model.Session.Action.Admin + 24,

    CategoryManage: Model.Session.Action.Admin + 25,
    CategoryManageBusinesses: Model.Session.Action.Admin + 26,
    CategoryManageProducts: Model.Session.Action.Admin + 27,
    LocationManage: Model.Session.Action.Admin + 28,
    LocationManageStreets: Model.Session.Action.Admin + 29,
    LocationManageAreas: Model.Session.Action.Admin + 30,
    LocationManageBusinesses: Model.Session.Action.Admin + 31,
    LocationManageProducts: Model.Session.Action.Admin + 32,
    LocationManageCommunities: Model.Session.Action.Admin + 33
});

Model.Session.NavigationFlags = {
    None: 0,
    Catalog_NewCategory: 1,
    Tab_Products: 2
};

Admin.Model = $.extend(Admin.Model, {
    Product: $.extend(Admin.Model.Product, {
        ReviewPreview: {
            Deserialize: function (products) {
                if (products && products.length > 0)
                    for (var i = 0, l = products.length; i < l; i++) {
                        this._deserialize(products[i]);
                    }
            },

            _deserialize: function (product) {
                Model.Product.Preview._deserialize(product);
                product.StatusText = Model.Product.Profile.GetStatusText(product);
                if (product.PendingStatus && product.RejectReason)
                    product.RejectReasonText = Model.Product.Profile.GetRejectReasonText(product);
            }
        },

        //Moved to Common
        //Profile: Class.extend({
        //    ctor: function (account, newRecord) {
        //        this.Id = 0;
        //        this.Account = account;
        //        this.Master = {
        //            Id: 0,
        //            Category: 0
        //        };
        //        this.Price = {
        //            /*Type: 0,
        //            Value: 0*/
        //        };
        //        this.Attributes = new Admin.Model.Product.Attributes();
        //        this.Address = {
        //            Location: 0
        //        };
        //        this.Images = {
        //            Entity: Model.ImageEntity.Product,
        //            Refs: [],
        //            Deleted: []
        //        };
        //        this.Status = 0;
        //        this.PendingStatus = 0;
        //        Admin.Model.Personal.Product.Profile.defineProperties(this);
        //    }
        //}),

        Price: {
            Validate: function (price, ctx) {
                var error = '';

                var priceType = ctx.ValueOption;
                var errorInfo = this.$errorInfo;

                if (priceType) {
                    var hasValue = false;

                    switch (priceType.ValueOption) {
                        case Model.Product.PriceType.ValueOptionType.NotApplicable:
                            if (price.Value == 0)
                                return;
                            break;
                        case Model.Product.PriceType.ValueOptionType.Optional:
                            if (price.Value >= 0)
                                hasValue = true;
                            break;
                        case Model.Product.PriceType.ValueOptionType.Required:
                            if (price.Value > 0)
                                hasValue = true;
                            break;
                    }

                    if (hasValue) {
                        if (price.Currency > 0)
                            return;
                        else {
                            error = String.format(Resource.Global.Editor_Error_Select_X, Resource.Dictionary.Currency);
                            errorInfo.SetError('currency', error);
                        }
                    }
                    else {
                        error = String.format(Resource.Product.Edit_Error_Enter_X, Resource.Dictionary.Price);
                        errorInfo.SetError('priceValue', error);
                    }
                }
                else {
                    error = String.format(Resource.Product.Edit_Error_Select_X, Resource.Dictionary.Price_type);
                    errorInfo.SetError('priceType', error);
                }

                //Replaced by $('label[for=price]', $this.$container).addClass('errorLabel'); in Controls.Product.Edit.ValidationSteps
                //if (errorInfo.Count > 0) //just to highlight the Price label, the actual message will not be displayed
                //    errorInfo.SetError('', Resource.Product.Edit_Error_Price);

                return error;
            }
        },

        Attribute: {
            ValidateName: function (name, ctx) {
                var reserved = ctx.Reserved;
                var inUse = ctx.InUse;

                if (String.isNullOrWhiteSpace(name))
                    return String.format(Resource.Global.X_required, Resource.Product.Attribute_name);
                else if (reserved && reserved.length > 0 && reserved.indexOf(name) >= 0)
                    return String.format(Resource.Global.X_Y_reserved, Resource.Product.Attribute_name, name);
                else if (inUse && inUse.length > 0 && inUse.indexOf(name) >= 0)
                    return String.format(Resource.Global.X_Y_in_use, Resource.Product.Attribute_name, name);
            },

            ValidateValue: function (value, ctx) {
                var requirement = ctx.Requirement;

                if (requirement == Model.Product.Attribute.Requirement.Required && (!value || !value.toString()))
                    return String.format(Resource.Global.X_required, Resource.Product.Attribute_value);
            }
        },

        Attributes: $.extend(Class.define({
            ctor: function () {
                this.Available = [];
                this.Deleted = [];
            }
        }), {
            NewAttribute: function (type, editorType, valueType) {
                var attribute = {
                    Type: type,
                    EditorType: editorType,
                    ValueType: valueType
                };
                this.Available.push(attribute);
                return attribute;
            },

            RemoveAttribute: function (attribute, index) {
                this.Available.splice(index, 1);
                if (attribute.Id > 0)
                    this.Deleted.push(attribute.Id);
                return true;
            }
        })
    })
});

Admin.Model.Product.Profile.defineProperties = function (product) {
    Object.defineProperties(product, {
        IsMasterOwned: {
            get: function () {
                return this.Master.Id == this.Id ? true : false;
            }
        }
    });

    Object.defineProperties(product.Attributes, {
        Preset: {
            get: function () {
                return $.grep(this.Available, function (a) {
                    return !a.UserDefined ? true : false;
                });
            }
        },

        UserDefined: {
            get: function () {
                return $.grep(this.Available, function (a) {
                    return a.UserDefined ? true : false;
                });
            }
        }
    });
};

Admin.Model.Personal = {
    Product: {
        Profile: Admin.Model.Product.Profile.extend({
            ctor: function (newRecord) {
                Admin.Model.Product.Profile.prototype.ctor.call(this, { //new Admin.Model.Personal.Product.Account()
                    Id: 0,
                    Type: Model.AccountType.Personal
                }, newRecord);
                this.Attributes = new Admin.Model.Product.Attributes();
                Admin.Model.Personal.Product.Profile.defineProperties(this);
            }
        })

        /*Account: Class.define({
            ctor: function (type) {
                this.Id = 0;
                this.Type = type;
                //this.$errorInfo = new Model.EntityValidation.DataErrorInfo(this);
                //$.validator.addMethod("validateEmail", jQuery.proxy(Model.LocationSettings.ValidateEmail, this));
            }

            //ValidatorOptions: {
            //    rules: {
            //        email: "validateEmail"
            //    },

            //    messages: {
            //        email: String.format(Resource.Global.Editor_Error_Enter_X_Valid, Resource.Dictionary.Email)
            //    }
            //},

            //$validationItems: {}
        })*/
    }
};

Admin.Model.Personal.Product.Profile.defineProperties = function (product) {
    Admin.Model.Product.Profile.defineProperties(product);
    Object.defineProperties(product, {
        NoAccount: {
            get: function () {
                return (this.PendingStatus & Model.Product.PendingStatus.EmailConfirmation) > 0 ? true : false;
            }
        }
    });
};