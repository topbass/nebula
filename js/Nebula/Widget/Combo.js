/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");
Nebula.Register("Nebula.Cache.Combo");

Nebula.Widget.Combo = (function(window, $, N, W, C, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs, extras) {
        // *** PUBLIC PROPERTIES ***
        this.defaults      = {
            minLength: 3,
            delay    : 200,
            source   : this.handleAutocompleteSource,
            select   : this.handleAutocompleteSelect,
            open     : this.handleAutocompleteOpen,
            close    : this.handleAutocompleteClose,
            allowNew : true,
            hasDesc  : false,
        };
        this.target        = $(target);
        this.configs       = $.extend({}, this.defaults, configs || {});
        this.query         = extras || {};
        this.source        = this.target.data("dataSource");
        this.hiddenId      = null;
        this.hiddenName    = null;
        this.hidCallback   = null;
        this.cacheId       = null;
        this.beforeVal     = "";
        this.afterVal      = "";
        this.isSelected    = false;
        this.isOpened      = false;
        this.isIdEmptied   = false;
        this.allowNew      = true;
        this.isNewExisting = false;
        this.xhreq         = null;
        this.reference     = null;
        this.widget        = null;

        // *** CALL *** parent constructor
        parent.call(this, this.target, this.widget, this.configs);

        // *** CALL *** local constructor
        this.initialize();
    };

    // *** EXTEND *** parent class
    self.inherit(parent);

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
            var t = this;

            t.isNewExisting = t.boolval(t.target.data("newExisting"));
            if (t.getHiddenId().length) {
                t.getHiddenId().data("previousValue", "");
            }

            // convert [this.configs.allowNew] to boolean, assign the result
            // to [this.allowNew] and delete [allowNew] from [this.configs]
            t.allowNew = t.boolval(t.configs.allowNew);
            delete t.configs.allowNew;

            // point event handlers context back to Combo object itself
            for (var key in t.configs) {
                if (typeof t.configs[key] == "function") {
                    t.configs[key] = $.proxy(t.configs[key], t);
                }
            }

            // initialize autocomplate field
            t.target.autocomplete(t.configs)
                .on("keyup blur", [t], t.handleTextFieldKeyupAndBlur)
                .on("focus", [t], t.handleTextFieldFocus);

            // ** Pub:Sub **
            $.subscribe("Nebula::Widget::Combo::DescriptionFormat", $.proxy(t.applyCustomRenderItem, t));
            $.subscribe("Nebula::Widget::Combo::HiddenId::InitPreviousValue", $.proxy(t.subscribeHiddenIdInitPreviousValue, t));
            $.subscribe("Nebula::Widget::Combo::HiddenId::PreviousValueCallback", $.proxy(t.subscribeHiddenIdSetPreviousValue, t));

            t.target
                .on("Nebula::Widget::Combo::DescriptionFormat", $.proxy(t.handleEventDescriptionFormat, t))
                .on("Nebula::Widget::Combo::HiddenId::InitPreviousValue", $.proxy(t.handleEventHiddenIdInitPreviousValue, t))
                .on("Nebula::Widget::Combo::HiddenId::PreviousValueCallback", $.proxy(t.handleEventHiddenIdPreviousValueCallback, t))
                ;

            t.applyCustomRenderItem();

            if (!t.target.prop("placeholder")) {
                t.target.prop("placeholder",
                    ("Search as you type (min. {0} letters)").format(t.configs.minLength));
            }

            if (t.isNewExisting) {
                t.enableNewExistingToggle();
            }
        },

        // *** DESTRUCTOR ***
        destruct: function() {
            this.target.removeData(["signature", "widget"]);

            Nebula.Cache.Combo = null;
            delete Nebula.Cache.Combo;

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.query = null;
            this.source = null;
            this.hiddenId = null;
            this.hiddenName = null;
            this.hidCallback = null;
            this.cacheId = null;
            this.beforeVal = null;
            this.afterVal = null;
            this.isSelected = null;
            this.isOpened = null;
            this.isIdEmptied = null;
            this.allowNew = null;
            this.isNewExisting = null;
            this.xhreq = null;
            this.reference = null;
            this.widget = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.query;
            delete this.source;
            delete this.hiddenId;
            delete this.hiddenName;
            delete this.hidCallback;
            delete this.cacheId;
            delete this.beforeVal;
            delete this.afterVal;
            delete this.isSelected;
            delete this.isOpened;
            delete this.isIdEmptied;
            delete this.allowNew;
            delete this.isNewExisting;
            delete this.xhreq;
            delete this.reference;
            delete this.widget;
        },

        // *** PUBLIC METHODS ***
        getCacheId: function() {
            // if (this.cacheId === null) {
            //     this.cacheId = this.source + "?" + $.param(this.query);
            // }
            this.cacheId = this.source + "?" + $.param(this.query);
            return this.cacheId;
        },

        getHiddenId: function() {
            if (this.hiddenId === null) {
                this.hiddenId = this.target.next("input[type=hidden]");
                if (!this.hiddenId.length || this.target.data("referenceId")) {
                    this.hiddenId = $(("input[type=hidden][name='{0}']").format(
                        this.target.data("referenceId")
                    ));
                }
            }
            return this.hiddenId;
        },

        setHiddenId: function(value) {
            if (this.getHiddenId().length) {
                this.getHiddenId().val(value);
            }
        },

        enableNewExistingToggle: function() {
            var t = this,
                toggle = t.target.parent(".existing-value").parent(".has-combo-toggle");

            t.hiddenName = toggle.find(
                ("[type=hidden][name={0}]").format(
                    toggle.find(".btn-group").data("toggleField")
                )
            );

            toggle.find(".btn-group > .btn").on("click", function(e) {
                var button = $(e.target);
                toggle.find(".new-value, .existing-value").hide();
                toggle.find("." + button.data("toggleTarget")).show().find("input:text:first").focus();
                (t.hidCallback || function(widget, toggle, button) {
                    // var previousId = button.is("[data-toggle-target=new-value]") ? t.getHiddenId().val() : "",
                    var previousId = t.getHiddenId().val(),
                        previousName = toggle.find("." + button.data("toggleTarget") + " input:text:first").val();
                    t.getHiddenId().val(t.getHiddenId().data("previousValue"));
                    t.getHiddenId().data("previousValue", previousId);
                    t.hiddenName.val(previousName);
                }).call(t, t, toggle, button);
            });

            toggle.find(".new-value").on("keyup", function(e) {
                t.hiddenName.val($(e.target).val());
            });
        },

        // Nebula::Widget::Combo::DescriptionFormat
        // => pubsub
        applyCustomRenderItem: function(callback, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::Widget::Combo::DescriptionFormat", [callback]);
            return this;
        },
        // => event
        handleEventDescriptionFormat: function(e, callback) {
            var t = this;

            t.target.data("ui-autocomplete")._renderItem = function(ul, item) {
                var re = new RegExp(
                        ("{0}").format(t.target.data("ui-autocomplete").term), "i"
                    ),
                    func = function(match) {
                        return ("<strong><u>{0}</u></strong>").format(match);
                    };
                return $("<li>")
                    .append($("<a>").html(
                        ("{0}<br><span class=\"description\">{1}</span>").format(
                            (item.name || "").replace(re, func),
                            t.configs.hasDesc ? (
                                callback ?
                                    callback.call(t, ul, item) :
                                    (item.description || "").replace(re, func)
                            ) : ""
                        )
                    ))
                    .appendTo(ul);
            };
        },

        // Nebula::Widget::Combo::HiddenId::InitPreviousValue
        // => pubsub
        subscribeHiddenIdInitPreviousValue: function(value, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::Widget::Combo::HiddenId::InitPreviousValue", [value]);
            return this;
        },
        // => event
        handleEventHiddenIdInitPreviousValue: function(e, value) {
            if (!this.getHiddenId().length) {
                return this;
            }

            this.getHiddenId().data("previousValue", value);
        },

        // Nebula::Widget::Combo::HiddenId::PreviousValueCallback
        // => pubsub
        subscribeHiddenIdSetPreviousValue: function(callback, reference) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::Widget::Combo::HiddenId::PreviousValueCallback", [callback]);
            return this;
        },
        // => event
        handleEventHiddenIdPreviousValueCallback: function(e, callback) {
            this.hidCallback = callback;
        },

        handleAutocompleteSource: function(request, response) {
            var t = this,
                term = request.term,
                bg = t.target.css("background-color"),
                src = null;
            // autocomplete search request querying parameters
            request = $.extend(request, t.query);
            request.SearchSubstring = term;
            delete request.term;
            // use the entire request url and query string as cache id
            src = t.getCacheId();
            // check if cache id exists in cache object, if it does, use cache to respond
            if (!(src in C)) {
                C[src] = {};
            }
            if (term in C[src]) {
                response(C[src][term].data);
                return;
            }
            // abort previously started xhr call if user types search term too fast
            if (t.xhreq !== null) {
                t.xhreq.abort();
            }
            // make actual xhr call
            t.xhreq = t.xhr({
                method: "GET",
                url: t.source,
                data: request,
                scope: t,
                timeout: 20000,
                beforeSend: function() {
                    // show loading indicator
                    t.target.css(
                        "background",
                        ("{0} url(/img/spinner-combo-gray.gif) no-repeat center right")
                            .format(bg || "")
                    );
                },
                always: function() {
                    // hide loading indicator
                    t.target.css("background-image", "none").css("background-color", bg);
                },
                done: function(data) {
                    // store returned data into cache and response
                    C[src][term] = data;
                    response(data.data);
                    t.xhreq = null;
                },
                fail: function() {}
            });
        },

        handleAutocompleteSelect: function(event, ui) {
            this.target.val(ui.item.name);
            this.hiddenId.val(ui.item.id);
            this.afterVal = ui.item.name;
            this.isSelected = true;
            if (this.isNewExisting) {
                this.hiddenName.val(ui.item.name);
            }
            // Nebula::Widget::Combo::Select
            // => pubsub
            $.publish("Nebula::Widget::Combo::Select", [this, event, ui]);
            // => event
            this.target.triggerHandler("Nebula::Widget::Combo::Select", [this, event, ui]);
            return false;
        },

        handleAutocompleteOpen: function(event, ui) {
            this.isOpened = true;
            // Nebula::Widget::Combo::Open"
            // => pubsub
            $.publish("Nebula::Widget::Combo::Open", [this, event, ui]);
            // => event
            this.target.triggerHandler("Nebula::Widget::Combo::Open", [this, event, ui]);
        },

        handleAutocompleteClose: function(event, ui) {
            this.isOpened = false;
            if (this.beforeVal != this.afterVal && !this.isSelected) {
                if (this.allowNew) {
                    this.hiddenId.val("");
                    this.isIdEmptied = true;
                } else {
                    this.target.val(this.beforeVal);
                    if (this.isNewExisting) {
                        this.hiddenName.val(this.beforeVal);
                    }
                }
            }
            // Nebula::Widget::Combo::Close
            // => pubsub
            $.publish("Nebula::Widget::Combo::Close", [this, event, ui]);
            // => event
            this.target.triggerHandler("Nebula::Widget::Combo::Close", [this, event, ui]);
        },

        handleTextFieldKeyupAndBlur: function(event) {
            var t = event.data[0],
                tt = $(this);
            if (!tt.val()) {
                t.hiddenId.val("");
                if (t.isNewExisting) {
                    t.hiddenName.val("");
                }
            } else {
                if (event.type == "blur") {
                    // handles the case that the field has a previous selected value
                    // from autocomplete list, but the value gets changed again before
                    // the autocomplete finishes another search
                    if (!t.isOpened) {
                        // t.isSelected = false;
                        // t.beforeVal = t.afterVal;
                    }
                    if (!t.isSelected) {
                        t.afterVal = tt.val();
                    }
                    t.handleAutocompleteClose.call(t, event, {});
                }
            }
        },

        handleTextFieldFocus: function(event) {
            var t = event.data[0],
                tt = $(this);
            t.beforeVal = tt.val();
            t.isSelected = false;
            t.isIdEmptied = false;
            tt.select();
            // read query data from the combo element
            t.query = $.extend(
                t.query,
                W.Factory.dataToQuery(W.Factory.readData(t.target, "query"))
            );
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget, Nebula.Cache.Combo));
