(function (global) {

	"use strict";

	var _getFacebookProfile = function(onSuccess, onError) {
		onSuccess = onSuccess || function() {};
		onError = onError || function(){};
		
		var r = new global.Appacitive.HttpRequest();
		r.method = 'get';
		r.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getGetAllLinkedAccountsUrl(this.get('__id'));
		r.onSuccess = function(d) {
			var fbUsername = null;
			if (d && d.identities && d.identities.length > 0) {
				var fb = d.identities.filter(function(identity) {
					return identity.authtype.toLowerCase() == 'facebook';
				});
				if (fb.length == 1) {
					fbUsername = fb[0].username;
				}
			}
			if (fbUsername !== null) {
				FB.api('/' + fbUsername, function(response) {
					if (response) {
						onSuccess(response);
					} else {
						onError();
					}
				});
			} else {
				onError();
			}
		};
		r.onError = function() {
			onError();
		};
		global.Appacitive.http.send(r);
	};

	global.Appacitive.Article = function(options, setSnapShot) {
		if (!options.__schematype && !options.schema )
			throw new error("Cannot set article without __schematype");

		if (options.schema) {
			options.__schematype = options.schema;
			delete options.schema;
		}
		
		var base = new global.Appacitive.BaseObject(options, setSnapShot);
		base.type = 'article';
		base.connectionCollections = [];
		base.getArticle = base.getObject;

		if (base.get('__schematype') && base.get('__schematype').toLowerCase() == 'user') {
			base.getFacebookProfile = _getFacebookProfile;
		}

		return base;
	};

	global.Appacitive.BaseObject.prototype.getConnectedArticles = function(options) {
		if (this.type != 'article') return null;
		options = options || {};
		options.articleId = this.get('__id');

		var collection = new global.Appacitive.ConnectionCollection({ relation: options.relation });
		collection.connectedArticle = this;
		this.connectionCollections.push(collection);
		var connectedArticlesQuery = new global.Appacitive.queries.ConnectedArticlesQuery(options);
		collection.query = connectedArticlesQuery;

		return collection;
	};

	global.Appacitive.Article.multiDelete = function(schemaName, ids, onSuccess, onError) {
		if (!schemaName)
			throw new Error("Specify schemaName");

		if (schemaName.toLowerCase() == 'user' || schemaName.toLowerCase() == 'device')
			throw new Error("Cannot delete schema and devices using multidelete");

		if (ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.article.getMultiDeleteUrl(schemaName);
			request.method = 'post';
			request.data = { idlist : ids };
			request.onSuccess = function(d) {
				if (d && d.code == '200') {
					onSuccess();
				} else {
					d = d || {};
					onError(d || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				onError(d || { message : 'Server error', code: 400 });
			}
			global.Appacitive.http.send(request);
		} else onSuccess();
	};

	/*global.Appacitive.BaseObject.prototype.getConnected = function(options) {
		if (this.type != 'article') return null;
		options = options || {};
		options.onSuccess = options.onSuccess || function(){};
		options.onError = options.onError || function(){};
		options.articleId = this.get('__id');

	};*/

})(global);