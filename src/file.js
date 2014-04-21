(function (global) {

  "use strict";

  var _file = function(ops) {
      
      ops = ops || {}; 
      this.fileId = ops.fileId;
      this.contentType = ops.contentType;
      this.fileData = ops.fileData;
      var that = this;

      var _getUrls = function(url, onSuccess, promise, description, options) {
          var request = new global.Appacitive.HttpRequest();
          request.url = url;
          request.method = 'GET';
          request.description = description;
          request.onSuccess = onSuccess;
          request.promise = promise;
          request.entity = that;
          request.options = options;
          global.Appacitive.http.send(request); 
      };

      var _upload = function(url, file, type, onSuccess, promise) {
          var fd = new FormData();
          fd.append("fileToUpload", file);
          var request = new global.Appacitive.HttpRequest();
          request.url = url;
          request.method = 'PUT';
          request.log = false;
          request.description = 'Upload file';
          request.data = file;
          request.headers.push({ key:'content-type', value: type });
          request.send().then(onSuccess, function() {
            promise.reject(d, that);
          });
      };

      this.save = function(options) {
        if (this.fileId && _type.isString(this.fileId) && this.fileId.length > 0)
          return _update(options);
        else
          return _create(options);
      };

      var _create = function(options) {
          if (!that.fileData) throw new Error('Please specify filedata');
          if(!that.contentType) {
            try { that.contentType = that.fileData.type; } catch(e) {}
          }
          if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';
          
          var promise = global.Appacitive.Promise.buildPromise(options);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUploadUrl(that.contentType, that.fileId ? that.fileId : '');
         
          _getUrls(url, function(response) {
                _upload(response.url, that.fileData, that.contentType, function() {
                    that.fileId = response.id;
                    
                    that.getDownloadUrl(options).then(function(res) {
                      return promise.fulfill(res, that);
                    }, function(e) {
                      return promise.reject(e);
                    });

                }, promise);
          }, promise, ' Get upload url for file ', options);

          return promise;
      };

      var _update = function(options) {
          if (!that.fileData) throw new Error('Please specify filedata');
          if(!that.contentType) {
            try { that.contentType = that.fileData.type; } catch(e) {}
          }
          if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';
          
          var promise = global.Appacitive.Promise.buildPromise(options);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUpdateUrl(that.fileId, that.contentType);
          
          _getUrls(url, function(response) {
              _upload(response.url, that.fileData, that.contentType, function() {
                  
                  that.getDownloadUrl(options).then(function(res) {
                    promise.fulfill(res, that);
                  }, function(e) {
                    promise.reject(e);
                  });

              }, promise);
          }, promise, ' Get update url for file ' + that.fileId, options);

          return promise;
      };

      this.deleteFile = function(options) {
          if (!this.fileId) throw new Error('Please specify fileId to delete');

          var promise = global.Appacitive.Promise.buildPromise(options);

          var request = new global.Appacitive.HttpRequest();
          request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getDeleteUrl(this.fileId);
          request.method = 'DELETE';
          request.description = 'Delete file with id ' + this.fileId;
          request.onSuccess = function(response) {
              promise.fulfill();
          };
          request.promise = promise;
          request.entity = that;
          request.options= options;
          return global.Appacitive.http.send(request); 
      };

      this.getDownloadUrl = function(expiry, options) {
          if (!this.fileId) throw new Error('Please specify fileId to download');

          if (typeof expiry !== 'number') {
            options = expiry;
            expiry = -1;
          }
          
          var promise = global.Appacitive.Promise.buildPromise(options);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getDownloadUrl(this.fileId, expiry);
 
          _getUrls(url, function(response) {
              that.url = response.uri;
              promise.fulfill(response.uri);
          }, promise,  ' Get download url for file ' + this.fileId, options);

          return promise;
      };

      this.getUploadUrl = function(options) {
          if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';

          var promise = global.Appacitive.Promise.buildPromise(options);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUploadUrl(this.contentType, this.fileId ? this.fileId : '');

          _getUrls(url, function(response) {
              that.url = response.url;
              promise.fulfill(response.url, that);
          }, promise, ' Get upload url for file ' + this.fileId, options);

          return promise;
      };
  };

  global.Appacitive.File = _file;

}(global));
