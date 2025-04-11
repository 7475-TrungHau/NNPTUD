const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, PasswordResetToken } = require('../models');
const { sendEmail } = require('../utils/email');

// Hàm kiểm tra mật khẩu mạnh
const isStrongPassword = (password) => {
    // Ít nhất 8 ký tự
    if (password.length < 8) return false;

    // Kiểm tra có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// Hàm tạo mã OTP 6 chữ số
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Kiểm tra email hợp lệ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Kiểm tra mật khẩu mạnh
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }

        // Kiểm tra username và email đã tồn tại chưa
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            // Xác định chính xác lỗi là username hay email
            if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên đăng nhập đã tồn tại'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        // Lưu vào database
        await newUser.save();
        const token = jwt.sign({
            id: newUser._id,
            role: newUser.role,
            username: newUser.username
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Trả về kết quả thành công
        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            token: token,
            data: {
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu'
            });
        }

        // Tìm user theo username hoặc email
        const user = await User.findOne({
            $or: [
                { email: email },
            ]
        });

        // Nếu không tìm thấy user
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Trả về thông tin đăng nhập thành công
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
};

const me = async (req, res) => {
    try {
        // Lấy thông tin user từ database (trừ password)
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('favorites', 'title poster_url slug');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        res.status(200).json({
            success: true,
            user: user
        });
    } catch (err) {
        console.error('Get user profile error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Trả về thành công giả để tránh lộ thông tin email có tồn tại hay không
            return res.status(200).json({ success: true, message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã đặt lại mật khẩu.' });
        }

        // Tạo mã OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút

        // Xóa token cũ (nếu có) cho email này
        await PasswordResetToken.deleteMany({ email: user.email });

        // Lưu token mới vào DB
        const resetToken = new PasswordResetToken({
            email: user.email,
            token: otp, // Lưu OTP trực tiếp (cân nhắc mã hóa nếu cần bảo mật cao hơn)
            expiresAt: expiresAt,
        });
        await resetToken.save();

        // Gửi email chứa OTP
        const subject = 'Yêu cầu đặt lại mật khẩu';
        const textContent = `Mã xác thực đặt lại mật khẩu của bạn là: ${otp}. Mã này sẽ hết hạn sau 10 phút.`;
        const htmlContent = `<p>Mã xác thực đặt lại mật khẩu của bạn là: <strong>${otp}</strong></p><p>Mã này sẽ hết hạn sau 10 phút.</p>`;

        await sendEmail(user.email, subject, textContent, htmlContent);

        res.status(200).json({ success: true, message: 'Mã đặt lại mật khẩu đã được gửi đến email của bạn.' });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server, không thể xử lý yêu cầu đặt lại mật khẩu: ' + err.message });
    }
};

const verifyResetToken = async (req, res) => {
    try {
        const { email, token } = req.body;
        if (!email || !token) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã xác thực.' });
        }

        const resetToken = await PasswordResetToken.findOne({
            email: email,
            token: token,
            expiresAt: { $gt: Date.now() } // Kiểm tra token còn hạn
        });

        if (!resetToken) {
            return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }

        // Token hợp lệ
        res.status(200).json({ success: true, message: 'Mã xác thực hợp lệ.' });

    } catch (err) {
        console.error('Verify reset token error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server, không thể xác thực mã.' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email, mã xác thực và mật khẩu mới.' });
        }

        // Kiểm tra mật khẩu mới có mạnh không
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
            });
        }

        // Xác thực token
        const resetToken = await PasswordResetToken.findOne({
            email: email,
            token: token,
            expiresAt: { $gt: Date.now() }
        });

        if (!resetToken) {
            return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }

        // Tìm user
        const user = await User.findOne({ email: email });
        if (!user) {
            // Trường hợp hiếm gặp nếu user bị xóa sau khi yêu cầu reset
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu user
        user.password = hashedPassword;
        await user.save();

        // Xóa token đã sử dụng
        await PasswordResetToken.deleteOne({ _id: resetToken._id });

        res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công.' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server, không thể đặt lại mật khẩu.' });
    }
};

module.exports = {
    register,
    login,
    me,
    forgotPassword,
    verifyResetToken,
    resetPassword
};
