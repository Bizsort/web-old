Foundation = jQuery.extend(window.Foundation || {}, {
    RichText: Class.define({
        ctor: function (domHelper) {
            if (!domHelper) {
                domHelper = new (Class.define({
                    blockLevelList: '|body|hr|p|div|h1|h2|h3|h4|h5|h6|address|pre|form|table|tbody|thead|tfoot|th|tr|td|li|ol|ul|blockquote|center|',

                    isInline: function (elm, includeCodeAsBlock) {
                        if (!elm || elm.nodeType !== 1)
                            return true;

                        elm = elm.tagName.toLowerCase();

                        if (elm === 'code')
                            return !includeCodeAsBlock;

                        if (jQuery(elm).css("display").toLowerCase().indexOf("inline") == 0)
                            return true;

                        return this.blockLevelList.indexOf('|' + elm + '|') < 0;
                    }
                }))();
            }
            this.domHelper = domHelper;
        },

        emptyTags: '|img|br|hr|', //'|area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|command|embed|keygen|source|track|wbr|'

        escapeEntites: function (str) {
            var entites = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            };

            return !str ? '' : str.replace(/[&<>"]/g, function (entity) {
                return entites[entity] || entity;
            });
        },

        //Foundation.TextConverter.fromHtml
        textFromHtml: function (str) {
            return str
                .replace(/[\s]+/g, ' '); //remove line breaks and collapse spaces
            //.replace(/[^\S|\u00A0]+/g, ' '); //Not sure what it's supposed to do, \u00A0 is &nbsp;
        },

        FromHtml: function (node, options) {
            var styles = new Foundation.RichText.StyleCollection(options && options.defaultStyles);
            styles.applyAttributes = options && options.styleAttributes || Foundation.RichText.Style.Attributes.Text;
            var context = {
                output: [],
                indent: 0,
                indentStr: '', //'\t'
                text: '',
                styles: styles
            };
            if (options) {
                if (options.url)
                    context.url = options.url;
                if (options.features)
                    context.features = [];
                if (options.images)
                    context.images = [];
                if (options.doc)
                    context.doc = options.doc;
            }

            if (node.length > 0) {
                for (var i = 0, l = node.length; i < l; i++) {
                    if (node[i].nodeType == 1) // element
                        this.copyHtml(context, node[i], styles["default"]);
                    else if (node[i].nodeType == 3) // text
                        this.writeText(context, node[i], styles["default"], 'span');
                }
            }
            else if (node.nodeType == 1)
                this.copyHtml(context, node, styles["default"]);
            else if (node.nodeType == 3) // text
                this.writeText(context, node, styles["default"], 'span');

            if (options.features)
                options.features = context.features;
            if (options.images)
                options.images = context.images;
            options.text = context.text;
            return context.output.join('');
        },

        ToHtml: function (node, options) {
            var styles = new Foundation.RichText.StyleCollection(options && options.defaultStyles);
            styles.applyAttributes = options && options.styleAttributes || Foundation.RichText.Style.Attributes.Text;
            var context = {
                output: [],
                indent: 0,
                indentStr: '', //'\t'
                text: '',
                styles: styles
            };

            if (options.children) {
                var node = node.firstChild;

                while (node) {
                    this.copyHtml(context, node, styles["default"]);
                    node = node.nextSibling;
                }
            }
            else if (node.length > 0) {
                for (var i = 0, l = node.length; i < l; i++) {
                    if (node[i].nodeType == 1)
                        this.copyHtml(context, node[i], styles["default"]);
                }
            }
            else if (node.nodeType == 1)
                this.copyHtml(context, node, styles["default"]);

            options.text = context.text;
            return context.output.join('');
        },

        copyHtml: function (context, node, parentStyle) {
            switch (node.nodeType) {
                case 1: // element
                    // IE comment
                    if (node.nodeName === '!')
                        this.writeComment(context, node);
                    else
                        this.copyHtmlTag(context, node, parentStyle);
                    break;

                case 3: // text
                    this.writeText(context, node, parentStyle, null);
                    break;

                case 4: // cdata section
                    this.writeCData(context, node);
                    break;

                case 8: // comment
                    this.writeComment(context, node);
                    break;

                case 9: // document
                case 11: // document fragment
                    this.copyHtmlDoc(context, node, parentStyle);
                    break;

                    // Ignored types
                case 2: // attribute
                case 5: // entity ref
                case 6: // entity
                case 7: // processing instruction
                case 10: // document type
                case 12: // notation
                    break;
            }
        },

        copyHtmlDoc: function (context, node, parentStyle) {
            var child;

            child = node.firstChild;

            while (child) {
                this.copyHtml(context, child, parentStyle);
                child = child.nextSibling;
            }
        },

        copyHtmlTag: function (context, node, parentStyle) {
            var attributes = [],
                tagName = node.nodeName.toLowerCase(),
                tag = {
                    name: tagName
                },
                selfClosing = !node.firstChild && this.emptyTags.indexOf('|' + tagName + '|') > -1,
                suppress = false, imgSrc, imgPos;

            if (!parentStyle)
                throw 'Base style not set';
            //else if (/pre(?:\-wrap)?$/i.test($(node).css('whiteSpace'))) // pre || pre-wrap with any vendor prefix
            //    parentStyle.Pre(true);

            var $node = jQuery(node);
            if ($node.is(":hidden")) //|| $node.css("display") == "none"
                return; //skip entire element

            var style;
            //Tag and style substitutions, sanitizing
            switch (tag.name) {
                case "h1":
                case "h2":
                case "h3":
                    tagName = 'p';
                    if (context.styles && context.styles[tagName]) {
                        style = new Foundation.RichText.Style(node, context.styles[tagName], context);
                    }
                    break;
                case 'div':
                    tagName = 'p';
                    break;
                case "script":
                case "object":
                case "embed":
                case "link":
                    //case "form": //process form tag as could wrap content
                case "input": //skip form elements though
                case "select":
                case "button":
                    return; //skip entire element
            }

            if (!style) {
                if (parentStyle.CarryOn === true) {
                    style = parentStyle;
                    style.FromInlineStyle(node, node.getAttribute("style"), context);
                }
                else
                    style = new Foundation.RichText.Style(node, parentStyle, context); //will also parse style attribute
            }

            if (context.doc && context.doc.height && context.doc.width) {
                var dim = style.Dimension();
                if ((dim.top + dim.height) < 0 || dim.top > context.doc.height || (dim.left +dim.width) < 0 || dim.left > context.doc.width)
                {
                    if(window.console) {
                        console.log('Element is off-screen (top:' + dim.top + ', left:' + dim.left + ', width:' + dim.width + 'height: ' + dim.height +')');
                        console.log($node.html());
                    }
                    return; //skip entire element
                }
            }

            if(context.images && tag.name != "img") {
                imgSrc = style.Background_Image();
                if (imgSrc) { //Preserve casing as some web-servers might be case sensitite
                    imgSrc = absoluteUrl(imgSrc, context.url);
                    this.imagesAdd(context, imgSrc, node);
                }
            }

            switch (tag.name) {
                case "span":
                case 'font':
                    suppress = this.canCarryOnStyle(node, style);
                    if (!(suppress || tagName == 'span'))
                        tagName = 'span';
                    break;
                case "b":
                case "strong":
                    style.Bold(true);
                    suppress = this.canCarryOnStyle(node, style);
                    if (!suppress)
                        tagName = 'span';
                    break;
                case "em":
                case "italic":
                    style.Italic(true);
                    suppress = this.canCarryOnStyle(node, style);
                    if (!suppress)
                        tagName = 'span';
                    break;
                case "u":
                case "underline":
                    style.Underline(true);
                    suppress = this.canCarryOnStyle(node, style);
                    if (!suppress)
                        tagName = 'span';
                    break;
            }

            context.featureContext = this.setFeatureContext(node, tag, context, style);

            switch (tagName) {
                //supported tags: p(h1-3, div), span, ul, a, img, li, br
                case "p":
                case "span":
                case "ul":
                    break;
                case "a":
                    var href = node.getAttribute("href");
                    if (href) {
                        href = absoluteUrl(href, context.url);
                        attributes.push({ name: "href", value: href });
                        if (href[0] != '/')
                            attributes.push({ name: "target", value: "_blank" });
                        this.hyperlinkFeature(context, href);
                    }
                    else
                        suppress = true;
                    break;
                case "img":
                    imgSrc = node.getAttribute("src");
                    if (imgSrc) { //Preserve casing as some web-servers might be case sensitite
                        imgSrc = absoluteUrl(imgSrc, context.url);
                        attributes.push({ name: "src", value: imgSrc });
                        this.imageFeature(context, imgSrc);
                        this.imagesAdd(context, imgSrc, node);
                    }
                    else
                        suppress = true;
                    break;
                case "li":
                    if (context.featureContext.textType == Foundation.RichText.TextBlock.Type.List)
                        context.featureContext.startNewLine = true;
                    break;
                case "br":
                    context.featureContext.startNewLine = true;
                    break;
                //other tags are suppressed
                default:
                    suppress = true; //proceed to parsing children (if any)
                    break;
            }

            if (!suppress)
                this.writeStartElement(context, {
                    name: tagName,
                    attributes: attributes,
                    selfClosing: selfClosing
                }, style);

            var child = node.firstChild;
            while (child) {
                context.indent++;

                this.copyHtml(context, child, style);
                child = child.nextSibling;

                context.indent--;
            }

            if (!(suppress || selfClosing))
                this.writeEndElement(context, tagName);

            if (tag.wrapFeature) { //New Feature was started
                if ((context.featureContext.text || context.featureContext.links || context.featureContext.images))
                    context.featureContext.startNewFeature = true;
                else
                    context.featureContext.textType = Foundation.RichText.TextBlock.Type.Unknown;
            }
        },

        setFeatureContext: function (node, tag, context, style) {
            var featureContext = context.featureContext || {
                textType: Foundation.RichText.TextBlock.Type.Unknown
            };

            if (context.features) {
                if (!this.domHelper.isInline(node) || featureContext.startNewFeature)
                    featureContext = this.ensureFeature.call(featureContext, Foundation.RichText.TextBlock.textType(tag.name), tag, style);
                else {
                    if (!featureContext.text)
                        featureContext.font = style.Font_Feature();
                }

                //Wrap newly created block elements at the root (suppressing nested lists and elements)
                if ((!(featureContext.text || featureContext.links || featureContext.images)) && (!context.featureContext || featureContext != context.featureContext.textType || featureContext != context.featureContext.textType) && tag)
                    tag.wrapFeature = true;
            }

            return featureContext;
        },

        //FeatureContext.ensureFeature
        ensureFeature: function (textType, tag, style) {
            var fc = this;
            var tt = this.textType;
            if (this.startNewFeature ||
                ((this.text || this.images || (this.links && this.links.length > 1)) && //Continue feature if it's got a single link - it might be wrapping a text block or an image
                //Keep the list going
                    !(this.textType == Foundation.RichText.TextBlock.Type.List || (tag && tag.name == 'li')))) {
                fc = {
                    textType: textType,
                    font: style.Font_Feature(),
                    dim: style.Dimension_Feature()
                };
                if (this.startNewFeature)
                    delete this.startNewFeature;
                if (this.startNewLine)
                    delete this.startNewLine;
            }
            else if (!fc.text) {
                if (this.textType != textType && textType != Foundation.RichText.TextBlock.Type.Unknown)
                    fc.textType = textType;
                this.font = style.Font_Feature();
                this.dim = style.Dimension_Feature();
            }

            //Moved to setFeatureContext
            //Wrap newly created block elements at the root (suppressing nested lists and elements)
            /*if ((!(fc.text || fc.links || fc.images)) && (fc != this || tt != fc.textType) && tag)
                tag.wrapFeature = true;*/

            return fc;
        },

        hyperlinkFeature: function (context, href) {
            if (context.featureContext && href) {
                this.appendFeature(context);
                if (!context.featureContext.links)
                    context.featureContext.links = [];
                context.featureContext.links.push(href);
            }
        },

        imageFeature: function (context, img) {
            if(!context || !img) return;
            if (context.featureContext) {
                var imageFeature;
                if (context.features && context.features.length) {
                    imageFeature = context.features[context.features.length - 1];
                    if (!imageFeature.images || imageFeature.text ||
                        context.featureContext.text || context.featureContext.links || context.featureContext.images)
                        imageFeature = null;
                }
                if (!imageFeature) {
                    this.appendFeature(context);
                }
                else //Continue image list
                    context.featureContext = imageFeature;
                if (!context.featureContext.images)
                    context.featureContext.images = [];
                context.featureContext.images.push(img);
            }
        },

        imagesAdd: function (context, imgSrc, node) {
            //Image is a url from the same web-site
            var hostIdx = context.url ? imgSrc.indexOf(context.url.hostname) : 0;
            if (context.images && imgSrc.indexOf("http") == 0 && hostIdx >= 0 && hostIdx <= 25) { //Ignore external links that reference the domain
                var imgPos = jQuery(node).offset();
                context.images.push({ 
                    src: imgSrc,
                    top: parseInt(imgPos.top),
                    left: parseInt(imgPos.left)
                });
            }
        },

        //Extract.appendText
        textFeature: function (context, text) {
            if (context.featureContext && text) {
                this.appendFeature(context);
                var index = 0, featureText;
                if (!context.featureContext.text || !context.featureContext.text.length) {
                    featureText = '';
                    context.featureContext.text = [featureText];
                }
                else {
                    index = context.featureContext.text.length - 1;
                    featureText = context.featureContext.text[index];
                }

                if (context.featureContext.startNewLine && featureText.length) {
                    featureText = '';
                    context.featureContext.text.push(featureText);
                    index++;
                    delete context.featureContext.startNewLine;
                }

                if (featureText.length && featureText[featureText - 1] != ' ')
                    featureText += ' ';
                featureText += text;
                context.featureContext.text[index] = featureText;
            }
        },

        appendFeature: function (context) {
            if (context.features && !(context.featureContext.text || context.featureContext.links || context.featureContext.images)) {
                context.features.push(context.featureContext);
            }
        },

        writeText: function (context, node, style, wrapElem) {
            var text = node.nodeValue;

            if (!style.Pre())
                text = this.textFromHtml(text).trim();

            if (text) {
                wrapElem = style.CarryOn === true ? 'span' : wrapElem;
                if (wrapElem)
                    this.writeStartElement(context, {
                        name: wrapElem
                    }, style);

                this.write(context, this.escapeEntites(text));
                if (context.text.length && context.text[context.text - 1] != ' ')
                    context.text += ' ';
                context.text += text;

                if (context.featureContext.startNewFeature)
                    context.featureContext = this.ensureFeature.call(context.featureContext, Foundation.RichText.TextBlock.Type.Unknown, null, new Foundation.RichText.Style(node, style, context));
                this.textFeature(context, text);

                if (wrapElem)
                    this.writeEndElement(context, wrapElem);
            }
        },

        writeStartElement: function (context, tag, style) {
            this.write(context, '<' + tag.name);
            var inlineStyle = (style instanceof Foundation.RichText.Style ? style.ToHtmlInlineStyle(context.styles.applyAttributes/*, Foundation.RichText.Style.Attributes.Text*/) : typeof style === "string" ? style : null);
            if (!String.isNullOrWhiteSpace(inlineStyle))
                this.writeAttribute(context, 'style', inlineStyle);

            if (tag.attributes && tag.attributes.length) {
                var i = tag.attributes.length,
                    attr;
                while (i--) {
                    attr = tag.attributes[i];
                    this.writeAttribute(context, attr.name, attr.value);
                }
            }

            this.write(context, tag.selfClosing ? ' />' : '>', false);
        },

        writeAttribute: function (context, name, value) {
            this.write(context, " " + name.toLowerCase() + '="' + this.escapeEntites(value) + '"', false);
        },

        writeEndElement: function (context, tag) {
            this.write(context, '</' + tag + '>');
        },

        write: function (context, str, suppressFeatures) {
            var i = context.indent;

            if (context.indentStr) {
                // Don't add a new line if it's the first element
                if (context.output.length)
                    context.output.push('\n');

                while (i--)
                    context.output.push(context.indentStr);
            }

            context.output.push(str);
        },

        writeCData: function (context, node) {
            this.write(context, '<![CDATA[' + this.escapeEntites(node.nodeValue) + ']]>');
        },

        writeComment: function (context, node) {
            this.write(context, '<!-- ' + this.escapeEntites(node.nodeValue) + ' -->');
        },

        canCarryOnStyle: function (node, style) {
            //http://stackoverflow.com/questions/10381296/best-way-to-get-child-nodes
            if (!isEmpty(style._attributes)) {
                if (node.childNodes && node.childNodes.length) {
                    if (node.childNodes.length > 1) {
                        var child = node.childNodes.firstChild;
                        while (child) {
                            if (!(child.nodeType == 3 || (child.nodeType == 1 && child.nodeName.toLowerCase() == 'br'))) //text or br
                                return false;
                            child = child.nextSibling;
                        }
                    }
                    style.CarryOn = true;
                    return true;
                }
                else
                    return false;
            }
            else
                return true;
        }
    })
});

