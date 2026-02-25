const express = require('express');
const router = express.Router();

const { userRegisterController,userLoginController,logoutController } = require('../controllers/auth.controller');
router.post('/register', userRegisterController);

router.post("/login", userLoginController);

router.post("/logout",logoutController);

module.exports = router;