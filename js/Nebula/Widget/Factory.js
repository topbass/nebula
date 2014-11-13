/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Widget");
Nebula.Register("Nebula.Cache.Widget");

Nebula.Widget.Factory = (function(window, $, N, W, undefined) {
    "use strict";

    // ====== Private static properties and methods ======

    function _self() {
        return W.Factory;
    }

    function _init() {
    }

    function _destruct() {
        for (var signature in N.Cache.Widget) {
            N.Cache.Widget[signature].destruct();
        }
        N.Cache.Widget = null;
        delete N.Cache.Widget;
    }

    function _readData(target, prefix) {
        var key, newKey, configs = {}, data = $(target).data();
        for (key in data) {
            if (key.substring(0, prefix.length) != prefix) {
                continue;
            }
            newKey = key.substring(prefix.length);
            newKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
            configs[newKey] = data[key];
        }

        return configs;
    }

    function _dataToQuery(data) {
        var query = {}, param;
        $.each(data, function(key, value) {
            param = value.strstr(":", true);
            if (!param) {
                query[key] = value;
            } else {
                query[param] = value.strstr(":").substring(1);
            }
        });

        return query;
    }

    function _build() {
        var args = Array.prototype.slice.call(arguments),
            callback = args.shift(),
            targets = args.shift();
        $.each(targets, function() {
            var i, j, params = [$(this)].concat(args);
            for (i = 0, j = params.length; i < j; i++) {
                if (typeof params[i] != "function") {
                    continue;
                }
                params[i] = params[i].call(this, this);
            }
            callback.apply($, params);
        });
    }

    //
    // @param Function func
    // @param String|Object target
    // @param mixed arguments[0 - n]
    // @return Object
    //
    function _instance(func, target) {
        var args = [], instance = null,
            signature = $(target).data("signature");
        if (typeof signature != "undefined" && signature !== null) {
            return Nebula.Cache.Widget[signature];
        }
        (args = Array.prototype.slice.call(arguments)).shift();
        instance = Nebula.Instance.apply(this, [func].concat(args));
        Nebula.Cache.Widget[instance.getSignature()] = instance;
        return instance;
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _toolbar(target, configs) {
        return _instance(W.Toolbar, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs    [optional]
    // @param Object|Array data [optional]
    // @return Object
    //
    function _grid(target, configs, data) {
        return _instance(W.Grid, target, configs, data);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _editor(target, configs) {
        return _instance(W.Editor, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _expander(target, configs) {
        return _instance(W.Expander, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _spinner(target, configs) {
        return _instance(W.Spinner, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _tooltip(target, configs) {
        return _instance(W.Tooltip, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _popover(target, configs) {
        return _instance(W.Popover, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @param Object extras  [optional]
    // @return Object
    //
    function _modal(target, configs, extras) {
        return _instance(W.Modal, target, configs, extras);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _calendar(target, configs) {
        return _instance(W.Calendar, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @param Object extras  [optional]
    // @return Object
    //
    function _combo(target, configs, extras) {
        return _instance(W.Combo, target, configs, extras);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @param Object extras  [optional]
    // @return Object
    //
    function _dropdown(target, configs, extras) {
        return _instance(W.Dropdown, target, configs, extras);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _validator(target, configs) {
        return _instance(W.Validator, target, configs);
    }

    //
    // @param String|Object target
    // @param Object configs [optional]
    // @return Object
    //
    function _uploader(target, configs) {
        return _instance(W.Uploader, target, configs);
    }

    function _objectToHtml(object) {
        return $(document.createElement("div")).append(object.clone()).remove().html();
    }

    // ====== Public static properties and methods ======
    return {
        init        : _init,
        destruct    : _destruct,
        readData    : _readData,
        dataToQuery : _dataToQuery,
        build       : _build,
        instance    : _instance,
        toolbar     : _toolbar,
        grid        : _grid,
        editor      : _editor,
        spinner     : _spinner,
        expander    : _expander,
        tooltip     : _tooltip,
        popover     : _popover,
        modal       : _modal,
        calendar    : _calendar,
        combo       : _combo,
        dropdown    : _dropdown,
        validator   : _validator,
        uploader    : _uploader,
        objectToHtml: _objectToHtml
    };
}(window, jQuery, Nebula, Nebula.Widget));
