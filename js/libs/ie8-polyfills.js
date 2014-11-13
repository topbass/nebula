
/* jshint -W097 */

"use strict";

Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
};

Array.prototype.filter = function(fun /*, thisArg */) {
    if (this === void 0 || this === null)
        throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;

    if (typeof fun !== "function")
        throw new TypeError();

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;

    for (var i = 0; i < len; i++) {
        if (i in t) {
            var val = t[i];
            if (fun.call(thisArg, val, i, t)) res.push(val);
        }
    }

    return res;
};
