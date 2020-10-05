const FCUWFD = require('../../lib/findOrCreateUserWithFacebookData.js');
const fBGetRefreshToken = require('../../lib/fBGetRefreshToken.js');
const fBGetData = require('../../lib/fBGetData.js');
const request = require('request');

module.exports = {
  page(req, res, next) {
    const FBAuthConfigs = req.we.config.passport.strategies.facebook;

    req.we.passport.authenticate(
      'facebook',
      (FBAuthConfigs.scope || ['email'])
    )(req, res, next);
  },
  callback(req, res) {
    const FBAuthConfigs = req.we.config.passport.strategies.facebook;

    req.we.passport.authenticate('facebook', {
      failureRedirect: FBAuthConfigs.redirectUrlAfterFailure
    })(req, res, (err)=> {
      if (err) {
        req.we.log.error('we-plugin-passport-facebook: Error on authenticate with facebook.strategy:', {
          error: err
        });
        res.addMessage('error', 'auth.strategy.facebook.error');
        return res.goTo(FBAuthConfigs.redirectUrlAfterFailure);
      }

      // Successful authentication, redirect.
      res.goTo(FBAuthConfigs.redirectUrlAfterSuccess);
    });
  },

  APPloginWithFacebookAccessToken(req, res) {
    const we = req.we;
    const log = req.we.log;

    if (!we.plugins['we-passport-oauth2-password']) {
      log.warn(
        'we-plugin-passport-facebook:'+
        'APPloginWithFacebookAccessToken:we-passport-oauth2-password plugin is required'
      );
      return res.notFound();
    }

    const storage = we
      .plugins['we-passport-oauth2-password']
      .storage;

    if (
      !req.body.fb_access_token
    ) {
      return res.badRequest(':APPloginWithFacebookAccessToken:required params not found');
    }

    log.verbose('APPloginWithFacebookAccessToken:req.body:', {
      body: req.body
    });

    const fb_access_token = req.body.fb_access_token;

    let FBRTResult, FDData, user, tokenRecord;

    we.utils.async.series([
      function (done) {
        fBGetRefreshToken(we, fb_access_token, (err, r)=> {
          if (err) return done(err);

          if (r.error) {
            done(r.error.message);
          } else {
            FBRTResult = r;
            done();
          }
        });
      },

      function (done) {
        if (!FBRTResult || !FBRTResult.access_token) {
          we.log.error('Error on fBGetRefreshToken error', {
            FBRTResult,
          });
          return done('FBRTResult.access_token is required');
        }

        fBGetData(we, FBRTResult.access_token, (err, data)=> {
          if (err) {
            log.error('passportFacebook:Error on request data from facebook', {
              err: err,
              data: data
            });
            return done('passportFacebook:Error on request data from facebook');
          }

          if (data.error) {
            log.error('passportFacebook:API error on request data from facebook', {
              err: err,
              data: data
            });
            return done('passportFacebook:API error on request data from facebook');
          }

          if (!data.email) {
            return done('email.not.found.in.facebook.response');
          }

          FDData = {
            id: data.id,
            emails: [{ value: data.email}],
            displayName: data.name
          };

          done();
        });
      },
      function (done) {
        if (!FDData || !FDData.id) return done();

        FCUWFD(we, FBRTResult.access_token, null, FDData, (err, u)=> {
          if (err) return done(err);
          user = u;
          done();
        });
      },
      function (FDDatane) {
        if (!user || !user.id) return done();

        storage.generateToken(we, user, (err, r)=>{
          if (err) return done(err);
          tokenRecord = r;
          done();
        });
      }
    ], (err)=> {
      if (err) {
        return res.queryError(err);
      }

      if (!tokenRecord) return res.badRequest();

      res.ok({
        token: tokenRecord,
        user: user
      });
    });

  },

  loginWithCode(req, res) {
    if (!req.body.code) {
      return res.badRequest('code is required');
    }

    const we = req.we;

    const storage = we
      .plugins['we-passport-oauth2-password']
      .storage;

    const {
      clientID, clientSecret, callbackURL
    } = we.config.passport.strategies.facebook;

    let url = 'https://graph.facebook.com/v7.0/oauth/access_token?';
    url += 'client_id=' + clientID;
    url += '&redirect_uri=' + (
      req.body.redirectUri || callbackURL
    );
    url += '&client_secret=' + clientSecret;
    url += '&code=' + req.body.code;

    request.get({
      url: url,
      json: true
    }, (err, resp, FBRTResult)=> {
      if (err) return res.queryError(err, resp.text);

      getFBDataWithPromise(we, FBRTResult, (err, FDData)=> {
        if (err) return res.queryError(err);

        FCUWFD(we, FBRTResult.access_token, null, FDData, (err, user)=> {
          if (err) return res.queryError(err);

          if (!user || !user.id) return res.badRequest('user not returned from facebook request');

          storage.generateToken(we, user, (err, r)=>{
            if (err) return res.queryError(err);

            res.ok({
              token: r,
              user: user,
            });
          });

        });
      });
    });

  }
};

function getFBDataWithPromise(we, FBRTResult, done) {
  const log = we.log;

  if (!FBRTResult || !FBRTResult.access_token) {
    return done('FBRTResult.access_token is required');
  }

  fBGetData(we, FBRTResult.access_token, (err, data)=> {
    if (err) {
      log.error('passportFacebook:Error on request data from facebook', {
        err: err,
        data: data
      });
      return done('passportFacebook:Error on request data from facebook');
    }

    if (data.error) {
      log.error('passportFacebook:API error on request data from facebook', {
        err: err,
        data: data
      });
      return done('passportFacebook:API error on request data from facebook');
    }

    if (!data.email) {
      return done('email.not.found.in.facebook.response');
    }

    done(null, {
      id: data.id,
      emails: [{ value: data.email}],
      displayName: data.name
    });
  });
}