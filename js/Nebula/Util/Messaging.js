/*!
 * Nebula JavaScript Framework
 * https://github.com/waltzofpearls/nebula
 *
 * Copyright (c) 2014 Topbass Labs (topbasslabs.com)
 * Author Waltz.of.Pearls <rollie@topbasslabs.com, rollie.ma@gmail.com>
 */
Nebula.Register("Nebula.Util");

Nebula.Util.Messaging = (function($, Util) {

    // Private static properties and methods
    var _debug = false;
    var _httpHostRegex = /^https?:\/\/([^\/]+)/;

    var _extractHttpHost = function(url) {
        var matches = url.match(_httpHostRegex);
        return (matches !== null) ? matches[1] : "";
    };

    var _isValidOrigin = function(origin, validHost) {
        return (_extractHttpHost(origin) == validHost);
    };

    var _triggerError = function(errorType, context) {
        $(window).trigger("error", [errorType, context]);
    };

    var _defaultErrorHandler = function(event, errorType, context) {
        var errorMessage = errorType + " - " + context;
        if (!_debug || console === undefined) {
            return;
        }
        if (console.debug !== undefined) {
            console.debug(errorMessage);
        } else {
            console.log(errorMessage);
        }
    };

    // Public static properties and methods
    return {
        // Extract HTTP host from a given URL
        // 
        // @param url string
        // @return string
        extractHttpHost: function(url) {
            return _extractHttpHost(url);
        },

        // Check if the message event origin is from valid host
        // 
        // @param origin string - event.originalEvent.origin
        // @param validHost string - valid http host
        // @return bool
        isValidOrigin: function(origin, validHost) {
            return _isValidOrigin(origin, validHost);
        },

        // Post message to different DOM frame/target that are crossing
        // different domains
        // 
        // @param message string - message that is going to be posted
        // @param target string - DOM target, i.e. top, parent or securepay
        // @return void
        post: function(message, target) {
            target = target || "top";
            // Good browsers \o/
            if (!! window.postMessage) {
                window[target].postMessage(message, "*");
            }
            // Bad browsers /o\
            else {
                _triggerError("BrowserNotSupportPostMessage", JSON.stringify($.browser));
            }
        },

        // Listen, receive message and execute callback function
        // with received messages
        // 
        // @param validHost string - valid http host, i.e. zynga-rollie.giftingapp.com
        // @param callback function - callback function
        // @return void
        receive: function(validHost, callback) {
            $(window).on("message", function(event) {
                event = (event.data !== undefined) ?
                    event : event.originalEvent;
                if (validHost == _isValidOrigin(event.origin, validHost)) {
                    callback(event.data);
                } else {
                    _triggerError("InvalidHttpHost", event.origin);
                }
            });
        },

        // Listen, receive message and apply object method that is specified
        // in the received message (JSON format)
        // 
        // @param validHost string - valid http host, i.e. zynga-rollie.giftingapp.com
        // @param object object - callback object, i.e. Checkout, SecurePay
        // @return void
        receiveAndApply: function(validHost, object) {
            $(window).on("message", function(event) {
                var json = {};
                event = (event.data !== undefined) ?
                    event : event.originalEvent;
                if (_isValidOrigin(event.origin, validHost)) {
                    try {
                        json = $.parseJSON(event.data);
                    } catch (SyntaxError) {
                        _triggerError("JqueryParseJsonReturnNull", event.data);
                    }
                    if (json === null) {
                        _triggerError("JqueryParseJsonReturnNull", event.data);
                    }
                    if (("method" in json) && ("data" in json) && object[json.method]) {
                        object[json.method](event, json.data);
                    } else {
                        _triggerError("MethodOrDataNotExists", event.data);
                    }
                } else {
                    _triggerError("InvalidHttpHost", event.origin);
                }
            });
        },

        // Reply to event source which the original message is posted from
        // 
        // @param message string - message that is going to be posted
        // @param originalEvent object - event.originalEvent from the original message
        //        that initiates the postMessage call
        // @return void
        reply: function(message, originalEvent) {
            // Good browsers \o/
            if (!! window.postMessage) {
                originalEvent.source.postMessage(message, originalEvent.origin);
            }
            // Bad browsers /o\
            else {
                _triggerError("BrowserNotSupportReplyMessage", JSON.stringify($.browser));
            }
        },

        // Trigger error that will be handled by jquery onerror event handler
        // 
        // @param errorType string
        // @param context string
        // @return void
        triggerError: function(errorType, context) {
            _triggerError(errorType, context);
        },

        // Handle error triggered by triggerError method on $(window)
        // 
        // @param errorHandler function (or object) - if errorHandler is a function,
        //        then it will globally handle all the triggered errors, otherwise,
        //        the method will try to find matched handler in the JSON object
        //        errorHandler to handle the specific error
        // @return void
        handleErrors: function(errorHandler) {
            switch (typeof errorHandler) {
                case "function":
                    $(window).on("error", function(event, errorType, context) {
                        errorHandler(event, errorType, (context || ""));
                    });
                    break;
                case "object":
                    $(window).on("error", function(event, errorType, context) {
                        $.each(errorHandler, function(type, handler) {
                            if (errorType == type) {
                                handler(event, errorType, (context || ""));
                            }
                        });
                    });
                    break;
                default:
                    $(window).on("error", _defaultErrorHandler);
                    break;
            }
        },

        // Default error handler that will print out error message
        // as basic error handling
        //
        // @param event object - event object
        // @param errorType string - error type name
        // @param context string - error context
        // @return void
        defaultErrorHandler: function(event, errorType, context) {
            _defaultErrorHandler(event, errorType, context);
        },

        // Set debug mode
        //
        // @param isDebug boolean - debug mode status, true => on and false => off
        // @return bool
        debug: function(isDebug) {
            if (isDebug !== undefined) {
                _debug = (!! isDebug);
            }
            return _debug;
        }
    };

}(jQuery, Nebula.Util));
