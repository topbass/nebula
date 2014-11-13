/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Popover = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            template: '<div class="popover${style}"><div class="arrow"></div>' +
                '<div class="popover-inner"><div class="popover-content"><p>' +
                '</p></div></div></div>',
            trigger: "hover",
            html: true
        };
        this.target   = $(target);
        this.configs  = $.extend({}, this.defaults, configs);
        this.widget   = null;
        this.style    = this.parseStyleName();

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
            if (this.configs.style) {
                this.style = this.configs.style;
            } else {
                // delete this.configs.placement;
            }
            this.configs.template = this.configs.template
                .replace("${style}", " " + this.style);
            this.load();
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.unload();

            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.widget = null;
            this.style = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.widget;
            delete this.style;
        },

        // ***** PUBLIC METHODS *****
        load: function() {
            this.target.popover(this.configs);
        },

        unload: function() {
            this.target.popover("destroy");
        },

        parseStyleName: function() {
            var style;
            if (this.target.hasClass("has-popover-error"))        { style = "error";   }
            else if (this.target.hasClass("has-popover-warning")) { style = "warning"; }
            else if (this.target.hasClass("has-popover-info"))    { style = "info";    }
            else if (this.target.hasClass("has-popover-success")) { style = "success"; }
            else                                                  { style = "";        }
            return style;
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
