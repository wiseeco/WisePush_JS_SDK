/**
 * wef.push.js
 * WEF Push library
 * @since 2013. 05. 22.
 * @version 0.1
 * @author sjune@wiseeco.com
 * @last_modified
 */
var WEF = WEF || {};
WEF.Push = (function () {
    "use strict";
    var URI = "http://www.wiseeco.com:1884",    // host URI
        STREAM_TIMEOUT = 10000, RETRY_DELAY = 500,

        isDefined = function (o) {
            return typeof o !== 'undefined';
        },
        isFunction = function (o) {
            return typeof o === 'function';
        },

        ids = {},
        dataCallback = null,
        errorCallback = null,
        pollxhr = null,
        pollxhrRepeat = false,
        pollTimer = null,
        timedout = false,
        streamTimer = null,

        stop = function () {
            pollxhrRepeat = false;
            if (pollxhr !== null) {
                pollxhr.abort();
            }
        },

        reset = function () {
            stop();
            ids = {};
        },

        polling = function () {
            var i, lines, pair = 0, topic = 0, obj;
            pollxhr = new XMLHttpRequest();
            pollxhr.onreadystatechange = function () {
                if (pollxhr.readyState === 4) {
                    if (pollxhr.status === 200) {
                        clearTimeout(streamTimer);
                        if (null !== dataCallback) {
                            lines = pollxhr.responseText.split(/\r\n/);
                            for (i = 0; i < lines.length; i++) {
                                try {
                                    obj = JSON.parse(lines[i]);
                                    for (pair in obj) {
                                        for (topic in obj[pair]) {
                                            if (null != dataCallback) {
                                                dataCallback(topic, obj[pair][topic]);
                                            }
                                        } // end of for
                                    } // end of for
                                } catch (e) {
                                    reset();
                                    if (null != errorCallback) {
                                        errorCallback('bad JSON response.');
                                    }
                                } // end of trycatch
                            }
                        }
                        if (pollxhrRepeat) {
                            pollTimer = setTimeout(function () {
                                polling();
                            }, RETRY_DELAY);
                        }
                    } else {
                        if (!timedout && pollxhrRepeat) {
                            reset();
                            if (null != errorCallback) {
                                errorCallback(pollxhr.statusText, pollxhr.responseText);
                            }
                        }
                    }
                }
            };

            streamTimer = setTimeout(function () {
                timedout = true;
                pollxhr.abort();
                clearTimeout(pollTimer);
                timedout = false;
                if (pollxhrRepeat) {
                    setTimeout(function () {
                        polling();
                    }, RETRY_DELAY);
                }
            }, STREAM_TIMEOUT);

            pollxhr.open('POST', URI + '/stream', true);
            pollxhr.send(JSON.stringify(ids));
        },

        start = function () {
            pollxhrRepeat = true;
            polling();
        };

    reset();

    return {
        stream: function () {
            stop();
            start();
        },

        subscribe: function (topic, cbs) {
            var req = new XMLHttpRequest();
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var o = JSON.parse(req.responseText);
                        ids[o.id] = o.seckey;
                        if (isDefined(cbs) && isDefined(cbs.success)) {
                            cbs.success();
                        }
                    } else {
                        if (isDefined(cbs) && isDefined(cbs.error)) {
                            cbs.error(req.statusText, req.responseText);
                        }
                        reset();
                        if (null != errorCallback) {
                            errorCallback();
                        }
                    }
                }
            };
            req.open('POST', URI + '/subscribe', true);
            req.send(JSON.stringify([topic]));
        },

        publish: function (topic, msg, cbs) {
            var o = {};
            o[topic] = ((typeof msg === 'string')) ? msg : JSON.stringify(msg);
            var req = new XMLHttpRequest();
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        if (isDefined(cbs) && isDefined(cbs.success)) {
                            cbs.success(topic, msg);
                        }
                    } else {
                        if (isDefined(cbs) && isDefined(cbs.error)) {
                            cbs.error(textStatus, errorThrown);
                        }
                        reset();
                        if (null != errorCallback) {
                            errorCallback();
                        }
                    }
                }
            };
            req.open('POST', URI + '/publish', true);
            req.send(JSON.stringify(o));
        },

        register: function (cbs) {
            if (isDefined(cbs)) {
                if (isFunction(cbs.ready)) {
                    cbs.ready();
                }
                if (isDefined(cbs.data)) {
                    dataCallback = cbs.data;
                }
                if (isDefined(cbs.error)) {
                    errorCallback = cbs.error;
                }
            }
        }
    };
})();
