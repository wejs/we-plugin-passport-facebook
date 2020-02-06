module.exports = {
  updates() {
    return [{
      version: '1.3.0',
      update(we, done) {
        we.log.info('Start project update v1.3.0');

        const sql = `ALTER TABLE \`users\` ADD COLUMN \`facebookId\` TEXT NULL;`;
        we.db.defaultConnection
        .query(sql)
        .then( ()=> {
          we.log.info('Done project update v1.3.0');
          done();
        })
        .catch( (err)=> {
          if (err.name == 'SequelizeDatabaseError') {
            if (err.message == `Duplicate column name 'facebookId'`) {
              // fields already exists, nothing to do:
              return done();
            }
          }

          done(err); // unknow error
        });
      }
    }];
  }
};