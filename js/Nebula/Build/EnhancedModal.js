/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");
Nebula.Register("Nebula.FeudMap");

Nebula.Build.EnhancedModal = (function(window, $, N, B, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function self(target) {
        // *** PUBLIC PROPERTIES ***
        this.defaults          = {};
        this.target            = $(target);
        this.configs           = {};
        this.title             = this.target.find(".modal-header > h3");
        this.detail            = this.target.find(".modal-body");
        this.form              = this.detail.find("form:first");
        this.subsetCtrl        = this.form.find(".form-grid.appendable .form-row.control");
        this.appendBtn         = this.subsetCtrl.find("button.btn");
        this.submitBtn         = this.target.find(".btn.submit");
        this.cancelBtn         = this.target.find(".btn.cancel");
        this.prevBtn           = this.target.find(".btn.prev");
        this.nextBtn           = this.target.find(".btn.next");
        this.subsetTpl         = null;
        this.loader            = this.target.find(".modal-body .modal-loader");
        this.mapper            = null;
        this.searchCls         = null;
        this.gridCls           = null;
        this.subGridAdjusted   = {};
        this.subGridAdjustment = 0;
        this.listenFormEvent   = true;
        this.listenButtonEvent = true;
        this.proceedSubmission = true;
        this.startTime         = 0;

        // *** CALL *** parent constructor
        parent.call(this, this.target);

        // *** CALL *** local constructor
        this.initialize();
    };

    // *** EXTEND *** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ METHODS *****
    //
    // [static methods goes here]
    //

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Build.EnhancedModal or its
    // child classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // *** CONSTRUCTOR ***
        initialize: function() {
            // remove data attribute [signature] that was injected by Run.js
            // for SearchResultModal builder
            this.target.removeData("signature");

            // subscribe to the following topics from potential publishers
            $.subscribe("Nebula::EnhancedModal::Open", $.proxy(this.subscribeModalAdvancedOpen, this));
            $.subscribe("Nebula::EnhancedModal::Advanced::Open", $.proxy(this.subscribeModalAdvancedOpen, this));
            $.subscribe("Nebula::EnhancedModal::Advanced::Reset", $.proxy(this.subscribeModalAdvancedReset, this));
            $.subscribe("Nebula::EnhancedModal::Advanced::Enable", $.proxy(this.subscribeModalAdvancedEnable, this));
            $.subscribe("Nebula::EnhancedModal::Advanced::Disable", $.proxy(this.subscribeModalAdvancedDisable, this));
            $.subscribe("Nebula::EnhancedModal::Advanced::Populate", $.proxy(this.subscribeModalAdvancedPopulate, this));
            $.subscribe("Nebula::EnhancedModal::Simple::Open", $.proxy(this.subscribeModalSimpleOpen, this));
            $.subscribe("Nebula::EnhancedModal::Simple::Bind", $.proxy(this.subscribeModalSimpleBind, this));
            $.subscribe("Nebula::EnhancedModal::Resize", $.proxy(this.subscribeModalResize, this));
            $.subscribe("Nebula::EnhancedModal::ResetHeight", $.proxy(this.subscribeModalResetHeight, this));
            $.subscribe("Nebula::EnhancedModal::ScrollTo", $.proxy(this.subscribeModalScrollTo, this));
            $.subscribe("Nebula::EnhancedModal::SetData", $.proxy(this.subscribeModalSetData, this));
            $.subscribe("Nebula::EnhancedModal::Show", $.proxy(this.subscribeModalShow, this));
            $.subscribe("Nebula::EnhancedModal::Hide", $.proxy(this.subscribeModalHide, this));
            $.subscribe("Nebula::EnhancedModal::SubGrid::Adjustment", $.proxy(this.subscribeModalSubGridAdjustment, this));
            // custom event listeners
            $.subscribe("Nebula::EnhancedModal::Event::Form::Submit", $.proxy(this.subscribeAttachEventFormSubmit, this));
            $.subscribe("Nebula::EnhancedModal::Event::Form::Reset", $.proxy(this.subscribeAttachEventFormReset, this));
            $.subscribe("Nebula::EnhancedModal::Event::Button::Append::Click", $.proxy(this.subscribeAttachEventButtonAppendClick, this));
            $.subscribe("Nebula::EnhancedModal::Event::Button::Submit::Click", $.proxy(this.subscribeAttachEventButtonSubmitClick, this));
            $.subscribe("Nebula::EnhancedModal::Event::Button::Cancel::Click", $.proxy(this.subscribeAttachEventButtonCancelClick, this));
            $.subscribe("Nebula::EnhancedModal::Event::Button::Prev::Click", $.proxy(this.subscribeAttachEventButtonPrevClick, this));
            $.subscribe("Nebula::EnhancedModal::Event::Button::Next::Click", $.proxy(this.subscribeAttachEventButtonNextClick, this));
            // subscribe to the following topics from SearchSection builder
            $.subscribe("Nebula::EnhancedSearch::Search::BeforeSend", $.proxy(this.subscribeSearchSubmit, this));
            $.subscribe("Nebula::EnhancedSearch::Search::Done", $.proxy(this.subscribeSearchDone, this));
            $.subscribe("Nebula::EnhancedSearch::Search::Fail", $.proxy(this.subscribeSearchFail, this));
            $.subscribe("Nebula::EnhancedSearch::Reset", $.proxy(this.subscribeSearchReset, this));
            $.subscribe("Nebula::EnhancedSearch::Save", $.proxy(this.subscribeSearchSave, this));
            // and moar subscribers!! pubsub rocks! yay!!
            $.subscribe("Nebula::Util::Feedback::Resize", $.proxy(this.subscribeModalResize, this));
            $.subscribe("Nebula::Util::Feedback::Focus", $.proxy(this.subscribeFeedbackFocus, this));
            $.subscribe("Nebula::Build::SmallParts::FontSize::ZoomIn", $.proxy(this.subscribeFontSizeZoomInOut, this));
            $.subscribe("Nebula::Build::SmallParts::FontSize::ZoomOut", $.proxy(this.subscribeFontSizeZoomInOut, this));

            this.target
                .on("Nebula::EnhancedModal::Advanced::Open", $.proxy(this.handleEventAdvancedOpen, this))
                .on("Nebula::EnhancedModal::Advanced::Reset", $.proxy(this.handleEventAdvancedReset, this))
                .on("Nebula::EnhancedModal::Advanced::Enable", $.proxy(this.handleEventAdvancedEnable, this))
                .on("Nebula::EnhancedModal::Advanced::Disable", $.proxy(this.handleEventAdvancedDisable, this))
                .on("Nebula::EnhancedModal::Advanced::Populate", $.proxy(this.handleEventAdvancedPopulate, this))
                .on("Nebula::EnhancedModal::Advanced::OpenTemplate", $.proxy(this.handleEventAdvancedOpenTemplate, this))
                .on("Nebula::EnhancedModal::Simple::Open", $.proxy(this.handleEventSimpleOpen, this))
                .on("Nebula::EnhancedModal::Simple::Bind", $.proxy(this.handleEventSimpleBind, this))
                .on("Nebula::EnhancedModal::Resize", $.proxy(this.handleEventResize, this))
                .on("Nebula::EnhancedModal::ResetHeight", $.proxy(this.handleEventResetHeight, this))
                .on("Nebula::EnhancedModal::ScrollTo", $.proxy(this.handleEventScrollTo, this))
                .on("Nebula::EnhancedModal::SetData", $.proxy(this.handleEventSetData, this))
                .on("Nebula::EnhancedModal::Show", $.proxy(this.handleEventShow, this))
                .on("Nebula::EnhancedModal::Hide", $.proxy(this.handleEventHide, this))
                .on("Nebula::EnhancedModal::SubGrid::Adjustment", $.proxy(this.handleEventSubGridAdjustment, this))
                .on("Nebula::EnhancedModal::Event::Form::Submit", $.proxy(this.handleEventFormSubmit, this))
                .on("Nebula::EnhancedModal::Event::Form::Reset", $.proxy(this.handleEventFormReset, this))
                .on("Nebula::EnhancedModal::Event::Button::Append::Click", $.proxy(this.handleEventButtonAppendClick, this))
                .on("Nebula::EnhancedModal::Event::Button::Submit::Click", $.proxy(this.handleEventButtonSubmitClick, this))
                .on("Nebula::EnhancedModal::Event::Button::Cancel::Click", $.proxy(this.handleEventButtonCancelClick, this))
                .on("Nebula::EnhancedModal::Event::Button::Prev::Click", $.proxy(this.handleEventButtonPrevClick, this))
                .on("Nebula::EnhancedModal::Event::Button::Next::Click", $.proxy(this.handleEventButtonNextClick, this))
                .on("Nebula::EnhancedModal::Loader::Show", $.proxy(this.handleEventLoaderShow, this))
                .on("Nebula::EnhancedModal::Loader::Hide", $.proxy(this.handleEventLoaderHide, this))
                .on("Nebula::Util::Feedback::Focus", $.proxy(this.handleEventFeedbackFocus, this))
                ;

            // attach form submission and reset event listeners
            // attach button click event listeners
            this.attachFormAndButtonEventListeners();

            $.subscribe("Nebula::Build::SmallParts::Viewport::Resize", $.proxy(function() {
                W.Factory.modal(this.target[0]).resize();
                this.handleEventSubGridAdjustment();
            }, this));
        },

        // *** DESTRUCTOR ***
        destruct: function() {
            this.target.off();
            this.detail.find(".form-grid.appendable .form-row.template input:text").off();
            this.detail.find(".form-grid.appendable .form-row.control button.btn").off();
            if (this.form && this.form.length)           { this.form.off();      }
            if (this.appendBtn && this.appendBtn.length) { this.appendBtn.off(); }
            if (this.submitBtn && this.submitBtn.length) { this.submitBtn.off(); }
            if (this.cancelBtn && this.cancelBtn.length) { this.cancelBtn.off(); }
            if (this.prevBtn && this.prevBtn.length)     { this.prevBtn.off();   }
            if (this.nextBtn && this.nextBtn.length)     { this.nextBtn.off();   }

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.title = null;
            this.detail = null;
            this.form = null;
            this.subsetCtrl = null;
            this.appendBtn = null;
            this.submitBtn = null;
            this.cancelBtn = null;
            this.prevBtn = null;
            this.nextBtn = null;
            this.subsetTpl = null;
            this.loader = null;
            this.mapper = null;
            this.searchCls = null;
            this.gridCls = null;
            this.subGridAdjusted = null;
            this.subGridAdjustment = null;
            this.listenFormEvent = null;
            this.listenButtonEvent = null;
            this.proceedSubmission = null;
            this.startTime = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.title;
            delete this.detail;
            delete this.form;
            delete this.subsetCtrl;
            delete this.appendBtn;
            delete this.submitBtn;
            delete this.cancelBtn;
            delete this.prevBtn;
            delete this.nextBtn;
            delete this.subsetTpl;
            delete this.loader;
            delete this.mapper;
            delete this.searchCls;
            delete this.gridCls;
            delete this.subGridAdjusted;
            delete this.subGridAdjustment;
            delete this.listenFormEvent;
            delete this.listenButtonEvent;
            delete this.proceedSubmission;
            delete this.startTime;
        },

        // *** PUBLIC METHODS ***
        //
        // [modal.pubsub.subscribe] Nebula::EnhancedSearch::Search::BeforeSend
        //
        subscribeSearchSubmit: function() {
            W.Factory.modal(this.target).hide();
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Simple::Open
        //
        subscribeModalSimpleOpen: function(data, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Simple::Open", [data, publisher]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Simple::Open
        //
        handleEventSimpleOpen: function(e, data, grid) {
            var t = this;

            t.gridCls = grid || t.gridCls || {};

            // show modal
            W.Factory.modal(t.target).show();
            data = data || {};
            if (data.title) {
                t.title.html(data.title);
            }
            if (t.form.length) {
                t.form.validate().resetForm();
                // t.form.validate().hideErrors();
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Simple::Bind
        //
        subscribeModalSimpleBind: function(html, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Simple::Bind", [html]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Simple::Bind
        //
        handleEventSimpleBind: function(e, html) {
            if (html) {
                if (this.form.length) {
                    this.form.remove();
                }
                this.detail.append(html);
            }
            this.form = this.detail.find("form");
            this.attachFormAndButtonEventListeners();
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Advanced::Open
        //
        subscribeModalAdvancedOpen: function(data, html, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Advanced::Open", [data, html, publisher]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Advanced::Open
        //
        handleEventAdvancedOpen: function(e, data, html, grid) {
            var t = this;

            t.gridCls = grid || t.gridCls || {};

            // show modal
            W.Factory.modal(t.target).show();
            // inject html into modal-body
            if (html) {
                if (t.form.length) {
                    t.form.remove();
                }
                t.detail.append(html);
                t.form = t.detail.find("form");
                t.attachFormAndButtonEventListeners();
            }
            if (t.form.length) {
                // inject data into modal-body > form
                t.handleEventAdvancedPopulate(null, data);
                t.form.validate().resetForm();
                setTimeout(function() {
                    t.form.find(":input:visible:not(button):first").select().focus();
                }, 0);
                // t.form.validate().hideErrors();
            }
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Advanced::OpenTemplate
        //
        // @param [object] evt
        // @param [string] url
        // @param [object] dat
        // @param [object] grd
        // @param [bool] frc
        // @return [object]
        //
        handleEventAdvancedOpenTemplate: function(evt, url, dat, grd, frc) {
            var enh = this,
                prt = $(enh.target[0]).find(".modal-body .modal-partial");

            frc = frc || false;

            return Q.Promise(function(resolve, reject, notify) {
                enh.startTime = N.Timing.now();
                enh.gridCls = grd || enh.gridCls || {};


                // clear modal partial content if it's a different template url
                if (prt.data("partialLoaded") !== true || prt.data("partialUrl") != url) {
                    prt.empty().parent().css("height", "auto");
                }

                // show modal
                W.Factory.modal(enh.target[0]).show();
                enh.handleEventLoaderShow();

                (!frc ? B.Template.load : B.Template.force)(prt, url).then(function(tgt) {
                    W.Factory.modal(enh.target[0]).resize();

                    // [modal.event.notify] Nebula::EnhancedModal::Advanced::TemplateLoaded
                    enh.target.triggerHandler(
                        "Nebula::EnhancedModal::Advanced::TemplateLoaded", [enh]);

                    if (tgt.data("initialLoad")) {
                        enh.form = $(enh.detail[0]).find("form:first");
                        enh.subsetCtrl = $(enh.form[0])
                            .find(".form-grid.appendable .form-row.control");
                        enh.appendBtn = $(enh.subsetCtrl[0]).find("button.btn");
                        enh.submitBtn = $(enh.target[0]).find(".btn.submit");
                        enh.cancelBtn = $(enh.target[0]).find(".btn.cancel");
                        enh.prevBtn = $(enh.target[0]).find(".btn.prev");
                        enh.nextBtn = $(enh.target[0]).find(".btn.next");
                        enh.loader = $(enh.target[0]).find(".modal-body .modal-loader");

                        enh.attachFormAndButtonEventListeners();

                        if (enh.form.length) {
                            // inject data into modal-body > form
                            enh.handleEventAdvancedPopulate(null, dat);
                            enh.form.validate().resetForm();
                            setTimeout(function() {
                                enh.form
                                    .find(":input:visible:not(button):first")
                                    .select().focus();
                            }, 0);
                        }

                        // [modal.event.notify] Nebula::EnhancedModal::Advanced::TemplateInitLoad
                        enh.target.triggerHandler(
                            "Nebula::EnhancedModal::Advanced::TemplateInitLoad", [enh]);
                    }

                    enh.handleEventLoaderHide();
                    resolve(enh);

                    // [modal.event.notify] Nebula::EnhancedModal::Advanced::TemplateAllSet
                    enh.target.triggerHandler(
                        "Nebula::EnhancedModal::Advanced::TemplateAllSet", [enh]);

                    if (typeof ga == "function" && enh.startTime) {
                        ga("send", {
                            hitType: "timing",
                            timingCategory: "Template Load",
                            timingVar: "{0} EnhancedModal #{1}".format(
                                enh.getPackageName(),
                                enh.target.prop("id")
                            ),
                            timingValue: N.Timing.get(enh.startTime, N.Timing.now()),
                            timingLabel: Nebula.Global.username
                        });
                    }
                }).done();
            });
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Advanced::Reset
        //
        subscribeModalAdvancedReset: function(event, alsoEmpty, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Advanced::Reset", [alsoEmpty, publisher]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Advanced::Reset
        //
        handleEventAdvancedReset: function(e, alsoEmpty, search) {
            this.searchCls = search || this.searchCls;

            this.resetForm(this.form, alsoEmpty);

            if (this.form.find(".form-grid.appendable").length > 0) {
                this.subsetCreateTemplate();
                this.subsetRemoveAllRows();
                this.subsetAddNewRow(this.subsetCtrl);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Advanced::Enable
        //
        subscribeModalAdvancedEnable: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Advanced::Enable", [publisher]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Advanced::Enable
        //
        handleEventAdvancedEnable: function(e, search) {
            this.searchCls = search || this.searchCls;
            this.enableDetailForm();
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Advanced::Disable
        //
        subscribeModalAdvancedDisable: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Advanced::Disable", [publisher]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Advanced::Disable
        //
        handleEventAdvancedDisable: function(e, search) {
            this.searchCls = search || this.searchCls;
            this.disableDetailForm();
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Advanced::Populate
        //
        subscribeModalAdvancedPopulate: function(data, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Advanced::Populate", [data]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Advanced::Populate
        //
        handleEventAdvancedPopulate: function(e, data) {
            var mapper = this.getMapper() || {}, key, field, elem, i, j;

            for (key in data) {
                field = (key in mapper) ? mapper[key] : key;
                if (typeof field == "object") {
                    this.subsetCreateTemplate();
                    this.subsetRemoveAllRows();
                    if ($.isArray(data[key])) {
                        for (i = 0, j = data[key].length; i < j; i++) {
                            this.subsetAddNewRow(this.subsetCtrl, field, data[key][i]);
                        }
                    }
                } else {
                    // for ACL readonly field
                    $(this.form[0]).find(".acl-readonly.span-" + field).text(data[key]);
                    // for details form in modal
                    elem = $(this.form[0]).find("[name='" + field + "']");
                    if (!elem.length) {
                        continue;
                    }
                    if (elem.is(":checkbox")) {
                        elem.prop("checked", this.boolval(data[key]));
                        continue;
                    }
                    elem.val(data[key]);
                }
            }
        },

        //
        // [search.pubsub.subscribe] Nebula::EnhancedSearch::Search::Done
        //
        subscribeSearchDone: function(data, status, xhr, publisher) {
            this.searchCls = publisher || this.searchCls;
            if (!("count" in data)) {
                // do nothing
            } else if (data.count === 0) {
                if (this.searchCls.isModalOpenable(true)) {
                    this.handleEventAdvancedOpen(null, {}, null, publisher);
                    this.subscribeSearchReset(null, publisher);
                }
            } else if (data.count == 1) {
                if (this.searchCls.isModalOpenable(false)) {
                    this.handleEventAdvancedOpen(null, data.data[0], null, publisher);
                }
                this.prevBtn.add(this.nextBtn).addClass("disabled");
            } else {
                if (this.searchCls.isModalOpenable(true)) {
                    this.handleEventAdvancedOpen(null, data.data[0], null, publisher);
                }
                this.prevBtn.add(this.nextBtn).removeClass("disabled");
            }

            return this;
        },

        //
        // [search.pubsub.subscribe] Nebula::EnhancedSearch::Search::Fail
        //
        subscribeSearchFail: function(xhr, status, throwable, publisher) {
            this.searchCls = publisher || this.searchCls;
            return this;
        },

        //
        // [search.pubsub.subscribe] Nebula::EnhancedSearch::Reset
        //
        subscribeSearchReset: function(event, publisher) {
            this.searchCls = publisher || this.searchCls;
            this.form[0].reset();
            this.form.find("input[type='hidden']:not([name='personID'])").val("");
            this.subsetCreateTemplate();
            this.subsetRemoveAllRows();
            this.subsetAddNewRow(this.subsetCtrl);

            return this;
        },

        //
        // [search.pubsub.subscribe] Nebula::EnhancedSearch::Save
        //
        subscribeSearchSave: function(event, publisher) {},

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Resize
        // [feedback.pubsub.subscribe] Nebula::Util::Feedback::Resize
        //
        subscribeModalResize: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Resize");
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Resize
        //
        handleEventResize: function(evt) {
            var enh = this;
            // setTimeout(fn, 0) is used to delay the execution of what's in fn
            // as fn will be executed after html and css rendering is done. this
            // is because browser queues all tasks and by calling setTimeout it
            // will add fn to the queue which has render task before js execution.
            setTimeout(function() {
                W.Factory.modal(enh.target[0]).resize();
            }, 0);
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::ResetHeight
        //
        subscribeModalResetHeight: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::ResetHeight");
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::ResetHeight
        //
        handleEventResetHeight: function(e) {
            this.target.children(".modal-body").css("height", "auto");
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::ScrollTo
        //
        subscribeModalScrollTo: function(target, animated, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::ScrollTo", [target, animated]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::ScrollTo
        //
        handleEventScrollTo: function(e, target, animated) {
            var mbody = this.target.children(".modal-body");

            if (animated) {
                mbody.animate({
                    scrollTop: mbody.scrollTop() + $(target).position().top
                }, "fast");
            } else
                mbody.scrollTop(mbody.scrollTop() + $(target).position().top);
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::SetData
        //
        subscribeModalSetData: function(data, target, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::SetData", [data, target]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::SetData
        //
        handleEventSetData: function(e, data, target) {
            data   = data || {};
            target = target || null;

            if (target === null) {
                this.target.data(data);
            } else
                this.target.find(target).data(data);
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Show
        //
        subscribeModalShow: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Show");
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Show
        //
        handleEventShow: function(e) {
            W.Factory.modal(this.target).show();
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Hide
        //
        subscribeModalHide: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Hide");
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Hide
        //
        handleEventHide: function(e) {
            W.Factory.modal(this.target).hide();
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::SubGrid::Adjustment
        //
        subscribeModalSubGridAdjustment: function(adjustment, readjust, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::SubGrid::Adjustment", [adjustment, readjust]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::SubGrid::Adjustment
        //
        handleEventSubGridAdjustment: function(evt, adjustment, readjust) {
            var enh = this,
                div = $(enh.target[0]).find(".control-group.has-sub-grid"),
                idx, portion;

            readjust = readjust || false;
            adjustment = adjustment || 0;

            setTimeout(function() {
                div.each(function(i, con) {
                    con = $(con);
                    idx = $(con[0]).find(".eS-enhanced-grid").prop("id");
                    portion = Math.round(
                        parseFloat(con.css("width")) /
                        parseFloat(con.parent().css("width")) * 100
                    ) / 100;
                    con.attr("data-original-portion", con.data("originalPortion") || portion);
                    con.width(function() {
                        enh.subGridAdjustment = (
                            !enh.subGridAdjusted[idx] || readjust
                        ) ? adjustment : enh.subGridAdjustment;
                        enh.subGridAdjusted[idx] = true;

                        return (
                            $(enh.target[0]).find(".modal-body").width() ||
                            (enh.target.width() - 25)
                        ) * con.data("originalPortion") - 60 - enh.subGridAdjustment;
                    });
                });
            }, 0);
        },

        //
        // [feedback.pubsub.subscribe] Nebula::Util::Feedback::Focus
        //
        subscribeFeedbackFocus: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::Util::Feedback::Focus");
            return this;
        },

        //
        // [feedback.event.listen] Nebula::Util::Feedback::Focus
        //
        handleEventFeedbackFocus: function(e) {
            var t = this;
            if (W.Factory.modal(t.target).isOpened()) {
                setTimeout(function() {
                    t.target.triggerHandler("Nebula::EnhancedModal::ScrollTo", [
                        "#feedback-message-" + t.target.prop("id")
                    ]);
                }, 100);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Event::Form::Submit
        //
        subscribeAttachEventFormSubmit: function(handler, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Event::Form::Submit", [handler]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Event::Form::Submit
        //
        handleEventFormSubmit: function(e, handler) {
            if (!this.form.data("hasBoundSubmit")) {
                this.form
                    .on("submit", $.proxy(handler, this))
                    .data("hasBoundSubmit", true);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Event::Form::Reset
        //
        subscribeAttachEventFormReset: function(handler, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Event::Form::Reset", [handler]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Event::Form::Reset
        //
        handleEventFormReset: function(e, handler) {
            if (!this.form.data("hasBoundReset")) {
                this.form
                    .on("reset", $.proxy(handler, this))
                    .data("hasBoundReset", true);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Event::Button::Append::Click
        //
        subscribeAttachEventButtonAppendClick: function(handler, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Event::Button::Append::Click", [handler]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Event::Button::Append::Click
        //
        handleEventButtonAppendClick: function(e, handler) {
            if (!this.form.data("hasBoundClick")) {
                this.appendBtn
                    .on("click", $.proxy(handler, this))
                    .data("hasBoundClick", true);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Event::Button::Submit::Click
        //
        subscribeAttachEventButtonSubmitClick: function(handler, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Event::Button::Submit::Click", [handler]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Event::Button::Submit::Click
        //
        handleEventButtonSubmitClick: function(e, handler) {
            if (!this.form.data("hasBoundClick")) {
                this.submitBtn
                    .on("click", $.proxy(handler, this))
                    .data("hasBoundClick", true);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Event::Button::Cancel::Click
        //
        subscribeAttachEventButtonCancelClick: function(handler, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Event::Button::Cancel::Click", [handler]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Event::Button::Cancel::Click
        //
        handleEventButtonCancelClick: function(e, handler) {
            if (!this.form.data("hasBoundClick")) {
                this.cancelBtn
                    .on("click", $.proxy(handler, this))
                    .data("hasBoundClick", true);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Event::Button::Prev::Click
        //
        subscribeAttachEventButtonPrevClick: function(handler, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Event::Button::Prev::Click", [handler]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Event::Button::Prev::Click
        //
        handleEventButtonPrevClick: function(e, handler) {
            if (!this.form.data("hasBoundClick")) {
                this.prevBtn
                    .on("click", $.proxy(handler, this))
                    .data("hasBoundClick", true);
            }
        },

        //
        // [modal.pubsub.subscribe] Nebula::EnhancedModal::Event::Button::Next::Click
        //
        subscribeAttachEventButtonNextClick: function(handler, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return this; }
            this.target.triggerHandler("Nebula::EnhancedModal::Event::Button::Next::Click", [handler]);
            return this;
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Event::Button::Next::Click
        //
        handleEventButtonNextClick: function(e, handler) {
            if (!this.form.data("hasBoundClick")) {
                this.nextBtn
                    .on("click", $.proxy(handler, this))
                    .data("hasBoundClick", true);
            }
        },

        //
        // [fontsize.pubsub.subscribe] Nebula::Build::SmallParts::FontSize::ZoomIn
        // [fontsize.pubsub.subscribe] Nebula::Build::SmallParts::FontSize::ZoomOut
        //
        subscribeFontSizeZoomInOut: function(size, reference, publisher) {
            if (!this.isReferenceMatched(reference)) {
                return this;
            }

            this.target
                .removeClass("xsmall small medium large xlarge")
                .addClass(size);

            return this;
        },

        attachFormAndButtonEventListeners: function() {
            this.appendBtn
                .add(this.submitBtn)
                .add(this.cancelBtn)
                .add(this.prevBtn)
                .add(this.nextBtn)
                .off("click");

            this.form
                .off("submit reset");

            if (typeof this.target.data("listenButtonEvent") == "undefined" ||
                this.boolval(this.target.data("listenButtonEvent"))
            ) {
                this.appendBtn.on("click", $.proxy(this.handleAppendButtonClick, this));
                this.submitBtn.on("click", $.proxy(this.handleSubmitButtonClick, this));
                this.cancelBtn.on("click", $.proxy(this.handleCancelButtonClick, this));
                this.prevBtn.on("click", $.proxy(this.handlePreviousButtonClick, this));
                this.nextBtn.on("click", $.proxy(this.handleNextButtonClick, this));
            } else
                this.listenButtonEvent = false;

            // form submission and reset event listeners
            if (typeof this.target.data("listenFormEvent") == "undefined" ||
                this.boolval(this.target.data("listenFormEvent"))
            ) {
                this.form
                    .on("submit", $.proxy(this.handleFormSubmit, this))
                    .on("reset", $.proxy(this.handleFormReset, this));
            } else
                this.listenFormEvent = false;
        },

        handleAppendButtonClick: function() {
            this.subsetCreateTemplate();
            this.subsetAddNewRow(this.subsetCtrl);
        },

        handleSubmitButtonClick: function(event) {
            if (this.submitBtn.hasClass("disabled")) {
                return false;
            }
            this.submitBtn.addClass("disabled");
            this.form.trigger("submit");
            return false;
        },

        handleCancelButtonClick: function() {},
        handlePreviousButtonClick: function() { return false; },
        handleNextButtonClick: function() { return false; },

        handleFormSubmit: function(event) {
            var t = this, form = null, query = [];

            t.commitSubGridCurrentEdit();

            // [modal.pubsub.public] Nebula::EnhancedModal::Save::Submit::Before
            $.publish(
                "Nebula::EnhancedModal::Save::Submit::Before",
                Array.prototype.slice.call(arguments).concat(t));
            // [modal.event.notify] Nebula::EnhancedModal::Save::Submit::Before
            t.target.triggerHandler(
                "Nebula::EnhancedModal::Save::Submit::Before",
                Array.prototype.slice.call(arguments).concat(t));

            try {
                if (!this.proceedSubmission) {
                    return false;
                }

                form = $(event.target);
                query = form.serializeArray();

                if (form.hasClass("validate") && !form.valid()) {
                    this.submitBtn.prop("disabled", false).removeClass("disabled");
                    return false;
                }
                // query.push({name: "filter", value: form.prop("id")});

                t.xhr({
                    method: "POST",
                    url: form.prop("action"),
                    data: query,
                    scope: t,
                    beforeSend: function() {
                        t.disableDetailForm();
                        setTimeout(function() {
                            W.Factory.modal(t.target).hide();
                            setTimeout(function() {
                                t.showProcessingWindow("Saving changes...");
                            }, 50);
                        }, 0);
                    },
                    done: t.handleFormSubmitDone,
                    fail: t.handleFormSubmitFail,
                    always: t.handleFormSubmitAlways
                });
            } catch (e) {
                console.error(e);
                return false;
            }

            // [modal.pubsub.publish] Nebula::EnhancedModal::Save::Submit::After
            $.publish(
                "Nebula::EnhancedModal::Save::Submit::After",
                Array.prototype.slice.call(arguments).concat(t));
            // [modal.event.notify] Nebula::EnhancedModal::Save::Submit::After
            t.target.triggerHandler(
                "Nebula::EnhancedModal::Save::Submit::After",
                Array.prototype.slice.call(arguments).concat(t));

            return false;
        },

        handleFormReset: function() {},

        handleFormSubmitDone: function(data, status, xhr) {
            var t = this, dfd = null;
            if (data.error) {
                setTimeout(function() {
                    t.hideProcessingWindow();
                    setTimeout(function() {
                        W.Factory.modal(t.target).show();
                    }, 50);
                }, 50);
                // print error messages
                if (data.level == "InvalidParameterError") {
                    N.Util.Feedback.warn(
                        (t.searchCls || B.EnhancedSearch)
                            .formatValidationMessages(data.extra)
                    ).fadeOut(15000);
                // } else if (!t.isDebug()) {
                //     t.handleFormSubmitFail(xhr, status, new Error(data.level));
                } else {
                    t.hideProcessingWindow();
                    N.Util.Feedback.error(data.message).fadeOut(20000);
                }
            } else {
                dfd = $.Deferred(function(defer) {
                    defer.notify("in-progress");
                    setTimeout(function() { defer.notify("complete"); }, 200);
                });
                dfd.progress(function(signal) {
                    switch (signal) {
                        case "complete":
                            if (this.status != "in-progress") {
                                break;
                            }
                            this.status = signal;
                            // hide progress-bar loading indicator
                            t.hideProcessingWindow();
                            // [modal.pubsub.public] Nebula::EnhancedModal::Save::Done::Message
                            $.publish(
                                "Nebula::EnhancedModal::Save::Done::Message",
                                [data, status, xhr, t]);
                            // [modal.event.notify] Nebula::EnhancedModal::Save::Done::Message
                            t.target.triggerHandler(
                                "Nebula::EnhancedModal::Save::Done::Message",
                                [data, status, xhr, t]);
                            // [modal.pubsub.public] Nebula::EnhancedGrid::Grid::Refresh
                            $.publish(
                                "Nebula::EnhancedGrid::Grid::Refresh",
                                [data, status, xhr, (t.gridCls.target ? t.gridCls.target.prop("id") : null), t]);
                            break;
                        case "pending":
                        case "in-progress":
                            this.status = signal;
                            break;
                    }
                });
                // [modal.pubsub.public] Nebula::EnhancedModal::Save::Done
                $.publish(
                    "Nebula::EnhancedModal::Save::Done", [dfd, data, status, xhr, t]);
                // [modal.event.notify] Nebula::EnhancedModal::Save::Done
                t.target.triggerHandler(
                    "Nebula::EnhancedModal::Save::Done", [dfd, data, status, xhr, t]);
            }
        },

        handleFormSubmitFail: function(xhr, status, throwable) {
            this.hideProcessingWindow();
            // [modal.pubsub.public] Nebula::EnhancedModal::Save::Fail::Message
            $.publish(
                "Nebula::EnhancedModal::Save::Fail::Message", [this]);
            // [modal.event.notify] Nebula::EnhancedModal::Save::Fail::Message
            this.target.triggerHandler(
                "Nebula::EnhancedModal::Save::Fail::Message", [this]);
            // display errors in console if debug is enabled
            if (this.isDebug() && (typeof console != "undefined")) {
                console.error(
                    "[Throwable Exception]:\n%s\n\n[XHR responseText]:\n%s",
                    throwable,
                    xhr.responseText
                );
            }
        },

        handleFormSubmitAlways: function(data, status, xhr) {
            this.enableDetailForm();
            this.submitBtn.removeClass("disabled");
        },

        getMapper: function() {
            if (this.mapper === null && this.searchCls !== null) {
                try {
                    this.mapper = this.searchCls.getMapper();
                } catch (err) {
                    if (err instanceof Error) {
                        this.mapper = {};
                    } else
                        throw err;
                }
            }
            return this.mapper;
        },

        subsetCreateTemplate: function() {
            var t = this;
            if (t.subsetTpl === null) {
                t.subsetTpl = t.form.find(".form-grid.appendable .form-row.template:first").clone();
                t.subsetTpl.find("input:text").map(function() {
                    $(this).val("");
                });
                // [modal.pubsub.public] Nebula::EnhancedModal::SubsetRow::Add
                $.publish(
                    "Nebula::EnhancedModal::SubsetRow::Add", [t.subsetTpl, t]);
            }
            return t.subsetTpl;
        },

        subsetRemoveAllRows: function() {
            this.form.find(".form-grid.appendable .form-row.template").remove();
        },

        subsetAddNewRow: function(before, field, values) {
            var t = this, row = t.subsetTpl.clone(), subkey;
            if (typeof field != "undefined" && typeof values != "undefined") {
                for (subkey in field) {
                    row.find(("[name='{0}']").format(field[subkey]))
                        .val(values[subkey])
                        .data("defaultValue", values[subkey]);
                    row.find((".acl-readonly.span-{0}").format(subkey).replace("[]", ""))
                        .text(values[subkey]);
                }
            }
            row.insertBefore(before);
            // [modal.pubsub.public] Nebula::EnhancedModal::SubsetRow::Add
            $.publish(
                "Nebula::EnhancedModal::SubsetRow::Add", [row, t]);
        },

        enableDetailForm: function() {
            this.form
                .find("input:text, input:radio, input:checkbox, select, button, textarea")
                .filter("[disabled]")
                .prop("disabled", false);
            this.form
                .find(".extended-input")
                .filter(".disabled")
                .removeClass("disabled");
        },

        disableDetailForm: function() {
            this.form
                .find("input:text, input:radio, input:checkbox, select, button, textarea")
                .prop("disabled", true);
            this.form
                .find(".extended-input")
                .addClass("disabled");
        },

        commitSubGridCurrentEdit: function() {
            $(".eS-enhanced-grid", this.target).each(function(_, grid) {
                $.publish(
                    "Nebula::EnhancedGrid::Grid::CommitCurrentEdit", [$(grid).prop("id")]);
            });
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Loader::Show
        //
        handleEventLoaderShow: function(evt) {
            this.loader.show();
            W.Factory.spinner(this.loader.find("div.spinner")).play();
        },

        //
        // [modal.event.listen] Nebula::EnhancedModal::Loader::Hide
        //
        handleEventLoaderHide: function(evt) {
            W.Factory.spinner(this.loader.find("div.spinner")).stop();
            this.loader.hide();
        },
    });

    return self;
}(window, jQuery, Nebula, Nebula.Build, Nebula.Widget));
