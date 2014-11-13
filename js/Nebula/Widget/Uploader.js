/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");

Nebula.Widget.Uploader = (function(window, $, N, W, undefined) {
    "use strict";

    var parent = N.Core.Abstract;

    var self = function(target, configs) {
        // ***** PUBLIC PROPERTIES *****
        this.defaults      = {
            runtimes: "html5,flash,silverlight,html4",
            browse_button: "",
            container: "",
            url: "",
            filters: {
                max_file_size: "10mb",
                mime_types: [
                    {title: "Image files", extensions: "jpg,gif,png"},
                    {title: "Zip files", extensions: "zip"},
                    {title: "PDF files", extensions: "pdf"},
                    {title: "Text files", extensions: "txt"},
                    {title: "MS Office files", extensions: "doc,docx,xls,xlsx,ppt,pptx"}
                ]
            },
            flash_swf_url: "/js/libs/plupload-2.1.1/Moxie.swf",
            silverlight_xap_url: "/js/libs/plupload-2.1.1/Moxie.xap",
            init: {}
        };
        this.target        = $(target);
        this.configs       = $.extend({}, this.defaults, configs);
        this.query         = undefined;
        this.param         = undefined;
        this.uploader      = null;
        this.downloader    = null;
        this.label         = null;
        this.files         = null;
        this.controls      = null;
        this.template      = null;
        this.browseBtn     = null;
        this.uploadBtn     = null;
        this.outputUrl     = null;
        this.submitUrl     = null;
        this.dataSource    = null;
        this.downloadable  = true;
        this.loader        = null;
        this.isInitialized = false;
        this.compatibility = null;
        this.widget        = null;

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
            this.label = $(this.target[0]).find(".control-label");
            this.files = $(this.target[0]).find(".files");
            this.controls = $(this.target[0]).find(".controls");
            this.template = $(this.files[0]).find(".template").detach();
            this.browseBtn = $(this.controls[0]).find(".add");
            this.uploadBtn = $(this.controls[0]).find(".upload");
            this.compatibility = $(this.target[0]).find(".compatibility");
            this.downloader = $(this.target[0]).find(".downloader");
            this.dataSource = this.target.data("dataSource");
            this.outputUrl = this.target.data("outputUrl");
            this.submitUrl = this.target.data("submitUrl");
            this.downloadable = this.boolval(this.target.data("downloadable"));
            this.loader = $(this.target[0]).find(".loader");
            this.query = W.Factory.dataToQuery(W.Factory.readData(this.target, "query"));
            this.param = W.Factory.dataToQuery(W.Factory.readData(this.target, "param"));

            this.configs.browse_button = this.browseBtn[0];
            this.configs.container = this.controls[0];
            this.configs.init.Init = $.proxy(this.handleInit, this);
            this.configs.init.Error = $.proxy(this.handleError, this);
            this.configs.init.Destroy = $.proxy(this.handleDestroy, this);
            this.configs.init.PostInit = $.proxy(this.handlePostInit, this);
            this.configs.init.FilesAdded = $.proxy(this.handleFilesAdded, this);
            this.configs.init.FileUploaded = $.proxy(this.handleFileUploaded, this);
            this.configs.init.BeforeUpload = $.proxy(this.handleBeforeUpload, this);
            this.configs.init.UploadProgress = $.proxy(this.handleUploadProgress, this);
            // this.configs.init.UploadComplete = $.proxy(this.handleUploadComplete, this);
            this.configs.multipart_params = $.isEmptyObject(this.param) ? undefined : this.param;

            $.subscribe("Nebula::Widget::Uploader::MergeQuery", $.proxy(this.subscribeMergeQuery, this));
            $.subscribe("Nebula::Widget::Uploader::MergeParam", $.proxy(this.subscribeMergeParam, this));
            $.subscribe("Nebula::Widget::Uploader::EmptyList", $.proxy(this.subscribeEmptyList, this));
            $.subscribe("Nebula::Widget::Uploader::LoadData", $.proxy(this.subscribeLoadData, this));
            $.subscribe("Nebula::Widget::Uploader::Refresh", $.proxy(this.subscribeRefresh, this));
            $.subscribe("Nebula::Widget::Uploader::Destroy", $.proxy(this.subscribeDestroy, this));
            $.subscribe("Nebula::Widget::Uploader::Init", $.proxy(this.subscribeInit, this));

            this.target
                .on("Nebula::Widget::Uploader::MergeQuery", $.proxy(this.handleEventUploaderMergeQuery, this))
                .on("Nebula::Widget::Uploader::MergeParam", $.proxy(this.handleEventUploaderMergeParam, this))
                .on("Nebula::Widget::Uploader::EmptyList", $.proxy(this.handleEventUploaderEmptyList, this))
                .on("Nebula::Widget::Uploader::LoadData", $.proxy(this.handleEventUploaderLoadData, this))
                .on("Nebula::Widget::Uploader::Refresh", $.proxy(this.handleEventUploaderRefresh, this))
                .on("Nebula::Widget::Uploader::Destroy", $.proxy(this.handleEventUploaderDestroy, this))
                .on("Nebula::Widget::Uploader::Init", $.proxy(this.handleEventUploaderInit, this))
                ;
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
            this.target.removeData(["signature", "widget"]);

            this.defaults = null;
            this.target = null;
            this.configs = null;
            this.query = null;
            this.param = null;
            this.uploader = null;
            this.downloader = null;
            this.label = null;
            this.files = null;
            this.controls = null;
            this.template = null;
            this.browseBtn = null;
            this.uploadBtn = null;
            this.outputUrl = null;
            this.submitUrl = null;
            this.dataSource = null;
            this.downloadable = null;
            this.loader = null;
            this.isInitialized = null;
            this.compatibility = null;
            this.widget = null;

            delete this.defaults;
            delete this.target;
            delete this.configs;
            delete this.query;
            delete this.param;
            delete this.uploader;
            delete this.downloader;
            delete this.label;
            delete this.files;
            delete this.controls;
            delete this.template;
            delete this.browseBtn;
            delete this.uploadBtn;
            delete this.outputUrl;
            delete this.submitUrl;
            delete this.dataSource;
            delete this.downloadable;
            delete this.loader;
            delete this.isInitialized;
            delete this.compatibility;
            delete this.widget;
        },

        // ***** PUBLIC METHODS *****
        //
        // [uploader.pubsub.subscribe] Nebula::Widget::Uploader::MergeQuery
        //
        subscribeMergeQuery: function(change, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return; }
            this.target.triggerHandler("Nebula::Widget::Uploader::MergeQuery", [change]);
        },

        //
        // [uploader.event.listen] Nebula::Widget::Uploader::MergeQuery
        //
        handleEventUploaderMergeQuery: function(evt, change) {
            $.extend(this.query, change);
        },

        //
        // [uploader.pubsub.subscribe] Nebula::Widget::Uploader::MergeParam
        //
        subscribeMergeParam: function(change, reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return; }
            this.target.triggerHandler("Nebula::Widget::Uploader::MergeParam", [change]);
        },

        //
        // [uploader.event.listen] Nebula::Widget::Uploader::MergeParam
        //
        handleEventUploaderMergeParam: function(evt, change) {
            $.extend(this.param, change);
        },

        //
        // [uploader.pubsub.subscribe] Nebula::Widget::Uploader::EmptyList
        //
        subscribeEmptyList: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return; }
            this.target.triggerHandler("Nebula::Widget::Uploader::EmptyList");
        },

        //
        // [uploader.event.listen] Nebula::Widget::Uploader::EmptyList
        //
        handleEventUploaderEmptyList: function() {
            $(this.files[0]).find("li").remove();
        },

        //
        // [uploader.pubsub.subscribe] Nebula::Widget::Uploader::LoadData
        //
        subscribeLoadData: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return; }
            this.target.triggerHandler("Nebula::Widget::Uploader::LoadData");
        },

        //
        // [uploader.event.listen] Nebula::Widget::Uploader::LoadData
        //
        handleEventUploaderLoadData: function() {
            if (!this.dataSource) {
                return;
            }
            this.xhrLoadData();
        },

        //
        // [uploader.pubsub.subscribe] Nebula::Widget::Uploader::Refresh
        //
        subscribeRefresh: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return; }
            this.target.triggerHandler("Nebula::Widget::Uploader::Refresh");
        },

        //
        // [uploader.event.listen] Nebula::Widget::Uploader::Refresh
        //
        handleEventUploaderRefresh: function() {
            this.uploader.refresh();
        },

        //
        // [uploader.pubsub.subscribe] Nebula::Widget::Uploader::Init
        //
        subscribeInit: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return; }
            this.target.triggerHandler("Nebula::Widget::Uploader::Init");
        },

        //
        // [uploader.event.listen] Nebula::Widget::Uploader::Init
        //
        handleEventUploaderInit: function() {
            if (this.isInitialized) {
                return;
            }
            this.uploader = new plupload.Uploader(this.configs);
            this.uploader.init();
        },

        //
        // [uploader.pubsub.subscribe] Nebula::Widget::Uploader::Destroy
        //
        subscribeDestroy: function(reference, publisher) {
            if (!this.isReferenceMatched(reference)) { return; }
            this.target.triggerHandler("Nebula::Widget::Uploader::Destroy");
        },

        //
        // [uploader.event.listen] Nebula::Widget::Uploader::Destroy
        //
        handleEventUploaderDestroy: function() {
            if (!this.isInitialized) {
                return;
            }
            this.uploader.destroy();
            this.uploader = null;
        },

        // [plupload.event.listen] Init
        handleInit: function(uploader) {
            this.isInitialized = true;

            if (uploader.runtime == "html4") {
                this.compatibility.show();
                this.controls.hide();
            }
        },

        // [plupload.event.listen] PostInit
        handlePostInit: function(uploader) {
            var wdgt = this, li;

            wdgt.files.on("click", "li > button", function(_evt) {
                li = $(_evt.target).closest("li");
                // uploader.removeFile(li.data("uploaderFile"));
                wdgt.xhr({
                    method: "POST",
                    url: wdgt.submitUrl,
                    data: {attachmentId: li.data("attachmentId"), type: "delete"},
                    beforeSend: function() {
                        li.remove();
                    },
                    done: function(d) {
                        if (d.error) {
                            return;
                        }
                        wdgt.target.triggerHandler(
                            "Nebula::Widget::Uploader::FileDeleted", [this, li, uploader, d]);
                    }
                });
            });
        },

        // [plupload.event.listen] Destroy
        handleDestroy: function() {
            this.isInitialized = false;
        },

        // [plupload.event.listen] FilesAdded
        handleFilesAdded: function(uploader, files) {
            var wdgt = this, li;

            $.each(files, function(_, file) {
                li = wdgt.template.clone().prop("id", file.id).html(function(_, html) {
                    return html.format(
                        "hourglass-icon-16",
                        file.name,
                        plupload.formatSize(file.size),
                        file.name
                    );
                }).data("uploaderFile", file).prependTo(wdgt.files);
                W.Factory.popover($("> button", li), {
                    placement: "left", style: "warning"
                });
                setTimeout(function() {
                    uploader.start();
                }, 10);
            });
        },

        // [plupload.event.listen] FileUploaded
        handleFileUploaded: function(uploader, file, response) {
            var wdgt = this,
                li = $(wdgt.files[0]).find("[id=" + file.id + "]"),
                json = $.parseJSON(response.response);

            setTimeout(function() {
                if (!wdgt.downloadable) {
                    return;
                }

                $(".status", li)
                    .removeClass("hourglass-icon-16")
                    .addClass("attachment-icon-16");
                $(".progress", li).hide();
                $("> button", li).show();
                if (json.result && json.result.length) {
                    wdgt.setupDownloadWatch(li.data("attachmentId", json.result[0].attachmentId));
                }
            }, 10);

            $.publish(
                "Nebula::Widget::Uploader::FileUploaded", [this, li, json, uploader, file, response]);
            this.target.triggerHandler(
                "Nebula::Widget::Uploader::FileUploaded", [this, li, json, uploader, file, response]);
        },

        // [plupload.event.listen] BeforeUpload
        handleBeforeUpload: function(uploader, file) {
            uploader.setOption('multipart_params', this.param);
            $.publish(
                "Nebula::Widget::Uploader::BeforeUpload", [this, uploader, file]);
            this.target.triggerHandler(
                "Nebula::Widget::Uploader::BeforeUpload", [this, uploader, file]);
        },

        // [plupload.event.listen] UploadProgress
        handleUploadProgress: function(uploader, file) {
            $(this.files[0])
                .find("#" + file.id + " .progress .bar")
                .css("width", file.percent + "%")
                .text(file.percent + "%");
        },

        // [plupload.event.listen] UploadComplete
        handleUploadComplete: function(uploader, files) {
            // var wdgt = this, li;
            // $.each(files, function(_, file) {
            //     li = $("#" + file.id, wdgt.files);
            //     setTimeout(function() {
            //         $(".status", li)
            //             .removeClass("hourglass-icon-16")
            //             .addClass("attachment-icon-16");
            //         $(".progress", li).hide();
            //         $("> button", li).show();
            //     }, 10);
            // });
            $.publish(
                "Nebula::Widget::Uploader::UploadComplete", [this, uploader, files]);
            this.target.triggerHandler(
                "Nebula::Widget::Uploader::UploadComplete", [this, uploader, files]);
        },

        // [plupload.event.listen] Error
        handleError: function(uploader, error) {
            N.Util.Feedback.error(
                "An error occurred while uploading files: [{0}] {1}".format(
                    error.code, error.message
                )
            );
        },

        xhrLoadData: function() {
            var wdgt = this,
                prnt = wdgt.target.closest(".eS-enhanced-modal"),
                li, btn, prg;

            wdgt.xhr({
                method: "GET",
                url: wdgt.dataSource,
                data: wdgt.query,
                beforeSend: function() {
                    W.Factory.spinner($(".spinner-24", wdgt.loader.show())).play();
                },
                done: function(d) {
                    if (!d.data || !d.data.length) {
                        return;
                    }
                    $.each(d.data, function(_, file) {
                        li = wdgt.template.clone().data({
                            attachmentId: file.attachmentId,
                            uploaderFile: null
                        }).prop({
                            id: file.attachmentId
                        }).html(function(_, html) {
                            return html.format(
                                "attachment-icon-16",
                                file.filename,
                                plupload.formatSize(file.filesize),
                                file.filename
                            );
                        }).appendTo(wdgt.files);

                        prg = $(li[0]).find(".progress").hide();
                        btn = $(li[0]).find("> button").show();
                        W.Factory.popover($(li[0]).find("> button"), {
                            placement: "left", style: "warning"
                        });

                        wdgt.setupDownloadWatch(li.data("attachmentId", file.attachmentId));
                    });
                },
                always: function() {
                    W.Factory.spinner($(wdgt.loader.hide()[0]).find(".spinner-24")).stop();
                    // if uploader is inside a enhanced modal then trigger the modal
                    // to resize (and relocate) itself after file list loading is done.
                    if (prnt.length > 0) {
                        prnt.triggerHandler("Nebula::EnhancedModal::Resize");
                    }
                }
            });
        },

        setupDownloadWatch: function(li) {
            var wdgt = this,
                dld = new N.Util.DownloadWatch(),
                btn = $(li[0]).find("> button"),
                msg = $(li[0]).find(".message"),
                img = $(msg[0]).find("img"),
                txt = $(msg[0]).find("span");
            $(li[0]).find(".filename").html(function(_, html) {
                return $(
                    document.createElement("a")
                ).prop({
                    href: "#"
                }).on("click", function(e) {
                    dld.setAttempts(60);
                    wdgt.downloader.prop({
                        src: wdgt.outputUrl.format(
                            li.data("attachmentId"),
                            dld.getToken(null, true)
                        )
                    });
                    dld.watch(function() {
                        $(wdgt.files).find("li.fetching .message").hide();
                        $(wdgt.files).find("li.fetching > button").show();
                        li.addClass("fetching");
                        btn.hide();
                        msg.show();
                        img.show();
                        txt.text("Fetching file...");
                    }, function() {
                        li.removeClass("fetching");
                        msg.hide();
                        btn.show();
                    });
                    return false;
                }).html(html);
            });
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Widget));
