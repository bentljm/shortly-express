var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  // saltRounds: 10,

  // //Saving an object with a keys of username, salt, hashed password
  // initialize: function() {
  //   this.on('creating', function(model, attrs, options) {
  //     // console.log('hello')
  //     // console.log('model' + JSON.stringify(model.username));
  //     // console.log('attrs' + JSON.stringify(attrs));
  //   });
  // },
});

module.exports = User;




