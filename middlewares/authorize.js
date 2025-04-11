const jwt = require('jsonwebtoken');
const { User } = require('../models');


const authorize = (...roles) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }
        req.user = user;
        // Log roles for debugging

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tính năng này',
                roles: roles,
            });
        }


        next();
    };
};

module.exports = authorize;
