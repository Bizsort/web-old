Service = $.extend(window.Service || {}, {
    Geocoder: {
        CitySource: {
            Locality: 1,
            PostalTown: 2,
            SubLocality: 3
        },

        Stringify: function (address, exceptAddress1) {
            var parts = [];
            if (!$.isEmptyObject(address)) {
                if (address.StreetName) {
                    if (address.StreetNumber) {
                        if (address.Address1 && !exceptAddress1) {
                            if (address.Address1.length <= Settings.Location.Address1Threshold)
                                parts.push(address.StreetNumber + ' ' + address.StreetName + ' ' + address.Address1);
                            else 
                                parts.push(address.Address1 + ' ' + address.StreetNumber + ' ' + address.StreetName);
                        }
                        else
                            parts.push(address.StreetNumber + ' ' + address.StreetName);
                    }
                    else {
                        if (address.Address1 && !exceptAddress1)
                            parts.push(address.Address1);
                        parts.push(address.StreetName);
                    }
                }
                if (address.City) {
                    parts.push(address.City);
                }
                if (address.State) {
                    if (address.County)
                        parts.push(address.County);
                    if (address.PostalCode)
                        parts.push(address.State + ' ' + address.PostalCode);
                    else
                        parts.push(address.State);
                }
                else if (address.County) {
                    if (address.PostalCode)
                        parts.push(address.County + ' ' + address.PostalCode);
                    else
                        parts.push(address.County);
                }
                else if (address.PostalCode)
                    parts.push(address.PostalCode);
                if (address.Country)
                    parts.push(address.Country);
            }

            if (parts.length > 1) {
                address = parts[0];
                for (var i = 1; i < parts.length; i++)
                    address += ', ' + parts[i];
            }
            else if (parts.length == 1)
                address = parts[0];
            else
                address = null;

            return address;
        },

        Parse: function(gData) {
            var output = {};
            var address = {};
            if (gData.formatted_address) {
                output.Text = gData.formatted_address;
            }
            if (gData.address_components) {
                var type, name, citySource = 0;
                for (var i = 0; i < gData.address_components.length; i++) {
                    if (gData.address_components[i].types) {
                        type = null;
                        name = 'long_name';
                        for (var j = 0; j < gData.address_components[i].types.length; j++) {
                            switch (gData.address_components[i].types[j]) {
                                case 'country':
                                    type = 'Country';
                                    break;
                                case 'administrative_area_level_1':
                                    type = 'State';
                                    break;
                                case 'administrative_area_level_2':
                                    type = 'County';
                                    break;
                                    //When postal_town is present and it differs from locality it carries more significance
                                    //2 Lower Castle Street, Old Market, Bristol BS1 3AD, United Kingdom
                                    //81 School Lane, Hartford, Northwich CW8 1PW, United Kingdom
                                    //34 Saturday Market, Beverley HU17 8BE, United Kingdom
                                case 'postal_town':
                                    if (address.City)
                                        address.Address1 = address.City
                                    type = 'City';
                                    citySource = Service.Geocoder.CitySource.PostalTown;
                                    break;
                                case 'locality':
                                    if (!address.City || citySource == Service.Geocoder.CitySource.SubLocality) {
                                        if (!address.Address1 && address.City)
                                            address.Address1 = address.City
                                        type = 'City';
                                        citySource = Service.Geocoder.CitySource.Locality;
                                    }
                                    else
                                        type = 'Address1';
                                    break;
                                    //10 Stardust Drive, Dorchester, ON N0L 1G5, Canada
                                case 'sublocality':
                                    if (!address.City) {
                                        type = 'City';
                                        citySource = Service.Geocoder.CitySource.SubLocality;
                                    }
                                    else
                                        type = 'Address1';
                                    break;
                                case 'street_number':
                                    type = 'StreetNumber';
                                    break;
                                case 'route':
                                    type = 'StreetName';
                                    name = 'short_name';
                                    break;
                                case 'postal_code':
                                    type = 'PostalCode';
                                    break;
                                default:
                                    type = null;
                                    break;
                            }
                            if (type)
                                address[type] = gData.address_components[i][name];
                        }
                    }
                }
                if (address.Address1 && address.Address1 == address.City)
                    delete address.Address1;
                if (!$.isEmptyObject(address))
                    output.Address = address;
            }

            if (gData.geometry) {
                output.Geolocation = { Lat: gData.geometry.location.lat(), Lng: gData.geometry.location.lng() };
                output.geometry = gData.geometry;
            }

            return output;
        },

        //https://developers.google.com/maps/documentation/geocoding/
        Geocode: function (address, callback, faultCallback) {
            if (address && !String.isNullOrWhiteSpace(address)) {
                var geocoder = new google.maps.Geocoder();

                geocoder.geocode({ 'address': address }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        callback(Service.Geocoder.Parse(results[0]));
                    }
                    else if (faultCallback) {
                        faultCallback(status);
                    }
                });
            }
        }
    }
});