const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', (req, res, next) => {
  console.log('Got body:', req.body);
  let userCredential = req.body;
  if (userCredential.username === 'admin' && userCredential.password === 'bebebus123') {
    res.send({
      token: 'test123'
    });
  } else {
    res.send({});
  }
});

module.exports = router;
