const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/user', userController.registerUser);
router.post('/login', userController.loginUser); 

module.exports = router;