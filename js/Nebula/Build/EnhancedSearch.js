/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");

Nebula.Build.EnhancedSearch = (function($, N, B, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function self(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults           = {};
        this.target             = $(target);
        this.configs            = {};
        this.isTabbed           = false;
        this.searchPane         = null;
        this.activeTab          = null;
        this.activeTabPane      = null;
        this.inactiveTab        = null;
        this.inactiveTabPane    = null;
        this.activeTabId        = null;
        this.activeForm         = null;
        this.searchBtn          = null;
        this.saveBtn            = null;
        this.criteriaBox        = null;
        this.criteriaCustomText = null;
        this.mapper             = null;
        this.pageSize           = 0;
        this.searchUrl          = null;
        this.searchQuery        = null;
        this.timeoutId          = {};
        this.totalReq           = 1;
        this.finishedReq        = 0;
        this.autoSearch         = false;
        this.alwaysShowCriteria = false;
        this.resultCount        = 0;
        this.initialSearch      = true;
        this.hasRouteParams     = false;
        this.setRouteTimer      = null;
        this.routeBeforeSubmit  = null;
        this.startTime          = 0;

        // ***** CALL ***** parent constructor
        parent.call(this, this.target);

        // ***** CALL ***** local constructor
        this.initialize();
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ METHODS *****
    self.formatValidationMessages = function formatValidationMessages(json) {
        var messages = [], message = "";
        if (typeof json == "string") {
            json = $.parseJSON(json).extra;
        }
        for (var f in json) {
            if (json[f].label === null || json[f].label === "") {
                continue;
            }
            message = ("<strong>{0}</strong>:").format(json[f].label);
            for (var e in json[f].messages) {
                message += " " + json[f].messages[e];
            }
            messages.push(message);
        }
        if (!messages.length) {
            messages.push("Unknow error occurred during the submission.");
        }
        return messages.join("<br/>");
    };

    // extract search criteria from search pane and format them into a summary
    // and then display it in section.search-criteria-summary
    self.getSearchCriteriaSummary = function getSearchCriteriaSummary(form, count, custom) {
        var criteria = [];

        $("input[type!=hidden], textarea, select, button", form)
            .add($("input[type=hidden][data-interim-param]", form))
            .add($("input[type=hidden][data-token-search]", form))
            .each(function() {
                var tt    = $(this),
                    label = tt.siblings("label:last").text() ||
                            tt.closest("label + div").prev().text(),
                    value = tt.val(),
                    tmplt = "[{0}]: <strong>{1}</strong>";
                switch (tt.prop("tagName").toLowerCase()) {
                    case "select":
                        value = tt.find("option:selected").text();
                        break;
                    case "input":
                        if (tt.is(":checkbox, :radio")) {
                            if (tt.is(":checked")) {
                                label = tt.parent().text().trim();
                                value = "checked";
                            } else
                                label = value = "";
                        }
                        if (tt.is("[type=hidden][data-interim-param]")) {
                            label = tt.data("hiddenLabel");
                        }
                        if (tt.is("[type=hidden][data-token-search]")) {
                            label = "";
                            value = value.replace(/~/g, ", ");
                            tmplt = "{0}{1}";
                        }
                        break;
                    default:
                        break;
                }
                if (value) {
                    criteria.push(tmplt.format(label, value));
                }
            });

        return "<strong>{0}</strong> {1} for \"{2}\"".format(
            count,
            (count > 1) ? "results" : "result",
            custom || criteria.join("; ") || "<strong>Unspecified Search Criteria</strong>"
        );
    };

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Build.EnhancedSearch or its
    // child classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
            var t = this, p;
            // initialize instance variables
            t.searchPane  = t.target.find(".eS-search-pane");
            if (t.searchPane.find("ul.nav-tabs").length > 0) {
                t.isTabbed        = true;
                t.activeTab       = t.searchPane.find("li.active a[data-toggle=tab]");
                t.activeTabPane   = t.searchPane.find(".tab-pane.active");
                t.inactiveTab     = t.searchPane.find("li:not(.active) a[data-toggle=tab]");
                t.inactiveTabPane = t.searchPane.find(".tab-pane:not(.active)");
                t.activeTabId     = t.activeTabPane.prop("id");
                t.activeForm      = t.activeTabPane.find("form");
            } else
                t.activeForm  = t.searchPane.find("form");
            t.searchBtn   = t.activeForm.find("button:submit");
            t.saveBtn     = t.activeForm.find("button.btn.save-search");
            t.criteriaBox = t.target.find(".eS-search-criteria");
            // data attribute configs
            t.autoSearch         = t.boolval(t.searchPane.data("autoSearch"));
            t.alwaysShowCriteria = t.boolval(t.criteriaBox.data("alwaysShowCriteria"));

            // ** Pub:Sub ** observing subscribers
            $.subscribe("Nebula::EnhancedSearch::Search::Trigger", $.proxy(t.subscribeSearchTrigger, t));
            $.subscribe("Nebula::EnhancedSearch::Search::Serialize", $.proxy(t.subscribeSearchSerialize, t));
            $.subscribe("Nebula::Build::SmallParts::FontSize::ZoomIn", $.proxy(t.subscribeFontSizeZoomInOut, t));
            $.subscribe("Nebula::Build::SmallParts::FontSize::ZoomOut", $.proxy(t.subscribeFontSizeZoomInOut, t));
            $.subscribe("Nebula::Build::Router::StateChange", $.proxy(t.subscribeRouterStateChange , t));

            t.target
                .on("Nebula::EnhancedSearch::Search::Trigger", $.proxy(t.handleEventSearchTrigger, t))
                .on("Nebula::EnhancedSearch::Search::Serialize", $.proxy(t.handleEventSearchSerialize, t))
                ;

            // form and button event listeners
            t.activeForm
                .on("submit", $.proxy(t.handleFormSubmit, t))
                .on("reset", $.proxy(t.handleFormReset, t));
            t.searchBtn
                .on("click", $.proxy(t.handleSearchButtonClick, t));
            t.saveBtn
                .on("click", $.proxy(t.handleSaveButtonClick, t));

            if (t.activeForm.hasClass(".validate")) {
                t.activeForm.validate();
            }

            // enabling form in search pane
            if (t.isTabbed) {
                // attach show and shown event handlers to tabs
                t.searchPane.find("a[data-toggle=tab]").on("show", function(e) {
                    if ($(e.target).parent("li").is(".disabled") ||
                        $(e.relatedTarget).parent("li").is(".disabled")
                    ) {
                        return false;
                    }
                    t.inactiveTab = t.searchPane.find("li a[data-toggle=tab]").not(e.target);
                    t.inactiveTabPane = t.searchPane.find(".tab-pane").not(e.target.hash);
                    t.activeForm.off("submit reset");
                    t.disableForm(t.inactiveTabPane);
                }).on("shown", function (e) {
                    t.activeTab = $(e.target);
                    t.activeTabPane = $(e.target.hash);
                    t.activeTabId = t.activeTabPane.prop("id");
                    t.activeForm = t.activeTabPane.find("form")
                        .off("submit reset")
                        .on("submit", $.proxy(t.handleFormSubmit, t))
                        .on("reset", $.proxy(t.handleFormReset, t));
                    t.enableForm(t.activeTabPane);
                    $().ready(function() {
                        t.activeForm.find(":input:visible:first").focus();
                    });
                });
                // on page load, enable active tab and disable inactive tab
                t.enableForm(t.activeTabPane);
                t.disableForm(t.inactiveTabPane);
                $().ready(function() {
                    t.activeForm.find(":not(.selectize-input) > :input:visible:first").focus();
                });
            } else {
                t.enableForm(t.searchPane);
                $().ready(function() {
                    t.activeForm.find(":input:visible:first").focus();
                });
            }

            t.loadRoutePathParams(
                p = N.Build.Router.getMergedParam(),
                t.boolval(p.autoSearch)
            );
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            if (this.isTabbed) {
                this.searchPane.find("a[data-toggle=tab]").off();   // show shown
            }
            if (this.activeForm && this.activeForm.length)
                this.activeForm.off();   // submit reset
            if (this.searchBtn && this.searchBtn.length)
                this.searchBtn.off();   // click
            if (this.saveBtn && this.saveBtn.length)
                this.saveBtn.off();   // click
            if (this.criteriaBox && this.criteriaBox.length)
                this.criteriaBox.off();   // click

            this.defaults = null;
            this.target = null;
            this.isTabbed = null;
            this.searchPane = null;
            this.activeTab = null;
            this.activeTabPane = null;
            this.inactiveTab = null;
            this.inactiveTabPane = null;
            this.activeTabId = null;
            this.activeForm = null;
            this.searchBtn = null;
            this.saveBtn = null;
            this.criteriaBox = null;
            this.mapper = null;
            this.pageSize = null;
            this.searchUrl = null;
            this.searchQuery = null;
            this.timeoutId = null;
            this.totalReq = null;
            this.finishedReq = null;
            this.autoSearch = null;
            this.alwaysShowCriteria = null;
            this.resultCount = null;
            this.initialSearch = null;
            this.hasRouteParams = null;
            this.setRouteTimer = null;
            this.routeBeforeSubmit = null;
            this.startTime = null;

            delete this.defaults;
            delete this.target;
            delete this.isTabbed;
            delete this.searchPane;
            delete this.activeTab;
            delete this.activeTabPane;
            delete this.inactiveTab;
            delete this.inactiveTabPane;
            delete this.activeTabId;
            delete this.activeForm;
            delete this.searchBtn;
            delete this.saveBtn;
            delete this.criteriaBox;
            delete this.mapper;
            delete this.pageSize;
            delete this.searchUrl;
            delete this.searchQuery;
            delete this.timeoutId;
            delete this.totalReq;
            delete this.finishedReq;
            delete this.autoSearch;
            delete this.alwaysShowCriteria;
            delete this.resultCount;
            delete this.initialSearch;
            delete this.hasRouteParams;
            delete this.setRouteTimer;
            delete this.routeBeforeSubmit;
            delete this.startTime;
        },

        // ***** PUBLIC METHODS *****

        // Nebula::EnhancedSearch::Search::Trigger
        // => pubsub
        //    $.publish("Nebula::EnhancedSearch::Search::Trigger");
        //    $.publish("Nebula::EnhancedSearch::Search::Trigger", [{match: "misc-log-search"}]);
        //    $.publish("Nebula::EnhancedSearch::Search::Trigger", [{except: "misc-log-search"}]);
        subscribeSearchTrigger: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedSearch::Search::Trigger");
            return this;
        },
        // => event
        handleEventSearchTrigger: function(e) {
            // return if autoSearch has already been triggered
            if (this.autoSearch) {
                return;
            }
            this.activeForm.trigger("submit");
            this.initialSearch = false;
        },

        // Nebula::EnhancedSearch::Search::Serialize
        // => pubsub
        subscribeSearchSerialize: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedSearch::Search::Serialize");
            return this;
        },
        // => event
        handleEventSearchSerialize: function(e) {
            this.searchQuery = this.activeForm.serializeArray();
        },

        // ** Pub:Sub ** Nebula::Build::SmallParts::FontSize::ZoomIn
        // ** Pub:Sub ** Nebula::Build::SmallParts::FontSize::ZoomOut
        subscribeFontSizeZoomInOut: function(size) {
            this.target
                .removeClass("xsmall small medium large xlarge")
                .addClass(size);

            return this;
        },

        // ** Pub:Sub ** Nebula::Build::Router::StateChange
        subscribeRouterStateChange: function(router, params, path1, path2) {
            this.loadRoutePathParams(params, this.boolval(params.autoSearch));
            return this;
        },

        handleFormSubmit: function(event) {
            var t = this, tt = null, ref = "", start;

            t.startTime = N.Timing.now();

            // [search.pubsub.publish] Nebula::EnhancedSearch::Search::Submit::Before
            $.publish(
                "Nebula::EnhancedSearch::Search::Submit::Before", Array.prototype.slice.call(arguments).concat(t));
            // [search.event.notify] Nebula::EnhancedSearch::Search::Submit::Before
            t.target.triggerHandler(
                "Nebula::EnhancedSearch::Search::Submit::Before", Array.prototype.slice.call(arguments).concat(t));

            try {
                if (t.activeForm.hasClass("validate") && !t.activeForm.valid()) {
                    return false;
                }

                tt  = $(event.currentTarget);
                ref = (
                    t.searchPane.data("gridReferenceId") || tt.data("gridReferenceId")
                ).split("|");

                t.searchUrl   = tt.prop("action");
                t.searchQuery = tt.serializeArray();
                t.pageSize    = parseInt(tt.find("[name=PageSize]").val(), 10);
                t.totalReq    = ref.length;
                t.finishedReq = 0;
                t.resultCount = 0;

                t.routeBeforeSubmit = t.convertSearchCriteriaToRoutePath();
                // t.searchQuery.push({name: "filter", value: tt.prop("id")});

                $.each(t.searchUrl.split("|"), function(index, action) {
                    // Nebula::EnhancedSearch::Search::BeforeSend
                    // => pubsub
                    $.publish(
                        "Nebula::EnhancedSearch::Search::BeforeSend", [ref[index], t]);
                    // => event
                    t.target.triggerHandler(
                        "Nebula::EnhancedSearch::Search::BeforeSend", [ref[index], t]);
                    // call xhr method to send POST request to RESTful API
                    var xhr = t.xhr({
                        method: "POST",
                        url: action,
                        data: t.searchQuery,
                        scope: t,
                        beforeSend: function() {
                            // ** Pub:Sub **
                            $.publish("Nebula::Util::Feedback::FadeOut", [0]);
                            if (t.isTabbed) {
                                t.inactiveTab.parent("li:not(.disabled)").addClass("disabled");
                            }
                            t.disableForm();
                            t.showLoadingIndicator();
                        },
                        done: t.handleFormSubmitDone,
                        fail: t.handleFormSubmitFail,
                        always: t.handleFormSubmitAlways
                    });
                    xhr.searchUrl = action;
                    xhr.searchQuery = t.searchQuery;
                    xhr.gridReferenceId = ref[index] || index;
                    xhr.totalReqNum = t.totalReq;
                    xhr.currentReqNum = index + 1;
                });
            } catch (e) {
                console.error(e);
                return false;
            }

            // Nebula::EnhancedSearch::Search::Submit::After
            // => pubsub
            $.publish(
                "Nebula::EnhancedSearch::Search::Submit::After", Array.prototype.slice.call(arguments).concat(t));
            // => event
            t.target.triggerHandler(
                "Nebula::EnhancedSearch::Search::Submit::After", Array.prototype.slice.call(arguments).concat(t));

            return false;
        },

        // arguments[0] = event
        handleFormReset: function() {
            // Nebula::EnhancedSearch::Reset
            // [event, this]
            // => pubsub
            $.publish(
                "Nebula::EnhancedSearch::Reset", Array.prototype.slice.call(arguments).concat(this));
            // => event
            this.target.triggerHandler(
                "Nebula::EnhancedSearch::Reset", Array.prototype.slice.call(arguments).concat(this));
        },

        // arguments[0] = event
        handleSearchButtonClick: function() {
            if (this.hasRouteParams && !this.initialSearch) {
                this.activeForm.find("input[type=hidden][data-interim-param]").val("");
                this.initialSearch = false;
            }
            // Nebula::EnhancedSearch::Search::Click
            // => pubsub
            $.publish(
                "Nebula::EnhancedSearch::Search::Click", Array.prototype.slice.call(arguments).concat(this));
            // => event
            this.target.triggerHandler(
                "Nebula::EnhancedSearch::Search::Click", Array.prototype.slice.call(arguments).concat(this));
        },

        // arguments[0] = event
        handleSaveButtonClick: function() {
            // Nebula::EnhancedSearch::Save
            // [event, this]
            // => pubsub
            $.publish(
                "Nebula::EnhancedSearch::Save",
                Array.prototype.slice.call(arguments).concat(this));
            // => event
            this.target.triggerHandler(
                "Nebula::EnhancedSearch::Save",
                Array.prototype.slice.call(arguments).concat(this));
        },

        handleFormSubmitDone: function(data, status, xhr) {
            // has error returned from endpoint (not database)
            if (data.error) {
                this.handleFormSubmitFail(xhr, data.level, new Error(data.message));
                return;
            }
            // has error returned from database
            if (data.data && data.data.length == 1 && data.data[0].computed) {
                N.Util.Feedback.error(data.data[0].computed);
                return;
            }

            var t = this, args = Array.prototype.slice.call(arguments);

            // no error, proceed
            if (data.count > 0) {
                t.resultCount += ($.isArray(data.data) && "xt" in data.data[0]) ?
                    +(data.data[0].xt) : +(data.count);
            } else
                t.resultCount += 0;

            if ((xhr.currentReqNum === xhr.totalReqNum) &&
                (t.resultCount > 0 || t.alwaysShowCriteria)
            ) {
                if (t.timeoutId[xhr.gridReferenceId]) {
                    clearTimeout(t.timeoutId[xhr.gridReferenceId]);
                    t.timeoutId[xhr.gridReferenceId] = null;
                }
                t.timeoutId[xhr.gridReferenceId] = setTimeout(function() {
                    // [search.pubsub.publish] Nebula::EnhancedSearch::Search::Done::Message
                    $.publish(
                        "Nebula::EnhancedSearch::Search::Done::Message", [t.resultCount]);
                    // [search.event.notify] Nebula::EnhancedSearch::Search::Done::Message
                    t.target.triggerHandler(
                        "Nebula::EnhancedSearch::Search::Done::Message", [t.resultCount]);


                    // display search criteria box
                    t.criteriaBox.show().off().on("click", function() {
                        t.criteriaBox.hide();
                        t.searchPane.show();
                        // [search.event.notify] Nebula::EnhancedSearch::Search::Criteria::Hidden
                        t.target.triggerHandler(
                            "Nebula::EnhancedSearch::Search::Criteria::Hidden", [t, t.criteriaBox]);
                    }).find("> div").html(
                        t.getSearchCriteriaSummary(t.resultCount)
                    );

                    // [search.event.notify] Nebula::EnhancedSearch::Search::Criteria::Shown
                    t.target.triggerHandler(
                        "Nebula::EnhancedSearch::Search::Criteria::Shown", [t, t.criteriaBox]);

                    if (!t.boolval(t.searchPane.data("alwaysShowSearchPane"))) {
                        t.searchPane.hide();
                    }
                    if (t.boolval(t.criteriaBox.data("autoFadeoutCriteria"))) {
                        t.criteriaBox.data(
                            "FadeoutTimer",
                            setTimeout(function() {
                                t.criteriaBox.fadeOut();
                            }, t.intval(
                                t.criteriaBox.data("autoFadeoutCriteria")
                            ))
                        );
                    }
                }, 0);
            }

            t.setRouteTimer = setTimeout(function() {
                B.Router.setRoute(t.convertSearchCriteriaToRoutePath());
            }, 600);

            // [search.pubsub.publish] Nebula::EnhancedSearch::Search::Done
            // [data, status, xhr, this]
            $.publish(
                "Nebula::EnhancedSearch::Search::Done", args.concat(t));
            // [search.event.notify] Nebula::EnhancedSearch::Search::Done
            // [data, status, xhr, this]
            t.target.triggerHandler(
                "Nebula::EnhancedSearch::Search::Done", args.concat(t));
        },

        handleFormSubmitFail: function(xhr, status, throwable) {
            this.activeForm.find(":input:visible:first").focus();
            if (status == "InvalidParameterError") {
                N.Util.Feedback.warn(this.formatValidationMessages(xhr.responseText));
            } else {
                N.Util.Feedback.error("An error occurred during the search.");
            }
            // Nebula::EnhancedSearch::Search::Fail
            // [xhr, status, throwable, this]
            // => pubsub
            $.publish(
                "Nebula::EnhancedSearch::Search::Fail", Array.prototype.slice.call(arguments).concat(this));
            // => event
            this.target.triggerHandler(
                "Nebula::EnhancedSearch::Search::Fail", Array.prototype.slice.call(arguments).concat(this));
        },

        // arguments[0]: data|xhr
        // arguments[1]: status
        // arguments[2]: xhr|throwable
        handleFormSubmitAlways: function() {
            this.finishedReq++;
            if (this.finishedReq == this.totalReq) {
                if (this.isTabbed) {
                    this.inactiveTab.parent("li.disabled").removeClass("disabled");
                }
                this.enableForm();
                this.hideLoadingIndicator();
                if (arguments[1] != "success") {
                    this.activeForm.find(":input:visible:first").focus();
                }
            }
            // Nebula::EnhancedSearch::Search::Always
            // [data|xhr, status, xhr|throwable, this]
            // => pubsub
            $.publish(
                "Nebula::EnhancedSearch::Search::Always", Array.prototype.slice.call(arguments).concat(this));
            // => event
            this.target.triggerHandler(
                "Nebula::EnhancedSearch::Search::Always", Array.prototype.slice.call(arguments).concat(this));

            if (typeof ga == "function" && this.startTime) {
                ga("send", {
                    hitType: "timing",
                    timingCategory: "Search Query",
                    timingVar: this.getPackageName() + " EnhancedSearch #" + this.target.prop("id"),
                    timingValue: N.Timing.get(this.startTime, N.Timing.now()),
                    timingLabel: Nebula.Global.username
                });
            }
        },

        formatValidationMessages: function(json) {
            return self.formatValidationMessages(json);
        },

        getMapper: function() {
            if (this.mapper === null) {
                if (!this.activeForm.prop("id")) {
                    throw new Error("Attribute [id] must be set on <form> of [eS-search-pane] in order to map search results.");
                }
                var mapperName = this.activeForm.prop("id")
                    .replace(/\[.*\]$/g, "")
                    .replace(/[-_]/g, " ")
                    .replace(/^([a-z])|\s+([a-z])/g, function ($1) { return $1.toUpperCase(); })
                    .replace(/\s/g, "");
                this.mapper = (mapperName in N.FeudMap) ? N.FeudMap[mapperName] : {};
            }
            return this.mapper;
        },

        // extract search criteria from search pane and format them into a summary
        // and then display it in section.search-criteria-summary
        getSearchCriteriaSummary: function(count) {
            return self.getSearchCriteriaSummary(this.activeForm,
                count, this.criteriaCustomText);
        },

        isModalOpenable: function(isTabRestricted) {
            isTabRestricted = isTabRestricted || false;
            if (this.boolval(this.target.data("modalOpenable"))) {
                if (isTabRestricted) {
                    return (this.activeTabId === null ||
                        this.activeTabId === "tab-basic-search");
                }
                return true;
            }
            return false;
        },

        loadRoutePathParams: function(params, triggerSearch) {
            var t = this;

            if ($.isEmptyObject(params)) {
                return params;
            }

            t.hasRouteParams = true;

            if (params.activeTabId) {
                t.searchPane
                    .find("a[data-toggle=tab][href='#" + params.activeTabId + "']")
                    .tab("show");
            }

            $("input, select, textarea", t.activeForm).each(function(_, elem) {
                var tag = elem.tagName.toLowerCase(),
                    type = elem.type,
                    name = elem.name,
                    value = elem.value;
                if (!params.hasOwnProperty(name)) {
                    if (tag == "input" && type == "hidden") { return; }
                    if (tag == "input" && type == "checkbox") { elem.checked = false; return; }
                    if (tag == "input" && type == "radio") { elem.checked = false; return; }
                    if (tag == "input" && $(elem).is(".combo")) { W.Factory.combo(elem).setHiddenId(""); }
                    elem.value = "";
                } else {
                    value = decodeURIComponent(params[name]);
                    if (tag == "input" && type == "hidden" && elem.disabled) { return; }
                    if (tag == "input" && type == "checkbox") { elem.checked = t.boolval(value); return; }
                    if (tag == "input" && type == "radio") { elem.checked = (elem.value == value); return; }
                    if (tag == "select") { $(elem).data("defaultValue", value); }
                    elem.value = value;
                }
            });

            if (triggerSearch && t.initialSearch) {
                // trigger search automatically
                $().ready(function() {
                    t.activeForm.trigger("submit");
                    t.autoSearch = true;
                    t.initialSearch = false;
                    t.target.triggerHandler(
                        "Nebula::EnhancedSearch::Search::AutoSearch::Triggered", [t, params]);
                });
            }

            t.target.triggerHandler(
                "Nebula::EnhancedSearch::Search::Params::Loaded", [t, params]);

            return params;
        },

        convertSearchCriteriaToRoutePath: function() {
            var terms = [];

            $("input, select, textarea", this.activeForm).each(function(_, elem) {
                var tag = elem.tagName.toLowerCase(),
                    type = elem.type,
                    name = elem.name,
                    value = elem.value;
                if (!name || value === "") { return; }
                if (tag == "input" && type == "hidden" && elem.disabled) { return; }
                if (tag == "input" && type == "checkbox") { value = elem.checked ? "1" : "0"; }
                if (tag == "input" && type == "radio" && !elem.checked) { return; }
                if (value !== null) { terms.push(name + "/" + encodeURIComponent(value)); }
            });

            return "/" + (
                this.isTabbed ? "activeTabId/" + this.activeTabId + "/" : ""
            ) + terms.join("/");
        }
    });

    return self;
}(jQuery, Nebula, Nebula.Build, Nebula.Widget));
