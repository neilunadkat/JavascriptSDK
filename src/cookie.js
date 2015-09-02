(function (global) {

"use strict";

var Appacitive = global.Appacitive;

if (Appacitive.runtime.isBrowser) {

	var _cookieManager = function () {

		this.setCookie = function (name, value, minutes, erase) {
			name = Appacitive.getAppPrefix(name);
			var expires = '';
			if (minutes) {
				var date = new Date();
				date.setTime(date.getTime() + (minutes*60*1000));
				expires = "; expires=" + date.toGMTString();
			}

			if (!erase) {
				//for now lets make this a session cookie if it is not an erase
				if (!Appacitive.Session.persistUserToken) expires = '';
				else expires = "; expires=" +  new Date("2020-12-31").toGMTString();
			} else {
				expires = '; expires=Thu, 01-Jan-1970 00:00:01 GMT';
			}
			var domain = 'domain=' + window.location.hostname;
			if (window.location.hostname == 'localhost') domain = '';
			
			document.cookie = name + "=" + value + expires + "; path=/;" + domain;
		};

		this.readCookie = function (name) {
			name = Appacitive.getAppPrefix(name);
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for (var i=0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		};

		this.eraseCookie = function (name) {
			this.setCookie(name, "" ,-1, true);
		};

	};

	Appacitive.Cookie = new _cookieManager();

} else {
	var _cookieManager = function () {

	        this.setCookie = function (name, value) {
	                Appacitive.localStorage.set( 'cookie/' + name, value);
	        };

	        this.readCookie = function (name) {
	                return Appacitive.localStorage.get( 'cookie/' + name);
	        };

	        this.eraseCookie = function (name) {
	                Appacitive.localStorage.remove( 'cookie/' + name);
	        };

	};
	Appacitive.Cookie = new _cookieManager();
}

})(global);
