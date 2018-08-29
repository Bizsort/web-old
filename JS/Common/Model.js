Model = {
    AccountType: {
        Business: 1,
        Personal: 2
    },

    Address: {
        Requirement: {
            None: 0,
            Country: 1,
            City: 2,
            PostalCode: 3,
            StreetAddress: 4
        }
    },

    Business: {
        ProductsView: {
            NoProducts: 0,
            Multiproduct: 1,
            ProductList: 2,
            ProductCatalog: 3
        },

        Category: {
            NotInCatalog: 0,
            AllCategories: -1
        },

        Option: {
            Flags: {
                Default: 0,
                Use_Catalog: 1,
                Publish_Email: 2
            },

            Set: {
                Deserialize: function (options) {
                    if ((options.Value & Model.Business.Option.Flags.Use_Catalog) > 0)
                        options.Use_Catalog = true;
                    if ((options.Value & Model.Business.Option.Flags.Publish_Email) > 0)
                        options.Publish_Email = true;
                    delete options.Value;
                }
            }
        }
    },

    EntityValidation: {
        DataErrorInfo: Class.define({
            ctor: function (master) {
                this._master = master;
                this._errors = [];
                this.HasErrors = false;
            },

            SetError: function (field, error, suppress) {
                this._errors[field] = error;
                this.HasErrors = true;
                if (!suppress) {
                    if (field.length > 0) {
                        //Validation and custom messages
                        //http://blogs.teamb.com/craigstuntz/2009/01/15/37923/
                        //http://stackoverflow.com/questions/976384/jquery-validator-addmethod-custom-message
                        /*if (this._master.$validator) {
                            var errors = {};
                            errors[field] = error;
                            this._master.$validator.settings.messages[field] = error;
                            this._master.$validator.showErrors(errors);
                        }*/
                        this._master.$validator.showError(field, error);
                    }
                    else if (this._master.$errorContainer)
                        this._master.$errorContainer.text(error).show();
                }
            },

            Clear: function () {
                this._errors = [];
                if (this._master.$validator)
                    this._master.$validator.reset(); //resetForm
                if (this._master.$errorContainer)
                    this._master.$errorContainer.empty().hide();
                this.HasErrors = false;
            }
        })
    },

    Geocoder: {
        Address: {
            Deserialize: function (address) {
                if (address.Properties) {
                    for (var propName in address.Properties) {
                        address[propName] = address.Properties[propName];
                    };
                    delete address.Properties;
                }
            },

            EqualsTo: function (address) {
                if (!address ||
                    this.Country != address.Country ||
                    //Geocoder does not seem to populate State for UK address
                    (this.State != address.State && this.State && String.isNullOrWhiteSpace(this.County)) ||
                    this.County != address.County ||
                    this.City != address.City ||
                    this.StreetName != address.StreetName)
                    return false;
                else
                    return true;
            }
        }
    },

    Group: {
        DisplayType: {
            Name: 0,
            Text: 1,
            Path: 2
        },

        NodeType: {
            Super: 1,
            Class: 2
        },

        Node: {
            Deserialize: function (node, navToken, dic) {
                var parent = node.Parent;
                if (parent && parent.$ref)
                    node.Parent = dic[parent.$ref];
                if (node.Children) {
                    dic[node.$id] = node;
                    for (var i = 0; i < node.Children.length; i++) {
                        this.Deserialize(node.Children[i], navToken, dic);
                    }
                }
                if (navToken)
                    node.NavToken = navToken(node);
            },

            DeserializeChildren: function (nodes, navToken, parent) {
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (parent)
                        this.setParent(nodes[i], parent.Id, parent);
                    if (nodes[i].HasChildren) {
                        if (nodes[i].Children) {
                            this.DeserializeChildren(nodes[i].Children, navToken, this);
                        }
                        else
                            nodes[i].Children = [{ Id: 0, Name: "...", HasChildren: false }];
                    }
                    if (navToken)
                        nodes[i].NavToken = navToken(nodes[i]);
                }
            },

            SetParent: function (folders, parentId, parent) {
                for (var i = 0, l = folders.length; i < l; i++) {
                    this.setParent(folders[i], parentId, parent);
                }
            },

            setParent: function (folder, parentId, parent) {
                if (!folder.ParentId)
                    folder.ParentId = parentId;
                else if (folder.ParentId != parentId)
                    throw 'Parent folder mismatch: ' + folder.ParentId + '!=' + parentId;
                if (parentId && parent && !folder.Parent) //It's important to keep .ContainerX props
                    folder.Parent = parent;
            },

            IsRootFolder: function (folder) {
                return folder && folder.Id == 0 ? true : false;
            }
        },

        IsLocked: function () {
            return (this.NodeType & Model.Group.NodeType.Class) == 0;
        }
    },

    ImageEntity: {
        Business: 1,
        Product: 2,
        Service: 3,
        BusinessPromotion: 4,
        Community: 5,
        CommunityTopic: 6,
        Person: 7
    },

    ImageSizeType: {
        Null: 0,
        Thumbnail: 1,
        XtraSmall: 2,
        Small: 3,
        MediumSmall: 4,
        Medium: 5
    },

    Location: {
        Country: function () {
            return Model.Location.get(this, Model.LocationType.Country)
        },

        get: function (location, type) {
            while (location) {
                if (location.Type == type)
                    break;
                else
                    location = location.Parent;
            }
            return location;
        }
    },

    LocationType: {
        Unknown: 0,
        Country: 1,
        State: 2,
        County: 4,
        City: 8,
        Street: 16,
        Area: 32
    },

    LocationSettings: {
        ValidateEmail: function (email, element) {
            if (!String.isNullOrWhiteSpace(email)) {
                if (this.$validationItems.LocationSettings && this.$validationItems.LocationSettings.EmailValid) {
                    var regEx = new RegExp(this.$validationItems.LocationSettings.EmailValid);
                    return regEx.test(email);
                }
                else
                    return true;
            }
            else
                return false;
        },

        ValidatePhone: function (phone, element) {
            if (!String.isNullOrWhiteSpace(phone)) {
                if (this.$validationItems.LocationSettings && this.$validationItems.LocationSettings.PhoneValid) {
                    var regEx = new RegExp(this.$validationItems.LocationSettings.PhoneValid);
                    if (!regEx.test(phone)) {
                        var errorMessage = String.format(Resource.Global.Editor_Error_Enter_X_Valid, Resource.Dictionary.Phone);
                        if(this.$validationItems.LocationSettings2 && this.$validationItems.LocationSettings2.HasMask("Phone"))
                            errorMessage += (" (" + String.format(Resource.Global.Editor_Error_Value_X_Not_Valid, phone) + ")");
                        return errorMessage;
                    }
                }
            }
            return true;
        }
    },

    Product: {
        Stats: (function () {
            var ctor = function (totalQuota, activeQuota, pendingQuota) {
                this.Total = 0;
                this.TotalQuota = totalQuota;
                this.Active = 0;
                this.ActiveQuota = activeQuota;
                this.Pending = 0;
                this.PendingQuota = pendingQuota;
                this.Inactive = 0;
            };
            $.extend(ctor.prototype, {
                CanList: function () {
                    return (this.Total < this.TotalQuota && this.Active < this.ActiveQuota && this.Pending < this.PendingQuota ? true : false);
                },
                Refresh: function (count) {
                    this.Pending = count.Pending;
                    this.Active = count.Active;
                    this.Inactive = count.Inactive;
                    this.Total = count.Total;
                },
                Test: function() {
                    var quota = -1;
                    var quotaType;
                    if (this.Total >= this.TotalQuota)
                    {
                        quota = this.TotalQuota;
                        quotaType = "Total";
                    }
                    else if (this.Active >= this.ActiveQuota)
                    {
                        quota = this.ActiveQuota;
                        quotaType = "Active";
                    }
                    else if (this.Pending >= this.PendingQuota)
                    {
                        quota = this.PendingQuota;
                        quotaType = "Pending";
                    }
                    if (quota >= 0)
                    {
                        throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.QuotaExceeded, function (ex) {
                            ex["Quota"] = quota;
                            if(quotaType)
                                ex["QuotaType"] = quotaType;
                        });
                    }
                }
            });
            return ctor;
        })()
    },

    SecurityProfile: {
        Type: {
            Low: 1,
            Medium: 2,
            High: 3,
            Affiliate: 4,
            Staff: 5
        }
    },

    Session: {
        AutoLoginType: {
            None: 0,
            AdScrl: 1,
            Facebook: 2
        },

        LoginStatus: {
            Success: 1,
            AccountLocked: 2
        },

        PostType: {
            None: 0,
            NoAccount: 1,
            Personal: 2,
            Business: 4
            //Either: 7
        },

        Profile: Class.extend({
            ctor: function () {
                this.Id = 0;
                this.resetProductStats();
            },

            Exit: function () {
                this.Id = 0;
                delete this.Name;
                delete this.Address;
                this.resetProductStats();
            },

            resetProductStats: function () {
                this.ProductStats = new Model.Product.Stats(Settings.Product.Quota.Personal.Total, Settings.Product.Quota.Personal.Active, Settings.Product.Quota.Personal.Pending);
            }
        }),

        SecurityProfile: (function () {
            var ctor = function () {
                this.Reset();
            };
            $.extend(ctor.prototype, {
                Initialize: function (securityProfile) {
                    this.Type = securityProfile.Type;
                    this.AutoPost = securityProfile.AutoPost;
                    this.CanRelease_Peer = securityProfile.CanRelease_Peer;
                    this.CanSuspend = securityProfile.CanSuspend;
                    this.CanReview_Staff = securityProfile.CanReview_Staff;
                    this.CanEdit_All = securityProfile.CanEdit_All;
                    this.CanProduce_Business = securityProfile.CanProduce_Business;
                    this.CanProduce_Product = securityProfile.CanProduce_Product;
                    this.CanManage_OffensiveList = securityProfile.CanManage_OffensiveList;
                    this.CanManage_Categories = securityProfile.CanManage_Categories;
                    this.CanManage_Locations = securityProfile.CanManage_Locations;
                    this.CanManage_BusinessImport = securityProfile.CanManage_BusinessImport;
                    this.CanManage_ProductImport = securityProfile.CanManage_ProductImport;
                },

                Reset: function () {
                    this.Type = 0;
                    this.AutoPost = false;
                    this.CanRelease_Peer = false;
                    this.CanSuspend = false;
                    this.CanReview_Staff = false;
                    this.CanEdit_All = false;
                    this.CanProduce_Business = false;
                    this.CanProduce_Product = false;
                    this.CanManage_OffensiveList = false;
                    this.CanManage_Categories = false;
                    this.CanManage_Locations = false;
                    this.CanManage_BusinessImport = false;
                    this.CanManage_ProductImport = false;
                }
            });
            return ctor;
        })()
    },

    SubType: {
        None: 0,
        Siblings: 1,
        Children: 2,
        GrandChildren: 4
    },

    Thumbnail: {
        GetImageRef: function (entity, id, size) {
            size = size || Settings.Image.Thumbnail;
            return Settings.Image.Url + '/get?entity=' + entity + '&id=' + id + '&width=' + size.Width + (size.Height ? '&height=' + size.Height : '');
        },

        setImageRef: function (imageSize) {
            if (this.MaxImageSize)
                this.HasImage = true;
            if (this.HasImage)
            {
                if (this.ImageId > 0)
                    this.ImageRef = Model.Thumbnail.GetImageRef(this.Entity, this.ImageId, imageSize || this.ImageSize);
                else
                    throw new ArgumentException("ImageId is required");
            }
            else
                this.ImageRef = Model.Thumbnail.GetImageRef(this.Entity, this.ImageId || 0, imageSize || this.ImageSize);
        }
    }
};

