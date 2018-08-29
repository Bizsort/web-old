Foundation.Controls.Layout.ItemSelector = Foundation.Controls.Layout.ItemsControl.extend({
    SelectedIndex: function (selectedIndex) {
        if (selectedIndex != undefined) {
            if (selectedIndex >= 0 && this._selectedIndex != selectedIndex && this.Items.length > selectedIndex) {
                var item = this.Items[selectedIndex];
                if (item) {
                    this.SelectedItem(item, selectedIndex);
                }
                else
                    this._selectedIndex = -1;
            }
            else if (this._selectedIndex != -1) {
                this._selectedIndex = -1;
                var oldValue = this._selectedItem;
                this._selectedItem = undefined;
                this.SelectItem(oldValue, this._selectedItem);
            }
        }
        else
            return typeof this._selectedIndex != 'undefined' ? this._selectedIndex : -1;
    },

    SelectedItem: function (selectedItem, selectedIndex) {
        if (selectedItem != undefined) {
            var index = selectedIndex >= 0 ? selectedIndex : this.indexFromContainer(this.containerFromItem(selectedItem));
            if (index != -1) {
                var oldValue = this._selectedItem;
                this._selectedItem = selectedItem;
                this._selectedIndex = selectedIndex;
                this.SelectItem(oldValue, selectedItem);
            }
            else
                this._selectedIndex = -1;
        }
        else
            return this._selectedItem;
    },

    SelectItem: function (oldValue, newValue) {
        var container;
        if (oldValue) {
            container = this.containerFromItem(oldValue);
            if (container.Selected)
                container.Selected(false);
            else
                container.removeClass('selected');
        }
        if (newValue) {
            container = this.containerFromItem(newValue);
            if (container.Selected)
                container.Selected(true);
            else
                container.addClass('selected');
        }
    }
});

/*Foundation.Controls.Layout.Shadow = {
    Drop: function (element, color, size) {
        var offset = element.offset();
        var height = element.outerHeight();
        var width = element.outerWidth();
        var zIndex = element.css('zIndex');
        var shadows = new Array();
        for (var i = size; i > 0; i--) {
            var div = document.createElement('div');
            //var style = div.style;
            //style.position = 'absolute';
            //style.left = (offset.left + i) + 'px';
            //style.top = (offset.top + i) + 'px';
            //style.width = width + 'px';
            //style.height = height + 'px';
            //style.zIndex = zIndex - i;
            //style.backgroundColor = color;
            var opacity = 1 - i / (i + 1);
            //style.filter = 'alpha(opacity=' + (100 * opacity) + ')';
            $(div).css({
                'position': 'absolute',
                'left': (offset.left + i) + 'px',
                'top': (offset.top + i) + 'px',
                'width': width + 'px',
                'height': height + 'px',
                'zIndex': zIndex - i,
                'background-color': color,
                'filter': 'alpha(opacity=' + (100 * opacity) + ')'
            });
            element[0].insertAdjacentElement('afterEnd', div);
            shadows.push(div);
        }
        element.data('shadows', shadows);
    },

    Move: function (element) {
        var shadows = element.data('shadows');
        var height = element.outerHeight();
        var width = element.outerWidth();
        if (shadows) {
            var offset = element.offset();
            for (var i = 0, l = shadows.length; i < l; i++)
                $(shadows[i]).css({
                    'left': (offset.left + i) + 'px',
                    'top': (offset.top + i) + 'px',
                    'width': width + 'px',
                    'height': height + 'px'
                });
        }
    },

    Remove: function (element) {
        var shadows = element.data('shadows');
        if (shadows) {
            for (var i = 0, l = shadows.length; i < l; i++)
                shadows[i].removeNode(true);
            element.removeData('shadows');
        }
    }
};*/

//Logic similar to Foundation.Controls.Layout.ModalPopup
Foundation.Controls.Layout.PopupHelperWithOverlay = Foundation.Controls.Layout.PopupHelper.extend({
    ctor: function (popup, master) {
        Foundation.Controls.Layout.PopupHelper.prototype.ctor.call(this, popup, master);

        this.$overlay = $('<div style="display:none; position:fixed; top:0; left:0; height:100%; width:100%; background-color:#000000;"></div>');
        this.$overlay.css('opacity', '0'); //IE workaround
        this.$overlay.appendTo(document.body);

        var $this = this;
        this.$overlay.mousedown(function(e) {
            if ($this.OverlayClick)
                $this.OverlayClick(e);
            else if (!$this.StaysOpen)
                $this.Hide();
            return false;
        });
    },

    Show: function () {
        if (Foundation.Controls.Layout.PopupHelper.prototype.Show.call(this)) {
            //Foundation.Controls.Layout.ModalPopup.Show
            this.$overlay.css('zIndex', this.zIndex - 1);
            this.$overlay.show();
            return true;
        }
    },

    Hide: function () {
        if (Foundation.Controls.Layout.PopupHelper.prototype.Hide.call(this)) {
            this.$overlay.hide();
            return true;
        }
    },

    ArrangePopup: function (anchor, maxHeight) {
        var offset = anchor.offset();

        var w = $(window);
        var appWidth = w.width();
        var appHeight = w.height();

        var scrollLeft = w.scrollLeft();
        var scrollTop = w.scrollTop();

        var childWidth = this.$popup.$container.width();
        var childHeight = this.$popup.$container.height();

        if (appWidth > 0 && appHeight > 0) {

            var x = offset.left;
            var y = offset.top;

            var height = anchor.outerHeight();
            var width = anchor.outerWidth();

            if (width > 0 && height > 0) {
                if (!isFinite(maxHeight)) {
                    maxDropDownHeight = ((appHeight - height) * 3) / 5;
                }

                childWidth = Math.min(childWidth, appWidth);
                childHeight = Math.min(childHeight, maxDropDownHeight);
                childWidth = Math.max(width, childWidth);

                var childX = x - 1;
                if (appWidth < (x - scrollLeft + childWidth)) {
                    if (appWidth > (x + width))
                        childX = appWidth - childWidth;
                    else
                        childX = x + width - childWidth;
                }
                var childY = y + height - 1;
                if (appHeight < (childY - scrollTop + childHeight)) {
                    if (childHeight < (y - scrollTop))
                        childY = y - childHeight;
                }
            }

            this.$popup.$container.css('min-width', anchor.outerWidth() + 'px');
            this.$popup.Position({ left: childX, top: childY });
        }
    }
});

Foundation.Controls.Layout.DropDown = Class.extend({
    ctor: function (master) {
        this._text = '';
        this.$enabled = true;
        this.$visible = true;

        this.master = master;

        //#1 absoloute positioned wrapper - overlays the span - would need to make transparent
        //#2 Using SPAN/DIV. Child span seems to overlap parent's border. Adding display:block or using a DIV for $container makes the border too wide
        //#3 Using table seems to work better
        this.$container = $('<table class="dropDownAnchor" style="border:solid transparent 1px; cursor:default;"><tr><td style="padding:1px;">' + this.Text() + '&nbsp;</td><td style="padding:2px 1px 0px 1px;">▼</td></tr></table>'); //&#9660;
        var td = $('td', this.$container);
        this._span = $(td[0]);
        this._anchor = $(td[1]);
    },

    init: function (container) {
        var content = container.children();
        if (content.length) {
            if (content[0].$ctrl)
                content[0].$ctrl.$parent = this;
            content = $(content[0]);
        }
        else
            content = undefined;
        var text = container.attr('data-ctrl-Text');
        container.replaceWith(this.$container);
        if (text) {
            this.Text(text);
        }
        this.initialize(container, content);
    },

    Initialize: function (container, content) {
        if (!container || !content)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.ValueRequired, !container ? 'container' : 'content');
        else if (this.$popup)
            throw 'DropDown has already been initialized' + this.master.toString();

        this.$container.appendTo(container);

        this.initialize(container, content);
    },

    initialize: function (container, content) {
        if (!container || !content)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.ValueRequired, !container ? 'container' : 'content');
        else if (this.$popup)
            throw 'DropDown has already been initialized' + this.master.toString();

        this.$popup = new Foundation.Controls.Layout.Popup(this, 'item-dropDown');
        this.$popup.Closed = jQuery.proxy(this._popup_Closed, this);
        this.$popup.Initialize(content);
        this._popupHelper = new Foundation.Controls.Layout.PopupHelperWithOverlay(this.$popup, this.$container);

        var $this = this;

        this.$container.hover(function () {
            if ($this.$enabled) {
                $this.$container.addClass("active");
            }
        }, function () {
            if ($this.$enabled && $this.$popup && !$this.$popup.IsOpen)
                $this.hideWrapper();
        });

        this.$container.click(function () {
            if ($this.$enabled) {
                if (!$this._popupHelper.IsOpen) {
                    if($this._popupHelper.Show()) {
                        if ($this.Opened)
                            $this.Opened();
                    }
                }
                else
                    $this._popupHelper.Hide();
            }
            return false;
        });
    },

    _popup_Closed: function() {
        this.hideWrapper();
    },

    Layout: function () {
        if (this.$popup.IsOpen)
            this._popupHelper._layout();
    },

    Text: function (text) {
        if (text != undefined) {
            this._text = text;
            if (this._span)
                this._span.text(text)
        }
        else
            return this._text;
    },

    Enabled: function (enabled) {
        if (enabled != undefined) {
            this.$enabled = enabled;
            if (!enabled) {
                this.Hide();
                this._anchor.hide();
            }
            else
                this._anchor.show();
        }
        else
            return this.$enabled;
    },

    Visible: function (visible) {
        if (visible != undefined) {
            this.$visible = visible;
            if (!visible)
                this.Hide();
        }
        else
            return this.$visible;
    },

    Hide: function () {
        this.hideWrapper();
        this._popupHelper.Hide();
    },

    hideWrapper: function () {
        this.$container.removeClass("active");
    }
});

Foundation.Controls.Layout.DropDownAction = Foundation.Controls.Layout.DropDown.extend({
    //ctor: function (master) {
    //    Foundation.Controls.Layout.DropDown.prototype.ctor.call(this);
    //    var $this = this; //Moved to Foundation.Controls.Action.DropDown
    //    master.Resized = function () {
    //        if ($this.$popup.IsOpen)
    //            $this._layout;
    //    };
    //}
});

Foundation.Controls.Layout.TabItem = Class.define({
    ctor: function (child, options) {
        this._child = child;
        if (options) {
            //Could data-link instead
            //<li data-link="visible{:child.Visible()}" />
            if (options.bindVisible) {
                var $this = this;
                this._child.VisibleChanged(function () {
                    $this.Visible($this._child.Visible());
                });
            }
            else if (options.visible != undefined) {
                Foundation.Controls.Control.prototype.Visible.call(this, options.visible);
            }

            if (options.childCss)
                this.childCss = options.childCss;
        }
    },

    Visible: LinkableProperty(function (visible) {
        if(visible != undefined)
            Foundation.Controls.Control.prototype.Visible.set.call(this, visible, this.Header);
        else
            return Foundation.Controls.Control.prototype.Visible.get.call(this, this.Header);
    }),

    Initialize: function (container) {
        this.$container = container;
        if (this._child.Initialize) {
            this._child.Initialize(this.$container);
        }
        else if (this._child.appendTo) {
            this._child.appendTo(this.$container);
        }
        else
            throw String.format('Unable to initialize {0}', this._child);

        if (this.childCss) {
            this._child.$container.css(this.childCss);
            delete this.childCss;
        }

        if (this._child.Visible && this._child.VisibleChanged/*bindVisible is in effect*/) {
            this.Visible(this._child.Visible());
        }
        else {
            Foundation.Controls.Control.prototype.Visible.Apply.call(this, this.Header);
        }

        if (this.$container.css('display') != 'none')
            this.$container.hide();
    },

    Selected: function (selected) {
        if (selected) {
            this.Header.addClass('selected')/*.css('zIndex', ... + 1)*/;
            this.$container.show();
        }
        else {
            this.Header.removeClass('selected');
            this.$container.hide();
        }
    }
});

Foundation.Controls.Layout.TabControl = Foundation.Controls.Layout.ItemSelector.extend({
    ctor: function () {
        Foundation.Controls.Layout.ItemsControl.prototype.ctor.call(this);
        this.Items = [];
    },

    Container:
        '<div class="tabControl top" style="display:none;"></div>',

    TopTemplate:
        '<div class="tabPanel"><ul></ul></div><div class="content"></div>',

    BottomTemplate:
        '<div class="content"></div><div class="tabPanel"><ul></ul></div>',

    Initialize: function (container, options) {
        if (container && container.hasClass('tabControl')) //&& container.is('div')
            this.Container = container;

        if (!(container.hasClass('top') || container.hasClass('bottom')))
            container.addClass('top');

        var options = $.extend(options || {}, { tmplData: {}, clickSelector: 'li > span:first-child' });

        Foundation.Controls.Layout.ItemsControl.prototype.Initialize.call(this, container, options);
        this.$contentContainer = $('div.content', this.$container).first();
        //$('div.tabPanel > ul', this.$container).css('zIndex', ... + 1);
    },

    wireEvents: function () {
        Foundation.Controls.Layout.ItemsControl.prototype.wireEvents.call(this, 'li > span:first-child');
    },

    applyTemplate: function (data, options, template) {
        template = !this.$container.hasClass('bottom') ? this.TopTemplate : this.BottomTemplate;
        this.$container.append($(template));
    },

    indexFromContainer: function (container) {
        return container.data('index');
    },

    containerFromItem: function (item) {
        return item;
    },

    onItemClick: function (tabItem, itemIndex) {
        if (this.SelectedIndex() != itemIndex)
            this.SelectedIndex(itemIndex);
    },

    AddTab: function (tabItem, options) {
        if (tabItem instanceof Foundation.Controls.Layout.TabItem) {
            var index = this.Items.length;
            this.Items.push(tabItem);
            tabItem.Header = $('<li>' + tabItem.Header + '</li>');
            if (options && options.addClass)
                tabItem.Header.addClass(options.addClass);
            else
                tabItem.Header.addClass('texture');
            tabItem.Header.data('index', index);
            this.$itemsContainer.append(tabItem.Header);
            //tabItem.Initialize($('<div style="display:none;"></div>').appendTo(this.$contentContainer));
            var tabItemContainer = tabItem._child instanceof jQuery ? tabItem._child : tabItem.Container ? $(tabItem.Container) : $('<div style="display:none;"></div>');
            if (tabItemContainer.css('display') != 'none')
                tabItemContainer.hide();
            tabItem.Initialize(tabItemContainer.appendTo(this.$contentContainer));
            if (index == 0) {
                this.SelectedItem(tabItem, index);
            }
        }
        else
            throw (String.format('The value "{0}" is not a type of "Foundation.Controls.Layout.TabItem" and cannot be used in this collection', tabItem));
    }
});

Foundation.Controls.Layout.ListBox = Foundation.Controls.Layout.ItemSelector.extend({

    Container:
        '<ul class="listBox"></ul>',

    Template: jQuery.templates(
        '<li data-itemIndex="{{:#index}}">' +
            '<a style="margin-left: 10px;">{{:Name}}</a>' +
        '</li>'
    ),

    onItemClick: function (folder) {
        if (this.SelectedItem)
            this.SelectedItem(folder);
    }
});

Foundation.Controls.Layout.TreeViewItem = Foundation.Controls.Layout.ItemSelector.extend({
    ctor: function (treeView) {
        this.$containerId = treeView.$containerId;
        this.treeView = treeView;
        this.Template = treeView.Template;
        this.Populate = treeView.Populate;
    },

    SelectedIndex: function () {
        throw 'Not supported';
    },

    SelectedItem: function (selectedItem) {
        throw 'Not supported';
    },

    Initialize: function (container) {
        this.Container = container;
        Foundation.Controls.Layout.ItemsControl.prototype.Initialize.call(this, this.Container, { wireEvents: false });
    },

    prepareContainerForItem: function (container, item) {
        var treeViewItem = new Foundation.Controls.Layout.TreeViewItem(this.treeView)
        treeViewItem.Initialize(container);
        Foundation.Controls.Layout.ItemsControl.prototype.prepareContainerForItem.call(this, treeViewItem, item);
        if (this.treeView.prepareContainer)
            this.treeView.prepareContainer(container, item);
    },

    Selected: function (selected) {
        if (selected != undefined) {
            if (selected) {
                this.$container.addClass('selected');
            }
            else {
                this.$container.removeClass('selected');
            }
        }
        else
            return this.$container.hasClass('selected');
    },

    Expanded: function (expanded) {
        if (expanded != undefined) {
            if (expanded) {
                this.$itemsContainer.show();
                $('span.expander', this.$container).first().removeClass("collapsed").addClass("expanded");
            }
            else {
                this.$itemsContainer.hide();
                $('span.expander', this.$container).first().removeClass("expanded").addClass("collapsed");
            }
        }
        else
            return this.$itemsContainer.css('display') != 'none';
    }
});

