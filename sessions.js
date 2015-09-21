var session = require('express-session');
var RedisStore = require('connect-redis')(session);

exports = module.exports = function(App) {
  var config = App.configuration.session;
  config.store = new RedisStore(App.configuration.redis);

  App.router.use(session(config));

  App.router.use(function(req, res, next) {
    if (req.session.member) {
      for (var role in App.roles) {
        if (req.session.member.id && req.session.member.role === role) {
          App.roles[role].Model.findById(req.session.member.id).then(function(member) {
            req[role] = member;
            next();
          }).catch(function() {
            next();
          });
          return;
        }
      }
    }
    next();
  });

};