$.extend(Model.Session, {
    Business: Model.Session.Profile.extend({
        //ctor: function () {
        //    Model.Session.Profile.prototype.ctor.call(this);
        //},

        Enter: function (business) {
            this.Id = business.Id;
            this.Name = business.Name;
            if (business.Address)
                this.Address = business.Address;
            this.ProductsView = business.ProductsView;
            this.IsOwner = business.IsOwner;
        },

        Exit: function () {
            Model.Session.Profile.prototype.Exit.call(this);
            this.ProductsView = Model.Business.ProductsView.ProductList;
            delete this.IsOwner;
        },

        resetProductStats: function () {
            this.ProductStats = new Model.Product.Stats(Settings.Product.Quota.Business.Total, Settings.Product.Quota.Business.Active, Settings.Product.Quota.Business.Pending);
        }
    }),

    User: Model.Session.Profile.extend({
        ctor: function () {
            Model.Session.Profile.prototype.ctor.call(this);
            this.Business = new Model.Session.Business();
            this.SecurityProfile = new Model.Session.SecurityProfile();
            this.InviteCount = -1;
            this.MessageCount = -1;

            this.LocationId = Settings.Location.Country;
            this.CategoryId = 0;

            this.SignInChanged = EventDelegate();
        },

        Enter: function (user) {
            if (user.LocationId)
                this.LocationId = user.LocationId;
            if (user.CategoryId)
                this.CategoryId = user.CategoryId;
            if (user.SuppressGuidelines)
                this.SuppressGuidelines = true;

            if (user.Id) {
                this.GuestId = 0;
                this.Id = user.Id;
                this.Name = user.Name;
                if (user.Address)
                    this.Address = user.Address;
                this.Business.Enter(user.Business);
                this.SecurityProfile.Initialize(user.SecurityProfile);
                this.InviteCount = user.InviteCount;
                this.MessageCount = user.MessageCount;

                if (this.SignInChanged)
                    this.SignInChanged();
            }
        },

        Exit: function () {
            Model.Session.Profile.prototype.Exit.call(this);

            this.Business.Exit();
            this.SecurityProfile.Reset();
            this.InviteCount = -1;
            this.MessageCount = -1;

            if (this.SignInChanged)
                this.SignInChanged();
        },

        CanPost: function () {
            var type = Model.Session.PostType.None;
            if (this.Id > 0) {
                if (this.Business.Id > 0 && this.Business.ProductStats.CanList)
                    type = type |= Model.Session.PostType.Business;
                if (this.ProductStats.CanList)
                    type = type |= Model.Session.PostType.Personal;
            }
            else
                type |= Model.Session.PostType.NoAccount;
            return type;
        }
    })
});