Foundation.Controls.Layout.TreeView = Foundation.Controls.Layout.ItemSelector.extend({
    SelectedIndex: function (selectedIndex) {
        if (selectedIndex != undefined) {
            if (selectedIndex == -1) {
                var oldValue = this._selectedItem;
                this._selectedItem = undefined;
                this.SelectItem(oldValue, this._selectedItem);
            }
            else
                throw 'Not supported';
        }
        else
            throw 'Not supported';
    },

    SelectedItem: function (selectedItem) {
        if (selectedItem != undefined) {
            var oldValue = this._selectedItem;
            this._selectedItem = selectedItem;
            this.SelectItem(oldValue, selectedItem);
        }
        else
            return this._selectedItem;
    },

    Container:
        '<ul class="treeView"></ul>',

    Template: jQuery.templates(
        '<li data-itemIndex="{{:#index}}">' +
            '{{if HasChildren && Children}}' +
                '<span class="expander collapsed"></span><a {{if NavToken link=false}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-itemIndex="-1">{{:Name}}</a>' +
                '<ul id="subItems" style="display: none;"></ul>' +
            '{{else}}<span class="expanderPlaceholder"></span><a {{if NavToken link=false}}href="{{:~Navigation.Main.Href(NavToken)}}" {{/if}}data-itemIndex="-1">{{:Name}}</a>{{/if}}' +
        '</li>'
    ),

    wireEvents: function () {
        Foundation.Controls.Layout.ItemsControl.prototype.wireEvents.call(this);
        var $this = this;
        this.$container.delegate('li > span.expander', 'click', function () {
            var index = $this.indexFromContainer($(this).parent('li'));
            var item = $.view(this).data; //$this.Items would always get the top-level Items, thus we use { link: true } in Populate and $.view(this).data in ItemsControl.wireEvents
            if (item) {
                //if ($(this).hasClass('expander')) {
                var treeViewItem = $this.containerFromItem(item);
                var expand = !treeViewItem.Expanded();
                treeViewItem.Expanded(expand);
                if (expand)
                    $this.routedInvoke('ItemExpanded', item);
                //}
                //else if ($this.onItemClick) {
                //    $this.onItemClick(items[index], index);
                //}
            }
            return false;
        });
    },

    routedInvoke: function (funcName, funcArg) {
        var treeView = this.treeView || this;
        //if (treeView[funcName])
        treeView[funcName](funcArg);
    },

    Populate: function (items) {
        Foundation.Controls.Layout.ItemsControl.prototype.Populate.call(this, items, { link: true });
        for (var i = 0, l = items.length; i < l; i++) {
            if (items[i].HasChildren && items[i].Children) {
                var treeViewItem = this.containerFromItem(items[i]);
                treeViewItem.Populate(items[i].Children);
            }
        }
    },

    prepareContainerForItem: function (container, item) {
        var treeViewItem = new Foundation.Controls.Layout.TreeViewItem(this)
        treeViewItem.Initialize(container);
        Foundation.Controls.Layout.ItemsControl.prototype.prepareContainerForItem.call(this, treeViewItem, item);
        if (this.prepareContainer)
            this.prepareContainer(container, item);
    },

    onItemClick: function (folder) {
        this.routedInvoke('SelectedItem', folder);
    },

    ExpandItem: function(item) {
        var treeViewItem = this.containerFromItem(item);
        if (treeViewItem) {
            treeViewItem.Expanded(true);
            return true;
        }
        else
            return false;
    }
});

Foundation.Controls.Group.Current = Foundation.Controls.Control.extend({
    Root: function (root) {
        if (root != undefined) {
            this._root = root;
            if (this.$path)
                this.$path._root = this._root;
            if (this.$select)
                this.$select.Root(this._root);
        }
    },

    notifyPopulated: function (group, secondary) {
        if (group)
            this.Item = group; //Used to set Title and Keywords
        if (this.Populated) {
            this.Populated(group, secondary);
        }
    }
});

Foundation.Controls.Group.Path = Foundation.Controls.Control.extend({
    Container: '<span class="groupPath" style="display:none;"></span>',

    Template: jQuery.templates(
    '{{if #index > 0}}&nbsp;&gt;&nbsp;{{/if}}' +
    '{{if ~CanSelectCurrent || Id != ~GroupId}}' +
        '<a class="group active" data-command="OnGroup" data-itemIndex="{{:#getIndex()}}">{{:Name}}</a>' +
    '{{else}}' +
        '<a class="group">{{:Name}}</a>' +
    '{{/if}}'),

    ctor: function (service, root) {
        this._groupId = 0;
        this.$service = service;
        this._root = root;
        this.CanSelectRoot = true;
        this.CanSelectSuper = false;
        this.CanSelectCurrent = true;
    },

    Initialize: function (container) {
        if (container.is('span') && container.hasClass('groupPath'))
            this.Container = container;
        Foundation.Controls.Control.prototype.Initialize.call(this, container);
    },

    applyTemplate: function (data, options) {
        this.Items = data; //To use command, Param and #index without linking
        this.$container.empty().append(this.Template.render(data, options));
    },

    OnGroup: function (group) {
        if (group.Id == 0) {
            if (!this.CanSelectRoot)
                return;
        }
        else if (group.Id == this._groupId) {
            if (!this.CanSelectCurrent)
                return;
        }
        else if ((group.NodeType & Model.Group.NodeType.Class) > 0 || ((group.NodeType & Model.Group.NodeType.Super) > 0 && this.CanSelectSuper)) {
        }
        else
            return;

        if (this.GroupSelected)
            this.GroupSelected(group);
    },

    Id: function() {
        return this._groupId;
    },

    Populate: function (group, container) {
        if (container && !this.$container)
            this.Initialize(container)
        else if (!this.$container)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        if (group != undefined) {
            this._groupId = group;
            return this._populate();
        }
    },

    _populate: function () {
        var $this = this;
        if (this._root && this._groupId == this._root.Id && !String.isNullOrWhiteSpace(this._root.Name)) {
            this.applyTemplate([{ Id: this._root.Id, Name: this._root.Name, NodeType: Model.Group.NodeType.Super }], { CanSelectCurrent: this.CanSelectCurrent, GroupId: this._groupId });
            this.Visible(true);
            if ($this.Populated) {
                $this.Populated(this._root/*{ Id: this._root.Id }*/);
            }
        }
        else if (this._groupId > 0) {
            return this.$service.GetPath(this._groupId, this._root, function (groups) {
                $this.applyTemplate(groups, { CanSelectCurrent: $this.CanSelectCurrent, GroupId: $this._groupId });
                $this.Visible(true);
                if ($this.Populated) {
                    $this.Populated(groups[groups.length - 1]);
                }
            });
        }
        else //Settings.Location.Country
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
    }
});

Foundation.Controls.Action.ActionBase = Foundation.Controls.Control.extend({ //Class.extend
    ctor: function (popupForm) {
        Foundation.Controls.Control.prototype.ctor.call(this, { visible: true });
        this.Text.bind.call(this, '');
        this.Enabled.bind.call(this, false);
        //this.Visible.bind.call(this, true);
        this.$exercised = false;

        this._evaluated = false;
        this._mustHide = false;
        this._mustDisable = false;
        //this._populated = false;

        if (popupForm)
            this.PopupForm(popupForm);
    },

    PopupForm: function(popupForm) {
        if (popupForm != undefined) {
            this.$popupForm = popupForm;
            if (popupForm instanceof Foundation.Controls.Action.Message) {
                var $this = this;
                popupForm.Submit = function () {
                    $this.Exercised(true);
                };
            }
        }
        else
            return this.$popupForm;
    },

    Initialize: function (container, options) {
        this.$container = container;
        this.Visible.Apply.call(this);
        if (options && options.tmplData) {
            this.applyTemplate(options.tmplData, options.tmplOptions, this.ActionTemplate, this.$container);
        }
        //this.$container.append(this.ActiobservableonTemplate.render({ Text: this.Text(), Enabled: this.Enabled() }));
    },

    applyTemplate: function (data, options, template, container) {
        Foundation.Controls.Control.prototype.applyTemplate.call(this, data, options, template, container);
        this.$action = $('.action', this.$container);
    },

    Text: ObservableProperty('Text', function () {
        return this.$text;
    }, function (text) {
        if (this._originalText == undefined)
            this._originalText = text;
        this.$text = text;
    }, { changeDelegate: true }),

    Enabled: ObservableProperty('Enabled', function () {
        return this.$enabled;
    }, function (enabled) {
        this.$enabled = enabled;
    }, { changeDelegate: true }),

    //Now inherit from Foundation.Controls.Control
    //Visible: ObservableProperty('Visible', function () {
    //    //return this.$visible;
    //    return this.$container.css('display') != 'none' ? true : false;
    //}, function (visible) {
    //    //this.$visible = visible;
    //    if (visible === true) {
    //        if (this.$container.css('display') == 'none')
    //            this.$container.show();
    //    }
    //    else if (visible === false) {
    //        if (this.$container.css('display') != 'none')
    //            this.$container.hide();
    //    }
    //}, { templateProperty: true, changeDelegate: true }),

    Exercised: function (exercised) {
        if (exercised != undefined) {
            this.$exercised = exercised;
            if (exercised && !String.isNullOrWhiteSpace(this.ExercisedText))
                this.Text(this.ExercisedText);
            else if (!String.isNullOrWhiteSpace(this._originalText))
                this.Text(this._originalText);
            if (exercised) {
                if (this.Enabled())
                    this.Enabled(false);
            }
            else if (!this.Enabled())
                this.Enabled(true);
        }
        else
            return this.$exercised;
    },

    getState: function () {
        if (!this.Visible())
            return Foundation.Controls.Action.State.Hidden;
        else if (!this.Enabled())
            return Foundation.Controls.Action.State.Inactive;
        else
            return Foundation.Controls.Action.State.Active;
    },

    State: function (value) {
        var state = this.getState();

        if (value != undefined) {
            switch (value) {
                case Foundation.Controls.Action.State.Hidden:
                    if (this.Visible())
                        this.Visible(false);
                    if (this.Enabled())
                        this.Enabled(false);
                    break;
                case Foundation.Controls.Action.State.Inactive:
                    if (!this._mustHide) {
                        if (!this.Visible())
                            this.Visible(true);
                        if (this.Enabled())
                            this.Enabled(false);
                    }
                    break;
                case Foundation.Controls.Action.State.Active:
                    if (!(this._mustHide || this._mustDisable)) {
                        if (!this.Visible())
                            this.Visible(true);
                        if (this.Exercised())
                            this.Exercised(false);
                        else if (!this.Enabled())
                            this.Enabled(true);
                        //if (!this._populated) {
                        //    if (this.Populate)
                        //        this.Populate();
                        //    this._populated = true;
                        //}
                    }
                    break;
            }

            if (state != this.getState() && this.StateChanged)
                this.StateChanged();
        }
        else
            return state;
    },

    Ready: function () {
        return this.Actor() > 0 && this.Addressee() > 0;
    },

    NotApplicable: function () {
        return (this.Type() == Foundation.Controls.Action.Type.Self && this.Actor() != this.Addressee()) || (this.Type() == Foundation.Controls.Action.Type.Inter && this.Actor() == this.Addressee());
    },

    Evaluate: function (reset) {
        this._mustHide = false;
        this._mustDisable = false;

        if (!reset) {
            if (this.Ready()) {
                if (this.NotApplicable()) {
                    this._mustHide = true;
                    this.State(Foundation.Controls.Action.State.Hidden);
                }
            }
            else {
                this._mustDisable = true;
                this.State(Foundation.Controls.Action.State.Inactive);
            }

            if (this.StateOverride)
                this.StateOverride(this, (this._mustHide || this._mustDisable ? this.State() : Foundation.Controls.Action.State.Active));
            else if (!(this._mustHide || this._mustDisable))
                this.State(Foundation.Controls.Action.State.Active);

            this._evaluated = true;
        }
        else {
            this.ResetState();
            this._evaluated = false;
        }
    },

    ResetState: function () {
        if (this.Exercised())
            this.Exercised(false);
        this.State(Foundation.Controls.Action.State.Inactive);
        if (this.StateOverride)
            this.StateOverride(this, Foundation.Controls.Action.State.Inactive); //Some actions (such as Product->release get hidden when inactive)
    },

    Actor: function () {
        return Session.User.Id;
    },

    Addressee: function () {
        return this.Page._token.AccountId;
    },

    Type: function () {
        return Foundation.Controls.Action.Type.Inter;
    }
});

Foundation.Controls.Action.CanExecute = function (enabled) {
    if (enabled === true) {
        return 'action active';
    }
    return 'action';
};

//A bit similar to Foundation.Controls.Folder.DropDownList
Foundation.Controls.Action.DropDown = Foundation.Controls.Action.ActionBase.extend({
    ctor: function (popup) {
        Foundation.Controls.Action.ActionBase.prototype.ctor.call(this, popup);
        this.itemsControl = new Foundation.Controls.Layout.ItemsControl();
        this.itemsControl.onItemClick = jQuery.proxy(this.ItemCommand, this);
        this._populated = false;
    },

    DropDown: function (dropDown) {
        //In SL Text, IsEnabled and Visibility of the dropDownContainer are data-bound
        this.$dropDown = dropDown;
        this.$dropDown.Text(this.Text());
        var $this = this;
        this.TextChanged(function (text) {
            $this.$dropDown.Text(text);
        });
        this.$dropDown.Enabled(this.Enabled());
        this.EnabledChanged(function (enabled) {
            $this.$dropDown.Enabled(enabled);
        });
        this.$dropDown.Visible(this.Visible());
        this.VisibleChanged(function (visible) {
            $this.$dropDown.Visible(visible);
        });
        this.$dropDown.Opened = function () {
            if ($this._dropDown_Opened)
                $this._dropDown_Opened();
        };
        this.Resized = function () {
            $this.$dropDown.Layout();
        };
    },

    NewItemText: function (newItemText) {
        this.NewItemTemplate = '<span id="newItem" style="vertical-align:middle;"><a class="image-button active left" data-command="NewItemCommand"><span class="add"></span></a>' + newItemText + '</span>';
    },

    init: function (container) {
        //container is action <div>, which becomes dropDown's popup
        //<li>
        //<div data-ctrl="Foundation.Controls.Layout.DropDown"> 
        //<div data-ctrl="Foundation.Controls.Action.DropDown"> - container
        var text = container.attr('data-ctrl-Text');
        if (text) {
            this.Text(text);
            container.removeAttr('data-ctrl-Text');
        }
        var dropDown = this.parent(Foundation.Controls.Layout.DropDown);
        this.$container = dropDown.$container.parent('li'); //needed for .Visible() to work
        this.$contentContainer = container;
        //this.itemsControl.Initialize(this.$contentContainer);
        this.initialize({ dropDown: dropDown });
    },

    ContentContainer: '<div></div>',

    Initialize: function (container) {
        //container is action <li>, which will house the dropDown's container (<table>)
        //<li> - container
        //<table>
        this.$container = container; //needed for .Visible() to work
        this.$contentContainer = $(this.ContentContainer);
        //this.itemsControl.Initialize(this.$contentContainer);
        var dropDown = new Foundation.Controls.Layout.DropDownAction(this);
        dropDown.Initialize(container, this.$contentContainer);
        this.initialize({ dropDown: dropDown });
    },

    initialize: function (options) {
        var dropDown = options.dropDown;
        dropDown.$container.addClass('action');
        this.DropDown(dropDown);

        this.itemsControl.Initialize(this.$contentContainer);

        if (this.NewItemTemplate || options.wireEvents) {
            this.$contentContainer.append(this.NewItemTemplate);
            this.wireEvents({ container: this.$contentContainer});
        }
    },

    _dropDown_Opened: function () {
        if (!this._populated) {
            this.Populate();
            this._populated = true;
        }
    },

    ResetItems: function (resetState) {
        if (resetState)
            Foundation.Controls.Action.ActionBase.prototype.Reset.call(this);
        this.itemsControl.Populate();
        if (this.NewItemTemplate)
            $('#newItem', this.$contentContainer).removeClass('separated');
        this._populated = false;
    },

    Populate: function () {
        var $this = this;
        this.populate(function (items) {
            if (items && items.length) {
                $this.itemsControl.Populate(items);

                $('#newItem', $this.$contentContainer).addClass('separated');

                if ($this.Resized) //layout the drop-down (if applicable)
                    $this.Resized();
            }
            else if (!$this.NewItemTemplate)
                $this.Enabled(false);
        });
    },

    ItemCommand: function (item) {
        this.onItem(item, Foundation.Controls.Action.ItemType.Existing);
    },

    NewItemCommand: function () {
        this.onItem({ Id: 0, Name: '' }, Foundation.Controls.Action.ItemType.New);
    },

    onItem: function (item, itemType) {
        this.$dropDown.Hide();
        if (this.Actor() > 0 && (item.Id > 0 || itemType == Foundation.Controls.Action.ItemType.New || itemType == Foundation.Controls.Action.ItemType.Root))
            this.ItemSelected(item, itemType);
    }
});

