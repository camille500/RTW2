/* LOAD IN ALL DEPENDENCIES
--------------------------------------------------------------- */
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const compression = require('compression')
const request = require('request')
const session = require('express-session')

/* CONFIGURE DEPENDENCIES
--------------------------------------------------------------- */
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
require('dotenv').config();

/* ALL AVAILABLE STOCKS
--------------------------------------------------------------- */
const allStocks = ['AAPL', 'AMZN', 'GOOGL', 'IBM', 'INTC', 'MSFT', 'FB', 'TSLA', 'TWTR', 'YHOO', 'ADBE', 'EBAY', 'NFLX', 'TRIP', 'ATVI']

/* CONFIGURE MONGODB
--------------------------------------------------------------- */
const MongoClient = require('mongodb').MongoClient;
const dbConfig = process.env.MONGODB_URI;

/* CONNECT WEBSOCKET
--------------------------------------------------------------- */
io.on('connection', function(socket) {
  console.log('connected')
});

/* CONNECT TO MONGODB
--------------------------------------------------------------- */
MongoClient.connect(dbConfig, (err, database) => {
  if (err) return console.log(err)
  db = database
  const collection = db.collection('stock');
  /* UPDATE STOCK DATA EVERY 1 MINUTE AND SAVE TO MONGODB
  --------------------------------------------------------------- */
  setInterval(function(){
    /* LOOP TROUGH ALL STOCKS AND COMPARE ACTUAL TO DB
    --------------------------------------------------------------- */
    allStocks.forEach(function(stock) {
      const url = `${process.env.STOCKAPIURL}${process.env.STOCKGLOBAL}symbol=${stock}${process.env.STOCKAPIKEY}`;
      /* REQUEST TO API FOR ACTUAL STOCK DATA FOR EACH STOCK
      --------------------------------------------------------------- */
      request(url, function (error, response, body) {
        let requestData = {};
        if(body.includes('<') == false) {
          requestData = JSON.parse(body)[process.env.MAIN];
        } else {
          requestData = {
            '03. Latest Price': 0,
            '07. Close (Previous Trading Day)': 0
          }
        }
        /* SEARCH FOR STOCK IN DATABASE
        --------------------------------------------------------------- */
        collection.findOne({
          ticker: stock
        }, function(err, ticker) {
          /* CHECK IF API RATE CORRESPONDS TO RATE IN DB
          --------------------------------------------------------------- */
          if (ticker.actual != requestData[process.env.LATEST]) {
            let lastValue = ticker.actual;
            const percentageChange = ((requestData[process.env.LATEST] - requestData[process.env.OPEN]) / requestData[process.env.OPEN]) * 100
            let dbData = {type: 'stock', ticker: stock, actual: requestData[process.env.LATEST], last: lastValue, open: requestData[process.env.OPEN], difference: percentageChange.toFixed(2)}
            /* UPDATE DB WITH NEWEST RATINGS IF SO
            --------------------------------------------------------------- */
            collection.update({ticker: stock}, dbData, {upsert:true}, function(err, doc) {
             io.emit('stock change', dbData)
             if (err) return res.send(500, {error: err});
            });
          }
        });
      });
    });
  }, 5000);
});

/* CONFIGURE EXPRESS SESSION
--------------------------------------------------------------- */
app.use(session({
  secret: process.env.SESSIONSECRET,
  resave: false,
  saveUninitialized: true
}));

/* CONFIGURE PORT
--------------------------------------------------------------- */
const port = process.env.PORT || 3000;

/* ENABLE CACHING AND COMPRESSION
--------------------------------------------------------------- */
app.set('view cache', true);
app.use(compression());

/* INITIALIZE MIDDLEWARE FOR THE VIEW ENGINE
--------------------------------------------------------------- */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* INITIALIZE BODY-PARSER FOR READING POST REQUESTS
--------------------------------------------------------------- */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* LOAD ALL ROUTERS
--------------------------------------------------------------- */
const indexRouter = require('./routes/index');
const stockRouter = require('./routes/stock');
const oAuthRouter = require('./routes/oauth');
const accountRouter = require('./routes/account');

/* INITIALIZE ROUTES
--------------------------------------------------------------- */
app.use(express.static('public'));
app.use('/', indexRouter);
app.use('/stock', stockRouter);
app.use('/twitter', oAuthRouter);
app.use('/account', accountRouter);

/* ENABLE 404 PAGE
--------------------------------------------------------------- */
app.enable('verbose errors');
app.use(function(req, res, next) {
  res.render('404');
});

/* START THE SERVER
--------------------------------------------------------------- */
http.listen(port, function() {
  console.log(`Server started on port ${port}`);
});
