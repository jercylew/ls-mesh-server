var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/*', function(req, res, next) {
  console.log('LS cloud platform route ...');
  res.sendFile(path.join(__dirname, '../public/ls-cloud-platform', 'index.html'));
});

module.exports = router;