Foundation.Controls.Action.Message = Foundation.Controls.Validation.PopupControl.extend({
    ValidatorOptions: {
        rules: {
            //subject: "required",
            text: "required"
        },

        messages: {
            //subject: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Subject),
            text: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Global.Message_Text)
        }
    },

    ctor: function () {
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this);
        this._fromBusiness = new Foundation.Controls.Action.FromBusiness(this);
        this._fromBusiness.TemplateData = { BusinessPrompt: Resource.Business.From, PersonalPrompt: Resource.Personal.Message };
        this.$focusCtrl = '#text';
    },

    Initialize: function (options) {
        Foundation.Controls.Validation.PopupControl.prototype.Initialize.call(this, $.extend(options || {}, {
            tmplData: {},
            tmplOptions: {
                FromBusiness: this._fromBusiness
            }
        }));
        this._fromBusiness.Initialize(this.$container);
    },

    //Subject: function (subject) {
    //    if (subject != undefined) {
    //        $('#subject', this.$container).val(subject);
    //    }
    //    else
    //        return $('#subject', this.$container).val();
    //},

    Text: function (text) {
        if (text != undefined) {
            $('#text', this.$container).val(text);
        }
        else
            return $('#text', this.$container).val();
    },

    OnSubmit: function () {
        var message = {};
        message.From = Session.User.Id;
        message.FromBusiness = this._fromBusiness.GetValue();

        //message.Subject = this.Subject();
        message.Text = this.Text();

        if (this.save)
            this.save(message);

        var $this = this;
        Admin.Service.Interaction.Message.Save(message, function (messageId) {
            $this.SubmitComplete(true);
            $this.Reset();
        }, jQuery.proxy(this.Invalidate, this));
    },

    Reset: function () {
        if (this.$container) {
            //this.Subject('');
            this.Text('');
        }
    }
});

Foundation.Controls.Action.FromBusiness = Class.define({
    Template: jQuery.templates('<tr class="fromBusiness" style="display: none;">' +
                        '<td class="label auto" style="vertical-align:top;">{{:BusinessPrompt}}</td>' +
                        '<td class="value" style="font-weight:bold;"><span id="businessName"></span></td>' +
                    '</tr>' +
                    '<tr class="isPersonal" style="display: none;">' +
                        '<td></td>' +
                        '<td class="value"><input type="checkbox" id="personalMessage" />&nbsp;{{:PersonalPrompt}}</td>' +
                    '</tr>'),

    ctor: function (master) {
        this.master = master;
    },

    Visible: function(visible) {
        if(visible != undefined) {
            if(visible === true)
                $('.fromBusiness, .isPersonal', this.$container).show();
            else if(visible === false)
                $('.fromBusiness, .isPersonal', this.$container).hide();
        }
    },

    Initialize: function (container) {
        var $this = this;
        this.$container = container;
        this._personalMessage = $('#personalMessage', this.$container);
        this._personalMessage.change(function () {
            $this.IsPersonal($this._personalMessage.prop('checked'), true);
        });
        Session.User.SignInChanged(function () {
            $this.Reset();
        });
        this.Reset();
    },

    BusinessId: function (businessId) {
        if (businessId != undefined) {
            if (this.businessId != businessId) {
                this.businessId = businessId;
                this.reflectBusiness(businessId);
            }
        }
        else
            return this.businessId;
    },

    GetValue: function () {
        if (this.IsPersonal())
            return 0;
        else {
            if (this.BusinessId() > 0 && this.BusinessId() != Session.User.Business.Id)
                return this.BusinessId();
            else
                return Session.User.Business.Id;
        }
    },

    BusinessName: function (businessName) {
        if (businessName != undefined) {
            $('#businessName', this.$container).text(businessName);
        }
        else
            return $('#businessName', this.$container).text();
    },

    IsPersonalEnabled: function (enabled) {
        if (enabled != undefined) {
            setDisabled(this._personalMessage, enabled ? false : true);
        }
        else
            return !getDisabled(this._personalMessage);
    },

    IsPersonal: function (isPersonal, suppress) {
        if (isPersonal != undefined) {
            if (isPersonal) {
                $('.fromBusiness', this.$container).hide();
            }
            else
                $('.fromBusiness', this.$container).show();
            if (!suppress)
                this._personalMessage.prop('checked', isPersonal);
        }
        else
            return this._personalMessage.prop('checked');
    },

    Reset: function () {
        if (this.BusinessId != Session.User.Business.Id) {
            this.BusinessId(Session.User.Business.Id);
        }
        else //force reflectBusiness
            this.reflectBusiness(Session.User.Business.Id);
    },

    reflectBusiness: function (businessId) {
        this.IsPersonalEnabled(businessId == 0 || businessId == Session.User.Business.Id ? true : false);
        if (businessId > 0) {
            if (Session.User.Business.Id == businessId && !String.isNullOrWhiteSpace(Session.User.Business.Name)) {
                this.BusinessName(Session.User.Business.Name);
            }
            else //throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "Business");
            {
                var $this = this;
                User.Service.Business.Profile.Get(businessId, function (account) {
                    $this.BusinessName(account.Name);
                }, function (ex) {
                    throw ex;
                });
            }

            this.Visible(true);
            this.IsPersonal(false);
        }
        else {
            if (Session.User.Business.Id > 0) {
                this.BusinessName(Session.User.Business.Name);
                this.Visible(true);
            }
            else {
                this.BusinessName('');
                this.Visible(false);
            }
            this.IsPersonal(true);
        }
    }
});

System.Type.RegisterNamespace('Foundation.Controls.List');

Foundation.Controls.List.DataPager = Class.define({

    Template: '<span class="pager" style="vertical-align:middle;">' +
                    '<a id="prevPage"></a>' + //class="button" &#9668;
                    '|<span id="pageButtons"></span>|' +
                    '<a id="nextPage"></a>' + //class="button" &#9658;
                '</span>',

    ctor: function (source) {
        this._source = source;
        this._source.addPropertyChanged(jQuery.proxy(this.onSourcePropertyChanged, this));
        this.NumericButtonCount = 5;
    },

    Initialize: function (container) {
        var $this = this;
        this.$container = $(this.Template);
        this.$container.appendTo(container);
        this.$container.delegate('a', 'click', /*{ Pager: this._source },*/function (e) {
            var pageButton = $(this);
            if (getDisabled(pageButton))
                return false;
            var pager = $this._source; // e.data.Pager;
            switch (pageButton.attr('id')) {
                case 'prevPage':
                    pager.MoveToPreviousPage();
                    break;
                case 'nextPage':
                    pager.MoveToNextPage();
                    break;
                default:
                    var pageIndex = pageButton.data('pageIndex');
                    if (pager.PageIndex != pageIndex)
                        pager.MoveToPage(pageIndex);
            }
            return false;
        });
        this._pageButtons = $('#pageButtons', this.$container);
        this._prevPage = $('#prevPage', this.$container);
        this._nextPage = $('#nextPage', this.$container);
        this.UpdatePageCount();
    },

    onSourcePropertyChanged: function (propertyName) {
        switch (propertyName) {

            case 'TotalItemCount':
                this.UpdateControl();
                break;

            case 'ItemCount':
            case 'PageSize':
                this.UpdatePageCount();
                this.UpdateControl();
                return;

            case 'PageIndex':
                this.UpdateButtonDisplay();
                this.EnableDisableButtons();
                return;

            case 'CanChangePage':
                this.EnableDisableButtons();
                break;

            default:
                return;
        }
    },

    UpdatePageCount: function () {
        if (this._source.PageSize > 0) {
            this.PageCount = Math.max(1, Math.ceil(this._source.ItemCount / this._source.PageSize));
        }
        else {
            this.PageCount = 1;
        }
    },

    GetButtonStartIndex: function() {
        return Math.round(Math.min(Math.max((this._source.PageIndex + 1) - (this.NumericButtonCount / 2), 1), Math.max(this.PageCount - this.NumericButtonCount + 1, 1)));
    },

    UpdateControl: function () {
        //this.UpdatePageModeDisplay();
        this.UpdateButtonCount();
        this.EnableDisableButtons();
    },

    UpdateButtonCount: function () {
        var num = Math.min(this.NumericButtonCount, this.PageCount);

        if (this._pageButtons) {
            var count = this._pageButtons.find('a').length;
            while (count < num) {
                this._pageButtons.append('<a class="page"></a>')
                count++;
            }
            while (count > num) {
                $(this._pageButtons.find('a')[0]).remove();
                count--;
            }
            //this.UpdateNumericButtonsForeground();
            this.UpdateButtonDisplay();
        }
    },

    UpdateButtonDisplay: function (needPage) {
        //Maybe incomplete
        if (this._pageButtons) {
            var buttonStartIndex = this.GetButtonStartIndex();
            var num2 = Math.min(this.NumericButtonCount, this.PageCount);
            var flag = false;
            var buttonIndex = buttonStartIndex;
            var buttons = this._pageButtons.find('a');
            var token = Page._token;
            var tokenPage = token.Page; //save the token page
            for (var i = 0, l = buttons.length; i < l; i++) {
                var button = $(buttons[i]);
                if (this._source.PageIndex == (buttonIndex - 1)) {
                    button.addClass('selected').removeClass('active');
                }
                else {
                    button.removeClass('selected').addClass('active');
                }
                token.Page = (buttonIndex - 1);
                button.text(buttonIndex);
                button.data('pageIndex', (buttonIndex - 1));
                button.attr('href', Navigation.Main.Href(token));
                buttonIndex++;
            }
            if (this.CanMoveToPreviousPage && this._source.PageIndex > 0) {
                token.Page = (this._source.PageIndex - 1);
                this._prevPage.attr('href', Navigation.Main.Href(token));
            }
            else
                this._prevPage.removeAttr('href');
            if (this.CanMoveToNextPage && (this._source.PageIndex + 1) < this._source.PageCount) {
                token.Page = (this._source.PageIndex + 1);
                this._nextPage.attr('href', Navigation.Main.Href(token));
            }
            else
                this._nextPage.removeAttr('href');
            token.Page = tokenPage; //restore token page
        }
    },

    EnableDisableButtons: function () {
        var needPage = this._source.PageSize > 0
        this.CanMoveToFirstPage = needPage && (this._source.PageIndex > 0);
        this.CanMoveToPreviousPage = this.CanMoveToFirstPage;
        this.CanMoveToNextPage = needPage && ((!this.IsTotalItemCountFixed || (this._source.TotalItemCount == -1)) || (this._source.PageIndex < (this._source.PageCount - 1)));
        this.CanMoveToLastPage = (needPage && (this._source.TotalItemCount != -1)) && (this._source.PageIndex < (this._source.PageCount - 1));
        this.CanChangePage = (needPage && this._source.CanChangePage);
        //this.UpdateCurrentPagePrefixAndSuffix(needPage);
        if (!needPage || !this.CanChangePage) {
            this.SetCannotChangePage(needPage);
        }
        else {
            this.SetCanChangePage();
            this.UpdateCanPageFirstAndPrevious();
            this.UpdateCanPageNextAndLast();
        }
    },

    SetCannotChangePage: function (needPage) {
        //if (this._currentPageTextBox && !needPage) {
        //    this._currentPageTextBox.Text = '';
        //}
        //setDisabled(this._currentPageTextBox, true);
        //setDisabled(this._firstPage, true);
        setDisabled(this._prevPage, true);
        setDisabled(this._nextPage, true);
        //setDisabled(this._lastPage, true);
    },

    SetCanChangePage: function (needPage) {
        //setDisabled(this._currentPageTextBox, false);
        //if (this._currentPageTextBox) {
        //    this._currentPageTextBox.Text = (this._source.PageIndex + 1)/*.ToString(CultureInfo.CurrentCulture)*/;
        //}
    },

    UpdateCanPageFirstAndPrevious: function () {
        //setDisabled(this._firstPage, !this.CanMoveToFirstPage);
        setDisabled(this._prevPage, !this.CanMoveToPreviousPage);
    },

    UpdateCanPageNextAndLast: function () {
        setDisabled(this._nextPage, !this.CanMoveToNextPage);
        //setDisabled(this._lastPage, !this.CanMoveToLastPage);
    }
});

Foundation.Controls.List.Header = {
    Template: function (templateFormat, templateConverter, templateConverterParemeter) {
        var template;
        var templateFunc = function (value) {
            if (value != undefined) {
                template = value;
            }
            else if (!template && templateConverter && templateFormat) {
                template = $.templates('<span>' + templateConverter(templateFormat, templateConverterParemeter) + '</span>');
                return template;
            }
            else
                return template;
        }
        templateFunc.Format = function (value) {
            if (value) {
                templateFormat = value;
                template = undefined;
            }
        };
        templateFunc.Converter = function (value) {
            if (value) {
                templateConverter = value;
                template = undefined;
            }
        };
        templateFunc.ConverterParameter = function (value) {
            if (value) {
                templateConverterParemeter = value;
                template = undefined;
            }
        };
        return templateFunc;
    },

    Formatter: function (format, parameter) {

        if (!String.isNullOrWhiteSpace(parameter)) {
            var args = parameter.split('|');
            return String.format(format, args);
        }

        return format;
    },

    Data: Class.define({
        ctor: function (data) {
            $.extend(this, data);
        },

        IsEmpty: function () {
            return this.FromRecord && this.FromRecord > 0 && this.ToRecord && this.ToRecord > 0 ? false : true;
        },

        ToArray: function () {
            var a = [];
            for (var i in this)
                if (!(typeof this[i] == 'function' || i == 'Format'))
                    a.push(this[i]);
            return a;
        }
    })
};

Foundation.Controls.List.ContainerBase = Foundation.Controls.Control.extend({

    ctor: function (listView) {
        this.View = listView;
        this.HeaderTemplate = Foundation.Controls.List.Header.Template(Resource.Global.List_Header_Format, Foundation.Controls.List.Header.Formatter, "{{:FromRecord}}|{{:ToRecord}}|{{:TotalCount}}|{{:Entity}}|{{:Query}}");
        this.EmptyHeaderTemplate = Foundation.Controls.List.Header.Template(Resource.Global.List_Header_EmptyFormat, Foundation.Controls.List.Header.Formatter, "{{:Entity}}|{{:Query}}");
    },

    Initialize: function (container, options) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container, $.extend(options || {}, { tmplData: {} }));
    },

    Entity: Resource.Dictionary.record_s,

    Header: function (header) {
        if (header != undefined) {
            this.header = header;

            if (header.CustomTemplate && this[header.CustomTemplate]) {
                this[header.CustomTemplate]().link(this._headerContainer, this.header);
            }
            else if (!header.IsEmpty()) {
                this.HeaderTemplate().link(this._headerContainer, this.header);
            }
            else {
                this.EmptyHeaderTemplate().link(this._headerContainer, this.header);
            }

            //may not use render as it wont data-link
            //this._headerContainer.empty().append(template.render(this.header));

            //could also use named templates
            //$.templates({
            //    HeaderTemplate: this.HeaderTemplate(),
            //    EmptyHeaderTemplate: this.EmptyHeaderTemplate()
            //});
            //var headerTemplate = !header.IsEmpty() ? "HeaderTemplate" : "EmptyHeaderTemplate";
            //$.link.headerTemplate(headerContainer, this.header);
        }
        else
            return this.header;
    },

    Populate: function (data, options) {
        this.View.Populate(data);
        if (options && options.metaDescription) {
            var description = this._headerContainer.text();
            if (data && data.length) {
                var i = 0;
                if (data[0].Name) {
                    while (i < data.length && i <= 10) {
                        description += ' ';
                        description += data[i++].Name;
                    }
                }
                if (i < 10 && data[0].Text)
                    description += (' ' + data[0].Text);
            }
            metaDescription(description);
        }
    }
});

