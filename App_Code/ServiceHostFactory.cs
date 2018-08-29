using System;
using System.ServiceModel.Activation;

namespace Service
{
    public class HttpHostFactory : ServiceHostFactory
    {
        public HttpHostFactory()
        {
        }

        protected override System.ServiceModel.ServiceHost CreateServiceHost(Type serviceType, Uri[] baseAddresses)
        {
            var sh = base.CreateServiceHost(serviceType, baseAddresses/*.Where(ba => ba.Scheme == "http" || ba.Scheme == "https").ToArray()*/);
            for(var i = sh.Description.Endpoints.Count - 1; i >= 0; i--)
            {
                switch(sh.Description.Endpoints[i].Binding.Scheme)
                {
                    case "http":
                    case "https":
                        break;
                    default:
                        sh.Description.Endpoints.RemoveAt(i);
                            break;
                }
            }
            return sh;
        }
    }

    public class IpcHostFactory : ServiceHostFactory
    {
        public IpcHostFactory()
        {
        }

        protected override System.ServiceModel.ServiceHost CreateServiceHost(Type serviceType, Uri[] baseAddresses)
        {
            var sh = base.CreateServiceHost(serviceType, baseAddresses/*.Where(ba => ba.Scheme == "net.pipe").ToArray()*/);
            for (var i = sh.Description.Endpoints.Count - 1; i >= 0; i--)
            {
                switch (sh.Description.Endpoints[i].Binding.Scheme)
                {
                    case "net.pipe":
                        break;
                    default:
                        sh.Description.Endpoints.RemoveAt(i);
                        break;
                }
            }
            return sh;
        }
    }
}