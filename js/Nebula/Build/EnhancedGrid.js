/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");
Nebula.Register("Nebula.GridDef");

Nebula.Build.EnhancedGrid = (function(window, $, N, B, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function self(target) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults            = {};
        this.target              = $(target);
        this.configs             = {};
        this.def                 = null;
        this.filter              = this.target.children("div.filter");
        this.toolbar             = this.target.children("ul.toolbar");
        this.grid                = this.target.children("div.grid");
        this.preview             = this.target.children("div.preview-pane");
        this.previewContent      = this.preview.children(".preview-content");
        this.previewToolbar      = this.previewContent.children(".preview-toolbar");
        this.previewLoader       = this.previewContent.children(".preview-loader");
        this.initedAll           = false;
        this.initedFilter        = false;
        this.initedToolbar       = false;
        this.initedGrid          = false;
        this.initedPreview       = false;
        this.query               = null;
        this.pageSize            = 1000;
        this.requestable         = false;
        this.searchCls           = {};
        this.searchUrl           = null;
        this.searchQuery         = null;
        this.isScrollLoadGrid    = null;
        this.isGroupByGrid       = null;
        this.mapper              = null;
        this.subsetTpl           = null;
        this.useFilter           = false;
        this.changedRows         = {};
        this.columnsWithKeys     = {};
        this.allAvailableColumns = null;
        this.currentColumns      = null;
        this.filterColumns       = {};
        this.hasSearchDone       = false;
        this.startTime           = 0;

        // ***** CALL ***** parent constructor
        parent.call(this, this.target);

        // ***** CALL ***** local constructor
        this.initialize();
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ METHODS *****
    self.handleGridOnBeforeDataLoad =
    function handleGridOnBeforeDataLoad(url, query, scope) {
        scope.startTime = N.Timing.now();

        setTimeout(function() {
            W.Factory.grid(scope.grid).showLoader();
        }, 0);

        // [grid.pubsub.publish] Nebula::EnhancedGrid::Grid::BeforeDataLoad
        $.publish(
            "Nebula::EnhancedGrid::Grid::BeforeDataLoad", [scope, url, query]);
        // [grid.event.notify] Nebula::EnhancedGrid::Grid::BeforeDataLoad
        scope.target.triggerHandler(
            "Nebula::EnhancedGrid::Grid::BeforeDataLoad", [scope, url, query]);
    };

    self.handleScrollLoadGridOnDataLoaded =
    function handleScrollLoadGridOnDataLoaded(data, status, xhr, scope) {
        var eh = scope,
            gd = W.Factory.grid(eh.grid),
            gg = gd.getGrid(),
            i, j, from, to, dt;

        if (gd.xhreq === null) {
            return;
        }

        from = gd.xhreq.from;
        to = from + data.count;

        if (!data.data || !data.data.length || !data.data[0].xt) {
            if (gd.xhreq.initial) {
                gd.setData([]);
                gd.getData().length = 0;
            }

            gd.xhreq = null;
            gd.getData().length = from;
            gd.hideLoader();
            return;
        }

        // set dynamic columns
        if (data.columns) {
            try {
                data.columns = eval(
                    JSON.stringify(data.columns)
                        .replace(/"<!\[FUNC\[([^\]]*)\]\]>"/g, '$1')
                );
                gg.setColumns(data.columns);
            } catch (err) {}
        }

        // reset data first if it's a reload
        if (gd.xhreq.reload) {
            gd.setData([]);
        }
        // reset data length
        dt = gd.getData();
        dt.length = parseInt(data.data[0].xt, 10);

        // assign remote data to grid data
        for (i = 0, j = data.data.length; i < j; i++) {
            dt[from + i] = data.data[i];
            dt[from + i].index = from + i;
        }

        gd.xhreq = null;

        for (i = from; i <= to; i++) {
            gg.invalidateRow(i);
        }

        gg.updateRowCount();
        gg.resizeCanvas();
        gg.render();

        setTimeout(function() {
            gd.hideLoader();
        }, 10);

        eh.requestable = true;

        // [grid.pubsub.publish] Nebula::EnhancedGrid::Grid::DataLoaded
        $.publish(
            "Nebula::EnhancedGrid::Grid::DataLoaded", [scope, data, status, xhr]);
        // [grid.event.notify] Nebula::EnhancedGrid::Grid::DataLoaded
        scope.target.triggerHandler(
            "Nebula::EnhancedGrid::Grid::DataLoaded", [scope, data, status, xhr]);

        if (typeof ga == "function" && eh.startTime) {
            ga("send", {
                hitType: "timing",
                timingCategory: "Grid Load",
                timingVar: eh.getPackageName() + " EnhancedGrid #" + eh.target.prop("id"),
                timingValue: N.Timing.get(eh.startTime, N.Timing.now()),
                timingLabel: Nebula.Global.username
            });
        }
    };

    self.handleGridGroupByOnDataLoaded =
    function handleGridGroupByOnDataLoaded(data, status, xhr, scope) {
        var eh = scope,
            gd = W.Factory.grid(eh.grid),
            gg = gd.getGrid(),
            gp = new Slick.Data.GroupItemMetadataProvider(),
            dv = new Slick.Data.DataView({groupItemMetadataProvider: gp});

        gg.registerPlugin(gp);
        gd.setData(dv);

        if (!data.data || !data.data.length) {
            gd.hideLoader();
            return;
        }

        // set dynamic columns
        if (data.columns) {
            try {
                data.columns = eval(
                    JSON.stringify(data.columns)
                        .replace(/"<!\[FUNC\[([^\]]*)\]\]>"/g, '$1')
                );
                gg.setColumns(data.columns);
            } catch (err) {}
        }

        // add [id] attribute to data.data as it's required from DataView iterator
        for (var i = data.data.length; i--; ) {
            data.data[i].id = "id_" + i;
        }

        dv.onRowCountChanged.subscribe(function(e, args) {
            gg.updateRowCount();
            gg.render();
        });
        dv.onRowsChanged.subscribe(function(e, args) {
            gg.invalidateRows(args.rows);
            gg.render();
        });

        dv.beginUpdate();
        dv.setItems(data.data);
        dv.groupBy.apply(dv.groupBy, eh.getDef().grid.groupBy);
        dv.endUpdate();

        eh.subscribeGridCollapseGroups();

        setTimeout(function() {
            gd.hideLoader();
        }, 10);

        eh.requestable = true;

        // [grid.pubsub.publish] Nebula::EnhancedGrid::Grid::DataLoaded
        $.publish(
            "Nebula::EnhancedGrid::Grid::DataLoaded", [scope, data, status, xhr]);
        // [grid.event.notify] Nebula::EnhancedGrid::Grid::DataLoaded
        scope.target.triggerHandler(
            "Nebula::EnhancedGrid::Grid::DataLoaded", [scope, data, status, xhr]);

        if (typeof ga == "function" && eh.startTime) {
            ga("send", {
                hitType: "timing",
                timingCategory: "EnhancedGrid Load",
                timingVar: eh.getPackageName() + " EnhancedGrid #" + eh.target.prop("id"),
                timingValue: N.Timing.get(eh.startTime, N.Timing.now()),
                timingLabel: Nebula.Global.username
            });
        }
    };

    self.handleGridOnDataLoaded = self.handleScrollLoadGridOnDataLoaded;

    self.handleGridOnSortRemote =
    function handleGridOnSortRemote(e, args) {
        var vp, gg = args.grid, sc = args.sortCols[0];

        for (var prop in this.changedRows) {
            if (this.changedRows.hasOwnProperty(prop)) {
                // has changed rows
                break;
            }
        }
        this.emptyChangedRows();

        this.sortColumn = sc.sortCol.field;
        this.sortDirection = sc.sortAsc ? "Asc" : "Desc";

        gg.scrollRowToTop(0);

        vp = gg.getViewport();
        this.requestRemoteData(vp.top, this.pageSize, true);
    };

    self.handleGridOnSortLocal =
    function handleGridOnSortLocal(e, args) {
        var grid = args.grid,
            cols = args.sortCols || [{sortAsc: args.sortAsc, sortCol: args.sortCol}];
        grid.getData().sort(function(dataRow1, dataRow2) {
            var i, j, field, sign, value1, value2, result;
            for (i = 0, j = cols.length; i < j; i++) {
                field = cols[i].sortCol.field;
                sign = cols[i].sortAsc ? 1 : -1;
                value1 = dataRow1[field];
                value2 = dataRow2[field];
                result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
                if (result !== 0) {
                    return result;
                }
            }
            return 0;
        });
        grid.invalidate();
        grid.render();
    };

    self.handleGridOnViewportChanged =
    function handleGridOnViewportChanged(e, args) {
        var vp = args.grid.getViewport();
        if (!this.isGridScrollLoadEnabled()) { return; }
        if (vp.top > 0 && vp.bottom <= args.grid.getDataLength() && this.requestable) {
            this.ensureGridData(vp.top, vp.bottom);
        }
    };


    self.handleGridOnCellChange =
    function handleGridOnCellChange(e, args) {
        switch (this.triggerSave) {
            case "instant": this.postSaveGridChange(args.item); break;
            case "button" : this.addChangedRow(args.row, args.item); break;
        }
    };

    self.handleGridOnKeyDown =
    function handleGridOnKeyDown(e, args) {
        if (!args.grid.getOptions().autoEdit) { return; }
        if (args.grid.getOptions().enableAddRow) { return; }
        if (!{9: "tab", 13: "enter"}.hasOwnProperty(e.which)) { return; }
        if (e.which == 9 && e.shiftKey && !e.ctrlKey && !e.altKey) { return; }
        if ((args.row + 1) !== args.grid.getDataLength() || (args.cell + 1) !== args.grid.getColumns().length) { return; }
        try {
            args.grid.getEditorLock().commitCurrentEdit();
            args.grid.resetActiveCell();
            args.grid.setSelectedRows([args.row]);
        } catch (err) {}
    };

    self.handleGridOnSelectedRowsChanged =
    function handleGridOnSelectedRowsChanged(e, args) {
        var t = this;
        if (args.rows.length != 1) { return; }
        if (t.target.data("lastSelectedRow") == args.rows[0]) { return; }
        t.target.data("lastSelectedRow", args.rows[0]);
        t.preview.fadeOut("fast", function() {
            t.loadDataToPreviewPane();
            t.preview.fadeIn();
        });
    };

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Build.EnhancedGrid or its
    // child classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
            // removes data attribute [signature] that was injected by Run.js
            // for EnhancedGrid builder
            this.target.removeData("signature");
            // ** Pub:Sub **
            // subscribes to the following topics from EnhancedSearch builder
            $.subscribe("Nebula::EnhancedSearch::Search::BeforeSend", $.proxy(this.subscribeSearchSubmit, this));
            $.subscribe("Nebula::EnhancedSearch::Search::Done", $.proxy(this.subscribeSearchDone, this));
            $.subscribe("Nebula::EnhancedSearch::Search::Fail", $.proxy(this.subscribeSearchFail, this));
            $.subscribe("Nebula::EnhancedSearch::Reset", $.proxy(this.subscribeSearchReset, this));
            $.subscribe("Nebula::EnhancedSearch::Save", $.proxy(this.subscribeSearchSave, this));
            // initialization subscribers
            $.subscribe("Nebula::EnhancedGrid::Toolbar::Init", $.proxy(this.subscribeToolbarInit, this));
            $.subscribe("Nebula::EnhancedGrid::Filter::Init", $.proxy(this.subscribeFilterInit, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::Init", $.proxy(this.subscribeGridInit, this));
            $.subscribe("Nebula::EnhancedGrid::Preview::Init", $.proxy(this.subscribePreviewInit, this));
            $.subscribe("Nebula::EnhancedGrid::Init", $.proxy(this.subscribeInit, this));
            // moar subscribers
            $.subscribe("Nebula::EnhancedGrid::Queue::Push", $.proxy(this.subscribeQueuePush, this));
            $.subscribe("Nebula::EnhancedGrid::Proxy", $.proxy(this.subscribeProxy, this));
            $.subscribe("Nebula::EnhancedGrid::MergeSearchQuery", $.proxy(this.subscribeMergeSearchQuery, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::Refresh", $.proxy(this.subscribeGridRefresh, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::LoadData", $.proxy(this.subscribeGridLoadData, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::EmptyData", $.proxy(this.subscribeGridEmptyData, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::ShowColumns", $.proxy(this.subscribeGridShowColumns, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::HideColumns", $.proxy(this.subscribeGridHideColumns, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::Resize", $.proxy(this.subscribeGridResize, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::UpdateHeaders", $.proxy(this.subscribeGridUpdateHeaders, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::UpdateRow", $.proxy(this.subscribeGridUpdateRow, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::SelectRows", $.proxy(this.subscribeGridSelectRows, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::ExpandGroups", $.proxy(this.subscribeGridExpandGroups, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::CollapseGroups", $.proxy(this.subscribeGridCollapseGroups, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::SetViewportRows", $.proxy(this.subscribeGridSetViewportRows, this));
            $.subscribe("Nebula::EnhancedGrid::Grid::CommitCurrentEdit", $.proxy(this.subscribeGridCommitCurrentEdit, this));
            $.subscribe("Nebula::Build::SmallParts::Viewport::Resize", $.proxy(this.subscribeGridResize, this));
            $.subscribe("Nebula::Build::SmallParts::FontSize::ZoomIn", $.proxy(this.subscribeFontSizeZoomInOut, this));
            $.subscribe("Nebula::Build::SmallParts::FontSize::ZoomOut", $.proxy(this.subscribeFontSizeZoomInOut, this));
            // grid value save trigger
            this.triggerSave = this.target.data("triggerSave") || "instant";
            // function execution queue related
            this.fQueueCond(this.fQueueWrap(function() {
                return (this.hasSearchDone === false);
            }, this));

            this.target
                .on("Nebula::EnhancedGrid::Toolbar::Init", $.proxy(this.handleEventToolbarInit, this))
                .on("Nebula::EnhancedGrid::Filter::Init", $.proxy(this.handleEventFilterInit, this))
                .on("Nebula::EnhancedGrid::Grid::Init", $.proxy(this.handleEventGridInit, this))
                .on("Nebula::EnhancedGrid::Preview::Init", $.proxy(this.handleEventPreviewInit, this))
                .on("Nebula::EnhancedGrid::Init", $.proxy(this.handleEventInit, this))
                .on("Nebula::EnhancedGrid::Queue::Push", $.proxy(this.handleEventQueuePush, this))
                .on("Nebula::EnhancedGrid::Proxy", $.proxy(this.handleEventProxy, this))
                .on("Nebula::EnhancedGrid::MergeSearchQuery", $.proxy(this.handleEventMergeSearchQuery, this))
                .on("Nebula::EnhancedGrid::Grid::Refresh", $.proxy(this.handleEventGridRefresh, this))
                .on("Nebula::EnhancedGrid::Grid::LoadData", $.proxy(this.handleEventGridLoadData, this))
                .on("Nebula::EnhancedGrid::Grid::EmptyData", $.proxy(this.handleEventGridEmptyData, this))
                .on("Nebula::EnhancedGrid::Grid::ShowColumns", $.proxy(this.handleEventGridShowColumns, this))
                .on("Nebula::EnhancedGrid::Grid::HideColumns", $.proxy(this.handleEventGridHideColumns, this))
                .on("Nebula::EnhancedGrid::Grid::AddColumns", $.proxy(this.handleEventGridAddColumns, this))
                .on("Nebula::EnhancedGrid::Grid::RemoveColumns", $.proxy(this.handleEventGridRemoveColumns, this))
                .on("Nebula::EnhancedGrid::Grid::SetColumns", $.proxy(this.handleEventGridRemoveColumns, this))
                .on("Nebula::EnhancedGrid::Grid::RearrangeColumns", $.proxy(this.handleEventGridRearrangeColumns, this))
                .on("Nebula::EnhancedGrid::Grid::Resize", $.proxy(this.handleEventGridResize, this))
                .on("Nebula::EnhancedGrid::Grid::UpdateHeaders", $.proxy(this.handleEventGridUpdateHeaders, this))
                .on("Nebula::EnhancedGrid::Grid::UpdateRow", $.proxy(this.handleEventGridUpdateRow, this))
                .on("Nebula::EnhancedGrid::Grid::SelectRows", $.proxy(this.handleEventGridSelectRows, this))
                .on("Nebula::EnhancedGrid::Grid::ExpandGroups", $.proxy(this.handleEventGridExpandGroups, this))
                .on("Nebula::EnhancedGrid::Grid::CollapseGroups", $.proxy(this.handleEventGridCollapseGroups, this))
                .on("Nebula::EnhancedGrid::Grid::SetViewportRows", $.proxy(this.handleEventGridSetViewportRows, this))
                .on("Nebula::EnhancedGrid::Grid::CommitCurrentEdit", $.proxy(this.handleEventGridCommitCurrentEdit, this))
                ;
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            if (this.preview && this.preview.length)
                this.preview.find("button").off();   // click
            if (this.filter && this.filter.length && this.useFilter)
                this.filter.find("[name='filters[]']").off();   // change

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.def = null;
            this.filter = null;
            this.toolbar = null;
            this.grid = null;
            this.preview = null;
            this.previewContent = null;
            this.previewToolbar = null;
            this.previewLoader = null;
            this.initedAll = null;
            this.initedFilter = null;
            this.initedToolbar = null;
            this.initedGrid = null;
            this.initedPreview = null;
            this.query = null;
            this.pageSize = null;
            this.requestable = null;
            this.searchCls = null;
            this.searchUrl = null;
            this.searchQuery = null;
            this.isScrollLoadGrid = null;
            this.isGroupByGrid = null;
            this.mapper = null;
            this.subsetTpl = null;
            this.useFilter = null;
            this.changedRows = null;
            this.columnsWithKeys = null;
            this.allAvailableColumns = null;
            this.currentColumns = null;
            this.filterColumns = null;
            this.hasSearchDone = null;
            this.startTime = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.def;
            delete this.filter;
            delete this.toolbar;
            delete this.grid;
            delete this.preview;
            delete this.previewContent;
            delete this.previewToolbar;
            delete this.previewLoader;
            delete this.initedAll;
            delete this.initedFilter;
            delete this.initedToolbar;
            delete this.initedGrid;
            delete this.initedPreview;
            delete this.query;
            delete this.pageSize;
            delete this.requestable;
            delete this.searchCls;
            delete this.searchUrl;
            delete this.searchQuery;
            delete this.isScrollLoadGrid;
            delete this.isGroupByGrid;
            delete this.mapper;
            delete this.subsetTpl;
            delete this.useFilter;
            delete this.changedRows;
            delete this.columnsWithKeys;
            delete this.allAvailableColumns;
            delete this.currentColumns;
            delete this.filterColumns;
            delete this.hasSearchDone;
            delete this.startTime;
        },

        // ***** PUBLIC METHODS *****
        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Init
        //
        subscribeInit: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Init");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Init
        //
        handleEventInit: function(evt) {
            var enh = this;

            return Q.Promise(function(resolve, reject, notify) {
                if (enh.initedAll) {
                    resolve(enh);
                    return;
                }

                Q.all([
                    enh.target.triggerHandler("Nebula::EnhancedGrid::Toolbar::Init"),
                    enh.target.triggerHandler("Nebula::EnhancedGrid::Filter::Init"),
                    enh.target.triggerHandler("Nebula::EnhancedGrid::Grid::Init"),
                    enh.target.triggerHandler("Nebula::EnhancedGrid::Preview::Init")
                ]).spread(function() {
                    enh.toolbar.on("Nebula::Widget::Toolbar::Button::Click", function() {
                        enh.grid.triggerHandler("Nebula::Widget::Grid::CommitCurrentEdit");
                    });

                    // [grid.pubsub.publish] Nebula::EnhancedGrid::PostInitAction
                    $.publish(
                        "Nebula::EnhancedGrid::PostInitAction", [enh]);
                    // [grid.event.notify] Nebula::EnhancedGrid::PostInitAction
                    enh.target.triggerHandler(
                        "Nebula::EnhancedGrid::PostInitAction", [enh]);

                    enh.initedAll = true;
                    resolve(enh);
                });
            });
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Toolbar::Init
        //
        subscribeToolbarInit: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Toolbar::Init");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Toolbar::Init
        //
        handleEventToolbarInit: function(evt) {
            var enh = this;

            return Q.Promise(function(resolve, reject, notify) {
                if (enh.initedToolbar) {
                    resolve(enh);
                    return;
                }

                if (enh.getDef().toolbar.length > 0) {
                    W.Factory.toolbar(enh.toolbar)
                        .stretch()
                        .build(enh.getDef().toolbar, enh)
                        .disableOne("save");
                } else {
                    enh.toolbar.hide();
                }

                // [grid.pubsub.publish] Nebula::EnhancedGrid::Toolbar::PostInitAction
                $.publish(
                    "Nebula::EnhancedGrid::Toolbar::PostInitAction", [enh]);
                // [grid.event.notify] Nebula::EnhancedGrid::Toolbar::PostInitAction
                enh.target.triggerHandler(
                    "Nebula::EnhancedGrid::Toolbar::PostInitAction", [enh]);

                enh.initedToolbar = true;
                resolve(enh);
            });
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Filter::Init
        //
        subscribeFilterInit: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Filter::Init");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Filter::Init
        //
        handleEventFilterInit: function(evt) {
            var enh = this, grd;

            return Q.Promise(function(resolve, reject, notify) {
                if (enh.initedFilter) {
                    resolve(enh);
                    return;
                }

                if (enh.boolval(enh.target.data("useFilter"))) {
                    grd = W.Factory.grid(enh.grid).getGrid();

                    enh.useFilter = true;
                    $.each(enh.getDef().grid.columns, function(i, col) {
                        enh.columnsWithKeys[col.id] = col;
                    });

                    $(enh.filter[0]).find("[name='filters[]']").on("change", function() {
                        grd.setColumns(enh.getSelectedFiltersColumns(enh.getSelectedFilters()));
                        grd.setSelectedRows(grd.getSelectedRows());
                        if (!!navigator.userAgent.match(/firefox/i)) {
                            $(enh.target[0]).find(".slick-resizable-handle")
                                .trigger("dragstart")
                                .trigger("drag")
                                .trigger("dragend");
                        }
                    });

                    enh.target.on("Nebula::EnhancedGrid::Grid::DataLoaded", function(e, enh) {
                        setTimeout(function() {
                            $(enh.filter[0]).find("[name='filters[]']:first").trigger("change");
                        }, 0);
                    });
                }

                // [grid.pubsub.publish] Nebula::EnhancedGrid::Filter::PostInitAction
                $.publish(
                    "Nebula::EnhancedGrid::Filter::PostInitAction", [enh]);
                // [grid.event.notify] Nebula::EnhancedGrid::Filter::PostInitAction
                enh.target.triggerHandler(
                    "Nebula::EnhancedGrid::Filter::PostInitAction", [enh]);

                enh.initedFilter = true;
                resolve(enh);
            });
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::Init
        //
        subscribeGridInit: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::Init");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::Init
        //
        handleEventGridInit: function(evt) {
            var enh = this;

            return Q.Promise(function(resolve, reject, notify) {
                if (enh.initedGrid) {
                    resolve(enh);
                    return;
                }

                W.Factory.grid(enh.grid, {
                    columns: enh.getDef().grid.columns,
                    subscribers: $.extend({}, {
                        onSort           : $.proxy(self.handleGridOnSortRemote, enh),
                        onViewportChanged: $.proxy(self.handleGridOnViewportChanged, enh),
                        onCellChange     : $.proxy(self.handleGridOnCellChange, enh),
                        onKeyDown        : $.proxy(self.handleGridOnKeyDown, enh)
                    }, enh.getDef().grid.subscribers),
                    events: $.extend({}, {
                        // onBeforeDataLoad: $.proxy(self.handleGridOnBeforeDataLoad, enh),
                        // onDataLoaded    : $.proxy(self.handleGridOnDataLoaded, enh)
                    }, enh.getDef().grid.events),
                    groupBy: enh.getDef().grid.groupBy,
                    scope: enh
                }, enh.grid.data("dataSource") || []);

                enh.isGroupByGrid = enh.getDef().grid.hasOwnProperty("groupBy");

                // [grid.pubsub.publish] Nebula::EnhancedGrid::Grid::PostInitAction
                $.publish(
                    "Nebula::EnhancedGrid::Grid::PostInitAction", [enh]);
                // [grid.event.notify] Nebula::EnhancedGrid::Grid::PostInitAction
                enh.target.triggerHandler(
                    "Nebula::EnhancedGrid::Grid::PostInitAction", [enh]);

                enh.initedGrid = true;
                resolve(enh);
            });
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Preview::Init
        //
        subscribePreviewInit: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Preview::Init");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Preview::Init
        //
        handleEventPreviewInit: function(evt) {
            var enh = this;

            return Q.Promise(function(resolve, reject, notify) {
                if (enh.initedPreview) {
                    resolve(enh);
                    return;
                }

                enh.preview.find("button.icon-btn.print").on("click", function() {
                    window.print();
                });
                enh.preview.find("button.icon-btn.exit-print").on("click", function(evvt) {
                    enh.preview.fadeOut();
                    enh.grid.add(enh.toolbar).fadeIn();
                    $(evvt.currentTarget).hide();
                });

                // [grid.pubsub.publish] Nebula::EnhancedGrid::Preview::PostInitAction
                $.publish(
                    "Nebula::EnhancedGrid::Preview::PostInitAction", [enh]);
                // [grid.event.notify] Nebula::EnhancedGrid::Preview::PostInitAction
                enh.target.triggerHandler(
                    "Nebula::EnhancedGrid::Preview::PostInitAction", [enh]);

                enh.initedPreview = true;
                resolve(enh);
            });
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Queue::Push
        //
        subscribeQueuePush: function(func, qname, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Queue::Push", [func, qname]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Queue::Push
        //
        handleEventQueuePush: function(evt, func, qname) {
            if (this.fQueueCond()) {
                this.fQueuePush(this.fQueueWrap(func, this), qname || "default");
            } else
                func.call(this);

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Proxy
        //
        subscribeProxy: function(func, args, reference, publisher) {
            if (!this.isReferenceMatched(reference)) {
                return this;
            }
            return func.apply(this, args.concat([this]));
            // return this.target.triggerHandler("Nebula::EnhancedGrid::Proxy", [func, args]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Proxy
        //
        handleEventProxy: function(evt, func, args) {
            return func.apply(this, args.concat([this]));
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::MergeSearchQuery
        //
        subscribeMergeSearchQuery: function(change, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::MergeSearchQuery", [change]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::MergeSearchQuery
        //
        handleEventMergeSearchQuery: function(evt, change) {
            this.mergeSearchQuery(change);
            return this;
        },

        //
        // [search.pubsub.subscribe]
        //
        subscribeSearchSubmit: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) {
                return this;
            }

            this.searchCls   = publisher;
            this.searchUrl   = this.searchCls.searchUrl || "";
            this.searchQuery = this.searchCls.searchQuery || {};

            if (!this.boolval(this.target.data("alwaysShowEverything"))) {
                this.target.add(this.toolbar).add(this.grid).add(this.preview).hide();
            }
            this.target.removeData("lastSelectedRow");
            // set [requestable] to false to prevent grid data request being
            // trigger when [onViewportChanged] event is triggered
            //
            // [onViewportChanged] event is triggered by slick.grid methods
            // updateRowCount() and setData() which are invoked in
            // W.Grid.loadAndRenderData()
            //
            // in short, we need to prevent grid data load request method
            // ensureGridData() from being invoked after [SearchSection] is
            // re-submitted :)
            this.requestable = false;
            this.hasSearchDone = false;
            this.emptyChangedRows();

            return this;
        },

        //
        // [search.pubsub.subscribe]
        //
        subscribeSearchDone: function(data, status, xhr, publisher) {
            if (!this.isReferenceMatched(xhr.gridReferenceId)) {
                return this;
            }

            var gd = W.Factory.grid(this.grid),
                gg = gd.getGrid(),
                tt = this;

            this.searchCls = publisher;
            this.searchUrl = xhr.searchUrl;
            this.searchQuery = xhr.searchQuery;
            this.pageSize = this.searchCls.pageSize;
            this.optimalRange = this.pageSize;
            this.query = null;
            this.mergeSearchQuery({});

            xhr.initial = true;

            if (("count" in data) &&
                (data.count > 0) &&
                (("xt" in data.data[0]) || !("computed" in data.data[0]))
            ) {
                // clear sort direction and column
                this.target
                    .triggerHandler("Nebula::EnhancedGrid::Grid::Init")
                    .then(function() {
                        gg.setSortColumns([]);
                        // set dynamic columns
                        if (data.columns) {
                            try {
                                data.columns = eval(
                                    JSON.stringify(data.columns)
                                        .replace(/"<!\[FUNC\[([^\]]*)\]\]>"/g, '$1')
                                );
                                gg.setColumns(data.columns);
                            } catch (err) {}
                        }
                        // fade in toolbar and grid
                        tt.target.add(tt.grid).fadeIn({
                            complete: function() {
                                if (this.id !== tt.target[0].id) {
                                    return;
                                }
                                tt.target.triggerHandler(
                                    "Nebula::EnhancedGrid::FadeIn::Complete", [tt, data.data]);
                            }
                        });
                        if (tt.getDef().toolbar.length > 0) {
                            tt.toolbar.fadeIn();
                        }
                        // function execution queue related
                        // TODO: should be re-written with Q or jQuery deferred
                        tt.hasSearchDone = true;
                        tt.fQueueExec();
                        // group by grid - use Slick.Data.DataView to handle data
                        // grouping and sorting
                        if (tt.isGroupByGrid) {
                            tt.handleGridGroupByOnDataLoaded.call(tt, data, status, xhr, tt);
                        }
                        // otherwise use regular data format - json
                        else {
                            gd.setData(data.data);
                            gd.getData().length = (
                                tt.isGridScrollLoadEnabled() && data.data[0].xt
                            ) ? parseInt(data.data[0].xt, 10) : parseInt(data.data.length, 10);
                        }
                        gd.loadAndRenderData();
                        // automatically select the first row
                        if (tt.boolval(tt.target.data("selectFirstRow"))) {
                            gg.setSelectedRows([0]);
                            if (data.count > 1) {
                                gg.setActiveCell(0, 0);
                                gg.focus();
                            }
                        } else {
                            try {
                                gg.setSelectedRows([]);
                                gg.resetActiveCell();
                            } catch (err) {}
                        }
                        // set [requestable] back to true to allow data pulling from
                        // restful api to update and load grid data
                        tt.requestable = true;
                        // [grid.pubsub.publish] Nebula::EnhancedGrid::Grid::DataLoaded
                        $.publish(
                            "Nebula::EnhancedGrid::Grid::DataLoaded", [tt, data, status, xhr]);
                        // [grid.event.notify] Nebula::EnhancedGrid::Grid::DataLoaded
                        tt.target.triggerHandler(
                            "Nebula::EnhancedGrid::Grid::DataLoaded", [tt, data, status, xhr]);
                    });
            } else if (this.boolval(this.target.data("showEmptyGrid"))) {
                // clear sort direction and column
                this.target
                    .triggerHandler("Nebula::EnhancedGrid::Grid::Init")
                    .then(function() {
                        gg.setSortColumns([]);
                        // fade in toolbar and grid
                        tt.target.add(tt.grid).fadeIn({
                            complete: function() {
                                if (this.id !== tt.target[0].id) {
                                    return;
                                }
                                // [grid.event.notify] Nebula::EnhancedGrid::FadeIn::Complete
                                tt.target.triggerHandler(
                                    "Nebula::EnhancedGrid::FadeIn::Complete", [tt, []]);
                            }
                        });
                        if (tt.getDef().toolbar.length > 0) {
                            tt.toolbar.fadeIn();
                        }
                        // function execution queue related
                        // TODO: should be re-written with Q or jQuery deferred
                        tt.hasSearchDone = true;
                        tt.fQueueExec();
                        // empty grid rows and render
                        gd.setData(data.data || []);
                        gd.getData().length = 0;
                        gd.loadAndRenderData();
                        // [grid.pubsub.publish] Nebula::EnhancedGrid::Grid::DataLoaded
                        $.publish(
                            "Nebula::EnhancedGrid::Grid::DataLoaded", [tt, data, status, xhr]);
                        // [grid.event.notify] Nebula::EnhancedGrid::Grid::DataLoaded
                        tt.target.triggerHandler(
                            "Nebula::EnhancedGrid::Grid::DataLoaded", [tt, data, status, xhr]);
                });
            } else
                this.target.add(this.toolbar).add(this.grid).add(this.preview).fadeOut();

            return this;
        },

        //
        // [search.pubsub.subscribe]
        //
        subscribeSearchFail: function(xhr, status, throwable, publisher) {
            if (!this.isReferenceMatched(xhr.gridReferenceId)) {
                return this;
            }

            this.searchCls   = publisher;
            this.searchUrl   = this.searchCls.searchUrl || "";
            this.searchQuery = this.searchCls.searchQuery || {};

            if (status == "InvalidParameterError") {
                this.target.add(this.toolbar).add(this.grid).add(this.preview).fadeOut();
            }

            return this;
        },

        //
        // [search.pubsub.subscribe]
        //
        subscribeSearchReset: function(event, publisher) {
            this.searchCls   = publisher;
            this.searchUrl   = this.searchCls.searchUrl || "";
            this.searchQuery = this.searchCls.searchQuery || {};
        },

        //
        // [search.pubsub.subscribe]
        //
        subscribeSearchSave: function(event, publisher) {
            this.searchCls   = publisher;
            this.searchUrl   = this.searchCls.searchUrl || "";
            this.searchQuery = this.searchCls.searchQuery || {};
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::Refresh
        //
        // data, status and xhr are published from EnhancedModal class
        //
        subscribeGridRefresh: function(data, status, xhr, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedGrid::Grid::Refresh", [data, status, xhr]);
            return this;
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::Refresh
        //
        handleEventGridRefresh: function(e, data, status, xhr) {
            if (this.isGridScrollLoadEnabled()) {
                this.refreshGridViewport();
            } else
                this.refreshEntireGrid();
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::Resize
        //
        subscribeGridResize: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::Resize");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::Resize
        //
        handleEventGridResize: function(evt) {
            var grd = W.Factory.grid(this.grid),
                grg = grd.getGrid();

            grg.resizeCanvas();
            grg.autosizeColumns();
            grd.relocateLoaderAndPlaySpinner();

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::UpdateHeaders
        //
        subscribeGridUpdateHeaders: function(columns, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::UpdateHeaders", [columns]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::UpdateHeaders
        //
        handleEventGridUpdateHeaders: function(evt, columns) {
            var grd = W.Factory.grid(this.grid).getGrid();

            for (var i = columns.length; i--; ) {
                grd.updateColumnHeader(
                    columns[i].id || "",
                    columns[i].title || "",
                    columns[i].tooltip || ""
                );
            }

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::UpdateRow
        //
        subscribeGridUpdateRow: function(row, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::UpdateRow", [row]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::UpdateRow
        //
        handleEventGridUpdateRow: function(evt, row) {
            W.Factory.grid(this.grid).getGrid().updateRow(row);
            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::SelectRows
        //
        subscribeGridSelectRows: function(rows, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::SelectRows", [rows]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::SelectRows
        //
        handleEventGridSelectRows: function(evt, rows) {
            var grd = W.Factory.grid(this.grid).getGrid(),
                row = $.isArray(rows) ? rows : [];

            if (!grd.getData().length) {
                return this;
            }

            grd.setSelectedRows(row);
            if (row.length > 0 && grd.getData().length > 0) {
                grd.setActiveCell(row[0], 0);
                grd.focus();
            }

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::ExpandGroups
        //
        subscribeGridExpandGroups: function(groups, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::ExpandGroups", [groups]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::ExpandGroups
        //
        handleEventGridExpandGroups: function(evt, groups) {
            var dat = W.Factory.grid(this.grid).getData();

            if ($.isArray(dat)) {
                return this;
            }

            groups = ($.isArray(groups) && groups.length > 0) ? groups : dat.getGroups();

            dat.beginUpdate();
            for (var i = groups.length; i--; ) {
                dat.expandGroup(groups[i].value);
            }
            dat.endUpdate();

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::CollapseGroups
        //
        subscribeGridCollapseGroups: function(groups, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::CollapseGroups", [groups]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::CollapseGroups
        //
        handleEventGridCollapseGroups: function(evt, groups) {
            var dat = W.Factory.grid(this.grid).getData();

            if ($.isArray(dat)) {
                return this;
            }

            groups = ($.isArray(groups) && groups.length > 0) ? groups : dat.getGroups();

            dat.beginUpdate();
            for (var i = groups.length; i--; ) {
                dat.collapseGroup(groups[i].value);
            }
            dat.endUpdate();

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::SetViewportRows
        //
        subscribeGridSetViewportRows: function(rows, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::SetViewportRows", [rows]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::SetViewportRows
        //
        handleEventGridSetViewportRows: function(evt, rows) {
            W.Factory.grid(this.grid).setViewportRows(rows);
            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::CommitCurrentEdit
        //
        subscribeGridCommitCurrentEdit: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::CommitCurrentEdit");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::CommitCurrentEdit
        //
        handleEventGridCommitCurrentEdit: function(evt) {
            W.Factory.grid(this.grid).getGrid().getEditorLock().commitCurrentEdit();
            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::LoadData
        //
        subscribeGridLoadData: function(settings, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::LoadData", [settings]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::LoadData
        //
        handleEventGridLoadData: function(evt, settings) {
            var grd, grg, dat, dfr, name;

            settings                = settings || {};
            settings.isStaticLoad   = settings.isStaticLoad || false;
            settings.isScrollLoad   = settings.isScrollLoad || false;
            settings.emptyPrevData  = settings.emptyPrevData || false;
            settings.emptySelection = settings.emptySelection || false;
            settings.data           = settings.data || [];
            settings.pageSize       = settings.pageSize || 50;
            settings.url            = settings.url || "";
            settings.query          = settings.query || {};
            settings.from           = settings.from || 0;
            settings.to             = settings.to || settings.pageSize;

            grd = W.Factory.grid(this.grid);
            grg = grd.getGrid();
            dat = grd.getData();
            dfr = Q.defer();

            if (settings.emptyPrevData) {
                try {
                    grd.setData([]);
                    grd.getData().length = 0;
                    grd.loadAndRenderData();
                } catch (err) {}
            }

            if (settings.emptySelection) {
                try {
                    grg.setSelectedRows([]);
                    grg.resetActiveCell();
                } catch (err) {}
            }

            this.target
                .triggerHandler("Nebula::EnhancedGrid::Grid::Init")
                .then(function() {
                    grg.setSortColumns([]);
                });

            if (settings.isStaticLoad) {
                grd.setData(settings.data);
                grd.loadAndRenderData();
                dfr.resolve(settings.data);
            } else {
                this.searchUrl = settings.url;
                this.searchQuery = [];
                for (name in settings.query) {
                    this.searchQuery.push({name: name, value: settings.query[name]});
                }
                this.searchCls.searchUrl = this.searchUrl;
                this.searchCls.searchQuery = this.searchQuery.slice(0);
                this.mergeSearchQuery(settings.query);

                if (settings.isScrollLoad) {
                    this.requestable = true;
                    this.pageSize = settings.pageSize;
                    this.optimalRange = settings.pageSize;
                    this.ensureGridData(settings.from, settings.to, true)
                        .then(function(data) {
                            dfr.resolve(data);
                        });
                } else {
                    W.Factory.grid(this.grid)
                        .requestRemoteData(settings.url, settings.query, this, dfr);
                }
            }

            return dfr.promise;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::EmptyData
        //
        subscribeGridEmptyData: function(reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::EmptyData");
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::EmptyData
        //
        handleEventGridEmptyData: function(evt) {
            var grd = W.Factory.grid(this.grid);

            grd.setData([]);
            grd.getData().length = 0;
            grd.loadAndRenderData();

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::ShowColumns
        //
        subscribeGridShowColumns: function(ids, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::ShowColumns", [ids]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::ShowColumns
        //
        handleEventGridShowColumns: function(evt, ids) {
            var all = this.getAllAvailableColumns(),
                cur = this.getCurrentColumns(),
                col = [], id, i;

            if (!ids || !ids.length) {
                return this;
            }

            for (i = ids.length; i--; ) {
                if (typeof all[ids[i]] != "undefined") {
                    cur[ids[i]] = {};
                }
            }

            for (id in all) {
                if (typeof cur[id] != "undefined") {
                    col.push(all[id]);
                }
            }

            W.Factory.grid(this.grid).getGrid().setColumns(col);

            return this;
        },

        //
        // [grid.pubsub.subscribe] Nebula::EnhancedGrid::Grid::HideColumns
        //
        subscribeGridHideColumns: function(ids, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            return this.target.triggerHandler("Nebula::EnhancedGrid::Grid::HideColumns", [ids]);
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::HideColumns
        //
        handleEventGridHideColumns: function(evt, ids) {
            var all = this.getAllAvailableColumns(),
                cur = this.getCurrentColumns(),
                col = [], id, i;

            if (!ids || !ids.length) {
                return this;
            }

            for (i = ids.length; i--; ) {
                if (typeof cur[ids[i]] != "undefined") {
                    delete cur[ids[i]];
                }
            }

            for (id in all) {
                if (typeof cur[id] != "undefined") {
                    col.push(all[id]);
                }
            }

            W.Factory.grid(this.grid).getGrid().setColumns(col);

            return this;
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::AddColumns
        //
        handleEventGridAddColumns: function(evt, columns) {
            var all = this.getAllAvailableColumns(),
                cur = this.getCurrentColumns(),
                col = [], id, i, j;

            if (!columns || !columns.length) {
                return this;
            }

            for (i = 0, j = columns.length; i < j; i++) {
                all[columns[i].id] = columns[i];
                cur[columns[i].id] = columns[i];
            }

            for (id in cur) {
                col.push(cur[id]);
            }

            W.Factory.grid(this.grid).getGrid().setColumns(col);

            return this;
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::RemoveColumns
        //
        handleEventGridRemoveColumns: function(evt, ids) {
            var all = this.getAllAvailableColumns(),
                cur = this.getCurrentColumns(),
                col = [], id, i;

            if (!ids || !ids.length) {
                return this;
            }

            for (i = ids.length; i--; ) {
                if (typeof all[ids[i]] != "undefined") {
                    delete all[ids[i]];
                }
                if (typeof cur[ids[i]] != "undefined") {
                    delete cur[ids[i]];
                }
            }

            for (id in cur) {
                col.push(cur[id]);
            }

            W.Factory.grid(this.grid).getGrid().setColumns(col);

            return this;
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::SetColumns
        //
        handleEventGridSetColumns: function(evt, columns) {
            if (!columns || !columns.length) {
                return this;
            }

            W.Factory.grid(this.grid).getGrid().setColumns(columns);

            this.allAvailableColumns = null;

            return this;
        },

        //
        // [grid.event.listen] Nebula::EnhancedGrid::Grid::RearrangeColumns
        //
        handleEventGridRearrangeColumns: function(evt, ids) {
            var all = this.getAllAvailableColumns(),
                cur = this.getCurrentColumns(),
                dic, col = [], id, i, j;

            if (!ids || !ids.length) {
                return this;
            }

            for (i = 0, j = ids.length; i < j; i++) {
                if (typeof cur[ids[i]] != "undefined") {
                    dic[ids[i]] = cur[ids[i]];
                }
            }

            for (id in dic) {
                col.push(dic[id]);
            }

            W.Factory.grid(this.grid).getGrid().setColumns(col);

            this.allAvailableColumns = $.extend(dic, all);
        },

        //
        // [fontsize.pubsub.subscribe]
        //
        subscribeFontSizeZoomInOut: function(size, reference) {
            if (!this.isReferenceMatched(reference)) {
                return this;
            }

            this.target
                .removeClass("xsmall small medium large xlarge")
                .addClass(size);

            return this;
        },

        // ==================== grid subscriber handlers ====================
        handleGridOnSortLocal          : function(e, args) { self.handleGridOnSortLocal.call(this, e, args); },
        handleGridOnSortRemote         : function(e, args) { self.handleGridOnSortRemote.call(this, e, args); },
        handleGridOnViewportChanged    : function(e, args) { self.handleGridOnViewportChanged.call(this, e, args); },
        handleGridOnCellChange         : function(e, args) { self.handleGridOnCellChange.call(this, e, args); },
        handleGridOnSelectedRowsChanged: function(e, args) { self.handleGridOnSelectedRowsChanged.call(this, e, args); },

        // ==================== grid event handlers ====================
        handleGridOnBeforeDataLoad      : function(url, query, scope) { self.handleGridOnBeforeDataLoad.call(this, url, query, scope); },
        handleGridScrollLoadOnDataLoaded: function(data, status, xhr, scope) { self.handleGridScrollLoadOnDataLoaded.call(this, data, status, xhr, scope); },
        handleGridGroupByOnDataLoaded   : function(data, status, xhr, scope) { self.handleGridGroupByOnDataLoaded.call(this, data, status, xhr, scope); },
        handleGridOnDataLoaded          : function(data, status, xhr, scope) { self.handleGridOnDataLoaded.call(this, data, status, xhr, scope); },

        loadDataToPreviewPane: function() {
            var t = this,
                grid = W.Factory.grid(t.grid).getGrid(),
                rows = grid.getSelectedRows(),
                mapper = t.getMapper();
            $.each(grid.getData()[rows[0]], function(key, value) {
                var field = (key in mapper) ? mapper[key] : key;
                if (typeof field == "object") {
                    t.subsetCreateTemplate();
                    t.subsetRemoveAllRows();
                    if ($.isArray(value)) {
                        for (var i = 0, j = value.length; i < j; i++) {
                            t.subsetAddNewRow(field, value[i]);
                        }
                    }
                } else {
                    t.preview.find((".preview-{0}").format(field))
                        .html(value).prop("title", value);
                }
            });
            // Nebula::EnhancedGrid::Preview::Load
            // => pubsub
            $.publish(
                "Nebula::EnhancedGrid::Preview::Load", [grid.getData()[rows[0]], t]);
            // => event
            t.target.triggerHandler(
                "Nebula::EnhancedGrid::Preview::Load", [grid.getData()[rows[0]], t]);
        },

        getMapper: function() {
            if (this.mapper === null && this.searchCls !== null) {
                this.mapper = (typeof this.searchCls.getMapper != "undefined") ?
                    this.searchCls.getMapper() : {};
            }
            return this.mapper;
        },

        getDef: function() {
            var t = this;
            if (t.def === null) {
                if (!t.target.prop("id")) {
                    throw new Error("Attribute [id] must be set for grid in order to pull the right definitions.");
                }
                var def = t.target.prop("id")
                    .replace(/\[.*\]$/g, "")
                    .replace(/[-_]/g, " ")
                    .replace(/^([a-z])|\s+([a-z])/g, function ($1) { return $1.toUpperCase(); })
                    .replace(/\s/g, "");
                if (!(def in N.GridDef)) {
                    throw new Error(("Cannot find grid column definition [{0}].").format(def));
                }
                // point this.def to Nebula.GridDef[def]
                t.setDef(N.GridDef[def]);
            }
            return t.def;
        },

        setDef: function(def) {
            var t = this;

            t.def = def;

            // set default values
            t.def.toolbar          = t.def.toolbar || [];
            t.def.grid             = t.def.grid || {};
            t.def.grid.columns     = t.def.grid.columns || {};
            t.def.grid.subscribers = t.def.grid.subscribers || {};
            t.def.grid.events      = t.def.grid.events || {};
            t.def.preview          = t.def.preview || [];
            t.def.filter           = t.def.filter || {};

            // use proxy method to change subscriber context to [this]
            $.each(t.def.grid.columns, function(index, column) {
                if (column.hasOwnProperty("formatter")) {
                    t.def.grid.columns[index].formatter = $.proxy(column.formatter, t);
                }
                if (column.hasOwnProperty("asyncPostRender")) {
                    t.def.grid.columns[index].asyncPostRender = $.proxy(column.asyncPostRender, t);
                }
            });
            $.each(t.def.grid.subscribers, function(action, method) {
                t.def.grid.subscribers[action] = $.proxy(method, t);
            });
            $.each(t.def.grid.events, function(action, method) {
                t.def.grid.events[action] = $.proxy(method, t);
            });
            // add cell editor commitment trigger to toolbar save button handler
            $.each(t.def.toolbar, function(index, button) {
                if (button.name == "save" && typeof button.click == "function") {
                    var oldSaveClick = button.click;
                    t.def.toolbar[index].click = function newSaveClick() {
                        t.grid.triggerHandler("Nebula::Widget::Grid::CommitCurrentEdit");
                        return oldSaveClick.apply(t, arguments);
                    };
                }
            });

            return this;
        },

        subsetCreateTemplate: function() {
            var t = this;
            if (t.subsetTpl === null) {
                t.subsetTpl = t.preview.find(".form-grid.appendable .form-row.template:first").clone();
                t.subsetTpl.find("strong").map(function() {
                    $(this).html("");
                });
            }
            return t.subsetTpl;
        },

        subsetRemoveAllRows: function() {
            this.preview.find(".form-grid.appendable .form-row.template").remove();
        },

        subsetAddNewRow: function(field, values) {
            var t = this, row = t.subsetTpl.clone();
            if (typeof field != "undefined" && typeof values != "undefined") {
                for (var subkey in field) {
                    row.find((".preview-{0}").format(field[subkey]).replace("[]", ""))
                        .html(values[subkey]).prop("title", values[subkey]);
                }
            }
            t.preview.find(".form-grid.appendable").append(row);
        },

        postSaveGridChange: function(item, sequence, total, callbacks) {
            var t = this, sequential = (arguments.length > 1);
            callbacks = callbacks || {};
            t.xhr({
                method: "POST",
                url: t.target.data("submitUrl"),
                data: t.exchangeItemKeys(sequential ? item[sequence - 1] : item),
                scope: t,
                beforeSend: function() {
                    var extra = (sequential) ?
                        ("for {0} of {1} record(s)").format(sequence, total) : "";
                    (callbacks.preBeforeSend || function() {}).call(this);
                    t.showProcessingWindow(
                        (callbacks.message || "Saving changes {0}...").format(extra)
                    );
                    (callbacks.postBeforeSend || function() {}).call(this);
                },
                done: function(data) {
                    if (data.error) {
                        var formatter = (typeof B.EnhancedSearch != "undefined") ?
                            B.EnhancedSearch.formatValidationMessages :
                            t.searchCls.formatValidationMessages;
                        (callbacks.preFail || function() {}).call(this);
                        if (data.level == "InvalidParameterError") {
                            N.Util.Feedback.warn(formatter(data.extra)).fadeOut(15000);
                        // } else if (N.Global.environment != "development") {
                        //     N.Util.Feedback.warn("An error occurred while saving the changes.");
                        } else {
                            N.Util.Feedback.warn(data.message).fadeOut(15000);
                        }
                        (callbacks.postFail || function() {}).call(this);
                    } else {
                        if (!sequential || sequence == total) {
                            (callbacks.preDone || function() {}).call(this);
                            N.Util.Feedback
                                .success("Successfully saved and submitted the changes.");
                            t.emptyChangedRows();
                            (callbacks.postDone || function() {}).call(this);
                        } else {
                            t.postSaveGridChange(item, (sequence + 1), total, callbacks);
                        }
                    }
                },
                fail: function() {
                    (callbacks.preFail || function() {}).call(this);
                    N.Util.Feedback.error("An error occurred while saving the changes.");
                    (callbacks.postFail || function() {}).call(this);
                },
                always: function() {
                    if (!sequential || sequence == total) {
                        (callbacks.preAlways || function() {}).call(this);
                        if (typeof callbacks.autoHideProgressBar == "undefined" ||
                            callbacks.autoHideProgressBar === true
                        ) {
                            this.hideProcessingWindow();
                        }
                        (callbacks.postAlways || function() {}).call(this);
                    }
                }
            });
        },

        exchangeItemKeys: function(item) {
            var i, j, key, subkey, field, data = [], mapper = this.getMapper();
            for (key in item) {
                field = (key in mapper) ? mapper[key] : key;
                if ($.isArray(item[key]) && typeof field == "object") {
                    for (i = 0, j = item[key].length; i < j; i++) {
                        for (subkey in item[key][i]) {
                            if (subkey in field) {
                                data.push({
                                    name: field[subkey],
                                    value: item[key][i][subkey]
                                });
                            }
                        }
                    }
                } else {
                    data.push({name: field, value: item[key]});
                }
            }
            return data;
        },

        ensureGridData: function(from, to, initial) {
            var t  = this,
                grid = W.Factory.grid(t.grid),
                data = grid.getData(),
                bottom = (data[0] && data[0].xt) ? parseInt(data[0].xt, 10) : null,
                i, j, size;

            initial = initial || false;

            if (grid.xhreq !== null) {
                grid.xhreq.abort();
                for (i = grid.xhreq.from; i <= grid.xhreq.to; i++) {
                    data[i] = undefined;
                }
            }

            from = (from < 0) ? 0 : from;

            // Reduce range to only unloaded data by eliminating already loaded data at the extremes
            // or data which is already being loaded by a pending request
            if (from < 0)                                 { from = 0; }
            while (data[from] !== undefined && from < to) { from++;   }
            while (data[to] !== undefined && from < to)   { to--;     }

            // if the first item in the batch (data[from]) is loaded,
            // or if the first item number [from] is same as the bottom record number,
            // then there is no need to load anything
            if (data[from] !== undefined || from === bottom) {
                grid.hideLoader();
                return;
            }

            // A request for data must be made: increase range if below optimal request size
            // to decrease number of requests to the database
            size = to - from + 1;
            if (size < t.optimalRange) {
                // expand range in both directions to make it equal to the optimal size
                var expansion = Math.round((t.optimalRange - size) / 2);
                from -= expansion;
                to += expansion;

                // if range expansion results in 'from' being less than 0,
                // make it to 0 and transfer its value to 'to' to keep the range size
                if (from < 0) {
                    to -= from;
                    from = 0;
                }

                // Slide range up or down if data is already loaded or being loaded at the top or bottom...
                if (data[from] !== undefined) {
                    while (data[from] !== undefined) {
                        from++;
                        to++;
                    }
                }
                else if (data[to] !== undefined) {
                    while (data[to] !== undefined && from > 0) {
                        from--;
                        to--;
                    }
                }
            }

            // After adding look-ahead and look-behind, reduce range again to only unloaded
            // data by eliminating already loaded data at the extremes
            while (data[from] !== undefined && from < to) { from++;      }
            while (data[to] !== undefined && from < to)   { to--;        }
            // [to] should be always smaller than the [bottom] number of the record (data[0].xt)
            if (bottom !== null && to > bottom)           { to = bottom; }

            return t.requestRemoteData(from, to, false, initial);
        },

        mergeSearchQuery: function(change) {
            var query = [];

            if (this.query === null) {
                this.searchCls = this.searchCls || {};
                this.searchQuery = this.searchCls.searchQuery || {};
                this.query = {};

                query = this.searchQuery;
                for (var i = 0, j = query.length; i < j; i++) {
                    this.query[query[i].name] = query[i].value;
                }
                query = [];
            }
            $.extend(this.query, change);
        },

        requestRemoteData: function(from, to, reload, initial) {
            var t  = this,
                gd = W.Factory.grid(t.grid),
                dt = gd.getData(),
                df = Q.defer();

            from = (typeof from != "undefined") ? from : 0;
            to = (typeof to != "undefined") ? to : 100;

            t.mergeSearchQuery({
                StartRecordIndex: (from + 1),
                PageSize: (to - from),
                SortColumn: t.sortColumn,
                SortDirection: t.sortDirection
            });

            if (t.timeoutId !== null) {
                clearTimeout(t.timeoutId);
            }

            t.timeoutId = setTimeout(function() {
                for (var i = from; i <= to; i++) {
                    if (!dt[i]) {
                        dt[i] = null;
                    }
                }
                gd.requestRemoteData(t.searchUrl, t.query, t, df);
                try {
                    gd.xhreq.from = from;
                    gd.xhreq.to = to;
                    gd.xhreq.reload = reload || false;
                    gd.xhreq.initial = initial || false;
                } catch (err) {}
            }, 100);

            return df.promise;
        },

        refreshEntireGrid: function() {
            var t = this,
                gd = W.Factory.grid(t.grid);

            if (t.timeoutId !== null) {
                clearTimeout(t.timeoutId);
            }

            t.timeoutId = setTimeout(function () {
                gd.requestRemoteData(t.searchUrl, t.query, t);
            }, 100);
        },

        refreshGridViewport: function() {
            var t = this,
                gd = W.Factory.grid(this.grid),
                vp = gd.getGrid().getViewport();

            if (t.timeoutId !== null) {
                clearTimeout(t.timeoutId);
            }

            t.timeoutId = setTimeout(function () {
                if (gd.xhreq === null) {
                    t.requestRemoteData(vp.top, vp.bottom);
                }
            }, 100);
        },

        getAllAvailableColumns: function() {
            if (this.allAvailableColumns === null) {
                this.allAvailableColumns = $.extend(true, {}, this.getCurrentColumns());
            }
            return this.allAvailableColumns;
        },

        getCurrentColumns: function() {
            var i, j, cols = W.Factory.grid(this.grid).getGrid().getColumns();
            this.currentColumns = {};
            for (i = 0, j = cols.length; i < j; i++) {
                this.currentColumns[cols[i].id] = cols[i];
            }
            return this.currentColumns;
        },

        isGridScrollLoadEnabled: function() {
            if (this.isScrollLoadGrid === null) {
                // disable scroll load feature if the grid has group by feature enabled
                if (!this.isGroupByGrid && this.boolval(this.grid.data("scrollLoad"))) {
                    this.isScrollLoadGrid = (!isNaN(this.grid.data("viewportRows")) &&
                        parseFloat(this.grid.data("viewportRows")) > 0);
                } else
                    this.isScrollLoadGrid = false;
            }
            return this.isScrollLoadGrid;
        },

        showPreviewLoader: function() {
            this.previewLoader.show();
            W.Factory.spinner(this.previewLoader.find("div.spinner")).play();
        },

        hidePreviewLoader: function() {
            W.Factory.spinner(this.previewLoader.find("div.spinner")).stop();
            this.previewLoader.hide();
        },

        showPreviewToolbarButton: function(target, data) {
            this.previewToolbar.children(target).data(data || {}).show();
        },

        hidePreviewToolbarButton: function(target) {
            this.previewToolbar.children(target).hide();
        },

        addChangedRow: function(row, item) {
            this.changedRows[row] = item;
            W.Factory.toolbar(this.toolbar).enableOne("save");
        },

        removeChangedRow: function(row) {
            delete this.changedRows[row];
            if ($.isEmptyObject(this.changedRows)) {
                W.Factory.toolbar(this.toolbar).disableOne("save");
            }
        },

        emptyChangedRows: function() {
            this.changedRows = {};
            W.Factory.toolbar(this.toolbar).disableOne("save");
        },

        getSelectedFilters: function() {
            return this.filter
                .find("[name='filters[]']:not([disabled])")
                // .filter("input:checked, select")
                .filter("input:checked")
                .map(function() { return this.value; })
                .get();
        },

        getSelectedFiltersColumns: function(filters) {
            var t = this, tmp = {}, col = [];
            $.each(filters || [], function(i, f) {
                tmp = $.extend(true, {}, tmp, t.getFilterColumnsDef(f));
            });
            $.each(tmp, function(k, c) {
                col.push(c);
            });
            return col.slice(0);
        },

        getFilterColumnsDef: function(filter) {
            var t = this;
            if (!(filter in t.filterColumns)) {
                t.filterColumns[filter] = {};
                $.each(t.getDef().filter[filter] || [], function(i, col) {
                    t.filterColumns[filter][col] = t.columnsWithKeys[col];
                });
            }
            return t.filterColumns[filter];
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Build, Nebula.Widget));
