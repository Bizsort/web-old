System.Type.RegisterNamespace('Foundation.List');
Foundation.List.PopulateStatus = {
    Empty: 0,
    Buffer_Initialized: 1,
    Buffer_Expanded: 2
};

Foundation.List.Pager = Class.define({
    ctor: function () {
        this._callbacks = [];
        this.CanChangePage(false);
        this.IsPageChanging = false;
        this.ItemCount = 0;
        this.PageIndex = -1;
        this.PageSize = 10;
        this.TotalItemCount = -1;

        this.FetchLimit = 0;
        this.FetchIndex = 0;
        this._buffer = null;
        this._fetchCount = 0;

        this.FromRecord = -1;
        this.ToRecord = -1;
        this.Visible = true;

        this.PageSizeOptions = [10, 25, 50, 100];

        this.Selected = [];
        this.SelectedChanged = EventDelegate();
    },

    HasSelected: function () {
        return this.Selected && this.Selected.length > 0 ? true : false;
    },

    CanChangePage: function (canChangePage) {
        if (canChangePage != undefined) {
            if (this.canChangePage != canChangePage) {
                this.canChangePage = canChangePage;
                this.raisePropertyChanged("CanChangePage");
            }
        }
        else
            return this.canChangePage;
    },

    setItemCount: function (itemCount) {
        if (this.ItemCount != itemCount) {
            this.ItemCount = itemCount;
            this.UpdatePageCount();
            this.raisePropertyChanged("ItemCount");
        }
    },

    setPageSize: function (pageSize) {
        if (this.PageSize != pageSize) {
            this.PageSize = pageSize;
            this.UpdatePageCount();
            this.raisePropertyChanged("PageSize");
            this.populatePage(0, true);
        }
    },

    setVisible: function (visible) {
        if (this.Visible != visible) {
            this.Visible = visible;
            this.raisePropertyChanged("Visible");
        }
    },

    UpdatePageCount: function () {
        if (this.PageSize > 0) {
            this.PageCount = Math.max(1, Math.ceil(this.ItemCount / this.PageSize));
        }
        else {
            this.PageCount = 1;
        }
    },

    addPropertyChanged: function (callback) {
        this._callbacks.push(callback);
    },

    raisePropertyChanged: function (propertyName) {
        for (var i = 0; i < this._callbacks.length; i++) {
            this._callbacks[i](propertyName);
        }
    },

    MoveToPage: function (pageIndex) {
        if (this.CanChangePage() && pageIndex >= 0 && pageIndex < this.PageCount && pageIndex != this.PageIndex) {
            this.CanChangePage(false);
            if (this.FetchLimit > 0 && this.FetchIndex > 0 && ((pageIndex + 1) * this.PageSize) > this._fetchCount) {
                if (this.PopulateBuffer)
                    this.PopulateBuffer(pageIndex);
                else
                    throw 'Unexpected FetchLimit and/or PopulateBuffer';
            }
            else
                return this.populatePage(pageIndex, true) > 0;
        }

        return false;
    },

    MoveToPreviousPage: function () {
        return this.MoveToPage(this.PageIndex - 1);
    },

    MoveToNextPage: function () {
        return this.MoveToPage(this.PageIndex + 1);
    },

    MoveToFirstPage: function () {
        return this.MoveToPage(0);
    },

    MoveToLastPage: function () {
        return this.MoveToPage(this.PageCount - 1);
    },

    notifyPopulatePage: function (pageIndex, page, setPage) {
        if (setPage) {
            this.IsPageChanging = true;
            if (this.PageChanging)
                this.PageChanging();

            if (this.PageIndex != pageIndex) {
                this.PageIndex = pageIndex;
                this.raisePropertyChanged("PageIndex");
            }
        }
        else if (this.PageIndex != pageIndex)
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.UnexpectedState);

        if (this.PopulatePage) {
            var selected;
            if (this.Selected && page && this.Selected.length > 0 && page.length > 0) {
                selected = this.Selected;
                selected = jQuery.map(page, function (p) {
                    if (selected.indexOf(p) >= 0)
                        return p;
                });
            }
            this.PopulatePage(page, selected);
        }

        if (setPage) {
            this.IsPageChanging = false;
            if (this.PageChanged)
                this.PageChanged();
        }
    },

    populatePage: function (pageIndex, setPage) {
        if (this._buffer && this._buffer.length > 0 && pageIndex >= 0) {
            var startIndex = pageIndex * this.PageSize;
            var page = this._buffer.slice(startIndex, startIndex + this.PageSize);

            this.FromRecord = startIndex + 1;
            this.ToRecord = startIndex + page.length;

            this.notifyPopulatePage(pageIndex, page, setPage);

            return page.length;
        }
        else
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
    },

    RefreshPage: function () {
        if (this.PageIndex >= 0)
            this.populatePage(this.PageIndex, false);
    },

    Populate: function (data, pageIndex) {
        this.CanChangePage(false);
        var populateStatus;
        if (this._buffer == undefined || data == undefined || !data.StartIndex) {
            if (data && data.Series && data.Series.length > 0) {
                this._buffer = data.Series;
                this._fetchCount = (this._fetchLimit > 0 ? this._fetchLimit : this._buffer.length);

                if (data.TotalCount) {
                    this.setItemCount(data.TotalCount);
                    //this.TotalItemCount = data.TotalCount;
                }
                else {
                    this.setItemCount(data.Series.length);
                    //this.TotalItemCount = -1;
                }
                if ((pageIndex * this.PageSize) >= data.Series.length)
                    pageIndex = 0;
                this.setVisible(true);
                populateStatus = Foundation.List.PopulateStatus.Buffer_Initialized;
            }
            else {
                this._fetchCount = 0;
                this._buffer = null;
                this.setItemCount(0);
                //TotalItemCount = -1;
                pageIndex = -1;
                this.setVisible(false);
                populateStatus = Foundation.List.PopulateStatus.Empty;
            }

            if (this.Selected && this.Selected.length > 0)
                this.ClearSelected();
        }
        else if (this._buffer.length == data.StartIndex && pageIndex == this.PageIndex + 1) {
            this._fetchCount = this._buffer.length + this._fetchLimit;

            if (data.Series.length > 0) {
                this._buffer.push.apply(this._buffer, data.Series)
            }
            else
                pageIndex = this.PageIndex;
            populateStatus = Foundation.List.PopulateStatus.Buffer_Expanded;
        }
        else
            throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);

        if (pageIndex < 0) {
            this.FromRecord = -1;
            this.ToRecord = -1;

            this.notifyPopulatePage(pageIndex, null, true);
        }
        else if (pageIndex == 0 || pageIndex != this.PageIndex) {
            this.populatePage(pageIndex, true);
        }

        return populateStatus;
    },

    UpdateSelected: function (id, selected) {
        if (id > 0) {
            var index = this.Selected.indexOf(id);
            if (selected && index == -1) {
                this.Selected.push(id);
                if (this.SelectedChanged)
                    this.SelectedChanged();
            }
            else if (!selected && index >= 0) {
                this.Selected.splice(index, 1);
                if (this.SelectedChanged)
                    this.SelectedChanged();
            }
        }
        else
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "id");
    },

    ClearSelected: function () {
        this.Selected.length = 0;
        if (this.SelectedChanged)
            this.SelectedChanged();
    }
});