Admin = {
    Model: {
        Business: {
            Profile: Class.extend({
                ctor: function (newRecord) {
                    this.Id = 0;
                    this.Account = { //new Admin.Model.Personal.Product.Account()
                        Id: 0,
                        Type: Model.AccountType.Personal
                    }
                    this.Category = 0;
                    this.Address = {
                        Location: 0
                    };
                    this.Images = {
                        Entity: Model.ImageEntity.Business,
                        Refs: [],
                        Deleted: []
                    };
                    this.Options = {
                        Value: Model.Business.Option.Flags.Default
                    };
                }
            })
        },

        Product: {
            Profile: Class.extend({
                ctor: function (account, newRecord) {
                    this.Id = 0;
                    this.Account = account;
                    this.Master = {
                        Id: 0,
                        Category: 0
                    };
                    this.Price = {
                        /*Type: 0,
                        Value: 0*/
                    };
                    //this.Attributes = new Admin.Model.Product.Attributes();
                    this.Address = {
                        Location: 0
                    };
                    this.Images = {
                        Entity: Model.ImageEntity.Product,
                        Refs: [],
                        Deleted: []
                    };
                    this.Status = 0;
                    this.PendingStatus = 0;
                }
            })
        }
    }
};

Admin.Model.Business.Product = {
    Profile: Admin.Model.Product.Profile.extend({
        ctor: function (newRecord) {
            Admin.Model.Product.Profile.prototype.ctor.call(this, {
                Id: 0,
                Type: Model.AccountType.Business
            }, newRecord);
        }
    })
};