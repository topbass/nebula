/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");
Nebula.Register("Nebula.Global");

Nebula.Widget.Validator = (function(window, $, N, W, G, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            //
        };
        this.target   = $(target);
        this.configs  = $.extend({}, this.defaults, configs);
        this.mark     = null;
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
            t.addResetFormMethod();
            t.addCustomMethods();
            t.mark = $("<i></i>").addClass("message-mark").text("i");
            t.target.validate({
                errorClass: "validator-error",
                validClass: "validator-valid",
                errorPlacement: function(error, element) {
                    var label = element.siblings("label:last"),
                        mark = t.mark.clone();
                    if (!label.length) {
                        label = element.closest("label + div").prev();
                    }
                    if (!label.length) {
                        label = element;
                        label.attr("data-content", error.text())
                            .removeClass("has-popover-error")
                            .addClass("has-popover-error");
                    } else {
                        label.find("i.message-mark").remove();
                        label.attr("data-content", error.text())
                            .removeClass("error has-popover-error")
                            .addClass("error has-popover-error")
                            .append(mark);
                    }
                    error.remove();
                    element.removeClass("error").addClass("error");
                    W.Factory.popover(label, {placement: "bottom"}).load();
                },
                unhighlight: function(element, errorClass, validClass) {
                    // remove error class from the :input field
                    if (element.type === "radio") {
                        this.findByName(element.name).removeClass(errorClass).addClass(validClass);
                    } else {
                        $(element).removeClass(errorClass).addClass(validClass);
                    }
                    // remove popover message
                    var el = $(element).removeClass("error"),
                        lb = el.siblings("label:last");
                    if (!lb.length) { lb = el.closest("label + div").prev(); }
                    if (!lb.length) { lb = el; }
                    try {
                        W.Factory.popover(lb).unload();
                    } catch (err) {}
                    lb.find("i.message-mark").remove();
                }
            });
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.mark = null;
            this.widget = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.mark;
            delete this.widget;
        },

        // ***** PUBLIC METHODS *****
        addCustomMethods: function() {
            // greaterThanZero
            $.validator.addMethod("greaterThanZero", function(value, element) {
                return this.optional(element) || (parseFloat(value) > 0);
            }, "Amount must be greater than zero");
            // requiredAndGreaterThanZero
            $.validator.addMethod("requiredAndGreaterThanZero", function(value, element) {
                return (parseFloat(value) > 0);
            }, "Amount must be greater than zero");
        },

        addResetFormMethod: function() {
            $.extend($.fn, {
                resetForm: function() {
                    var label = this.find("label.error.has-popover-error")
                            .removeClass("error has-popover-error");
                    this.find(".error.validator-error")
                        .removeClass("error");
                    label.find("i.message-mark")
                        .remove();
                    label.each(function() {
                        W.Factory.popover(this).unload();
                    });
                    return this;
                }
            });
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget, Nebula.Global));
