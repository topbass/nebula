/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");
Nebula.Register("Nebula.Cache.Dropdown");

Nebula.Widget.Dropdown = (function(window, $, N, W, C, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs, extras) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            source: "",
            firstOptionEmpty: false
        };
        this.target   = $(target);
        this.configs  = $.extend({}, this.defaults, configs);
        this.query    = extras || {};
        this.cacheId  = null;
        this.widget   = null;

        // ***** CALL ***** parent constructor
        parent.call(this, this.target, this.widget, this.configs);

        // ***** CALL ***** local constructor
        this.initialize();
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
            C.Loading = C.Loading || {};
            C.Loaded = C.Loaded || {};
            this.configs.source = (
                this.target.data("dataSource") || this.configs.source
            );
            this.configs.firstOptionEmpty = this.boolval(
                this.target.data("firstOptionEmpty") || this.configs.firstOptionEmpty
            );
            this.configs.hasOptGroup = this.boolval(
                this.target.data("hasOptGroup") || this.configs.hasOptGroup
            );
            this.query.SearchSubstring = "";
            this.target.find("option").remove();
            this.target.append($("<option/>").attr("value", "").text("Loading items..."));
            if (C.Loaded[this.getCacheId()]) {
                this.renderList(C.Loaded[this.getCacheId()].data || {});
            } else {
                $.subscribe("Nebula::Widget::Dropdown::Loading::Done",
                    $.proxy(this.subscribeLoadingDone, this));
                $.subscribe("Nebula::Widget::Dropdown::Loading::Fail",
                    $.proxy(this.subscribeLoadingFail, this));
                if (!C.Loading[this.getCacheId()]) {
                    this.xhrAndPublish();
                }
            }
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.removeData(["signature", "widget"]);

            Nebula.Cache.Dropdown = null;
            delete Nebula.Cache.Dropdown;

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.query = null;
            this.cacheId = null;
            this.widget = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.query;
            delete this.cacheId;
            delete this.widget;
        },

        // ***** PUBLIC METHODS *****
        getCacheId: function() {
            if (this.cacheId === null) {
                this.cacheId = this.configs.source + "?" + $.param(this.query);
            }
            return this.cacheId;
        },

        xhrAndPublish: function() {
            var t = this;
            C.Loading[t.getCacheId()] = t.getCacheId();
            t.xhr({
                method: "GET",
                url: t.configs.source,
                data: t.query,
                scope: t,
                done: function(data, status, xhr) {
                    if (data.error) {
                        // [dropdown.pubsub.publish] Nebula::Widget::Dropdown::Loading::Fail
                        $.publish("Nebula::Widget::Dropdown::Loading::Fail",
                            [t, xhr, data.level, new Error(data.message)]);
                        // [dropdown.event.notify] Nebula::Widget::Dropdown::Loading::Fail
                        t.target.triggerHandler("Nebula::Widget::Dropdown::Loading::Fail",
                            [t, xhr, data.level, new Error(data.message)]);
                    } else {
                        C.Loaded[t.getCacheId()] = data;
                        delete C.Loading[t.getCacheId()];
                        // [dropdown.pubsub.publish] Nebula::Widget::Dropdown::Loading::Done
                        $.publish("Nebula::Widget::Dropdown::Loading::Done",
                            [t, status, xhr, new Error(data.error)]);
                        // [dropdown.event.notify] Nebula::Widget::Dropdown::Loading::Done
                        t.target.triggerHandler("Nebula::Widget::Dropdown::Loading::Done",
                            [t, data, status, xhr]);
                    }
                },
                fail: function(xhr, status, throwable) {
                    // [dropdown.pubsub.publish] Nebula::Widget::Dropdown::Loading::Fail
                    $.publish("Nebula::Widget::Dropdown::Loading::Fail",
                        [t, xhr, status, throwable]);
                    // [dropdown.event.notify] Nebula::Widget::Dropdown::Loading::Fail
                    t.target.triggerHandler("Nebula::Widget::Dropdown::Loading::Fail",
                        [t, xhr, data.level, new Error(data.message)]);
                }
            });
        },

        subscribeLoadingDone: function(wdgt) {
            if (this.getCacheId() === wdgt.getCacheId() &&
                C.Loaded[this.getCacheId()]
            ) {
                this.renderList(C.Loaded[this.getCacheId()].data || {});
            }
        },

        subscribeLoadingFail: function(wdgt) {
            if (this.getCacheId() === wdgt.getCacheId()) {
                this.target.find("option").remove();
                $(document.createElement("option"))
                    .text("Problem loading the list!")
                    .appendTo(this.target);
                this.target.removeClass("warning error").addClass("warning");
            }
        },

        renderList: function(data) {
            var i, j, option = $(document.createElement("option")),
                group, currGroup = '', optGroup = $(document.createElement("optGroup"));

            $.publish("Nebula::Widget::Dropdown::Render::Before", [this, data]);

            this.target.find("option").remove();
            this.target.find("optGroup").remove();
            // prepend an empty option if dom target data [firstOptionEmpty] is set to "1"
            if (this.configs.firstOptionEmpty) {
                option.clone()
                    .val("")
                    .text("")
                    .appendTo(this.target);
            }

            // append options with remotely loaded data
            for (i = 0, j = data.length; i < j; i++) {
                if (this.configs.hasOptGroup) {
                    if (data[i].optGroup && currGroup != data[i].optGroup) {
                        group = optGroup.clone()
                            .attr("label", data[i].optGroup)
                            .appendTo(this.target);
                    }

                    option.clone()
                        .val(data[i].id)
                        .text(data[i].name)
                        .appendTo(group);

                    currGroup = data[i].optGroup;
                } else {
                    option.clone()
                        .val(data[i].id)
                        .text(data[i].name)
                        .appendTo(this.target);
                }
            }
            this.target.on("change", function(event) {
                var elem = $(event.target);
                elem.next("input[type=hidden]").val(elem.find("option:selected").text());
            });
            this.target.val(
                this.target.data("defaultValue") ||
                this.configs.defaultValue ||
                this.target.find("option:first").val()
            );

            $.publish("Nebula::Widget::Dropdown::Render::After", [this, data]);
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget, Nebula.Cache.Dropdown));
