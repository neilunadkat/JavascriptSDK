module('Facebook integration');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Cleaning up articles of schema user', function() {

	//logout current user
	Appacitive.Users.logout(null, true);

	var total = 0;

	//Authenticate current user
    Appacitive.Users.login('chiragsanghvi', 'test123!@#').then(function(data) {
    	//Fetch all users except admin user
    	var query = new Appacitive.Queries.GraphFilterQuery('users');
    	return query.fetch();
    }).then(function(ids) {
    	total = ids.length;
		if (total === 0) {
    		ok(true, 'No users to delete');
			return Appacitive.Promise().fulfill();
    	}

    	var tasks = [];
    	ids.forEach(function(id) {
    		tasks.push(new Appacitive.User({ __id: id }).destroy());
    	});
    	return Appacitive.Promise.when(tasks);
    }).then(function() {
    	ok(true, 'All users to deleted');
    	start();
    }, function(data, values) {
    	if (!Appacitive.Users.current()) {
    		ok(false, 'User authentication failed: ' + JSON.stringify(data));
    	} else if (total === 0) {
    		ok(false, 'Could not fetch articles for schema user');
    	} else {
    		var numFailures = total;
			values.forEach(function(v) { if (v) --numFailures; });
			ok(false, 'Article delete failed for ' + numFailures + '/' + total +' articles');
    	}
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
			ok(true, "Saved user");
			start();				
		}, function() {
			if (!FBLoggedIn) {
				ok(false, 'User cancelled login or did not fully authorize.')
			} else if (!linked) {
				ok(false, "Facebook account could not be linked to user");
			} else {
				ok(false, "Could not save user");
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

	if (Appacitive.Users.currentUser() && Appacitive.Users.currentUser().id() == testConstants.adminUserId) {
		Appacitive.Users.logout();
	}

	Appacitive.Users.deleteCurrentUser().then(function(){
		ok(true, "Deleted current user");	
		return Appacitive.Users.signup(user);
	}).then(function() {
		return Appacitive.Users.currentUser().linkFacebook(token);
	}).then(function(base) {
		deepEqual(base.linkedAccounts().length, 1, 'User linked to his facebook account');
		start();
	}, function() {
		if (!deleted) {
			ok(false, "Could'nt delete current user");
		} else if (!Appacitive.Users.current()) {
			ok(false, 'Couldnt create user');
		} else {
			ok(false, 'Could not link facebook account');
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