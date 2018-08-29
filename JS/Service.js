User.Service.Master.Location = $.extend(User.Service.Master.Location, {
    SettingsCache: Session.Cache.Get(Session.Cache.Type.LocationSettings, function (type) {
        return new (Session.FetchOneCache.extend({
            ctor: function (type) {
                Session.FetchOneCache.prototype.ctor.call(this, type);
                this.IsUserSpecific = false;
                this.ItemKey = "Id";
            },

            fetch: function (location, callback, faultCallback) {
                return Service.Get("/master/location/GetSettings?location=" + location, {
                    callback: callback,
                    faultCallback: faultCallback
                });
            },

            Serialize: function (items) {
                return JSON.stringify(jQuery.map(items, function (item) {
                    return {
                        Id: item.Id,
                        Currency: item.Currency,
                        Counties: item.Counties,
                        EmailValid: item.EmailValid,
                        PhoneAreaCode: item.PhoneAreaCode,
                        PhoneValid: item.PhoneValid,
                        PhonePrompt: item.PhonePrompt,
                        PostalCodeValid: item.PostalCodeValid,
                        PostalCodePrompt: item.PostalCodePrompt,
                        WebSiteValid: item.WebSiteValid
                    };
                }));
            }
        }))(Session.Cache.Type.LocationSettings);
    }),

    Get: function (location) {
        var callback, faultCallback;
        if (arguments.length >= 2) {
            if (typeof arguments[1] == 'number' && typeof arguments[2] == "function") {
                var type = arguments[1];
                callback = arguments[2];
                if (arguments.length == 4)
                    faultCallback = arguments[3];
                return Service.Get("/master/location/Get_Ref?location=" + location + "&type=" + type, { callback: callback, faultCallback: faultCallback });
            }
            else if (typeof arguments[1] == "function") {
                callback = arguments[1];
                if (arguments.length == 3)
                    faultCallback = arguments[2];
                return Service.Get("/master/location/Get?location=" + location, { callback: callback, faultCallback: faultCallback });
            }
        }
    },

    GetPath: function (location, root, callback, faultCallback) {
        return User.Service.Master.Class.GetPath("/master/location/GetPath?location=" + location, location, root, callback, faultCallback);
    },

    GetSettings: function (location, callback) {
        return this.SettingsCache.GetItem(location, callback);
    },

    PopulateWithChildren: function (parent, type, callback, faultCallback) {
        var token = this._token;
        return Service.Get("/master/location/PopulateWithChildren?parent=" + parent + "&type=" + type, {
            callback: function (data) {
                if (data)
                    Model.Group.Node.Deserialize(data, token ? function (location) {
                        token.LocationId = location.Id;
                        return Navigation.Main.Href(token); //Or clone
                    } : null, {});
                callback(data);
            },
            faultCallback: faultCallback
        });
    },

    Search: function (parent, name, root, callback, faultCallback) {
        return Service.Get("/master/location/Search?parent=" + parent + "&name=" + name + (root ? "&scope=" + JSON.stringify(root) : ''), {
            callback: callback,
            faultCallback: faultCallback
        });
    }
});