Foundation.Controls.List.PagingContainer = Foundation.Controls.List.ContainerBase.extend({

    Container: '<table class="form listContainer" style="width: 100%"></table>',

    Template: '<tbody>' +
                '<tr class="header">' +
                    '<td id="header" class="left" style="font-weight:bold;">' +
                    '</td>' +
                    '<td id="pager1" class="right" style="width:auto;">' +
                    '</td>' +
                '</tr>' +
                '<tr class="content" id="list">' +
                    '<td colspan="2" style="padding-top: 10px; padding-bottom: 10px;">' +
                    '</td>' +
                '</tr>' +
                '<tr class="content" style="display:none;">' +
                    '<td colspan="2" id="placeholder" style="padding-bottom: 10px;">' +
                    '</td>' +
                '</tr>' +
                '<tr id="footer">' +
                    '<td class="left">' +
                        '<span style="vertical-align:middle;">' + Resource.Dictionary.Page_size + ':</span>' +
                        '<select id="pageSize">' +
                            '<option selected="selected">5</option>' +
                            '<option>10</option>' +
                            '<option>25</option>' +
                            '<option>50</option>' +
                            '<option>100</option>' +
                        '</select>' +
                        '<span style="vertical-align:middle;">' + Resource.Dictionary.records + '</span>' +
                    '</td>' +
                    '<td id="pager2" class="right" style="width:auto;">' +
                    '</td>' +
                '</tr>' +
            '</tbody>',

    ctor: function (pager, listView) {
        Foundation.Controls.List.ContainerBase.prototype.ctor.call(this, listView);
        this._pager = pager;
        this._pager1 = new Foundation.Controls.List.DataPager(pager);
        this._pager2 = new Foundation.Controls.List.DataPager(pager);
    },

    Initialize: function (container, options) {
        Foundation.Controls.List.ContainerBase.prototype.Initialize.call(this, container, options);

        this.View.Initialize($('#list > td', this.$container));

        var $this = this;
        this._headerContainer = $('#header', this.$container);
        var pageSize = $('#pageSize', this.$container);
        pageSize.val(this._pager.PageSize);
        pageSize.change(/*{ Pager: this._pager },*/function (e) {
            //var pager = e.data.Pager;
            $this._pager.setPageSize(parseInt($(this).val()));
        });

        this._pager1.Initialize($('#pager1', $this.$container));
        this._pager2.Initialize($('#pager2', $this.$container));

        this._pager.addPropertyChanged(function (propertyName) {
            switch (propertyName) {
                case "Visible":
                    if ($this._pager.Visible) {
                        $('#header', $this.$container).removeClass('empty');
                        $('#pager1', $this.$container).show();
                        $('#list', $this.$container).show();
                        $('#footer', $this.$container).show();
                    } else {
                        $('#header', $this.$container).addClass('empty');
                        $('#pager1', $this.$container).hide();
                        $('#list', $this.$container).hide();
                        $('#footer', $this.$container).hide();
                    }
            }
        });
    }
});

Foundation.Controls.List.Container = Foundation.Controls.List.ContainerBase.extend({
    Container: '<table class="form listContainer" style="width: 100%"></table>',
    Template: '<tbody>' +
                '<tr class="header">' +
                    '<td id="header" class="left" style="font-weight:bold;">' +
                    '</td>' +
                '</tr>' +
                '<tr id="list">' +
                    '<td colspan="2" style="padding-top: 15px;">' +
                    '</td>' +
                '</tr>' +
            '</tbody>',

    Initialize: function (container, options) {
        Foundation.Controls.List.ContainerBase.prototype.Initialize.call(this, container, options);
        this.View.Initialize($('#list > td', this.$container));
        this._headerContainer = $('#header', this.$container);
    },

    Populate: function (data) {
        if (data && data.length > 0) {
            this.View.Populate(data);
            $('#list', this.$container).show();
            this.Header(this.prepareHeader(new Foundation.Controls.List.Header.Data({ FromRecord: 1, ToRecord: data.length, TotalCount: data.length, Entity: this.Entity/*, Format = this.HeaderFormat*/ })));
        }
        else {
            this.View.Populate();
            $('#list', this.$container).hide();
            this.Header(this.prepareHeader(new Foundation.Controls.List.Header.Data({ Entity: this.Entity, TotalCount: 0/*, Format = this.EmptyHeaderFormat*/ })));
        }
    },

    prepareHeader: function(header) {
        return header;
    }
});

Foundation.Controls.List.ColumnOptionType =
{
    OptIn: 1,
    OptOut: 2,
    FilterOut: 3,
    FilterIn: 4
};

Foundation.Controls.List.ViewBase = Foundation.Controls.Control.extend({
    ctor: function () {
        Foundation.Controls.Control.prototype.ctor.call(this);
        this.selectable = false;
    },

    Initialize: function (container) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container);
        //var headRow = $('tr', this.$container).first();
        var headRow = $('thead > tr', this.$container);
        var headClmns = headRow.find('th');
        this._initiallyCollapsed = {};
        for (var i = 0, l = headClmns.length; i < l; i++) {
            var headClmn = $(headClmns[i]);
            var clmnId = headClmn.attr('id');
            if (!String.isNullOrEmpty(clmnId) && headClmn.css('display') == 'none')
                this._initiallyCollapsed[clmnId] = true;
        }

        var $this = this;

        if (this.selectable) {
            this.$container.delegate('input:checkbox[data-command=ItemSelectCommand]', 'change', function (e) {
                var elem = $(this);
                var selected = elem.prop('checked');
                var index = parseInt(elem.attr('data-itemIndex'));
                if (!isNaN(index) && $this.Items && $this.Items.length && $this.Items.length > index) {
                    var item = $this.Items[index];
                    if (selected)
                        item.Selected = true;
                    else if (item.Selected) {
                        item.Selected = false;
                        delete item.Selected;
                    }
                    if ($this.onCommand)
                        $this.onCommand('ItemSelectCommand', item);
                }
            });
        }

        this.$contentContainer = $('tbody', this.$container);
        //this.$container.delegate('tbody > tr', 'mouseenter', function () {
        this.$contentContainer.delegate('tr', 'mouseenter', function () {
            var tr = $(this);
            var rowPart = tr.attr('data-rowPart');
            if (rowPart) {
                switch (rowPart) {
                    case '1of2':
                        tr.next().addClass('highlighted');
                        break;
                    case '2of2':
                        tr.prev().addClass('highlighted');
                        break;
                    case '1of3':
                        tr.next().addClass('highlighted').next().addClass('highlighted');
                        break;
                    case '2of3':
                        tr.prev().addClass('highlighted');
                        tr.next().addClass('highlighted');
                        break;
                    case '3of3':
                        tr.prev().addClass('highlighted').prev().addClass('highlighted');
                        break;
                }
            }
        });
        //this.$container.delegate('tbody > tr', 'mouseleave', function () {
        this.$contentContainer.delegate('tr', 'mouseleave', function () {
            var tr = $(this);
            var rowPart = tr.attr('data-rowPart');
            if (rowPart) {
                switch (rowPart) {
                    case '1of2':
                        tr.next().removeClass('highlighted');
                        break;
                    case '2of2':
                        tr.prev().removeClass('highlighted');
                        break;
                    case '1of3':
                        tr.next().removeClass('highlighted').next().removeClass('highlighted');
                        break;
                    case '2of3':
                        tr.prev().removeClass('highlighted');
                        tr.next().removeClass('highlighted');
                        break;
                    case '3of3':
                        tr.prev().removeClass('highlighted').prev().removeClass('highlighted');
                        break;
                }
            }
        });
    },

    Populate: function (data) {
        //Hide - only - not enough
        /*for (var clmn in this.DynamicColumns) {
        var th = headRow.find('th#' + clmn);
        if (this.DynamicColumns[clmn])
        th.show();
        else
        th.hide();
        }*/
        //Also need to restore visibility of column headers when they are removed from filter list
        //var headRow = $('tr', this.$container).first();
        var headRow = $('thead > tr', this.$container);
        var headClmns = $('th', headRow);
        for (var i = 0, l = headClmns.length; i < l; i++) {
            var headClmn = $(headClmns[i]);
            var clmnId = headClmn.attr('id');
            if (!String.isNullOrEmpty(clmnId)) {
                var dynClmn = this.DynamicColumns[clmnId];
                if (dynClmn != undefined) {
                    if (dynClmn)
                        headClmn.show();
                    else
                        headClmn.hide();
                }
                else if (!this._initiallyCollapsed[clmnId]) {
                    headClmn.show();
                }
            }
        }

        if (data && data.length > 0) {
            this.Items = data;
            this.applyTemplate(data, this.TemplateOptions());
        }
        else if (this.Items)
            delete this.Items;

        if (this.onItemsChanged)
            this.onItemsChanged();
    },

    itemCommand: function (command, elem, $this) {
        var item;
        if ($this.Items && $this.Items.length) {
            var index = elem.attr('data-itemIndex');
            if (index) {
                index = parseInt(index);
                if (isNaN(index)) 
                    console.error('Unable to parse item Index: ' + elem.attr('data-itemIndex'));
                else if ($this.Items.length > index) {
                    item = $this.Items[index];
                    var commandParam = elem.attr('data-commandParam');
                    if (commandParam)
                        item = item[commandParam];
                }
            }
        }
        $this.onCommand(command, item, elem, index);
    },

    Selectable: function (selectable) {
        if (selectable != undefined) {
            this.selectable = selectable;
        }
        else
            return this.selectable;
    }
});

System.Type.RegisterNamespace('Foundation.Controls.List.Filter');
Foundation.Controls.List.Filter.Available = Foundation.Controls.Control.extend({
    Container: '<div class="side" style="display:none;"></div>',

    Template: jQuery.templates(
        '<span class="header">' + Resource.Dictionary.Narrow_by + '</span>' +
        '<table class="filterAvail"><tbody>' +
        '{{for Facets}}' +
            '<tr><td colspan="2"><span><strong>{{:Text}}</strong></span></td></tr>' +
            '{{for Values tmpl=~ValueTemplate/}}' +
        '{{/for}}' +
        '</tbody></table>'
    ),

    ValueTemplate: jQuery.templates('<tr>' +
                                        '<td>&nbsp;&nbsp;</td>' +
                                        '<td>' +
                                            '<a data-command="ItemCommand" data-itemIndex="-1">{{:Text}}</a>' +
                                            '({{:Count}}) [<a style="padding-left:2px; padding-right:2px;" data-command="ExcludeCommand" data-itemIndex="-1">x</a>]' +
                                        '</td>' +
                                   '</tr>'),

    onCommand: function (command, facet, elem) {
        if (facet && this.FilterSelected) {
            var exclude = false;
            if (command == "ExcludeCommand")
                exclude = true;
            else if (command != "ItemCommand")
                return;
            this.FilterSelected({ Name: facet.Name.Key, NameText: facet.Name.Text, Value: facet.Key, ValueText: facet.Text, Exclude: exclude });
        }
    },

    Populate: function (facets) {
        this.applyTemplate({ Facets: facets }, { link: true, ValueTemplate: this.ValueTemplate });
        if (facets && facets.length > 0)
            this.Visible(true);
        else
            this.Visible(false);
    }
});

Foundation.Controls.List.Filter.Applied = Foundation.Controls.Control.extend({

    Container: '<span id="filterApplied" style="display:none; float:left; margin-bottom:10px;">' + Resource.Dictionary.Filter + '&nbsp;</span>',

    Template: jQuery.templates(
    '{{if #index > 0}}&nbsp;|&nbsp;{{/if}}' +
    '<a class="href reverse" data-command="onFilterSelected" data-itemIndex="{{:#index}}">{{:ValueText}}</a>'),

    ctor: function () {
        this.Facets = [];
    },

    Initialize: function (container, options) {
        if (container.attr('id') == 'filterApplied')
            this.Container = container;
        Foundation.Controls.Control.prototype.Initialize.call(this, container, options);
        this.$contentContainer = $('<span></span>');
        this.$contentContainer.appendTo(this.$container);
    },

    onFilterSelected: function (data, elem) {
        if (this.FilterSelected) {
            var index = parseInt(elem.attr('data-itemIndex'));
            if (!isNaN(index) && this.Facets.length > index) {
                var facet = this.Facets[index];
                this.FilterSelected(facet, index);
            }
        }
    },

    Clear: function () {
        this.Facets = [];
        this.$contentContainer.empty();
        this.Visible(false);
    },

    Add: function (facet) {
        this.Facets.push(facet);
        this.applyTemplate(this.Facets);
        this.Visible(true);
    },

    Remove: function (index) {
        if (index >= 0) {
            this.Facets.splice(index, 1);
            this.applyTemplate(this.Facets);
            if (this.Facets.length == 0)
                this.Visible(false);
        }
    }
});

Foundation.Controls.List.View = Foundation.Controls.List.ViewBase.extend({

    //Template is ItemTemplate now
    /*Template: $.templates(
    '<tbody>' +
    '{{for #data tmpl=~ItemTemplate/}}' +
    '</tbody>'),*/

    ctor: function () {
        //this.Template.layout = true; //according to http://www.borismoore.com/2012/03/approaching-beta-whats-changing-in_06.html this wouldbe layout template, but seems to also work without it though
        this.optionalColumns = {};
        this.DynamicColumns = {};
    },

    ColumnOptionType:
    {
        None: 0,
        In: 1,
        Out: 2
    },

    ColumnFilterType:
    {
        None: 0,
        In: 1,
        Out: 2
    },

    OptionalColumns: function () {
        var optionalColumns = [];
        for (var n in this.optionalColumns) {
            var oc = this.optionalColumns[n];
            if (oc.Option == this.ColumnOptionType.In && oc.Filter != this.ColumnFilterType.Out)
                optionalColumns.push(n);
        }
        return optionalColumns;
    },

    ChangeColumnOption: function (column, type) {
        var clmn = this.optionalColumns[column];
        switch (type) {
            case Foundation.Controls.List.ColumnOptionType.OptIn:
                if (clmn == undefined)
                    this.optionalColumns[column] = { Option: this.ColumnOptionType.In, Filter: this.ColumnFilterType.None };
                else if (clmn.Option == this.ColumnOptionType.Out)
                    throw String.format("Column {1} has already been opted out", column);
                break;
            case Foundation.Controls.List.ColumnOptionType.OptOut:
                if (clmn == undefined)
                    this.optionalColumns[column] = { Option: this.ColumnOptionType.Out, Filter: this.ColumnFilterType.None };
                else if (clmn.Option == this.ColumnOptionType.In)
                    throw String.format("Column {1} has already been opted in", column);
                break;
            case Foundation.Controls.List.ColumnOptionType.FilterOut:
                if (clmn == undefined)
                    this.optionalColumns[column] = { Option: this.ColumnOptionType.None, Filter: this.ColumnFilterType.Out };
                else if (clmn.Option == this.ColumnOptionType.In)
                    clmn.Filter = this.ColumnFilterType.Out;
                break;
            case Foundation.Controls.List.ColumnOptionType.FilterIn:
                if (clmn != undefined) {
                    if (clmn.Option == this.ColumnOptionType.None)
                        delete this.optionalColumns[column];
                    else
                        clmn.Filter = this.ColumnFilterType.None;
                }
                break;
        }

        this.DynamicColumns = {};
        for (var n in this.optionalColumns) {
            var oc = this.optionalColumns[n];
            if (oc.Option != this.ColumnOptionType.None || oc.Filter != this.ColumnFilterType.None)
                this.DynamicColumns[n] = !(oc.Option != this.ColumnOptionType.In || oc.Filter == this.ColumnFilterType.Out);
        }
    },

    Selectable: function (selectable) {
        if (selectable != undefined) {
            Foundation.Controls.List.ViewBase.prototype.Selectable.call(this, selectable);
            this.ChangeColumnOption("Selectable", (selectable ? Foundation.Controls.List.ColumnOptionType.OptIn : Foundation.Controls.List.ColumnOptionType.OptOut));
        }
        else
            return Foundation.Controls.List.ViewBase.prototype.Selectable.call(this);
    },

    TemplateOptions: function () {
        return { DynamicColumns: this.DynamicColumns };
    }
});

