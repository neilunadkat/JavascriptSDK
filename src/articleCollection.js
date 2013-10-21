(function(global) {

	"use strict";

	/** 
	* @constructor
	**/
	var _ArticleCollection = function(options) {

		var _schema = null;
		var _query = null;
		var _articles = [];
		var _options = {};

		if (typeof options === 'string') _options.schema = options;
		else _options = options;

		this.collectionType = 'article';

		this.type = function() { return _schema; };

		if (!_options || !_options.schema) throw new Error('Must provide schema while initializing ArticleCollection.');
		
		_schema = _options.schema;
		
		var that = this;
		var _parseOptions = function(options) {
			options.type = 'article';

			if (options.schema) _schema = options.schema;
			else options.schema = _schema;

			_query = new global.Appacitive.Queries.FindAllQuery(options);
			_options = options;
			that.extendOptions = _query.extendOptions;
		};

		this.setFilter = function(filter) {
			_options.filter = filter;
			_options.type = 'article';
			if (_query) _query.filter(filter);
			else {
				_query = new global.Appacitive.Queries.FindAllQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
			return this;
		};

        this.setFreeText = function(tokens) {
            if (!tokens && tokens.trim().length === 0)
                _options.freeText = "";
            _options.freeText = tokens;
            _options.type = 'article';
            if (_query) _query.freeText(tokens);
			else {
				_query = new global.Appacitive.Queries.FindAllQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
			return this;
        };

        this.setFields = function(fields) {
        	if (!fields) fields = "";
            _options.fields = fields;
            _options.type = 'article';
            if (_query) _query.fields(fields);
			else {
				_query = new global.Appacitive.Queries.FindAllQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
			return this;
        };

		this.reset = function() {
			_options = null;
			_schema = null;
			_articles.length = 0;
			_query = null;
		};

		var _supportedQueryType = ["BasicFilterQuery"];

		this.query = function() {
			if (arguments.length === 1) {
				var query = arguments[0];
				if (!query || !query.toRequest) throw new Error('Invalid  appacitive query passed to articleCollection');
				if (_supportedQueryType.indexOf(query.queryType()) === -1) throw new Error('ArticleCollection only accepts ' + _supportedQueryType.join(', '));
				_articles.length = 0;
				_query = query;
				return this;
			}
			return _query;
		};

		this.setOptions = _parseOptions;
		
		_parseOptions(_options);

		// getters
		this.get = function(index) {
			if (index != parseInt(index, 10)) return null;
			index = parseInt(index, 10);
			if (typeof index != 'number') return null;
			if (index >= _articles.length)  return null;
			return _articles.slice(index, index + 1)[0];
		};

		this.addToCollection = function(article) {
			if (!article || article.get('__schematype') != _schema)
				throw new Error('Null article passed or schema type mismatch');
			var index =  null;
			_articles.forEach(function(a, i) {
				if (a.get('__id') === article.get('__id')) {
					index = i;
				}
			});
			if (index != null) {
				_articles.splice(index, 1);
			} else {
				_articles.push(article);
			}
			return this;
		};

		this.getArticleById = function(id) {
			var existingArticle = _articles.filter(function (article) {
				return article.get('__id') === id;
			});
			if (existingArticle.length === 1) return existingArticle[0];
			return null;
		};

		this.getAll = function() { return Array.prototype.slice.call(_articles); };

		this.getAllArticles = function() {
			return Array.prototype.slice.call(_articles).map(function (a) {
				return a.getArticle();
			});
		};

		this.removeById = function(id) {
			if (!id) return false;
			var index = null;
			_articles.forEach(function(article, i) {
				if (article.getArticle().__id && article.getArticle().__id === id) {
					index = i;
				}
			});
			if (index !== null) {
				_articles.splice(index, 1);
			}
			return this;
		};

		this.removeByCId = function(id) {
			if (!id) return false;
			var index = null;
			_articles.forEach(function(article, i) {
				if (article.cid && article.cid === id) {
					index = i;
				}
			});
			if (index !== null) _articles.splice(index, 1);
			return this;
		};

		var parseArticles = function (articles, pagingInfo, onSuccess) {
			if (!articles.length || articles.length === 0) articles = [];
			
			articles.forEach(function (article) {
				article.___collection = that;
				_articles.push(article);
			});

			if (typeof onSuccess === 'function') onSuccess(pagingInfo, that);
		};

		this.fetch = function(onSuccess, onError) {

			_articles.length = 0;
			
			_query.fetch(function(articles, pagingInfo) {
				parseArticles(articles, pagingInfo, onSuccess);
			}, function(err) {
				if (typeof onError === 'function') onError(err, that);
			});

			return this;
		};

		this.count = function(onSuccess, onError) {
			this.query.count(onSuccess, onError);
			return this;
		};

		this.fetchByPageNumber = function(onSuccess, onError, pageNumber) {
			_query.pageNumber(pageNumber);
			this.fetch(onSuccess, onError);
			return this;
		};

		this.fetchNextPage = function(onSuccess, onError) {
			_query.pageNumber(++_query.pageNumber);
			this.fetch(onSuccess, onError);
			return this;
		};

		this.fetchPreviousPage = function(onSuccess, onError) {
			var pNum = _query.pageNumber();
			pNum -= 1;
			if (pNum <= 0) pNum = 1;
			_query.pageNumber(pNum);
			this.fetch(onSuccess, onError);
			return this;
		};

		this.createNewArticle = function(values) {
			values = values || {};
			values.__schematype = _schema;
			var _a = new global.Appacitive.Article(values);
			_a.___collection = that;
			_articles.push(_a);
			return _a;
		};

		this.map = function(delegate, context) { return _articles.map.apply(delegate, context || this); };
		this.forEach = function(delegate, context) { return _articles.forEach(delegate, context); };
		this.filter = function(delegate, context) { return _articles.filter.apply(delegate, context || this); };

	};

	global.Appacitive.ArticleCollection = _ArticleCollection;

	global.Appacitive.ArticleCollection.prototype.toString = function() {
		return JSON.stringify(this.getAllArticles());
	};

	global.Appacitive.ArticleCollection.prototype.toJSON = function() {
		return this.getAllArticles();
	};

	global.Appacitive.ArticleCollection.prototype.articles = function() {
		return this.getAll();
	};

	global.Appacitive.ArticleCollection.prototype.length = function() {
		return this.articles().length;
	};

})(global);
