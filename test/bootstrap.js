const projectPath = process.cwd(),
      path = require('path'),
      deleteDir = require('rimraf'),
      testTools = require('we-test-tools');

let we;

// TODO! load this token and user  with facebook api:
process.env.FB_TEST_EMAIL = 'test_myafckb_usonildo@tfbnw.net';
process.env.FB_TEST_PASSWORD = 'aosjdjj89au8912sa';
process.env.ACCESS_TOKEN = 'EAAEAYPEi0fYBAD3f5jWIs0JljElh4akQEysv7IVcAyPK8g0KpmPOxE5QYOcmLlBFEM1f3mHbni38XD61zz0bjNeLCa6FelZBj5op8ZClVTimhcWaDMGCeHK1btN5JcgfXcMPsiQGh55U9J7VaI7lvny31gwoDFzOGp5sEJbd6JeVpTnfZA0a1hxkfF89D8hbQIpZCD2ZCXo4NfwujTvmJPFhF57Ojo5PtiNJMGTbCZCibE9kQM6ryI';

before(function(callback) {
  testTools.copyLocalSQLiteConfigIfNotExists(projectPath, callback);
});

before(function(callback) {
  this.slow(100);

  if (
    !process.env.FB_CLIENT_ID ||
    !process.env.FB_CLIENT_SECRET
  ) {
    console.error('env.FB_APP_ID and env.FB_APP_SECRET is required');
    process.exit(1);
  }

  const We = require('we-core');
    we = new We();

  testTools.init({}, we);

  we.bootstrap({
    port: 9800,
    hostname: 'http://localhost:9800',
    appName: 'We test',
    passport: {
      accessTokenTime: 300000000,
      cookieDomain: null,
      cookieName: 'weoauth',
      cookieSecure: false,

      strategies: {
        facebook: {
          clientID: process.env.FB_CLIENT_ID,
          clientSecret: process.env.FB_CLIENT_SECRET
        }
      }
    },
    i18n: {
      directory: path.join(__dirname, 'locales'),
      updateFiles: true
    }
  } , callback);
});

// start the server:
before(function (callback) {
  we.plugins['we-plugin-passport-facebook'] = we.plugins.project;
  we.startServer(callback);
});

// after all tests remove test folders and delete the database:
after(function (callback) {
  testTools.helpers.resetDatabase(we, (err)=> {
    if(err) return callback(err);

    we.db.defaultConnection.close();

    const tempFolders = [
      path.join(projectPath + 'files', 'config'),
      path.join(projectPath, 'database.sqlite'),
      path.join(projectPath, 'sessionsDB'),
    ];

    we.utils.async.each(tempFolders, (folder, next)=> {
      deleteDir( folder, next);
    }, callback);
  });
});

after(function () {
  we.exit(process.exit);
});
