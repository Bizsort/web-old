Service = $.extend(window.Service || {}, {
    Fault: {
        Type: {
            Unknown: 0,
            Operation: 1,
            Data: 2,
            Session: 3,
            Argument: 4
        }
    },

    //http://stackoverflow.com/questions/1002367/jquery-ajax-jsonp-ignores-a-timeout-and-doesnt-fire-the-error-event
    /*
    JSONP is a very powerful technique for building mashups, but, unfortunately, 
    it is not a cure-all for all of your cross-domain communication needs. 
    It has some drawbacks that must be taken into serious consideration before committing development resources. 
    First and foremost, there is no error handling for JSONP calls. 
    If the dynamic script insertion works, you get called; if not, nothing happens. It just fails silently. 
    For example, you are not able to catch a 404 error from the server. Nor can you cancel or restart the request. 
    You can, however, timeout after waiting a reasonable amount of time. (Future jQuery versions may have an abort feature for JSONP requests.)
    */
    //https://developer.mozilla.org/en/http_access_control#The_HTTP_request_headers
    /*
    Simple requests
    A simple cross-site request is one that:
    Only uses GET or POST. If POST is used to send data to the server, the Content-Type of the data sent to the server with the HTTP POST request is one of application/x-www-form-urlencoded, multipart/form-data, or text/plain.
    Does not set custom headers with the HTTP Request (such as X-Modified, etc.)

    Preflighted requests
    Unlike simple requests (discussed above), "preflighted" requests first send an HTTP OPTIONS request header to the resource on the other domain, in order to determine whether the actual request is safe to send.  Cross-site requests are preflighted like this since they may have implications to user data.  In particular, a request is preflighted if:
    It uses methods other than GET or POST.  Also, if POST is used to send request data with a Content-Type other than application/x-www-form-urlencoded, multipart/form-data, or text/plain, e.g. if the POST request sends an XML payload to the server using application/xml or text/xml, then the request is preflighted.
    It sets custom headers in the request (e.g. the request uses a header such as X-PINGOTHER)
    */
    Get: (function (baseUrl) {
        var invoke = function (url, options) {
            var settings = {
                //timeout: 5000,
                dataType: "json",
                contentType: 'application/json',
                url: baseUrl + url,
                success: options.callback
            };
            var headers = {};
            if (options.session && Service.SessionToken) {
                headers[Settings.Session.TokenHeader] = Service.SessionToken;
            }
            if (!jQuery.isEmptyObject(headers))
                settings.headers = headers;
            if (options.faultCallback) {
                settings.error = function (jqxhr, settings, error) {
                    ajaxError(jqxhr, settings, error, options.faultCallback);
                };
            }
            return jQuery.ajax(settings);
        };

        invoke.Url = function (url) {
            if (url) {
                baseUrl = url;
            }
        };

        return invoke;
    })(Settings.Service.Origin),

    Image: {
        Cache: {
            images: {},
            //Token: 0,
            Add: function (image) {
                var token = Guid.newGuid();
                this.images[token/*this.Token*/] = image;
                return token; //this.Token++
            },
            Get: function (imageRefs) {
                var newImages = [];
                for (var i = 0, l = imageRefs.length; i < l; i++) {
                    var image = this.images[imageRefs[i].Token];
                    if (image)
                        newImages.push(Service.Image.Serialize(image, imageRefs[i].Token));
                }
                return newImages;
            },
            Clear: function () {
                this.images = {}
            }
        },

        Serialize: function (image, token) {
            return {
                Token: token,
                Width: image.Width,
                Height: image.Height,
                Content_Base64: image.Content.split(",")[1],
                Type: image.Format
            };
        }
    },

    Post: (function (baseUrl, secureUrl, key) {
        var invoke = function (url, options) {
            var settings = {
                type: 'POST',
                //dataType: 'jsonp',
                //timeout: 5000, //if jsonp is used to allow cross-domain - should also set timeout, otherwise faultCallback may not get called
                dataType: 'json',
                contentType: 'application/json',
                url: baseUrl + url
            };
            var headers = {};
            if (Service.SessionToken) {
                headers[Settings.Session.TokenHeader] = Service.SessionToken;
            }
            if (options) {
                if (options.secure || options.authorize) {
                    settings.url = secureUrl + url;
                    if (options.authorize && key)
                        headers[Settings.Session.KeyHeader] = key;
                }

                settings.data = JSON.stringify(options.data || {});

                if (options.async === false)
                    settings.async = false;

                if (options.xhrFields) {
                    settings.xhrFields = options.xhrFields;
                }

                if (options.crossDomain) {
                    settings.crossDomain = true;
                }

                if (options.callback)
                    settings.success = options.callback;

                if (options.faultCallback) {
                    settings.error = function (jqxhr, settings, error) {
                        ajaxError(jqxhr, settings, error, options.faultCallback);
                    }
                }
            }

            if (!jQuery.isEmptyObject(headers))
                settings.headers = headers;

            return jQuery.ajax(settings);
        };

        invoke.Url = function (url, sUrl) {
            if (url) {
                baseUrl = url;
                secureUrl = sUrl || url;
            }
        };

        invoke.Key = function (newKey) {
            key = newKey;
        };

        return invoke;
    })(Settings.Service.Origin, Settings.Service.Origin),

    TranslateFault: function (jqxhr) {
        if (jqxhr && jqxhr.status == 500 && jqxhr.statusText == "AdScrl_Fault" && jqxhr.responseText) {
            try {
                var fault = JSON.parse(jqxhr.responseText);
            }
            catch (e) {
                return new Error(Resource.Exception.Unknown);
            }
            var ex;
            switch (fault.Type) {
                case Service.Fault.Type.Operation:
                    if (fault.OperationExceptionType != undefined) {
                        var operationException = new Foundation.Exception.OperationException(fault.OperationExceptionType);
                        if (fault.OperationName)
                            operationException.OperationName = fault.OperationName;
                        ex = operationException;
                    }
                    break;
                case Service.Fault.Type.Data:
                    if (fault.DataExceptionType != undefined) {
                        var dataException = new Foundation.Exception.DataException(fault.DataExceptionType);
                        if (fault.DataExceptionType == Foundation.Exception.DataException.Type.DuplicateRecord) {
                            if (fault.KeyName)
                                dataException.KeyName = fault.KeyName;
                            if (fault.KeyValue)
                                dataException.KeyValue = fault.KeyValue;
                        }
                        ex = dataException;
                    }
                    break;
                case Service.Fault.Type.Session:
                    if (fault.SessionExceptionType != undefined) {
                        var sessionException = new Foundation.Exception.SessionException(fault.SessionExceptionType);
                        if (fault.DataExceptionType == Foundation.Exception.SessionException.Type.QuotaExceeded) {
                            if (fault.Quota)
                                sessionException.Quota = fault.Quota;
                            if (fault.QuotaType)
                                sessionException.QuotaType = fault.QuotaType;
                        }
                        ex = sessionException;
                    }
                    break;
                case Service.Fault.Type.Argument:
                    if (fault.ArgumentExceptionType != undefined) {
                        var argumentException = new Foundation.Exception.ArgumentException(fault.ArgumentExceptionType, fault.ParamName);
                        if (fault.ArgumentExceptionType == Foundation.Exception.ArgumentException.Type.Invalid) {
                            if (fault.ParamValue)
                                argumentException.ParamValue = fault.ParamValue;
                        }
                        ex = argumentException;
                    }
                    break;
            }
            if (!ex)
                ex = new Foundation.Exception.UnknownException(fault.UnknownType, fault.Message);
            if (fault.EventLogId)
                ex.EventLogId = fault.EventLogId;
            return ex;
        }
    }
});

