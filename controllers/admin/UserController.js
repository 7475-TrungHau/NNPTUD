const User = require('../../models/User');


exports.getAllUsers = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = parseInt(limit);

    try {
        const searchCriteria = search
            ? {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { full_name: { $regex: search, $options: 'i' } }
                ],
            }
            : {};

        const users = await User.find(searchCriteria)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(queryLimit);

        const totalUsers = await User.countDocuments(searchCriteria);

        res.status(200).json({
            totalUsers: totalUsers,
            totalPages: Math.ceil(totalUsers / queryLimit),
            currentPage: parseInt(page),
            users: users,
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách người dùng:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách người dùng', error: error.message });
    }
};


exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Lỗi lấy người dùng theo ID:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Định dạng ID người dùng không hợp lệ' });
        }
        res.status(500).json({ message: 'Lỗi lấy chi tiết người dùng', error: error.message });
    }
};


exports.updateUser = async (req, res) => {
    const { role, full_name, email } = req.body;
    const userId = req.params.id;
    const updateData = {};


    if (role !== undefined) {

        const allowedRoles = User.schema.path('role').enumValues;
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: `Vai trò không hợp lệ. Các vai trò được phép là: ${allowedRoles.join(', ')}` });
        }
        updateData.role = role;
    }
    if (full_name !== undefined) {
        updateData.full_name = full_name;
    }
    if (email !== undefined) {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
        }
        updateData.email = email;
    }


    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu cập nhật nào được cung cấp.' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.status(200).json({ message: 'Cập nhật người dùng thành công', user: updatedUser });
    } catch (error) {
        console.error('Lỗi cập nhật người dùng:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Định dạng ID người dùng không hợp lệ' });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Lỗi xác thực: ' + error.message, errors: error.errors });
        }
        res.status(500).json({ message: 'Lỗi cập nhật người dùng: ' + error.message, error: error.message });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }


        if (user._id.toString() === req.user.id) {

            return res.status(400).json({ message: "Không thể xóa tài khoản của chính bạn." });
        }

        res.status(200).json({ message: 'Xóa người dùng thành công', userId: user._id });
    } catch (error) {
        console.error('Lỗi xóa người dùng:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Định dạng ID người dùng không hợp lệ' });
        }
        res.status(500).json({ message: 'Lỗi xóa người dùng: ' + error.message, error: error.message });
    }
};