Foundation.List.View = Foundation.Page.extend({
    ctor: function (listView) {
        Foundation.Page.prototype.ctor.call(this);
        this.Pager = new Foundation.List.Pager();
        this.Pager.PopulateBuffer = this.populate;
        this.Pager.PopulatePage = jQuery.proxy(this.populatePage, this);
        this.List = new Foundation.Controls.List.PagingContainer(this.Pager, listView);
        this.fetchPending = false;
    },

    Initialize: function (options) {
        var container;
        if(options && options.Container) {
            container = options.Container;
            delete options.Container;
        }
        else
            container = $('#centerFrame');

        Foundation.Page.prototype.Initialize.call(this, options);

        /*Tring to attach to static content - doesn't work
        var listOptions = {};
        if (options && options.Loaded)
            listOptions.Loaded = options.Loaded;*/
        this.List.Initialize(container/*, listOptions*/);
        var $this = this;
        this.List.View.ItemSelectCommand = function (item) {
            $this.Pager.UpdateSelected(item.Id, item.Selected);
        };

        this.FormatListHeader();
    },

    FormatListHeader: function (reset) {
        if (this.SearchEnabled && !String.isNullOrWhiteSpace(this._token.SearchQuery)) {
            this.List.HeaderTemplate.Format(Resource.Global.Search_Header_Format);
            this.List.EmptyHeaderTemplate.Format(Resource.Global.Search_Header_EmptyFormat);
        } else if (reset) {
            this.List.HeaderTemplate.Format(Resource.Global.List_Header_Format);
            this.List.EmptyHeaderTemplate.Format(Resource.Global.List_Header_EmptyFormat);
        }
    },

    doSearch: function () {
        Navigation.Main.Reflect(this._token);
        this.FormatListHeader(true);
        this.populate(0);
        return true;
    },

    Load: function () {
        Foundation.Page.prototype.Load.call(this); //Set the loaded flag
        this.populate(this._token.Page >= 0 ? this._token.Page : 0);
    },

    empty: function () {
        //this.Pager.Populate(null, -1); //Now handled by List/Filter/Folder.View.populate
        //List.View.Visibility = Visibility.Visible; //Bind to this.Pager.Visible instead
        this.formatActions(true);
        setOrCreateMetaTag("name", "robots", "noindex");
    },

    populate: function (pageIndex) {
        var queryInput = {
            StartIndex: (pageIndex > 0 ? this.Pager.FetchIndex : 0),
            Length: this.Pager.FetchLimit
        };
        var $this = this;
        this.fetchPending = true;
        this.Pager.CanChangePage(false);
        this.fetchList(queryInput, function (data) {
            $this.fetchPending = false;
            switch ($this.Pager.Populate(data, pageIndex)) {
                case Foundation.List.PopulateStatus.Buffer_Initialized:
                    //List.View.Visibility = Visibility.Visible; //Bind to this.Pager.Visible instead
                    $this.formatActions(data.Series.length == 0 ? true : false);
                    break;
                case Foundation.List.PopulateStatus.Empty:
                    $this.empty();
                    break;
            }
            /*if (data && data.Series && data.Series.length > 0) {
                $this.Pager.Populate(data, pageIndex);
                if (pageIndex == 0) {
                    //List.View.Visibility = Visibility.Visible; //Bind to this.Pager.Visible instead
                    $this.formatActions(data.Series.length == 0 ? true : false);
                }
            }
            else
                $this.empty();*/
        }, function (ex) {
            $this.fetchPending = false;
            showError(ex, true);
        });
    },

    formatActions: function () {
    },

    prepareHeader: function (header) {
        if (this.SearchEnabled && !String.isNullOrWhiteSpace(this._token.SearchQuery)) {
            header.Query = this._token.SearchQuery;
            //header.Format = (header.IsEmpty() ? Resource.List.Search_EmptyHeaderFormat : Resource.List.Search_HeaderFormat);
        }
        return header;
    },

    preparePage: function (keys, records, customValues, valueSetter, pager) {
        if (records && records.length > 0 && records.length <= keys.length) {
            var record;
            var sorted = [];
            pager = pager || this.Pager;
            var valuesIndex = pager.PageIndex * pager.PageSize;
            var values = customValues ? customValues.slice(valuesIndex, valuesIndex + pager.PageSize) : null;
            for (var i = 0, l = keys.length; i < l; i++) {
                if (records[i].Id == keys[i]) {
                    record = records[i];
                }
                else {
                    record = null;
                    for (var j = 0, l2 = records.length; j < l2; j++) {
                        if (records[j].Id == keys[i]) {
                            record = records[j];
                            break;
                        }
                    }
                }
                if (record) {
                    if (values && valueSetter)
                        valueSetter(record, values[i]);
                    sorted.push(record);
                }
            }
            return sorted;
        }
        return records;
    },

    populatePage: function (page, selected) {
        if (page && page.length > 0) {
            this.List.Header(this.prepareHeader(new Foundation.Controls.List.Header.Data({ FromRecord: this.Pager.FromRecord, ToRecord: this.Pager.ToRecord, TotalCount: this.Pager.ItemCount, Entity: this.List.Entity/*, Format: this.List.HeaderFormat*/ })));
            this.Pager.CanChangePage(false);
            if (this._token.Page != this.Pager.PageIndex) {
                this._token.Page = this.Pager.PageIndex;
                Navigation.Main.Reflect(this._token);
            }
            var $this = this;
            this.fetchPending = true;
            this.fetchPage(page, function (data) {
                $this.fetchPending = false;
                if (selected && selected.length > 0)
                    $this.setSelected(data, selected);

                $this.List.Populate(data, { metaDescription: true });
                $this.Pager.CanChangePage(true);
                $this.Loaded = true;
            }, function (ex) {
                $this.fetchPending = false;
                showError(ex, true);
            });
        } else {
            this.List.Header(this.prepareHeader(new Foundation.Controls.List.Header.Data({ Entity: this.List.Entity, TotalCount: 0/*, Format: this.List.EmptyHeaderFormat*/ })));
            this.List.Populate(null, { metaDescription: true });
        }
    },

    clearSelected: function () {
        if (this.Pager.HasSelected()) {
            this.Pager.ClearSelected();
            this.setSelected(this.List.View.Items);
        }
    },

    setSelected: function (data, selected) {
        if (this.List && this.List.View.Selectable() && data && data.length > 0 && data[0].Selected !== null) {
            if (selected != undefined) {
                for (var i = 0, l = data.length; i < l; i++) {
                    if (selected.indexOf(data[i].Id) >= 0)
                        data[i].Selected = true;
                }
            }
            else {
                $('input:checkbox[data-command=ItemSelectCommand]', this.List.View.$container).prop('checked', false);
                for (var i = 0, l = data.length; i < l; i++) {
                    if (data[i].Selected) {
                        data[i].Selected = false;
                        delete data[i].Selected;
                    }
                }
            }
        }
    }
});