Foundation.Controls.Folder = {
    EditAction: {
        Create: 1,
        CreateSub: 2,
        Rename: 3,
        Edit: 4
    },

    HeaderText: Class.define({
        ctor: function (prop) {
            if (prop && prop.Create)
                this.Create = prop.Create;
            else
                this.Create = Resource.Global.Folder_Create;

            if (prop && prop.CreateSub)
                this.CreateSub = prop.CreateSub;
            else
                this.CreateSub = Resource.Global.Folder_Create_Sub;

            if (prop && prop.Rename)
                this.Rename = prop.Rename;
            else
                this.Rename = Resource.Global.Folder_Rename;

            if (prop && prop.Edit)
                this.Edit = prop.Edit;
            else
                this.Edit = Resource.Global.Folder_Edit;
        }
    }),

    NameText: Class.define({
        ctor: function (prop) {
            if (prop && prop.Create)
                this.Create = prop.Create;
            else
                this.Create = Resource.Global.Folder_Name_New;

            if (prop && prop.CreateSub)
                this.CreateSub = prop.CreateSub;
            else
                this.CreateSub = Resource.Global.Folder_Name_New_Sub;

            if (prop && prop.Rename)
                this.Rename = prop.Rename;
            else
                this.Rename = Resource.Global.Folder_Name_New;

            if (prop && prop.Edit)
                this.Edit = prop.Edit;
            else
                this.Edit = Resource.Global.Folder_Name_New;
        }
    })
};

Foundation.Controls.Folder.Edit = Foundation.Controls.Validation.PopupControl.extend({
    ctor: function (headerText, nameText) {
        this.ValidatorOptions = this.ValidatorOptions || {
            rules: {
                folderName: {
                    required: true,
                    maxlength: this.NameLength
                }
            },

            messages: {
                folderName: {
                    required: String.format(Resource.Global.Editor_Error_Enter_X_name, this.EntityName)
                }
            }
        };
        Foundation.Controls.Validation.PopupControl.prototype.ctor.call(this);
        this.FolderId = 0;
        if (this.EntityName == undefined)
            this.EntityName = Resource.Dictionary.Folder;
        this.HeaderText = new Foundation.Controls.Folder.HeaderText(headerText);
        this.NameText = new Foundation.Controls.Folder.NameText(nameText);
        this.$focusCtrl = '#folderName';
    },

    Show: function () {
        Foundation.Controls.Validation.PopupControl.prototype.Show.call(this);
        $('#headerText', this.$container).text(this.FormatText(this.HeaderText));
        $('#nameText', this.$container).text(this.FormatText(this.NameText));
        $('#submit > span', this.$container).first().text(this.FormatAction());
        if (this.Resized) //layout the modal popup
            this.Resized();
    },

    FormatText: function (text) {
        switch (this.Action) {
            case Foundation.Controls.Folder.EditAction.Create:
                return text.Create;
            case Foundation.Controls.Folder.EditAction.CreateSub:
                return text.CreateSub;
            case Foundation.Controls.Folder.EditAction.Rename:
                return text.Rename;
            case Foundation.Controls.Folder.EditAction.Edit:
                return text.Edit;
            default:
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
        }
    },

    FormatAction: function (text) {
        switch (this.Action) {
            case Foundation.Controls.Folder.EditAction.Create:
            case Foundation.Controls.Folder.EditAction.CreateSub:
                return Resource.Action.Create;
            case Foundation.Controls.Folder.EditAction.Rename:
                return Resource.Action.Rename;
            case Foundation.Controls.Folder.EditAction.Edit:
                return Resource.Action.Update;
            default:
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
        }
    },

    Folder: function (folder) {
        if (folder != undefined) {
            this.$folder = folder;
            $('#folderName', this.$container).val(folder.Name);
        }
        else {
            return this.$folder;
        }
    },

    FolderName: function () {
        return $('#folderName', this.$container).val();
    },

    ParentFolder: function (parentFolder) {
        if (parentFolder) {
            this.$parentFolder = parentFolder;
            $('#parentFolderName', this.$container).text(parentFolder.Name).parent('tr').show();
        }
        else if (this.$parentFolder)
            delete this.$parentFolder;
    },

    OnSubmit: function () {
        this.$folder.Name = this.FolderName();
        if (this.Submit)
            this.Submit(this.$folder, this.Action);
    },

    InitCreate: function (folder) {
        this.Action = Foundation.Controls.Folder.EditAction.Create;
        this.ParentFolder(null);
        this.Folder(folder || {
            Id: 0,
            Name: ''
        });
        if (this.InitAction)
            this.InitAction(this.Action);
    },

    InitCreateSub: function (parent, folder) {
        if (parent && parent.Id && parent.Name) {
            this.Action = Foundation.Controls.Folder.EditAction.CreateSub;
            this.ParentFolder(parent);
            //Clone to prevent changes to the original object before validation and saving
            this.Folder({
                Id: 0,
                Name: ''
            });
            if (this.InitAction)
                this.InitAction(this.Action);
        }
        else
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.ValueRequired, "ParentFolder");
    },

    InitEdit: function (folder, parent, rename) {
        if (folder && folder.Id && folder.Name) {
            if (rename)
                this.Action = Foundation.Controls.Folder.EditAction.Rename;
            else
                this.Action = Foundation.Controls.Folder.EditAction.Edit;
            this.ParentFolder(parent);
            //Clone to prevent changes to the original object before validating and saving
            this.Folder($.extend({}, folder));
            if (this.InitAction)
                this.InitAction(this.Action);
        }
        else
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.ValueRequired, "Folder");
    },

    GetErrorMessage: function (error, data) {
        switch (error) {
            case Foundation.ErrorMessageType.Argument_ValueRequired:
                return String.format(Resource.Global.Editor_Error_Enter_X_name, this.EntityName);
            case Foundation.ErrorMessageType.Data_DuplicateRecord:
                return String.format(Resource.Global.Folder_Error_Name_Exists, this.EntityName);
            default:
                return Foundation.Controls.Validation.PopupControl.prototype.GetErrorMessage.call(this, error, data);
        }
    }
});

Foundation.Controls.Folder.List = Foundation.Controls.Control.extend({
    ctor: function (itemsControl) {
        Foundation.Controls.Control.prototype.ctor.call(this);
        this.itemsControl = itemsControl;
    },

    ClearSelection: function () {
    },

    FolderCommand: function (folder) {
        if (folder.Id > 0) {
            this.onFolder(folder, Foundation.List.Folder.SetFolderOptions.UserInitiated);
        }
    },

    Populate: function (folders, selectedFolder, options) {
        this.ClearSelection();
        this.itemsControl.Populate(folders);

        if (!options || (options & Foundation.List.Folder.SetFolderOptions.SuppressEvent) == 0) {
            //var folder = folders.SingleOrDefault(f => f.Id.CompareTo(selectedFolder) == 0);
            var folder = this.Lookup(folders, selectedFolder);
            if (folder)
                this.onFolder(folder, options);
        }
    },

    Lookup: function (folders, id) {
        if (id > 0)
            return folders.singleOrDefault(function (f) { return f.Id == id ? true : false; });
    },

    onFolder: function (folder, options) {
        if (this.SetFolder(folder, options)) {
            this.SelectFolder(folder);
            return true;
        }

        return false;
    },

    SelectFolder: function (folder) {
    }
});

Foundation.Controls.Folder.DropDownList = Foundation.Controls.Folder.List.extend({
    ctor: function () {
        Foundation.Controls.Folder.List.prototype.ctor.call(this, new Foundation.Controls.Layout.ItemsControl());
        this.itemsControl.onItemClick = jQuery.proxy(this.FolderCommand, this);
        this.$visible = true;
    },

    //There's no visible container
    Visible: ObservableProperty('Visible', function () {
        return this.$visible;
    }, function (visible) {
        this.$visible = visible;
    }, { changeDelegate: true }),

    initialize: function (options) {
        this.itemsControl.Initialize(this.$container);
        this.$dropDown = this.parent(Foundation.Controls.Layout.DropDown);
        var $this = this;
        this.VisibleChanged(function (visible) {
            $this.$dropDown.Enabled(visible);
        });
    },

    onFolder: function (folder, options) {
        var result = Foundation.Controls.Folder.List.prototype.onFolder.call(this, folder, options);
        if (options && (options & Foundation.List.Folder.SetFolderOptions.UserInitiated) > 0 && this.$dropDown)
            this.$dropDown.Hide();
        return result;
    }
});

Foundation.Controls.Folder.ListBox = Foundation.Controls.Folder.List.extend({
    ctor: function () {
        Foundation.Controls.Folder.List.prototype.ctor.call(this, new Foundation.Controls.Layout.ListBox());
        var $this = this;
        this.itemsControl.SelectedItem = function (selectedItem) {
            if (selectedItem != undefined) {
                $this.FolderCommand(selectedItem);
            }
            else
                return Foundation.Controls.Layout.ItemSelector.prototype.SelectedItem.call(this);
        }
    },

    initialize: function (options) {
        this.itemsControl.Initialize(this.$container);
    },

    ClearSelection: function () {
        if (this.itemsControl.SelectedItem())
            this.itemsControl.SelectedIndex(-1);
    },

    SelectFolder: function (folder) {
        if (this.itemsControl.SelectedItem() != folder) {
            Foundation.Controls.Layout.ItemSelector.prototype.SelectedItem.call(this.itemsControl, folder);
        }
    }
});

Foundation.Controls.Folder.TreeList = Foundation.Controls.Folder.List.extend({
    ctor: function () {
        Foundation.Controls.Folder.List.prototype.ctor.call(this, new Foundation.Controls.Layout.TreeView());
        var $this = this;
        this.itemsControl.SelectedItem = function (selectedItem) {
            if (selectedItem != undefined) {
                $this.FolderCommand(selectedItem);
            }
            else
                return Foundation.Controls.Layout.ItemSelector.prototype.SelectedItem.call(this);
        }
        this.itemsControl.ItemExpanded = function (folder) {
            $this.ensureSubFolders(folder);
        };
    },

    initialize: function (options) {
        this.itemsControl.Initialize(this.$container);
    },

    Lookup: function (folders, id) {
        if (folders && folders.length > 0 && !(typeof folders[0].ParentId == 'undefined' || typeof folders[0].HasChildren == 'undefined')) {
            if(id > 0)
                return this.lookup(null, folders, id);
        }
        else
            return Foundation.Controls.Folder.List.prototype.Lookup.call(this, folders, id);
    },

    lookup: function (parent, folders, id) {
        var folder = Foundation.Controls.Folder.List.prototype.Lookup.call(this, folders, id);
        if (folder) {
            if (parent && folder.Parent != parent)
                folder.Parent = parent;
            return folder;
        }
        else {
            for (var i = 0, l = folders.length; i < l; i++) {
                if (folders[i].HasChildren && folders[i].Children) {
                    folder = this.lookup(folders[i], folders[i].Children, id);
                    if (folder) {
                        if (parent && folders[i].Parent != parent)
                            folders[i].Parent = parent;
                        return folder;
                    }
                }
            }
        }
    },

    ensureSubFolders: function (folder) {
        if (folder && folder.HasChildren && folder.Children && folder.Children.length == 1 && folder.Children[0].Id == 0) {
            var $this = this;
            this.PopulateSubFolders(folder.Id, 0, function (folders, parentFolder) {
                if (folders && folders.length > 0) {
                    Model.Group.Node.SetParent(folders, folder.Id, folder);
                    folder.Children = folders;
                    var treeViewItem = $this.itemsControl.containerFromItem(folder);
                    if (treeViewItem)
                        treeViewItem.Populate(folders);
                }
            });
        }
    },

    onFolder: function (folder, options) {
        if (folder.Id > 0 && Foundation.Controls.Folder.List.prototype.onFolder.call(this, folder, options)) //ignore children placeholders
        {
            this.ensureSubFolders(folder);
            return true;
        }

        return false;
    },

    ClearSelection: function () {
        if (this.itemsControl.SelectedItem())
            this.itemsControl.SelectedIndex(-1);
    },

    SelectFolder: function (folder) {
        if (this.itemsControl.SelectedItem() != folder) {
            if (folder) {
                this.ExpandFolder(folder.HasChildren ? folder : folder.Parent);
                //this.itemsControl.SelectedItem(folder); Not right as Foundation.Controls.Folder.TreeList.ctor replaces itemsControl.SelectedItem handler
                Foundation.Controls.Layout.TreeView.prototype.SelectedItem.call(this.itemsControl, folder);
            }
            else
                this.itemsControl.SelectedIndex(-1);
        }
    },

    ExpandFolder: function(folder) {
        if (folder) {
            this.ExpandFolder(folder.Parent);
            this.itemsControl.ExpandItem(folder);
        }
    }

    //selectFolder: function (folder, treeViewItem) {
    //    if (!treeViewItem) {
    //        //need to change as containerFromItem will return container at any level (as opposed to SL)
    //        treeViewItem = this.itemsControl.containerFromItem(folder);
    //        if (treeViewItem) {
    //            treeViewItem.Selected(true);
    //            return true;
    //        }
    //        else {
    //            var items = this.itemsControl.Items;
    //            for (var i = 0, l = this.itemsControl.Items.length; i < l; i++) {
    //                treeViewItem = this.itemsControl.containerFromItem(this.itemsControl.Items[i]);
    //                if (treeViewItem && selectFolder(folder, treeViewItem))
    //                    return true;
    //            }
    //        }
    //    }
    //    else {
    //        for (var i = 0, l = treeViewItem.Items.length; i < l; i++) {
    //            var container = treeViewItem.containerFromItem(treeViewItem.Items[i]);
    //            if (container) {
    //                if (item == folder) {
    //                    container.Selected(true);
    //                    treeViewItem.Expanded(true);
    //                    return true;
    //                }
    //                else if (this.selectFolder(folder, container)) {
    //                    treeViewItem.Expanded(true);
    //                    return true;
    //                }
    //            }
    //        }
    //    }
    //    return false;
    //}
});

Foundation.Controls.Folder.TwoLevelList = Foundation.Controls.Folder.List.extend({
});

