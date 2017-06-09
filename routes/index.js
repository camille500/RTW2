/* LOAD ALL DEPENDENCIES
--------------------------------------------------------------- */
const express = require('express');
const router = express.Router();

/* INDEX ROUTE
--------------------------------------------------------------- */
router.get('/', function(req, res) {
  res.render('index');
});

/* EXPORT ROUTER
--------------------------------------------------------------- */
module.exports = router;
