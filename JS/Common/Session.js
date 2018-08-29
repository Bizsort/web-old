$.extend(Session, {
    Exit: function (callback) {
        try {
            Service.Post('/master/session/Exit', {
                async: false, //called from window.unload (IE and FF seem fine without it but not Chrome)
                //authorize: true, //Consistent with SL app, which won't send the key
                data: {
                    User: Session.User.Id
                },
                callback: callback
            });
        }
        catch (e) {
            console.error(errorMessage(e));
        }

        Session.Cache.Reset(true);
    },

    Login: function (email, password, callback, faultCallback) {
        if (Session.User.Id == 0) {
            Service.Post('/master/session/UserLogin', {
                secure: true,
                data: {
                    Email: email,
                    Password: password
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

    login: function (loginResponse) {
        if (loginResponse && loginResponse.Status == Model.Session.LoginStatus.Success && loginResponse.User) {
            Session.Cache.Reset();
            Session.Token.Reset(true); //hold on to the forward step
            if (Service.SessionToken != loginResponse.Token)
                Service.SessionToken = loginResponse.Token;
            if (loginResponse.Key && loginResponse.Key.length > 0) {
                Service.Post.Key(Guid.Deserialize(loginResponse.Key));
            }
            else
                throw new Foundation.Exception.SessionException(Foundation.Exception.SessionException.Type.NotAuthenticated);
            Session.User.Enter(loginResponse.User); //May trigger calls to admin endpoints
        }
        else
            Session.User.Exit();

        if (loginResponse && Session.User)
            delete loginResponse.User;
        return loginResponse;
    },

    Remember: function (callback) {
        if (Session.User.Id > 0) {
            Service.Post('/master/session/Remember', {
                authorize: true,
                data: {
                    User: Session.User.Id,
                    Business: Session.User.Business.Id
                },
                callback: callback
            });
        }
        else
            callback();
    },

    User: new Model.Session.User(),

    UserLogin: function (token, callback, faultCallback) {
        if (Session.User.Id == 0) {
            return Service.Post('/master/session/UserLogin_Auto', {
                secure: true,
                data: {
                    Token: token
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
            callback(null);
    }
});