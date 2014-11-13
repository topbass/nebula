/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Calendar = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            showWeek: true,
            onSelect: $.proxy(this.handleOnSelect, this),
            onClose: $.proxy(this.handleOnClose, this),
            beforeShow: $.proxy(this.handleBeforeShow, this),
            dateFormat: "yy-mm-dd",
            // this is not a part of jquery ui datepicker settings
            // it is for formating time in date field
            timeFormat: "",
            fixFocusIE: false
        };
        this.target   = $(target);
        this.configs  = $.extend({}, this.defaults, configs);
        this.button   = null;
        this.origVal  = null;
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
            var t = this;
            if (t.target.prop("tagName").toLowerCase() == "div") {
                t.button = t.target.find(".add-on.fixed-part i");
                t.target = t.target.find("input:text");
                t.button.on("click", function(event) {
                    try {
                        t.target.datepicker("show");
                    } catch (TypeError) {
                        t.target.datepicker(t.configs).datepicker("show");
                    }
                });
            }
            t.target.datepicker(t.configs).on("focus", function() {
                t.origVal = t.target.val();
            }).on("keyup datepickerselect.nebula", function(e, lastVal) {
                if (e.type == "datepickerselect" && lastVal) {
                    t.origVal = lastVal;
                }
                // stop all the other keyup event from bubbling up if the datepicker
                // value hasn't been changed
                if (t.origVal === t.target.val()) {
                    e.stopImmediatePropagation();
                } else
                    t.origVal = t.target.trigger("datepickerchange.nebula").val();
            });
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            if (this.button !== null) {
                this.button.off("click");
            }
            this.target.datepicker("hide").datepicker("destroy");

            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.button = null;
            this.origVal = null;
            this.widget = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.button;
            delete this.origVal;
            delete this.widget;
        },

        // ***** PUBLIC METHODS *****
        handleOnSelect: function(dateText, instance) {
            var time = "", matches = [];
            if (instance.lastVal) {
                matches = instance.lastVal
                    .match(/([0-9-\/\.]*)\s+([0-9]{1,2}:(?:[0-9]{1,2}:)?(?:[0-9]{1,2})?)?/);
                if (matches && matches[2]) {
                    time = matches[2];
                }
            }
            instance.settings.fixFocusIE = true;
            instance.input.val(
                dateText + (time ? " " + time : "")
            ).change().focus();
            instance.input.trigger("datepickerselect.nebula", [instance.lastVal]);
        },

        handleOnClose: function(dateText, instance) {
            instance.settings.fixFocusIE = true;
            instance.input.focus();
        },

        handleBeforeShow: function(input, instance) {
            var elem = $(input),
                result = $("html").is(".ie") ? !instance.settings.fixFocusIE : true;
            // brings calendar layer to the front for datepicker fields
            // in modal dialogs
            if (elem.parents(".modal").length) {
                elem.css({position: "relative", "z-index": 100000});
            }
            instance.settings.fixFocusIE = false;
            return result;
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
