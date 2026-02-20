const express = require('express');
const router = express.Router();
const PageController = require('../controllers/page.controller');

// Controllers
router.get('/docs', PageController.docs);

module.exports = router;