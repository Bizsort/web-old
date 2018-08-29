using System;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Hosting;
using System.Web.Routing;
using System.Web.WebPages;

public class AliasRoute : RouteBase
{
    protected ConcurrentDictionary<string, bool> _existingPages;
    VirtualPathProvider _virtualPathProvider;
    internal VirtualPathProvider VirtualPathProvider
    {
        get { return _virtualPathProvider ?? HostingEnvironment.VirtualPathProvider; }
    }

    IRouteHandler _routeHandler;
    public AliasRoute(string url, IRouteHandler routeHandler) : base() 
    {
        _existingPages = new ConcurrentDictionary<string, bool>();
        _routeHandler = routeHandler;
    }

    public override RouteData GetRouteData(HttpContextBase httpContext)
    {
        var virtualPath = httpContext.Request.AppRelativeCurrentExecutionFilePath + httpContext.Request.PathInfo;
        var requestPath = virtualPath.Substring(2); // Parse incoming URL (we trim off the first two chars since they're always "~/")

        if (requestPath.Length == 0)
            return null;

        bool existingPage;
        if (!(requestPath.EndsWith(".static") || _existingPages.TryGetValue(requestPath, out existingPage)))
        {
            existingPage = VirtualPathProvider.FileExists(virtualPath + ".cshtml") ||
                           VirtualPathProvider.DirectoryExists(virtualPath);
            _existingPages.TryAdd(requestPath, existingPage);
        }
        else
            existingPage = false;

        if (!existingPage)
            return new RouteData(this, _routeHandler);
        else //Return null for existing page
            return null; 
    }

    public override VirtualPathData GetVirtualPath(RequestContext requestContext, RouteValueDictionary values)
    {
        throw new NotImplementedException();
    }
}

public class AliasRouteHandler : IRouteHandler
{
    public virtual IHttpHandler GetHttpHandler(RequestContext requestContext)
    {
        var httpContext = requestContext.HttpContext;

        // Parse incoming URL (we trim off the first two chars since they're always "~/")
        string requestPath = httpContext.Request.AppRelativeCurrentExecutionFilePath.Substring(2) + httpContext.Request.PathInfo;

        if (requestPath.EndsWith(".static"))
            return new global::SEOUtils.HtmlSnapshotHttpHandler();

        /*if (Regex.IsMatch(requestPath, global::Settings.Instance.WebSite.PageAlias.Regex))
        {
            var pageToken = global::Service.Data2.Client.PageToken(requestPath);
            if (!(pageToken == null || pageToken.Page == null || pageToken.Token == null))
            {
                //HttpUtility.UrlEncode uses '+' instead of '%20' for spaces in strings
                string query = Uri.EscapeDataString(pageToken.Token);
                requestContext.HttpContext.Response.Redirect(String.Format("{0}?{1}={2}", pageToken.Page, global::Settings.Instance.WebSite.NavToken.QueryParamName, query));
                return null;
            }
        }*/

        return WebPageHttpHandler.CreateFromVirtualPath(String.Format("~{0}.cshtml", global::Settings.Instance.WebSite.HomePage.ToLower()));
    }
}