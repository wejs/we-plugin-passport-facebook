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
          // callbackURL is automaticaly set to we.config.hostname+'/auth/google/callback'
          // but you can change it in config/local.js
          callbackURL: null,
          profileFields: ['id', 'displayName', 'photos', 'email'],
          session: true,
          findUser(token, tokenSecret, profile, done) {
            // // log profile data
            // console.log('>>profile>>', profile);

            const we = this.we;
            // get email
            const email = profile.emails[0].value;

            const query = {
              where: { email: email },
              defaults: {
                displayName: profile.displayName,
                fullName: profile.displayName,
                acceptTerms: true,
                active: true,
                email: email,
                confirmEmail: email
              }
            };

            we.db.models.user
            .findOrCreate(query)
            .spread( (user, created)=> {
              if (created) we.log.info('New user from facebook', user.id);
              // TODO download and save user picture from facebook API

              done(null, user);
              return null;
            })
            .catch(done);
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

  return plugin;
};