Foundation.Controls.Folder.TwoLevelSelect = Foundation.Controls.Action.DropDown.extend({
    ctor: function (popup) {
        Foundation.Controls.Action.DropDown.prototype.ctor.call(this, popup);
        this.itemsControl.Template = jQuery.templates(
            '<li data-itemIndex="{{:#index}}">' +
                '<a data-command="ItemCommand">{{:Name}}</a>' +
                '{{if Locked}}<span class="lock"></span>{{/if}}' +
                '{{if HasChildren}}' +
                    '<a class="drillDown" data-command="DownCommand"></a>' +
                '{{/if}}' +
            '</li>');
        var $this = this;
        this.itemsControl.onItemClick = function (item, index, elem) {
            var command = elem.attr('data-command');
            var commandParam = elem.attr('data-commandParam');
            if (commandParam)
                item = item[commandParam];
            if (command && $this[command])
                $this[command](item);
        };
    },

    initialize: function (options) {
        this.$contentContainer.append('<span class="header" style="display:none;"><a class="drillUp" data-command="UpCommand" data-commandParam="ParentFolder"></a><a style="padding: 4px 4px 4px 4px;" data-command="ItemCommand" data-commandParam="ParentFolder"></a><span id="parentLock" class="lock" style="display:none;"></span></span>');
        Foundation.Controls.Action.DropDown.prototype.initialize.call(this, $.extend(options || {}, { wireEvents: true }));
    },

    setParentFolder: function(parentFolder) {
        var header = $('span.header', this.$contentContainer);
        if (parentFolder) {
            this.ParentFolder = parentFolder;
            this.itemsControl.$container.css('margin-left', 20);
            $('a', header).last().text(parentFolder.Name);
            if (Model.Group.Node.IsRootFolder(parentFolder))
                $('.drillUp', header).hide();
            else
                $('.drillUp', header).show();
            if (parentFolder.Locked)
                $('#parentLock', header).show();
            else
                $('#parentLock', header).hide();
            header.show();
        }
        else {
            if (this.ParentFolder)
                delete this.ParentFolder;
            this.itemsControl.$container.css('margin-left', 0);
            header.hide();
        }
    },

    UpCommand: function (folder) {
        if (folder.Parent && folder.ParentId > 0) {
            this.setParentFolder(folder.Parent);
        }
        else {
            this.setParentFolder();
        }
        this.populate(folder.ParentId, folder);
    },

    DownCommand: function (folder) {
        this.setParentFolder(folder);
        this.populate(folder.Id, folder);
    },

    populate: function () {
        var $this = this;
        if (arguments.length == 1 && typeof arguments[0] == "function") {
            var callback = arguments[0];
            this.populateChildren(0, function (folders) {
                if (folders != null)
                    $this.checkRootFolder(0);
                callback(folders);
            });
        }
        else if (arguments.length >= 1 && typeof arguments[0] == "number") {
            var folderId = arguments[0];
            var folder = arguments.length == 2 && typeof arguments[1] == "object" ? arguments[1] : null;
            this.populateChildren(folderId, function (folders) {
                if (folders) {
                    Model.Group.Node.SetParent(folders, folderId, folder);
                    $this.checkRootFolder(folderId);
                    $this.itemsControl.Populate(folders);
                }
            });
        }
   },

    checkRootFolder: function (folderId) {
        if (folderId == 0 && !this.ParentFolder && this._root && this._root.Name)
            this.ParentFolder = { Id: this._root.Id, Name: this._root.Name };
    },

    onItem: function (item, itemType) {
        if (item && item == this.ParentFolder && Model.Group.Node.IsRootFolder(this.ParentFolder))
            itemType = Foundation.Controls.Action.ItemType.Root;
        Foundation.Controls.Action.DropDown.prototype.onItem.call(this, item, itemType);
    },

    populateChildren: function (parentFolder, callback) {
        callback();
    },

    ResetItems: function (resetState) {
        Foundation.Controls.Action.DropDown.prototype.ResetItems.call(this, resetState);
        this.setParentFolder();
    }
});

Foundation.Controls.Search.TextBox_Home = Foundation.Controls.Search.TextBoxBase.extend({
    Container: '<tr>' +
            '<td>' +
                '<input type="text" id="query" style="margin-bottom:15px;min-width:500px;width:100%;" />' +
            '</td>' +
        '</tr>' +
        '<tr>' +
            '<td class="buttonPanel">' +
                '<a id="search" class="button active" data-command="onSearch"><span class="button-content">' + Resource.Action.Search + '</span></a>' +
            '</td>' +
        '</tr>'
});

Foundation.Controls.Search.TextBox = Foundation.Controls.Search.TextBoxBase.extend({
    Initialize: function (container) {
        Foundation.Controls.Search.TextBoxBase.prototype.Initialize.call(this, container);
        var $this = this;
        //Could also use click, but it may be trapped in some handlers
        /*this.document_mousedown = function (e) {
            var pointer = {
                x: e.pageX,
                y: e.pageY
            };
            //http://stackoverflow.com/questions/8597663/jquery-how-to-check-if-the-mouse-is-over-an-element
            //http://formativeinnovations.wordpress.com/2013/05/21/jquery-plugin-is-mouse-inside-bounds/
            //Controls.Image.Add.openImage.buttonMenu
            if (!insideBounds(pointer, toBounds($this.$container)) &&
                (!$this.ClickExclude || !insideBounds(pointer, toBounds($this.ClickExclude)))) {
                $this.$container.removeClass("active");
                $(document).unbind('mousedown', $this.document_mousedown);
            }
        };
        this.ClickExclude = $('#query', this.$container).focus(function () {
            $this.$container.addClass("active");
            $(document).mousedown($this.document_mousedown);
        }).click(function (e) {
            e.stopPropagation();
        });*/
        $("#query", this.$container).on({
            focus: function () {
                $this.$container.addClass("active");
            },
            blur: function () {
                $this.$container.removeClass("active");
            }
        });
    }
});

Foundation.Controls.Search.TextBox_Option = Foundation.Controls.Search.TextBoxBase.extend({
    OptionText: function (optionText) {
        if (optionText)
            this.Option = '<span><input type="checkbox" id="option" />' + optionText + '</span>';
    },

    OptionChecked: TemplateProperty('OptionChecked', function () {
        return $('#option', this.$contentContainer).prop('checked');
    }, function (optionChecked) {
        $('#option', this.$contentContainer).prop('checked', optionChecked);
    }),

    Initialize: function (container) {
        if (this.Option) //ramework.Controls.Control.Initialize may call OptionChecked.Apply
            this.$contentContainer = $(this.Option);
        Foundation.Controls.Search.TextBoxBase.prototype.Initialize.call(this, container, this.$contentContainer);
        if (this.$contentContainer) {
            var $this = this;
            this.$dropDown._popupHelper.ClickExclude = $('#query', this.$container).focus(function () {
                $this.$dropDown.Show();
            }).click(function (e) {
                e.stopPropagation();
            });
        }
    }
});

Foundation.Controls.Search.Context = Foundation.Controls.Control.extend({
    Container: '<span></span>',

    Template: $.templates(
        '<a class="href reverse" data-command="Reset">{{:Text}}</a>'
    ),

    Text: function (text) {
        if (!String.isNullOrWhiteSpace(text)) {
            this.applyTemplate({ Text: text });
        }
    }
});

Foundation.Controls.Location.Current = Foundation.Controls.Group.Current.extend({
    ctor: function () {
        Foundation.Controls.Control.prototype.ctor.call(this);
        this.$select = new Foundation.Controls.Group.Select(User.Service.Master.Location);
        this.$select.ShowNested = false;
        this.$select.CanSelectSuper = true;
        if (this._root)
            this.$select.Root(this._root);
        var $this = this;
        this.$select.GroupSelected = function (location) {
            if (Session.User.LocationId != location.Id) {
                Session.User.LocationId = location.Id;
                if (!$this.Change || !$this.Change(location))
                    $.when($this.populate(location.Id)).then(function () {
                        $this.notifyPopulated(location, true); //Used to set Title and Keywords
                    });
            }
        };
        if (Settings.Location.Country > 0)
        {
            User.Service.Master.Location.Get(Settings.Location.Country, function (country) {
                $this.Root({ 
                    Id: country.Id, 
                    Name: country.Name
                });
            });
        }
        else
            this.Root({
            Id: 0,
            Name: Resource.Dictionary.Everywere
        });
    },

    Initialize: function (container) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container);
        if (container.css('display') == 'none')
            container.show();
        this.Populate(Session.User.LocationId);
    },

    Populate: function (locationId) {
        //defer _select.Populate and reset location to 0 if this.populate fails
        var $this = this;
        $.when(this.populate(locationId)).then(function () {
            $.when($this.$select.Populate(locationId)).then(function () {
                $this.notifyPopulated(null, true); //Used to set Title and Keywords
            });
        }, function () {
            if (locationId != Settings.Location.Country) {
                Session.User.LocationId = Settings.Location.Country;
                $this.populate(Session.User.LocationId);
                $.when($this.$select.Populate(Session.User.LocationId)).then(function () {
                    $this.notifyPopulated(null, true); //Used to set Title and Keywords
                });
            }
        });
    },

    changeLocation: function () {
        this.$select.Show();
    }
});

System.Type.RegisterNamespace('Foundation.Controls.Category');
Foundation.Controls.Category.Current = Foundation.Controls.Group.Current.extend({
    ctor: function () {
        Foundation.Controls.Control.prototype.ctor.call(this);
        this.$select = new Foundation.Controls.Group.Select(User.Service.Master.Category);
        if (this._root)
            this.$select.Root(this._root);
        var $this = this;
        this.$select.GroupSelected = function (category) {
            if (Session.User.CategoryId != category.Id) {
                Session.User.CategoryId = category.Id;
                if (!$this.Change || !$this.Change(category))
                    $.when($this.populate(category.Id)).then(function () {
                        $this.notifyPopulated(category, true); //Used to set Title and Keywords
                    });
            }
        };
        this.Root({
            Id: 0,
            Name: Resource.Global.Category_All
        });
    },

    Initialize: function (container) {
        Foundation.Controls.Control.prototype.Initialize.call(this, container);
        if (container.css('display') == 'none')
            container.show();
        this.Populate(Session.User.CategoryId);
    },

    Populate: function (categoryId) {
        //defer _select.Populate and category to  0 as if populate fails
        var $this = this;
        $.when(this.populate(categoryId)).then(function () {
            $.when($this.$select.Populate(categoryId)).then(function () {
                $this.notifyPopulated(null, true); //Used to set Title and Keywords
            });
        }, function () {
            if (categoryId != 0) {
                Session.User.CategoryId = 0;
                $this.populate(Session.User.CategoryId);
                $.when($this.$select.Populate(Session.User.CategoryId)).then(function () {
                    $this.notifyPopulated(null, true); //Used to set Title and Keywords
                });
            }
        });
    },

    changeCategory: function () {
        this.$select.Show();
    }
});

System.Type.RegisterNamespace('Foundation.Controls.Community');
Foundation.Controls.Community.ListView = Foundation.Controls.List.View.extend({
    Container: '<table class="preview" style="width:100%">' +
               '<tbody></tbody>' +
               '</table>',

    ForumsVisibilityConverter: function (community) {
        if (community.Options.Open_To_View ||
           (community.Membership && community.Membership.Type > 0) ||
           (community.MembershipRequest && !community.MembershipRequest.Invitation)) {
            return true;
        }
    },

    ProductsVisibilityConverter: function (community) {
        if (community.Options.Post_Products && (community.Options.Open_To_View ||
           (community.Membership && community.Membership.Type > 0) ||
           (community.MembershipRequest && !community.MembershipRequest.Invitation)))
        {
            return true;
        }
    },

    ItemViewCommand: function (community) {
        Navigation.Community.ProfileView(community.Id);
    },

    ForumsCommand: function (community) {
        if (community.Membership) {
            if (community.Membership.Type == Model.Community.MemberType.Owner ||
                community.Membership.Type == Model.Community.MemberType.Moderator) {
                var business = Session.User.Business.Id;
                Navigation.Community.TopicsEdit(community.Business && business > 0 && community.Business.Id == business ? Model.AccountType.Business : Model.AccountType.Personal, community.Id);
            }
            /*else if (community.Options.Allow_Members_CreateForums && community.Membership.Type == Model.Community.MemberType.Member)
                Navigation.Community.TopicsEdit(Model.AccountType.Personal, community.Id);*/
            else if (community.Membership.Type > 0)
                Navigation.Community.TopicsView(community.Id);
        }
        else if (Session.User.Id > 0) {
            Admin.Service.Community.Profile.Get(community.Id, function (cachedCommunity) {
                if (cachedCommunity) {
                    if (Admin.Service.Community.Profile.CanManageInner(cachedCommunity)) {
                        var business = Session.User.Business.Id;
                        Navigation.Community.TopicsEdit(community.Business && business > 0 && community.Business.Id == business ? Model.AccountType.Business : Model.AccountType.Personal, community.Id);
                    }
                    else if (Admin.Service.Community.Profile.IsMember(cachedCommunity)) {
                        /*if (cachedCommunity.Allow_Members_CreateForums)
                            Navigation.Community.TopicsEdit(Model.AccountType.Personal, community.Id);
                        else*/
                            Navigation.Community.TopicsView(community.Id);
                    }
                    else if (community.Options.Open_To_View)
                        Navigation.Community.TopicsView(community.Id);
                }
                else if (community.Options.Open_To_View)
                    Navigation.Community.TopicsView(community.Id);
            });
        }
        else if (community.Options.Open_To_View)
            Navigation.Community.TopicsView(community.Id);
    },

    ProductsCommand: function (community) {
        if (community.Options.Post_Products) {
            if (community.Membership) {
                if (community.Membership.Type == Model.Community.MemberType.Owner ||
                    community.Membership.Type == Model.Community.MemberType.Moderator) {
                    var business = Session.User.Business.Id;
                    Navigation.Community.ProductsEdit(community.Business && business > 0 && community.Business.Id == business ? Model.AccountType.Business : Model.AccountType.Personal, community.Id);
                }
                    /*else if (community.Options.Allow_Contributors_ManageCategories && community.Membership.Type == Model.Community.MemberType.Content_Producer)
                    Navigation.Community.ProductsEdit(Model.AccountType.Personal, community.Id);*/
                else if (community.Membership.Type > 0 && community.Options.Post_Products)
                    Navigation.Community.ProductsView(community.Id);
            }
            else if (Session.User.Id > 0) {
                Admin.Service.Community.Profile.Get(community.Id, function (cachedCommunity) {
                    if (cachedCommunity) {
                        if (Admin.Service.Community.Profile.CanManageInner(cachedCommunity)) {
                            var business = Session.User.Business.Id;
                            Navigation.Community.ProductsEdit(community.Business && business > 0 && community.Business.Id == business ? Model.AccountType.Business : Model.AccountType.Personal, community.Id);
                        }
                            /*else if (Admin.Service.Community.Profile.CanProduce(cachedCommunity) && cachedCommunity.Allow_Contributors_ManageCategories)
                                Navigation.Community.ProductsEdit(Model.AccountType.Personal, community.Id);*/
                        else if ((Admin.Service.Community.Profile.CanProduce(cachedCommunity) || Admin.Service.Community.Profile.IsMember(cachedCommunity) || community.Options.Open_To_View) && community.Options.Post_Products)
                            Navigation.Community.ProductsView(community.Id);
                    }
                    else if (community.Options.Open_To_View && community.Options.Post_Products)
                        Navigation.Community.ProductsView(community.Id);
                });
            }
            else if (community.Options.Open_To_View)
                Navigation.Community.ProductsView(community.Id);
        }
    },

    MapCommand: function (community) {
        var location = community.Location;
        if (location && location.Address) {
            var marker = { Address: location.Address, PlaceName: community.Name };
            if (location.Geolocation)
                marker.Geolocation = location.Geolocation;
            Foundation.Controls.Geocoder.ShowMap(Foundation.Controls.Geocoder.MapType.View, JSON.stringify(marker));
        }
    },

    TemplateOptions: function () {
        var options = Foundation.Controls.List.View.prototype.TemplateOptions.call(this);
        options.isNullOrWhiteSpace = String.isNullOrWhiteSpace;
        options.Stringify = Service.Geocoder.Stringify;
        options.ForumsVisible = this.ForumsVisibilityConverter;
        options.ProductsVisible = this.ProductsVisibilityConverter;
        options.Settings = Settings;
        return options;
    }
});

System.Type.RegisterNamespace('Foundation.Controls.Community.Category');
Foundation.Controls.Community.Category.TwoLevelSelect = Foundation.Controls.Folder.TwoLevelSelect.extend({
    ctor: function (popup) {
        Foundation.Controls.Folder.TwoLevelSelect.prototype.ctor.call(this, popup);
        this.$comunity = 0;
    },

    Addressee: function() {
        return Session.User.Id;
    },

    Type: function () {
        return Foundation.Controls.Action.Type.Self;
    },

    Community: function (community) {
        if (community != undefined) {
            if (this.$comunity != community) {
                this.$comunity = community;
            }
        }
        else
            return this.$comunity;
    },

    //parentFolder: function(category, callback)
    //{
    //    Admin.Service.Community.Category.GetParent(this.Community(), category, callback);
    //},

    populateChildren: function (parentCategory, callback) {
        Admin.Service.Community.Category.GetCategories(this.Community(), parentCategory, callback);
    }
});

