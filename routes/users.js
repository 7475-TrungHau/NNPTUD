var express = require('express');
var router = express.Router();


router.get('/', function (req, res, next) {
  res.send('phản hồi với một tài nguyên');
});

module.exports = router;
