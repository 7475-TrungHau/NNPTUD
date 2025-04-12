const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const auth = require('../middlewares/auth');


router.post('/register', AuthController.register);


router.post('/login', AuthController.login);


router.get('/me', auth, AuthController.me);


router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Đăng xuất thành công'
    });
});


router.post('/forgot-password', AuthController.forgotPassword);


router.post('/verify-reset-token', AuthController.verifyResetToken);


router.post('/reset-password', AuthController.resetPassword);


module.exports = router;
