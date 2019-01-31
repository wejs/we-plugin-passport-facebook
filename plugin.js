/**
 * Main facebook authentitation plugin file
 *
 * see http://wejs.org/docs/we/plugin
 */

const FCUWFD = require('./lib/findOrCreateUserWithFacebookData.js');

module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);
  plugin.findOrCreateUserWithFacebookData = FCUWFD;

  // set plugin configs
  plugin.setConfigs({
    passport: {
      strategies: {
        facebook: {
          Strategy: require('passport-facebook').Strategy,
          // url to image icon
          icon: '/public/plugin/we-plugin-passport-facebook/files/facebook-logo.png',
          authUrl: '/auth/facebook',
          // get a clientID and clientSecret from facebook api console,
          // for docs see https://github.com/jaredhanson/passport-facebook
          clientID: null,
          clientSecret: null,
          scope: null,
          // callbackURL is automaticaly set to we.config.hostname+'/auth/google/callback'
          // but you can change it in config/local.js
          callbackURL: null,
          profileFields: ['id', 'displayName', 'photos', 'email'],
          session: true,
          findUser(accessToken, refreshToken, profile, done) {
            plugin.findOrCreateUserWithFacebookData(
              this.we, accessToken, refreshToken, profile, done
            );
          }
        }
      }
    }
  });

  plugin.setRoutes({
    'get /auth/facebook': {
      controller    : 'passportFacebook',
      action        : 'page',
      responseType  : 'json'
    },
    'get /auth/facebook/callback': {
      controller    : 'passportFacebook',
      action        : 'callback',
      responseType  : 'json'
    },
    'post /auth/facebook/app-login': {
      controller    : 'passportFacebook',
      action        : 'APPloginWithFacebookAccessToken',
      responseType  : 'json'
    }
  });

  plugin.hooks.on('system-settings:started', (we, done)=> {
    if (we.systemSettings.fbclientSecret && we.systemSettings.fbClientId) {
      we.config.passport.strategies.facebook.clientID = we.systemSettings.fbClientId;
      we.config.passport.strategies.facebook.clientSecret = we.systemSettings.fbclientSecret;
    }

    done();
  });

  // use the bootstrap evento to set default auth callback
  plugin.events.on('we:after:load:express', (we)=> {
    if (
      we.config.passport &&
      we.config.passport.strategies &&
      we.config.passport.strategies.facebook &&
      !we.config.passport.strategies.facebook.callbackURL
    ) {
      we.config.passport.strategies.facebook.callbackURL = we.config.hostname+'/auth/facebook/callback';
    }
  });

  plugin.getUserAvatar = function (facebookId, user, we, cb) {
    if (user.avatar && user.avatar.length) {
      return cb();
    }

    // get user picture from facebook ...

    // url: urlurlhttps://graph.facebook.com/v2.12/100026878071543/picture?width=320&height=320

    const plf = we.plugins['we-plugin-file-local'];
    if (!plf) return cb();

    if (user && user.avatar && user.avatar.length) return cb();

    if (!facebookId) return cb();

    const uU = plf.urlUploader;
    const url = 'https://graph.facebook.com/v2.12/'+facebookId+'/picture?width=320&height=320';

    uU.uploadFromUrl(url, we, (err, image)=> {
      if (err) return cb(err);
      image.setCreator(user.id)
      .then( ()=> {
        user.avatar = [image];
        return user.save();
      })
      .then( ()=> {
        we.log.verbose('new image:', image.get());
        cb(null, image);
        return null;
      });
    });

  };

  return plugin;
};