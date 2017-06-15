/* LOAD ALL DEPENDENCIES
----------------------------------------- */
const express = require('express');
const router = express.Router();
const passwordHash = require('password-hash');

/* FIRST CHECK FOR SESSION, IF SO GO TO THE STOCK PAGE
--------------------------------------------------------------- */
router.get('/', checkForSession, function(req, res) {
  res.redirect('/stock')
});

/* RENDER LOGIN PAGE
--------------------------------------------------------------- */
router.get('/login', function(req, res) {
  res.render('account/login');
});

/* RENDER SETUP PAGE IF THERE IS NO ONE CONNECTED TO TWITTER ACCOUNT
--------------------------------------------------------------- */
router.get('/setup', checkForSession, function(req, res) {
  res.render('account/setup')
});

/* HANDLE SETUP POST REQUEST, CREATE ACCOUNT IN MONGODB
--------------------------------------------------------------- */
router.post('/setup', function(req, res) {
  const userCollection = db.collection('users');
  const username = req.session.data.screen_name;
  const fullname = req.body.fullname;
  const hometown = req.body.hometown;
  const email = req.body.email;
  const setupData = {
    type: 'user',
    username: req.session.data.screen_name,
    fullname: fullname,
    mail: email,
    homeTown: hometown,
    saldo: 100000
  };
  /* IF USER EXISTS, GO TO THE DASHBOARD. IF NOT, CREATE THE USER
  --------------------------------------------------------------- */
  userCollection.findOne({
    username: req.session.data.screen_name
  }, function(err, user) {
    if (user) {
      req.session.user = user;
      res.redirect('/dashboard');
    } else {
      userCollection.save(setupData, (err, result) => {
        if (err) return console.log(err);
        req.session.user = setupData;
        res.redirect('/account/');
      });
    }
  });
});

/* LOGOUT AND DESTROY SESSION
--------------------------------------------------------------- */
router.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});

function checkForSession(req, res, next) {
  if (req.session.login) {
    res.locals.data = req.session.data;
    res.locals.user = req.session.user;
    next();
  } else {
    res.redirect('/account/login');
  }
}

/* EXPORT ROUTER
----------------------------------------- */
module.exports = router;
