/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");
Nebula.Register("Nebula.Widget");
Nebula.Register("Nebula.Cache.Build");

Nebula.Build.Run = (function(window, $, N, B, W, undefined) {
    "use strict";

    function _init() {
        _preload(_getPreloads());
        _build(_getBuilders());
    }

    function _destruct() {
        for (var signature in N.Cache.Build) {
            N.Cache.Build[signature].destruct();
        }
        N.Cache.Build = null;
        delete N.Cache.Build;
    }

    function _getPreloads() {
        return [
            "/img/spinner-processing.gif",
            "/img/spinner-combo-gray.gif"
        ];
    }

    function _getBuilders() {
        return [
            {builder: B.Router, selector: window},
            {builder: B.SmallParts, parts: [
                {builder: W.Factory.spinner, selector: ".spinner-64, .spinner-24, .inplace-spinner"},
                {builder: W.Factory.spinner, selector: ".modal-spinner", configs: {type: "large", driver: "js", action: "stop"}},
                {builder: W.Factory.spinner, selector: ".global-spinner", configs: {type: "global", driver: "js", action: "stop"}},
                {builder: W.Factory.spinner, selector: ".processing-spinner", configs: {type: "processing", driver: "gif", action: "stop"}},
                {builder: W.Factory.expander, selector: ".expandable"},
                {builder: W.Factory.combo, selector: "input:text.combo"},
                {builder: W.Factory.dropdown, selector: "select.dropdown"},
                {builder: W.Factory.tooltip, selector: ".has-tooltip"},
                {builder: W.Factory.calendar, selector: ".is-datepicker"},
                {builder: W.Factory.popover, selector: ".has-popover, .has-popover-error, .has-popover-warning, .has-popover-info, .has-popover-success"},
                {builder: W.Factory.validator, selector: "form.validate"},
                {builder: W.Factory.uploader, selector: ".file-uploader"},
                {builder: W.Factory.modal, selector: "#LaunchpadLightbox, #CrowdedLaunchpadLightbox"},
                {builder: W.Factory.modal, selector: "#MessageWindow", configs: {events: {show: function() {
                    // Set event listeners for user input (tabbing) to manage focus to provide
                    // proper modal focus interaction, since modal contents aren't focusable atm
                    $.publish("Nebula::SmallParts::Modal::MessageWindow::Show", [this]);
                }}}},
                {builder: W.Factory.modal, selector: "#MediumActionWindow", configs: {events: {show: function() {
                    // developers should create spinners dynamically
                    // every time content nodes are being generated on the client
                    W.Factory.spinner($(this).find(".modal-spinner")).play();
                }, hide: function() {
                    W.Factory.spinner($(this).find(".modal-spinner")).stop();
                }}}},
                {builder: W.Factory.modal, selector: "#ShortActionWindow", configs: {events: {show: function() {
                    W.Factory.spinner($(this).find(".global-spinner")).play();
                }, hide: function() {
                    W.Factory.spinner($(this).find(".global-spinner")).stop();
                }}}},
                {builder: W.Factory.modal, selector: "#ProcessingWindow", configs: {events: {show: function() {
                    W.Factory.spinner($(this).find(".spinner-24, .spinner-64")).play();
                }, hide: function() {
                    W.Factory.spinner($(this).find(".spinner-24, .spinner-64")).stop();
                }}}}
            ]},
            {builder: B.EnhancedGrid, selector: "div.eS-enhanced-grid"},
            {builder: B.EnhancedModal, selector: "div.eS-enhanced-modal"},
            {builder: B.EnhancedSearch, selector: "section.eS-enhanced-search"},
            {builder: B.EnhancedEditor, selector: "section.eS-enhanced-editor"},
            {builder: B.Textblock, selector: "section.eS-textblock-wrapper"}
        ];
    }

    function _preload(resource) {
        var load = function(i, v) {
            var img = new Image();
            img.src = (this || v);
        };
        $.subscribe("Nebula::Run::Preload", function(resource) {
            if ($.isArray(resource)) {
                $.each(resource, load);
            } else
                load.call(resource);
        });
        $.publish("Nebula::Run::Preload", resource);
    }

    function _build(builders, context) {
        for (var i = 0, j = builders.length; i < j; i++) {
            _buildOne(builders[i], context);
        }
    }

    function _buildOne(builder, context) {
        if (builder.selector) {
            if (context === undefined) {
                $(builder.selector).each($.proxy(_runOneBuilder, builder));
            } else {
                if (builder.selector !== window) {
                    $(builder.selector, context).each($.proxy(_runOneBuilder, builder));
                }
            }
        }
        else {
            var instance = N.Instance(builder.builder, builder.parts || [], context);
            N.Cache.Build[instance.newGuid()] = instance;
        }
    }

    // the context [this] of the following function has been changed to _builder[i]
    // in _init() method by $.proxy(), which was design to change and pass different
    // context to a function
    // see: http://api.jquery.com/jQuery.proxy/
    function _runOneBuilder(index, element) {
        if (!! +($(element).data("disablePreBuild"))) {
            return null;
        }

        // for those may be confused with [this], it's referencing to
        // [builder] in _buildOne() function
        var instance = N.Instance(this.builder, $(element));
        N.Cache.Build[instance.getSignature()] = instance;

        return instance;
    }

    function _buildPartial(context) {
        _build(_getBuilders(), context);
        return context;
    }

    function _unbuildPartial(context) {
        return context;
    }

    return {
        init          : _init,
        destruct      : _destruct,
        build         : _build,
        buildOne      : _buildOne,
        preload       : _preload,
        getPreloads   : _getPreloads,
        getBuilders   : _getBuilders,
        buildPartial  : _buildPartial,
        unbuildPartial: _unbuildPartial
    };
}(window, jQuery, Nebula, Nebula.Build, Nebula.Widget));
