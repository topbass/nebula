/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Core");
Nebula.Register("Nebula.Cache.Abstract");

Nebula.Core.Abstract = (function(window, $, N, C, Cache, undefined) {
    "use strict";

    var self = function self(target, widget, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.guid      = null;
        this.signature = null;
        this.target    = target ? $(target) : null;
        this.widget    = widget  || null;
        this.configs   = configs || {};
        this.reference = null;
        this.fQueue    = {};
        this.fQueueC   = {};

        // ***** CONSTRUCTOR *****
        if (this.target !== null) {
            this.injectSignature();
        }
        if (this.widget !== null) {
            this.injectWidget();
        }
    };

    // ***** PUBLIC _STATIC_ METHODS *****
    self.__getEl =
    function __getEl(el) {
        return document.getElementById(el);
    };

    self.__newEl =
    function __newEl(el) {
        return document.createElement(el);
    };

    self.getPackageName =
    function getPackageName() {
        return N.Global["package"] + "." + N.Global.subpackage;
    };

    self.openMessageWindow =
    function openMessageWindow(options) {
        var target = $("#MessageWindow"),
            primary = target.find(".modal-footer a.btn-primary"),
            secondary = primary.siblings("a.btn");

        N.Widget.Factory.modal(target).show();
        target.find(".modal-header > h3")
            .text(options.title || "Confirmation");
        target.find(".modal-body > i")
            // .removeClass()
            .prop("class", "")
            .addClass(options.icon || "dummy-icon-24");
        target.find(".modal-body > p")
            .html(options.message || "");
        primary
            .text(options.primaryButtonText || "Ok")
            .off("click")
            .on("click", $.proxy(options.callback || options.yep || function() {}, target));
        secondary
            .text(options.secondaryButtonText || "Cancel")
            .off("click")
            .on("click", $.proxy(options.nope || function() {}, target));

        if (options.hidePrimaryButton) {
            primary.hide();
        } else
            primary.show();

        if (options.hideSecondaryButton) {
            secondary.hide();
        } else
            secondary.show();

        return target;
    };

    self.alert =
    function alert(title, message) {
        self.openMessageWindow({
            title: title,
            icon: "info-icon-24",
            message: message,
            yep: function() {
                this.modal("hide");
                return false;
            },
            primaryButtonText: "Ok",
            hideSecondaryButton: true
        });

        return false;
    };

    self.xhr =
    function xhr(settings) {
        settings = settings || {};

        // validate arguments and set default values if needed
        if (!settings.url) {
            // throw {
            //     name:    "InvalidArgumentError",
            //     message: "No URL specified for XHR call."
            // };
            throw "No URL specified for XHR call.";
        }

        settings.method           = settings.method           || "GET";
        settings.data             = settings.data             || {};
        settings.cache            = settings.cache            || false;
        settings.timeout          = settings.timeout          || 60000;
        settings.scope            = settings.scope            || this;
        settings.beforeSend       = settings.beforeSend       || new Function();
        settings.beforeXhrSend    = settings.beforeXhrSend    || new Function();
        settings.done             = settings.done             || new Function();
        settings.fail             = settings.fail             || new Function();
        settings.always           = settings.always           || new Function();
        settings.readyStateChange = settings.readyStateChange || new Function();

        // start XHR call
        settings.beforeSend.call(settings.scope);

        return $.ajax({
            xhr: function() {
                return $($.ajaxSettings.xhr()).on(
                    "readystatechange",
                    $.proxy(settings.readyStateChange, settings.scope)
                )[0];
            },
            url: settings.url,
            type: settings.method,
            data: settings.data,
            async: true,
            cache: settings.cache,
            timeout: settings.timeout,
            dataType: "json",
            beforeSend: $.proxy(settings.beforeXhrSend, settings.scope)
        }).done(
            // [data, status, xhr]
            $.proxy(settings.done, settings.scope)
        ).fail(
            // [xhr, status, error]
            $.proxy(settings.fail, settings.scope)
        ).always(
            // [dataOrXhr, status, xhrOrError]
            $.proxy(settings.always, settings.scope)
        );
    };

    self.isDebug =
    function isDebug() {
        var env = (N.Global && N.Global.environment) ? N.Global.environment : "production";
        return (env == "development");
    };

    self.intval =
    function intval(val) {
        return +(val);
    };

    self.boolval =
    function boolval(val) {
        return !!(this.intval(val));
    };

    self.strval =
    function strval(val) {
        return val + "";
    };

    self.showShortActionWindow =
    function showShortActionWindow() {
        return N.Widget.Factory.modal("#ShortActionWindow").show();
    };

    self.hideShortActionWindow =
    function hideShortActionWindow() {
        return N.Widget.Factory.modal("#ShortActionWindow").hide();
    };

    self.showProcessingWindow =
    function showProcessingWindow(message) {
        var target = $("#ProcessingWindow"),
            modal = N.Widget.Factory.modal(target);
        if (!modal.isOpened()) {
            modal.show();
        }
        target.find(".message").html(message || "");
        modal.resize();
        return target;
    };

    self.hideProcessingWindow =
    function hideProcessingWindow() {
        return N.Widget.Factory.modal("#ProcessingWindow").hide();
    };

    self.updateProcessingWindow =
    function updateProcessingWindow(message) {
        $("#ProcessingWindow .message").html(message);
    };

    self.showLoadingIndicator =
    function showLoadingIndicator() {
        var target = $(".eS-loading-indicator");

        if (target.length) {
            N.Widget.Factory.spinner(target.show().find("div.spinner")).play();
        }

        return target;
    };

    self.hideLoadingIndicator =
    function hideLoadingIndicator() {
        var target = $(".eS-loading-indicator");

        if (target.length) {
            N.Widget.Factory.spinner(target.hide().find("div.spinner")).stop();
        }

        return target;
    };

    self.enableForm =
    function enableForm(form) {
        form = $(form || this.target);

        form.find("input:not([type=hidden]), textarea, select, button")
            .filter("[disabled]")
            .prop("disabled", false);
        form.find(".extended-input")
            .filter(".disabled")
            .removeClass("disabled");

        var token = form.find("input[data-token-search]");

        if (token.length > 0 && token[0].selectize) {
            token[0].selectize.enable();
        }

        return form;
    };

    self.disableForm =
    function disableForm(form) {
        form = $(form || this.target);

        form.find("input:not([type=hidden]), textarea, select, button")
            .prop("disabled", true);

        form.find(".extended-input")
            .addClass("disabled");

        var token = form.find("input[data-token-search]");

        if (token.length > 0 && token[0].selectize) {
            token[0].selectize.disable();
        }

        return form;
    };

    self.resetForm =
    function resetForm(form, alsoEmpty) {
        form = form || this.target;

        form[0].reset();

        if (alsoEmpty) {
            form.find(alsoEmpty).val("");
        }

        form.find("select[data-default-value]").val(function() {
            return $(this).data("defaultValue");
        });

        return form;
    };

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Core.Abstract or its child
    // classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.removeData(["signature", "widget"]);
        },

        // ***** PUBLIC METHODS *****
        newGuid: function() {
            this.guid = Math.floor(Math.random() * 0x10000).toString(16) +
                (+(new Date()));
            return this;
        },

        injectSignature: function() {
            var elementId = this.target.prop("id") ?
                this.target.prop("id") : this.target.prop("name") ?
                    this.target.prop("name") : this.target.selector.replace(" ", "@_@");
            this.signature = ("{0}::{1}").format(
                elementId,
                this.newGuid().guid
            );
            this.target.data("signature", this.signature);
            return this;
        },

        injectWidget: function() {
            this.target.data("widget", this.widget);
            return this;
        },

        isReferenceMatched: function(reference) {
            if (this.reference === null) {
                this.reference = (this.target.prop("id") || this.target.prop("name"));
            }
            switch (typeof reference) {
                case "string":
                    if (reference == this.reference)                              { return true; }
                    break;
                case "object":
                    if (reference === null)                                       { return true; }
                    if (reference.match && reference.match == this.reference)     { return true; }
                    if (reference.except && reference.except != this.reference)   { return true; }
                    if (reference.regex && this.reference.match(reference.regex)) { return true; }
                    if (reference.contain &&
                        $.inArray(this.reference, reference.contain) != -1)       { return true; }
                    break;
                case "undefined":
                    return true;
            }
            return false;
        },

        fQueueWrap: function(func, context, params) {
            return function() {
                func.apply(context, params || []);
            };
        },

        fQueueCond: function() {
            var cond = null,
                qname = "default";
            switch (arguments.length) {
                case 0:
                    if (typeof this.fQueueC[qname] == "undefined") {
                        break;
                    }
                    return !!(this.fQueueC[qname])();
                case 1:
                    if (typeof arguments[0] == "function") {
                        cond = arguments[0];
                        this.fQueueC[qname] = cond;
                        break;
                    }
                    if (typeof arguments[0] == "string") {
                        qname = arguments[0];
                        return !!(this.fQueueC[qname])();
                    }
                    break;
                case 2:
                    cond = arguments[0];
                    qname = arguments[1];
                    return !!(this.fQueueC[qname])();
                default:
                    break;
            }
            return true;
        },

        fQueuePush: function(func, qname) {
            qname = qname || "default";
            if (typeof this.fQueue[qname] == "undefined") {
                this.fQueue[qname] = [];
            }
            this.fQueue[qname].push(func);
        },

        fQueueExec: function(qname) {
            qname = qname || "default";
            if (typeof this.fQueue[qname] == "undefined") {
                return;
            }
            while (this.fQueue[qname].length > 0) {
                (fQueue[qname].shift())();
            }
        },

        __getEl               : self.__getEl,
        __newEl               : self.__newEl,
        getGuid               : function() { return this.guid; },
        getSignature          : function() { return this.signature; },
        getTarget             : function() { return this.target; },
        getWidget             : function() { return this.widget; },
        getPackageName        : self.getPackageName,
        isDebug               : self.isDebug,
        intval                : self.intval,
        boolval               : self.boolval,
        strval                : self.strval,
        xhr                   : self.xhr,
        enableForm            : self.enableForm,
        disableForm           : self.disableForm,
        resetForm             : self.resetForm,
        showShortActionWindow : self.showShortActionWindow,
        hideShortActionWindow : self.hideShortActionWindow,
        showProcessingWindow  : self.showProcessingWindow,
        hideProcessingWindow  : self.hideProcessingWindow,
        updateProcessingWindow: self.updateProcessingWindow,
        showLoadingIndicator  : self.showLoadingIndicator,
        hideLoadingIndicator  : self.hideLoadingIndicator,
        openMessageWindow     : self.openMessageWindow,
        alert                 : self.alert
    });

    return self;
}(window, jQuery, Nebula, Nebula.Core, Nebula.Cache.Abstract));

