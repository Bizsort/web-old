Service = $.extend(window.Service || {}, {
    Facebook: {
        EnsureInit: function () {
            var initialized = false;
            return function () {
                //FB.init({ apiKey: '48f06bc570aaf9ed454699ec4fe416df' });
                if (!initialized) {
                    FB.init({
                        appId: '1031065080247196',
                        status: false,
                        cookie: true
                        //channelUrl: '/fbChannel' //FB.XD.resolveRelation(...).FB' is null or not an object in IE/localhost:port
                    });
                    initialized = true;
                }
            }
        } (),

        Login: function (callback, faultCallback) {
            if (callback) {
                Service.Facebook.EnsureInit();
                return FB.login(function (response) {
                    if (response.status == "connected" && response.authResponse) {
                        callback({ AccessToken: response.authResponse.accessToken, UserId: response.authResponse.userID, Expires: response.authResponse.expiresIn });
                        /*FB.api('/me', function (apiResponse) {
                            callback({ UserId: loginResponse.authResponse.userID, Name: apiResponse.name, Email: apiResponse.email });
                        });*/
                    } else if (faultCallback) {
                        faultCallback(Resource.Global.SignIn_Facebook_Error);
                    }
                }, { scope: 'email,user_location' });
            }
        },

        LoginStatus: function (callback, faultCallback) {
            if (callback) {
                Service.Facebook.EnsureInit();
                return FB.getLoginStatus(function (response) {
                    if (response.status == "connected" && response.authResponse) {
                        callback({ UserId: response.authResponse.userID, Expires: response.authResponse.expiresIn });
                    } else if (faultCallback) {
                        faultCallback(Resource.Global.SignIn_Facebook_Error);
                    }
                });
            }
        },

        AccountInfo: function (callback, faultCallback) {
            if (callback) {
                Service.Facebook.EnsureInit();
                return FB.api('/me', function (response) {
                    if (response && response.id && response.email) {
                        var accountInfo = { Id: response.id, Email: response.email };
                        if(response.name)
                            accountInfo.Name = response.name;
                        if(response.location && response.location.name)
                            accountInfo.Location = response.location.name;
                        callback(accountInfo);
                    } else if (faultCallback) {
                        faultCallback(Resource.Global.SignIn_Facebook_Error);
                    }
                });
            }
        }
    }
});