System.Type.RegisterNamespace('Foundation.List.Filter');

Foundation.List.Filter.View = Foundation.List.View.extend({
    ctor: function (listView) {
        Foundation.List.View.prototype.ctor.call(this, listView);
        if (this.filterAvail && this.filterApplied) {
            this.filterAvail.FilterSelected = jQuery.proxy(this.applyFilter, this);
            this.filterApplied.FilterSelected = jQuery.proxy(this.removeFilter, this);

            this.facets = [];
            this.KnownFacetNames = [];

            this.FilterEnabled = true;
        }
        else //throw 'One or both Filter objects(s) not present';
            this.FilterEnabled = false;
    },

    Initialize: function (options) {
        Foundation.List.View.prototype.Initialize.call(this, options);
        if (this.FilterEnabled) {
            if (!this.filterApplied.$container) {
                var filterApplied = $('#filterApplied');
                if (filterApplied.length == 1) {
                    this.filterApplied.Container = filterApplied;
                    this.filterApplied.Initialize(filterApplied);
                }
                else
                    this.filterApplied.Initialize($('#headerFrame'));
            }
            if (!this.filterAvail.$container) {
                var leftFrame = $('#leftFrame');
                this.filterAvail.Initialize(leftFrame);
                if (leftFrame.children().length == 1)
                    $('#leftFrame').attr('data-link', "visible{:filterAvail.Visible()}")
            }
        }
    },

    doSearch: function () {
        if (this.FilterEnabled) {
            this.facets = [];
            this.filterApplied.Clear();
        }
        return Foundation.List.View.prototype.doSearch.call(this);
    },

    empty: function () {
        if (this.FilterEnabled) {
            this.filterAvail.Populate();
        }
        Foundation.List.View.prototype.empty.call(this);
    },

    populate: function (pageIndex) {
        if (this.FilterEnabled) {
            var queryInput = new Model.List.Filter.QueryInput(this.facets);
            queryInput.StartIndex = (pageIndex > 0 ? this.Pager.FetchIndex : 0);
            queryInput.Length = this.Pager.FetchLimit;
            var $this = this;
            this.fetchPending = true;
            this.Pager.CanChangePage(false);
            this.fetchList(queryInput, function (data) {
                $this.fetchPending = false;
                switch ($this.Pager.Populate(data, pageIndex)) {
                    case Foundation.List.PopulateStatus.Buffer_Initialized:
                        $this.filterAvail.Populate(data.Facets);
                        //List.View.Visibility = Visibility.Visible; //Bind to _pager.Visible instead
                        $this.formatActions(data.Series.Length == 0);
                        break;
                    case Foundation.List.PopulateStatus.Empty:
                        $this.empty();
                        break;
                }
                /*if (data && data.Series && data.Series.length > 0) {
                    $this.Pager.Populate(data, pageIndex);
                    if (pageIndex == 0) {
                        $this.filterAvail.Populate(data.Facets);
                        //List.View.Visibility = Visibility.Visible; //Bind to _pager.Visible instead
                        $this.formatActions(data.Series.Length == 0);
                    }
                }
                else
                    $this.empty();*/
            }, function (ex) {
                $this.fetchPending = false;
                showError(ex, true);
            });
        } else {
            Foundation.List.View.prototype.populate.call(this, pageIndex);
        }
    },

    applyFilter: function (facet) {
        if (!this.fetchPending) {
            this.fetchPending = true;
            this.filterApplied.Add(facet);
            this.facets = this.filterApplied.Facets;
            if (!facet.Exclude && this.KnownFacetNames.indexOf(facet.NameText) >= 0)
                this.List.View.ChangeColumnOption(facet.NameText, Foundation.Controls.List.ColumnOptionType.FilterOut);
            this.populate(0);
        }
    },

    removeFilter: function (facet, index) {
        if (!this.fetchPending) {
            this.fetchPending = true;
            this.filterApplied.Remove(index);
            this.facets = this.filterApplied.Facets;
            if (!facet.Exclude && this.KnownFacetNames.indexOf(facet.NameText) >= 0)
                this.List.View.ChangeColumnOption(facet.NameText, Foundation.Controls.List.ColumnOptionType.FilterIn);
            this.populate(0);
        }
    }
});

