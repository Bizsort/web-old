using System;
using System.Web;
using System.Web.WebPages;

namespace Service
{
    enum SessionRequirement : byte
    {
        None = 0,
        Required = 1,
        RequiredNew = 2
    }

    public static class SessionHelper
    {
        //Re: $(window).unload(... Session.Exit ...);
        //Session.Exit does not work well when the page navigated to is retrieved from browser cache (Back, Favorites, etc)
        //It returns success and removes cookie, but new session is not created for the new page as its code behind does not execute
        public static bool Exists(WebPageRenderingBase page, bool app, out bool newSession)
        {
            var sessionToken = Guid.Empty;
            var sessionRequirement = app || (global::Settings.Instance.Session.Handling & global::Model.Session.HandlingType.Strict) > 0 || page.Page.SessionRequired != null ? SessionRequirement.Required : SessionRequirement.None;
            if (page.Page.SessionRequiredNew != null)
                sessionRequirement = SessionRequirement.RequiredNew;

            //http://en.wikipedia.org/wiki/HTTP_cookie
            //A session cookie only lasts for the duration of users using the website. 
            //A web browser normally deletes session cookies when it quits. 
            //A session cookie is created when no Expires directive is provided when the cookie is created.
            //Browsers instances will share session cookie http://blogs.msdn.com/b/ie/archive/2009/05/06/session-cookies-sessionstorage-and-ie8.aspx
            var initCookie = page.Request.Cookies[global::Settings.Instance.Session.InitCookieName];
            var handoffCookie = page.Request.Cookies[global::Settings.Instance.Session.HandoffCookieName];

            //Trying to create a new session on browser refresh http://stackoverflow.com/questions/385367/what-requests-do-browsers-f5-and-ctrl-f5-refreshes-generate
            //Will only work for Ctrl-F5 or Shift-F5 (FF) requests but not plain Refresh/F5 unfortunately
            //Easier solution could be to check somehow if Refresh or X button was clicked and not set session cookie in window.onbeforeunload
            var resetSession = page.Request.Headers["Pragma"] == "no-cache" || page.Request.Headers["Cache-Control"] == "no-cache";

            string domain = page.Request.Url.DnsSafeHost != "localhost" ? String.Format(".{0}", page.Request.Url.DnsSafeHost) : null;

            //Client will try to enter session under following conditions
            //1. Session.HandlingType.Strict mode is on
            //2. Page.SessionRequired or Page.SessionRequiredNew is set
            //3. HandoffCookie with Token is present

            //Handoff cookie exists - check if can keep it
            if (handoffCookie != null)
            {
                var sessionHandoff = new global::Model.Session.Handoff(handoffCookie.Value);
                //Session exists - check if can keep it
                if (Guid.TryParse(sessionHandoff.Token, out sessionToken) && sessionToken != Guid.Empty)
                {
                    if (!(sessionRequirement == SessionRequirement.RequiredNew || resetSession))
                    {
                        //Validate may create new session (if required) and return its token
                        var token = global::Foundation.Session.Manager.Validate(sessionToken, sessionHandoff.User.Id, sessionRequirement != SessionRequirement.None, page.Request.UserHostAddress);
                        if (token != Guid.Empty && token != sessionToken) //Validate created new session - handoffCookie must be deleted (below)
                        {
                            sessionToken = token;
                            resetSession = true;
                        }
                        else if (token == Guid.Empty) //Session is not valid anymore and not required - handoffCookie must be deleted (below)
                        {
                            sessionToken = Guid.Empty;
                            resetSession = true;
                        }
                        //else //Session is valid - don't need to do anything
                    }
                    else //New session is required or page is refreshed
                        sessionToken = Guid.Empty;
                }

                //Handoff cookie is key to session handling and may not stick around
                //New session, page is refresh, session not valid anymore and not required
                if (sessionRequirement == SessionRequirement.RequiredNew || resetSession)
                {
                    //Cookies.Remove method does not seem to delete the cookie
                    if (domain != null)
                        handoffCookie.Domain = domain;
                    handoffCookie.Expires = DateTime.Now.AddDays(-1);
                    page.Response.Cookies.Set(handoffCookie);
                    handoffCookie = null;
                }
            }

            if (sessionRequirement != SessionRequirement.None)
            {
                if (sessionToken == Guid.Empty) //Validate may have returned new token already
                    sessionToken = global::Foundation.Session.Manager.Create(page.Request.UserHostAddress);

                //Foundation.Event.Log.Enqueue(new global::Foundation.Event.Record(global::Settings.LogEventType.Trace, "WebPageBase.SessionExists", String.Format("New session: {0}", sessionToken)));

                if (initCookie == null || !initCookie.HttpOnly || initCookie.Expires != DateTime.MinValue)
                {
                    initCookie = new HttpCookie(global::Settings.Instance.Session.InitCookieName);
                    initCookie.Value = sessionToken.ToString("N");
                    initCookie.HttpOnly = true;
                    initCookie.Path = "/";
                    if (domain != null)
                        initCookie.Domain = domain;
                    //cookie.Expires = DateTime.UtcNow.AddSeconds(global::Settings.Instance.Session.CookieTimeout);
                    page.Response.Cookies.Add(initCookie);
                }
                else
                {
                    initCookie.Value = sessionToken.ToString("N");
                    initCookie.HttpOnly = true;
                    initCookie.Path = "/";
                    if (domain != null)
                        initCookie.Domain = domain;
                    //cookie.Expires = DateTime.UtcNow.AddSeconds(global::Settings.Instance.Session.CookieTimeout);
                    page.Response.Cookies.Set(initCookie);
                }
            }
            else if (initCookie != null) //Delete initCookie if present
            {
                //Cookies.Remove method does not seem to delete the cookie
                if (domain != null)
                    initCookie.Domain = domain;
                initCookie.Expires = DateTime.Now.AddDays(-1);
                page.Response.Cookies.Set(initCookie);
            }

            newSession = sessionRequirement == SessionRequirement.RequiredNew || resetSession;
            return sessionToken != Guid.Empty;
        }
    }
}