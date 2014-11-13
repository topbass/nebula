/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Grid = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function self(target, configs, data) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            columns: [],
            options: {
                editable: true,
                enableAddRow: false,
                autoEdit: false,
                rowHeight: 30,
                multiColumnSort: false,
                // selection model
                // - cell: new Slick.CellSelectionModel()
                // - row: new Slick.RowSelectionModel()
                selectionModel: new Slick.RowSelectionModel()
            },
            events: {
                onBeforeDataLoad: this.handleOnBeforeDataLoad,
                onDataLoaded: this.handleOnDataLoaded
            },
            subscribers: {
                onSort: $.proxy(this.handleOnSort, this),
                onAddNewRow: $.proxy(this.handleOnAddNewRow, this),
                onActiveCellChanged: $.proxy(this.handleOnActiveCellChanged, this),
                onBeforeCellEditorDestroy: $.proxy(this.handleOnBeforeCellEditorDestroy, this),
            },
            scope: this
        };
        this.target       = $(target);
        this.configs      = $.extend(true, {}, this.defaults, configs || {});
        this.data         = [];
        this.source       = "";
        this.grid         = null;
        this.loader       = null;
        this.loaderShown  = false;
        this.cover        = null;
        this.backdrop     = true;
        this.enableAddRow = this.defaults.options.enableAddRow;
        this.viewportRows = 0;
        this.canvasHeight = 0;
        this.canvasWidth  = 0;
        this.headerHeight = 0;
        this.keypressEdit = false;
        this.autoCommit   = false;
        this.startTime    = 0;
        this.ignoredElem  = [
            ".sg-longtext-overlay",
            ".sg-longtext-overlay *",
            ".ui-autocomplete",
            ".ui-autocomplete *",
            ".ui-datepicker",
            ".ui-datepicker *"
        ];
        this.xhreq        = null;
        this.widget       = null;

        // ***** CALL ***** parent constructor
        parent.call(this, this.target, this.widget, this.configs);

        // ***** CALL ***** local constructor
        this.initialize(data);
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ PROPERTIES *****
    self.validators = {
        required: function(value) {
            return (value === null || value === undefined || !value.length) ?
                {valid: false, msg: "This is a required field"} :
                {valid: true, msg: null};
        }
    };

    self.formatters = {
        autocomplete: function(row, cell, value, column, data) {
            return (typeof value != "undefined" && value.displayName) ?
                value.displayName : "";
        },

        floating: function(row, cell, value, column, data) {
            return ((isNaN(value) || !value) ? 0.0 : parseFloat(value)).toFixed(2);
        },

        toInteger: function(row, cell, value, column, data) {
            return (!value) ? "" : +value;
        },

        toFloat: function(row, cell, value, column, data) {
            return (isNaN(value) || !value) ? 0.0 : parseFloat(value);
        },

        toFloat2: function(row, cell, value, column, data) {
            return (isNaN(value) || !value) ? "" : parseFloat(value);
        },

        toPercentage: function(row, cell, value, column, data) {
            return self.formatters.toFloat(row, cell, value, column, data) + "%";
        },

        toPercentage2: function(row, cell, value, column, data) {
            return self.formatters.toFloat(
                row, cell, value, column, data).toFixed(2) + "%";
        },

        toSmartPercentage: function(row, cell, value, column, data) {
            value = self.formatters.toFloat(row, cell, value, column, data);
            if (value >= 0 && value <= 1) {
                return (value * 100).toFixed(2) + "%";
            }
            if (value > 1 && value <= 100) {
                return value.toFixed(2) + "%";
            }
            return "";
        },

        toCurrency: function(row, cell, value, column, data) {
            return self.formatters.toFloat(row, cell, value, column, data).toFixed(2);
        },

        toCurrency2: function(row, cell, value, column, data) {
            value = self.formatters.toFloat2(row, cell, value, column, data);
            return (value === "") ? "" : value.toFixed(2);
        },

        isChecked: function(row, cell, value, column, data) {
            return (value == "checked" || value == "1") ?
                "<i class=\"icon-16 checkbox-icon-16\"></i>" :
                "<i class=\"icon-16 checkbox-empty-icon-16\"></i>";
        },

        dateFormat: function(row, cell, value, column, data) {
            return value && $.datepicker.formatDate(
                "d-M-yy", $.datepicker.parseDate("yy-mm-dd", value)
            );
        },

        dropdownNameStatic: function(row, cell, value, column, data) {
            if (!value) {
                return "";
            }
            return (
                column.editorOptions.options &&
                column.editorOptions.options[value]
            ) ? column.editorOptions.options[value] : value;
        },

        dropdownNameDynamic: function(row, cell, value, column, data) {
            if (!value) {
                return "";
            }
            return (
                column.editorOptions.fields.name &&
                data[column.editorOptions.fields.name]
            ) ? data[column.editorOptions.fields.name] : value;
        }
    };

    self.events = {
        beforeEditCell: function(e, args) {
            var col = args.column;

            if (col.editor === Slick.Editors.Checkbox) {
                args.item[col.field] = (args.item[col.field] == "1") ? "checked" : undefined;
            }
        },

        beforeCellEditorDestroy: function(e, args) {
            var pos, col, dat;

            if (args.editor instanceof Slick.Editors.Checkbox) {
                pos = args.grid.getActiveCell();
                col = args.grid.getColumns()[pos.cell];
                dat = args.grid.getData()[pos.row];

                dat[col.field] = (dat[col.field] == "checked") ? "1" : "0";
            }
        }
    };

    // ***** PUBLIC _STATIC_ METHODS *****
    self.handleOnAddNewRow =
    function handleOnAddNewRow(e, args) {
        var grid = args.grid,
            item = args.item;
        grid.invalidateRow(grid.getData().length);
        grid.getData().push(item);
        grid.updateRowCount();
        grid.render();
    };

    self.handleOnSort =
    function handleOnSort(e, args) {
        var grid = args.grid,
            cols = args.sortCols;
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

    self.handleOnBeforeCellEditorDestroy =
    function handleOnBeforeCellEditorDestroy(e, args) {
        // [grid.event.notify] Nebula::Widget::Grid::OnBeforeCellEditorDestroy
        $(this.target || e.target).triggerHandler(
            "Nebula::Widget::Grid::OnBeforeCellEditorDestroy", arguments);
        // [grid.pubsub.publish] Nebula::Widget::Grid::OnBeforeCellEditorDestroy
        // $.publish(
        //     "Nebula::Widget::Grid::OnBeforeCellEditorDestroy", arguments);
    };

    self.handleOnActiveCellChanged =
    function handleOnActiveCellChanged(e, args) {
        var col;

        if (typeof args.cell == "undefined") {
            return;
        }

        if (args.grid.getOptions().autoEdit) {
            return;
        }
        if (args.grid.getEditorLock().isActive()) {
            return;
        }

        col = args.grid.getColumns()[args.cell];
        if (!col.editable) {
            return;
        }
        if (col.editor !== Slick.Editors.Checkbox) {
            return;
        }

        args.grid.editActiveCell();
        setTimeout(function() {
            args.grid.getCellEditor().focus();
        }, 0);
    };

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Widget.Grid or its child
    // classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        //
        // local constructor
        //
        // @param array|string [data]
        // @return object
        //
        initialize: function(data) {
            this.readInlineConfigs();
            this.constructGrid();

            // Ajax load from remote data source
            if (typeof data == "string") {
                this.source = data;
                this.requestRemoteData();
            }
            // Otherwise just extend local data
            else {
                this.source = "";
                this.data = data || [];
                this.loadAndRenderData();
            }

            this.target
                .on("Nebula::Widget::Grid::CommitCurrentEdit", $.proxy(this.handleEventCommitCurrentEdit, this))
                ;

            return this;
        },

        // ***** DESTRUCTOR *****
        //
        // local destructor
        //
        // @return void
        //
        destruct: function() {
            this.grid.destroy();

            if (this.keypressEdit) {
                this.target.off("keypress.nebula.keypressedit, keyup.nebula.keypressedit");
            }
            $("body").off("click.nebula.autocommit", ":not(" + this.ignoredElem.join(",") + ")");
            this.target.off("click.nebula.autocommit");

            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.data = null;
            this.source = null;
            this.grid = null;
            this.loader = null;
            this.loaderShown = null;
            this.cover = null;
            this.backdrop = null;
            this.enableAddRow = null;
            this.viewportRows = null;
            this.canvasHeight = null;
            this.canvasWidth = null;
            this.headerHeight = null;
            this.keypressEdit = null;
            this.autoCommit = null;
            this.startTime = null;
            this.ignoredElem = null;
            this.xhreq = null;
            this.widget = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.data;
            delete this.source;
            delete this.grid;
            delete this.loader;
            delete this.loaderShown;
            delete this.cover;
            delete this.backdrop;
            delete this.enableAddRow;
            delete this.viewportRows;
            delete this.canvasHeight;
            delete this.canvasWidth;
            delete this.headerHeight;
            delete this.keypressEdit;
            delete this.autoCommit;
            delete this.startTime;
            delete this.ignoredElem;
            delete this.xhreq;
            delete this.widget;
        },

        // ***** PUBLIC METHODS *****
        //
        // read config data (data-* attributes) from targetting dom object
        //
        // @return object
        //
        readInlineConfigs: function() {
            this.viewportRows = !isNaN(this.target.data("viewportRows")) ?
                parseFloat(this.target.data("viewportRows")) : 0;
            if (!this.boolval(this.target.data("scrollLoad"))) {
                this.viewportRows = 0;
            }
            this.keypressEdit = this.boolval(this.target.data("keypressEdit"));
            this.autoCommit = this.boolval(this.target.data("autoCommit"));
            this.canvasHeight = (typeof this.configs.options.rowHeight != "undefined") ?
                (this.viewportRows * this.configs.options.rowHeight) : 0;
            this.configs = $.extend(true, {}, this.configs,
                W.Factory.readData(this.target, "config"));
            this.configs.options = $.extend(true, {}, this.configs.options,
                W.Factory.readData(this.target, "option"));
            if (typeof this.configs.options.autoHeight != "undefined" &&
                this.canvasHeight !== 0
            ) {
                this.configs.options.autoHeight = false;
            }
            return this;
        },

        //
        // reload grid data from remote data source
        //
        // @param string [url]
        // @param object [query]
        // @return object
        //
        reload: function(url, query) {
            this.requestRemoteData(url, query, this);
            return this;
        },

        //
        // build grid with Slick.Grid and load all the configs
        //
        // @return object
        //
        constructGrid: function() {
            var t = this;
            t.grid = new Slick.Grid(t.target, t.data, t.configs.columns, t.configs.options);
            // new Slick.CellSelectionModel()
            // new Slick.RowSelectionModel()
            t.grid.setSelectionModel(t.configs.options.selectionModel);
            t.grid.registerPlugin(new Slick.AutoTooltips({enableForHeaderCells: true}));
            // Subscribers
            $.each(t.configs.subscribers, function(subscriber, method) {
                if (!(subscriber in t.grid)) {
                    return;
                }
                t.grid[subscriber].subscribe(method);
            });
            if (t.canvasHeight !== 0) {
                t.target.height(t.canvasHeight);
            }
            return this;
        },

        //
        // load remote/local data into grid and render all the rows
        //
        // @param object [data]
        // @return object
        //
        loadAndRenderData: function(data) {
            if (typeof data != "undefined" && $.isArray(data)) {
                this.setData(data);
            }
            this.grid.updateRowCount();
            this.grid.render();
            // Some after rendering operations
            if (this.viewportRows !== 0) {
                this.grid.resizeCanvas();
                this.grid.autosizeColumns();
            }
            this.headerHeight = this.target.find(".slick-header").height();
            this.canvasWidth = $(this.grid.getCanvasNode()).width();
            if (this.canvasHeight !== 0) {
                this.target.height(this.canvasHeight + this.headerHeight);
            }
            this.grid.resizeCanvas();

            // editor auto-activate by keypress/keyup
            if (this.keypressEdit) {
                this.target
                    .off("keypress.nebula.keypressedit keyup.nebula.keypressedit")
                    .on("keypress.nebula.keypressedit", $.proxy(this.handleOnKeypress, this))
                    .on("keyup.nebula.keypressedit", $.proxy(this.handleOnKeyup, this));
            }

            // editor auto-commit by click
            if (this.autoCommit) {
                $("body")
                    .off("click.nebula.autocommit", ":not(" + this.ignoredElem.join(",") + ")")
                    .on("click.nebula.autocommit", ":not(" + this.ignoredElem.join(",") + ")", $.proxy(this.handleFocusLost, this));
                this.target
                    .off("click.nebula.autocommit")
                    .on("click.nebula.autocommit", $.proxy(this.handleFocusGained, this));
            }

            return this;
        },

        //
        // set how many rows to display in grid viewport area
        //
        // @param integer [rows]
        // @return object
        //
        setViewportRows: function(rows) {
            if (!this.boolval(this.target.data("scrollLoad"))) {
                this.viewportRows = 0;
                return this;
            }
            rows = !isNaN(rows) ? parseFloat(rows) : 0;
            if (this.viewportRows == rows) {
                return this;
            }
            this.viewportRows = rows;
            this.canvasHeight = (typeof this.configs.options.rowHeight != "undefined") ?
                (this.viewportRows * this.configs.options.rowHeight) : 0;
            if (this.canvasHeight !== 0) {
                this.target.height(this.canvasHeight + this.headerHeight);
            }
            this.grid.resizeCanvas();
            return this;
        },

        //
        // request grid data from a remote data source
        //
        // @param string [url] the URL of the remote data source
        // @param object [query] querying or posting data to the remote data source
        // @param object [scope] the scoping context the beforeLoad and loaded event
        //                       handlers will use within the handling function scope
        // @return object jQuery's XHR object
        //
        requestRemoteData: function(url, query, scope, defer) {
            var t = this, args;
            // arguments = [url, query, scope]
            scope = scope || t.configs.scope;
            args = (arguments.length) ? arguments : [null, null, scope];
            // send xhr request
            t.xhreq = t.xhr({
                method: "POST",
                url: url || t.source,
                data: query || {},
                scope: scope,
                beforeSend: function() {
                    t.configs.events.onBeforeDataLoad.apply(t, args);
                },
                done: function() {
                    // arguments = [data, status, xhr]
                    var a = Array.prototype.slice.call(arguments);
                    a.push(scope);
                    t.configs.events.onDataLoaded.apply(t, a);
                    if (defer && defer.resolve) {
                        defer.resolve(a[0]);
                    }
                },
                fail: function() {},
                always: function() {}
            });
            t.xhreq.from = 0;
            t.xhreq.initial = true;
            return t.xhreq;
        },

        //
        // show grid data loading indicator
        //
        // @param boolean [backdrop]
        // @return object
        //
        showLoader: function(backdrop) {
            this.loaderShown = true;
            this.backdrop = (typeof backdrop != "undefined") ? backdrop : this.backdrop;
            // only set the container height to 80px when there is no height or
            // number-of-row specified, so we give a height of 80px to the container
            // in order to display the loading indicator properly
            if (this.canvasHeight === 0 && $(this.grid.getCanvasNode()).height() < 120) {
                this.target.css("height", "120px");
            }
            if (this.loader === null) {
                this.loader = $(document.createElement("div"))
                    .addClass("loading-indicator")
                    .append($(document.createElement("div")).addClass("spinner spinner-64"))
                    .appendTo(this.target);
                W.Factory.spinner(this.loader.find("div.spinner"), {type: "large", driver: "js"});
            }
            if (this.backdrop) {
                if (this.cover === null) {
                    this.cover = $("<div/>")
                        .addClass("loading-backdrop")
                        .appendTo(this.target);
                }
                this.cover.show();
            }
            this.relocateLoaderAndPlaySpinner();
            return this;
        },

        //
        // hide grid data loading indicator
        //
        // @return object
        //
        hideLoader: function() {
            if (this.loader === null) {
                return this;
            }
            W.Factory.spinner(this.loader.find("div.spinner")).stop();
            this.loader.hide();
            if (this.backdrop) {
                this.cover.hide();
            }
            // only set the container height back to auto when there is no height
            // or number-of-row specified, because we previously set the height
            // to 80px in order to display loading indicator properly
            if (this.canvasHeight === 0) {
                this.target.css("height", "auto");
            }
            this.loaderShown = false;
            return this;
        },

        //
        // centre the grid data loading indicator and play the spinner animation
        //
        // @return object
        //
        relocateLoaderAndPlaySpinner: function() {
            if (this.loader === null || this.loaderShown === false) {
                return this;
            }
            this.loader
                .css("top", this.target.height() / 2 - this.loader.height() / 2)
                .css("left", this.target.width() / 2 - this.loader.width() / 2 - 20)
                .show();
            W.Factory.spinner(this.loader.find("div.spinner")).play();
            return this;
        },

        //
        // get grid data
        //
        // @return object
        //
        getData: function() {
            return this.data;
        },

        //
        // set grid data
        //
        // @param object [data]
        // @return void
        //
        setData: function(data) {
            // this.data = data.slice(0);
            this.data = data;
            this.grid.setData(this.data);
        },

        //
        // get a copy of Slick.Grid instance
        //
        // @return object
        //
        getGrid: function() {
            return this.grid;
        },

        //
        // highlight cells with Slick.Grid buildin method
        //
        // object highlight ( object specs )
        // object highlight ( array location, string color )
        //
        highlight: function() {
            switch (arguments.length) {
                case 0: break;
                // 1. function _highlight ( object specs )
                case 1:
                    var specs = arguments[0];
                    this.grid.setCellCssStyles("highlight", specs);
                    break;
                // 2. function _highlight ( object[array] location, string color )
                case 2:
                    var location = arguments[0],
                        color = arguments[1];
                    this.grid.setCellCssStyles("highlight", $.extend(
                        true,
                        {},
                        this.grid.getCellCssStyles("highlight"),
                        this.buildHighlightingSpecs(location, color)
                    ));
                    break;
                // 3. invalid function call, must specify at least one argument
                default: break;
            }
            return this;
        },

        //
        // create referencing json object for highlight cells with Slick.Grid
        //
        // @param array [location]
        // @param string [color]
        // @return object
        //
        buildHighlightingSpecs: function(location, color) {
            var i, j, columnId,
                row = location[0],
                column = location[1],
                specs = {},
                cssClass = "highlight-" + color;
            // Specs for highlighting an entire column
            if (row === null) {
                for (i = 0, j = this.grid.getDataLength(); i < j; i++) {
                    specs[i] = {};
                    specs[i][column] = cssClass;
                }
            }
            // Specs for highlighting an entire row
            else if (column === null) {
                specs[row] = {};
                for (i = this.grid.getColumns().length; i--; ) {
                    columnId = this.grid.getColumns()[i].id;
                    specs[row][columnId] = cssClass;
                }
            }
            // Specs for highlighting one cell only
            else {
                specs[row] = {};
                specs[row][column] = cssClass;
            }
            return specs;
        },

        //
        // extract html (outerHTML) from a jQuery object
        //
        // @param object [object]
        // @return string
        //
        objectToHtml: function(object) {
            return $(document.createElement("div"))
                .append(object.clone())
                .remove()
                .html();
        },

        // ==================== event handlers ====================

        // data loading events

        //
        // event handler triggered before data loading request is sent
        //
        // @param string [url]
        // @param object [query]
        // @param object [scope]
        // @return void
        //
        handleOnBeforeDataLoad: function(url, query, scope) {
            var t = this;

            setTimeout(function() {
                t.showLoader();
            }, 0);

            // Nebula::EnhancedGrid::Grid::BeforeDataLoad
            // => pubsub
            $.publish(
                "Nebula::EnhancedGrid::Grid::BeforeDataLoad", [scope, url, query]);
            // => event
            (scope || t).target.triggerHandler(
                "Nebula::EnhancedGrid::Grid::BeforeDataLoad", [scope, url, query]);
        },

        //
        // event handler triggered after remote data is loaded
        //
        // @param object [data]
        // @param string [status]
        // @param object [xhr]
        // @param object [scope]
        // @return void
        //
        handleOnDataLoaded: function(data, status, xhr, scope) {
            var t = this;

            if (data) {
                if ($.isArray(data)) {
                    t.setData(data);
                } else if (data.data && $.isArray(data.data)) {
                    // set dynamic columns
                    if (data.columns) {
                        try {
                            data.columns = eval(
                                JSON.stringify(data.columns)
                                    .replace(/"<!\[FUNC\[([^\]]*)\]\]>"/g, '$1')
                            );
                            t.grid.setColumns(data.columns);
                        } catch (err) {}
                    }
                    // set data
                    t.setData(data.data);
                }
            }

            t.loadAndRenderData();

            setTimeout(function() {
                t.hideLoader();
            }, 10);

            // Nebula::EnhancedGrid::Grid::DataLoaded
            // => pubsub
            $.publish(
                "Nebula::EnhancedGrid::Grid::DataLoaded", [scope, data, status, xhr]);
            // => event
            (scope || t).target.triggerHandler(
                "Nebula::EnhancedGrid::Grid::DataLoaded", [scope, data, status, xhr]);
        },

        handleOnKeypress: function(evt) {
            var act, col, dat, chr;

            if (this.grid.getEditorLock().isActive()) {
                return;
            }

            chr = (typeof evt.which == "number") ? evt.which : evt.keyCode;
            // 48-57: 0-9
            // 65-90: A-Z
            // 97-122: a-z
            if (chr < 48 || (chr > 57 && chr < 65) || (chr > 90 && chr < 97) || chr > 122) {
                return;
            }

            act = this.grid.getActiveCell();
            if (act === null) {
                return;
            }

            col = this.grid.getColumns();
            if (!col[act.cell].editable) {
                return;
            }

            this.grid.editActiveCell();
        },

        handleOnKeyup: function(evt) {
            var sel, col, dat, chr, i, j, x, y;

            if (this.grid.getEditorLock().isActive()) {
                return;
            }

            chr = (typeof evt.which == "number") ? evt.which : evt.keyCode;
            if (chr !== 46) {
                return;
            }

            sel = this.grid.getSelectionModel().getSelectedRanges();
            if (!sel.length) {
                return;
            }

            dat = this.grid.getData();
            col = this.grid.getColumns();
            for (i = sel[0].fromCell, j = sel[0].toCell; i <= j; i++) {
                if (!col[i].editable) {
                    continue;
                }
                for (x = sel[0].fromRow, y = sel[0].toRow; x <= y; x++) {
                    switch (col[i].editor) {
                        case Slick.Editors.Combo:
                            dat[x][col[i].editorOptions.fields.hidden] = "";
                            dat[x][col[i].editorOptions.fields.display] = "";
                            break;
                        case Slick.Editors.Checkbox:
                            dat[x][col[i].field] = "0";
                            break;
                        case Slick.Editors.Dropdown:
                            dat[x][col[i].editorOptions.fields.id] = "";
                            dat[x][col[i].editorOptions.fields.name] = "";
                            break;
                        default:
                            dat[x][col[i].field] = "";
                            break;
                    }
                    this.grid.updateCell(x, i);
                    this.grid.onCellChange.notify({
                        row: x,
                        cell: i,
                        item: dat[x],
                        grid: this.grid
                    }, undefined, this.grid);
                }
            }
        },

        handleFocusLost: function(evt) {
            if (!$(evt.target).closest(".grid").length) {
                this.handleEventCommitCurrentEdit();
            }
        },

        handleFocusGained: function(evt) {
            if ($(evt.target).is(":checkbox, :radio")) {
                if (this.grid) {
                    this.grid.focus();
                }
            } else {
                evt.stopPropagation();
                return false;
            }
        },

        // grid events

        //
        // event handler triggered when a new grid is added
        //
        // @param object [e]
        // @param object [args]
        // @return void
        //
        handleOnAddNewRow: self.handleOnAddNewRow,

        //
        // event handler triggered when the grid rows are sorted
        //
        // @param object [e]
        // @param object [args]
        // @return void
        //
        handleOnSort: self.handleOnSort,

        //
        // event handler triggered before cell editor is destroyed
        //
        // @param object [e]
        // @param object [args]
        // @return void
        //
        handleOnBeforeCellEditorDestroy: self.handleOnBeforeCellEditorDestroy,

        handleOnActiveCellChanged: self.handleOnActiveCellChanged,

        // [grid.event.listen] Nebula::Widget::Grid::CommitCurrentEdit
        handleEventCommitCurrentEdit: function() {
            if (!this.grid || !this.grid.getEditorLock().isActive()) {
                return;
            }
            this.grid.getEditorLock().commitCurrentEdit();
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