Foundation.List.Folder = {

    AutosetType: {
        None: 0,
        First: 1,
        Special: 2
    },

    CurrentType: {
        None: 0,
        Special: 1,
        Regular: 2
    },

    MessageType: {
        EmptyExplorer: 0,
        SpecialFolderName: 1
    },

    RegularFolderVisibility: function (folderType) {
        if (folderType != Foundation.List.Folder.CurrentType.Regular)
            return false;
        return true;
    }

    /*RegularFolderVisibility: function (folderType) {
        if (folderType != Foundation.List.Folder.CurrentType.Regular)
            return 'none';
        //returning undefined or '' will remove the attr - does not work as of commit 44
    }*/
};

Foundation.List.Folder.SetFolderOptions = {
    Default: 0,
    ClearSearchQuery: 1,
    ClearSelectedFolder: 2,
    UserInitiated: 4,
    SuppressEvent: 8,
    PopulateSubFolders: 16,
    PopulateList: 32
};

Foundation.List.Folder.View = Foundation.List.Filter.View.extend({
    ctor: function (listView, folders, folderPath) {
        Foundation.List.Filter.View.prototype.ctor.call(this, listView);
        this.Folder = {
            Type: Foundation.List.Folder.CurrentType.None,
            Id: 0,
            Name: ''
        };
        this.parentFolder = 0;

        if (folders)
            this.folders = folders;

        if (folderPath)
            this.folderPath = folderPath;
    },

    FolderChanged: function (folder) {
    },

    AutosetFolder: function (folders) {
        return Foundation.List.Folder.AutosetType.First;
    },

    Initialize: function (options) {
        Foundation.List.Filter.View.prototype.Initialize.call(this, options);

        if (this.folders) {
            var $this = this;
            this.folders.SetFolder = function (folder, options) {
                if (!$this.fetchPending && ($this.Folder.Id != folder.Id || options && (options & Foundation.List.Folder.SetFolderOptions.PopulateList) > 0)) {
                    $this.setFolder(folder.Id, folder.Name, Foundation.List.Folder.SetFolderOptions.ClearSearchQuery, folder);
                    return true;
                }

                return false;
            }
            if (this.folders instanceof Foundation.Controls.Folder.TreeList)
                this.folders.PopulateSubFolders = jQuery.proxy(this.populateFolders, this);  //populateSubFolders;
            else if (this.folders instanceof Foundation.Controls.Folder.TwoLevelList)
                this.folders.SetSubFolder = jQuery.proxy(this.parentOrSubFolderSelected, this);
        }

        if (this.folderPath)
            this.folderPath.SetFolder = parentOrSubFolderSelected;
    },

    doSearch: function (populate) {
        if (this.FilterEnabled) {
            this.facets = [];
            this.filterApplied.Clear();
        }
        Navigation.Main.Reflect(this._token);
        this.FormatListHeader(true);
        populate = populate || function () {
            this.setFolder(0, '', Foundation.List.Folder.SetFolderOptions.ClearSelectedFolder);
            return true;
        }
        return populate.call(this);
    },

    prepareHeader: function (header) {
        header = Foundation.List.View.prototype.prepareHeader.call(this, header);
        header.Folder = this.Folder.Type != Foundation.List.Folder.CurrentType.None ? this.Folder.Name : '';
        return header;
    },

    folder: function (folder) {
        if (folder) {

            if (!this.Folder) {
                this.Folder = folder;
            }
            else {
                var oldValue = this.Folder;
                //$.observable(this).setProperty('Folder', folder);
                //Workaround for issue with jsViews
                $.observable(this).setProperty('Folder.Id', folder.Id);
                $.observable(this).setProperty('Folder.Type', folder.Type);
                $.observable(this).setProperty('Folder.Name', folder.Name);
                this.Folder.Data = folder.Data;
            }

            $('.folderName').text(folder.Name);

            if (this.FolderChanged)
                this.FolderChanged(folder);
        }
    },

    populateList: function () {
        Foundation.List.Filter.View.prototype.populate.call(this, 0);
    },

    Load: function (folder, parentFolder) {
        Foundation.Page.prototype.Load.call(this); //Set the loaded flag
        if (arguments.length == 0 || folder == undefined || parentFolder == undefined) {
            folder = this.Folder.Id;
            parentFolder = this.parentFolder;
        }

        this.populate(folder, parentFolder, Foundation.List.Folder.SetFolderOptions.Default);
    },

    populate: function (folderId, parentFolderId, options) {
        if (typeof parentFolderId == 'undefined') {
            Foundation.List.Filter.View.prototype.populate.call(this, 0);
            return;
        }
        else if (this.parentFolder != parentFolderId)
            this.parentFolder = parentFolderId;

        var $this = this;
        //When service does not support sub-tree fetch it would return a top-level list and set foldersParent to 0
        this.populateFolders(parentFolderId, folderId, function (folders, foldersParent) {
            if (!folders || folders.length == 0) {
                $this.folders.Visible(false);

                folderId = 0;

                if ($this.AutosetFolder() == Foundation.List.Folder.AutosetType.Special)
                    $this.setFolder(folderId, '', options);
                else {
                    var folderName = $this.GetCustomMessage(Foundation.List.Folder.MessageType.EmptyExplorer);
                    if (!folderName || folderName.length == 0)
                        folderName = Resource.Global.Folders_Empty;

                    $this.folder({
                        Type: Foundation.List.Folder.CurrentType.None,
                        Id: folderId,
                        Name: folderName
                    });

                    $this.Pager.Populate(null, -1);
                    $this.empty();

                    if ($this.List.Visible())
                        $this.List.Visible(false);
                }
            }
            else {
                var folder;
                if (folders.length > 0) {
                    folder = $this.folders.Lookup(folders, folderId);
                    if (!folder)
                        folderId = 0;

                    if ($this.AutosetFolder(folders) == Foundation.List.Folder.AutosetType.First && folders.length > 0 && (!folder || !folderId)) {
                        folder = folders[0];
                        folderId = folders[0].Id;
                    }
                }
                else {
                    folder = null;
                    folderId = 0;
                }

                if (!$this.folders.Visible())
                    $this.folders.Visible(true);

                //PopulateSubFolders functionality - not-utilized (could be used by Create&Update (Sub)Folder in View.Foundation.List.Folder.Edit<TFolderKey, TItemKey>)
                /*var parentFolder = $this.Folder.Data;
                if ((options & Foundation.List.Folder.SetFolderOptions.PopulateSubFolders) > 0 && foldersParent > 0 && $this.Folder.Id == foldersParent &&
                    folder && folderId && parentFolder) {
                    parentFolder.HasChildren = true;
                    Model.Group.Node.SetParent(folders, parentFolder.Id, parentFolder);

                    //Foundation.Controls.Folder.TreeList.ensureSubFolders
                    parentFolder.Children = folders;
                    var treeViewItem = $this.folders.itemsControl.containerFromItem(parentFolder);
                    if (treeViewItem)
                        treeViewItem.Populate(folders);

                    $this.folders.SelectFolder(folder);
                    $this.setFolder(folder.Id, folder.Name, options, folder);
                }
                else*/if(true) {  //Regular path
                    $this.folders.Populate(folders, folderId, options);

                    if (folderId == 0 && $this.AutosetFolder(folders) == Foundation.List.Folder.AutosetType.Special)
                        $this.setFolder(0, '', options);
                }
                if (!$this.List.Visible())
                    $this.List.Visible(true);
            }
        });
    },

    GetFolderPath: function (folder, callback) {
        callback();
    },

    GetCustomMessage: function (type) {
        return '';
    },

    parentOrSubFolderSelected: function (folder) {
        if (folder.Id > 0) {
            this.populateFolders(folder.ParentId, 0/*folder.Id*/, function (folders, parentFolder) {
                if (folders.length > 0 && folders.any(function (f) { return f.Id == folder.Id ? true : false; })) {
                    this.parentFolder = folder.ParentId;
                    this.folders.Populate(folders, folder.Id, Foundation.List.Folder.SetFolderOptions.Default);
                }
            });
        }
    },

    setFolder: function (folderId, folderName, options, data) {
        if ((options & Foundation.List.Folder.SetFolderOptions.ClearSearchQuery) > 0 && !String.isNullOrWhiteSpace(this._token.SearchQuery)) {
            this._token.SearchQuery = undefined;
            if (this.searchQuery) {
                this.searchQuery.Text('');
                $('#searchQuery').hide();
            }
            this.FormatListHeader(true);
        }

        var folderType = Foundation.List.Folder.CurrentType.None;
        if (folderId > 0) {
            if (!String.isNullOrWhiteSpace(folderName))
                folderType = Foundation.List.Folder.CurrentType.Regular;
            else
                folderType = Foundation.List.Folder.CurrentType.Special;
        }
        else {
            var message = this.GetCustomMessage(Foundation.List.Folder.MessageType.SpecialFolderName);
            if (!String.isNullOrWhiteSpace(message))
                folderName = message;

            folderType = Foundation.List.Folder.CurrentType.Special;

            this.folders.ClearSelection();
        }

        this.folder({
            Type: folderType,
            Id: folderId,
            Name: folderName,
            Data: data
        });

        this.updateFolderPath();

        this.facets = [];
        Foundation.List.Filter.View.prototype.populate.call(this, 0);
    },

    updateFolderPath: function () {
        if (this.Folder.Data && this.Folder.Data.ParentId) {
            this.parentFolder = this.Folder.Data.ParentId;
            if (this.folderPath) {
                if (this.parentFolder > 0)
                    this.GetFolderPath(this.parentFolder, function (folders) {
                        this.folderPath.Populate(folders);
                    });
                else
                    this.folderPath.Populate();
            }
        }
        else if (this.parentFolder != 0)
            this.parentFolder = 0;
    }
});

