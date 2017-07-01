/* MAKE SOCKET.IO ACCESSABLE
--------------------------------------------------------------- */
module.exports = function(io) {

  /* LOAD ALL DEPENDENCIES
  --------------------------------------------------------------- */
  const express = require('express');
  const router = express.Router();
  const request = require('request');

  /* INDEX ROUTE
  --------------------------------------------------------------- */
  router.get('/', findAll, function(req, res) {
    /* MAKE ALL STOCK INFORMATION ACCESSABLE
    --------------------------------------------------------------- */
    res.locals.stock = req.session.stock;
    res.render('stock/index');
  });

  /* DASHBOARD ROUTER
  --------------------------------------------------------------- */
  router.get('/dashboard', checkForSession, findAll, getPortfolio, function(req, res) {
    res.locals.user = req.session.user;
    res.locals.portfolio = req.session.portfolio;
    res.locals.stock = req.session.stock;
    /* CHECKS THE ACTUAL VALUE OF STOCKS IN USERS PORTFOLIO
    --------------------------------------------------------------- */
    checkValue(req, res);
    res.render('stock/dashboard');
  });

  router.get('/userlist', function(req, res) {
    const collection = db.collection('users');
    req.session.userlist = {};
    collection.find({
      "type": "user"
    }, function(err, users) {
      users.forEach(function(user) {
        req.session.userlist[user.username] = [user.username, user.saldo];
      });
      res.locals.users = req.session.userlist;
      setTimeout(function() {
        res.render('stock/userlist');
      }, 2000)
    });
  });

  /* DETAIL PAGE FOR EACH POSSIBLE TICKER
  --------------------------------------------------------------- */
  router.get('/detail/:ticker', checkForSession, getPortfolio, function(req, res) {
    const ticker = req.params.ticker;
    /* CHECK IF USER ALREADY HAS STOCKS FROM THE TICKER
    --------------------------------------------------------------- */
    if (req.session.portfolio[ticker]) {
      res.locals.buy = false;
      res.render('stock/detail');
    } else {
      const url = `${process.env.STOCKAPIURL}${process.env.STOCKGLOBAL}symbol=${ticker}${process.env.STOCKAPIKEY}`;
      /* GET LATEST STOCK INFO, HAS TO BE ACTUAL BECAUSE USER CAN BUY NOW
      --------------------------------------------------------------- */
      request(url, function(error, response, body) {
        const data = JSON.parse(body)[process.env.MAIN];
        res.locals.latest = data[process.env.LATEST];
        res.locals.open = data[process.env.OPEN];
        req.session.user.ticker = ticker;
        res.locals.user = req.session.user;
        req.session[ticker] = data[process.env.LATEST];
        req.session.canBuy = true;
        res.locals.buy = true;
        res.render('stock/detail');
      });
    }
  });

  /* HANDLE THE BUYING OF NEW STOCKS
  --------------------------------------------------------------- */
  router.post('/detail/:ticker', checkForSession, function(req, res) {
    if(req.session.canBuy === true) {
      req.session.canBuy = false;
      const ticker = req.params.ticker;
      const amount = req.body.amount;
      /* DATA FOR IN THE TRANSACTION COLLECTION
      --------------------------------------------------------------- */
      const transactionData = {
        user: req.session.data.screen_name,
        ticker: ticker,
        amount: amount,
        price: req.session[ticker]
      }
      const userData = req.session.user;
      delete userData['_id'];
      /* WITHDRAW TRANSACTION COSTS FROM USERS SALDO
      --------------------------------------------------------------- */
      userData.saldo = req.session.user.saldo - (req.session[ticker] * amount);
      const transactionCollection = db.collection('transactions');
      const userCollection = db.collection('users');
      /* UPDATE USER & TRANSACTION COLLECTIONS
      --------------------------------------------------------------- */
      transactionCollection.update({
        username: req.session.data.screen_name
      }, transactionData, {
        upsert: true
      }, function(err, doc) {
        if (err)
          return res.send(500, {error: err});
        userCollection.update({
          username: req.session.data.screen_name
        }, userData, {
          upsert: false
        }, function(err, doc) {
          if (err)
            return res.send(500, {error: err});
          req.session.user.saldo = userData.saldo;
          res.redirect('/stock/dashboard')
        });
      });
    } else {
      res.redirect('/stock/dashboard');
    }
  });

  /* ROUTE FOR SELLING STOCKS
  --------------------------------------------------------------- */
  router.get('/sell/:ticker/:id', checkForSession, getPortfolio, findAll, function(req, res) {
    const ticker = req.params.ticker;
    const amount = req.session.portfolio[ticker].amount;
    const sellPrice = req.session.stock[ticker][0];
    res.locals.amount = amount;
    res.locals.sellFor = sellPrice;
    res.locals.total = amount * sellPrice;
    req.session.canSell = true;
    res.render('stock/sell');
  });

  /* HANDLE THE SELLING OF STOCKS
  --------------------------------------------------------------- */
  router.post('/sell/:ticker/:id', checkForSession, function(req, res) {
    if(req.session.canSell === true) {
      req.session.canSell = false;
      const ticker = req.params.ticker;
      const userData = req.session.user;
      delete userData['_id'];
      /* CALCULATE NEW SALDO
      --------------------------------------------------------------- */
      userData.saldo = req.session.user.saldo + (req.session.portfolio[ticker].amount * req.session.stock[ticker][0]);
      const transactionCollection = db.collection('transactions');
      const userCollection = db.collection('users');
      /* UPDATE USER AND TRANSACTION COLLECTIONS
      --------------------------------------------------------------- */
      transactionCollection.deleteOne({ticker: ticker, user: req.session.data.screen_name})
      userCollection.update({
        username: req.session.data.screen_name
      }, userData, {
        upsert: false
      }, function(err, doc) {
        if (err)
          return res.send(500, {error: err});
        req.session.user.saldo = userData.saldo;
        res.redirect('/stock/dashboard')
      })
    } else {
      res.redirect('/stock/dashboard');
    }
  });

  /* CHECK IF THE USER HAS A SESSION / IS LOGGED IN WITH TWITTER
  --------------------------------------------------------------- */
  function checkForSession(req, res, next) {
    if (req.session.login) {
      res.locals.data = req.session.data;
      res.locals.user = req.session.user;
      next();
    } else {
      res.redirect('/account/login');
    }
  }

  /* GET USERS FULL PORTFOLIO
  --------------------------------------------------------------- */
  function getPortfolio(req, res, next) {
    req.session.portfolio = {};
    const collection = db.collection('transactions');
    collection.find({
      user: req.session.data.screen_name
    }, function(err, results) {
      results.forEach(function(result) {
        req.session.portfolio[result.ticker] = result;
      });
    });
    setTimeout(function() {
      next();
    }, 2000)
  }

  /* GET ALL LATEST STOCK DATA FROM THE DATABASE
  --------------------------------------------------------------- */
  function findAll(req, res, next) {
    req.session.stock = {};
    const collection = db.collection('stock');
    collection.find({
      "type": "stock"
    }, function(err, stocks) {
      stocks.forEach(function(d) {
        req.session.stock[d.ticker] = [d.actual, d.difference];
      });
    });
    setTimeout(function() {
      next();
    }, 2000)
  }

  /* CHECK ACTUAL VALUE OF ALL STOCKS IN USERS PORTFOLIO
  --------------------------------------------------------------- */
  function checkValue(req, res) {
    const collection = db.collection('stock');
    setInterval(function() {
      for (var key in req.session.portfolio) {
        collection.find({
          "ticker": req.session.portfolio[key].ticker
        }, function(err, singleStock) {
          singleStock.forEach(function(d) {
            /* IF ACTUAL PRICE IS NOT THE SAME AS PORTFOLIO PRICE, UPDATE AND EMIT TO SOCKET
            --------------------------------------------------------------- */
            if (req.session.portfolio[d.ticker].price != d.actual) {
              const difference = (((Number(d.actual) - (Number(req.session.portfolio[d.ticker].price)))) / Number(req.session.portfolio[d.ticker].price) * 100).toFixed(2)
              const newPrice = d.actual;
              const data = [d.ticker, newPrice, difference];
              io.emit('new price', data)
            }
          })
        });
      }
    }, 5000);
  }

  /* EXPORT ROUTER
  --------------------------------------------------------------- */
  return router;

}
