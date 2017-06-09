/*
STOCKAPIURL=http://www.alphavantage.co/query?
STOCKAPIKEY=&apikey=V3RO
STOCKGLOBAL=function=GLOBAL_QUOTE&
STOCKINTRA=function=GLOBAL_QUOTE&
*/

/* LOAD ALL DEPENDENCIES
--------------------------------------------------------------- */
const express = require('express');
const router = express.Router();
const request = require('request');

/* INDEX ROUTE
--------------------------------------------------------------- */
router.get('/', findAll, function(req, res) {
  res.render('stock/index');
});

router.get('/detail/:ticker', function(req, res) {
  const ticker = req.params.ticker;
  const url = `${process.env.STOCKAPIURL}${process.env.STOCKGLOBAL}symbol=${ticker}${process.env.STOCKAPIKEY}`;
  request(url, function (error, response, body) {
      const data = JSON.parse(body)[process.env.MAIN];
      res.locals.latest = data[process.env.LATEST];
      res.locals.open = data[process.env.OPEN];
      res.render('stock/detail');
  });
});

function findAll(req, res, next) {
  const collection = db.collection('stock');
  collection.find({ "type": "stock" }, function(err, targets) {
    targets.forEach(function(d) {
      console.log(d)
    })
  });
  next();
}

/* EXPORT ROUTER
--------------------------------------------------------------- */
module.exports = router;
