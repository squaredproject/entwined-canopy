var express = require('express');
var router = express.Router();

/* GET shrub control pages */
router.get('/shrubs/:shrubId', function(req, res, next) {
  res.sendFile('index.html', { root: 'dist' });
});

module.exports = router;