Foundation.List.Folder.Edit = Foundation.List.Folder.View.extend({
    //To facilitate IsItemSelectedChanged in Owner/Message/Received
    //IsItemSelected: function (isItemSelected) {
    //    if (isItemSelected != undefined) {
    //        this.isItemSelected = isItemSelected;
    //        if (isItemSelected)
    //            $('a.isItemSelected').addClass('active');
    //        else
    //            $('a.isItemSelected').removeClass('active');
    //    }
    //    else
    //        return this.isItemSelected;
    //},

    IsItemSelected: ObservableProperty('IsItemSelected', function () {
        return this.isItemSelected;
    }, function (isItemSelected) {
        this.isItemSelected = isItemSelected;
        if (isItemSelected)
            $('a.isItemSelected').addClass('active');
        else
            $('a.isItemSelected').removeClass('active');
    }, { changeDelegate: true }),

    IsFolderItemSelected: LinkableProperty(function (isFolderItemSelected) {
        if (isFolderItemSelected != undefined) {
            this.isFolderItemSelected = isFolderItemSelected;
            if (isFolderItemSelected)
                $('a.isFolderItemSelected').addClass('active');
            else
                $('a.isFolderItemSelected').removeClass('active');
        }
        else
            return this.isFolderItemSelected;
    }),

    AccountName: function (accountName) {
        if (accountName != undefined) {
            this.accountName = accountName;
        }
        else
            return this.accountName;
    },

    ctor: function (listView, folders, folderPath) {
        Foundation.List.Folder.View.prototype.ctor.call(this, listView, folders, folderPath);
        this.accountName = Session.User.Name;
        //this.isItemSelected = false;
        this.IsItemSelected.bind.call(this, false);
        this.isFolderItemSelected = false;
    },

    Initialize: function (options) {
        Foundation.List.Folder.View.prototype.Initialize.call(this, options);
        var $this = this;
        if (this.folderEdit) {
            if (!this.folderEdit.$container)
                this.folderEdit.Initialize({ tmplData: {} });
            this.folderEdit.Submit = function (folder, action) {
                if ($this.SessionIsValid()) {
                    var parentFolder = (action == Foundation.Controls.Folder.EditAction.CreateSub && $this.folderEdit.$parentFolder ? $this.folderEdit.$parentFolder.Id : 0);
                    if (folder.Id == 0 && (action == Foundation.Controls.Folder.EditAction.Create || (parentFolder > 0 && action == Foundation.Controls.Folder.EditAction.CreateSub))) {
                        $this.CreateFolder(folder, parentFolder, $this.folderEdit, function (id) {
                            folder.Id = id;
                            if (folder.Id > 0) {
                                $this.populate(folder.Id, 0, Foundation.List.Folder.SetFolderOptions.ClearSearchQuery | Foundation.List.Folder.SetFolderOptions.PopulateList); //Always populate top-level list
                                /*if(action == Foundation.Controls.Folder.EditAction.CreateSub && parentFolder > 0)
                                    $this.populate(folder.Id, parentFolder, Foundation.List.Folder.SetFolderOptions.ClearSearchQuery | Foundation.List.Folder.SetFolderOptions.PopulateSubFolders | Foundation.List.Folder.SetFolderOptions.PopulateList);
                                else
                                    $this.populate(folder.Id, 0, Foundation.List.Folder.SetFolderOptions.ClearSearchQuery | Foundation.List.Folder.SetFolderOptions.PopulateList);*/
                                if ($this.actionFolders)
                                    $this.actionFolders.ResetItems();
                            }
                            $this.folderEdit.SubmitComplete();
                        }, jQuery.proxy($this.folderEdit.Invalidate, $this.folderEdit));
                    }
                    else if (folder.Id > 0 && (action == Foundation.Controls.Folder.EditAction.Rename || action == Foundation.Controls.Folder.EditAction.Edit)) {
                        $this.UpdateFolder(folder, $this.folderEdit, function (success) {
                            if (success) {
                                $this.populateFolders(0, folder.Id, function (folders) {
                                    $this.folders.Populate(folders, folder.Id, Foundation.List.Folder.SetFolderOptions.SuppressEvent);
                                    $this.Folder.Data = $this.folders.Lookup(folders, folder.Id);
                                    $this.folders.SelectFolder($this.Folder.Data);
                                });
                                if ($this.Folder.Name != folder.Name) {
                                    $this.folderName(folder.Name);
                                    $this.confirmDeleteFolder.Content["Folder"] = folder.Name;
                                    var header = $this.List.Header();
                                    if (header)
                                        $.observable(header).setProperty('Folder', folder.Name);
                                    if ($this.actionFolders)
                                        $this.actionFolders.ResetItems();
                                }
                            }
                            $this.folderEdit.SubmitComplete();
                        }, jQuery.proxy($this.folderEdit.Invalidate, $this.folderEdit));
                    }
                }
            };
        }

        var deleteFolder = $('#deleteFolder').length > 0;
        if (deleteFolder && this.confirmDeleteFolder) {
            this.confirmDeleteFolder.Submit = function () {
                if ($this.SessionIsValid() && $this.Folder.Type == Foundation.List.Folder.CurrentType.Regular) {
                    if ($this.Folder.Id > 0) {
                        $this.DeleteFolder($this.Folder.Id, function (success) {
                            if (success) {
                                $this.populate($this.parentFolder, 0, Foundation.List.Folder.SetFolderOptions.ClearSearchQuery);
                                if ($this.actionFolders)
                                    $this.actionFolders.ResetItems();
                            }
                            $this.confirmDeleteFolder.SubmitComplete();
                        }, jQuery.proxy($this.confirmDeleteFolder.Invalidate, $this.confirmDeleteFolder));
                        return;
                    }
                }
                throw new Foundation.Exception.OperationException(Foundation.Exception.OperationException.Type.Invalid);
            };
        }
        else if (deleteFolder || this.confirmDeleteFolder)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "FolderDeleteConfirm");

        var deleteItem = $('#deleteItem').length > 0;
        if (deleteItem && this.confirmDeleteItem) {
            this.confirmDeleteItem.Submit = function () { $this.onItemAction($this.confirmDeleteItem); };
        }
        else if (deleteItem || this.confirmDeleteItem)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "ItemDeleteConfirm");

        if (this.actionFolders && this.confirmAddFolderItem) {
            if (!this.actionFolders.PopupForm())
                this.actionFolders.PopupForm(this.confirmAddFolderItem);
            this.actionFolders.ItemSelected = function (folder, itemType) {
                if ($this.SessionIsValid()) {
                    if ((folder.Id > 0 || itemType == Foundation.Controls.Action.ItemType.Root) && $this.Pager.HasSelected()) {
                        $this.confirmAddFolderItem.Content["Folder"] = folder.Name;
                        $this.confirmAddFolderItem.CommandArgument = folder.Id;
                        $this.confirmAddFolderItem.Show();
                    }
                    else if (folder.Id == 0 && itemType == Foundation.Controls.Action.ItemType.New && $this.folderEdit) {
                        $this.folderEdit.InitCreate();
                        $this.folderEdit.Show();
                    }
                }
            };
            $this.confirmAddFolderItem.Submit = function () { $this.onItemAction($this.confirmAddFolderItem); };
        }
        else if (this.actionFolders || this.confirmAddFolderItem)
            throw new Foundation.Exception.ArgumentException(Foundation.Exception.ArgumentException.Type.Invalid, "ItemAddConfirm");

        this.Pager.SelectedChanged(function () {
            //IsItemSelected is now ObservableProperty to facilitate IsItemSelectedChanged in Owner/Message/Received
            $this.IsItemSelected($this.Pager.HasSelected()); //$.observable($this).setProperty('IsItemSelected', $this.Pager.HasSelected());
            if ($this.IsItemSelected() && $this.Folder.Type == Foundation.List.Folder.CurrentType.Regular)
                $.observable($this).setProperty('IsFolderItemSelected', true);
            else
                $.observable($this).setProperty('IsFolderItemSelected', false);
        });
    },

    folderName: function (folderName) {
        $('.folderName').text(folderName);
        $.observable(this).setProperty('Folder.Name', folderName);
    },

    FolderChanged: function (folder) {
        $.observable(this).setProperty('IsFolderItemSelected', folder.Id > 0 && this.Pager.HasSelected());

        if (this.confirmDeleteFolder) {
            if (folder.Id > 0)
                this.confirmDeleteFolder.Content["Folder"] = folder.Name;
            else
                this.confirmDeleteFolder.Content["Folder"] = '';
        }
        //Foundation.List.Folder.View.prototype.FolderChanged.call(this, folder);
    },

    CanDelete: function (folderId, items) {
        return folderId > 0 ? true : false;
    },

    onCommand: function (command) {
        if (command.match(/Folder$/)) {
            if (this.SessionIsValid()) {
                if (command == "DeleteFolder") {
                    if (this.confirmDeleteFolder)
                        this.confirmDeleteFolder.Show();
                }
                else if (this.folderEdit) {
                    if (command == "CreateFolder")
                        this.folderEdit.InitCreate();
                    else if (this.Folder.Type == Foundation.List.Folder.CurrentType.Regular) {
                        switch (command) {
                            case "CreateSubFolder":
                                this.folderEdit.InitCreateSub(this.Folder.Data);
                                break;
                            case "EditFolder":
                            case "RenameFolder":
                                this.folderEdit.InitEdit(this.Folder.Data, this.Folder.Data && this.Folder.Data.Parent, (command == "RenameFolder" ? true : false));
                                break;
                            default:
                                return;
                        }
                    }
                    else
                        return;
                    this.folderEdit.Show();
                }
            }
        }
        else if (command == "DeleteItem") {
            if (this.SessionIsValid() && this.Pager.HasSelected() && this.CanDelete(this.Folder.Id, this.Pager.Selected)) {
                this.confirmDeleteItem.Content["Folder"] = this.Folder.Name;
                this.confirmDeleteItem.CommandArgument = this.Folder.Id;
                this.confirmDeleteItem.Show();
            }
        }
    },

    onItemAction: function (confirmForm) {
        if (this.SessionIsValid() && this.Pager.HasSelected()) {
            var $this = this;
            var callback = function (success) {
                confirmForm.SubmitComplete();
                if (success)
                    $this.populateList();
            };
            var folderId = confirmForm.CommandArgument;
            if (confirmForm == this.confirmAddFolderItem && folderId >= 0) //Root folder may have Id=0
                this.AddFolderItem(folderId, this.Pager.Selected, callback, jQuery.proxy(confirmForm.Invalidate, confirmForm));
            else if (confirmForm == this.confirmDeleteItem && this.CanDelete(folderId, this.Pager.Selected))
                this.DeleteItem(folderId, this.Pager.Selected, callback, jQuery.proxy(confirmForm.Invalidate, confirmForm));
            else
                throw new InvalidOperationException("Unexpected command");
        }
        else
            throw new InvalidOperationException();
    }
});

