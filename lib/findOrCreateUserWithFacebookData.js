function findUser(we, accessToken, refreshToken, profile, done) {

  we.log.verbose('facebook-auth:data:', profile);

  const plugin = we.plugins['we-plugin-passport-facebook'];

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

module.exports = findUser;
