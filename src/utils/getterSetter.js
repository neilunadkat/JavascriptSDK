"use strict";

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind= function(owner) {
        var that= this;
        if (arguments.length<=1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args= Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim= function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}


// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf= function(find, i /*opt*/) {
        if (i===undefined) i= this.length-1;
        if (i<0) i+= this.length;
        if (i>this.length-1) i= this.length-1;
        for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach= function(action, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter= function(filter, that /*opt*/) {
        var other= [], v;
        for (var i=0, n= this.length; i<n; i++)
            if (i in this && filter.call(that, v= this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}
if (!('find' in Array.prototype)) {
    Array.prototype.find = function(mapper, that /*opt*/) {
        var list = this;
        var length = list.length;
        if (length === 0) return undefined;
        for (var i = 0, value; i < length && i in list; i++) {
          value = list[i];
          if (predicate.call(that, value, i, list)) return value;
        }
        return undefined;
    }
}
if (!('each' in Array.prototype)) {
    Array.prototype.each = function(callback){
        for (var i =  0; i < this.length; i++){
            callback(this[i]);
        }
    }
}
Array.prototype.pluck = function(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
};
Array.prototype.sortBy = function(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index, this)
      };
    }, this).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
};


// Override only if native toISOString is not defined
if ( !Date.prototype.toISOString ) {
    ( function() {

        function pad(number) {
            var r = String(number);
            if ( r.length === 1 ) {
                r = '0' + r;
            }
            return r;
        }

        Date.prototype.toISOString = function() {
            return this.getUTCFullYear()
                + '-' + pad( this.getUTCMonth() + 1 )
                + '-' + pad( this.getUTCDate() )
                + 'T' + pad( this.getUTCHours() )
                + ':' + pad( this.getUTCMinutes() )
                + ':' + pad( this.getUTCSeconds() )
                + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
                + 'Z';
        };

    }() );
};

String.addSlashes = function (str) {
    if (!str) return str;
    str = str.replace(/\\/g, '\\\\');
    str = str.replace(/\'/g, '\\\'');
    str = str.replace(/\"/g, '\\"');
    str = str.replace(/\0/g, '\\0');
    return str;
};

String.stripSlashes = function (str) {
    if (!str) return str;
    str = str.replace(/\\'/g, '\'');
    str = str.replace(/\\"/g, '"');
    str = str.replace(/\\0/g, '\0');
    str = str.replace(/\\\\/g, '\\');
    return str;
};

if (typeof console === 'undefined' || console === null) {
    console = { log: function() {}, dir: function() {} };
}

var _type = function (o) {

    // handle null in old IE
    if (o === null || typeof o === 'undefined' || o === 'undefined') {
        return 'null';
    }

    // handle DOM elements
    if (o && (o.nodeType === 1 || o.nodeType === 9)) {
        return 'element';
    }

    var s = Object.prototype.toString.call(o);
    var type = s.match(/\[object (.*?)\]/)[1].toLowerCase();

    // handle NaN and Infinity
    if (type === 'number') {
        if (isNaN(o)) {
            return 'nan';
        }
        if (!isFinite(o)) {
            return 'infinity';
        }
    }

    return type;
};

var types = [
    'Null',
    'Undefined',
    'Object',
    'Array',
    'String',
    'Number',
    'Boolean',
    'Function',
    'RegExp',
    'Element',
    'NaN',
    'Infinite'
];

var generateMethod = function (t) {
    _type['is' + t] = function (o) {
        return _type(o) === t.toLowerCase();
    };
};

for (var i = 0; i < types.length; i++) {
    generateMethod(types[i]);
}

_type['isNullOrUndefined'] = function(o) {
    return _type(o) == 'null' || _type(o) == 'undefined';
};

_type['isNumeric'] = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};

var _clone = function(obj) {
    if (!_type.isObject(obj)) return obj;
    return _type.isArray(obj) ? obj.slice() : _extend({}, obj);
};

Array.prototype.removeAll = function(obj){
    // Return null if no objects were found and removed
    var destroyed = null;

    for(var i = 0; i < this.length; i++){

        // Use while-loop to find adjacent equal objects
        while(this[i] === obj){

            // Remove this[i] and store it within destroyed
            destroyed = this.splice(i, 1)[0];
        }
    }

    return destroyed;
};

// attach the .compare method to Array's prototype to call it on any array
Array.prototype.compare = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].compare(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array, strict) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // set strict mode as false 
    if (arguments.length == 1)
        strict = false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0; i < this.length; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i], strict))
                return false;
        }
        else if (strict && this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
        else if (!strict) {
            return this.sort().equals(array.sort(), true);
        }
    }
    return true;
};