var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  user: null,
  secret: 'keyboard cat',
  cookie: {
    maxAge: 60000
  }
}));

app.get('/', util.requireLogin,
function(req, res) {
  res.render('index');
  setTimeout(function() {
  }, 1000);
});

app.get('/create', util.requireLogin,
function(req, res) {
  res.redirect('/');
});

app.get('/links', util.requireLogin,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
   //get username and password
  var username = req.body.username;
  var password = req.body.password;

  //use username to check if it exists
  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      var savedPw = this.get('password');
      if (savedPw.length !== 60) {
        savedPw = bcrypt.hashSync(savedPw, null);
      }
      var match = bcrypt.compareSync(password, savedPw);
      //var match = (savedPw === password);
      if (match) {
        req.session.user = this.get('username');
        res.redirect('/');
      } else {
        res.redirect('/login');
      }

    } else {
      res.redirect('/login');
    }
  });
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      res.redirect('/signup');
    } else {
      var hash = bcrypt.hashSync(password, null);
      req.session.user = this.get('username');
      Users.create({
        username: username,
        password: hash
      })
      .then(function(data) {

        res.redirect('/');
      });
    }
  });
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
