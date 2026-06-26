const express = require('express');
const router = express.Router();
const { getLocalIP } = require('../utils/networkInfo');

router.get('/', (req, res) => {
  res.json({
    localIP: getLocalIP(),
    port: process.env.PORT || 3001,
  });
});

module.exports = router;
