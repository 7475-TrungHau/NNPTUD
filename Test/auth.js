const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const auth = require('../middlewares/auth');

// Route đăng ký
router.post('/register', AuthController.register);

// Route đăng nhập
router.post('/login', AuthController.login);

// Route lấy thông tin người dùng hiện tại
router.get('/me', auth, AuthController.me);

// Route đăng xuất (chỉ để client xóa token)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Đăng xuất thành công'
    });
});

// Route yêu cầu đặt lại mật khẩu
router.post('/forgot-password', AuthController.forgotPassword);

// Route xác thực mã OTP
router.post('/verify-reset-token', AuthController.verifyResetToken);

// Route đặt lại mật khẩu mới
router.post('/reset-password', AuthController.resetPassword);


module.exports = router;