User.Service.Master = $.extend(User.Service.Master, {
    Account: {
        GeneratePassword: function (callback) {
            Service.Post('/master/account/GeneratePassword', {
                callback: callback
            });
        },

        Create: function (email, password, name, location/*address*/, securityCode, callback, faultCallback) {
            if (Session.User.Id == 0) {
                Service.Post('/process/account/Create_Legacy', {
                    data: {
                        Email: email,
                        Password: password,
                        Name: name,
                        Location: location, //Address: address
                        SecurityCode: securityCode,
                        Service: location.hostname.toLowerCase()
                    },
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
            else
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
        },

        Create_Admin: function (email, password, name, location/*address*/, securityProfile, securityCode, callback, faultCallback) {
            if (Session.User.Id == 0) {
                Service.Post('/master/account/Create', {
                    data: {
                        Email: email,
                        Password: password,
                        Name: name,
                        Location: location, //Address: address
                        SecurityProfile: securityProfile,
                        SecurityCode: securityCode
                    },
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
            else
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
        },

        RecoverPassword: function (email, callback, faultCallback) {
            if (Session.User.Id == 0) {
                Service.Post('/process/account/RequestPasswordReset', {
                    data: {
                        Email: email,
                        Service: location.hostname.toLowerCase()
                    },
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
            else
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
        },

        AcknowledgeGuidelines: function (option, callback, faultCallback) {
            if (Session.User.Id > 0) {
                Service.Post('/master/account/AcknowledgeGuidelines', {
                    authorize: true,
                    data: {
                        User: Session.User.Id,
                        Option: option
                    },
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
            else
                throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
        }
    },

    Dictionary: {
        Cache: Session.Cache.Get(Session.Cache.Type.MasterDictionary, function (type) {
            return new (Session.FetchOneCache.extend({
                ctor: function (type) {
                    Session.FetchOneCache.prototype.ctor.call(this, type);
                    this.IsUserSpecific = false;
                    this.ItemKey = "Type";
                },

                fetch: function (key, callback, faultCallback) {
                    return Service.Get("/master/dictionary/Get?type=" + key, {
                        callback: function (dictionary) {
                            callback({ Type: key, Items: dictionary.Items });
                        },
                        faultCallback: faultCallback
                    });
                },

                Get: function (key, callback) {
                    Session.FetchOneCache.prototype.GetItem.call(this, key, function (dictionary) {
                        callback(dictionary.Items);
                    });
                },

                Serialize: function (items) {
                    return JSON.stringify(jQuery.map(items, function (item) {
                        return { Type: item.Type, Items: item.Items };
                    }));
                }
            }))(Session.Cache.Type.MasterDictionary);
        }),

        Get: function (type, callback) {
            return this.Cache.Get(type, callback);
        },

        GetItem: function (type, id, callback) {
            var $this = this;
            this.Cache.Get(type, function (items) {
                callback($this.Cache.GetItemInner(items, id, 'ItemKey'));
            });
        },

        /*GetItemInner: function (items, key) {
            return Session.CacheBase.prototype.GetItemInner.call(this, items, key);
            //for (var i = 0, l = items.length; i < l; i++)
            //    if (items[i].ItemKey == key) {
            //        return items[i];
            //    }
        },*/

        GetItemText: function (type, id, callback) {
            var $this = this;
            this.Cache.Get(type, function (items) {
                callback($this.Cache.GetItemInner(items, id, 'ItemKey').ItemText);
            });
        },

        GetDisplayPrice: function (price, priceType, priceCurrency, callback) {
            var $this = this;
            this.Cache.Get(Model.DictionaryType.Currency, function (currencies) {
                var currency = this.Cache.GetItemInner(currencies, priceCurrency, 'ItemKey');
                $this.Cache.Get(Model.DictionaryType.ProductPriceType, function (priceTypes) {
                    callback(Model.Product.PriceType.GetDisplayText.call($this.Cache.GetItemInner(priceTypes, priceType, 'ItemKey'), Model.Product.PriceType.ConvertPrice(price), currency));
                });
            });
        }
    }
});

User.Service = $.extend(User.Service, {
    Product: {
        Profile: {
            FacetNames: [Resource.Dictionary.Status, Resource.Dictionary.Price_type, Resource.Dictionary.Side, Resource.Dictionary.Type, Resource.Dictionary.Category],

            Search: function (queryInput, callback, faultCallback) {
                return Service.Get("/product/profile/Search?queryInput=" + JSON.stringify(queryInput), {
                    callback: function (searchOutput) {
                        if (searchOutput.Series && searchOutput.Series.length) {
                            if (typeof searchOutput.Series[0].Distance != 'undefined')
                                searchOutput.Distances = searchOutput.Series.map(function (s) { return s.Distance });
                            searchOutput.Series = searchOutput.Series.map(function (s) { return s.Id; });
                        }
                        if (searchOutput.Facets)
                            Model.Semantic.Facet.Deserialize(searchOutput.Facets);
                        callback(searchOutput);
                    },
                    faultCallback: faultCallback
                });
            },

            NewlyPosted: function (queryInput, callback, faultCallback) {
                return Service.Get("/product/profile/NewlyPosted?queryInput=" + JSON.stringify(queryInput), {
                    callback: function (queryOutput) {
                        if (queryOutput.Series && queryOutput.Series.length)
                            queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                        callback(queryOutput);
                    },
                    faultCallback: faultCallback
                });
            },

            ToPreview: function (products, properties, callback, faultCallback, account) {
                products = products.map(function (p) { return { Id: p }; });
                return Service.Get("/product/profile/ToPreview?products=" + JSON.stringify(products) + "&properties=" + JSON.stringify(properties), {
                    callback: function (data) {
                        if (data)
                            Model.Product.Preview.Deserialize(data, function (product, productAccount) {
                                productAccount = account || product.Account;
                                if (product && product.Id && productAccount)
                                    return Navigation.Product.View(productAccount.AccountType, productAccount.Id, product.Id, { suppressNavigate: true });
                            });
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            },

            View: function (url, callback, faultCallback) {
                return Service.Get(url, {
                    callback: function (data) {
                        if (data && data.Location && data.Location.Address)
                            Model.Geocoder.Address.Deserialize(data.Location.Address);
                        callback(data);
                    }, faultCallback: faultCallback
                });
            }
        }
    },

    Business: {
        Product: {
            ThumbnailProvider: Class.define({
                ctor: function (business) {
                    this.business = business;
                },

                GetItems: function (skip, take, callback, faultCallback) {
                    var business = this.business;
                    return Service.Get("/business/product/GetThumbnails?business=" + this.business + "&skip=" + skip + "&take=" + take, {
                        callback: function (data) {
                            Model.ThumbnailQueryOutput.Deserialize(data, function (product) {
                                if (product && product.Id)
                                    return Navigation.Product.View(Model.AccountType.Business, business, product.Id, { suppressNavigate: true });
                            });
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
            }),

            View: function (business, product, callback, faultCallback) {
                User.Service.Product.Profile.View("/business/product/View?business=" + business + "&product=" + product, callback, faultCallback);
            },

            GetReviews: function (business, product, callback, faultCallback) {
                return Service.Get("/business/product/GetReviews?business=" + business + "&product=" + product, { callback: callback, faultCallback: faultCallback });
            },

            GetThumbnails: function (business) {
                return new User.Service.Business.Product.ThumbnailProvider(business);
            }
        },

        Profile: {
            Get: function (business, callback, faultCallback) {
                return Service.Get("/business/profile/Get?business=" + business, { callback: callback, faultCallback: faultCallback });
            },

            View: function (business, callback, faultCallback) {
                return Service.Get("/business/profile/View?business=" + business, {
                    callback: function (profile) {
                        if (profile) {
                            if (!String.isNullOrWhiteSpace(profile.WebSite) && profile.WebSite.substr(0, 4) != "http")
                                profile.WebSite = Resource.Global.Url_Http + profile.WebSite;

                            profile.HeadOffice = profile.Offices[0];

                            if (profile.HeadOffice.Location && profile.HeadOffice.Location.Address)
                                Model.Geocoder.Address.Deserialize(profile.HeadOffice.Location.Address);

                            Model.Business.Option.Set.Deserialize(profile.Options);
                        }
                        callback(profile);
                    },
                    faultCallback: faultCallback
                });
            },

            Search: function (queryInput, callback, faultCallback) {
                return Service.Get("/business/profile/Search?queryInput=" + JSON.stringify(queryInput), {
                    callback: function (searchOutput) {
                        if (searchOutput.Series && searchOutput.Series.length) {
                            if (typeof searchOutput.Series[0].Distance != 'undefined')
                                searchOutput.Distances = searchOutput.Series.map(function (s) { return s.Distance });
                            searchOutput.Series = searchOutput.Series.map(function (s) { return s.Id; });
                        }
                        callback(searchOutput);
                    }, faultCallback: faultCallback });
            },

            NewlyPosted: function (queryInput, callback, faultCallback) {
                return Service.Get("/business/profile/NewlyPosted?queryInput=" + JSON.stringify(queryInput), {
                    callback: function (queryOutput) {
                        if (queryOutput.Series && queryOutput.Series.length)
                            queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                        callback(queryOutput);
                    },
                    faultCallback: faultCallback
                });
            },

            ToPreview: function (businesses, callback, faultCallback) {
                businesses = businesses.map(function (b) { return { Id: b }; });
                return Service.Get("/business/profile/ToPreview?businesses=" + JSON.stringify(businesses), {
                    callback: function (data) {
                        if (data)
                            Model.Business.Preview.Deserialize(data, true);
                        /*for (var i = 0, l = data.length; i < l; i++) {
                            Model.Thumbnail.setImageRef.call(data[i].Image, Settings.Image.WideThumbnail);
                            if (!String.isNullOrWhiteSpace(data[i].WebSite) && data[i].WebSite.substr(0, 4) != "http")
                                data[i].WebSite = Resource.Global.Url_Http + data[i].WebSite;
                            if (data[i].Location && data[i].Location.Address)
                                Model.Geocoder.Address.Deserialize(data[i].Location.Address);
                            data[i].NavToken = Navigation.Business.ProfileView(data[i].Id, { suppressNavigate: true });
                            data[i].ProductsNavToken = Controls.Business.ListView.ViewProducts(data[i], { suppressNavigate: true });
                        }*/
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            },

            GetProducts: function (business, queryInput, callback, faultCallback) {
                return Service.Get("/business/profile/GetProducts?business=" + business + "&queryInput=" + JSON.stringify(queryInput), {
                    callback: function (queryOutput) {
                        if (queryOutput.Series && queryOutput.Series.length)
                            queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                        if (queryOutput.Facets)
                            Model.Semantic.Facet.Deserialize(queryOutput.Facets);
                        callback(queryOutput);
                    },
                    faultCallback: faultCallback
                });
            },

            GetPromotions: function (business, callback, faultCallback) {
                return Service.Get("/business/profile/GetPromotions?business=" + business, {
                    callback: function (promotions) {
                        if (promotions && promotions.length) {
                            for (var i = 0, l = promotions.length; i < l; i++) {
                                Model.Thumbnail.setImageRef.call(promotions[i]);
                            }
                        }
                        callback(promotions);
                    },
                    faultCallback: faultCallback
                });
            },

            GetConnections: function (business, callback, faultCallback) {
                return Service.Get("/business/profile/GetConnections?business=" + business, {
                    callback: function (connections) {
                        callback({ Series: connections });
                    },
                    faultCallback: faultCallback
                });
            }
        },

        Catalog: {
            Category: {
                GetPath: function (business, category, callback, faultCallback) {
                    return Service.Get("/business/catalog/category/GetPath?business=" + business + "&category=" + category, { callback: callback, faultCallback: faultCallback });
                }
            },

            GetCategories: function (business, parentCategory, lookupCategory, callback, faultCallback) {
                return Service.Get("/business/catalog/GetCategories?business=" + business + "&parentCategory=" + parentCategory + "&lookupCategory=" + lookupCategory, {
                    callback: function (categories) {
                        Model.Group.Node.DeserializeChildren(categories, function (category) {
                            if (category && category.Id)
                                return Navigation.Business.CatalogView(business, category.Id, { suppressNavigate: true });
                        });
                        callback(categories);
                    },
                    faultCallback: faultCallback
                });
            },

            GetProducts: function (business, category, queryInput, callback, faultCallback) {
                return Service.Get("/business/catalog/GetProducts?business=" + business + "&category=" + category + "&queryInput=" + JSON.stringify(queryInput), {
                    callback: function (data) {
                        if (queryOutput.Series && queryOutput.Series.length)
                            queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                        if (queryOutput.Facets)
                            Model.Semantic.Facet.Deserialize(queryOutput.Facets);
                        callback(queryOutput);
                    },
                    faultCallback: faultCallback
                });
            }
        },

        Affiliation: {
            ThumbnailProvider: Class.define({
                ctor: function (business) {
                    this.business = business;
                },

                GetItems: function (skip, take, callback, faultCallback) {
                    return Service.Get("/business/affiliation/GetThumbnails?business=" + this.business + "&skip=" + skip + "&take=" + take, {
                        callback: function (data) {
                            Model.ThumbnailQueryOutput.Deserialize(data, function (business) {
                                if (business && business.Id)
                                    return Navigation.Business.ProfileView(business.Id, { suppressNavigate: true });
                            });
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
            }),

            GetThumbnails: function (business) {
                return new User.Service.Business.Affiliation.ThumbnailProvider(business);
            }
        },

        Promotion: {
            Get: function (business, promotion, callback, faultCallback) {
                return Service.Get("/business/promotion/Get?business=" + business + "&promotion=" + promotion, { callback: callback, faultCallback: faultCallback });
            },

            GetProducts: function (business, promotion, queryInput, callback, faultCallback) {
                return Service.Get("/business/promotion/GetProducts?business=" + business + "&promotion=" + promotion + "&queryInput=" + JSON.stringify(queryInput), {
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
        }
    },

    Community: {
        Profile: {
            ThumbnailProvider: Class.define({
                ctor: function (type, account) {
                    this.type = type;
                    this.account = account;
                },

                GetItems: function (skip, take, callback, faultCallback) {
                    return Service.Get("/community/profile/GetThumbnails?type=" + this.type + "&account=" + this.account + "&skip=" + skip + "&take=" + take, {
                        callback: function (data) {
                            Model.ThumbnailQueryOutput.Deserialize(data, function (community) {
                                if (community && community.Id)
                                    return Navigation.Community.ProfileView(community.Id, { suppressNavigate: true });
                            });
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
            }),

            Search: function (queryInput, callback, faultCallback) {
                return Service.Get("/community/profile/Search?queryInput=" + JSON.stringify(queryInput), { callback: callback, faultCallback: faultCallback });
            },

            NewlyPosted: function (queryInput, callback, faultCallback) {
                return Service.Get("/community/profile/NewlyPosted?queryInput=" + JSON.stringify(queryInput), {
                    callback: callback,
                    faultCallback: faultCallback
                });
            },

            Get: function (community, callback, faultCallback) {
                return Service.Get("/community/profile/Get?user=" + Session.User.Id + "&community=" + community, {
                    session: true,
                    callback: function (data) {
                        Model.Thumbnail.setImageRef.call(data);
                        Model.Thumbnail.setImageRef.call(data.Owner);
                        Model.Community.Option.Set.Deserialize(data.Options);
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            },

            GetProducts: function (community, category, queryInput, callback, faultCallback) {
                return Service.Get("/community/profile/GetProducts?user=" + Session.User.Id + "&community=" + community + "&category=" + category + "&queryInput=" + JSON.stringify(queryInput), {
                    session: true,
                    callback: function (queryOutput) {
                        if (queryOutput) {
                            /*if (data.Properties) {
                                for (var i = 0, l = data.Properties.length; i < l; i++) {
                                    data.Properties[i].Date = Date.Deserialize(data.Properties[i].Date);
                                }
                            }*/
                            if (queryOutput.Series && queryOutput.Series.length)
                                queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                            if (queryOutput.Facets)
                                Model.Semantic.Facet.Deserialize(queryOutput.Facets);
                        }
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            },

            GetThumbnails: function (type, account) {
                return new User.Service.Community.Profile.ThumbnailProvider(type, account);
            },

            View: function (community, callback, faultCallback) {
                return Service.Get("/community/profile/View?community=" + community, {
                    callback: function (profile) {
                        if (profile) {
                            if (profile.Location && profile.Location.Address)
                                Model.Geocoder.Address.Deserialize(profile.Location.Address);

                            Model.Thumbnail.setImageRef.call(profile.Owner.Image);

                            if (profile.Moderators) {
                                for (var i = 0, l = profile.Moderators.length; i < l; i++) {
                                    Model.Thumbnail.setImageRef.call(profile.Moderators[i]);
                                }
                            }

                            Model.Community.Option.Set.Deserialize(profile.Options);
                        }
                        callback(profile);
                    },
                    faultCallback: faultCallback
                });
            },

            ToPreview: function (communities, callback, faultCallback) {
                communities = communities.map(function (c) { return { Id: c }; });
                return Service.Get("/community/profile/ToPreview?communities=" + JSON.stringify(communities), {
                    callback: function (data) {
                        Model.Community.Preview.Deserialize(data, function (community) {
                            if (community) {
                                if (community.Business && community.Business.Id)
                                    community.Business.NavToken = Navigation.Business.ProfileView(community.Business.Id, { suppressNavigate: true });
                                if (community.Id)
                                    return Navigation.Community.ProfileView(community.Id, { suppressNavigate: true });
                            }
                        });
                        if (Session.User.Id > 0) {
                            Admin.Service.Community.Profile.Personalize(data, callback);
                        }
                        else
                            callback(data);
                    },
                    faultCallback: faultCallback
                });
            }
        },

        Product: {
            ThumbnailProvider: Class.define({
                ctor: function (community) {
                    this.community = community;
                },

                GetItems: function (skip, take, callback, faultCallback) {
                    return Service.Get("/community/product/GetThumbnails?user=" + Session.User.Id + "&community=" + this.community + "&skip=" + skip + "&take=" + take, {
                        session: true,
                        callback: function (data) {
                            Model.ThumbnailQueryOutput.Deserialize(data, function (product) {
                                if (product && product.Id)
                                    return Navigation.Product.View(product.AccountType, product.Account, product.Id, { suppressNavigate: true });
                            });
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
            }),

            GetThumbnails: function (community) {
                return new User.Service.Community.Product.ThumbnailProvider(community);
            }
        },

        Category: {
            Get: function (community, parentCategory, lookupCategory, callback, faultCallback) {
                return Service.Get("/community/category/Get?user=" + Session.User.Id + "&community=" + community + "&parentCategory=" + parentCategory + "&lookupCategory=" + lookupCategory, {
                    session: true,
                    callback: function (categories) {
                        Model.Group.Node.DeserializeChildren(categories, function (category) {
                            if (category && category.Id)
                                return Navigation.Community.ProductsView(community, category.Id, { suppressNavigate: true });
                        });
                        callback(categories);
                    },
                    faultCallback: faultCallback
                });
            },

            GetDisplayPath: function (community, category, callback, faultCallback) {
                return Service.Get("/community/category/GetDisplayPath?user=" + Session.User.Id + "&community=" + community + "&category=" + category, {
                    session: true,
                    callback: callback,
                    faultCallback: faultCallback
                });
            },

            GetPath: function (community, category, callback, faultCallback) {
                return Service.Get("/community/category/GetPath?user=" + Session.User.Id + "&community=" + community + "&category=" + category, {
                    session: true,
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
        },

        /*Forum: {
            Get: function (community, parentForum, lookupForum, callback, faultCallback) {
                return Service.Get("/community/category/Get?user=" + Session.User.Id + "&community=" + community + "&parentForum=" + parentForum + "&lookupForum=" + lookupForum, {
                    session: true,
                    callback: function (forums) {
                        Model.Group.Node.DeserializeChildren(forums, function (forum) {
                            if (forum && forum.Id)
                                return Navigation.Community.TopicsView(community, forum.Id, { suppressNavigate: true });
                        });
                        callback(forums);
                    },
                    faultCallback: faultCallback
                });
            },

            GetDisplayPath: function (community, forum, callback, faultCallback) {
                return Service.Get("/community/category/GetDisplayPath?user=" + Session.User.Id + "&community=" + community + "&forum=" + forum, {
                    session: true,
                    callback: callback,
                    faultCallback: faultCallback
                });
            },

            GetPath: function (community, forum, callback, faultCallback) {
                return Service.Get("/community/category/GetPath?user=" + Session.User.Id + "&community=" + community + "&forum=" + forum, {
                    session: true,
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
        },*/

        Topic: {
            Post: {
                ToPreview: function (community, topic, posts, callback, faultCallback) {
                    posts = posts.map(function (p) { return { Id: p }; });
                    return Service.Get("/community/topic/post/ToPreview?user=" + Session.User.Id + "&community=" + community + "&topic=" + topic + "&posts=" + JSON.stringify(posts), {
                        callback: function (data) {
                            if (data) {
                                Model.Community.Topic.Post.Preview.Deserialize(data);
                                if (data.length && data[0].Id == topic)
                                    data[0].TopicPost = true;
                            }
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
            },

            ThumbnailProvider: Class.define({
                ctor: function (community) {
                    this.community = community;
                },

                GetItems: function (skip, take, callback, faultCallback) {
                    var community = this.community;
                    return Service.Get("/community/topic/GetThumbnails?user=" + Session.User.Id + "&community=" + this.community + "&skip=" + skip + "&take=" + take, {
                        session: true,
                        callback: function (data) {
                            if (data && data.Thumbnails) {
                                Model.Community.Topic.Thumbnail.Deserialize(data.Thumbnails, function (topic) {
                                    if (topic && topic.Id)
                                        return Navigation.Community.TopicPostsView(community, topic.Id, { suppressNavigate: true });
                                });
                            }
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
            }),

            Search: function (community, forum, queryInput, callback, faultCallback) {
                return Service.Get("/community/topic/Search?user=" + Session.User.Id + "&community=" + community + "&category=" + forum + "&queryInput=" + JSON.stringify(queryInput), {
                    session: true,
                    callback: function (queryOutput) {
                        if (queryOutput.Series && queryOutput.Series.length)
                            queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                        callback(queryOutput);
                    },
                    faultCallback: faultCallback
                });
            },

            Get_Ref: function (community, topic, callback, faultCallback) {
                return Service.Get("/community/topic/Get?user=" + Session.User.Id + "&community=" + community + "&topic=" + topic, {
                    session: true,
                    callback: function (data) {
                        Model.Thumbnail.setImageRef.call(data.Community);
                        Model.Thumbnail.setImageRef.call(data.Community.Owner);
                        Model.Community.Option.Set.Deserialize(data.Community.Options);
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            },

            ToPreview: function (community, topics, callback, faultCallback) {
                topics = topics.map(function (t) { return { Id: t }; });
                return Service.Get("/community/topic/ToPreview?user=" + Session.User.Id + "&community=" + community + "&topics=" + JSON.stringify(topics), {
                    callback: function (data) {
                        if (data)
                            Model.Community.Topic.Preview.Deserialize(data, function (topic) {
                                if (topic && topic.Id)
                                    return Navigation.Community.TopicPostsView(community, topic.Id, { suppressNavigate: true });
                            });
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            },

            GetPosts: function (community, topic, queryInput, callback, faultCallback) {
                return Service.Get("/community/topic/GetPosts?user=" + Session.User.Id + "&community=" + community + "&topic=" + topic + "&openingPost=true&queryInput=" + JSON.stringify(queryInput), {
                    session: true,
                    callback: function (queryOutput) {
                        if (queryOutput.Series && queryOutput.Series.length)
                            queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                        callback(queryOutput);
                    },
                    faultCallback: faultCallback
                });
            },

            GetThumbnails: function (community) {
                return new User.Service.Community.Topic.ThumbnailProvider(community);
            }
        }
    },

    Personal: {
        Product: {
            ThumbnailProvider: Class.define({
                ctor: function (user) {
                    this.user = user;
                },

                GetItems: function (skip, take, callback, faultCallback) {
                    return Service.Get("/personal/product/GetThumbnails?user=" + this.user + "&skip=" + skip + "&take=" + take, {
                        callback: function (data) {
                            Model.ThumbnailQueryOutput.Deserialize(data);
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
            }),

            View: function (user, product, callback, faultCallback) {
                User.Service.Product.Profile.View("/personal/product/View?user=" + user + "&product=" + product, callback, faultCallback);
            },

            GetThumbnails: function (user) {
                return new User.Service.Personal.Product.ThumbnailProvider(user);
            }
        },

        Profile: {
            Get: function (user, callback, faultCallback) {
                return Service.Get("/personal/profile/Get?user=" + user, { callback: callback, faultCallback: faultCallback });
            },

            View: function (user, callback, faultCallback) {
                return Service.Get("/personal/profile/View?user=" + user, {
                    callback: function (profile) {
                        if (profile) {
                            if (profile.Image)
                                Model.Thumbnail.setImageRef.call(profile.Image, Settings.Image.Small);
                            if (profile.Location && profile.Location.Address)
                                Model.Geocoder.Address.Deserialize(profile.Location.Address);

                            if (profile.Business) {
                                Model.Thumbnail.setImageRef.call(profile.Business);
                            }
                        }
                        callback(profile);
                    },
                    faultCallback: faultCallback
                });
            },

            GetProducts: function (user, callback, faultCallback) {
                return Service.Get("/personal/profile/GetProducts?user=" + user, {
                    callback: function (products) {
                        callback({ Series: products });
                    },
                    faultCallback: faultCallback
                });
            }
        }
    },

    Interaction: {
        Review: {
            ToPreview: function (business, product, reviews, callback, faultCallback) {
                return Service.Get("/review/ToPreview?business=" + business + "&product=" + product + "&reviews=" + JSON.stringify(reviews), {
                    callback: function (data) {
                        if (data)
                            Model.Review.Preview.Deserialize(data);
                        callback(data);
                    }, faultCallback: faultCallback
                });
            }
        }
    }
});

Admin.Service.Business = $.extend(Admin.Service.Business, {
    Affiliation: {
        Type: {
            None: 0,
            Invitation: 1,
            Affiliation: 2
        },

        Cache: Session.Cache.Get(Session.Cache.Type.Affiliation, function (type) {
            return new (Session.FetchAllCache.extend({
                ctor: function (type) {
                    Session.FetchAllCache.prototype.ctor.call(this, type);
                    this.IsBusinessSpecific = true;
                    this.ItemKey = "BusinessId";
                },

                fetch: function (callback, faultCallback) {
                    return Service.Post("/admin/business/affiliation/Get", {
                        data: {
                            User: Session.User.Id,
                            Business: Session.User.Business.Id
                        },
                        callback: function (affiliations) {
                            if (affiliations && affiliations.length) {
                                for (var i = 0, l = affiliations.length; i < l; i++) {
                                    affiliations[i].Date = Date.Deserialize(affiliations[i].Date);
                                }
                            }
                            callback(affiliations);
                        },
                        faultCallback: faultCallback
                    });
                },

                Serialize: function (items) {
                    return JSON.stringify(jQuery.map(items, function (item) {
                        return { BusinessId: item.BusinessId, Date: item.Date, Pending: item.Pending };
                    }));
                },

                Deserialize: function (items) {
                    items = JSON.parse(items);
                    if (items && items.length) {
                        for (var i = 0, l = items.length; i < l; i++) {
                            items[i].Date = Date.Deserialize(items[i].Date);
                        }
                    }
                    return items;
                }
            }))(Session.Cache.Type.Affiliation);
        }),

        InvitationCache: Session.Cache.Get(Session.Cache.Type.AffiliationInvitation, function (type) {
            return new (Session.FetchAllCache.extend({
                ctor: function (type) {
                    Session.FetchAllCache.prototype.ctor.call(this, type);
                    this.IsBusinessSpecific = true;
                    this.ItemKey = "BusinessId";
                },

                fetch: function (callback, faultCallback) {
                    return Service.Post("/admin/business/affiliation/GetInvitations", {
                        data: {
                            User: Session.User.Id,
                            Business: Session.User.Business.Id
                        },
                        callback: function (invitations) {
                            if (invitations && invitations.length) {
                                for (var i = 0, l = invitations.length; i < l; i++) {
                                    invitations[i].Date = Date.Deserialize(invitations[i].Date);
                                }
                            }
                            callback(invitations);
                        },
                        faultCallback: faultCallback
                    });
                },

                Serialize: function (items) {
                    return JSON.stringify(jQuery.map(items, function (item) {
                        return { BusinessId: item.BusinessId, Date: item.Date, Text: item.Text };
                    }));
                },

                Deserialize: function (items) {
                    items = JSON.parse(items);
                    if (items && items.length) {
                        for (var i = 0, l = items.length; i < l; i++) {
                            items[i].Date = Date.Deserialize(items[i].Date);
                        }
                    }
                    return items;
                }
            }))(Session.Cache.Type.AffiliationInvitation);
        }),

        Exists: function (business, callback) {
            var $this = this;
            var exists = this.Type.None;
            var type = this.Type.Invitation | this.Type.Affiliation;
            if ((type & this.Type.Invitation) > 0) {
                this.InvitationCache.GetItem(business, function (cachedInvitation) {
                    if (cachedInvitation)
                        exists |= $this.Type.Invitation;
                    if ((type & $this.Type.Affiliation) > 0)
                        $this.Cache.GetItem(business, function (cachedAffiliation) {
                            if (cachedAffiliation)
                                exists |= $this.Type.Affiliation;
                            callback(exists);
                        });
                    else
                        callback(exists);
                });
            }
            else if ((type & this.Type.Affiliation) > 0)
                this.Cache.GetItem(business, function (cachedAffiliation) {
                    if (cachedAffiliation)
                        exists |= $this.Type.Affiliation;
                    callback(exists);
                });
        },

        Invite: function (request, callback, faultCallback) {
            var business = Session.User.Business.Id;
            if (request.From == business && request.To > 0 && request.From != request.To) {
                var $this = this;
                this.Exists(request.To, function (exists) {
                    if (exists == $this.Type.None) {
                        Service.Post("/admin/business/affiliation/Invite", {
                            authorize: true,
                            data: {
                                User: Session.User.Id,
                                Invite: request
                            },
                            callback: function (success) {
                                if (success.Value)
                                    $this.Cache.Add(
                                    {
                                        BusinessId: request.To,
                                        Date: success.Timestamp,
                                        Pending: true
                                    });
                                callback(success);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord));
                });
            }
            else
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.InvalidInteraction);
        }
    }
});

Admin.Service = $.extend(Admin.Service, {
    Master: {
        Category: {
            GetProductConfig: function (category, callback, faultCallback) {
                return Service.Get("/admin/master/category/GetProductConfig?category=" + category, {
                    callback: callback,
                    faultCallback: faultCallback
                });
            }

        }
    },

    Product: {
        Profile: $.extend(Admin.Service.Product.Profile, {
            PendingReview: function (staff, queryInput, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/product/profile/PendingReview", {
                        data: {
                            Admin: Session.User.Id,
                            Staff: staff,
                            QueryInput: queryInput
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            NewlyPosted: function (queryInput, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/product/profile/NewlyPosted", {
                        data: {
                            Admin: Session.User.Id,
                            QueryInput: queryInput
                        },
                        callback: function (queryOutput) {
                            if (queryOutput.Series && queryOutput.Series.length)
                                queryOutput.Series = queryOutput.Series.map(function (s) { return s.Id; });
                            callback(queryOutput);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            GetWords: function (product, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/product/profile/GetWords", {
                        data: {
                            Admin: Session.User.Id,
                            Product: product
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            ToPreview: function (products, properties, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    products = products.map(function (p) { return { Id: p }; });
                    return Service.Post("/admin/product/profile/ToPreview", {
                        data: {
                            Admin: Session.User.Id,
                            Products: products,
                            Properties: properties
                        },
                        callback: function (data) {
                            if (data)
                                Model.Product.Preview.Deserialize(data);
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            ToReviewPreview: function (staff, products, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/product/profile/ToReviewPreview", {
                        data: {
                            Admin: Session.User.Id,
                            Staff: staff,
                            Products: products
                        },
                        callback: function (data) {
                            if (data) {
                                if (staff)
                                    Admin.Model.Product.ReviewPreview.Deserialize(data);
                                else
                                    Model.Product.Preview.Deserialize(data);
                            }
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Release: function (product, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/process/product/Release", {
                        authorize: true,
                        data: {
                            Admin: Session.User.Id,
                            Product: product
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Report: function (product, reason, suspend, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/process/product/Report", {
                        authorize: true,
                        data: {
                            Admin: Session.User.Id,
                            Product: product,
                            Reason: reason,
                            Suspend: suspend
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Reject: function (product, reason, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/process/product/Reject", {
                        authorize: true,
                        data: {
                            Admin: Session.User.Id,
                            Product: product,
                            Reason: reason
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            GetOffensiveWords: function (pending, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/process/product/GetOffensiveWords", {
                        data: {
                            Admin: Session.User.Id,
                            Pending: pending
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            UpdateOffensiveWords: function (add, remove, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/process/product/UpdateOffensiveWords", {
                        data: {
                            Admin: Session.User.Id,
                            Add: add,
                            Remove: remove
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            }
        }),

        Tag: {
            Cache: Session.Cache.Get(Session.Cache.Type.ProductTag, function (type) {
                return new (Session.FetchAllCache.extend({
                    ctor: function (type) {
                        Session.FetchAllCache.prototype.ctor.call(this, type);
                        this.ItemKey = "Product";
                    },

                    fetch: function (callback, faultCallback) {
                        return Service.Post("/admin/product/tag/Get", {
                            data: {
                                User: Session.User.Id
                            },
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    },

                    Serialize: function (items) {
                        return JSON.stringify(jQuery.map(items, function (item) {
                            return { Product: item.Product, Id: item.Id };
                        }));
                    }
                }))(Session.Cache.Type.ProductTag);
            }),

            Get: function (product, callback) {
                this.Cache.GetItems(function (tags) {
                    callback(jQuery.map(tags, function (lt) {
                        if (lt.Product == product)
                            return lt;
                    }));
                });
            },

            //Community.Profile.Personalize
            Personalize: function (product, tags, callback) {
                if (Session.User.Id > 0 && tags && tags.length > 0) {
                    this.Get(product, function (ownTags) {
                        if (ownTags && ownTags.length > 0) {
                            for (var i = 0, l = ownTags.length; i < l; i++) {
                                for (var j = 0; j < tags.length; j++) {
                                    if (tags[j].Id == ownTags[i].Id)
                                        tags[j].Own = true;
                                }
                            }
                        }
                        callback(tags);
                    });
                }
                else
                    callback(tags);
            },

            Add: function (product, tag, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/product/tag/Add", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Product: product,
                            Tag: tag
                        },
                        callback: function (tags) {
                            Admin.Service.Product.Tag.Cache.Reset();
                            callback(tags);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Promote: function (product, tag, callback, faultCallback) {
                Admin.Service.Product.Tag.promoteDemote(product, tag, "Promote", callback, faultCallback)
            },

            Demote: function (product, tag, callback, faultCallback) {
                Admin.Service.Product.Tag.promoteDemote(product, tag, "Demote", callback, faultCallback)
            },

            promoteDemote: function (product, tag, action, callback, faultCallback) {
                if (Session.User.Id > 0 && (product.Account.AccountType == Model.AccountType.Personal || Session.User.Business.Id > 0)) {
                    Service.Post("/admin/product/tag/" + action, {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Business: Session.User.Business.Id,
                            Product: product.Id,
                            Tag: tag
                        },
                        callback: function (tags) {
                            Admin.Service.Product.Tag.Cache.Reset();
                            callback(tags);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            }
        }
    },

    Personal: {
        Profile: {
            Edit: function (callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/personal/profile/Edit", {
                        authorize: true,
                        data: {
                            User: Session.User.Id
                        },
                        callback: function (profile) {
                            Model.Thumbnail.setImageRef.call(profile, Settings.Image.Small);
                            profile.Updated = Date.Deserialize(profile.Updated);
                            callback(profile);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Save: function (profile, image, callback, faultCallback) {
                if (profile.Id == 0 || Session.User.Id == profile.Id) {
                    var data = {
                        Profile: {
                            Id: profile.Id,
                            Name: profile.Name,
                            Address: profile.Address,
                            Phone: profile.Phone,
                            Updated: Date.Serialize(profile.Updated)
                        }
                    };
                    if (image)
                        data.Image = Service.Image.Serialize(image, Settings.Guid.Empty);
                    Service.Post("/admin/personal/profile/Save", {
                        authorize: true,
                        data: data,
                        callback: function (profile) {
                            profile.Timestamp = Date.Deserialize(profile.Timestamp);
                            callback(profile);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Delete: function (timestamp, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post('/admin/personal/profile/Delete', {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Timestamp: Date.Serialize(timestamp)
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            GetProducts: function (callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/personal/profile/GetProducts", {
                        data: {
                            User: Session.User.Id
                        },
                        callback: function (products) {
                            callback({ Series: products });
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            }
        },

        List: {
            Cache: Session.Cache.Get(Session.Cache.Type.PersonalList, function (type) {
                return new (Session.FetchAllCache.extend({
                    ctor: function (type) {
                        Session.FetchAllCache.prototype.ctor.call(this, type);
                        this.ItemKey = "Id";
                    },

                    fetch: function (callback, faultCallback) {
                        return Service.Post("/admin/personal/list/Get", {
                            data: {
                                User: Session.User.Id
                            },
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    },

                    Serialize: function (items) {
                        return JSON.stringify(jQuery.map(items, function (item) {
                            return { Id: item.Id, Name: item.Name };
                        }));
                    }
                }))(Session.Cache.Type.PersonalList);
            }),

            Get: function (callback) {
                this.Cache.GetItems(callback);
            },

            Exists: function (name, id, callback) {
                this.Cache.Exists(name, id, callback);
            },

            GetProducts: function (personalList, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/personal/list/GetProducts", {
                        data: {
                            User: Session.User.Id,
                            List: personalList
                        },
                        callback: function (data) {
                            if (data && data.Properties) {
                                for (var i = 0, l = data.Properties.length; i < l; i++) {
                                    data.Properties[i].Date = Date.Deserialize(data.Properties[i].Date);
                                }
                            }
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Create: function (personalList, callback, faultCallback) {
                if (personalList.Id == 0 && !String.isNullOrWhiteSpace(personalList.Name)) {
                    var $this = this;
                    this.Cache.Exists(personalList.Name, 0, function (exists) {
                        if (!exists) {
                            Service.Post("/admin/personal/list/Save", {
                                authorize: true,
                                data: {
                                    User: Session.User.Id,
                                    List: personalList
                                },
                                callback: function (result) {
                                    if (result.Value > 0)
                                        $this.Cache.Add({ Id: result.Value, Name: personalList.Name });
                                    callback(result.Value);
                                },
                                faultCallback: faultCallback
                            });
                        }
                        else
                            faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord));
                    });
                }
                else
                    throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "personalList");
            },

            Update: function (personalList, callback, faultCallback) {
                if (personalList.Id > 0 && !String.isNullOrWhiteSpace(personalList.Name)) {
                    var $this = this;
                    this.Cache.GetItems(function (personalLists) {
                        var cachedPersonalList = personalLists.singleOrDefault(function (pl) { return pl.Id == personalList.Id ? true : false });
                        if (cachedPersonalList) {
                            if (!$this.Cache.Exists(personalList.Name, 0, personalLists)) {
                                Service.Post("/admin/personal/list/Save", {
                                    authorize: true,
                                    data: {
                                        User: Session.User.Id,
                                        List: personalList
                                    },
                                    callback: function (result) {
                                        if (result && result.Value == personalList.Id) {
                                            cachedPersonalList.Name = personalList.Name;
                                            $this.Cache.PreservePending = true;
                                            callback(true);
                                        }
                                        else
                                            callback(false);
                                    },
                                    faultCallback: faultCallback
                                });
                            }
                            else
                                faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord));
                        }
                        else
                            faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.RecordNotFound));
                    });
                }
                else
                    throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "personalList");
            },

            Delete: function (personalList, removeProducts, callback, faultCallback) {
                if (personalList > 0) {
                    var $this = this;
                    this.Cache.GetItem(personalList, function (cachedPersonalList) {
                        if (cachedPersonalList && cachedPersonalList.Id == personalList) {
                            Service.Post("/admin/personal/list/Delete", {
                                authorize: true,
                                data: {
                                    User: Session.User.Id,
                                    List: personalList,
                                    RemoveProducts: removeProducts
                                },
                                callback: function (success) {
                                    if (success) {
                                        $this.Cache.Remove(personalList);
                                        callback(true);
                                    }
                                    else
                                        callback(false);
                                },
                                faultCallback: faultCallback
                            });
                        }
                        else
                            faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataExceptionType.RecordNotFound));
                    });
                }
                else
                    throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "personalList");
            },

            AddProduct: function (personalList, product, note, overwrite, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/personal/list/AddProduct", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            List: personalList,
                            Product: product,
                            Note: note,
                            Overwrite: overwrite === true ? true : false
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            RemoveProduct: function (personalList, product_s, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    var method;
                    var data = {
                        User: Session.User.Id,
                        List: personalList
                    };
                    if (typeof product_s == 'number') {
                        method = "RemoveProduct";
                        data.Product = product_s;
                    }
                    else if (product_s && product_s.length) {
                        method = "RemoveProduct_Multi";
                        data.Products = product_s;
                    }
                    else
                        throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "product");

                    Service.Post("/admin/personal/list/" + method, {
                        authorize: true,
                        data: data,
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            }
        },

        Product: {
            Edit: function (productId, key, callback, faultCallback) {
                if (Session.User.Id > 0 || !Guid.isEmpty(key)) {
                    Service.Post("/admin/personal/product/Edit", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Product: productId,
                            Key: key
                        },
                        callback: function (data) {
                            var product = data.Entity;
                            delete data.Entity;
                            product.Account = data;
                            product.Updated = Date.Deserialize(product.Updated);
                            product.Master.Updated = Date.Deserialize(product.Master.Updated);
                            if (product.Account.Id == Session.User.Id || (Session.User.Id == 0 && !Guid.isEmpty(key))) {
                                Admin.Model.Personal.Product.Profile.defineProperties(product);
                                callback(product);
                            }
                            else
                                callback();
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Save: function (product, newImages, callback, faultCallback) {
                if (product.NoAccount || (Session.User.Id > 0 && product.Account.Id == Session.User.Id)) {
                    var personalProduct = product.Account;
                    personalProduct.Entity = {
                        Id: product.Id,
                        Master: $.extend({}, product.Master),
                        //Side: product.Side,
                        Type: product.Type,
                        Price: product.Price,
                        Address: product.Address,
                        Attributes: {
                            Available: product.Attributes.Available,
                            Deleted: product.Attributes.Deleted
                        },
                        Images: {
                            Entity: product.Images.Entity,
                            Refs: product.Images.Refs.map(function (ir) {
                                var imageRef = {
                                    Token: ir.Token ? ir.Token : Settings.Guid.Empty
                                };
                                if (ir.Id)
                                    imageRef.Id = ir.Id;
                                if (ir.IsOwned)
                                    imageRef.IsOwned = true;
                                if (ir.IsDefault)
                                    imageRef.IsDefault = true;
                                return imageRef;
                            }),
                            Deleted: product.Images.Deleted
                        },
                        Status: product.Status,
                        PendingStatus: product.PendingStatus
                    };
                    if (product.Master.Updated)
                        personalProduct.Entity.Master.Updated = Date.Serialize(product.Master.Updated);
                    if (product.Updated)
                        personalProduct.Entity.Updated = Date.Serialize(product.Updated);
                    Service.Post("/process/product/Save", {
                        authorize: true,
                        data: {
                            PersonalProduct: personalProduct,
                            Images: newImages
                        },
                        callback: function (product) {
                            product.Timestamp = Date.Deserialize(product.Timestamp);
                            callback(product);
                        },
                        faultCallback: faultCallback
                    });
                }
            },

            Delete: function (product, masterTimestamp, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    product.Timestamp = Date.Serialize(product.Timestamp);
                    Service.Post('/admin/product/profile/Delete', {
                        authorize: true,
                        data: {
                            Type: Model.AccountType.Personal,
                            Account: Session.User.Id,
                            Product: product,
                            MasterTimestamp: Date.Serialize(masterTimestamp)
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            ValidateEmail: function (product, email, callback, faultCallback) {
                Service.Post('/admin/personal/product/ValidateEmail', {
                    data: {
                        Product: product,
                        Email: email
                    },
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
        }
    },

    Interaction: {
        Review: {
            Edit: function (product, review, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/admin/interaction/review/Edit", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Business: Session.User.Business.Id,
                            Product: product,
                            Review: review
                        },
                        callback: function (review) {
                            review.Updated = Date.Deserialize(review.Updated);
                            callback(review);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Save: function (review, callback, faultCallback) {
                if (Session.User.Id <= 0)
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);

                if (review.From == Session.User.Id && (review.FromBusiness == 0 || review.From == Session.User.Business.Id)) {
                    if (review.Id && review.Updated) {
                        review.Updated = Date.Serialize(review.Updated);
                    }
                    Service.Post("/process/review/Save", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Review: review
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.InvalidInteraction);
            }

        },

        Message: {
            Save: function (message, callback, faultCallback) {
                if (Session.User.Id <= 0)
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);

                if (message.From == Session.User.Id && (message.FromBusiness == 0 || message.From == Session.User.Business.Id)) {
                    Service.Post("/admin/interaction/message/Send", {
                        authorize: true,
                        data: {
                            Message: message
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.InvalidInteraction);
            },

            Delete: function (url, type, message_s, callback, faultCallback) {
                if (arguments.length == 5) {
                    var account = (type == Model.AccountType.Personal ? Session.User.Id : Session.User.Business.Id);
                    if (account > 0 && (type == Model.AccountType.Personal || Session.User.Id > 0)) {
                        var method;
                        var data = {
                            Type: type,
                            Account: account
                        };
                        if (typeof message_s == 'number') {
                            method = "/Delete";
                            data.Message = message_s;
                        }
                        else if ($.type(message_s) == "array" && message_s.length) {
                            method = "/Delete_Multi";
                            data.Messages = message_s;
                        }
                        else
                            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "message");

                        Service.Post(url + method, {
                            authorize: true,
                            data: data,
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    }
                    else
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
                }
                else if (arguments.length == 4) {
                    //arguments is not a full fledged array and has no splice method at least in IE8
                    //arguments.splice(0, 0, 'admin/interaction/message');
                    [].splice.call(arguments, 0, 0, '/admin/interaction/message');
                    this.Delete.apply(this, arguments);
                }
            },

            Folder: {
                Cache: Session.Cache.Get(Session.Cache.Type.MessageFolder, function (type) {
                    return new (Session.TreeCache.extend({
                        ctor: function (type) {
                            Session.FetchAllCache.prototype.ctor.call(this, type);
                            this.ItemKey = "Id";
                        },

                        fetch: function (callback, faultCallback) {
                            return Service.Post("/admin/interaction/message/folder/Get", {
                                data: {
                                    User: Session.User.Id
                                },
                                callback: callback,
                                faultCallback: faultCallback
                            });
                        },

                        Serialize: function (items) {
                            return JSON.stringify(jQuery.map(items, function (item) {
                                return { ParentId: item.ParentId, Id: item.Id, Name: item.Name/*, HasChildren: false*/ };
                            }));
                        }
                    }))(Session.Cache.Type.MessageFolder);
                }),

                Get: function (parentFolder, callback) {
                    this.Cache.GetChildren(parentFolder, callback);
                },

                //GetParent: function (folder, callback) {
                //    this.Cache.GetParent(folder, callback);
                //},

                GetMessages: function (type, folder, queryInput, callback, faultCallback) {
                    var account = (type == Model.AccountType.Personal ? Session.User.Id : Session.User.Business.Id);
                    if (account > 0 && (type == Model.AccountType.Personal || Session.User.Id > 0)) {
                        Service.Post("/admin/interaction/message/folder/GetMessages", {
                            data: {
                                Type: type,
                                Account: account,
                                Folder: folder,
                                QueryInput: queryInput
                            },
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    }
                    else
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
                },

                Exists: function (name, id, callback) {
                    this.Cache.Exists(name, id, callback);
                },

                Create: function (folder, parentFolder, callback, faultCallback) {
                    if (!String.isNullOrWhiteSpace(folder)) {
                        var $this = this;
                        this.Cache.Exists(folder, 0, function (exists) {
                            if (!exists) {
                                Service.Post("/admin/interaction/message/folder/Create", {
                                    authorize: true,
                                    data: {
                                        User: Session.User.Id,
                                        Name: folder,
                                        ParentFolder: parentFolder
                                    },
                                    callback: function (id) {
                                        if (id > 0)
                                            $this.Cache.Add({ ParentId: parentFolder, Id: id, Name: folder });
                                        callback(id);
                                    },
                                    faultCallback: faultCallback
                                });
                            }
                            else
                                faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord));
                        });
                    }
                    else
                        throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "personalList");
                },

                Rename: function (folderId, folderName, callback, faultCallback) {
                    if (folderId > 0 && !String.isNullOrWhiteSpace(folderName)) {
                        var $this = this;
                        this.Cache.GetItems(function (folders) {
                            var cachedFolder = folders.singleOrDefault(function (f) { return f.Id == folderId ? true : false });
                            if (cachedFolder) {
                                if (!$this.Cache.Exists(folderName, 0, folders)) {
                                    Service.Post("/admin/interaction/message/folder/Rename", {
                                        authorize: true,
                                        data: {
                                            User: Session.User.Id,
                                            Folder: folderId,
                                            Name: folderName
                                        },
                                        callback: function (success) {
                                            if (success) {
                                                cachedFolder.Name = folderName;
                                                $this.Cache.PreservePending = true;
                                                callback(true);
                                            }
                                            else
                                                callback(false);
                                        },
                                        faultCallback: faultCallback
                                    });
                                }
                                else
                                    faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord));
                            }
                            else
                                faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.RecordNotFound));
                        });
                    }
                    else
                        throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "personalList");
                },

                Delete: function (folder, removeMessages, callback, faultCallback) {
                    if (folder > 0) {
                        var $this = this;
                        this.Cache.GetItem(folder, function (cachedFolder) {
                            if (cachedFolder && cachedFolder.Id == folder) {
                                Service.Post("/admin/interaction/message/folder/Delete", {
                                    authorize: true,
                                    data: {
                                        User: Session.User.Id,
                                        Folder: folder,
                                        RemoveMessages: removeMessages
                                    },
                                    callback: function (success) {
                                        if (success) {
                                            $this.Cache.Remove(folder);
                                            callback(true);
                                        }
                                        else
                                            callback(false);
                                    },
                                    faultCallback: faultCallback
                                });
                            }
                            else
                                faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataExceptionType.RecordNotFound));
                        });
                    }
                    else
                        throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "folder");
                },

                AddMessage: function (folder, message_s, callback, faultCallback) {
                    if (Session.User.Id > 0) {
                        var method;
                        var data = {
                            User: Session.User.Id,
                            Folder: folder
                        };
                        if (typeof message_s == 'number') {
                            method = "AddMessage";
                            data.Message = message_s;
                        }
                        else if ($.type(message_s) == "array" && message_s.length) {
                            method = "AddMessage_Multi";
                            data.Messages = message_s;
                        }
                        else
                            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentExceptionType.Invalid, "message");

                        Service.Post("/admin/interaction/message/folder/" + method, {
                            authorize: true,
                            data: data,
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    }
                    else
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
                }
            },

            Received: {
                Get: function (type, queryInput, callback, faultCallback) {
                    var account = (type == Model.AccountType.Personal ? Session.User.Id : Session.User.Business.Id);
                    if (account > 0 && (type == Model.AccountType.Personal || Session.User.Id > 0)) {
                        Service.Post("/admin/interaction/message/received/Get", {
                            data: {
                                Type: type,
                                Account: account,
                                QueryInput: queryInput
                            },
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    }
                    else
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
                },

                Delete: function (type, message_s, callback, faultCallback) {
                    Admin.Service.Interaction.Message.Delete('/admin/interaction/message/received', type, message_s, callback, faultCallback);
                },

                ToPreview: function (type, messages, callback, faultCallback) {
                    var account = (type == Model.AccountType.Personal ? Session.User.Id : Session.User.Business.Id);
                    if (account > 0 && (type == Model.AccountType.Personal || Session.User.Id > 0)) {
                        Service.Post("/admin/interaction/message/received/ToPreview", {
                            data: {
                                Type: type,
                                Account: account,
                                Messages: messages
                            },
                            callback: function (data) {
                                if (data)
                                    Model.Message.Received.Deserialize(data);
                                callback(data);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
                }
            }
        }
    },

    Community: {
        Profile: {
            Cache: Session.Cache.Get(Session.Cache.Type.CommunityMembership, function (type) {
                return new (Session.FetchAllCache.extend({
                    ctor: function (type) {
                        Session.FetchAllCache.prototype.ctor.call(this, type);
                        this.ItemKey = "Id";
                    },

                    fetch: function (callback, faultCallback) {
                        //Populates both Personal and Business communities
                        return Service.Post("/admin/community/profile/Get", {
                            data: {
                                Type: Model.AccountType.Personal,
                                Account: Session.User.Id
                            },
                            callback: function (communities) {
                                if (communities && communities.length) {
                                    for (var i = 0, l = communities.length; i < l; i++) {
                                        communities[i].Date = Date.Deserialize(communities[i].Date);
                                        communities[i].Updated = Date.Deserialize(communities[i].Updated);
                                    }
                                }
                                callback(communities);
                            },
                            faultCallback: faultCallback
                        });
                    },

                    GetItem: function (community, callback) {
                        this.Get(community, true, callback);
                    },

                    Get: function (community, ignorePending, callback) {
                        /*var callback, ignorePending = true;
                        if (arguments.length == 2 && typeof arguments[0] == 'number' && typeof arguments[1] == 'function') {
                            callback = arguments[1];
                        }
                        else if (arguments.length == 3 && typeof arguments[0] == 'number' && typeof arguments[1] == 'boolean' && typeof arguments[2] == 'function') {
                            ignorePending = arguments[1];
                            callback = arguments[2];
                        }
                        else if (arguments.length == 1 && typeof arguments[0] == 'function') {
                            return Session.FetchAllCache.prototype.Get.apply(this, arguments);
                        }
                        else
                            throw 'Invalid arguments';*/

                        Session.FetchAllCache.prototype.GetItem.call(this, community, function (cachedCommunity) {
                            if (cachedCommunity && cachedCommunity.Pending && ignorePending)
                                callback();
                            else
                                callback(cachedCommunity);
                        });
                    },

                    Serialize: function (items) {
                        return JSON.stringify(jQuery.map(items, function (item) {
                            return {
                                Id: item.Id,
                                Name: item.Name,
                                BusinessId: item.BusinessId,
                                Type: item.Type,
                                Date: item.Date,
                                Pending: item.Pending,
                                BlogTitle: item.BlogTitle,
                                Updated: item.Updated
                            };
                        }));
                    },

                    Deserialize: function (items) {
                        items = JSON.parse(items);
                        if (items && items.length) {
                            for (var i = 0, l = items.length; i < l; i++) {
                                items[i].Date = Date.Deserialize(items[i].Date);
                                items[i].Updated = Date.Deserialize(items[i].Updated);
                            }
                        }
                        return items;
                    }
                }))(Session.Cache.Type.CommunityMembership);
            }),

            RequestCache: Session.Cache.Get(Session.Cache.Type.CommunityRequest, function (type) {
                return new (Session.FetchAllCache.extend({
                    ctor: function (type) {
                        Session.FetchAllCache.prototype.ctor.call(this, type);
                        this.ItemKey = "Id";
                        this.nextId = 1;
                    },

                    fetch: function (callback, faultCallback) {
                        var $this = this;
                        return Service.Post("/admin/community/profile/GetRequests", {
                            data: {
                                Type: Model.AccountType.Personal,
                                Account: Session.User.Id
                            },
                            callback: function (requests) {
                                if (requests && requests.length) {
                                    for (var i = 0, l = requests.length; i < l; i++) {
                                        requests[i].Id = $this.nextId++;
                                        requests[i].Date = Date.Deserialize(requests[i].Date);
                                    }
                                }
                                callback(requests);
                            },
                            faultCallback: faultCallback
                        });
                    },

                    Reset: function () {
                        Session.FetchAllCache.prototype.Reset.call(this);
                        this.nextId = 1;
                    },

                    Serialize: function (items) {
                        return JSON.stringify(jQuery.map(items, function (item) {
                            return {
                                Id: item.Id,
                                CommunityId: item.CommunityId,
                                BusinessId: item.BusinessId,
                                Invitation: item.Invitation,
                                From: item.From,
                                Type: item.Type,
                                Date: item.Date,
                                Text: item.Text
                            };
                        }));
                    },

                    Deserialize: function (items) {
                        this.nextId = 0;
                        items = JSON.parse(items);
                        if (items && items.length) {
                            for (var i = 0, l = items.length; i < l; i++) {
                                if (items[i].Id > this.nextId)
                                    this.nextId = items[i].Id;
                                items[i].Date = Date.Deserialize(items[i].Date);
                            }
                        }
                        this.nextId++;
                        return items;
                    }
                }))(Session.Cache.Type.CommunityRequest);
            }),

            GetRequests: function (type, callback) {
                var account = (type == Model.AccountType.Personal ? Session.User.Id : Session.User.Business.Id);
                if (account > 0 && (type == Model.AccountType.Personal || Session.User.Id > 0)) {
                    this.RequestCache.GetItems(function (requests) {
                        var business = Session.User.Business.Id;
                        switch (type) {
                            //Return requests from new members' to join owned/managed business communities   
                            case Model.AccountType.Business:
                                callback(jQuery.map(requests, function (r) {
                                    if (r.BusinessId > 0 && r.BusinessId == business)
                                        return r;
                                }));
                                break;
                                //Return invitations to join other communities and requests from new members' to join owned/managed personal communities   
                            case Model.AccountType.Personal:
                                callback(jQuery.map(requests, function (r) {
                                    if (r.BusinessId != business)
                                        return r;
                                }));
                                break;
                        }
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            GetRequest: function (id, callback) {
                this.RequestCache.GetItem(id, callback);
            },

            GetPending: function (community, callback) {
                this.Cache.Get(community, false, callback);
            },

            Get: function (community, callback) {
                this.Cache.GetItem(community, callback);
            },

            GetByMembership: function (memberType, callback) {
                memberType = Model.Community.MemberType[memberType];
                if (memberType == Model.Community.MemberType.Moderator || memberType == Model.Community.MemberType.Content_Producer || memberType == Model.Community.MemberType.Member) {
                    var $this = this;
                    this.Cache.GetItems(function (communities) {
                        callback($this.filterByMembership(communities, memberType));
                    });
                }
                else
                    throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "MemberType");
            },

            GetList: function (accountType, memberType, callback) {
                var account = (accountType == Model.AccountType.Personal ? Session.User.Id : Session.User.Business.Id);
                if (account > 0 && (accountType == Model.AccountType.Personal || Session.User.Id > 0)) {
                    memberType = arguments[1];
                    if (memberType == null || memberType == Model.Community.MemberType.Moderator || memberType == Model.Community.MemberType.Content_Producer) {
                        this.Cache.GetItems(function (communities) {
                            var q;
                            var business = Session.User.Business.Id;
                            switch (accountType) {
                                case Model.AccountType.Business:
                                    q = jQuery.map(communities, function (c) {
                                        if (c.BusinessId > 0 && c.BusinessId == business)
                                            return c;
                                    });
                                    break;
                                case Model.AccountType.Personal:
                                    q = jQuery.map(communities, function (c) {
                                        if (c.BusinessId != business)
                                            return c;
                                    });
                                    break;
                            }
                            if (memberType != null)
                                callback($this.filterByMembership(q, memberType));
                            else
                                callback(q);
                        });
                    }
                    else
                        throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "MemberType");
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            filterByMembership: function (communityMemberships, memberType) {
                switch (memberType) {
                    case Model.Community.MemberType.Moderator:
                        return jQuery.map(communityMemberships, function (cm) {
                            if (!cm.Pending && (cm.Type == Model.Community.MemberType.Owner || cm.Type == Model.Community.MemberType.Moderator))
                                return cm;
                        });
                    case Model.Community.MemberType.Content_Producer:
                        return jQuery.map(communityMemberships, function (cm) {
                            if (!cm.Pending && cm.Post_Products && (cm.Type == Model.Community.MemberType.Owner || cm.Type == Model.Community.MemberType.Moderator || cm.Type == Model.Community.MemberType.Content_Producer))
                                return cm;
                        });
                    default:
                        return communityMemberships;
                }
            },

            CanManage: function () {
                //Replica in AdScrl.Data.Cache.Community.CanManage
                var canManage = function (communityMembership) {
                    if (communityMembership && (communityMembership.Type == Model.Community.MemberType.Owner || communityMembership.Type == Model.Community.MemberType.Moderator)) {
                        //Moderators of business communities must have the same business
                        if (communityMembership.BusinessId > 0) {
                            return Session.User.Business.Id == communityMembership.BusinessId;
                        }
                        else
                            return true;
                    }
                    else
                        return false;
                };

                return function (community, callback) {
                    if (callback) {
                        Admin.Service.Community.Profile.Get(community, function (cachedCommunity) {
                            callback(canManage(cachedCommunity));
                        });
                    }
                    else
                        return canManage(community);
                };
            }(),

            CanProduce: function () {
                //Replica in AdScrl.Data.Cache.Community.CanProduce
                var canContribute = function (communityMembership) {
                    if (communityMembership && (communityMembership.Type == Model.Community.MemberType.Owner || communityMembership.Type == Model.Community.MemberType.Moderator || communityMembership.Type == Model.Community.MemberType.Content_Producer))
                        return true;
                    return false;
                };

                return function (community, callback) {
                    if (callback) {
                        Admin.Service.Community.Profile.Get(community, function (cachedCommunity) {
                            callback(canContribute(cachedCommunity));
                        });
                    }
                    else
                        return canContribute(community);
                };
            }(),

            IsMember: function () {
                //Replica in AdScrl.Data.Cache.Community.IsMember
                var isMember = function (communityMembership) {
                    if (communityMembership && communityMembership.Type > 0)
                        return true;
                    return false;
                };

                return function (community, callback) {
                    if (callback) {
                        Admin.Service.Community.Profile.Get(community, function (cachedCommunity) {
                            callback(isMember(cachedCommunity));
                        });
                    }
                    else
                        return isMember(community);
                };
            }(),

            ToPreview_Request: function (requests, callback, faultCallback) {
                var user = Session.User.Id;
                if (user > 0) {
                    var r = [];
                    for (var i = 0, l = requests.length; i < l; i++) {
                        r.push({
                            Id: requests[i].Id,
                            CommunityId: requests[i].CommunityId,
                            Invitation: requests[i].Invitation,
                            From: typeof requests[i].Business != "undefined" ? {
                                //To deserialize CachedCommunityRequest.From in Admin.Data.Community.Profile.ToPreview(... CachedCommunityRequest[] ...)
                                //Otherwise WCF deserializes as base class and drops Business
                                __type: "Account:http://ns.adscroll.com/model/personal",
                                Type: requests[i].From.Type,
                                Id: requests[i].From.Id,
                                Business: requests[i].From.Business,
                                Name: requests[i].From.Name,
                                HasImage: requests[i].From.HasImage
                            } : requests[i].From,
                            Type: requests[i].Type,
                            Date: Date.Serialize(requests[i].Date),
                            Text: requests[i].Text
                        });
                    }
                    return Service.Post("/admin/community/profile/ToPreview_Request", {
                        data: {
                            Admin: Session.User.Id,
                            Requests: r
                        },
                        callback: function (data) {
                            Model.Community.Preview.Deserialize(data);
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            ToPreview: function (communities, callback, faultCallback) {
                this.Cache.Find(communities, function (cachedCommunities) {
                    var communities = [];
                    for (var i = 0, l = cachedCommunities.length; i < l; i++) {
                        communities.push({
                            Id: cachedCommunities[i].Id,
                            Type: cachedCommunities[i].Type,
                            Date: Date.Serialize(cachedCommunities[i].Date),
                            Pending: cachedCommunities[i].Pending
                        });
                    }
                    return Service.Post("/admin/community/profile/ToPreview", {
                        data: {
                            Admin: Session.User.Id,
                            Communities: communities
                        },
                        callback: function (data) {
                            Model.Community.Preview.Deserialize(data);
                            callback(data);
                        },
                        faultCallback: faultCallback
                    });
                });
            },

            //Product.Tag.Personalize
            Personalize: function (communities, callback) {
                if (Session.User.Id > 0 && communities && communities.length > 0) {
                    this.Get('Member', function (memberships) {
                        if (memberships && memberships.length > 0) {
                            for (var i = 0, l = memberships.length; i < l; i++) {
                                for (var j = 0; j < communities.length; j++) {
                                    if (communities[j].Id == memberships[i].Id)
                                        communities[j].Membership = {
                                            Type: memberships[i].Type,
                                            Date: memberships[i].Date,
                                            Pending: memberships[i].Pending
                                        };
                                }
                            }
                        }
                        callback(communities);
                    });
                }
                else
                    callback(communities);
            }
        },

        Membership: {
            Type: {
                None: 0,
                Invitation: 1,
                MembershipRequest: 2,
                Membership: 4
            },

            Exists: function (community, callback) {
                var $this = this;
                var exists = this.Type.None;
                var type = this.Type.Invitation | this.Type.MembershipRequest | this.Type.Membership;
                if ((type & this.Type.Invitation) > 0) {
                    Admin.Service.Community.Profile.RequestCache.GetItems(function (cachedRequests) {
                        for (var i = 0, l = cachedRequests.length; i < l; i++) {
                            var cr = cachedRequests[i];
                            if (cr.Invitation && cr.Id == community) {
                                exists |= $this.Type.Invitation;
                                break;
                            }
                        }
                        if ((type & $this.Type.MembershipRequest) > 0 || (type & $this.Type.Membership) > 0)
                            Admin.Service.Community.Profile.Cache.Get(community, false, function (cachedCommunity) {
                                if (cachedCommunity)
                                    exists |= cachedCommunity.Pending ? $this.Type.MembershipRequest : $this.Type.Membership;
                                callback(exists);
                            });
                        else
                            callback(exists);
                    });
                }
                else if ((type & this.Type.MembershipRequest) > 0 || (type & this.Type.Membership) > 0)
                    Admin.Service.Community.Profile.Cache.Get(community, false, function (cachedCommunity) {
                        if (cachedCommunity)
                            exists |= cachedCommunity.Pending ? $this.Type.MembershipRequest : $this.Type.Membership;
                        callback(exists);
                    });
            },

            Join: function (community, business, callback, faultCallback) {
                Admin.Service.Community.Membership.Exists(community, function (exists) {
                    if (exists == Admin.Service.Community.Membership.Type.None) {
                        Service.Post("/admin/community/member/Join", {
                            authorize: true,
                            data: {
                                Member: Session.User.Id,
                                Community: community
                            },
                            callback: function (success) {
                                if (success) {
                                    Admin.Service.Community.Profile.Cache.Reset();
                                }
                                callback(success);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord));
                });
            },

            Request: function (request, callback, faultCallback) {
                Admin.Service.Community.Membership.Exists(request.Community, function (exists) {
                    if (exists == Admin.Service.Community.Membership.Type.None) {
                        Service.Post("/admin/community/member/Request", {
                            authorize: true,
                            data: {
                                Member: Session.User.Id,
                                Request: request
                            },
                            callback: function (success) {
                                if (success) {
                                    Admin.Service.Community.Profile.Cache.Reset();
                                }
                                callback(success);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.DataException(Foundation.Exception.DataException.Type.DuplicateRecord));
                });
            },

            AcceptRequest: function (requestId, community, member, type, callback, faultCallback) {
                var moderator = Session.User.Id;
                if (member > 0 && moderator != member) {
                    Admin.Service.Community.Profile.RequestCache.GetItem(requestId, function (cachedRequest) {
                        if (cachedRequest && !cachedRequest.Invitation && cachedRequest.Id == requestId && cachedRequest.CommunityId == community) {
                            Admin.Service.Community.Profile.CanManage(community, function (canManage) {
                                if (canManage) {
                                    Service.Post("/admin/community/member/AcceptRequest", {
                                        authorize: true,
                                        data: {
                                            Moderator: moderator,
                                            Business: cachedRequest.BusinessId,
                                            Community: community,
                                            Member: member,
                                            Type: type
                                        },
                                        callback: function (success) {
                                            if (success) {
                                                Admin.Service.Community.Profile.RequestCache.Remove(requestId);
                                            }
                                            callback(success);
                                        },
                                        faultCallback: faultCallback
                                    });
                                }
                                else
                                    faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                            });
                        }
                        else
                            faultCallback(new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid));
                    });
                }
                else
                    throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.InvalidInteraction);
            },

            DeclineRequest: function (requestId, community, member, block, callback, faultCallback) {
                var moderator = Session.User.Id;
                if (member > 0 && moderator != member) {
                    Admin.Service.Community.Profile.RequestCache.GetItem(requestId, function (cachedRequest) {
                        if (cachedRequest && !cachedRequest.Invitation && cachedRequest.Id == requestId && cachedRequest.CommunityId == community) {
                            Admin.Service.Community.Profile.CanManage(community, function (canManage) {
                                if (canManage) {
                                    Service.Post("/admin/community/member/DeclineRequest", {
                                        authorize: true,
                                        data: {
                                            Moderator: moderator,
                                            Business: cachedRequest.BusinessId,
                                            Community: community,
                                            Member: member,
                                            Block: block
                                        },
                                        callback: function (success) {
                                            if (success) {
                                                Admin.Service.Community.Profile.RequestCache.Remove(requestId);
                                            }
                                            callback(success);
                                        },
                                        faultCallback: faultCallback
                                    });
                                }
                                else
                                    faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                            });
                        }
                        else
                            faultCallback(new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid));
                    });
                }
                else
                    throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.InvalidInteraction);
            },

            Invite: function (request, callback, faultCallback) {
                var moderator = Session.User.Id;
                if (request.Member > 0 && moderator != request.Member) {
                    Admin.Service.Community.Profile.Get(request.Community, function (cachedCommunity) {
                        if (Admin.Service.Community.Profile.CanManageInner(cachedCommunity) && cachedCommunity.Id == request.Community) {
                            request.Business = cachedCommunity.BusinessId;
                            if (request.Type > 0 && request.Type != Model.Community.MemberType.Owner) {
                                Service.Post("/admin/community/member/Invite", {
                                    authorize: true,
                                    data: {
                                        Moderator: moderator,
                                        Invite: request
                                    },
                                    callback: callback,
                                    faultCallback: faultCallback
                                });

                                return;
                            }
                        }
                        faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                    });
                }
                else
                    throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.InvalidInteraction);
            },

            AcceptInvitation: function (requestId, community, callback, faultCallback) {
                Admin.Service.Community.Profile.RequestCache.GetItem(requestId, function (cachedRequest) {
                    if (cachedRequest && cachedRequest.Invitation && cachedRequest.Id == requestId && cachedRequest.CommunityId == community) {
                        Service.Post("/admin/community/member/AcceptInvitation", {
                            authorize: true,
                            data: {
                                Member: Session.User.Id,
                                Community: community
                            },
                            callback: function (success) {
                                if (success) {
                                    Admin.Service.Community.Profile.Cache.Reset();
                                    Admin.Service.Community.Profile.RequestCache.Remove(requestId);
                                }
                                callback(success);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid));
                });
            },

            DeclineInvitation: function (requestId, community, block, callback, faultCallback) {
                Admin.Service.Community.Profile.RequestCache.GetItem(requestId, function (cachedRequest) {
                    if (cachedRequest && cachedRequest.Invitation && cachedRequest.Id == requestId && cachedRequest.CommunityId == community) {
                        Service.Post("/admin/community/member/DeclineInvitation", {
                            authorize: true,
                            data: {
                                Member: Session.User.Id,
                                Community: community,
                                Block: block
                            },
                            callback: function (success) {
                                if (success) {
                                    Admin.Service.Community.Profile.RequestCache.Remove(requestId);
                                }
                                callback(success);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid));
                });
            },

            LeaveCommunity: function (community, callback, faultCallback) {
                Admin.Service.Community.Profile.GetPending(community, function (communityMembership) {
                    if (communityMembership && communityMembership.Type > 0 && communityMembership.Type != Model.Community.MemberType.Owner && communityMembership.Id == community) {
                        Service.Post("/admin/community/member/LeaveCommunity", {
                            authorize: true,
                            data: {
                                Member: Session.User.Id,
                                Community: community
                            },
                            callback: function (success) {
                                if (success) {
                                    Admin.Service.Community.Profile.Cache.Remove(community);
                                }
                                callback(success);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid));
                });
            }
        },

        Product: {
            Add: function (community, category, product_s/*, text, overwrite, callback, faultCallback*/) {
                var method, argIndex, callback, faultCallback;
                var data = {
                    Producer: Session.User.Id,
                    Business: Session.User.Business.Id,
                    Community: community,
                    Category: category
                };
                if (typeof product_s == "number" && arguments.length > 5) {
                    data.Product = product_s;
                    data.Text = arguments[3];
                    argIndex = 4;
                    method = 'Add';
                }
                else if ($.type(product_s) == "array" && product_s.length && arguments.length > 4) {
                    data.Products = product_s;
                    argIndex = 3;
                    method = 'Add_Multi';
                }
                else
                    throw 'Unexpected arguments';

                data.Overwrite = arguments[argIndex++] === true ? true : false
                callback = arguments[argIndex++];
                if (arguments.length > argIndex)
                    faultCallback = arguments[argIndex];

                Admin.Service.Community.Profile.CanProduce(community, function (canContribute) {
                    if (canContribute) {
                        Service.Post("/admin/community/product/" + method, {
                            authorize: true,
                            data: data,
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                });
            }
        },

        Category: {
            Cache: function (community) {
                var cache = Session.Cache.Get(Session.Cache.Type.CommunityCategory, function (type) {
                    return new (Session.TreeCache.extend({
                        ctor: function (community, type) {
                            Session.FetchAllCache.prototype.ctor.call(this, type);
                            this.Community = community;
                            this.ItemKey = "Id";
                        },

                        fetch: function (callback, faultCallback) {
                            return Service.Post("/admin/community/category/Get", {
                                data: {
                                    Moderator: Session.User.Id,
                                    Business: Session.User.Business.Id,
                                    Community: this.Community
                                },
                                callback: callback,
                                faultCallback: faultCallback
                            });
                        },

                        Reset: function (community) {
                            if (community != undefined) {
                                if (this.Community != community) {
                                    this.Community = community;
                                    Session.TreeCache.prototype.Reset.call(this);
                                }
                            }
                            else
                                Session.TreeCache.prototype.Reset.call(this);
                        },

                        Serialize: function (items) {
                            return JSON.stringify(jQuery.map(items, function (item) {
                                return { ParentId: item.ParentId, Id: item.Id, Name: item.Name, Locked: item.Locked/*, HasChildren: false*/ };
                            }));
                        }
                    }))(community, Session.Cache.Type.CommunityCategory);
                });
                if (cache.Community != community)
                    cache.Reset(community);
                return cache;
            },

            GetCategories: function (community, parentCategory, callback) {
                this.Cache(community).GetChildren(parentCategory, callback);
            }

            //GetParent: function (community, category, callback) {
            //    this.Cache(community).GetParent(category, callback);
            //}
        },

        Topic: {
            Post: {
                Edit: function (community, topic, post, callback, faultCallback) {
                    Admin.Service.Community.Profile.IsMember(community, function (isMember) {
                        if (isMember) {
                            Service.Post("/admin/community/topic/post/Edit", {
                                authorize: true,
                                data: {
                                    Member: Session.User.Id,
                                    Business: Session.User.Business.Id,
                                    Community: community,
                                    Topic: topic,
                                    Post: post
                                },
                                callback: function (post) {
                                    post.Updated = Date.Deserialize(post.Updated);
                                    callback(post);
                                },
                                faultCallback: faultCallback
                            });
                        }
                        else
                            faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                    });
                },

                Save: function (post, callback, faultCallback) {
                    if (Session.User.Id <= 0)
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);

                    if (!post || post.Community <= 0 || post.Topic <= 0)
                        throw new Foundation.Exception.OperationException(OperationException.Type.Invalid);

                    Admin.Service.Community.Profile.Get(post.Community, function (cachedCommunity) {
                        if ((post.From != Session.User.Id || (post.FromBusiness > 0 && post.FromBusiness != Session.User.Business.Id)) && !Admin.Service.Community.Profile.CanManageInner(cachedCommunity))
                            faultCallback(new Foundation.Exception.OperationException(OperationException.Type.InvalidInteraction));

                        if (Admin.Service.Community.Profile.IsMember(cachedCommunity)) {
                            if (post.Id && post.Updated) {
                                post.Updated = Date.Serialize(post.Updated);
                            }
                            Service.Post("/process/community/topic/post/Save", {
                                authorize: true,
                                data: {
                                    Member: Session.User.Id,
                                    Business: Session.User.Business.Id,
                                    Post: post
                                },
                                callback: callback,
                                faultCallback: faultCallback
                            });
                        }
                        else
                            faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                    });
                }
            },

            Edit: function (community, topic, callback, faultCallback) {
                Admin.Service.Community.Profile.IsMember(community, function (isMember) {
                    if (isMember) {
                        Service.Post("/admin/community/topic/Edit", {
                            authorize: true,
                            data: {
                                Member: Session.User.Id,
                                Business: Session.User.Business.Id,
                                Community: community,
                                Topic: topic
                            },
                            callback: function (topic) {
                                topic.Updated = Date.Deserialize(topic.Updated);
                                callback(topic);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                });
            },

            Save: function (topic, callback, faultCallback) {
                if (Session.User.Id <= 0)
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);

                if (!topic || topic.Community <= 0)
                    throw new Foundation.Exception.OperationException(OperationException.Type.Invalid);

                Admin.Service.Community.Profile.Get(topic.Community, function (cachedCommunity) {
                    if ((topic.From != Session.User.Id || (topic.FromBusiness > 0 && topic.FromBusiness != Session.User.Business.Id)) && !Admin.Service.Community.Profile.CanManageInner(cachedCommunity))
                        faultCallback(new Foundation.Exception.OperationException(OperationException.Type.InvalidInteraction));

                    if (Admin.Service.Community.Profile.IsMember(cachedCommunity) && ((topic.Category && topic.Category.Id > 0) || Admin.Service.Community.Profile.CanManageInner(cachedCommunity))) {
                        if (topic.Id && topic.Updated) {
                            topic.Updated = Date.Serialize(topic.Updated);
                        }
                        Service.Post("/process/community/topic/Save", {
                            authorize: true,
                            data: {
                                Member: Session.User.Id,
                                Business: Session.User.Business.Id,
                                Topic: topic
                            },
                            callback: callback,
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized));
                });
            }
        }
    }
});

Object.defineProperties(Admin.Service.Product.Profile, {
    FacetNames: {
        get: function () {
            if (!this.facetNames) {
                this.facetNames = [];
                for (var fn in Model.Product.FacetName) {
                    this.facetNames.push(Resource.Product['FacetName_' + fn]);
                }
            }
            return this.facetNames;
        }
    }
});

/*User.Service.Master.Category = $.extend(User.Service.Master.Category, {
    GetProducts: function (location, category, accountType, queryInput, callback, faultCallback) {
        return Service.Get("/master/category/GetProducts?location=" + location + "&category=" + category + (accountType ? "&accountType=" + accountType : "") + "&queryInput=" + JSON.stringify(queryInput), function (data) {
            if (data)
                Model.Semantic.Facet.Deserialize(data.Facets);
            callback(data);
        }, faultCallback);
    }
});*/