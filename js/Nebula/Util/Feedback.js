/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Util");
Nebula.Register("Nebula.Cache.Feedback");

Nebula.Util.Feedback = (function($, Nebula, Util, Cache) {
    "use strict";

    var parent = Nebula.Core.Abstract;

    var self = function(level, message, throwable) {
        // *** PUBLIC PROPERTIES ***
        this.styles  = {
            ERROR  : {css: "alert alert-error fade in",   icon: "error-icon"},
            WARN   : {css: "alert fade in",               icon: "warning-icon"},
            INFO   : {css: "alert alert-info fade in",    icon: "info-icon"},
            SUCCESS: {css: "alert alert-success fade in", icon: "success-icon"}
        };
        this.target = $("div.alert.fade.in");

        // *** CALL *** parent constructor
        parent.call(this, this.target);

        // *** CALL *** local constructor
        this.initialize(level, message, throwable);
    };

    // *** EXTEND *** parent class
    self.inherit(parent);

    // *** PUBLIC -STATIC- PROPERTIES ***
    self.timeout = null;

    // *** PUBLIC -STATIC- METHODS ***
    self.singleton = function singleton(level, args) {
        var delay = 6000;

        args = Array.prototype.slice.call(args);

        if (typeof args[args.length - 1] == "number") {
            delay = args.pop();
        }

        Cache = Cache.hasOwnProperty("signature") ?
            Cache.execute(level, args) :
            Nebula.Instance.apply(this, [self, level].concat(args));

        return Cache.fadeOut(delay);
    };

    self.error   = function error()   { return self.singleton("ERROR", arguments); };
    self.warn    = function warn()    { return self.singleton("WARN", arguments); };
    self.info    = function info()    { return self.singleton("INFO", arguments); };
    self.success = function success() { return self.singleton("SUCCESS", arguments); };
    self.discard = function discard() {
        var target = $("div.alert.fade.in");
        if (self.timeout !== null) {
            clearTimeout(self.timeout);
            self.timeout = null;
        }
        if (target.is(":visible")) {
            $("div.alert.fade.in").hide(0, function() {
                setTimeout(function() {
                    $.publish("Nebula::Util::Feedback::Resize");
                }, 0);
            });
        }
    };

    self.prototype = $.extend(self.prototype, {
        // *** CONSTRUCTOR ***
        initialize: function(level, message, throwable) {
            this.target.removeClass().prop("class", "").hide();
            if (typeof level != "undefined" && typeof message != "undefined") {
                this.feedback(level, message, throwable);
            }
            $.subscribe("Nebula::Util::Feedback::FadeOut", $.proxy(this.subscribeFadeOut, this));
        },

        // *** DESTRUCTOR ***
        destruct: function() {
        },

        // *** PUBLIC METHODS ***
        error  : function() { return this.execute("ERROR", arguments);   },
        warn   : function() { return this.execute("WARN", arguments);    },
        info   : function() { return this.execute("INFO", arguments);    },
        success: function() { return this.execute("SUCCESS", arguments); },

        feedback: function(level, message, throwable) {
            // change feedback message section to the style that is preconfiged
            // in feedback level setting object
            this.target.find("i").removeClass().prop("class", "")
                .addClass(this.styles[level].icon);
            this.target.find("p").html(message);
            this.target.removeClass().prop("class", "")
                .addClass(this.styles[level].css).show();

            // resize modal dialog
            $.publish("Nebula::Util::Feedback::Resize");
            // scroll to feedback message
            $.publish("Nebula::Util::Feedback::Focus");

            // throw error if throwable is given
            if (typeof throwable != "undefined") {
                throw throwable;
            }

            return this;
        },

        fadeOut: function(delay) {
            var t = this;

            if (self.timeout !== null) {
                clearTimeout(self.timeout);
                self.timeout = null;
            }

            self.timeout = setTimeout(function() {
                delay = parseInt(delay, 10);
                t.target.fadeOut(1000, function() {
                    $.publish("Nebula::Util::Feedback::Resize");
                });
            }, (isNaN(delay) ? 6000 : delay));

            return this;
        },

        execute: function(level, args) {
            args = Array.prototype.slice.call(args);
            return this.feedback.apply(this, [level].concat(args));
        },

        subscribeFadeOut: function(delay, publisher) {
            return this.fadeOut(delay);
        }
    });

    return self;
}(jQuery, Nebula, Nebula.Util, Nebula.Cache.Feedback));
