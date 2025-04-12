const Subscription = require('../../models/Subscription');
const Package = require('../../models/Package');
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const mongoose = require('mongoose');


exports.createSubscription = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user.id;
        const { packageId } = req.body;

        if (!packageId || !mongoose.Types.ObjectId.isValid(packageId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Yêu cầu ID gói hợp lệ.' });
        }


        const selectedPackage = await Package.findById(packageId).session(session);
        if (!selectedPackage || !selectedPackage.is_active) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Không tìm thấy gói hoặc gói không hoạt động.' });
        }


        console.log(`Mô phỏng thanh toán thành công cho gói ${selectedPackage.name} bởi người dùng ${userId}`);



        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + selectedPackage.duration_days);


        const newSubscription = new Subscription({
            user: userId,
            package: packageId,
            start_date: startDate,
            end_date: endDate,
            status: 'active'
        });

        await newSubscription.save({ session });



        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'Tạo đăng ký thành công!', subscription: newSubscription });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Lỗi tạo đăng ký:', error);
        res.status(500).json({ message: 'Lỗi tạo đăng ký', error: error.message });
    }
};


exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const activeSubscription = await Subscription.findOne({
            user: userId,
            status: 'active',
            end_date: { $gt: new Date() }
        }).populate('package');

        if (!activeSubscription) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký đang hoạt động.' });
        }

        res.status(200).json({ subscription: activeSubscription });

    } catch (error) {
        console.error('Lỗi lấy trạng thái đăng ký:', error);
        res.status(500).json({ message: 'Lỗi lấy trạng thái đăng ký', error: error.message });
    }
};


exports.getSubscriptionHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const subscriptions = await Subscription.find({ user: userId })
            .populate('package')
            .sort({ createdAt: -1 });

        res.status(200).json({ history: subscriptions });

    } catch (error) {
        console.error('Lỗi lấy lịch sử đăng ký:', error);
        res.status(500).json({ message: 'Lỗi lấy lịch sử đăng ký', error: error.message });
    }
};
