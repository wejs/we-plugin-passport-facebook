/**
 * Main facebook authentitation plugin file
 *
 * see http://wejs.org/docs/we/plugin
 */

module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);

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
            const we = this.we;

            we.log.verbose('facebook-auth:data:', profile);

            // get email:
            if (!profile || !profile.emails || !profile.emails[0] || !profile.emails[0].value) {
              done('passport-facebook.callback.email.not.avaible');
              return null;
            }

            const email = profile.emails[0].value;

            const query = {
              where: { email: email },
              defaults: {
                displayName: profile.displayName,
                fullName: profile.displayName,
                acceptTerms: true,
                active: true,
                email: email,
                confirmEmail: email,
                facebookId: profile.id
              }
            };

            we.db.models.user
            .findOrCreate(query)
            .spread( (user, created)=> {
              if (created) {
                we.log.info('New user from facebook', user.id);
                // new user, is active by default...
              } else if(user.blocked) {
                we.log.info('FB:User blocked trying to login:', user.id);
                done('user.blocked.cant.login', null);
                return null;
              }

              if(!user.active) user.active = true;

              plugin.getUserAvatar(profile.id, user, we, ()=> {
                user.accessToken = accessToken;
                user.refreshToken = refreshToken;

                if (!user.facebookId) user.facebookId = profile.id;

                return user.save()
                .then( ()=> {
                  done(null, user);
                  return null;
                });
              });
            })
            .catch( (err)=> {
              done(err, null);
              return null;
            });
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