//Passthrough serialization
//Foundation.RichText.HtmlSerializer = Class.define({
//    ctor: function (domHelper) {
//        this.domHelper = domHelper;
//    },

//    emptyTags: '|area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|command|embed|keygen|source|track|wbr|',

//    escapeEntites: function(str) {
//        var entites = {
//            '&': '&amp;',
//            '<': '&lt;',
//            '>': '&gt;',
//            '"': '&quot;'
//        };

//        return !str ? '' : str.replace(/[&<>"]/g, function(entity) {
//            return entites[entity] || entity;
//        });
//    },

//    textTrim: function(str) {
//        return str
//            // new lines in text nodes are always ignored in normal handling
//            .replace(/[\r\n]/, '')
//            .replace(/[^\S|\u00A0]+/g, ' ');
//    },

//    serialize: function (dom, children) {
//        var context = {
//            output: [],
//            indent: 0,
//            indentStr: '\t'
//        };

//        if (children)
//		{
//            var node = dom.firstChild;

//			while(node)
//			{
//			    this.serializeNode(context, node);
//				node = node.nextSibling;
//			}
//		}
//        else if (dom.length > 0) {
//            for (var i = 0, l = dom.length; i < l; i++) {
//                this.serializeNode(context, dom[i]);
//            }
//        }
//        else
//            this.serializeNode(context, node);

