
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

var setImmediate;

if (global.Appacitive.runtime.isNode) {
    setImmediate = process.nextTick;
} else {
    setImmediate = setTimeout;
}

var PROMISE = 0, FULFILLED = 1, REJECTED = 2;

var Promise = function () {

    if (!(this instanceof Promise)) return new Promise();

    this.calls = [];
};

Promise.prototype.resolve = function() {
    var then, promise, res, state = this.state, value = this.value;

    if (!state) return;

    while (then = this.calls.shift()) {
        promise = then[PROMISE];

        if (typeof then[state] === 'function') {
            
            try {
                value = then[state].call(promise, this.value);  
            } catch(error) {
                if (promise.catch) promise.catch(error, this.value);
                else promise.reject(error); 
            }

            if (value instanceof Promise || (value && typeof value.then === 'function') )  {
                /* assume value is thenable */
                value.then(function(v){
                    promise.fulfill(v); 
                }, function(r){
                    promise.reject(r);
                });
            } else promise.fulfill(value);   
        } else {
            if (state === FULFILLED)
                promise.fulfill(value);
            else 
                promise.reject(value);
        }
    }
};

Promise.prototype.fulfill = function(value) {
    if (this.state) return;

    if(arguments.length > 1)
        value = [].slice.call(arguments);

    this.state = FULFILLED;
    this.value = value;

    this.resolve();

    return this;
}

Promise.prototype.reject = function(reason) {
    if(this.state) return;

    this.state = REJECTED;
    this.reason = this.value = reason;

    this.resolve();

    return this;
}

Promise.prototype.then = function(onFulfill,onReject) {
    var self = this, promise = new Promise();

    this.calls[this.calls.length] = [promise, onFulfill, onReject];

    if (this.state) {
        setImmediate(function(){
            self.resolve();
        });
    }    

    return promise;
}

Promise.prototype.spread = function(onFulfill,onReject) {

    function spreadFulfill(value) {
        if(!Array.isArray(value)) 
            value = [value];

        return onFulfill.apply(null,value);
    }   

    return this.then(spreadFulfill,onReject);
}

/* Allows us to defer & join tasks.            */
/* var tasks = [func1,func2,func3];            */
/* Promise.when(tasks)                         */
/*    .spread(function(ret1,ret2,ret3){...});  */   
Promise.when = function(task) {
    
    var values = [], reasons = [], total, numDone = 0;

    var promise = new Promise();

    /* If no task found then simply fulfill the promise */
    if (!task) {
        promise.fulfill(values);
        return promise;
    }

    /* Check whether all promises have been resolved */
    var notifier = function() {
        numDone += 1;
        if (numDone == total) {
            if (!promise.state) {
                if (reasons.length > 0) {
                    promise.reject(reasons, values);
                } else {
                    promise.fulfill(values);
                }
            }
        }
    }

    /* Assign callbacks for task depending on its type (function/promise) */
    var defer = function(i) {
        var value;
        var proc = task[i]
        if (proc instanceof Promise || (proc && typeof proc.then === 'function')){
            /* If proc is a promise, then wait for fulfillment */
            proc.then(function(value) {
                values[i] = value;
                notifier();
            }, function(reason) {
                reasons[i] = reason;
                notifier();
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
    if (!Array.isArray(task)) { 
        task = [task];
    }

    /* Set count for future notifier */
    total = task.length;

    /* Iterate over all task */
    for (var i = 0; i < total; i = i + 1) {
        defer(i);
    }

    return promise;
} 

global.Appacitive.Promise = Promise;

})(global);