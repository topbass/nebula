/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Checklist = (function(window, $, N, W, undefined) {
    var parent = N.Core.Abstract;

    var self = function(target) {
        // ***** PUBLIC PROPERTIES *****
        this.target = $(target);
        this.widget = null;

        // ***** CALL ***** parent constructor
        parent.call(this, this.target, this.widget, this.configs);

        // ***** CALL ***** local constructor
        this.initialize();
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ PROPERTIES *****

    // ***** PUBLIC _STATIC_ METHODS *****

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Widget.Checklist or its
    // child classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
        },

        // ***** PUBLIC METHODS *****
        method: function() {
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
