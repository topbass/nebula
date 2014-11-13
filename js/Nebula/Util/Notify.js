/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Util");

Nebula.Util.Notify = (function($, Nebula, Util) {
    "use strict";

    var parent = Nebula.Core.Abstract;

    var self = function() {
        // *** PUBLIC PROPERTIES ***

        // *** CALL *** parent constructor
        parent.call(this, this.target);

        // *** CALL *** local constructor
        this.initialize(level, message, throwable);
    };

    // *** EXTEND *** parent class
    self.inherit(parent);

    // *** PUBLIC -STATIC- PROPERTIES ***
    self.options = {
        theme: "nebulaTheme",
        layout: "topRight",
        template: '<div class="noty_message"><i class="noty_icon"></i><span class="noty_text"></span><div class="noty_close"></div></div>',
        maxVisible: 8
    };

    // *** PUBLIC -STATIC- METHODS ***
    self.info    = function() { return self.notify("information", arguments); };
    self.warn    = function() { return self.notify("warning", arguments); };
    self.error   = function() { return self.notify("error", arguments); };
    self.alert   = function() { return self.notify("alert", arguments); };
    self.notify  = function() { return self.notify("notification", arguments); };
    self.success = function() { return self.notify("success", arguments); };

    self.notify  = function(level, args) {
        if (!args.length) {
            return null;
        }

        args = Array.prototype.slice.call(args);

        if (typeof args[0] == "object") {
            return noty($.extend(true, {}, self.options, args[0], {type: level}));
        } else
            return noty($.extend(true, {}, self.options, {
                type: level,
                text: args[0],
                timeout: args[1] || false
            }));
    };

    self.prototype = $.extend(self.prototype, {
        // *** CONSTRUCTOR ***
        initialize: function() {},

        // *** DESTRUCTOR ***
        destruct: function() {},

        // *** PUBLIC METHODS ***
        method: function() {}
    });

    return self;
}(jQuery, Nebula, Nebula.Util));
