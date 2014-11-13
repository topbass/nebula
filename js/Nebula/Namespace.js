/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
var Nebula = Nebula || {};

Nebula.Namespace = (function(window, undefined) {
    "use strict";

    // we use an intermediary empty constructor to create an
    // inheritance chain, because using the parent class' constructor
    // might have side effects.
    Function.prototype.inherit = function inherit(parent) {
        var self = this, Construct = function () {};

        Construct.prototype = parent.prototype;
        self.prototype = new Construct();
        self.prototype.constructor = self;
        self.prototype.$super = parent;
    };

    // similar to sprintf in php, the following section of code
    // enables format method in string object
    //
    // examples:
    // ('{0} is {1}!').format('JavaScript', 'awesome');
    String.prototype.format = function format() {
        var formatted = this;
        for (var i = 0; i < arguments.length; i++) {
            var regexp = new RegExp('\\{'+i+'\\}', 'gi');
            formatted = formatted.replace(regexp, arguments[i]);
        }

        return formatted;
    };

    String.prototype.strstr = function strstr(needle, bool) {
        // Finds first occurrence of a string within another
        //
        // version: 1103.1210
        // discuss at: http://phpjs.org/functions/strstr
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Onno Marsman
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: strstr('Kevin van Zonneveld', 'van');
        // *     returns 1: 'van Zonneveld'
        // *     example 2: strstr('Kevin van Zonneveld', 'van', true);
        // *     returns 2: 'Kevin ''
        // *     example 3: strstr('name@example.com', '@');
        // *     returns 3: '@example.com'
        // *     example 4: strstr('name@example.com', '@', true);
        // *     returns 4: 'name'
        var haystack = (this + ""),
            pos = haystack.indexOf(needle);
        if (pos == -1) {
            return false;
        } else {
            if (bool) {
                return haystack.substr(0, pos);
            } else
                return haystack.slice(pos);
        }
    };

    if (!String.prototype.trim) {
        String.prototype.trim = function trim() {
            return this.replace(/^\s+|\s+$/g, "");
        };
    }

    Number.prototype.toFormattedNumber =
    String.prototype.toFormattedNumber = function toFormattedNumber() {
        var x, x1, x2, str = this + "", rgx = /(\d+)(\d{3})/;
        if (str.isFormattedNumber()) { return str; }
        if (str === "") { return str; }
        x = str.split(".");
        x1 = x[0];
        x2 = x.length > 1 ? "." + x[1] : "";
        while (rgx.test(x1)) { x1 = x1.replace(rgx, "$1" + "," + "$2"); }
        return x1 + x2;
    };

    String.prototype.isFormattedNumber = function isFormattedNumber() {
        return (this.match(/^[\$|,]/));
    };

    String.prototype.toNumber = function toNumber() {
        var num = +(this.replace(/[\$|,]/g, ""));
        return (isNaN(num) ? 0 : num);
    };

    function _register(namespace) {
        var splits = namespace.split("."),
            ns = window;
        for (var i = 0, j = splits.length; i < j; i++) {
            ns[splits[i]] = ns[splits[i]] || {};
            ns = ns[splits[i]];
        }

        return ns;
    }

    function _exists(namespace) {
        var splits = namespace.split("."),
            ns = window;
        for (var i = 0, j = splits.length; i < j; i++) {
            if (typeof ns[splits[i]] === "undefined") {
                return false;
            }
            ns = ns[splits[i]];
        }

        return true;
    }

    var _instantiate = (function() {
        function F(func, args) {
            args = Array.prototype.slice.call(args);
            args.shift();
            return func.apply(this, args);
        }

        return function _instantiate(func) {
            F.prototype = func.prototype;
            return new F(func, arguments);
        };
    }());

    function _require() {
        var args = Array.prototype.slice.call(arguments);
        if (typeof window.head == "undefined") {
            throw new Error(
                ("Failed to require js file(s) [{0}]. Cannot find loader [head.js].").format(
                    args.join(", ")
                )
            );
        }
        try {
            return head.js(args);
        } catch (e) {
            throw new Error(
                ("Failed to require js file(s) [{0}]. Caught [{1}] from [head.js] with message: {2}").format(
                    args.join(", "), e.name, e.message
                )
            );
        }
    }

    function _timingGet(start, end) {
        return end - start;
    }

    function _timingNow() {
        return (typeof Date.now != "undefined") ? Date.now() : new Date().getTime();
    }

    function _timingApp() {
        if (!Nebula.Timing || !Nebula.Timing.appStartTime) {
            return 0;
        }
        return _timingGet(Nebula.Timing.appStartTime, _timingNow());
    }

    function _timingJs() {
        if (!Nebula.Timing || !Nebula.Timing.appStartTime) {
            return 0;
        }
        return _timingGet(Nebula.Timing.jsStartTime, _timingNow());
    }

    return {
        instantiate: _instantiate,
        register: _register,
        require: _require,
        exists: _exists,
        timing: {
            // timing properties
            jsStartTime: _timingNow(),
            appStartTime: _timingNow(),
            // timing methods
            get: _timingGet,
            now: _timingNow,
            app: _timingApp,
            js : _timingJs
        }
    };
}(window));

// aliases (or shortcuts) for register and exists methods in Nebula.Namespace
Nebula.Instance = Nebula.Namespace.instantiate;
Nebula.Register = Nebula.Package = Nebula.Namespace.register;
Nebula.Require  = Nebula.Namespace.require;
Nebula.Exists   = Nebula.Namespace.exists;
Nebula.Timing   = Nebula.Namespace.timing;
