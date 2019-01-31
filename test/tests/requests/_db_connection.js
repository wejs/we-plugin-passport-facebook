const assert = require('assert'),
      helpers = require('we-test-tools').helpers;

let we;

describe('db_connection', function() {
  before(function (done) {
    we = helpers.getWe();
    return done();
  });

  it ('Should connect in database', function (done) {
    we.db.defaultConnection.query('SELECT * FROM plugins')
    .then( (r)=> {
      assert(r.length, 'Should return data if connected in SQLite database');
      done();
    })
    .catch(done);
  });
});
