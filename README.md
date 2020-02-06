# We.js facebook authentication strategy

Login with facebook in your we.js project

## How to install

```sh
we i we-plugin-passport-facebook
```

## How to configure

### Create an Application

Before using passport-facebook, you must register an application with Facebook. If you have not already done so, a new application can be created at Facebook [Developers](https://developers.facebook.com/). Your application will be issued an app ID and app secret, which need to be provided to the strategy. You will also need to configure a redirect URI which matches the route in your application.

### Configure Strategy

To configure in your project update the file: `config/locals.js` :

```
// ...
  passport: {
    strategies: {
      facebook: {
        clientID: 'facebook api client id',
        clientSecret: 'facebook api client secret',
        redirectUrlAfterSuccess: '/',
        redirectUrlAfterFailure: '/login',        
        // callbackURL: 'a custom callback url' // optional, if set an root url add / in end ot it
      }
    }
  }
// ...
```

## API

#### Login with facebook url:

This url will start the authentication.
```
'get /auth/facebook': {
  controller    : 'passportFacebook',
  action        : 'page',
  responseType  : 'json'
},
```

#### Callback from facebook url:

Default callback url:

```
'get /auth/facebook/callback': {
  controller    : 'passportFacebook',
  action        : 'callback',
  responseType  : 'json'
}
```

#### Authenticate with user short lived access_token:

Usefull for apps:

```
'post /auth/facebook/app-login': {
  controller    : 'passportFacebook',
  action        : 'APPloginWithFacebookAccessToken',
  responseType  : 'json'
}
```

## Links

> * We.js site: http://wejs.org
> * Facebook passport strategy: https://github.com/jaredhanson/passport-facebook

## License

Under [the MIT license](https://github.com/wejs/we/blob/master/LICENSE.md).

## Sponsored by

- Linky Systems: https://linkysystems.com
