const { Subscription, User, Package, Payment } = require('../../models');
const mongoose = require('mongoose');

const index = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const subscriptions = await Subscription.find()
            .populate('user', 'username email full_name')
            .populate('package', 'name price duration_days')

            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalSubscriptions = await Subscription.countDocuments();
        const totalPages = Math.ceil(totalSubscriptions / limit);


        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đăng ký thành công',
            data: subscriptions,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalSubscriptions,
                limit: limit,
            }

        });
    } catch (error) {
        console.error('Lỗi lấy danh sách đăng ký:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đăng ký', error: error.message });
    }
};


const show = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Định dạng ID đăng ký không hợp lệ' });
        }

        const subscription = await Subscription.findById(id)
            .populate('user', 'username email full_name avatar')
            .populate('package');


        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký' });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết đăng ký thành công',
            data: subscription
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết đăng ký:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đăng ký', error: error.message });
    }
};


const store = async (req, res) => {
    try {
        const { user_id, package_id } = req.body;


        if (!user_id || !package_id) {
            return res.status(400).json({ success: false, message: 'Yêu cầu ID người dùng và ID gói' });
        }
        if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(package_id)) {
            return res.status(400).json({ success: false, message: 'Định dạng ID người dùng hoặc ID gói không hợp lệ' });
        }


        const user = await User.findById(user_id);
        const pkg = await Package.findById(package_id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
        }
        if (!pkg.is_active) {
            return res.status(400).json({ success: false, message: 'Gói đã chọn không hoạt động' });
        }


        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + pkg.duration_days);

        const newSubscription = new Subscription({
            user: user_id,
            package: package_id,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
        });

        await newSubscription.save();


        const populatedSubscription = await Subscription.findById(newSubscription._id)
            .populate('user', 'username email')
            .populate('package', 'name price');

        res.status(201).json({
            success: true,
            message: 'Tạo đăng ký thành công',
            data: populatedSubscription
        });

    } catch (error) {
        console.error('Lỗi tạo đăng ký:', error);

        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp dữ liệu', error: error.message });
        }
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo đăng ký', error: error.message });
    }
};


const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, end_date, package_id } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Định dạng ID đăng ký không hợp lệ' });
        }

        if (package_id) {
            if (!mongoose.Types.ObjectId.isValid(package_id)) {
                return res.status(400).json({ success: false, message: 'Định dạng ID gói không hợp lệ' });
            }
            const pkg = await Package.findById(package_id);
            if (!pkg) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
            }
            if (!pkg.is_active) {
                return res.status(400).json({ success: false, message: 'Gói đã chọn không hoạt động' });
            }
        }



        const updateData = {};
        if (status) {
            if (!['active', 'expired', 'canceled'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Giá trị trạng thái không hợp lệ. Phải là active, expired, hoặc canceled.' });
            }
            updateData.status = status;
            if (package_id) { // Only update package if status is also being updated (or explicitly provided)
                updateData.package = package_id;
            }
        } else if (package_id) { // Allow updating package independently
            updateData.package = package_id;
        }

        if (end_date) {
            const parsedEndDate = new Date(end_date);
            if (isNaN(parsedEndDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Định dạng ngày kết thúc không hợp lệ.' });
            }
            updateData.end_date = parsedEndDate;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'Không có trường hợp lệ nào được cung cấp để cập nhật.' });
        }


        const updatedSubscription = await Subscription.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('user', 'username email').populate('package', 'name');

        if (!updatedSubscription) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký' });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật đăng ký thành công',
            data: updatedSubscription
        });

    } catch (error) {
        console.error('Lỗi cập nhật đăng ký:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật đăng ký', error: error.message });
    }
};


const destroy = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Định dạng ID đăng ký không hợp lệ' });
        }

        const deletedSubscription = await Subscription.findByIdAndDelete(id);

        if (!deletedSubscription) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký' });
        }


        res.status(200).json({
            success: true,
            message: 'Xóa đăng ký thành công',
            data: { id: deletedSubscription._id }
        });

    } catch (error) {
        console.error('Lỗi xóa đăng ký:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa đăng ký', error: error.message });
    }
};


module.exports = {
    index,
    show,
    store,
    update,
    destroy
};
