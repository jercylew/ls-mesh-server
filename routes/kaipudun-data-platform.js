const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/*', function(req, res, next) {
  console.log('Kaipudun data platform route ...');
  res.sendFile(path.join(__dirname, '../public/kaipudun-data-platform', 'index.html'));
});

module.exports = router;