//		return context.output.join('');
//	},

//    serializeDoc: function (context, node) {
//	    var child;

//	    child = node.firstChild;

//	    while (child) {
//	        this.serializeNode(context, child);
//	        child = child.nextSibling;
//	    }
//	},

//	serializeNode: function (context, node, isPre) {
//		switch(node.nodeType)
//		{
//			case 1: // element
//				// IE comment
//				if (node.nodeName === '!')
//				    this.writeComment(context, node);
//				else
//				    this.writeElement(context, node, isPre);
//				break;

//			case 3: // text
//			    this.writeText(context, node, isPre);
//				break;

//			case 4: // cdata section
//			    this.writeCData(context, node);
//				break;

//			case 8: // comment
//			    this.writeComment(context, node);
//				break;

//			case 9: // document
//			case 11: // document fragment
//			    this.serializeDoc(context, node);
//				break;


//			// Ignored types
//			case 2: // attribute
//			case 5: // entity ref
//			case 6: // entity
//			case 7: // processing instruction
//			case 10: // document type
//			case 12: // notation
//				break;
//		}
//	},

//	writeElement: function (context, node, isPre) {
//		var	child, attr, attrValue,
//			tagName     = node.nodeName.toLowerCase(),
//			i           = node.attributes.length,
//			// pre || pre-wrap with any vendor prefix
//			isPre       = isPre || /pre(?:\-wrap)?$/i.test($(node).css('whiteSpace')),
//			selfClosing = !node.firstChild && this.emptyTags.indexOf('|' + tagName + '|') > -1;

