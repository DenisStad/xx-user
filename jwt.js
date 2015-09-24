var jwt = require('jsonwebtoken');

exports = module.exports = function(App, role, secret) {
  router.post('/auth/' + role, router.describe({
    description: 'Generate a jwt with the ' + role+ '\'s id',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['email', 'password']
  }), function(req, res, next) {
    App.models[role].authenticate(req.body.email, req.body.password, function(err, user) {
      if (err) return next(err);

      var payload = {};
      payload[role] = user;
      var token = jwt.sign(payload, secret, { expiresInMinutes: 60 * 24 });

      res.setData({ token: token });
      next();
    });
  });

  App.router.use(function(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, secret, { json: true }, function(err, decoded) {
        if (!err && decoded) req[role + 'Id'] = decoded[role];
        next();
      });
      return;
    }
    next();
  });
};
