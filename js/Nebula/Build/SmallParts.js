/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");

Nebula.Build.SmallParts = (function(window, $, N, B, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(parts, context) {
        // ***** PUBLIC PROPERTIES *****
        this.parts = parts || [];
        this.navHeight = 0;

        // ***** CALL ***** parent constructor
        parent.call(this);

        // ***** CALL ***** local constructor
        this.initialize(context);
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ METHODS *****
    self.navigationVisibilityControlShow =
    function navigationVisibilityControlShow() {
        return $(".collapsible-trigger.expand").triggerHandler("click");
    };

    self.navigationVisibilityControlHide =
    function navigationVisibilityControlHide() {
        return $(".collapsible-trigger.collapse").triggerHandler("click");
    };

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Build.SmallParts or its
    // child classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function(context) {
            // build small parts (widgets)
            $.each(this.parts, $.proxy(function(index, part) {
                this.subscribeBuildWidget(
                    part.builder,
                    part.selector,
                    part.configs,
                    part.extras,
                    context
                );
            }, this));

            // build other custom small parts
            this.useExternalRelAsBlankTarget(context);
            this.defaultValueBackwardCompatible(context);
            this.AddTitleTextToControlLabel(context);

            // when the page is initially loaded, context is undefined, since there is
            // no context variable passed into SmallParts class from Run class
            //
            // context is given when partial template is loaded (modal open), and
            // SmallParts is invoked again in Run class to build widgets
            if (!context) {
                // create small part (widget) building observer
                $.subscribe("Nebula::Build::SmallParts::Widget", $.proxy(this.subscribeBuildWidget, this));
                // hock for toggling navigation bar on the left side of the page
                $.subscribe("Nebula::Build::SmallParts::NavToggle::Init", $.proxy(this.navigationVisibilityControl, this));
                $.subscribe("Nebula::Build::SmallParts::NavToggle::Show", $.proxy(this.navigationVisibilityControlShow, this));
                $.subscribe("Nebula::Build::SmallParts::NavToggle::Hide", $.proxy(this.navigationVisibilityControlHide, this));
                // hock for scrolling to any object on the page (w/ or w/o animation)
                $.subscribe("Nebula::Build::SmallParts::ScrollTo", $.proxy(this.subscribeScrollTo, this));

                // build other custom small parts
                this.navigationVisibilityControl();
                this.fontSizeControl();

                // listen to window resize and publish viewport resize if necessary
                $(window).on("resize", function() {
                    $.publish("Nebula::Build::SmallParts::Viewport::Resize");
                });
            }

            // listen to tab click in any modals, and trigger modal resize (relocation)
            // if modal is overflowing the window viewport
            $($(context).closest(".modal").parent()[0] || document)
                .find(".modal a[data-toggle='tab']")
                .on("shown", function (evt) {
                    var win = $(window),
                        mdl = $(evt.target).closest(".modal");
                    if ((mdl.height() + mdl.position().top + 30) >= win.height()) {
                        mdl.triggerHandler("Nebula::EnhancedModal::Resize");
                    }
                });
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            $("#MessageWindow, #ShortActionWindow, #MediumActionWindow").off();
            $("div.f-nav-visibility-control").off();
            $("div.f-nav-visibility-control > button").off();
            $(window).off("resize");
            $(".modal a[data-toggle='tab']").off("shown");
        },

        // ***** PUBLIC METHODS *****
        subscribeBuildWidget: function(builder, selector, configs, extras, context) {
            selector = $(selector, context || document);

            if (selector.length > 0) {
                configs = (typeof configs != "undefined" && configs !== null) ?
                    configs : $.proxy(this.readDataConfigs, this);
                extras = (typeof extras != "undefined" && extras !== null) ?
                    extras : $.proxy(this.readDataExtras, this);

                N.Widget.Factory.build(builder, selector, configs, extras);
            }
        },

        //
        // data-config-[item] = "[value]"
        //
        // $(".spinner-64")      - data-config-type="small"
        // $(".spinner-24")      - data-config-type="large"
        // $(".inplace-spinner") - data-config-type="global"
        // $(".expandable")      - data-config-lines="3"
        //
        readDataConfigs: function(target) {
            return this.readData.call(this, target, "config");
        },

        //
        // data-extra-[item]  = "[value]"
        //
        readDataExtras: function(target) {
            return this.readData.call(this, target, "extra");
        },

        readData: function(target, prefix) {
            return N.Widget.Factory.readData.apply(this, arguments);
        },

        useExternalRelAsBlankTarget: function(context) {
            // add open new tab/page target to all the external links
            $("a[rel=external]", context || document).prop("target", "_blank");
        },

        defaultValueBackwardCompatible: function(context) {
            $("select[data-default-value]", context || document).val(function() {
                return $(this).data("defaultValue");
            });
        },

        AddTitleTextToControlLabel: function(context) {
            $("label.control-label", context || document).prop("title", function() {
                return $(this).text();
            });
        },

        navigationVisibilityControl: function() {
            var t = this,
                d = Q.defer();

            $(".collapsible-trigger.collapse")
                .on("click", function() {
                    $("body").addClass("nav-collapsed");
                    $(this).hide();
                    $(".collapsible-trigger.expand").show(function() {
                        if ($("html").is(".ie9, .lt-ie9")) {
                            setTimeout(function() {
                                $.publish("Nebula::Build::SmallParts::Viewport::Resize");
                                d.notify("expand");
                            }, 300);
                        }
                    });
                    return d.promise;
                });
            $(".collapsible-trigger.expand")
                .on("click", function() {
                    $("body").removeClass("nav-collapsed");
                    $(this).hide();
                    $(".collapsible-trigger.collapse").show(function() {
                        if ($("html").is(".ie9, .lt-ie9")) {
                            setTimeout(function() {
                                $.publish("Nebula::Build::SmallParts::Viewport::Resize");
                                d.notify("collapse");
                            }, 300);
                        }
                    });
                    return d.promise;
                });

            // listen to css transition end event, thanks to:
            // http://stackoverflow.com/questions/2794148/css3-transition-events
            // once again stackoverflow rocks!!!!!!!!
            $(".f-content")
                .on("transitionend oTransitionEnd webkitTransitionEnd", function(evt) {
                    if ($(evt.target).is(".f-content")) {
                        setTimeout(function() {
                            $.publish("Nebula::Build::SmallParts::Viewport::Resize");
                            d.notify(
                                $(".collapsible-trigger.expand")
                                    .is(":visible") ? "collapse" : "expand"
                            );
                        }, 300);
                    }
                });

            N.Build.Router
                .on("/leftNavigation/:status", function(status) {
                    t.navigationVisibilityControlRoutes(t, status);
                });

            $.subscribe("Nebula::Build::Router::StateChange", function(router, params) {
                if (!params.leftNavigation) { return; }
                t.navigationVisibilityControlRoutes(t, params.leftNavigation);
            });
        },

        navigationVisibilityControlShow: self.navigationVisibilityControlShow,
        navigationVisibilityControlHide: self.navigationVisibilityControlHide,

        navigationVisibilityControlRoutes: function(parts, status) {
            switch (status) {
                case "show": parts.navigationVisibilityControlShow(); break;
                case "hide": parts.navigationVisibilityControlHide(); break;
            }
        },

        fontSizeControl: function() {
            var ctrl = $(".eS-fontsize-control"),
                scale = ctrl.find("span.scale"),
                increase = ctrl.find("button.zoom-in"),
                decrease = ctrl.find("button.zoom-out"),
                sizes = [
                    {size: "xsmall", label: "Extra Small"},
                    {size: "small", label: "Small"},
                    {size: "medium", label: "Normal Size"},
                    {size: "large", label: "Large"},
                    {size: "xlarge", label: "Extra Large"}
                ];

            if (!ctrl.length) {
                return;
            }

            ctrl.data("currentFontSize", ctrl.data("currentFontSize") || "2:medium");

            increase.off("click.fontsize").on("click.fontsize", function() {
                var pos = +ctrl.data("currentFontSize").split(":")[0] + 1;
                if (pos >= sizes.length) {
                    return false;
                }
                scale.text(sizes[pos].label);
                ctrl.data("currentFontSize", ("{0}:{1}").format(pos, sizes[pos].size));
                // ** Pub:Sub **
                $.publish("Nebula::Build::SmallParts::FontSize::ZoomIn", [sizes[pos].size]);
                return false;
            });

            decrease.off("click.fontsize").on("click.fontsize", function() {
                var pos = +ctrl.data("currentFontSize").split(":")[0] - 1;
                if (pos < 0) {
                    return false;
                }
                scale.text(sizes[pos].label);
                ctrl.data("currentFontSize", ("{0}:{1}").format(pos, sizes[pos].size));
                // ** Pub:Sub **
                $.publish("Nebula::Build::SmallParts::FontSize::ZoomOut", [sizes[pos].size]);
                return false;
            });
        },

        subscribeScrollTo: function(target, parent, animate, duration) {
            var getter, setter;

            getter = parent || $(window);
            setter = parent || $("html,body");
            animate = animate || false;
            duration = duration || 1000;

            if (animate) {
                setter.animate({
                    // scrollTop: getter.scrollTop() + $(target).position().top
                    scrollTop: $(target).position().top
                }, duration);
            } else
                // setter.scrollTop(getter.scrollTop() + $(target).position().top);
                setter.scrollTop($(target).position().top);
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Build));