//		//if($(node).hasClass('sceditor-ignore'))
//		//	return;

//		this.write(context, '<' + tagName, !isPre && this.canIndent(node));
//		while(i--)
//		{
//			attr = node.attributes[i];

//			// IE < 8 returns all possible attribtues, not just specified ones
//			/*if(!$.sceditor.ie || attr.specified)
//			{
//				// IE < 8 doesn't return the CSS for the style attribute
//				if($.sceditor.ie < 8 && /style/i.test(attr.name))
//					attrValue = node.style.cssText;
//				else
//					attrValue = attr.value;

//				this.write(context, " " + attr.name.toLowerCase() + '="' + this.escapeEntites(attrValue) + '"', false);
//			}*/
//			attrValue = attr.value;
//			this.write(context, " " + attr.name.toLowerCase() + '="' + this.escapeEntites(attrValue) + '"', false);
//		}
//		this.write(context, selfClosing ? ' />' : '>', false);

//		child = node.firstChild;
//		while(child)
//		{
//		    context.indent++;

//		    this.serializeNode(context, child, isPre);
//			child = child.nextSibling;

//			context.indent--;
//		}

//		if(!selfClosing)
//		    this.write(context, '</' + tagName + '>', !isPre && this.canIndent(node) && node.firstChild && this.canIndent(node.firstChild));
//	},

//	writeCData: function (context, node) {
//	    this.write(context, '<![CDATA[' + this.escapeEntites(node.nodeValue) + ']]>');
//	},

//	writeComment: function(context, node) {
//	    this.write(context, '<!-- ' + this.escapeEntites(node.nodeValue) + ' -->');
//	},

//	writeText: function (context, node, isPre) {
//		var text = node.nodeValue;

//		if(!isPre)
//		    text = this.textTrim(text);

//		if(text)
//		    this.write(context, this.escapeEntites(text), !isPre && this.canIndent(node));
//	},

//	write: function (context, str, indent) {
//	    var i = context.indent;

//		if(indent !== false)
//		{
//			// Don't add a new line if it's the first element
//		    if (context.output.length)
//		        context.output.push('\n');

//			while(i--)
//			    context.output.push(context.indentStr);
//		}

//		context.output.push(str);
//	},

//	canIndent: function(node) {
//		var prev = node.previousSibling;

//		if(node.nodeType !== 1 && prev)
//			return !this.domHelper.isInline(prev);

//		// first child of a block element
//		if (!prev && !this.domHelper.isInline(node.parentNode))
//			return true;

//		return !this.domHelper.isInline(node);
//	}
//});