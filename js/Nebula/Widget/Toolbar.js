/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Toolbar = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            toggle: false,
            mini: false
        };
        this.target   = $(target);
        this.configs  = $.extend(true, {}, this.defaults, configs || {});
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
            var t = this;

            t.configs.mini = t.target.is(".mini");

            t.target.find("> li").each(function() {
                var li = $(this);
                t.buildComboMenu(li);
                t.buildRegularMenu(li);
                t.buildRegularButton(li);
            });
            t.attachIconsToButtons();
            t.attachMenuDividers();
            t.adjustToolbarHeight();

            t.target.css("visibility", "visible")
                .after($(document.createElement("div")).addClass("clearfix"))
                .find("> li:last-child").css("margin-right", "5px");

            if (t.configs.toggle) {
                t.highlightActiveButtons();
                t.bindToggleButtons();
            }

            return this;
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.find("> li a").off();

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
        isComboMenu    : function(li) { return li.filter(":has(button):has(ul):has(a)").length;             },
        isRegularMenu  : function(li) { return li.filter(":not(:has(button)):has(ul):has(a)").length;       },
        isRegularButton: function(li) { return li.filter(":not(:has(button)):not(:has(ul)):has(a)").length; },

        buildComboMenu: function(li) {
            if (!this.isComboMenu(li)) {
                return;
            }

            li.find("> a")
                .filter(function() {
                    return $(this).html("<span>" + $(this).text() + "</span>");
                })
                .removeClass()
                .addClass("dropdown-combo btn");

            li.find("> button")
                .removeClass()
                .addClass("add-on btn dropdown-toggle")
                .attr("data-toggle", "dropdown")
                .html("<b class=\"caret-down-gray\"></b>")
                .dropdown();

            li.find("> ul")
                .removeClass()
                .addClass("dropdown-menu");
        },

        buildRegularMenu: function(li) {
            if (!this.isRegularMenu(li)) {
                return;
            }

            li.find("> a")
                .filter(function() {
                    return $(this).html("<span>" + $(this).text() + "</span>");
                })
                .removeClass()
                .addClass("btn dropdown-toggle")
                .attr("data-toggle", "dropdown")
                .prepend("<b class=\"caret-down-gray\"></b>")
                .dropdown();

            li.find("> ul")
                .removeClass()
                .addClass("dropdown-menu");
        },

        buildRegularButton: function(li) {
            if (!this.isRegularButton(li)) {
                return;
            }
            li.find("> a")
                .filter(function() {
                    return $(this).html("<span>" + $(this).text() + "</span>");
                })
                .removeClass()
                .addClass("btn");
        },

        attachIconsToButtons: function(li) {
            var t = this;

            (li || t.target.find("li")).find("a").each(function() {
                var a = $(this);

                if (a.data("icon") !== undefined) {
                    if (t.configs.mini) {
                        a.filter(".btn")
                            .prepend('<b class="' + a.data("icon") + '-icon-16"></b>')
                            .find("b:eq(0)").width(16).height(16).addClass("button-icon");
                    } else {
                        a.filter(".btn")
                            .prepend('<b class="' + a.data("icon") + '-icon-24"></b>')
                            .find("b:eq(0)").width(24).height(24).addClass("button-icon");
                    }

                    a.filter(":not(.btn)")
                        .prepend('<b class="' + a.data("icon") + '-icon-16"></b>')
                        .find("b:eq(0)").width(16).height(16).addClass("menu-icon");
                } else {
                    if (t.configs.mini) {
                        a.filter(".btn").prepend('<b class="placeholder-16">');
                    } else {
                        a.filter(".btn").prepend('<b class="placeholder-24">');
                    }

                    a.filter(":not(.btn)").prepend('<b class="placeholder-16">');
                }
            });
        },

        attachMenuDividers: function(li) {
            (li || this.target.find("li"))
                .filter("[data-divider]")
                .removeClass()
                .addClass("divider")
                .removeAttr("data-divider")
                .append($(document.createElement("a")).addClass("placeholder"));
        },

        adjustToolbarHeight: function(li) {
            if (typeof this.configs.height == "undefined") {
                return;
            }

            var height = parseInt(this.configs.height, 10) + "px";

            (li || this.target.find("> li"))
                .find("a, button")
                .css({height: height, "line-height": height});
        },

        highlightActiveButtons: function(li) {
            (li || this.target.find("> li"))
                .find("> a[data-active]")
                .removeClass("active").addClass("active")
                .removeAttr("data-active");
        },

        bindToggleButtons: function(li) {
            var t = this;

            (li || t.target.find("> li"))
                .find("a:not([data-toggle=dropdown])")
                .on("click.toolbar.toggle", function() {
                    t.target.find("> li a").removeClass("active");
                    $(this).addClass("active");
                });
        },

        findElementByLocation: function(location) {
            var target;

            switch ((typeof location).toLowerCase()) {
                // 2 dimensional indexes for toolbar "[item, subitem]"
                // Both number and string indexes are accepted
                case "object":
                    // if location is an array "[ ... ]" then find the sub-level location
                    if ($.isArray(location)) {
                        if (location.length === 0) {
                            return {};
                        }

                        if ((typeof location[0]).toLowerCase() == "number") {
                            target = this.target
                                .find("> li:eq(" + location[0] + ") ul li:eq(" + location[1] + ")")
                                .find("a");
                        } else {
                            target = this.target
                                .find("> li a.btn[data-name=" + location[0] + "]")
                                .siblings("ul")
                                .find("li a[data-name=" + location[1] + "]");
                        }
                    }
                    // otherwise if it's a jquery object then return the object itself
                    else {
                        if ("length" in location && location.length > 0) {
                            target = location;
                        } else return {};
                    }
                    break;
                // Single number index for top level toolbar items, e.g. 0, 1 or 2
                case "number":
                    target = this.target
                        .find("> li:eq(" + location + ")")
                        .find("> a.btn, > button.btn, > a.placeholder");
                    break;
                // Single string index for top level toolbar items, e.g. "add", "share" or "eye"
                // String index is the attribute value of "data-name"
                case "string":
                    target = this.target
                        .find("> li a.btn[data-name=" + location + "]")
                        .parent("li")
                        .find("> a.btn, > button.btn, > a.placeholder");
                    break;
                default: break;
            }

            return target;
        },

        makeNewItem: function(specs, context) {
            var t        = this,
                a        = null,
                text     = specs.text     || "",
                name     = specs.name     || "",
                href     = specs.href     || "#_",
                data     = specs.data     || {},
                icon     = specs.icon     || "",
                click    = specs.click    || function() { return false; },
                set      = specs.set      || "",
                children = specs.children || {},
                divider  = specs.divider  || 0,
                style    = specs.style    || "",
                active   = specs.active   || false,
                disabled = specs.disabled || false,
                tooltip  = specs.tooltip  || {text: "", placement: "top"},
                newItem  = $(document.createElement("li")).addClass(style);

            // if the current item is a menu divider then return the divider
            // so the item will not be rendered as a menu, button or combo
            if (divider) {
                return newItem.attr("data-divider", "");
            }

            // otherwise, build and render the menu, button or combo item
            a = $(document.createElement("a"))
                .attr({href: href, "data-icon": icon, "data-name": name})
                .text(text)
                .data(data)
                .appendTo(newItem);

            if (active) {
                a.attr("data-active", "1");
            }

            if (set == "combo") {
                $(document.createElement("button")).appendTo(newItem);
            }

            if (set != "button" && !($.isEmptyObject(children))) {
                $(document.createElement("ul"))
                    .append($.map(children, function(specs) {
                        return t.makeNewSubitem(specs, context)[0];
                    }))
                    .appendTo(newItem);
            }

            // disable the disabled menu item
            if (disabled) {
                t.disableOne(a);
            }

            a.on("click.toolbar.availability", function(e) {
                if ($(e.delegateTarget).hasClass("disabled")) {
                    e.stopImmediatePropagation();
                }
                t.target.triggerHandler("Nebula::Widget::Toolbar::Button::Click");
                return false;
            }).on("click.toolbar.action", $.proxy(click, context || t));
            // build menu item
            t.buildComboMenu(newItem);
            t.buildRegularMenu(newItem);
            t.buildRegularButton(newItem);
            // Final adjustment for toolbar height
            t.adjustToolbarHeight(newItem);

            if (typeof tooltip == "object" && tooltip.text) {
                W.Factory.tooltip(a.prop("title", tooltip.text), {
                    placement: tooltip.placement
                });
            } else if (typeof tooltip == "string" && tooltip) {
                W.Factory.tooltip(a.prop("title", tooltip), {placement: "top"});
            }

            return newItem;
        },

        makeNewSubitem: function(specs, context) {
            var t        = this,
                a        = null,
                text     = specs.text     || "",
                name     = specs.name     || "",
                href     = specs.href     || "#_",
                data     = specs.data     || {},
                icon     = specs.icon     || "",
                click    = specs.click    || function() { return false; },
                divider  = specs.divider  || false,
                style    = specs.style    || "",
                disabled = specs.disabled || false,
                newItem  = $(document.createElement("li")).addClass(style);

            if (divider) {
                newItem.attr("data-divider", "");
            } else {
                a = $(document.createElement("a"))
                    .attr({href: href, "data-icon": icon, "data-name": name})
                    .text(text)
                    .data(data)
                    .appendTo(newItem);

                if (disabled) {
                    t.disableOne(a);
                }

                a.on("click.toolbar.availability", function(e) {
                    if ($(e.delegateTarget).hasClass("disabled")) {
                        e.stopImmediatePropagation();
                    }
                    t.target.triggerHandler("Nebula::Widget::Toolbar::Button::Click");
                    return false;
                }).on("click.toolbar.action", $.proxy(click, context || t));
            }

            return newItem;
        },

        enableOne: function(location) {
            this.findElementByLocation(location).removeClass("disabled");
            return this;
        },

        disableOne: function(location) {
            this.findElementByLocation(location).addClass("disabled");
            return this;
        },

        enableAll: function() {
            this.target
                .find("a.btn.disabled, button.btn.disabled, ul li a.disabled")
                .removeClass("disabled")
                .off("click.toolbar.availability");

            return this;
        },

        disableAll: function() {
            this.target
                .find("a.btn, button.btn, ul li a")
                .addClass("disabled")
                .on("click.toolbar.availability", function() { return false; });

            return this;
        },

        build: function(specs, context) {
            var t = this;

            $.each(specs, function(key, val) {
                var newItem = t.makeNewItem(val, context);

                // Remove empty data-icon attributes
                newItem.find("a[data-icon='']").removeAttr("data-icon");

                // Add new toolbar item to the DOM
                t.target.append(newItem);

                // Attach icon and menu divider
                t.attachIconsToButtons(newItem);
                t.attachMenuDividers(newItem);

                if (t.configs.toggle) {
                    t.highlightActiveButtons(newItem);
                    t.bindToggleButtons(newItem);
                }
            });

            return t;
        },

        insert: function(location, specs) {
            var t = this,
                isSubLocation = ("object" == (typeof location).toLowerCase()),
                refObject = t.findElementByLocation(location).parent("li");

            // If we cannot find any reference object then stop and return
            if (refObject.length === 0) {
                return t;
            }

            // Otherwise, keep going
            $.each(specs, function(key, val) {
                var newItem = (isSubLocation && !("children" in val)) ?
                        t.makeNewSubitem(val) : t.makeNewItem(val);

                // Remove empty data-icon attributes
                newItem.find("a[data-icon='']").removeAttr("data-icon");

                // Add new toolbar item to the DOM
                newItem.insertBefore(refObject);

                // Attach icon and menu divider
                t.attachIconsToButtons(newItem);
                t.attachMenuDividers(newItem);

                if (t.configs.toggle) {
                    t.highlightActiveButtons(newItem);
                    t.bindToggleButtons(newItem);
                }
            });

            return t;
        },

        remove: function(location) {
            this.findElementByLocation(location).parent("li").remove();
            return this;
        },

        show: function() {
            this.target.show();
            return this;
        },

        hide: function() {
            this.target.hide();
            return this;
        },

        visible: function() {
            this.target.css("visibility", "visible");
            return this;
        },

        invisible: function() {
            this.target.css("visibility", "hidden");
            return this;
        },

        bindActions: function(actions, context) {
            var t = this;

            $.each(actions || {}, function(ref, action) {
                t.target.find("a.btn[data-name=" + ref + "]")
                    .on("click.toolbar.action", $.proxy(action, context || t));
            });

            return t;
        },

        unbindActions: function() {
            this.target.find("a.btn").off("click.toolbar.action");
            return this;
        },

        stretch: function(width) {
            width = width || "100%";
            this.target.css("width", width);
            return this;
        },

        click: function(location, params) {
            this.findElementByLocation(location).trigger("click.toolbar.action", params || []);
            return this;
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
