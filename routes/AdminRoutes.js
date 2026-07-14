const express = require('express');
const router = express.Router();
const { login } = require('../controllers/AdminController');

router.post('/login', login);

module.exports = router;