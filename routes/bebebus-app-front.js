var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/*', function(req, res, next) {
  console.log('Bebebus app front rout ...');
  res.sendFile(path.join(__dirname, '../public/bebebus-app-front', 'index.html'));
});

module.exports = router;
