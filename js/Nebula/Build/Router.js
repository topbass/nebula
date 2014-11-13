/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");

Nebula.Build.Router = (function(window, $, N, B, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target) {
        // ***** PUBLIC PROPERTIES *****
        this.router  = null;
        this.history = false;
        this.params  = {};

        // ***** CALL ***** parent constructor
        parent.call(this);

        // ***** CALL ***** local constructor
        this.initialize();
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ PROPERTIES *****
    self.router  = null;
    self.history = false;
    self.params  = {};

    // ***** PUBLIC _STATIC_ METHODS *****
    self.historyApi = function historyApi() {
        return !!(window.history && history.pushState);
    };

    self.fullPrefix = function fullPrefix() {
        return self.origin() + self.prefix();
    };

    self.prefix = function prefix(url) {
        return (url || decodeURIComponent(N.Global.url));
    };

    self.origin = function origin() {
        var loc = window.location;

        if (!loc.origin) {
            loc.origin = loc.protocol + "//" + loc.hostname + (
                loc.port ? ":" + loc.port: ""
            );
        }

        return loc.origin;
    };

    self.on = function on() {
        var path, prefix, route;

        // return this.router.on();
        switch (arguments.length) {
            // [string path, function route]
            case 2:
                path = self.prefix() + arguments[0];
                route = arguments[1];
                break;
            // [string path, string prefix, function route]
            case 3:
                path = self.prefix(arguments[1]) + arguments[0];
                route = arguments[2];
                break;
            default:
                return null;
        }

        self.router.on(path, route);

        return self;
    };

    // thanks to stackoverflow again:
    // http://stackoverflow.com/questions/520611/how-can-i-match-multiple-occurrences-with-a-regex-in-javascript-similar-to-phps
    self.parse = function parse(path) {
        var regex, match, param, decode;

        regex = /(?:#|\/)([^\/]+)\/?([^\/]*)/g;
        match = null;
        param = {};
        decode = function (s) {
            return decodeURIComponent(s.replace(/\+/g, " "));
        };

        while ((match = regex.exec(path))) {
            param[decode(match[1])] = decode(match[2]);
        }

        return param;
    };

    self.getPath = function getPath() {
        var path;

        path = (
            self.history ?
                self.router.getPath() :
                window.location.hash.replace(/.*#/, "")
        ).replace(self.prefix(), "");

        return (path.charAt(0) === "/" ? path : "/" + path);
    };

    self.getParam = function getParam() {
        return self.parse(self.getPath());
    };

    self.getMergedParam = function getMergedParam() {
        var prefix, path1, path2;

        prefix = self.prefix();
        path1 = self.router.getPath().replace(prefix, "");
        path2 = window.location.hash.replace(/.*#/, "").replace(prefix, "");

        return $.extend({}, self.parse(path1), self.parse(path2));
    };

    self.setRoute = function setRoute(path) {
        self.router.setRoute(self.prefix() + path.replace(/.*#/, ""));

        return self;
    };

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Build.Router or its child
    // classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
            var t, w;

            t = this;
            w = $(window);
            // t.history = self.history = t.historyApi();
            t.history = self.history = false;

            // init
            t.router = self.router = new Router()
                .configure({
                    html5history: t.history,
                    notfound: t.notfound,
                    run_handler_in_init: false
                })
                .init();

            // trigger on initial load
            setTimeout(function() {
                if (t.history) {
                    w.trigger("popstate");
                } else
                    w.trigger("hashchange");
            }, 500);

            $("a[rel=pushstate], button[rel=pushstate]").on("click", function(e) {
                e.preventDefault();
                t.setRoute($(this).attr("href"));
            });
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
        },

        // ***** PUBLIC METHODS *****
        historyApi: self.historyApi,
        fullPrefix: self.fullPrefix,
        prefix: self.prefix,
        origin: self.origin,
        on: self.on,
        parse: self.parse,
        getPath: self.getPath,
        getParam: self.getParam,
        setRoute: self.setRoute,

        notfound: function() {
            var hash, path1, path2, prefix;

            if (self.router === null) {
                return;
            }

            hash = window.location.hash;
            path1 = self.getPath();
            path2 = self.router.getPath();
            prefix = self.prefix();

            if ((hash === "" || hash === "#") &&
                !self.history &&
                path2 != prefix &&
                path2.indexOf(prefix) === 0
            ) {
                self.router.setRoute(path2);
                return;
            }

            self.params = self.parse(path1);

            $.publish("Nebula::Build::Router::StateChange", [
                self.router, self.params, path1, path2
            ]);
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Build));
