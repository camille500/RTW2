/* LOAD ALL DEPENDENCIES
--------------------------------------------------------------- */
const express = require('express');
const router = express.Router();
const request = require('request');
let stock = {};
let portfolio = {};

/* INDEX ROUTE
--------------------------------------------------------------- */
router.get('/', findAll, function(req, res) {
  res.locals.stock = stock;
  res.render('stock/index');
});

router.get('/dashboard', checkForSession, findAll, getPortfolio, function(req, res) {
    res.locals.user = req.session.user;
    res.locals.portfolio = portfolio;
    res.locals.stock = stock;
    console.log(portfolio)
    res.render('stock/dashboard');
});

router.get('/detail/:ticker', checkForSession, getPortfolio, function(req, res) {
  const ticker = req.params.ticker;
  if(portfolio[ticker]) {
    res.locals.buy = false;
    res.render('stock/detail');
  } else {
    const url = `${process.env.STOCKAPIURL}${process.env.STOCKGLOBAL}symbol=${ticker}${process.env.STOCKAPIKEY}`;
    request(url, function (error, response, body) {
        const data = JSON.parse(body)[process.env.MAIN];
        res.locals.latest = data[process.env.LATEST];
        res.locals.open = data[process.env.OPEN];
        res.locals.user = req.session.user;
        res.locals.buy = true;
        req.session[ticker] = data[process.env.LATEST]
        res.render('stock/detail');
    });
  }
});

router.post('/detail/:ticker', checkForSession, function(req, res) {
  const ticker = req.params.ticker;
  const amount = req.body.amount;
  const transactionData = {user: req.session.data.screen_name, ticker: ticker, amount: amount, price: req.session[ticker]}
  const userData = req.session.user;
  delete userData['_id'];
  userData.saldo = req.session.user.saldo - (req.session[ticker] * amount);
  const transactionCollection = db.collection('transactions');
  const userCollection = db.collection('users');
  transactionCollection.update({username: req.session.data.screen_name}, transactionData, {upsert:true}, function(err, doc) {
   if (err) return res.send(500, {error: err});
   userCollection.update({username: req.session.data.screen_name}, userData, {upsert:false}, function(err, doc) {
    if (err) return res.send(500, {error: err});
    req.session.user.saldo = userData.saldo;
    res.redirect('/stock/dashboard')
   });
  });
});

router.get('/sell/:ticker/:id', checkForSession, getPortfolio, findAll, function(req, res) {
  const ticker = req.params.ticker;
  const amount = portfolio[ticker].amount;
  const sellPrice = stock[ticker][0];
  res.locals.amount = amount;
  res.locals.sellFor = sellPrice;
  res.locals.total = amount * sellPrice;
  res.render('stock/sell');
});

router.post('/sell/:ticker/:id', checkForSession, function(req, res) {
  const transactionID = req.params.id;
  console.log(transactionID);
  res.redirect('/stock/dashboard');
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

function getPortfolio(req, res, next) {
  portfolio = {};
  const collection = db.collection('transactions');
  collection.find({user: req.session.data.screen_name}, function(err, results) {
    results.forEach(function(result) {
      portfolio[result.ticker] = result;
    });
  });
  setTimeout(function() {
    next();
  }, 2000)
}

function findAll(req, res, next) {
  stock = {};
  const collection = db.collection('stock');
  collection.find({ "type": "stock" }, function(err, stocks) {
    stocks.forEach(function(d) {
      stock[d.ticker] = [d.actual, d.difference];
    });
  });
  setTimeout(function() {
    next();
  }, 2000)
}

/* EXPORT ROUTER
--------------------------------------------------------------- */
module.exports = router;
