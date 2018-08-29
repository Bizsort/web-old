if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {
        log: function () { },
        error: function (msg) { /*alert(msg);*/ }
    }
};

System.Features = {
    Accessor_property: true
};

System.Type.CreateInstance = function (type) {
    var parentNs = window;
    var nsParts = type.split('.');

    for (var i = 0, l = nsParts.length; i < l; i++) {
        var nsPart = nsParts[i];
        var type = parentNs[nsPart];
        if (type)
            parentNs = type;
        else
            break;
    }

    if (type && typeof type === 'function')
        return new type();
    else
        throw String.format('Type {0} is invalid', type);
};

Array.prototype.any = function (predicate) {
    for (var i = 0, l = this.length; i < l; i++) {
        if (predicate(this[i])) {
            return true;
        }
    }
    return false;
};

Array.prototype.singleOrDefault = function (predicate) {
    for (var i = 0, l = this.length; i < l; i++) {
        if (predicate(this[i])) {
            return this[i];
        }
    }
};

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (item, start) {
        if (typeof (item) === "undefined") return -1;
        var length = this.length;
        if (length !== 0) {
            // Coerce into number ("1a" will become NaN, which is consistent with the built-in behavior of similar Array methods)
            start = start - 0;
            if (isNaN(start)) {
                start = 0;
            }
            else {
                // If start is positive or negative infinity, don't try to truncate it.
                // The infinite values will be handled correctly by the subsequent code.
                if (isFinite(start)) {
                    // This is faster than doing Math.floor or Math.ceil
                    start = start - (start % 1);
                }
                // Negative start indices start from the end
                if (start < 0) {
                    start = Math.max(0, length + start);
                }
            }

            // A do/while loop seems to have equal performance to a for loop in this scenario
            for (var i = start; i < length; i++) {
                if (this[i] === item) {
                    return i;
                }
            }
        }
        return -1;
    };
};

resizeable = function ($container, options) {
    var minHeight, maxHeight, minWidth, maxWidth, mouseMoveFunc, mouseUpFunc,
        $grip = $('<div class="resize-grip" />').css('zIndex', options.zIndex + 2),
        //cover the control so document still gets mouse move events
        $cover = $('<div class="resize-cover" />').css({ 'zIndex': options.zIndex + 3, opacity: 0.3 }),
        startX = 0,
        startY = 0,
        startWidth = 0,
        startHeight = 0,
        origWidth = $container.width(),
        origHeight = $container.height(),
        dragging = false,
        rtl = false;

    var w = $(window);
    var appWidth = w.width();
    var appHeight = w.height();

    minHeight = options.resizeMinHeight || origHeight / 1.5;
    maxHeight = options.resizeMaxHeight || appHeight - 100; //origHeight * 2.5;
    minWidth = options.resizeMinWidth || origWidth / 1.25;
    maxWidth = options.resizeMaxWidth || appWidth - 100; //origWidth * 1.25;

    var dimensions = dimensions || function (width, height) {
        // set undefined width/height to boolean false
        width = (!width && width !== 0) ? false : width;
        height = (!height && height !== 0) ? false : height;

        if (width === false && height === false)
            return { width: $container.width(), height: $container.height() };

        if (width !== false) {
            $container.width(width);
        }

        if (height !== false) {
            $container.height(height);
        }

        $container.trigger($.Event('resize'));
    };

    mouseMoveFunc = function (e) {
        // iOS must use window.event
        if (e.type === 'touchmove')
            e = window.event;

        var newHeight = startHeight + (e.pageY - startY),
            newWidth = rtl ? startWidth - (e.pageX - startX) : startWidth + (e.pageX - startX);

        if (maxWidth > 0 && newWidth > maxWidth)
            newWidth = maxWidth;

        if (maxHeight > 0 && newHeight > maxHeight)
            newHeight = maxHeight;

        if (!options.resizeWidth || newWidth < minWidth || (maxWidth > 0 && newWidth > maxWidth))
            newWidth = false;

        if (!options.resizeHeight || newHeight < minHeight || (maxHeight > 0 && newHeight > maxHeight))
            newHeight = false;

        if (newWidth || newHeight) {
            dimensions(newWidth, newHeight);

            // The resize cover will not fill the container in IE6 unless a height is specified.
            //if ($.ie < 7)
            //    $container.height(newHeight);
        }

        e.preventDefault();
    };

    mouseUpFunc = function (e) {
        if (!dragging)
            return;

        dragging = false;

        $cover.hide();
        $container.removeClass('resizing')/*.height('auto')*/;
        $(document).unbind('touchmove mousemove', mouseMoveFunc);
        $(document).unbind('touchend mouseup', mouseUpFunc);

        e.preventDefault();
    };

    $container.css('position', 'relative');
    $container.append($grip);
    $container.append($cover.hide());

    $grip.bind('touchstart mousedown', function (e) {
        // iOS must use window.event
        if (e.type === 'touchstart')
            e = window.event;

        startX = e.pageX;
        startY = e.pageY;
        startWidth = $container.width();
        startHeight = $container.height();
        dragging = true;

        $container.addClass('resizing');
        $cover.show();
        $(document).bind('touchmove mousemove', mouseMoveFunc);
        $(document).bind('touchend mouseup', mouseUpFunc);

        // The resize cover will not fill the container in IE6 unless a height is specified.
        //if ($.ie < 7)
        //    $container.height(startHeight);

        e.preventDefault();
    });
};

