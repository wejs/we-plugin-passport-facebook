const request = require('request');

function fBGetRefreshToken(we, fb_access_token, cb) {
  if (!we.config.passport ||
    !we.config.passport.strategies ||
    !we.config.passport.strategies.facebook
  ) {
    return cb('fbGetRefreshToen:we.config.passport.strategies.facebook is required');
  }

  let appId = we.config.passport.strategies.facebook.clientID;
  let appSecret = we.config.passport.strategies.facebook.clientSecret;

  if (!appId || !appSecret) {
    return cb('fbGetRefreshToen:facebook appId and appSecret is required');
  }

  let p = `client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${fb_access_token}`;

  request.get({
    url: 'https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&'+p,
    json: true
  },
  (err, resp, body)=> {
    if (err) return cb(err, body);
    cb(null, body);
  });
}

module.exports = fBGetRefreshToken;