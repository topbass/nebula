/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Expander = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            lines: 2,
            expandText: "Read more",
            collapseText: "Read less"
        };
        this.target = $(target);
        this.configs = $.extend({}, this.defaults, configs);
        this.widget = null;
        this.html = this.target.html();
        this.moreLink = null;
        this.lessLink = null;
        this.collapsedHeight = null;

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
            // ** Pub:Sub **
            $.subscribe("Nebula::Build::SmallParts::Viewport::Resize", $.proxy(this.subscribeViewportResize, this));

            this.buildMoreAndLessLinks();
            this.buildExpandableContent();
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.widget = null;
            this.html = null;
            this.moreLink = null;
            this.lessLink = null;
            this.collapsedHeight = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.widget;
            delete this.html;
            delete this.moreLink;
            delete this.lessLink;
            delete this.collapsedHeight;
        },

        // ***** PUBLIC METHODS *****
        // ** Pub:Sub ** Nebula::Build::SmallParts::Viewport::Resize
        subscribeViewportResize: function() {
            this.collapsedHeight = null;
            this.target.find(".expandable-content").height(this.calcCollapsedHeight());
        },

        buildMoreAndLessLinks: function() {
            this.moreLink = $(document.createElement("a"))
                .on("click", $.proxy(this.readMore, this))
                .addClass("readmore")
                .text(this.configs.expandText)
                .append($(document.createElement("b")));
            this.lessLink = $(document.createElement("a"))
                .on("click", $.proxy(this.readLess, this))
                .addClass("readless")
                .text(this.configs.collapseText)
                .append($(document.createElement("b")));
        },

        buildExpandableContent: function() {
            var t = this;

            if (!t.isExpanderNeeded()) {
                return false;
            }

            t.target.html("").append(function() {
                return $(document.createElement("div"))
                    .addClass("expandable-content")
                    .html(t.html);
            }).append(function() {
                return $(document.createElement("div"))
                    .addClass("expandable-controls")
                    .append(function() {
                        return (!t.target.find("a.readmore").length) ?
                            t.moreLink : null;
                    });
            }).css("height", "auto")
                .find(".expandable-content").height(t.calcCollapsedHeight());

            return true;
        },

        isExpanderNeeded: function() {
            var lines = this.configs.lines,
                lineHeight = this.lineHeight(this.target);

            if (lines <= 0) {
                return false;
            }
            if (lineHeight === 0 || isNaN(lineHeight)) {
                return false;
            }

            this.target.css("height", "auto");

            return ((this.target.height() - (lines * lineHeight)) > lineHeight);
        },

        // Core function to calcuate collapsed content height
        calcCollapsedHeight: function() {
            var t = this,
                totalLines = t.configs.lines;

            // If collapsed height has not yet been calculated then go ahead and find out
            // what the height for collapsed content
            if (t.collapsedHeight === null) {
                // Initially set collapsed height to zero
                t.collapsedHeight = 0;
                // Loop through all the child elements in .expandable-content container
                t.target.find(".expandable-content > *").each(function() {
                    var tt = $(this), elementLines;
                    // If there is no more remaining total lines then break and return
                    if (totalLines <= 0) { return; }
                    // Otherwise keep looping the elements
                    switch (tt.prop("tagName").toLowerCase()) {
                        // Handle p, div, treat them as multiple lines elements
                        case "p": case "div":
                            // Find out how many lines the current element takes
                            elementLines = tt.height() / parseInt(t.lineHeight(tt), 10);
                            // If the remaining lines is still greater than the lines in the
                            // current element then substract the lines from total remaining
                            // lines and add margin / padding to the height
                            if (totalLines > elementLines) {
                                t.collapsedHeight += elementLines *
                                    parseInt(t.lineHeight(tt), 10) +
                                    parseInt(tt.css("margin-top"), 10) +
                                    parseInt(tt.css("margin-bottom"), 10) +
                                    parseInt(tt.css("padding-top"), 10) +
                                    parseInt(tt.css("padding-bottom"), 10);
                                totalLines -= elementLines;
                            }
                            // Otherwise
                            else {
                                t.collapsedHeight += totalLines *
                                    parseInt(t.lineHeight(tt), 10);
                                totalLines = 0;
                            }
                            break;
                        // Handle h1 .. h6 and img, treat them as single line elements
                        case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": case "img":
                            t.collapsedHeight += parseInt(t.lineHeight(tt), 10) +
                                parseInt(tt.css("margin-top"), 10) +
                                parseInt(tt.css("margin-bottom"), 10) +
                                parseInt(tt.css("padding-top"), 10) +
                                parseInt(tt.css("padding-bottom"), 10);
                            totalLines -= 1;
                            break;
                        default:
                            break;
                    }
                });
            }

            return t.collapsedHeight;
        },

        lineHeight: function(target) {
            var lineHeight = target.css("line-height");
            return (/px$/.test(lineHeight)) ?
                parseInt(lineHeight, 10) :
                parseFloat(target.css("font-size")) * parseFloat(lineHeight);
        },

        readMore: function(event) {
            var content = this.target.find(".expandable-content"),
                controls = this.target.find(".expandable-controls");
            if (!controls.find("a.readless").length) {
                this.lessLink.appendTo(controls);
            }
            content.css("height", "auto");
            this.moreLink.hide();
            this.lessLink.show();

            return false;
        },

        readLess: function(event) {
            this.target.find(".expandable-content")
                .height(this.calcCollapsedHeight());
            this.moreLink.show();
            this.lessLink.hide();

            return false;
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
