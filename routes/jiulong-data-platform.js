const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/*', function(req, res, next) {
  console.log('Jiulong data platform route ...');
  res.sendFile(path.join(__dirname, '../public/jiulong-data-platform', 'index.html'));
});

module.exports = router;