Admin.Service = {
    Business: {
        Profile: {
            Edit_Web: function (webSite, suppressNotFound, callback, faultCallback) {
                if (Session.User.Id > 0 && webSite) {
                    var data = {
                        Business: Session.User.Business.Id,
                        WebSite: webSite,
                        User: Session.User.Id
                    };
                    if (suppressNotFound)
                        data.SuppressNotFound = suppressNotFound;
                    Service.Post("/admin/business/profile/Edit_Web", {
                        authorize: true,
                        data: data,
                        callback: function (business) {
                            if (business)
                                business.Updated = Date.Deserialize(business.Updated);
                            callback(business);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            Save: function (admin, business, newImages, callback, faultCallback) {
                //if (user && (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id)) {
                if (Session.User.Id && (business.Id == Session.User.Business.Id
                    || (!business.Id && Session.User.SecurityProfile.CanProduce_Business)
                    || (business.Id && (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id)))
                    && (admin || business.Account.Id == Session.User.Id)) {
                    var business_ = $.extend({}, business);
                    business_.Images = {
                        Entity: business.Images.Entity,
                        Refs: business.Images.Refs.map(function (ir) {
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
                        Deleted: business.Images.Deleted
                    };
                    if (business.Updated)
                        business_.Updated = Date.Serialize(business.Updated);
                    Service.Post("/admin/business/profile/Save", {
                        authorize: true,
                        data: {
                            Business: business_,
                            Images: newImages,
                            Admin: admin ? Session.User.Id : 0
                        },
                        callback: function (business) {
                            business.Timestamp = Date.Deserialize(business.Timestamp);
                            callback(business);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized);
            },

            EditMultiProduct_Web: function (webSite, product, suppressNotFound, callback, faultCallback) {
                if (Session.User.Id > 0 && webSite) {
                    var data = {
                        Business: Session.User.Business.Id,
                        WebSite: webSite,
                        Product: product || 0,
                        Admin: Session.User.Id
                    };
                    if (suppressNotFound)
                        data.SuppressNotFound = suppressNotFound;
                    Service.Post("/admin/business/profile/EditMultiProduct_Web", {
                        authorize: true,
                        data: data,
                        callback: function (product) {
                            if (product && product.Id)
                                product.Updated = Date.Deserialize(product.Updated);
                            callback(product);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            },

            SaveMultiProduct: function (business, product, callback, faultCallback) {
                //if (user && (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id)) {
                if (Session.User.Id && business && (business == Session.User.Business.Id
                    || (!product.Id && Session.User.SecurityProfile.CanProduce_Product)
                    || (product.Id && Session.User.SecurityProfile.CanEdit_All))) {
                    var product_ = $.extend({}, product);
                    if (product.Updated)
                        product_.Updated = Date.Serialize(product.Updated);
                    Service.Post("/admin/business/profile/SaveMultiProduct", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Business: business,
                            Product: product_
                        },
                        callback: function (product) {
                            product.Timestamp = Date.Deserialize(product.Timestamp);
                            callback(product);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized);
            },

            DeleteMultiProduct: function (business, product, callback, faultCallback) {
                if (Session.User.Id && business &&
                    (business == Session.User.Business.Id
                    || Session.User.SecurityProfile.CanEdit_All)) {
                    var product_ = $.extend({}, product);
                    if (product_.Timestamp)
                        product_.Timestamp = Date.Serialize(product.Timestamp);
                    Service.Post("/admin/business/profile/DeleteMultiProduct", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            Business: business,
                            Product: product_
                        },
                        callback: function (product) {
                            callback(product);
                        },
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.Unauthorized);
            }
        }
    },

    Product: {
        Profile: {
            FromTextFeatures: function (textFeatures, webUrl, multiProduct, callback, faultCallback) {
                if (Session.User.Id > 0) {
                    Service.Post("/process/product/FromTextFeatures", {
                        authorize: true,
                        data: {
                            User: Session.User.Id,
                            TextFeatures: textFeatures,
                            WebUrl: webUrl,
                            MultiProduct: multiProduct
                        },
                        callback: callback,
                        faultCallback: faultCallback
                    });
                }
                else
                    throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            }
        }
    }
};

User.Service = {
    Master: {
        Class: {
            GetPath: function (url, id, root, callback, faultCallback) {
                return Service.Get(url + (root ? "&scope=" + JSON.stringify(root) : ''), {
                    callback: function (data) {
                        if (!data || data.length == 0 || data[data.length - 1].Id != id)
                            throw 'Returned sequence does not contain item ' + id;
                        if (root && root.Name) {
                            if (data[0].Id == root.Id)
                                data[0].Name = root.Name;
                            else
                                throw 'Returned sequence does not contain root item';
                        }
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            }
        },

        Category: {
            Get: function (category, callback, faultCallback) {
                var callback, faultCallback;
                if (arguments.length >= 2) {
                    if (typeof arguments[1] == 'number' && typeof arguments[2] == "function") {
                        var type = arguments[1];
                        callback = arguments[2];
                        if (arguments.length == 4)
                            faultCallback = arguments[3];
                        return Service.Get("/master/category/Get_Ref?category=" + category + "&type=" + type, { callback: callback, faultCallback: faultCallback });
                    }
                    else if (typeof arguments[1] == "function") {
                        callback = arguments[1];
                        if (arguments.length == 3)
                            faultCallback = arguments[2];
                        return Service.Get("/master/category/Get?category=" + category, { callback: callback, faultCallback: faultCallback });
                    }
                }
            },

            GetPath: function (category, root, callback, faultCallback) {
                return User.Service.Master.Class.GetPath("/master/category/GetPath?category=" + category, category, root, callback, faultCallback);
            },

            PopulateWithChildren: function (parent, type, callback, faultCallback) {
                var token = this._token;
                return Service.Get("/master/category/PopulateWithChildren?parent=" + parent + "&type=" + type, {
                    callback: function (data) {
                        if (data)
                            Model.Group.Node.Deserialize(data, token ? function (category) {
                                token.CategoryId = category.Id;
                                return Navigation.Main.Href(token); //Or clone
                            } : null, {});
                        callback(data);
                    },
                    faultCallback: faultCallback
                });
            },

            Search: function (parent, name, root, callback, faultCallback) {
                return Service.Get("/master/category/Search?parent=" + parent + "&name=" + name + (root ? "&scope=" + JSON.stringify(root) : ''), {
                    callback: callback,
                    faultCallback: faultCallback
                });
            }
        },

        Location: {
            PopulateWithPath: function (location_) {
                var callback, faultCallback;
                switch (typeof arguments[1]) {
                    case 'function':
                        callback = arguments[1];
                        if (arguments.length == 3)
                            faultCallback = arguments[2];
                        break;
                    case 'undefined':
                        callback = arguments[2];
                        if (arguments.length == 4)
                            faultCallback = arguments[3];
                        break;
                    case 'number':
                        var street = arguments[1];
                        callback = arguments[2];
                        if (arguments.length == 4)
                            faultCallback = arguments[3];
                        return Service.Get("/master/location/PopulateWithPath_Street?city=" + location_ + "&street=" + street, { callback: callback, faultCallback: faultCallback });
                }

                return Service.Get("/master/location/PopulateWithPath?location=" + location_, { callback: callback, faultCallback: faultCallback });
            },

            Resolve: function (city, street, allowCreate, callback, faultCallback) {
                var data = {
                    City: city,
                    AllowCreate: allowCreate
                };
                if (street && street.Name)
                    data.Street = street.Name;

                return Service.Post("/master/location/Resolve", {
                    authorize: true,
                    data: data,
                    callback: callback,
                    /*callback: function (location) {
                        Object.defineProperties(location, {
                            Country: {
                                get: function () {
                                    return Model.Location.get(location, Model.LocationType.Country)
                                }
                            }
                        });
                        callback(location);
                    },*/
                    faultCallback: faultCallback
                });
            }
        }
    }
};