//http://stackoverflow.com/questions/2831529/having-trouble-using-jquery-to-set-meta-tag-values
function setOrCreateMetaTag(metaName, name, value) {
    var t = 'meta[' + metaName + '=' + name + ']';
    var mt = $(t);
    if (mt.length === 0) {
        t = '<meta ' + metaName + '="' + name + '" />';
        mt = $(t).appendTo('head');
    }
    mt.attr('content', value);
}

metaKeywords = function (keywords) {
    setOrCreateMetaTag("name", "keywords", keywords);
};

metaDescription = function (description) {
    setOrCreateMetaTag("name", "description", description);
};

canonicalLink = function (href) {
    setLinkTag("canonical", href);
}

function setLinkTag(rel, href) {
    var link = document.head.querySelector('link[rel="' + rel + '"]');
    if (!link && href) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
    }
    else if (!href)
        return;
    link.href = href;
    return link;
}

/*System.BitConverter = function () {
};

System.BitConverter.getBytes = function (value, byteSize) {
    if (typeof (value) !== "number")
        throw "value is not a number";

    var bytes = new Array(byteSize);
    for (var i = 0; i < byteSize; i++) {
        bytes[i] = value & 0xff;
        value = value >> 8;
    }
    return bytes;
};

System.BitConverter.ToInt = function (value, startIndex, byteSize) {
    var mask = (1 << 8) - 1;
    var array = Array();
    var v, m;
    for (var i = 0; i < byteSize; i++) {
        var bi = (i - i % byteSize) / byteSize;
        v = value[startIndex + i] & mask;
        m = ((i % byteSize) * 8);
        array[bi] |= v << m;
    }
    return array[0];
};

System.Type.RegisterNamespace('System.Text.Encoding.Unicode');

System.Text.Encoding.Unicode.getBytes = function (s) {
    var bytes = new Array();
    var c = new Number;
    for (var i = 0, l = s.length; i < l; i++) {
        c = s.charCodeAt(i);
        // Reduce to 16 bytes.
        if (c > 0xFFFF) {
            bytes.push(0xDC00 | c & 0x3FF);
            bytes.push(0xD7C0 + (c >> 10));
        } else {
            bytes.push(c & 0xFF);
            bytes.push(c >> 8);
        }
    }
    return bytes;
};

System.Text.Encoding.Unicode.getString = function (bytes, startIndex, byteCount) {
    var s = new String;
    var b = new Number;
    var b1 = new Number;
    var b2 = new Number;
    for (var i = 0; i < byteCount; i++) {
        b1 = bytes[startIndex + i]; i++;
        b2 = bytes[startIndex + i];
        s += String.fromCharCode((b2 << 8) | b1);
        //x1 = (b1 <= 0xF ? "0" : "") + b1.toString(16);
        //x2 = (b2 <= 0xF ? "0" : "") + b2.toString(16);
        //s += unescape("%u"+x2+x1);
    }
    return s;
};

System.Type.RegisterNamespace("System.Convert");

System.Convert.Base64Array = function () {
    this.S = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    this.CA = new Array();
    this.IA = new Array();
    this.InitializeClass = function () {
        var c = new String;
        for (var i = 0; i < this.S.length; i++) {
            c = this.S.charAt(i);
            this.CA[i] = c;
            this.IA[c] = i;
        }
    }
    this.InitializeClass();
};

System.Convert.toBase64String = function (b) {
    /// <summary>
    /// Converts the value of an array of 8-bit unsigned integers to its equivalent
    /// System.String representation encoded with base 64 digits.
    /// </summary>
    /// <remarks>
    /// A very fast and memory efficient class to encode and decode to and from BASE64
    /// in full accordance with RFC 2045. Based on http://migbase64.sourceforge.net/
    /// Converted to JavaScript by Evaldas Jocys http://www.jocys.com
    /// </remarks>
    var B64 = new System.Convert.Base64Array();
    // Check special case
    var bLen = (b) ? b.length : 0;
    if (bLen == 0) return new Array(0);
    // Length of even 24-bits.
    var eLen = Math.floor(bLen / 3) * 3;
    // Returned character count.
    var cCnt = ((bLen - 1) / 3 + 1) << 2;
    var dLen = cCnt; // Length of returned array
    var dArr = new Array(dLen);
    // Encode even 24-bits.
    for (var s = 0, d = 0, cc = 0; s < eLen;) {
        // Copy next three bytes into lower 24 bits of int, paying attension to sign.
        var i = (b[s++] & 0xff) << 16 | (b[s++] & 0xff) << 8 | (b[s++] & 0xff);
        // Encode the int into four chars.
        dArr[d++] = B64.CA[(i >>> 18) & 0x3f];
        dArr[d++] = B64.CA[(i >>> 12) & 0x3f];
        dArr[d++] = B64.CA[(i >>> 6) & 0x3f];
        dArr[d++] = B64.CA[i & 0x3f];
    }
    // Pad and encode last bits if source isn't even 24 bits.
    var left = bLen - eLen; // 0 - 2.
    if (left > 0) {
        // Prepare the int.
        var j = ((b[eLen] & 0xff) << 10) | (left == 2 ? ((b[bLen - 1] & 0xff) << 2) : 0);
        // Set last four chars.
        dArr[dLen - 4] = B64.CA[j >> 12];
        dArr[dLen - 3] = B64.CA[(j >>> 6) & 0x3f];
        dArr[dLen - 2] = (left == 2) ? B64.CA[j & 0x3f] : '=';
        dArr[dLen - 1] = '=';
    }
    return dArr.join("");
};

System.Convert.fromBase64String = function (s, fix) {
    /// <summary>
    /// Converts the specified System.String, which encodes binary data as base 64
    /// digits, to an equivalent 8-bit unsigned integer array.
    /// </summary>
    /// <remarks>
    /// A very fast and memory efficient class to encode and decode to and from BASE64
    /// in full accordance with RFC 2045. Based on http://migbase64.sourceforge.net/
    /// Converted to JavaScript by Evaldas Jocys http://www.jocys.com
    /// </remarks>
    var B64 = new System.Convert.Base64Array();
    var sLen = s.length;
    if (sLen == 0) return new Array(0);
    // Start and end index after trimming.
    var sIx = 0, eIx = sLen - 1;
    // Get the padding count (=) (0, 1 or 2).
    var pad = s.charAt(eIx) == '=' ? (s.charAt(eIx - 1) == '=' ? 2 : 1) : 0;  // Count '=' at end.
    // Content count including possible separators.
    var cCnt = eIx - sIx + 1;
    var sepLn = (s.charAt(76) == '\r') ? (cCnt / 78) : 0;
    var sepCnt = sLen > 76 ? (sepLn << 1) : 0;
    // The number of decoded bytes.
    var len = ((cCnt - sepCnt) * 6 >> 3) - pad;
    // Preallocate byte[] of exact length.
    var bytes = new Array(len);
    // Decode all but the last 0 - 2 bytes.
    var d = 0;
    var eLen = Math.floor(len / 3) * 3;
    var i;
    for (var cc = 0; d < eLen;) {
        // Assemble three bytes into an var from four "valid" characters.
        i = B64.IA[s.charAt(sIx++)] << 18 |
			B64.IA[s.charAt(sIx++)] << 12 |
			B64.IA[s.charAt(sIx++)] << 6 |
			B64.IA[s.charAt(sIx++)];
        // Add the bytes
        bytes[d++] = (i >> 16);
        bytes[d++] = ((i & 0xFFFF) >> 8);
        bytes[d++] = (i & 0xFF);
        // If line separator, jump over it.
        if (sepCnt > 0 && ++cc == 19) {
            sIx += 2;
            cc = 0;
        }
    }
    if (d < len) {
        // Decode last 1-3 bytes (incl '=') into 1-3 bytes.
        i = 0;
        for (var j = 0; sIx <= (eIx - pad) ; j++) {
            i |= B64.IA[s.charAt(sIx++)] << (18 - j * 6);
        }
        for (var r = 16; d < len; r -= 8) {
            var cropBits = Math.pow(2, r + 8) - 1;
            bytes[d++] = ((i & cropBits) >> r);
        }
    }
    return bytes;
};*/