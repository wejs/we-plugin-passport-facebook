const assert = require('assert'),
      request = require('supertest'),
      helpers = require('we-test-tools').helpers;

let _, http, we;

describe('APPlogin', function() {
  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    _ = we.utils._;
    return done();
  });

  it('post /auth/facebook/app-login Should authenticate with user access_token', function (done) {

    var bodyStub = {
      fb_access_token: process.env.ACCESS_TOKEN
    };

    request(http)
    .post('/auth/facebook/app-login')
    .send(bodyStub)
    .set('Accept', 'application/json')
    .end(function (err, res) {
      if (err) throw new Error(err, res.text);

      assert.equal(200, res.status);
      assert(res.body.token);
      assert(res.body.user);

      let salvedUser = res.body.user;
      let api_access_token = res.body.token.access_token;

      request(http)
      .get('/auth/grant-password/protected')
      .set('Accept', 'application/json')
      .set('Authorization', 'Basic ' + api_access_token)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          console.log('<res.text>', res.text);
          throw err;
        }

        assert.equal(res.body.authenticated, true, 'Need be authenticated');
        assert.equal(res.body.user.id, salvedUser.id);
        assert.equal(res.body.user.email, salvedUser.email);

        done();
      });

    });
  });
});
