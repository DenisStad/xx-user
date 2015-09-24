exports = module.exports = function(App, role) {
  var router = App.router;

  router.post('/' + role + 's', router.describe({
    description: 'Log the user in if sign up successful'
  }), function(req, res, next) {
    var user = res.responseData.user;
    req.session.regenerate(function() {
      req.session.members = {};
      req.session.members[role] = user.id;

      req.session.save(function() {
        req[role] = user;
        next();
      });
    });
  });

  router.post('/session/' + role, router.describe({
    description: 'Log the ' + role + ' in',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['email', 'password']
  }), function(req, res, next) {
    App.models[role].authenticate(req.body.email, req.body.password, function(err, user) {
      if (err) return next(err);
      var reply = {};
      reply[role] = user;
      res.setData(reply);
      req.session.regenerate(function() {
        req.session.members = {};
        req.session.members[role] = user.id;

        req.session.save(function() {
          req[role] = user;
          next();
        });
      });
    });
  });

  router.delete('/session/' + role, router.describe({
    description: 'Logs the currently logged in ' + role + ' out'
  }), function(req, res, next) {
    req.session.destroy(function(err) {
      if (err) return next(err);
      res.setData({});
      next();
    });
  });

  router.get('/session/' + role, router.describe({
    description: 'Get the currently active user session'
  }), function(req, res, next) {
    if (req[role]) {
      var reply = {};
      reply[role] = req[role];
      res.setData(reply);
      return next();
    } else {
      next({ message: 'not logged in', status: 401 });
    }
  });
};
