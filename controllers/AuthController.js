const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, PasswordResetToken, Package } = require('../models');
const { sendEmail } = require('../utils/email');
const Subscription = require('../models/Subscription');


const isStrongPassword = (password) => {

    if (password.length < 8) return false;


    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};


const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;


        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }


        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }


        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
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

        const hashedPassword = await bcrypt.hash(password, 10);




        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        const package = await Package.findOne({ name: 'Basic' }).select('_id duration_days price');
        if (package) {
            Subscription.create({
                user: newUser._id,
                package: package._id,
                start_date: new Date(),
                end_date: package.duration_days ? new Date(Date.now() + package.duration_days * 24 * 60 * 60 * 1000) : null,
                status: 'active'
            });
        }

        const token = jwt.sign({
            id: newUser._id,
            role: newUser.role,
            username: newUser.username
        }, process.env.JWT_SECRET, { expiresIn: '1h' });


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


        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu'
            });
        }


        const user = await User.findOne({
            $or: [
                { email: email },
            ]
        });


        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }


        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );


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

        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('favorites', 'title poster_url slug');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }
        let packages = [];
        const Subscriptions = await Subscription.find({ user: user._id }).lean();
        const activeSubscriptions = Subscriptions.filter(sub => sub.status === 'active');
        if (activeSubscriptions.length > 0) {
            packages = await Package.find({
                _id: { $in: activeSubscriptions.map(sub => sub.package) }
            }).select('name price _id');
            user.packages = packages;
        } else {
            packages = [];
        }


        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar: user.avatar,
                favorites: user.favorites,
                packages: packages
            }
        });
    } catch (err) {
        console.error('Get user profile error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau' + err.message
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

            return res.status(200).json({ success: true, message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã đặt lại mật khẩu.' });
        }


        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);


        await PasswordResetToken.deleteMany({ email: user.email });


        const resetToken = new PasswordResetToken({
            email: user.email,
            token: otp,
            expiresAt: expiresAt,
        });
        await resetToken.save();


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
            expiresAt: { $gt: Date.now() }
        });

        if (!resetToken) {
            return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }


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


        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
            });
        }


        const resetToken = await PasswordResetToken.findOne({
            email: email,
            token: token,
            expiresAt: { $gt: Date.now() }
        });

        if (!resetToken) {
            return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }


        const user = await User.findOne({ email: email });
        if (!user) {

            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }


        const hashedPassword = await bcrypt.hash(newPassword, 10);


        user.password = hashedPassword;
        await user.save();


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
