(function(global) {

	"use strict";

	var _emailManager = function() {

		var config = {
			username: null,
			from: null,
			frompassword: null,
			smtphost: 'smtp.google.com',
			smtpport: 587,
			enablessl: true,
			replyto: null
		};

		var config = {
			smtp: {
				username: null,
				password: null,
				host: "smtp.gmail.com",
				port: 465,
				enablessl: true
			},
			from: null,
			replyto: null
		}

		this.getConfig = function() {
			var _copy = config;
			return _copy;
		};

		var _sendEmail = function (email, onSuccess, onError) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.email.getSendEmailUrl();
			request.method = 'post';
			request.data = email;
			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.email);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};
			global.Appacitive.http.send(request);
		};

		this.setupEmail = function(options) {
			options = options || {};
			config.smtp.username = options.username || config.smtp.username;
			config.from = options.from || config.from;
			config.smtp.password = options.password || config.smtp.password;
			config.smtp.host = options.smtp.host || config.smtp.host;
			config.smtp.port = options.smtp.port || config.smtp.port;
			config.smtp.enablessl = options.enableSSL || config.smtp.enablessl;
			config.replyto = options.replyTo || config.replyto;
		};


		this.sendTemplatedEmail = function(options, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!options || !options.to || !options.to.length || options.to.length == 0) {
				throw new Error('Atleast one receipient is mandatory to send an email');
			}
			if (!options.subject || options.subject.trim().length == 0) {
				throw new Error('Subject is mandatory to send an email');
			}

			if(!options.from && config.from) {
				throw new Error('from is mandatory to send an email. Set it in config or send it in options');
			} 

			if (!options.templateName) {
				throw new Error('template name is mandatory to send an email');
			}

			var email = {
				to: options.to || [],
				cc: options.cc || [],
				bcc: options.bcc || [],
				subject: options.subject,
				body: {
					templatename: options.templateName || '',
					data : options.data || {},
					ishtml: (options.isHtml == false) ? false : true
				}
			};

			if (options.useConfig) {
				email.smtp = config.smtp;
				if(!options.from && !config.from) {
					throw new Error('from is mandatory to send an email. Set it in config or send it in options');
				}
				email.from = options.from || config.from;
				email.replyto = options.replyTo || config.replyto;
			}

			_sendEmail(email, onSuccess, onError);
		};

		this.sendRawEmail = function(options, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!options || !options.to || !options.to.length || options.to.length == 0) {
				throw new Error('Atleast one receipient is mandatory to send an email');
			}
			if (!options.subject || options.subject.trim().length == 0) {
				throw new Error('Subject is mandatory to send an email');
			}

			if (!options.body) {
				throw new Error('body is mandatory to send an email');
			} 

			var email = {
				to: options.to || [],
				cc: options.cc || [],
				bcc: options.bcc || [],
				subject: options.subject,
				body: {
					content: options.body || '',
					ishtml: (options.isHtml == false) ? false : true
				}
			};

			if (options.useConfig) {
				email.smtp = config.smtp;
				if(!options.from && !config.from) {
					throw new Error('from is mandatory to send an email. Set it in config or send it in options');
				}
				email.from = options.from || config.from;
				email.replyto = options.replyTo || config.replyto;
			}

			_sendEmail(email, onSuccess, onError);
		};

	};

	global.Appacitive.email = new _emailManager();

})(global);