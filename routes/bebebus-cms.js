const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/*', function(req, res, next) {
  console.log('Bebebus backend cms rout ...');
  res.sendFile(path.join(__dirname, '../public/bebebus-cms-center', 'index.html'));
});

module.exports = router;
