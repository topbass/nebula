/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Modal = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs, extras) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            backdrop: "static",
            show: false
        };
        this.target  = $(target);
        this.configs = $.extend({}, this.defaults, configs || {});
        this.extras  = extras || {};
        this.widget  = null;
        this.events  = {};
        this.opened  = false;

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
            if ("events" in this.configs) {
                this.events = this.configs.events;
                delete this.configs.events;
            }

            this.target
                .modal(this.configs)
                .css({width: "auto", "z-index": 60000})
                .on("show shown hide hidden", $.proxy(function(e) {
                    if ($(e.target).data("signature") !== this.target.data("signature")) {
                        e.stopImmediatePropagation();
                    }
                }, this))
                .on("resize.modal", this.handleResizeEvent)
                .on("relocate.modal", this.handleRelocateEvent)
                .on("show.isOpened", $.proxy(function(e) {
                    this.opened = true;
                }, this))
                .on("hide.isOpened", $.proxy(function(e) {
                    if (this.target.css("display") != "block") { this.opened = false; }
                }, this))
                .on("hidden", $.proxy(function(e) {
                    if (this.target.css("display") == "none") { this.opened = false; }
                }, this))
                .trigger("resize.modal", [this.extras])
                .trigger("relocate.modal");

            for (var e in this.events) {
                this.target.on(e, this.events[e]);
            }
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.off();

            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.extras = null;
            this.widget = null;
            this.events = null;
            this.opened = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.extras;
            delete this.widget;
            delete this.events;
            delete this.opened;
        },

        // ***** PUBLIC METHODS *****
        show: function() {
            // before showing the next modal, remove all the
            // previous modals' backdrops just in case
            $(".modal-backdrop").remove();
            // now let's show the current modal
            return this.target.modal("show")
                .trigger("relocate.modal")
                .trigger("resize.modal")
                .trigger("relocate.modal");
        },

        hide: function() {
            return this.target.modal("hide");
        },

        resize: function() {
            return this.target
                .trigger("relocate.modal")
                .trigger("resize.modal")
                .trigger("relocate.modal");
        },

        isOpened: function() {
            return this.opened;
        },

        preventDefaultOnHide: function() {
            this.target.on("hide.preventDefault", function(e) {
                return false;
            });
        },

        removePreventDefaultOnHide: function() {
            this.target.off("hide.preventDefault");
        },

        handleResizeEvent: function(event, extras) {
            extras = extras || {};
            $(event.target).find(".modal-body").css({
                width: function() {
                    var context = ("context" in extras) ?
                            extras.context :
                            "body > header:first-child, body > div:first-child";
                    if ("width" in extras) {
                        return (($(window).width() > extras.width) ?
                            extras.width : $(window).width()) - 60;
                    } else {
                        return ($(window).width() >= $(context).width()) ?
                            "auto": $(window).width() - 60;
                    }
                },
                height: function() {
                    var height = ("height" in extras) ?
                            extras.height : $(event.target).height();
                    return (height >= ($(window).height() - 172)) ?
                        $(window).height() - 172 : "auto";
                }
            });
        },

        handleRelocateEvent: function(event) {
            $(event.target).css({
                top: ($(window).outerHeight() - $(event.target).height()) / 2 - 11,
                left: ($(window).outerWidth() - $(event.target).width()) / 2,
                "margin-left": 0,
                "margin-top": 0
            });
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
