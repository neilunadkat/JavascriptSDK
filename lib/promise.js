/* 
 * Copyright (c) 2012 Kaerus (kaerus.com), Anders Elo <anders @ kaerus com>.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    var setImmediate;

    if (Appacitive.runtime.isNode) {
        setImmediate = process.nextTick;
    } else {
        setImmediate = setTimeout;
    }

    var PROMISE = 0,
        FULFILLED = 1,
        REJECTED = 2;

    var Promise = function() {

        if (!(this instanceof Promise)) return new Promise();

        this.calls = [];
    };

    Promise.prototype.isResolved = function() {
        if (this.state === 1) return true;
        return false;
    };

    Promise.prototype.isRejected = function() {
        if (this.state === 2) return true;
        return false;
    };

    Promise.prototype.isFulfilled = function() {
        if (this.state === 1 || this.state === 2) return true;
        return false;
    };

    Promise.prototype.done = function() {
        var then, promise, res, state = this.state,
            value = this.value;

        if (!state) return this;

        while (then = this.calls.shift()) {
            promise = then[PROMISE];

            if (typeof then[state] === 'function') {

                try {
                    if (state === REJECTED) {
                        value = then[state].call(promise, this.value);
                    } else {
                        value = then[state].apply(promise, this.value);
                    }
                } catch (error) {
                    var err = {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    };
                    Appacitive.logs.logException(err);

                    if (promise.calls.length == 0) throw error;
                    else promise.reject(error);
                }

                if (value instanceof Promise || (value && typeof value.then === 'function')) {
                    /* assume value is thenable */
                    value.then(function(v) {
                        promise.fulfill(v);
                    }, function(r) {
                        promise.reject(r);
                    });
                } else {
                    if (state === FULFILLED)
                        promise.fulfill(value);
                    else
                        promise.reject(value);
                }
            } else {
                if (state === FULFILLED)
                    promise.fulfill(value);
                else
                    promise.reject(value);
            }
        }
    };

    Promise.prototype.fulfill = function(value) {
        if (this.state) return this;

        this.state = FULFILLED;

        this.reason = this.value = [].slice.call(arguments);

        this.done();

        return this;
    };

    Promise.prototype.resolve = Promise.prototype.fulfill;

    Promise.prototype.reject = function(value) {
        if (this.state) return this;

        this.state = REJECTED;

        this.reason = this.value = value;

        this.done();

        return this;
    };

    Promise.prototype.then = function(onFulfill, onReject) {
        var self = this,
            promise = new Promise();

        this.calls[this.calls.length] = [promise, onFulfill, onReject];

        if (this.state) {
            setImmediate(function() {
                self.done();
            });
        }

        return promise;
    };

    Promise.when = function(task) {

        var values = [],
            reasons = [],
            total, numDone = 0;

        var promise = new Promise();

        /* If no task found then simply fulfill the promise */
        if (!task || (_type.isArray(task) && task.length == 0)) {
            promise.fulfill(values);
            return promise;
        }

        /* Check whether all promises have been resolved */
        var notifier = function() {
            numDone += 1;
            if (numDone == total) {
                if (!promise.state) {
                    if (reasons.length > 0) {
                        promise.reject(reasons, values ? values : []);
                    } else {
                        promise.fulfill(values ? values : []);
                    }
                }
            }
        };

        /* Assign callbacks for task depending on its type (function/promise) */
        var defer = function(i) {
            var value;
            var proc = task[i];
            if (proc instanceof Promise || (proc && typeof proc.then === 'function')) {
                setImmediate(function() {
                    /* If proc is a promise, then wait for fulfillment */
                    proc.then(function(value) {
                        values[i] = value;
                        notifier();
                    }, function(reason) {
                        reasons[i] = reason;
                        notifier();
                    });
                });
            } else {
                setImmediate(function() {
                    /* Call the proc and set values/errors and call notifier */
                    try {
                        values[i] = proc.call();
                    } catch (e) {
                        reasons[i] = e;
                    }
                    notifier();
                });
            }
        };

        /* Single task */
        if (!_type.isArray(task)) {
            task = [task];
        }

        /* Set count for future notifier */
        total = task.length;

        /* Iterate over all task */
        for (var i = 0; i < total; i = i + 1) {
            defer(i);
        }

        return promise;
    };

    Promise.is = function(p) {
        if (p instanceof Promise) return true;
        return false;
    };

    Promise.buildPromise = function(options) {
        var promise = new Promise();

        if (_type.isObject(options)) {
            promise.then(options.success, options.error);
        }
        return promise;
    };

    Promise._continueUntil = function(iterator, func) {
        if (_type.isFunction(iterator) && iterator()) {
            return func().then(function() {
                return Promise._continueUntil(iterator, func);
            });
        }
        return new Promise().fulfill();
    };

    Appacitive.Promise = Promise;

})(global);
