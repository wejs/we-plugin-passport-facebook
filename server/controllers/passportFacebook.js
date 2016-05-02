module.exports = {
  page: function(req, res, next) {
    req.we.passport.authenticate('facebook',{
      scope: [
        'email'
      ]
    })(req, res, next);
  },
  callback: function(req, res) {
    req.we.passport
    .authenticate('facebook', { failureRedirect: '/login' })(req, res, function (err) {
      if (err) {
        req.we.log.error('we-plugin-passport-facebook: Error on authenticate with facebook.strategy:', err);
        res.addMessage('error', 'auth.strategy.facebook.error');
      }

      // Successful authentication, redirect home.
      res.goTo('/');
    });

    // req.we.passport
    // .authenticate('google', { failureRedirect: '/login' })(req, res, function (err) {
    //   if (err) {
    //     req.we.log.error('we-plugin-passport-google: Error on authenticate with google.strategy:', err);
    //     res.addMessage('error', 'auth.oauth.error');
    //   }

    //   // Successful authentication, redirect home.
    //   res.goTo('/');
    // });
  }
}