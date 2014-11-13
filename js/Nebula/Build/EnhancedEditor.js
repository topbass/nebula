/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");

Nebula.Build.EnhancedEditor = (function($, Nebula, Widget, Factory) {
    "use strict";

    var parent = Nebula.Core.Abstract;

    var self = function(target) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults        = {};
        this.target          = $(target);
        this.configs         = {};
        this.layoutPane      = this.target.children(".layout-pane");
        this.editorPane      = this.target.children(".editor-pane");
        this.richEditor      = this.editorPane.find(".rich-editor");
        this.sectionTitle    = this.editorPane.find("input[name='sectionTitle']");
        this.sectionTemplate = this.layoutPane.find(".section-template:first");
        this.dialogPane      = this.target.find(".dialog-pane");
        this.dialogBody      = this.dialogPane.find(".dialog-body");
        this.dialogCover     = this.dialogPane.find(".dialog-cover");
        this.loaderPane      = this.target.find(".loader-pane");
        this.addNewButtons   = this.target.find(".shared-button > .add");
        this.ignoredElements = [
            ".mce-container",
            ".mce-container *",
            ".moxman-container",
            ".moxman-container *",
            "#mce-modal-block",
            "#moxman-modal-block"
        ];

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
                {}, this.configs, Factory.readData(this.target, "config")
            );
            this.configs.editable = this.boolval(this.configs.editable || 0);

            if (this.configs.editable) {
                this.constructEditorPane();
                this.constructDialogPane();
                this.constructLoaderPane();
                this.constructSortablePane();
                this.attachEventListeners();
            } else {
                this.addNewButtons.hide();
                this.sectionTemplate.detach().addClass("section-non-editable");
            }

            $.subscribe("Nebula::EnhancedEditor::LoadData", $.proxy(this.subscribeLoadData, this));
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            $("body").off(
                "click.enhanced-editor",
                (":not({0})").format(this.ignoredElements.join(", "))
            );
            this.richEditor.add(this.sectionTitle)
                .off("click.enhanced-editor");
            this.layoutPane
                .off("click.enhanced-editor", "> section")
                .off("click.enhanced-editor", "> section .section-toolbar-editing > button")
                .off("click.enhanced-editor", "> section .section-toolbar-status > button");
            this.addNewButtons
                .off("click.enhanced-editor");

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.layoutPane;
            delete this.editorPane;
            delete this.richEditor;
            delete this.sectionTitle;
            delete this.sectionTemplate;
            delete this.dialogPane;
            delete this.dialogBody;
            delete this.dialogCover;
            delete this.loaderPane;
            delete this.addNewButtons;
            delete this.ignoredElements;
        },

        // ***** PUBLIC METHODS *****
        subscribeLoadData: function() {
            this.layoutPane.find("> section").remove();
            this.xhrLoadData();
            $.publish("Nebula::EnhancedModal::Resize");
        },

        constructEditorPane: function() {
            Factory.editor(this.richEditor, {
                // menubar: false,
                statusbar: false,
                height: ($(window).height() * 0.46)
            });
        },

        constructSortablePane: function() {
            var t = this;
            t.sectionTemplate.detach();
            t.layoutPane.sortable({
                cursor: "move",
                cursorAt: {top: 5, left: 5},
                items: "section",
                placeholder: "sortable-placeholder",
                tolerance: "pointer",
                start: function(e, ui) {
                    t.layoutPane.find("> section").addClass("border-invisible");
                    ui.item.data("currentlyEditing", ui.item.is(".currently-editing"));
                    t.saveOnFocusLost(false);
                },
                stop: function(e, ui) {
                    t.layoutPane.find("> section.border-invisible")
                        .removeClass("border-invisible");
                    if (ui.item.data("currentlyEditing")) {
                        ui.item.trigger("click.enhanced-editor");
                    } else {
                        t.xhrSaveChanges(ui.item);
                    }
                    ui.item.removeData("currentlyEditing");
                }
            }).find("> section").remove();
        },

        constructDialogPane: function() {
            this.dialogPane.detach();
        },

        constructLoaderPane: function() {
            this.loaderPane.find("img")
                .attr("src", this.loaderPane.attr("src"));
        },

        attachEventListeners: function() {
            $("body").on(
                "click.enhanced-editor",
                (":not({0})").format(this.ignoredElements.join(", ")),
                $.proxy(this.handleFocusLostClick, this)
            );
            this.editorPane
                .on("click.enhanced-editor", $.proxy(this.handleFocusGainedClick, this));
            this.layoutPane
                .on("click.enhanced-editor", "> section",
                    $.proxy(this.handleEditableSectionClick, this))
                .on("click.enhanced-editor", "> section .section-toolbar-editing > button",
                    $.proxy(this.handleSectionToolbarButtonClick, this))
                .on("click.enhanced-editor", "> section .section-toolbar-status > button",
                    $.proxy(this.handleSectionToolbarButtonClick, this));
            this.addNewButtons
                .on("click.enhanced-editor", $.proxy(this.handleAddNewButtonClick, this));
        },

        showDialogPane: function(specs, reference) {
            specs = specs || {};
            this.dialogCover
                .width(reference.width())
                .height(reference.height())
                .add(this.dialogBody)
                .on("click.enhanced-editor", function() { return false; });
            this.dialogBody.find("label")
                .html(specs.message || "");
            this.dialogBody.find(".btn-primary")
                .text(specs.yesLabel || "Yep")
                .on("click.enhanced-editor",
                    $.proxy(specs.yesCallback || function() { return false; }, this));
            this.dialogBody.find(".btn-cancel")
                .text(specs.noLabel || "Nope")
                .on("click.enhanced-editor",
                    $.proxy(specs.noCallback || function() { return false; }, this));
            this.dialogPane.prependTo(reference).show();
            this.dialogBody.css({
                top: ((reference.height() - this.dialogBody.height()) / 2) + "px",
                left: ((reference.width() - this.dialogBody.width()) / 2) + "px"
            });
        },

        hideDialogPane: function() {
            Factory.spinner(this.loaderPane.find("div.spinner")).stop();
            this.dialogPane.hide().detach();
        },

        showLoader: function(reference) {
            reference = (reference.length) > 0 ? reference : this.layoutPane;
            this.loaderPane.insertAfter(reference).show();
            Factory.spinner(this.loaderPane.find("div.spinner")).play();
        },

        hideLoader: function() {
            this.loaderPane.hide().detach();
        },

        createNewSection: function(specs, reference) {
            var section = this.sectionTemplate.clone();
            specs = specs || {};
            reference = reference || null;
            if (specs.status) {
                section.find(".section-toolbar-status .status")
                    .removeClass("draft published error")
                    .addClass(specs.status.toLowerCase())
                    .text(specs.status);
            }
            section.find(".section-title").html(specs.title || "");
            section.find(".section-content").html(specs.content || "");
            section.data(specs.query || {}).not(".saved").addClass("saved");
            if (reference === null) {
                this.layoutPane.append(section.show());
            } else {
                section.show().insertAfter(reference);
            }
            // Factory.tooltip(section.find(".section-toolbar-editing > button"));
            // Factory.tooltip(section.find(".section-toolbar-status > button"));
            $.publish("Nebula::EnhancedModal::Resize");

            return section;
        },

        saveOnFocusLost: function(xhrRequestNeeded) {
            var t = this, section, title, content;

            if (!t.richEditor.tinymce()) {
                Factory.editor(t.richEditor).initialize({
                    height: ($(window).height() * 0.46)
                });
                return;
            }

            section = t.layoutPane.find(".currently-editing");
            title = t.sectionTitle.val();
            content = t.richEditor.tinymce().getContent();

            try {
                Factory.editor(t.richEditor).remove();
            } catch (e) {
                if (t.isDebug()) {
                    console.debug(e);
                }
            }
            t.editorPane.detach();

            section.removeClass("currently-editing").map(function() {
                var tt = $(this), tb = tt.find(".section-toolbar-editing");
                tt.find(".section-title").show().html(title);
                tt.find(".section-content").show().html(content);
                tb.find(".btn-save").hide();
                tb.find(".btn-edit").show();
            });

            if (t.target.data("submitUrl") && xhrRequestNeeded && section.length > 0) {
                t.xhrSaveChanges(section);
            }

            $.publish("Nebula::EnhancedModal::Resize");
        },

        handleFocusLostClick: function(e) {
            this.saveOnFocusLost(true);
        },

        handleFocusGainedClick: function(e) {
            e.stopPropagation();
            return false;
        },

        handleEditableSectionClick: function(e) {
            var t = this,
                tt = $(e.currentTarget),
                title = tt.find(".section-title").hide().html(),
                content = tt.find(".section-content").hide().html();

            e.stopPropagation();

            if (tt.is(".currently-editing")) {
                return;
            }

            t.saveOnFocusLost(false);

            tt.addClass("currently-editing").map(function() {
                var tb = $(this).find(".section-toolbar-editing");
                tb.find(".btn-save").show();
                tb.find(".btn-edit").hide();
            });
            t.editorPane.show().appendTo(tt);
            t.sectionTitle.val(title);
            t.richEditor.val(content);

            Factory.editor(t.richEditor).initialize({
                height: ($(window).height() * 0.46)
            });

            $.publish("Nebula::EnhancedModal::Resize");
            $.publish("Nebula::EnhancedModal::ScrollTo", [tt, true]);

            return false;
        },

        handleSectionToolbarButtonClick: function(e) {
            var t = this,
                tt = $(e.currentTarget),
                section = tt.parents(".section-template");

            e.stopPropagation();

            if (tt.is(".btn-draft")) {
                t.xhrUpdateSectionStatus(section, "Draft");
            } else if (tt.is(".btn-publish")) {
                t.xhrUpdateSectionStatus(section, "Published");
            } else if (tt.is(".btn-edit")) {
                section.trigger("click.enhanced-editor");
            } else if (tt.is(".btn-save")) {
                t.saveOnFocusLost(true);
            } else if (tt.is(".btn-duplicate")) {
                t.createDuplicateSection(section);
            } else if (tt.is(".btn-delete")) {
                t.showDialogPane({
                    message: "Are you sure you want to delete this section?",
                    yesLabel: "Yes, please.",
                    noLabel: "Um, no.",
                    yesCallback: function() {
                        e.stopPropagation();
                        t.xhrDeleteSection(section);
                        section.fadeOut().remove();
                    },
                    noCallback: function() {
                        e.stopPropagation();
                        t.hideDialogPane();
                    }
                }, section);
            }

            return false;
        },

        handleAddNewButtonClick: function() {
            var t = this,
                query = Factory.dataToQuery(Factory.readData(t.target, "query"));

            location.href = "#";
            location.href = "#enhanced-editor-bottom";

            t.xhr({
                method: "GET",
                url: t.target.data("guidUrl"),
                scope: t,
                beforeSend: function() { t.showLoader(t.layoutPane.find("> section:last")); },
                done: function(data) {
                    if (data.count == 1) {
                        t.xhrSaveChanges(t.createNewSection({
                            title: "Title",
                            status: "Draft",
                            content: "Content",
                            query: {
                                queryDocumentId: "documentId:" + query.documentId,
                                queryPartnerDocumentId: "partnerDocumentId:" + query.partnerDocumentId,
                                queryDocumentSectionId: "documentSectionId:" + data.data[0].computed
                            }
                        }));
                    }
                },
                fail: function() {},
                always: function() { t.hideLoader(); }
            });

            return false;
        },

        createDuplicateSection: function(reference) {
            var t = this,
                query = Factory.dataToQuery(Factory.readData(t.target, "query"));
            t.xhr({
                method: "GET",
                url: t.target.data("guidUrl"),
                scope: t,
                beforeSend: function() { t.showLoader(reference); },
                done: function(data) {
                    var title, content;
                    if (data.count == 1) {
                        if (reference.is(".currently-editing")) {
                            title = t.sectionTitle.val();
                            content = t.richEditor.tinymce().getContent();
                        } else {
                            title = reference.find(".section-title").html();
                            content = reference.find(".section-content").html();
                        }
                        t.xhrSaveChanges(t.createNewSection({
                            title: title,
                            status: "Draft",
                            content: content,
                            query: {
                                queryDocumentId: "documentId:" + query.documentId,
                                queryPartnerDocumentId: "partnerDocumentId:" + query.partnerDocumentId,
                                queryDocumentSectionId: "documentSectionId:" + data.data[0].computed
                            }
                        }, reference));
                    }
                },
                fail: function() {},
                always: function() { t.hideLoader(); }
            });
        },

        getSortOrder: function() {
            var sortOrder = [];
            this.layoutPane.find("> section").each(function(index, section) {
                var query = Factory.dataToQuery(Factory.readData($(section), "query"));
                if (query.documentSectionId) {
                    sortOrder.push(query.documentSectionId);
                }
                query = null;
            });

            return sortOrder.join(",");
        },

        xhrLoadData: function() {
            var t = this,
                query = Factory.dataToQuery(Factory.readData(t.target, "query"));
            if (!t.target.data("dataSource")) {
                return;
            }
            t.xhr({
                method: "GET",
                url: t.target.data("dataSource"),
                data: query,
                scope: t,
                beforeSend: function() { t.showLoader(t.layoutPane); },
                done: function(data) {
                    $.each(data.data || [], function(index, content) {
                        t.createNewSection({
                            title: content.title,
                            status: content.statusCompleted || "Draft",
                            content: content.body,
                            query: {
                                queryDocumentId: "documentId:" + query.documentId,
                                queryPartnerDocumentId: "partnerDocumentId:" + query.partnerDocumentId,
                                queryDocumentSectionId: "documentSectionId:" + content.documentSectionId
                            }
                        });
                    });
                    $.publish("Nebula::EnhancedModal::Resize");
                },
                fail: function() {},
                always: function() { t.hideLoader(); }
            });
        },

        xhrSaveChanges: function(section) {
            var t = this,
                query = $.extend(
                    {},
                    Factory.dataToQuery(Factory.readData(section, "query")),
                    {
                        title: section.find(".section-title").html(),
                        body: section.find(".section-content").html(),
                        sortOrder: t.getSortOrder()
                    }
                );

            t.xhr({
                method: "POST",
                url: t.target.data("submitUrl"),
                data: query,
                scope: t,
                beforeSend: function() {},
                done: function(data) {
                    section.not(".saved").addClass("saved");
                },
                fail: function() {},
                always: function() {}
            });
        },

        xhrDeleteSection: function(section) {
            var t = this,
                query = $.extend(
                    {},
                    Factory.dataToQuery(Factory.readData(section, "query")),
                    {type: "delete"}
                );
            t.xhr({
                method: "POST",
                url: t.target.data("submitUrl"),
                data: query,
                scope: t,
                beforeSend: function() {},
                done: function(data) {},
                fail: function() {},
                always: function() {}
            });
        },

        xhrUpdateSectionStatus: function(section, status) {
            var t = this,
                q = Widget.Factory.dataToQuery(Widget.Factory.readData(section, "query")),
                c = section.find(".section-toolbar-status .status");

            delete q.documentId;
            q.statusCompleted = status;

            t.xhr({
                method: "POST",
                url: t.target.data("statusUrl"),
                scope: t,
                data: q,
                beforeSend: function() {
                    c.removeClass("draft published error").text("Updating status...");
                },
                done: function(data) {
                    c.addClass(status.toLowerCase()).text(status);
                    // ** Pub:Sub **
                    $.publish("Nebula::EnhancedEditor::UpdateStatus", [t, data]);
                },
                fail: function() {
                    c.addClass("error").text("Failed updating status");
                }
            });
        }
    });

    return self;
}(jQuery, Nebula, Nebula.Widget, Nebula.Widget.Factory));
