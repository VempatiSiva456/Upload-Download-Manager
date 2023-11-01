const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send("<a href='/minio'>MinIO</a>");
});

module.exports = router;
