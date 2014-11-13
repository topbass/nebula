/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Util");

Nebula.Util.MessageWindow = (function($, Nebula, Util) {
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

    // *** PUBLIC -STATIC- METHODS ***

    self.prototype = $.extend(self.prototype, {
        // *** CONSTRUCTOR ***
        initialize: function() {
        },

        // *** DESTRUCTOR ***
        destruct: function() {
        },

        // *** PUBLIC METHODS ***
        method: function() {
        }
    });

    return self;
}(jQuery, Nebula, Nebula.Util));