Foundation.RichText.FontStyle = {
    Families: ["Arial", "Courier New", "Georgia", "Tahoma", "Times New Roman", "Verdana", "Wingdings"],
    DefaultFamily: "Verdana",
    XSizes: [1, 2, 3, 4, 5, 6, 7],
    DefaultSize: 13,
    Colors: ["#000000", "#0000FF", "#00FFFF", "#A9A9A9", "#808080", "#008000", "#D3D3D3", "#FF00FF", "#FFA500", "#800080", "#FF0000", "#FFFF00"],
    DefaultColor: "#000000"
};

Foundation.RichText.TextBlock = {
    Type: {
        Unknown: 'Unknown',
        Header: 'Header',
        Paragraph: 'Paragraph',
        List: 'List'
    },

    textType: function (tag) {
        if ((tag.length == 2 && tag.charAt(0) == 'h'))
            return Foundation.RichText.TextBlock.Type.Header;
        if (tag == 'p')
            return Foundation.RichText.TextBlock.Type.Paragraph;
        else if (tag == 'ul')
            return Foundation.RichText.TextBlock.Type.List;
        else
            return Foundation.RichText.TextBlock.Type.Unknown;
    }
};

Foundation.RichText.Style = Class.define({
    attr: function (name, value) {
        if (value === undefined) {
            var suppressTraverse = arguments.length >= 3 ? arguments[2] : false;
            value = this._attributes[name]
            if (value === undefined) {
                if (!this._parent || suppressTraverse) {
                    switch (name) {
                        case Foundation.RichText.Style.Name.Font_Family:
                            return Foundation.RichText.FontStyle.DefaultFamily;
                        case Foundation.RichText.Style.Name.Font_Size:
                            return Foundation.RichText.FontStyle.DefaultSize;
                        case Foundation.RichText.Style.Name.Font_Color:
                            return Foundation.RichText.FontStyle.DefaultColor;
                        case Foundation.RichText.Style.Name.Bold:
                            return false;
                        case Foundation.RichText.Style.Name.Italic:
                            return false;
                        case Foundation.RichText.Style.Name.Underline:
                            return false;
                        case Foundation.RichText.Style.Name.TextAlign:
                            return Foundation.RichText.Style.TextAlignment.Left;
                        case Foundation.RichText.Style.Name.Elem:
                            return '';
                        case Foundation.RichText.Style.Name.Background_Image:
                            return '';
                        case Foundation.RichText.Style.Name.Dimension:
                            return {
                                top: 0,
                                left: 0,
                                width: 0,
                                height: 0
                            };
                    }
                }
                else
                    return this._parent.attr(name);
            }
            else
                return value;
        }
        else {
            var forceDefault = arguments.length >= 3 ? arguments[2] : false;
            var defaultValue = this._parent ? this._parent.attr(name) : this.attr(name);
            if (this._attributes[name] !== undefined) {
                if (value !== defaultValue)
                    this._attributes[name] = value;
                else
                    delete this._attributes[name];
            }
            else if (forceDefault === true || value !== defaultValue)
                this._attributes[name] = value;
        }
    },

    Font_Feature: function () {
        return {
            family: this.Font_Family(),
            size: this.Font_Size(),
            color: this.Font_Color()
        };
    },

    Dimension_Feature: function () {
        return this.Dimension();
    },

    Font_Family: function (fontFamily, forceDefault) {
        return this.attr(Foundation.RichText.Style.Name.Font_Family, fontFamily, forceDefault);
    },

    Font_Size: function (fontSize, forceDefault) {
        return this.attr(Foundation.RichText.Style.Name.Font_Size, fontSize, forceDefault);
    },

    Font_Color: function (fontColor) {
        return this.attr(Foundation.RichText.Style.Name.Font_Color, fontColor);
    },

    Bold: function (bold) {
        return this.attr(Foundation.RichText.Style.Name.Bold, bold);
    },

    Italic: function (italic) {
        return this.attr(Foundation.RichText.Style.Name.Italic, italic);
    },

    Underline: function (underline) {
        return this.attr(Foundation.RichText.Style.Name.Underline, underline);
    },

    TextAlign: function (textAlign) {
        return this.attr(Foundation.RichText.Style.Name.TextAlign, textAlign);
    },

    Elem: function (elem) {
        return this.attr(Foundation.RichText.Style.Name.Elem, elem);
    },

    List: function () {
        return this.attr(Foundation.RichText.Style.Name.Elem) == 'ul' ? true : false;
    },

    Pre: function (pre) {
        if (pre == undefined)
            return this.attr(Foundation.RichText.Style.Name.Elem) == 'pre' ? true : false;
        else if (pre === true)
            this.attr(Foundation.RichText.Style.Name.Elem, 'pre');
        else
            throw String.format('Arg must be true or null, {0} is unexpected', typeof pre);
    },

    Background_Image: function (backgroundImage) {
        //suppressTraverse on get, no forceDefault on set
        return this.attr(Foundation.RichText.Style.Name.Background_Image, backgroundImage, backgroundImage === undefined ? true : undefined);
    },

    Dimension: function (dimension) {
        //suppressTraverse on get, no forceDefault on set
        return this.attr(Foundation.RichText.Style.Name.Dimension, dimension, dimension === undefined ? true : undefined);
    },

    ctor: function (node, parentStyle, context) {
        var inlineStyle, attr;

        if (node) {
            if (node.nodeType == 3) // text
                node = node.parentNode;

            if (node.getAttribute)
                inlineStyle = node.getAttribute("style");
        }

        this._attributes = {};
        //this._inherits = [];

        if (parentStyle) {
            this._parent = parentStyle;
            /*for (var a in parentStyle._attributes) {
                this._attributes[a] = parentStyle._attributes[a];
                this._inherits.push(parseInt(a));
            }*/
        }

        if (node || inlineStyle) {
            this.FromInlineStyle(node, inlineStyle, context);

            if (parentStyle) {
                //this._inherits.length = 0;
                for (var a in parentStyle._attributes) {
                    attr = this._attributes[a];
                    if (attr !== undefined && parentStyle._attributes[a] === attr) {
                        //this._inherits.push(parseInt(a));
                        delete this._attributes[a];
                    }
                }
            };
        }

        if(node)
        {
            node = jQuery(node);
            var nodePos = node.offset();
            this.Dimension({
                top: parseInt(nodePos.top),
                left: parseInt(nodePos.left),
                width: parseInt(node.width()),
                height: parseInt(node.height())
            });
        }
    },

    FromInlineStyle: function (node, inlineStyle, context) {
        var cssProps = node ? jQuery(node).css([
            "font-family", "font-size", "color", "background-image"
        ]) : {};
        var attributes = [], attrName, attrValue;
        if (!String.isNullOrWhiteSpace(inlineStyle)) {
            inlineStyle = inlineStyle.split(';');
            for (var i = 0, l = inlineStyle.length; i < l; i++) {
                var attr = inlineStyle[i].trim().toLowerCase().split(':');

                if (attr.length > 1) {
                    attrName = attr[0].trim();
                    attrValue = ('' + cssProps[attrName]).trim();
                    if (!attrValue)
                        attrValue = attr[1].trim();
                    if (attrValue) {
                        attributes.push({ Key: attrName, Value: attrValue });
                        if (cssProps[attrName])
                            delete cssProps[attrName];
                    }
                }
            }
        }
        for (var c in cssProps) {
            attributes.push({ Key: c, Value: ('' + cssProps[c]).trim().toLowerCase() });
        }

        this.FromHtml(attributes, context);
    },

    FromHtml: function (attributes, context) {
        var i = attributes.length,
                attr, value, index;

        while (i--) {
            attr = attributes[i];
            switch (attr.Key) {
                case "id":
                    this.ID = attr.Value;
                    break;
                case "font-family":
                case "face": //XHTML
                    index = attr.Value.indexOf(',');
                    if (index)
                        attr.Value = attr.Value.slice(0, index);
                    this.Font_Family(attr.Value);
                    break;
                    //http://websemantics.co.uk/resources/font_size_conversion_chart/
                case "size": //XHTML
                    var value = parseInt(attr.Value);
                    if (isNaN(value))
                        value = Foundation.RichText.FontStyle.DefaultSize;
                    else if (value <= 1)
                        this.Font_Size(10.0);
                    else if (value <= 2)
                        this.Font_Size(13.0);
                    else if (value <= 3)
                        this.Font_Size(16.0);
                    else if (value <= 4)
                        this.Font_Size(18.0);
                    else if (value <= 5)
                        this.Font_Size(24.0);
                    else if (value <= 6)
                        this.Font_Size(32.0);
                    else
                        this.Font_Size(36.0);
                    this.Font_Size(Foundation.RichText.FontStyle.DefaultSize);
                    break;
                case "font-size":
                    var value = parseInt(attr.Value.replace("px", ""));
                    if (isNaN(value))
                        value = Foundation.RichText.FontStyle.DefaultSize;
                    this.Font_Size(value);
                    break;
                case "color":
                    if (attr.Value.indexOf('rgb') >= 0)
                        attr.Value = this.rgb2hex(attr.Value);
                    this.Font_Color(attr.Value);
                    break;
                case "font-style":
                    switch (attr.Value) {
                        case "italic":
                            this.Italic(true);
                            break;
                        default:
                            this.Italic(false);
                            break;
                    }
                    break;
                case "font-weight":
                    switch (attr.Value) {
                        case "bold":
                            this.Bold(true);
                            break;
                        default:
                            this.Bold(false);
                            break;
                    }
                    break;
                case "text-decoration":
                    switch (attr.Value) {
                        case "underline":
                            this.Underline(true);
                            break;
                        case "line-through":
                        default:
                            this.Underline(false);
                            break;
                    }
                    break;
                case "text-align":
                case "align": //XHTML
                    //http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
                    if (attr.Value.length) {
                        var textAlign = attr.Value.charAt(0).toUpperCase() + attr.Value.substr(1);
                        this.TextAlign(Foundation.RichText.Style.TextAlignment[textAlign]);
                    }
                    break;
                case "background":
                    break;
                    //case "vertical-align":
                    //    switch (attr.Value.ToLower())
                    //    {
                    //        case "super":
                    //        case "sub":
                    //            break;
                    //        default:
                    //            VerticalAlignment = (VerticalAlignment)Enum.Parse(typeof(VerticalAlignment), Regex.Replace(attr.Value, "middle", "Center", RegexOptions.IgnoreCase), true);
                    //            break;
                    //    }
                    //    break;
                case "background-image":
                    var imgSrc = attr.Value;
                    if (imgSrc && imgSrc != 'none') {
                        //http://stackoverflow.com/questions/8809876/can-i-get-divs-background-image-url
                        imgSrc = imgSrc.replace(RegEx_Patterns.Background_Image.match, RegEx_Patterns.Background_Image.replace);
                        if(context && context.url)
                            imgSrc = absoluteUrl(imgSrc, context.url);
                        this.Background_Image(imgSrc);
                    }
                    break;
            }
        }
    },

    ToHtmlInlineStyle: function (apply/*, inherit*/) {
        var attributes = [];

        for (var a in this._attributes) {
            /*var skip = false;
            for (var i = 0, l = this._inherits.length; i < l; i++) {
                if ((this._inherits[i] & inherit) > 0) {
                    skip = true;
                    break;
                }
            }
            if(!skip)*/
            switch (parseInt(a)) {
                case Foundation.RichText.Style.Name.Font_Family:
                    if ((apply & Foundation.RichText.Style.Attributes.Font_Family) > 0)
                        attributes.push('font-family:' + this.Font_Family());
                    break;
                case Foundation.RichText.Style.Name.Font_Size:
                    if ((apply & Foundation.RichText.Style.Attributes.Font_Size) > 0)
                        attributes.push('font-size:' + Math.round(this.Font_Size()) + 'px');
                    break;
                case Foundation.RichText.Style.Name.Font_Color:
                    var fontColor = this.Font_Color();
                    if ((apply & Foundation.RichText.Style.Attributes.Font_Color) > 0 && fontColor && fontColor != Foundation.RichText.FontStyle.DefaultColor)
                        attributes.push('color:' + fontColor);
                    break;
                case Foundation.RichText.Style.Name.Bold:
                    if ((apply & Foundation.RichText.Style.Attributes.Bold) > 0 && this.Bold())
                        attributes.push('font-weight:bold');
                    break;
                case Foundation.RichText.Style.Name.Italic:
                    if ((apply & Foundation.RichText.Style.Attributes.Italic) > 0 && this.Italic())
                        attributes.push('font-style:italic');
                    break;
                case Foundation.RichText.Style.Name.Underline:
                    if ((apply & Foundation.RichText.Style.Attributes.Underline) > 0 && this.Underline())
                        attributes.push('text-decoration:underline');
                    break;
                case Foundation.RichText.Style.Name.TextAlign:
                    var textAlign = this.TextAlign();
                    if ((apply & Foundation.RichText.Style.Attributes.TextAlign) > 0 && textAlign != Foundation.RichText.Style.TextAlignment.Left) {
                        switch (textAlign) {
                            case Foundation.RichText.Style.TextAlignment.Center:
                                textAlign = 'center';
                                break;
                            case Foundation.RichText.Style.TextAlignment.Right:
                                textAlign = 'right';
                                break;
                            default:
                                textAlign = null;
                                break;
                        }
                        if (textAlign)
                            attributes.push('text-align:' + textAlign);
                    }
                    break;
            }
        }
        return attributes.join(';');
    },

    //http://wowmotty.blogspot.ca/2009/06/convert-jquery-rgb-output-to-hex-color.html
    //http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    rgb2hex: function (rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        return "#" +
         ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
         ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
         ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2);
    }
});

