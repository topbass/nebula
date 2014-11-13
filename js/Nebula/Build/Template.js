/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Build");

Nebula.Build.Template = (function(window, $, N, B, undefined) {
    var parent = N.Core.Abstract;

    var self = function(target) {
        // ***** PUBLIC PROPERTIES *****
        this.target   = $(target);
        this.template = null;

        // ***** CALL ***** parent constructor
        parent.call(this);

        // ***** CALL ***** local constructor
        this.initialize();
    };

    // ***** EXTEND ***** parent class
    self.inherit(parent);

    // ***** PUBLIC _STATIC_ PROPERTIES *****

    // ***** PUBLIC _STATIC_ METHODS *****
    self.load =
    function load(target) {
        var tgt = $(target), idx, cbk,
            arg = Array.prototype.slice.call(arguments);

        return Q.Promise(function(resolve, reject, notify) {
            arg.shift();
            tgt.data("initialLoad", true);

            if (tgt.data("partialLoaded") === true && tgt.data("partialUrl") == arg[0]) {
                resolve(tgt.data("initialLoad", false));
                return;
            }

            idx = arg.length - 1;
            cbk = arg[idx];

            if (typeof cbk != "function") {
                idx += 1;
                cbk = null;
            }

            arg[idx] = function(res, sts, xhr) {
                if (sts == "error") {
                    reject(new Error("An error occurred while loading the partial template [" +
                        arg[0] + "]. Error: " + xhr.status + " - " + xhr.statusText));
                } else {
                    N.Build.Run.buildPartial(tgt);
                    tgt.data({
                        partialLoaded: true,
                        partialUrl: arg[0]
                    });
                    if (typeof cbk == "function") {
                        cbk.call(this, res, sts, xhr, {
                            resolve: resolve,
                            reject: reject,
                            notify: notify
                        });
                    } else
                        resolve(tgt);
                }
            };

            tgt.empty().load.apply(tgt, arg);
        });
    };

    self.force =
    function force(target) {
        $(target).removeData(["partialLoaded", "partialUrl"]);
        return self.load.apply(this, Array.prototype.slice.call(arguments));
    };

    self.unload =
    function unload(target) {
        return N.Build.Run.unbuildPartial($(target).empty());
    };

    // ***************************************************************************
    // end of public static methods, below starts public methods which can only
    // be invoked by an instantiated instance of Nebula.Build.Template or its child
    // classes
    // ***************************************************************************

    self.prototype = $.extend(self.prototype, {
        // ***** CONSTRUCTOR *****
        initialize: function() {
        },

        // ***** DESTRUCTOR *****
        destruct: function() {
        },

        // ***** PUBLIC METHODS *****
        load: function() {
            return self.load.apply(this,
                [this.target].concat(Array.prototype.slice.call(arguments)));
        },

        force: function() {
            return self.load.apply(this,
                [this.target].concat(Array.prototype.slice.call(arguments)));
        },

        unload: function() {
            return self.unload(this.target);
        }
    });

    return self;
}(window, jQuery, Nebula, Nebula.Build));
