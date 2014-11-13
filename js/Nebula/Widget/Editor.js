/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Editor = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults = {
            // - Location of TinyMCE script
            script_url: "/js/libs/tinymce-4.1.6/tinymce.min.js",
            // - General options
            plugins: [
                "advlist autolink lists link image charmap print preview anchor",
                "searchreplace visualblocks code fullscreen spellchecker",
                "insertdatetime media table contextmenu paste textcolor moxiemanager"
            ],
            toolbar: "undo redo | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table tableaddrow tableaddcol tableheaderprop | link image | spellchecker | fullscreen",
            // tools: "inserttable",
            autosave_ask_before_unload: false,
            // - Example content CSS (should be your site CSS)
            body_class: "has-striped-table",
            // - Drop lists for link/image/media/template dialogs
            // template_external_list_url: "lists/template_list.js",
            // external_link_list_url: "lists/link_list.js",
            // external_image_list_url: "lists/image_list.js",
            // media_external_list_url: "lists/media_list.js",
            // - Replace values for the template plugin
            // template_replace_values : {
            //     username: "Some User",
            //     staffid: "991234"
            // },
            // - plain text pasting related
            // paste_text_sticky: true,
            // paste_text_sticky_default: true,
            paste_as_text: true,
            // forced_root_block: false,
            // force_br_newlines: true,
            // force_p_newlines: false,
            // convert_newlines_to_brs: false,
            // remove_linebreaks: true,
            // - moxie manager related
            moxiemanager_title:"Image / File Manager",
            relative_urls: false,
            remove_script_host: true
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
        initialize: function(configs) {
            this.extractLatestContentCss();
            this.configs = $.extend(true, {}, this.configs, configs || {});
            this.target.tinymce(this.configs);
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            if (typeof this.target.tinymce() != "undefined") {
                this.target.tinymce().remove();
            }

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
        extractLatestContentCss: function() {
            var regex = /.*\/css\/(?:main|bundle\.base)\-[0-9]*\.css$/,
                css = [];
            $(document).find("link[rel=stylesheet]").each(function(_, link) {
                if (link.href.match(regex)) {
                    css.push(link.href);
                }
            });
            this.configs.content_css = css.join(",");
        },

        tinymce: function() {
            return this.target.tinymce();
        },

        remove: function() {
            this.target.tinymce().remove();
        },

        getConfigs: function() {
            return this.configs;
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
