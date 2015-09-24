var session = require('express-session');
var RedisStore = require('connect-redis')(session);

exports = module.exports = function(App) {
  if (!this.sessionConfigured) {
    var config = App.configuration.session;
    config.store = new RedisStore(App.configuration.redis);

    App.router.use(session(config));
  }
  this.sessionConfigured = true;

  App.router.use(function(req, res, next) {
    if (req.session.members) {
      for (var role in App.roles) {
        if (req.session.members[role]) {
          App.roles[role].findById(req.session.members[role], function(err, member) {
            if (err) return next(err);
            req[role] = member;
            next();
          });
          return;
        }
      }
    }
    next();
  });
};
