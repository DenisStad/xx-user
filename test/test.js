var App = require('xerxes')();
App.configuration = {
  redis: {
    host: 'localhost',
    port: 6379,
    prefix: 'xxu_',
    ttl: 1000 * 60
  },
  session: {
    secret: 'change',
    key: 'xxu',
    cookie: {
      maxAge: 1000 * 60
    },
    resave: true,
    saveUninitialized: false
  }
};

App.load('server/setup');
App.load('server/validations');
App.load('../sessions');
App.load('server/start');
App.load('../model', 'users');
App.load('../endpoints', 'users');
App.load('db/convert', 'mongoose');
App.load('mongoose/model', 'mongodb://localhost/xxuser');
App.load('server/start');

var should = require('should');
var request = require('supertest');
var agent = request.agent(App.server);
var context = {};

describe('user', function() {

  before(function(cb) {
    App.models.user.Model.remove(cb);
  });

  it('should not show session when not logged in', function(done) {
    agent.get('/session/user')
    .set('Accept', 'application/json')
    .expect(401, function(err, res) {
      if (err) return done(err);

      done();
    });
  });

  it('should not sign up user when data is missing', function(done) {
    agent.post('/users')
    .set('Accept', 'application/json')
    .send({ user: { email: 'eMail@example.com', name: 'John', }, password: 'password' })
    .expect(422, function(err, res) {
      if (err) return done(err);

      res.body.should.have.property('error');
      res.body.error.should.have.property('errors');
      res.body.error.errors.passwordConfirm.should.equal('passwordConfirm is missing');

      done();
    });
  });

  it('should sign up user', function(done) {
    agent.post('/users')
    .set('Accept', 'application/json')
    .send({ user: { email: 'eMail@example.com', name: 'John', }, password: 'password', passwordConfirm: 'password' })
    .expect(200, function(err, res) {
      if (err) return done(err);

      res.body.user.should.have.property("createdAt");
      res.body.user.name.should.equal('John');
      res.body.user.email.should.equal('email@example.com');
      expect(res.body.user.passwordHash).to.not.exist();

      context.user = res.body.user;

      agent.get('/session/user')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);

        res.body.user.should.have.property("createdAt");
        res.body.user.name.should.equal('John');
        res.body.user.email.should.equal('email@example.com');
        expect(res.body.user.passwordHash).to.not.exist();

        done();
      });
    });
  });

  it('should logout', function(done) {
    agent.delete('/session/user')
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);

      agent.get('/session/user')
      .set('Accept', 'application/json')
      .expect(401, function(err, res) {
        if (err) return done(err);

        done();
      });
    });
  });

  it('should not login with invalid password', function(done) {
    agent.post('/session/user')
    .set('Accept', 'application/json')
    .send({ email: 'eMail@example.com', password: 'invalid' })
    .expect(401, function(err, res) {
      if (err) return done(err);

      res.body.error.message.should.equal('invalid combination of email and password');

      done();
    });
  });

  it('should login', function(done) {
    agent.post('/session/user')
    .set('Accept', 'application/json')
    .send({ email: 'eMail@example.com', password: 'password' })
    .expect(200, function(err, res) {
      if (err) return done(err);

      res.body.user.should.have.property("createdAt");
      res.body.user.name.should.equal('John');
      res.body.user.email.should.equal('email@example.com');
      expect(res.body.user.passwordHash).to.not.exist();

      agent.get('/session/user')
      .set('Accept', 'application/json')
      .expect(200, function(err, res) {
        if (err) return done(err);

        res.body.user.should.have.property("createdAt");
        res.body.user.name.should.equal('John');
        res.body.user.email.should.equal('email@example.com');
        expect(res.body.user.passwordHash).to.not.exist();

        done();
      });
    });
  });

  it('should not show unknown user', function(done) {
    agent.get('/users/3' + context.user.id)
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      if (err) return done(err);

      res.body.error.message.should.equal('user not found');

      done();
    });
  });

  it('should show user', function(done) {
    agent.get('/users/' + context.user.id)
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);

      res.body.user.should.have.property("createdAt");
      res.body.user.name.should.equal('John');
      res.body.user.email.should.equal('email@example.com');
      expect(res.body.user.passwordHash).to.not.exist();

      done();
    });
  });

  it('should update user', function(done) {
    agent.patch('/users/' + context.user.id)
    .send({ user: { name: 'Jacob' } })
    .set('Accept', 'application/json')
    .expect(200, function(err, res) {
      if (err) return done(err);

      res.body.user.should.have.property("createdAt");
      res.body.user.name.should.equal('Jacob');
      res.body.user.email.should.equal('email@example.com');
      expect(res.body.user.passwordHash).to.not.exist();

      done();
    });
  });
});