Foundation.RichText.Style.Name = {
    Font_Family: 1,
    Font_Size: 2,
    Font_Color: 4,
    Bold: 8,
    Italic: 16,
    Underline: 32,
    TextAlign: 64,
    Elem: 128,
    Background_Image: 256,
    Dimension: 512
};

Foundation.RichText.Style.Attributes = {
    None: 0,
    Font_Family: 1,
    Font_Size: 2,
    Font_Color: 4,
    Bold: 8,
    Italic: 16,
    Underline: 32,
    TextAlign: 64,
    Font: 7,
    Text: 4095
};
Foundation.RichText.Style.Attributes.External = Foundation.RichText.Style.Attributes.Bold + Foundation.RichText.Style.Attributes.Italic + Foundation.RichText.Style.Attributes.Underline;

Foundation.RichText.Style.TextAlignment = {
    Center: 0,
    Left: 1,
    Right: 2,
    Justify: 3
};

Foundation.RichText.Style.Id = {
    Default: 1,
    H1: 2,
    H2: 4,
    H3: 8,
    All: 255
};

Foundation.RichText.StyleCollection = Class.define({
    ctor: function (defaultStyles) {
        if (typeof (defaultStyles) == 'undefined')
            defaultStyles = Foundation.RichText.Style.Id.All;

        var style = new Foundation.RichText.Style();
        style.ID = "default";
        if ((defaultStyles & Foundation.RichText.Style.Id.Default) > 0) {
            style.Font_Family(Foundation.RichText.FontStyle.DefaultFamily, true);
            style.Font_Size(Foundation.RichText.FontStyle.DefaultSize, true);
        }
        this[style.ID] = style;

        if ((defaultStyles & Foundation.RichText.Style.Id.H1) > 0) {
            style = new Foundation.RichText.Style();
            style.ID = "h1";
            style.Font_Family("Arial");
            style.Font_Size(24);
            style.Bold(true);
            this[style.ID] = style;
        }

        if ((defaultStyles & Foundation.RichText.Style.Id.H2) > 0) {
            style = new Foundation.RichText.Style();
            style.ID = "h2";
            style.Font_Family("Arial");
            style.Font_Size(16);
            style.Bold(true);
            this[style.ID] = style;
        }

        if ((defaultStyles & Foundation.RichText.Style.Id.H3) > 0) {
            style = new Foundation.RichText.Style();
            style.ID = "h3";
            style.Font_Family("Arial");
            style.Font_Size(14);
            style.Bold(true);
            this[style.ID] = style;
        }
    }
});

//http://aknosis.com/2011/07/17/using-jquery-to-rewrite-relative-urls-to-absolute-urls-revisited
//http://stackoverflow.com/questions/7544550/javascript-regex-to-change-all-relative-urls-to-absolute
//Suceeded by System.Url.toAbsolute
absoluteUrl = function (url, baseUrl) {
    if (url && baseUrl) {
        if (/^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(url))
            return url;
        else if (url.substr(0, 1) !== '/') {
            url = (baseUrl.pathname || '') + url;
        }
        return (baseUrl.origin || '') + url;
    }
    return url;
};

//Suceeded by System.Url.windowLocation
function windowLocation() {
    http://bl.ocks.org/abernier/3070589
    var l = {
        origin: window.location.origin.toLowerCase(),
        hostname: window.location.hostname.toLowerCase(),
        pathname: window.location.pathname.toLowerCase().substr(0, window.location.pathname.lastIndexOf('/') + 1)
    };
    return l;
};

//http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }

    return true;
};