const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/user', userController.registerUser);
router.post('/login', loginLimiter, userController.loginUser);

module.exports = router;
