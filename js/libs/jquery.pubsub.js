/*!
 * NGeS PubSub / Observer Pattern Library v1.0.0
 * http://10.206.192.161:7990/projects/NGES/repos/mod-nges
 *
 * Author [Anonymous Auther]
 */
; (function($) {
    "use strict";

    // An object that stores the topic/subscription hash
    // @var Object
    var cache = {};

    // Publish some data on a named topic.
    //
    // @param String topic
    // @param Array|null args
    // @return void
    // @example
    //   Publish stuff on "/some/topic". Anything subscribed will be called
    //   with a function signature like: function(a, b, c) { ... }
    //   <code>
    //     $.publish("/some/topic", ["a","b","c"]);
    //   </code>
    $.publish = function publish(topic, args) {
        var r = [];
        cache[topic] && $.each(cache[topic], function() {
            r.push(
                this.apply($, args || [])
            );
        });
        return (r.length === 0) ?
            null : ((r.length == 1) ? r[0] : r);
    };

    // Register a callback on a named topic.
    //
    // @param String topic -The channel to subscribe to
    // @param Function callback - The handler event. Anytime something is $.publish'ed
    //                            on a subscribed channel, the callback will be called
    //                            with the published array as ordered arguments.
    // @return Array - A handle which can be used to unsubscribe this particular
    //                 subscription.
    // @example
    //   <code>
    //     $.subscribe("/some/topic", function(a, b, c){ /* handle data */ });
    //   </code>
    $.subscribe = function subscribe(topic, callback) {
        if (!cache[topic]) {
            cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback];
    };

    // Disconnect a subscribed function for a topic.
    //
    // @param Array handle - The return value from a $.subscribe call.
    // @return void
    // @example
    //   <code>
    //     var handle = $.subscribe("/something", function(){});
    //     $.unsubscribe(handle);
    //   </code>
    $.unsubscribe = function unsubscribe(handle) {
        var t = handle[0];
        cache[t] && $.each(cache[t], function(idx) {
            if (this == handle[1]) {
                cache[t].splice(idx, 1);
            }
        });
    };
})(jQuery);
