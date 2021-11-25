var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/*', function(req, res, next) {
  console.log('Bebebus backend cms rout ...');
  res.sendFile(path.join(__dirname, '../public/bebebus-cms-center', 'index.html'));
});

module.exports = router;
