const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Kiểm tra user có tồn tại trong database không
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc người dùng không tồn tại'
            });
        }

        // Gán thông tin user vào request
        req.user = decoded;
        req.userDetails = user;

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn, vui lòng đăng nhập lại'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

module.exports = auth;