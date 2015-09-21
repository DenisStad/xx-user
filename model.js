var bcrypt = require('bcrypt');

exports = module.exports = function(App, role) {
  var Member = {
    email: { type: 'string', unique: true, description: 'the ' + role + '\'s email' },
    name: { type: 'string', description: 'the ' + role + '\'s name' },
    passwordHash: { type: 'string', private: true },
  };

  function generatePassword(password, cb) {
    if (!password) {
      return cb({ message: 'no password' });
    }
    bcrypt.genSalt(10, function(err, salt) {
      if (err) return cb(err);
      bcrypt.hash(password, salt, function(err, hash) {
        if (err) return cb(err);
        return cb(null, hash, salt);
      });
    });
  }

  App.models[role] = {
    description: 'The ' + role + ' model',
    definition: Member,
    register: function(userObject, password, cb) {
      generatePassword(password, function(err, hash) {
        if (err) return cb(err);
        userObject.passwordHash = hash;
        userObject.email = userObject.email.toLowerCase().trim();
        App.models[role].create(userObject, function(err, user) {
          cb(err, user);
        });
      });
    },
    authenticate: function(email, password, cb) {
      App.models[role].findOne({ email: email.toLowerCase().trim() }, function(err, user) {
        if (err) return cb(err);
        if (!user) return cb({ message: 'invalid combination of email and password', status: 401 });
        bcrypt.compare(password, user.passwordHash, function(err, res) {
          if (err) return cb(err);
          if (!res) return cb({ message: 'invalid combination of email and password', status: 401 });
          cb(null, user);
        });
      });
    },
    instanceMethods: {
      updatePassword: function(password, cb) {
        var user = this;
        generatePassword(password, function(err, hash) {
          if (err) return cb(err);
          user.passwordHash = hash;
          user.save().then(function(user) {
            cb(null, user);
          }).catch(cb);
        });
      }
    }
  };

  if (!App.roles) {
    App.roles = {};
  }
  App.roles[role] = App.models[role];
};
