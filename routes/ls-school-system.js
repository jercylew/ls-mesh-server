const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/*', function(req, res, next) {
  console.log('LS school intelligent management system route ...');
  res.sendFile(path.join(__dirname, '../public/ls-school-system', 'index.html'));
});

module.exports = router;
