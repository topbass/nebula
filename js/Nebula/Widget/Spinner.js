/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Spinner = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            type: "default",
            driver: "js",
            action: "play",
            options: {
                "default": {
                    lines: 13,
                    length: 13,
                    width: 4,
                    radius: 4,
                    rotate: 0,
                    color: "#000",
                    speed: 1.2,
                    trail: 54,
                    shadow: false,
                    hwaccel: false,
                    className: "spinner",
                    zIndex: 9999,
                    top: "auto",
                    left: "auto"
                },
                small: {length: 4, width: 2, radius: 6, color: "#000"},
                large: {length: 13, width: 4, radius: 16, color: "#000"},
                global: {length: 20, width: 4, radius: 16, color: "#fff"},
                smallWhite: {length: 4, width: 2, radius: 6, color: "#fff"},
                largeWhite: {length: 13, width: 4, radius: 16, color: "#fff"}
            }
        };
        this.target  = $(target);
        this.configs = $.extend(true, {}, this.defaults, configs || {});
        this.spinner = null;
        this.gifs    = {
            large: "/img/spinner-64.gif",
            small: "/img/spinner-24.gif",
            processing: "/img/spinner-processing.gif"
        };
        this.img     = $(document.createElement("img"));
        this.widget  = null;

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
            if (!this.target.length) {
                return this;
            }
            if (this.configs.driver == "js" &&
                !(this.configs.type in this.configs.options)
            ) {
                throw new Error(("Spinner type [{0}] does not exist in configured options")
                    .format(this.type));
            }
            if (this.configs.action == "play") {
                this.spin();
            }
            return this;
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            if (this.spinner !== null) {
                this.stop();
            }
            this.target.removeData(["signature", "widget"]);

            this.target = null;
            this.defaults = null;
            this.configs = null;
            this.spinner = null;
            this.gifs = null;
            this.img = null;
            this.widget = null;

            delete this.target;
            delete this.defaults;
            delete this.configs;
            delete this.spinner;
            delete this.gifs;
            delete this.img;
            delete this.widget;
        },

        // ***** PUBLIC METHODS *****
        getSpinner: function() {
            return this.spinner;
        },

        spin: function() {
            if (this.configs.driver == "js") {
                this.spinWithJs();
            } else {
                this.spinWithGif();
            }
            return this;
        },

        spinWithJs: function() {
            this.spinner = this.target.empty().spin($.extend(
                {},
                this.configs.options["default"],
                this.configs.options[this.configs.type]
            )).data().spinner;
        },

        spinWithGif: function() {
            this.spinner = this.target
                .html(this.img.clone().prop("src", this.gifs[this.configs.type] || "small"))
                .selector;
        },

        play: function() {
            if (this.spinner === null) {
                this.spin();
            }
            if (this.configs.driver == "js") {
                this.spinner.spin(this.target.get(0));
            } else {
                this.target.show();
            }
            return this;
        },

        stop: function() {
            if (this.spinner === null) {
                return this;
            }
            if (this.configs.driver == "js") {
                this.spinner.stop();
            } else {
                this.target.hide();
            }
            return this;
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
