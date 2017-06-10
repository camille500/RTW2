/* LOAD ALL DEPENDENCIES
--------------------------------------------------------------- */
const express = require('express');
const router = express.Router();
const request = require('request');
const stock = {}

/* INDEX ROUTE
--------------------------------------------------------------- */
router.get('/', findAll, function(req, res) {
  res.locals.stock = stock;
  res.render('stock/index');
});

router.get('/dashboard', findAll, function(req, res) {
  res.render('account/dashboard');
});

router.get('/detail/:ticker', checkForSession, function(req, res) {
  const ticker = req.params.ticker;
  const url = `${process.env.STOCKAPIURL}${process.env.STOCKGLOBAL}symbol=${ticker}${process.env.STOCKAPIKEY}`;
  request(url, function (error, response, body) {
      const data = JSON.parse(body)[process.env.MAIN];
      res.locals.latest = data[process.env.LATEST];
      res.locals.open = data[process.env.OPEN];
      res.locals.user = req.session.user;
      req.session[ticker] = data[process.env.LATEST]
      res.render('stock/detail');
  });
});

router.post('/detail/:ticker', checkForSession, function(req, res) {
  const ticker = req.params.ticker;
  const amount = req.body.amount;
  const transactionData = {user: req.session.data.screen_name, ticker: ticker, amount: amount, price: req.session[ticker]}
  const userData = req.session.user;
  delete userData['_id'];
  userData.saldo = req.session.user.saldo - amount;
  const transactionCollection = db.collection('transactions');
  const userCollection = db.collection('users');
  transactionCollection.update({username: req.session.data.screen_name}, transactionData, {upsert:true}, function(err, doc) {
   if (err) return res.send(500, {error: err});
   userCollection.update({username: req.session.data.screen_name}, userData, {upsert:false}, function(err, doc) {
    if (err) return res.send(500, {error: err});
    res.redirect('/stock')
   });
  });
});

function findAll(req, res, next) {
  const collection = db.collection('stock');
  collection.find({ "type": "stock" }, function(err, targets) {
    targets.forEach(function(d) {
      stock[d.ticker] = d.difference;
    })
  });
  setTimeout(function() {
    next();
  }, 2000)
}

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
--------------------------------------------------------------- */
module.exports = router;
