const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/*', function(req, res, next) {
  console.log('Index rout ...');
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

module.exports = router;
