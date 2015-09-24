exports = module.exports = function(App, role, path) {
  var router = App.router;

  router.param(role + '_id', function(req, res, next, id) {
    App.models[role].findById(id, function(err, member) {
      if (err) return next(err);
      if (!member) {
        return next({ message: role + ' not found', status: 404 });
      }
      req.values = req.values || {};
      req.values[role] = member;
      next();
    });
  });

  router.post('/' + path, router.describe({
    description: 'Create a new ' + role,
    properties: {
      //user: db2json(App.models[role].attributes),
      password: { type: 'string' },
      passwordConfirm: { type: 'string' },
    },
    required: ['user', 'password', 'passwordConfirm']
  }), function(req, res, next) {
    if (req.body.password !== req.body.passwordConfirm) {
      return next({ message: 'passwords don\'t match' });
    }
    App.models[role].register(req.body[role], req.body.password, function(err, user) {
      if (err) return next(err);
      var reply = {};
      reply[role] = user;
      res.setData(reply);
      next();
    });
  });

  router.get('/' + path + '/:' + role + '_id', router.describe({
    description: 'Show the ' + role
  }), function(req, res, next) {
    var reply = {};
    reply[role] = req.values[role];
    res.setData(reply);
    next();
  });

  router.patch('/' + path + '/:' + role + '_id', router.describe({
    description: 'update the ' + role + '. This will update the logged in user no matter which id you pass'
  }), function(req, res, next) {
    App.models[role].updateInstance(req[role], req.body.user, { readonly: false, private: false }, function(err, member) {
      if (err) return next(err);
      var reply = {};
      reply[role] = member;
      res.setData(reply);
      next();
    });
  });

};
