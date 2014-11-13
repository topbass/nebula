/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Core");
Nebula.Register("Nebula.Global");

Nebula.Core.Bootstrap = (function(window, $, N, C, G, undefined) {
    "use strict";

    function _init() {
        // turn off jQuery migration console messages for deprecating
        // methods and functions
        jQuery.migrateMute = (G.environment == "production");
        jQuery.migrateTrace = (G.environment == "development");
        // initialize Nebula widget
        if (N.Widget && N.Widget && N.Widget.Factory) {
            N.Widget.Factory.init();
        }
        // initialize Nebula auto-init elements and widget
        if (N.Build && N.Build.Run) {
            N.Build.Run.init();
        }
        // initialize view model class
        if (G && G["package"] && G.subpackage && (G.module in window)) {
            _execute(_getInitializerName(), window);
        }
        // Hide page loading indicator and white overlay
        $(".f-overlay").hide();
    }

    function _destruct() {
        // destruct Nebula widget
        if (N.Widget && N.Widget.Factory) {
            N.Widget.Factory.destruct();
        }
        // destruct Nebula auto-init elements and widget
        if (N.Build && N.Build.Run) {
            N.Build.Run.destruct();
        }
        // destruct view model class
        if (G && G["package"] && G.subpackage && (G.module in window)) {
            _execute(_getDestructorName(), window);
        }
    }

    function _getInitializerName() {
        return G["package"] + "." + G.subpackage + ".init";
    }

    function _getDestructorName() {
        return G["package"] + "." + G.subpackage + ".destruct";
    }

    function _execute(functionName, context /*, args */) {
        var args = Array.prototype.slice.call(arguments).splice(2),
            namespaces = functionName.split("."),
            func = namespaces.pop();
        for (var i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }
        try {
            return context[func].apply(this, args);
        } catch (error) {
            if (G && G.environment == "development") {
                console.log(error);
                if (context === undefined) {
                    console.log(functionName + " is undefined.");
                }
            }
            return false;
        }
    }

    return {
        init: _init,
        destruct: _destruct
    };

}(window, jQuery, Nebula, Nebula.Core, Nebula.Global));
