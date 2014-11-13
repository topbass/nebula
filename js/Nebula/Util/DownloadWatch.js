/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Util");

Nebula.Util.DownloadWatch = (function($, Nebula, Util) {
    "use strict";

    var parent = Nebula.Core.Abstract;

    var self = function(prefix, attempts) {
        // *** PUBLIC PROPERTIES ***
        this.timer = null;
        this.token = null;
        this.attempts = null;

        // *** CALL *** parent constructor
        parent.call(this, this.target);

        // *** CALL *** local constructor
        this.initialize.apply(this, arguments);
    };

    // *** EXTEND *** parent class
    self.inherit(parent);

    // *** PUBLIC -STATIC- PROPERTIES ***

    // *** PUBLIC -STATIC- METHODS ***
    self.getCookie = function(name) {
        var parts = document.cookie.split(name + "=");
        return (parts.length == 2) ?
            parts.pop().split(";").shift() : null;
    };

    self.expireCookie = function(name) {
        document.cookie = ("{0}={1};expires={2};path={3};domain={4}").format(
            encodeURIComponent(name), "", "Thu, 01 Jan 1970 00:00:01 GMT", "/", location.host
        );
    };

    self.newToken = function(prefix) {
        return (prefix || "nebula-download-") +
            Math.floor(Math.random() * 0x10000).toString(16) +
            (+new Date());
    };

    self.cookieEnabled = function() {
        if (!navigator.cookieEnabled) {
            document.cookie = "nebulaTestCookieEnabled";
            return (document.cookie.indexOf("nebulaTestCookieEnabled") !== -1);
        }
        return true;
    };

    self.prototype = $.extend(self.prototype, {
        // *** CONSTRUCTOR ***
        initialize: function(prefix, attempts) {
            this.getToken(prefix);
            this.setAttempts(60);

            return this;
        },

        // *** DESTRUCTOR ***
        destruct: function() {
        },

        // *** PUBLIC METHODS ***
        getCookie: self.getCookie,
        expireCookie: self.expireCookie,
        newToken: self.newToken,
        cookieEnabled: self.cookieEnabled,

        getToken: function(prefix, refresh) {
            if (this.token === null || refresh) {
                this.token = this.newToken(prefix);
            }
            return this.token;
        },

        setAttempts: function(attempts) {
            if (typeof attempts != "undefined") {
                this.attempts = +attempts;
            }
            if (!this.cookieEnabled()) {
                this.attempts = 3;
            }
            return this;
        },

        watch: function(watch, unwatch) {
            if (typeof watch == "function") {
                watch.call(this);
            }
            this.timer = setInterval($.proxy(function() {
                var token = this.getCookie("nebulaDownloadWatchToken");
                if (token == this.token || this.attempts <= 0) {
                    this.unwatch(unwatch);
                }
                this.attempts--;
            }, this), 1000);

            return this;
        },

        unwatch: function(unwatch) {
            if (typeof unwatch == "function") {
                unwatch.call(this);
            }
            clearInterval(this.timer);
            this.expireCookie("nebulaDownloadWatchToken");

            return this;
        }
    });

    return self;
}(jQuery, Nebula, Nebula.Util));
