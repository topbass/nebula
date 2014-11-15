/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");

Nebula.Build.Textblock = (function(window, $, N, B, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults       = {};
        this.target         = $(target);
        this.externalTarget = null;
        this.configs        = {};
        this.loader         = null;
        this.toolbar        = null;
        this.content        = null;
        this.modal          = null;
        this.form           = null;
        this.editor         = null;
        this.submit         = null;

        // ***** CALL ***** parent constructor
        parent.call(this, this.target);

        // ***** CALL ***** local constructor
        this.initialize();
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
            this.configs = $.extend(
                {}, this.defaults, W.Factory.readData(this.target, "config")
            );
            this.configs.editable = this.boolval(this.configs.editable || 0);

            this.externalTarget = $(
                this.configs.externalTarget || "section.eS-textblock-external"
            );

            this.loader  = this.target.children(".textblock-loader");
            this.toolbar = this.target.find(".textblock-toolbar").detach();
            this.content = $(document.createElement("div")).addClass("textblock-content");
            this.modal   = $("#textblock-modal");
            this.form    = this.modal.find(".modal-body > form");
            this.editor  = this.form.find("[name='body']");
            this.submit  = this.modal.find(".modal-footer a.btn.submit");

            this.prepareTextblocks();
            this.xhrLoadData();
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.add(this.externalTarget)
                .off("click", ".textblock .textblock-toolbar button");
            this.form.off("submit");
            this.submit.off("click");

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.loader;
            delete this.toolbar;
            delete this.content;
            delete this.modal;
            delete this.form;
            delete this.editor;
            delete this.submit;
        },

        // ***** PUBLIC METHODS *****
        prepareTextblocks: function() {
            var t = this;
            t.target.find(".textblock").each(function() {
                var tt  = $(this),
                    cls = ("sort-order-{0}").format(tt.data("sortOrder") || "0");
                if (t.configs.editable) {
                    tt.append(t.toolbar.clone());
                }
                tt.removeClass(cls).addClass(cls).append(t.content.clone());
            });
            if (t.configs.editable) {
                t.target.add(t.externalTarget).on(
                    "click",
                    ".textblock .textblock-toolbar button",
                    $.proxy(t.handleToolbarButtonsClick, t)
                );
                t.form.on("submit", $.proxy(t.handleFormSubmission, t));
                t.submit.on("click", $.proxy(t.handleFormSubmitButtonClick, t));
            }
        },

        handleToolbarButtonsClick: function(e) {
            var t     = this,
                tt    = $(e.currentTarget),
                block = tt.parents(".textblock"),
                body  = (block.find(".expandable-content").length > 0) ?
                    block.find(".expandable-content") :
                    block.find(".textblock-content"),
                param = $(document.createElement("input")).prop("type", "hidden");

            if (tt.is(".btn-edit")) {
                W.Factory.modal(t.modal).show();
                t.form.find(":input[type='hidden']").remove();
                $.each(block.data("blockParams"), function(field, value) {
                    t.form.append(param.clone().prop({
                        name: field,
                        value: value
                    }));
                });
                t.editor.val(body.html());
                W.Factory.editor(t.editor, {
                    statusbar: false,
                    height   : ($(window).height() * 0.56),
                    setup    : function(ed) {
                        ed.on("init", function(args) {
                            W.Factory.modal(t.modal).resize();
                        });
                    }
                });
                t.modal.data("sortOrder", block.data("sortOrder"));
            }
        },

        handleFormSubmission: function(e) {
            var t     = this,
                block = t.target.add(t.externalTarget).find(
                    (".sort-order-{0}").format(t.modal.data("sortOrder"))
                ),
                body  = (block.find(".expandable-content").length > 0) ?
                    block.find(".expandable-content") :
                    block.find(".textblock-content"),
                html  = W.Factory.editor(t.editor).tinymce().getContent();

            W.Factory.modal(t.modal).hide();
            body.html(html);
            t.editor.val(html);
            t.xhr({
                method: "POST",
                url: t.target.data("submitUrl"),
                data: t.form.serialize(),
                scope: t,
                beforeSend: function() {}, always: function() {},
                done: function(data) {}, fail: function() {}
            });

            return false;
        },

        handleFormSubmitButtonClick: function(e) {
            this.form.trigger("submit");
            return false;
        },

        showLoader: function() {
            this.loader.show();
            W.Factory.spinner(this.loader.find("div.spinner")).play();
        },

        hideLoader: function() {
            W.Factory.spinner(this.loader.find("div.spinner")).stop();
            this.loader.hide();
        },

        xhrLoadData: function() {
            var t = this,
                q = W.Factory.dataToQuery(W.Factory.readData(t.target, "query"));

            if (!t.target.data("dataSource")) {
                return;
            }

            t.xhr({
                method: "GET",
                url: t.target.data("dataSource"),
                data: q,
                scope: t,
                beforeSend: function() { t.showLoader(); },
                done: function(data) {
                    $.each(data.data || [], function(index, content) {
                        var tt = t.target.find(
                                (".sort-order-{0}").format(content.sortOrder || "0")
                            ),
                            ct = tt.find(".textblock-content"),
                            et, ec;
                        // if size is given in the returning results then use it to
                        // override the preset textblock size
                        if (content.size) {
                            var cls = tt.prop("class").replace(
                                /span[0-9]{1,2}/,
                                "span" + content.size
                            );
                            tt.removeClass().addClass(cls);
                        }
                        ct.html(content.body || "");
                        delete content.body;
                        delete content.sortOrder;
                        tt.data("blockParams", content).closest(".row-fluid").show();
                        // if textblock is referencing to an external section container
                        // detach the textblock and append it to the external container
                        if (tt.data("externalReferenceId")) {
                            et = $("#" + tt.data("externalReferenceId"));
                            if (et.length) {
                                ec = et.children(".row-fluid");
                                if (!ec.length) {
                                    ec = $("<div></div>").addClass("row-fluid").appendTo(et);
                                }
                                tt.detach().appendTo(ec);
                            }
                        }
                        if ((ct.length && ct.html().trim() !== "") || t.configs.editable) {
                            if (!t.boolval(tt.data("hiddenByDefault"))) {
                                // show textblock, expendar is depending on this
                                tt.fadeIn();
                                // if textblock is configured to use expander widget to
                                // shorten display text in the block
                                if (tt.data("expandableLines")) {
                                    W.Factory.expander(ct.addClass("expandable"), {
                                        lines: tt.data("expandableLines")
                                    });
                                }
                            }
                        }
                    });
                },
                fail: function() {},
                always: function() {
                    t.hideLoader();
                    t.target.css("min-height", "0");
                }
            });
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Build, Nebula.Widget));