Foundation.Controls.Geocoder = {
    MapType: {
        View: "View",
        Entry: "Entry"
    },

    ShowMap: function (type, location) {
        var url = String.format("/map/{0}?{1}", type.toLowerCase(), encodeURIComponent(location));
        windowOpen(url, 645, type == "Entry" ? 550 : 500); //+15 for address bar
    }
};

//http://www.barneyparker.com/world-simplest-html5-wysisyg-inline-editor/
System.Type.RegisterNamespace('Foundation.Controls.RichText');
//Popup logic similar to Foundation.Controls.Search.TextBox_Option
Foundation.Controls.RichText.Editor = Foundation.Controls.Control.extend({
    Container: '<div class="rte tabControl bottom"></div>',

    EditTabTemplate: '<div class="fill-content-wrap">' +
        '<div id="toolbar" class="fill-header rte-toolbar">' +
            '<div class="rte-tb-standalone">' +
                '<button id="bold" class="rte-button active toggle" data-command="Bold"><span class="rte-button-content" style="font-weight: bold;">' + Resource.Global.RTE_B + '</span></button>' +
                '<button id="italic" class="rte-button active toggle" data-command="Italic"><span class="rte-button-content" style="font-style: italic;">' + Resource.Global.RTE_I + '</span></button>' +
                '<button id="underline" class="rte-button active toggle" data-command="Underline"><span class="rte-button-content" style="text-decoration: underline;">' + Resource.Global.RTE_U + '</span></button>' +
            '</div>' +
            '<div class="rte-tb-standalone">' +
            '<button id="fontFamily" class="rte-button active" data-command="FontFamily"><span class="rte-button-content">' + Resource.Global.RTE_Font + '</span><span class="rte-button-content">▼</span></button>' + //&#9660;
            '<button id="fontSize" class="rte-button active" data-command="FontSize"><span class="rte-button-content">' + Resource.Global.RTE_Size + '</span><span class="rte-button-content">▼</span></button>' + //&#9660;
            '<button id="fontColor" class="rte-button active" data-command="FontColor"><span class="rte-button-content rte-color-box" style="background-color:#000000;"></span><span class="rte-button-content">▼</span></button>' + //&#9660;
            '</div>' +
            '<div class="rte-tb-standalone">' +
                '<button id="justifyLeft" class="rte-button active toggle" data-command="JustifyLeft"><span class="rte-button-content rte-button-image"></span></button>' +
                '<button id="justifyCenter" class="rte-button active toggle" data-command="JustifyCenter"><span class="rte-button-content rte-button-image" style="background-position: 0 -16px;"></span></button>' +
                '<button id="justifyRight" class="rte-button active toggle" data-command="JustifyRight"><span class="rte-button-content rte-button-image" style="background-position: 0 -32px;"></span></button>' +
            '</div>' +
            '<div class="rte-tb-standalone">' +
            '<button id="hyperlink" class="rte-button active" data-command="Hyperlink" placeholder="' + Resource.Global.RTE_InsertHyperlink_Hint + '"><span class="rte-button-content rte-button-image" style="background-position: 0 -48px;"></span></button>' +
            '<button id="image" class="rte-button active" data-command="Image" placeholder="' + Resource.Global.RTE_InsertImage_Hint + '"><span class="rte-button-content rte-button-image" style="background-position: 0 -64px;"></span></button>' +
            '<button id="pasteTag" class="rte-button active" data-command="PasteTag" placeholder="' + Resource.Global.RTE_PasteTag_Hint + '"><span class="rte-button-content rte-button-image" style="background-position: 0 -80px;"></span></button>' +
            '</div>' +
            //'<button id="test" class="rte-tb-standalone rte-button active" data-command="Test"><span class="rte-button-content">Tst</span></button>' +
        '</div>' +
        '<div id="wysiwyg" class="fill-content-bottom rte-wysiwyg" contenteditable></div>' +
    '</div>',

    ctor: function (options) {
        this.editorTabs = new Foundation.Controls.Layout.TabControl();

        var doc = document || window.contentDocument || window.document;
        var win = window;
        var isW3C = !!window.getSelection;
        var _isOwner = function (range) {
            var parent;

            // IE fix to make sure only return selections that are part of the WYSIWYG iframe
            return (range && range.parentElement && (parent = range.parentElement())) ?
                parent.ownerDocument === doc :
                true;
        };

        this.rangeHelper = new (Class.define({
            compare: function (rangeA, rangeB) {
                if (!rangeB)
                    rangeB = this.selectedRange();

                if (!rangeA || !rangeB)
                    return !rangeA && !rangeB;

                if (!isW3C) {
                    return _isOwner(rangeA) && _isOwner(rangeB) &&
                        rangeA.compareEndPoints('EndToEnd', rangeB) === 0 &&
                        rangeA.compareEndPoints('StartToStart', rangeB) === 0;
                }

                return rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB) === 0 &&
                    rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB) === 0;
            },

            compareSelection: function(rangeA, rangeB) {
                rangeB = rangeB || this.selectedRange();

                if(!rangeA || !rangeB)
                    return !rangeA && !rangeB;

                if (!isW3C)
                {
                    return _isOwner(rangeA) && _isOwner(rangeB) &&
                        rangeA.compareEndPoints('EndToEnd', rangeB)  === 0 &&
                        rangeA.compareEndPoints('StartToStart', rangeB) === 0;
                }

                return rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB)  === 0 &&
                    rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB) === 0;
            },

            selectRange: function(range) {
                if(isW3C)
                {
                    win.getSelection().removeAllRanges();
                    win.getSelection().addRange(range);
                }
                else
                    range.select();
            },

            selectedRange: function ()
            {
                var	range, firstChild,
                    sel = isW3C ? win.getSelection() : doc.selection;

                if(!sel)
                    return;

                // When creating a new range, set the start to the body
                // element to avoid errors in FF.
                if(sel.getRangeAt && sel.rangeCount <= 0)
                {
                    firstChild = doc.body;
                    while(firstChild.firstChild)
                        firstChild = firstChild.firstChild;

                    range = doc.createRange();
                    range.setStart(firstChild, 0);
                    sel.addRange(range);
                }

                if (isW3C)
                    range = sel.getRangeAt(0);

                if (!isW3C && sel.type !== 'Control')
                    range = sel.createRange();

                // IE fix to make sure only return selections that are part of the WYSIWYG iframe
                return _isOwner(range) ? range : null;
            },

            cloneSelected: function() {
                var range = this.selectedRange();

                if(range)
                    return isW3C ? range.cloneRange() : range.duplicate();
            },

            parentNode: function () {
                var range = this.selectedRange();

                if (range) {
                    return range.parentElement ? range.parentElement() : range.commonAncestorContainer;
                }
            },

            hasSelection: function() {
                var	range,
                    sel = isW3C ? win.getSelection() : doc.selection;

                if(isW3C || !sel)
                    return sel && sel.rangeCount > 0;

                range = sel.createRange();

                return range && _isOwner(range);
            },

            selectedHtml: function (range) {
                var	div,
                    range = range || this.selectedRange();

                if(!range)
                    return '';

                // IE < 9
                if(!isW3C && range.text !== '' && range.htmlText)
                    return range.htmlText;

                // IE9+ and all other browsers
                if(isW3C)
                {
                    div = doc.createElement('div');
                    div.appendChild(range.cloneContents());

                    return div.innerHTML;
                }

                return '';
            },

            insertHTML: function(html, endHTML) {
                var	node, div,
                    range = this.selectedRange();

                if(endHTML)
                    html += this.selectedHtml() + endHTML;

                if (isW3C)
                {
                    div = doc.createElement('div');
                    node = doc.createDocumentFragment();
                    div.innerHTML = html;

                    while(div.firstChild)
                        node.appendChild(div.firstChild);

                    this.insertNode(node);
                }
                else
                {
                    if(!range)
                        return false;

                    range.pasteHTML(html);
                }
            },

            //The same as insertHTML except with DOM nodes instead
            insertNode: function(node, endNode) {
                if (isW3C)
                {
                    var	selection, selectAfter,
                        toInsert = doc.createDocumentFragment(),
                        range    = this.selectedRange();

                    if(!range)
                        return false;

                    toInsert.appendChild(node);

                    if(endNode)
                    {
                        toInsert.appendChild(range.extractContents());
                        toInsert.appendChild(endNode);
                    }

                    selectAfter = toInsert.lastChild;

                    // If the last child is undefined then there is nothing to insert so return
                    if(!selectAfter)
                        return;

                    range.deleteContents();
                    range.insertNode(toInsert);

                    selection = doc.createRange();
                    selection.setStartAfter(selectAfter);
                    this.selectRange(selection);
                }
                else
                    this.insertHTML(node.outerHTML, endNode?endNode.outerHTML:null);
            }
        }))();

        //Moved to RichText.js
        /*this.domHelper = new (Class.define({
            blockLevelList: '|body|hr|p|div|h1|h2|h3|h4|h5|h6|address|pre|form|table|tbody|thead|tfoot|th|tr|td|li|ol|ul|blockquote|center|',

            isInline: function (elm, includeCodeAsBlock) {
                if (!elm || elm.nodeType !== 1)
                    return true;

                elm = elm.tagName.toLowerCase();

                if (elm === 'code')
                    return !includeCodeAsBlock;

                return this.blockLevelList.indexOf('|' + elm + '|') < 0;
            }
        }))();*/

        this.hyperlinkForm = new (Foundation.Controls.Popup.FormBase.extend({
            Template: jQuery.templates(
            '<form action="">' +
                '<div class="content">' +
                    '<table class="form"><tbody>' +
                        //'<tr>' +
                        //    '<td class="label"><label for="text">' + Resource.Dictionary.Text + '</label></td>' +
                        //    '<td class="value"><input type="text" id="text" name="text" style="width:150px;" /></td>' +
                        //'</tr>' +
                        '<tr>' +
                            '<td class="label"><label for="url">' + Resource.Dictionary.Url + '</label></td>' +
                            '<td class="value"><input type="text" id="url" name="url" style="width:250px;" placeholder="' + Resource.Global.Url_Http + '" /></td>' +
                        '</tr>' +
                    '</tbody></table>' +
                    '<span id="error" class="formError" style="display:none;"></span>' +
                '</div>' +
                '<div class="footer buttonPanel right">' +
                    '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Ok + '</span></a>' +
                    '&nbsp;&nbsp;' +
                    '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
                '</div>' +
            '</form>'
            ),

            ValidatorOptions: {
                rules: {
                    //text: "required",
                    url: "required"
                },

                messages: {
                    //text: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Text),
                    url: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Url)
                }
            },

            Reset: function () {
                if (this.$container) {
                    $('#text', this.$container).val('');
                    $('#url', this.$container).val('');
                }
            }
        }))();

        this.imageForm = new (Foundation.Controls.Popup.FormBase.extend({

            Template: jQuery.templates(
            '<form action="">' +
                '<div class="content">' +
                    '<table class="form"><tbody>' +
                        '<tr>' +
                            '<td class="label"><label for="url">' + Resource.Dictionary.Url + '</label></td>' +
                            '<td class="value"><input type="text" id="url" name="url" style="width:250px;" placeholder="' + Resource.Global.Url_Http + '" /></td>' +
                        '</tr>' +
                    '</tbody></table>' +
                    '<span id="error" class="formError" style="display:none;"></span>' +
                '</div>' +
                '<div class="footer buttonPanel right">' +
                    '<a id="submit" data-command="Submit" class="button active"><span class="button-content">' + Resource.Action.Ok + '</span></a>' +
                    '&nbsp;&nbsp;' +
                    '<a id="cancel" data-command="Cancel" class="button active"><span class="button-content">' + Resource.Action.Cancel + '</span></a>' +
                '</div>' +
            '</form>'
            ),

            ValidatorOptions: {
                rules: {
                    url: "required"
                },

                messages: {
                    url: String.format(Resource.Global.Editor_Error_Enter_X, Resource.Dictionary.Url)
                }
            },

            Reset: function () {
                if (this.$container) {
                    $('#url', this.$container).val('');
                }
            }
        }))();

        this.richText = new Foundation.RichText(/*this.domHelper*/);
    },

    Show: function (options) {
        options = options || {};
        if (!this.$showInitialized) {
            var tabPanelHeight = this.editorTabs.$itemsContainer.outerHeight();
            if (options.zIndex) //Set to 1 by default in Form.css
                $('div.tabPanel > ul', this.editorTabs.$container).css('zIndex', options.zIndex + 1);
            this.editorTabs.$contentContainer.css('bottom', tabPanelHeight + 1);
            var toolbarHeight = this.$toolbarContainer.outerHeight();
            this.$wysiwygContainer.css('top', toolbarHeight);
            resizeable(this.$container, {
                resizeHeight: true, 
                resizeWidth: true,
                zIndex: options.zIndex
            });
            this.$showInitialized = true;
        }
        if (options.focus)
            this.prepareCommand();
    },

    updateToggle: function (button, pressed) {
        if (pressed === true) {
            button.addClass("pressed");
        } else if (pressed === false) {
            button.removeClass("pressed");
        }
    },

    Bold: function (bold) {
        this.updateToggle($('#bold', this.$toolbarContainer), bold);
    },

    Italic: function (italic) {
        this.updateToggle($('#italic', this.$toolbarContainer), italic);
    },

    Underline: function (underline) {
        this.updateToggle($('#underline', this.$toolbarContainer), underline);
    },

    JustifyLeft: function (justifyLeft) {
        this.updateToggle($('#justifyLeft', this.$toolbarContainer), justifyLeft);
    },

    JustifyCenter: function (justifyCenter) {
        this.updateToggle($('#justifyCenter', this.$toolbarContainer), justifyCenter);
    },

    JustifyRight: function (justifyRight) {
        this.updateToggle($('#justifyRight', this.$toolbarContainer), justifyRight);
    },

    showPopup: function (popupHelper) {
        if (popupHelper.Show()) {
            this._popupHelper = popupHelper;
        }
    },

    hidePopup: function (popupHelper) {
        popupHelper.Hide();
        delete this._popupHelper;
    },

    //http://www.w3schools.com/cssref/pr_font_font-size.asp
    convertSize: function (size) {
        if (typeof size === "number") {
            switch (size) {
                case 1:
                    return "xx-small";
                default:
                case 2:
                    return "x-small";
                case 3:
                    return "small";
                case 4:
                    return "medium";
                case 5:
                    return "large";
                case 6:
                    return "x-large";
                case 7:
                    return "xx-large";
            }
        }
        else if (typeof size === "string") {
            switch (size) {
                case "xx-small":
                    return 1;
                default:
                case "x-small":
                    return 2;
                case "small":
                    return 3;
                case "medium":
                    return 4;
                case "large":
                    return 5;
                case "x-large":
                    return 6;
                case "xx-large":
                    return 7;
            }
        }
    },

    Initialize: function (container, options) {
        options = options || {};
        options.font = options.font || {};
        options.font.Families = options.font.Families || Foundation.RichText.FontStyle.Families;
        options.font.Sizes = options.font.Sizes || Foundation.RichText.FontStyle.XSizes;
        options.font.Colors = options.font.Colors || Foundation.RichText.FontStyle.Colors;
        //options.tmplData = {};
        Foundation.Controls.Control.prototype.Initialize.call(this, container, options);

        this.$container.css({
            width: options.width || 500,
            height: options.height || 200
        });

        this.editorTabs.Initialize(this.$container);
        var editorTab = new Foundation.Controls.Layout.TabItem($(this.EditTabTemplate));
        editorTab.Header = "<span>" + Resource.Action.Edit + "</span>";
        this.editorTabs.AddTab(editorTab, {
            addClass: "white"
        });
        var markupTab = new Foundation.Controls.Layout.TabItem($('<div id="markup" class="fill-parent rte-markup"></div>')); //<textarea id="markup" class="fill-parent"></textarea>
        markupTab.Header = "<span>" + Resource.Global.RTE_Markup + "</span>";
        this.editorTabs.AddTab(markupTab, {
            addClass: "white" //transparent
        });
        this.editorTabs.SelectedItem = function (selectedItem, selectedIndex) {
            if (selectedItem != undefined) {
                Foundation.Controls.Layout.ItemSelector.prototype.SelectedItem.call(this, selectedItem, selectedIndex);
                switch (selectedIndex) {
                    case 1:
                        try {
                            $this.$markupContainer.text($this.Html());
                        }
                        catch (e) {
                            $this.$markupContainer.text(errorMessage(e) + '\n' + $this.$wysiwygContainer.html());
                        }
                        break;
                }
            }
            else
                return Foundation.Controls.Layout.ItemSelector.prototype.SelectedItem.call(this);
        };

        this.$toolbarContainer = $('#toolbar', this.$container);
        this.$wysiwygContainer = $('#wysiwyg', this.$container);
        this.$markupContainer = $('#markup', this.$container);
        this.$editor = document/*this.$wysiwygContainer[0]*/;
        try {
            this.$editor.execCommand('defaultParagraphSeparator', false, 'p'); //http://stackoverflow.com/questions/2735672/how-to-change-behavior-of-contenteditable-blocks-after-on-enter-pressed-in-vario
        }
        catch (e) { }

        var $this = this;
        this.$wysiwygContainer.bind('focus blur mouseup click', function () {
            if (!$this.currentSelection || !$this.rangeHelper.compare($this.currentSelection)) {
                $this.$wysiwygContainer.trigger($.Event('selectionchanged'));
            }
        }).bind('selectionchanged', function (e) {
            $this.wysiwyg_SelectionChanged(e);
        }).focus(function () {
            $this.$editor.execCommand('formatBlock', false, 'p');
        }).bind('paste', function (e) {
            //http://stackoverflow.com/questions/6035071/intercept-paste-event-in-javascript
            try {
                var pastedText = undefined;
                if (window.clipboardData && window.clipboardData.getData) { // IE
                    pastedText = window.clipboardData.getData('Text');
                } else if (e.clipboardData && e.clipboardData.getData) {
                    pastedText = e.clipboardData.getData('text/plain'); //'text/html'
                }
                if (pastedText) { // Process and handle text...
                    $this.rangeHelper.insertHTML($this.richText.escapeEntites(pastedText));
                }
            }
            catch (e) {
                this.$wysiwygContainer/*$this.$markupContainer*/.text(errorMessage(e) + '\n' + $this.$wysiwygContainer.html());
            }
            return false; // Prevent the default handler from running.
        });
        this.$toolbarContainer.delegate('button', 'click', function (e) {
            var elem = $(this);
            var command = elem.attr('data-command');
            $this.onCommand(command, null, elem);
            return false;
        });

        var fontFamilies = options.font.Families;
        var fontFamily = $("#fontFamily", this.$toolbarContainer);
        this.fontFamily = $('span', fontFamily).first();
        this.$fontFamilyContainer = $('<div style="font-size:15px;"></div>');
        this.$fontFamilyContainer.delegate('a', 'click', function (e) {
            var font = $(this).attr('data-font');
            if (font) {
                $this.applyFormatting("fontName", font, true, true);
                //$this.fontFamily.text(font);
            }
            $this.hidePopup($this.$fontFamilyPopupHelper);
            return false;
        });
        for (var i = 0, l = fontFamilies.length; i < l; i++) {
            this.$fontFamilyContainer.append($('<a class="rte-font-opt href">' + fontFamilies[i] + '</a>').css('font-family', fontFamilies[i]).attr('data-font', fontFamilies[i]));
        };
        this.$fontFamilyPopup = new Foundation.Controls.Layout.Popup(this, 'dropDownPopup');
        this.$fontFamilyPopup.Initialize(this.$fontFamilyContainer);
        this.$fontFamilyPopupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$fontFamilyPopup, fontFamily);

        var fontSizes = options.font.Sizes;
        var fontSize = $('#fontSize', this.$toolbarContainer);
        this.fontSize = $('span', fontSize).first();
        this.$fontSizeContainer = $('<div></div>');
        this.$fontSizeContainer.delegate('a', 'click', function (e) {
            var size = $(this).attr('data-size');
            if (size) {
                $this.applyFormatting("fontSize", size, true, true);
                //$this.fontSize.text(size);
            }
            $this.hidePopup($this.$fontSizePopupHelper);
            return false;
        });
        for (var i = 0, l = fontSizes.length; i < l; i++) {
            this.$fontSizeContainer.append($('<a class="rte-font-opt href">' + fontSizes[i] + '</a>').css('font-size', this.convertSize(fontSizes[i])).attr('data-size', fontSizes[i]));
        };
        this.$fontSizePopup = new Foundation.Controls.Layout.Popup(this, 'dropDownPopup');
        this.$fontSizePopup.Initialize(this.$fontSizeContainer);
        this.$fontSizePopupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$fontSizePopup, fontSize);

        var fontColors = options.font.Colors;
        var fontColor = $('#fontColor', this.$toolbarContainer);
        this.fontColor = $('span', fontColor).first();
        this.$fontColorContainer = $('<div style="max-width: 160px;"></div>');
        this.$fontColorContainer.delegate('a', 'click', function (e) {
            var color = $(this).attr('data-color');
            if (color) {
                $this.applyFormatting("foreColor", color, true, true);
                //$this.fontColor.css('background-color', color);
            }
            $this.hidePopup($this.$fontColorPopupHelper);
            return false;
        });
        for (var i = 0, l = fontColors.length; i < l; i++) {
            this.$fontColorContainer.append($('<a class="rte-color-box"/>').css('background-color', fontColors[i]).attr('data-color', fontColors[i]));
        };
        this.$fontColorPopup = new Foundation.Controls.Layout.Popup(this, 'dropDownPopup');
        this.$fontColorPopup.Initialize(this.$fontColorContainer);
        this.$fontColorPopupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$fontColorPopup, fontColor);

        this.hyperlinkForm.Show = function () {
            Foundation.Controls.Validation.PopupControl.prototype.Show.call(this);
            try {
                //var current = $this.currentNode();
                var anchor = $this.currentNode('a');

                //var text = anchor.length ? anchor.text() : current.length ? current.text() : null;
                //if (text)
                //    $('#text', this.$container).val(text)
                if (anchor.length)
                    $('#url', this.$container).val(anchor.attr('href'));
            }
            catch (e) {
                this.Invalidate(e);
            }
        };

        this.hyperlinkForm.Submit = function () {
            try
            {
                var anchor = $this.currentNode('a');

                var text = $('#text', this.$container).val();
                var url = $('#url', this.$container).val();
                if (url && url !== 'http://') {
                    if (!anchor.length) {
                        var insertHtml = false;
                        var selectedText = $this.rangeHelper.selectedHtml($this.$currentRange);
                        if (!selectedText || text) {
                            insertHtml = true;
                        }
                        if (!insertHtml && $this.applyFormatting("createlink", url, true)) {
                            anchor = $this.currentNode('a', $this.rangeHelper.parentNode());
                            if (url[0] != '/')
                                anchor.attr('target', '_blank');
                            $this.saveSelection(true);
                        }
                        /*else { //doesn't quite work in IE8 - inserts at position 0
                            $this.insertHyperlink({
                                url: url,
                                text: text || selectedText || url
                            }, insertHtml);
                        }*/
                    } else {
                        //update text
                        anchor.attr('href', url);
                    }
                }

                this.Reset();
                this.SubmitComplete();
            }
            catch (e) {
                this.Invalidate(e);
            }
        };

        this.imageForm.Show = function () {
            Foundation.Controls.Validation.PopupControl.prototype.Show.call(this);
            try {
                var image = $this.currentNode('img');

                if (image.length)
                    $('#url', this.$container).val(image.attr('src'));
            }
            catch (e) {
                this.Invalidate(e);
            }
        };

        this.imageForm.Submit = function () {
            try {
                var image = $this.currentNode('img');

                var url = $('#url', this.$container).val();
                if (url && url !== 'http://') {
                    if (!image.length) {
                        if ($this.applyFormatting("insertImage", url, true)) {
                            //set image attr
                            $this.saveSelection(true);
                        }
                        /*else { //doesn't quite work in IE8 - inserts at position 0
                            $this.insertImage({
                                url: url
                            }, false);
                        }*/
                    } else {
                        image.attr('src', url);
                    }
                }

                this.Reset();
                this.SubmitComplete();
            }
            catch (e) {
                this.Invalidate(e);
            }
        };

        /*var test = $('#test', this.$toolbarContainer);
        this.$testContainer = $('<div><input type="text" /><button id="ok">Ok</buttom></div>');
        this.$testPopup = new Foundation.Controls.Layout.Popup(this, 'dropDownPopup');
        this.$testPopup.Initialize(this.$testContainer);
        this.$testPopupHelper = new Foundation.Controls.Layout.PopupHelperNoOverlay(this.$testPopup, test);
        $('#ok', this.$testContainer).click(function () {
            $this.rangeHelper.selectRange($this.$currentRange);
            $this.$wysiwygContainer.focus();
            var success = $this.$editor.execCommand("createlink", false, "http://google.com");
            $this.$testPopupHelper.Hide();
        });*/
    },

    Html: function (html) {
        if (html != undefined) {
            this.$wysiwygContainer.html(html);
            //http://stackoverflow.com/questions/13893908/jquery-div-when-all-images-loaded
            var loadedImages = 0;
            var images = $('img', this.$wysiwygContainer);
            if (images.length) {
                var $this = this;
                images.load(function () {
                    if (++loadedImages >= images.length)
                        $this.expandToContent();
                });
            }
            this.expandToContent();
        }
        else
            return this.HtmlText().html;
    },

    HtmlText: function () {
        //return this.$wysiwygContainer.html();
        var options = {
            children: true
        };
        var dom = this.$wysiwygContainer[0];
        /*var node = dom.firstChild; //ensur <p></p> - is done on the server in Foundation.TextConverter.CheckHtml
        switch(node.nodeType){
            case 3: //text
                break;
            case 1: //element
                switch (node.nodeName.toLowerCase()) {
                    case "p":
                    case 'div':
                        node = null;
                        break;
                }
                break;
            default:
                node = null;
                break;
        }
        if (node)
            options.children = false;*/
        
        var html = this.richText.ToHtml(dom, options);

        return {
            html: html,
            text: options.text
        };
    },

    wysiwyg_SelectionChanged: function (e) {
        if (!this.currentSelection || !this.rangeHelper.compare(this.currentSelection)) {
            this.currentSelection = this.rangeHelper.cloneSelected();
            this.updateButtonState();
            this.forgetSelection();
        }
    },

    updateButtonState: function () {
        this._suppressFormatting = true;
        try
        {
            this.Bold(this.$editor.queryCommandState("bold") ? true : false);
            this.Italic(this.$editor.queryCommandState("italic") ? true : false);
            this.Underline(this.$editor.queryCommandState("underline") ? true : false);

            var fontFamily = this.$editor.queryCommandState("fontName");
            if (fontFamily)
                this.fontFamily.text(fontFamily);
            var fontSize = this.$editor.queryCommandState("fontSize");
            if (fontSize)
                this.fontSize.text(fontSize);
            var fontColor = this.$editor.queryCommandState("foreColor");
            if (fontColor)
                this.fontColor.css('background-color', fontColor);

            var justifyLeft = false;
            var justifyCenter = false;
            var justifyRight = false;
        
            if (this.$editor.queryCommandState("justifyCenter"))
                justifyCenter = true;
            else if (this.$editor.queryCommandState("justifyRight"))
                justifyRight = true;
            else
                justifyLeft = true;

            this.JustifyLeft(justifyLeft);
            this.JustifyCenter(justifyCenter);
            this.JustifyRight(justifyRight);
        }
        catch (e)
        {
            console.error(errorMessage(e));
        }
        this._suppressFormatting = false;
    },

    onCommand: function (command, data) {
        switch (command) {
            case "Undo":
                this.applyFormatting("undo");
                break;
            case "Redo":
                this.applyFormatting("redo");
                break;
            case "Bold":
                this.applyFormatting("bold");
                break;
            case "Italic":
                this.applyFormatting("italic");
                break;
            case "Underline":
                this.applyFormatting("underline");
                break;
            case "JustifyLeft":
                this.applyFormatting("justifyLeft");
                break;
            case "JustifyCenter":
                this.applyFormatting("justifyCenter");
                break;
            case "JustifyRight":
                this.applyFormatting("justifyRight");
                break;
            case "FontFamily":
                this.saveSelection();
                this.showPopup(this.$fontFamilyPopupHelper);
                break;
            case "FontSize":
                this.saveSelection();
                this.showPopup(this.$fontSizePopupHelper);
                break;
            case "FontColor":
                this.saveSelection();
                this.showPopup(this.$fontColorPopupHelper);
                break;
            case "Hyperlink":
                this.saveSelection();
                this.hyperlinkForm.Show();
                break;
            case "Image":
                this.saveSelection();
                this.imageForm.Show();
                break;
            case "PasteTag":
                var html = window.clipboardData.getData('Text');
                if (html)
                    this.Html(html);
                break;
            case "Test":
                //this.saveSelection(true);
                //this.$editor.execCommand("createlink", false, "http://google.com");
                //this.showPopup(this.$testPopupHelper);
                //this.applyFormatting("fontSize", "6");
                break;
        }
    },

    applyFormatting: function (command, value, focus, restoreRange) {
        if (!this._suppressFormatting) {
            try {
                if (focus)
                    this.prepareCommand(true, restoreRange);
                if (this.$editor.execCommand(command, false, value))
                    this.updateButtonState();
            }
            catch (e)
            {
                console.error(errorMessage(e));
            }
        }
    },

    forgetSelection: function (reset) {
        delete this.$currentRange;
        delete this.$currentNode;
    },

    saveSelection: function(reset) {
        if (!this.$currentRange || reset)
            this.$currentRange = this.rangeHelper.selectedRange(); //.cloneSelected()
        if (!this.$currentNode || reset)
            this.$currentNode = $(this.rangeHelper.parentNode());
    },

    prepareCommand: function (ensureSelection) {
        if (ensureSelection && this.$currentRange) //|| !this.rangeHelper.hasSelection()
            this.rangeHelper.selectRange(this.$currentRange);
        if(!this.$wysiwygContainer.is(":focus"))
            this.$wysiwygContainer.focus();
    },

    currentNode: function (type, node) {
        node = node || this.$currentNode;
        if (node && node.length && type) {
            switch (type) {
                default:
                    return node.is(type) ? node : node.parents(type).first();
            }
        }
        return node;
    },

    insertHyperlink: function (hyperlink, prepareCommand) {
        if (prepareCommand)
            this.prepareCommand(true);
        if (hyperlink && hyperlink.url)
            this.insertHtml('<a href="' + hyperlink.url + (hyperlink.url[0] != '/' ? '" target="_blank">' : '>') + hyperlink.text + '</a>');
    },

    insertImage: function (image, focus, prepareCommand) {
        if (prepareCommand)
            this.prepareCommand(true);
        this.insertHtml('<img src="' + image.url + '"' + (image.attr ? image.attr : '') + '/>');
    },

    insertHtml: function (html, endHtml, overrideCodeBlocking) {
        this.rangeHelper.insertHTML(html, endHtml);
    },

    expandToContent: function (ignoreMaxHeight, ignoreMaxWidth) {
        var currentHeight = this.$container.height(),
            //currentWidth = this.$container.width(),
            desiredHeight = this.$wysiwygContainer[0].scrollHeight,
            //desiredWidth = this.$wysiwygContainer[0].scrollWidth,
            heightPadding = (currentHeight - this.$wysiwygContainer.height()),
            //widthPadding = (currentWidth - this.$wysiwygContainer.width()),
            maxHeight = $(window).height() - 100; //maxWidth = $(window).width() - 100

        desiredHeight += heightPadding;
        //desiredWidth += widthPadding;

        if (ignoreMaxHeight !== true && desiredHeight > maxHeight)
            desiredHeight = maxHeight;

        //if (ignoreMaxWidth !== true && desiredWidth > maxWidth)
        //    desiredWidth = maxWidth;

        var resized;
        if (desiredHeight > currentHeight) {
            this.$container.height(desiredHeight);
            resized = true;
        }
        /*if (desiredWidth > currentWidth) {
            this.$container.width(desiredWidth);
            resized = true;
        }*/
        if(resized)
            this.$container.trigger($.Event('resize'));
    }
});