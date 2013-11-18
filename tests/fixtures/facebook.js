module('Facebook integration');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Cleaning up articles of schema user by fetching them using "users" filter query and then deleting them one at a time', function() {
	//logout current user
	Appacitive.Users.logout(null, true);

	//Authenticate current user
    Appacitive.Users.login('chiragsanghvi', 'test123!@#').then(function(data) {
    	ok(true, "User authencticated successfully");
    	start();
    }, function(data) {
    	ok(false, 'User authentication failed: ' + JSON.stringify(data));
    	start();
    });
});

asyncTest('Create linked facebook user in one api call', function() {
	var user = {};
	user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	user.firstname = testConstants.user.firstname;
	user.lastname = testConstants.user.lastname;
	user.email = testConstants.user.email;
	user.password = testConstants.user.password;
	var newUser = new global.Appacitive.User(user);
	
	var FBLoggedIn = false;
	var linked = false;

	try {

		Appacitive.Facebook.requestLogin().then(function(authResponse) {
			FBLoggedIn = true;
			return newUser.linkFacebook(Appacitive.Facebook.accessToken());
		}).then(function() {
			if (newUser.linkedAccounts().length > 0) {
				linked = true;
				ok(true, "Facebook account linked to user");
				return newUser.save();
			} else {
				return Appacitive.Promise.reject();
			}
		}).then(function() {
			ok(true, "Saved user with facebbok account linked");
			return newUser.del();
			start();				
		}).then( function() {
			ok(true, "User deleted successfullly");
			start();
		}, function() {
			if (!FBLoggedIn) {
				ok(false, 'User cancelled login or did not fully authorize.')
			} else if (!linked) {
				ok(false, "Facebook account could not be linked to user");
			} else if (newUser.isNew()) {
				ok(false, "Could not save user");
			} else {
				ok(false, "Could not delete current user");
			}
	        start();
		});
	} catch(e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});


asyncTest('Create and link facebook account to a user', function() {
	var user = {};
	user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	user.firstname = testConstants.user.firstname;
	user.lastname = testConstants.user.lastname;
	user.email = testConstants.user.email;
	user.password = testConstants.user.password;

	var deleted = false;
	var token = Appacitive.Facebook.accessToken();

	Appacitive.Users.logout();
	
	Appacitive.Users.signup(user).then(function() {
		return Appacitive.Users.currentUser().linkFacebook(token);
	}).then(function(base) {
		deepEqual(base.linkedAccounts().length, 1, 'User linked to his facebook account');
		start();
	}, function(err) {
		if (!Appacitive.Users.current()) {
			ok(false, 'Couldnt create user');
		} else {
			if (err.code == '600') {
				ok(true, 'Facebook account is already linked to an another account');
			} else {
				ok(false, 'Could not link facebook account');
			}
		}
		start();
	});

});

asyncTest('Verify login with facebook via facebook sdk', function() {
	FB.login(function(response) {
	  if (response.authResponse) {
	    var accessToken = response.authResponse.accessToken;
	    if (accessToken) {
	    	ok(true, 'Received auth response: ' + JSON.stringify(response.authResponse, null, 2));
	    } else {
	    	ok(false, 'Could not get facebook access token');
	    }
	    start();
	  } else {
	    ok(false, 'User cancelled login or did not fully authorize.')
	    start();
	  }
	});
});

asyncTest('Verify login with facebook via Appacitive sdk', function() {
	try {
		Appacitive.Facebook.requestLogin().then(function(authResponse) {
			ok(true, 'Facebook login successfull with access token: ' + global.Appacitive.Facebook.accessToken());
			start();
		}, function() {
			ok(false, 'Facebook login failed');
			start();
		});
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});

asyncTest('Verify getting current facebook user info via Appacitive sdk', function() {
	try {
		Appacitive.Facebook.getCurrentUserInfo().then(function(response) {
			ok(true, 'Got info: ' + JSON.stringify(response));
			start();
		}, function() {
			ok(false, 'Could not get info from facebook');
			start();
		});
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
})

asyncTest('Login with facebook', function() {
	try {
		var accessToken = global.Appacitive.Facebook.accessToken();
		Appacitive.Users.loginWithFacebook(accessToken).then(function(user) {
			ok(true, 'Signed up with facebook: ' + JSON.stringify(user));
			start();
		}, function(err) {
			err = err || {};
			ok(false, 'Could not signup with facebook: ' + JSON.stringify(err));
			start();
		});
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();	
	}
});

asyncTest('Signin with facebook and verify Appacitive.Users.currentUser', function() {
	try {
		var accessToken = global.Appacitive.Facebook.accessToken();
		Appacitive.Users.loginWithFacebook(accessToken).then(function(user) {
			deepEqual(user.user, global.Appacitive.Users.currentUser(), 'Appacitive.Users.currentUser is: ' + user.token);
			start();
		}, function(err) {
			err = err || {};
			ok(false, 'Could not signup with facebook: ' + JSON.stringify(err));
			start();
		})
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});

asyncTest('Verify get facebook user if info is requested', function() {
	try {
		var accessToken = global.Appacitive.Facebook.accessToken();
		var loggedIn = false;
		Appacitive.Users.loginWithFacebook(accessToken).then(function(data) {
			var user = data.user.getArticle();
			var id = user.__id;
			ok(true, 'Signed up with facebook: ' + JSON.stringify(user));
			return Appacitive.Facebook.getCurrentUserInfo();
		}).then(function(fbProfile) {
			ok(true, 'all good, data is: ' + JSON.stringify(fbProfile));
			start();
		}, function(err) {
			if(!loggedIn) {
				err = err || {};
				ok(false, 'Could not signup with facebook: ' + JSON.stringify(err));
			} else {
				ok(false, 'Couldn\'t get facebook profile info');
				start();
			}
			start();
		});
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});