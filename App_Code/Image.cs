using System;
using System.IO;
using System.ServiceModel;
using System.ServiceModel.Web;
using Foundation.Service.Behavior;

namespace Service.Interface
{
    [ServiceContract]
    public interface IImage
    {
        [OperationContract, WebGet(UriTemplate = "/get?entity={Entity}&id={Id}&width={Width}&height={Height}", RequestFormat = WebMessageFormat.Json)]
        Stream Get(Model.ImageEntity Entity, long Id, ushort Width, ushort Height);
        //HttpResponseMessage GetImage(string query); 

        [OperationContract, WebGet(UriTemplate = "/pwa?alias={Alias}&size={Size}", RequestFormat = WebMessageFormat.Json)]
        Stream PWA(string Alias, Model.PWA.ImageSize Size);

        [ClientAddress(2)]
        [OperationContract, WebGet(UriTemplate = "/captcha?token={Token}&user={User}&ipAddr={IPAddr}")]
        Stream Captcha(Guid Token, int User, string ipAddr);
    }
}

namespace Service
{
    //http://localhost:8080/image?entity=Product&type=Icon&id=2 to test
    public class Image : Interface.IImage
    {
        public Stream Get(Model.ImageEntity entity, long id, ushort width, ushort height) //HttpResponseMessage
        {
            if (entity > 0 && width > 0)
            {
                //FireFox and Chrome do not set the Referer header for Image controls that uses a Uri Source
                //http://msdn.microsoft.com/en-us/library/system.net.httpwebrequest.headers(VS.95).aspx
                //http://forums.silverlight.net/forums/p/79550/560816.aspx
                //var ctx = WebOperationContext.Current;
                //var referer = ctx.IncomingRequest.Headers[HttpRequestHeader.Referer];
                //var host = ctx.IncomingRequest.Headers[HttpRequestHeader.Host];
                //var index = host.IndexOf(':');
                //if(index > 0)
                //    host = host.Substring(0, index);
                //if (!(String.IsNullOrWhiteSpace(referer) || String.IsNullOrWhiteSpace(host) || referer.IndexOf(host, StringComparison.OrdinalIgnoreCase) < 0))
                //{
                var imageSize = new Model.ImageSize(width, height);
                string imageType;
                var image = global::Data.Image.Get(entity, id, imageSize, out imageType);

                if (image != null && image.Length > 0)
                {
                    //http://msdn.microsoft.com/en-us/library/cc681221.aspx
                    WebOperationContext.Current.OutgoingResponse.ContentType = imageType;

                    //Re-fetching image for background will cause errors on localhost (if Access-Control-Allow-Origin is not set)
                    //business-card.html:206(image.src = this.model.Image.ImageRef;) GET http://localhost:8080/image/get?... net::ERR_FAILED
                    //The FetchEvent for "http://localhost:8080/image/get?..." resulted in a network error response: an "opaque" response was used for a request whose type is not no-cors
                    //if (!string.IsNullOrEmpty(WebOperationContext.Current.IncomingRequest.Headers["Origin"]))
                    //{
                    //http://stackoverflow.com/questions/29387084/get-average-outer-pixel-color-of-image
                    WebOperationContext.Current.OutgoingResponse.Headers.Add("Access-Control-Allow-Origin", "*");
                    //}
                    return new MemoryStream(image/*, false*/);

                    //var response = new HttpResponseMessage();
                    //response.Content = new ByteArrayContent(image);
                    //response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
                    //return response;
                }
                //}
            }

            WebOperationContext.Current.OutgoingResponse.StatusCode = System.Net.HttpStatusCode.Forbidden;
            return null;
        }

        public Stream PWA(string alias, Model.PWA.ImageSize size)
        {
            if (!String.IsNullOrEmpty(alias) && size > 0)
            {
                var image = global::Data.Image.PWA(alias, size);

                if (image != null && image.Content != null && image.Content.Length > 0)
                {
                    //http://msdn.microsoft.com/en-us/library/cc681221.aspx
                    WebOperationContext.Current.OutgoingResponse.ContentType = "image/" + image.ContentType ;
                    return new MemoryStream(image.Content/*, false*/);

                    //var response = new HttpResponseMessage();
                    //response.Content = new ByteArrayContent(image);
                    //response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
                    //return response;
                }
                //}
            }

            WebOperationContext.Current.OutgoingResponse.StatusCode = System.Net.HttpStatusCode.Forbidden;
            return null;
        }


        public Stream Captcha(Guid token, int user, string ipAddr) //HttpResponseMessage
        {
            if (token != Guid.Empty && !string.IsNullOrWhiteSpace(ipAddr))
            {
                var image = global::Data.Image.GetCaptcha(token, user, ipAddr);

                if (image != null && image.Length > 0)
                {
                    //http://msdn.microsoft.com/en-us/library/cc681221.aspx
                    WebOperationContext.Current.OutgoingResponse.ContentType = "image/jpeg";
                    return image;

                    //var response = new HttpResponseMessage();
                    //response.Content = new ByteArrayContent(image);
                    //response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
                    //return response;
                }
                //}
            }

            WebOperationContext.Current.OutgoingResponse.StatusCode = System.Net.HttpStatusCode.Forbidden;
            return null;
        }
    }
}
