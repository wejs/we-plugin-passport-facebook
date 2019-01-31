const request = require('request');

function fBGetData(we, fb_access_token, cb) {
  request.get({
    url: `https://graph.facebook.com/me?fields=id,name,email&access_token=${fb_access_token}`,
    json: true
  },
  (err, resp, body)=> {
    if (err) return cb(err, resp.text);
    cb(null, body);
  });
}

module.exports = fBGetData;
