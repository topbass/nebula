/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Tooltip = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
        };
        this.target   = $(target);
        this.configs  = $.extend({}, this.defaults, configs);
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
            this.target.tooltip(this.configs);
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.tooltip("destroy");

            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.widget = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.widget;
        },

        // ***** PUBLIC METHODS *****
        method: function() {
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
