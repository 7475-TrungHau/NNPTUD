const mongoose = require('mongoose');
const { User, Subscription, Rating } = require('../../models');
const fs = require('fs');
const path = require('path');


const getFullAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;


    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }


    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const relativePath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;


    const fullPath = path.join(__dirname, '../../public', relativePath);
    if (fs.existsSync(fullPath)) {
        return `${baseUrl.replace(/\/$/, '')}${relativePath}`;
    }

    return null;
};


exports.getUser = async (req, res) => {
    try {

        const userId = req.user.id;


        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }


        const activeSubscriptions = await Subscription.find({
            user: userId,
            end_date: { $gte: new Date() },
            status: 'active'
        }).populate('package', 'name price _id');


        const packages = activeSubscriptions.map(subscription => {
            if (subscription.package) {
                const packageData = subscription.package.toObject();
                packageData.end_date = subscription.end_date;
                return packageData;
            }
            return null;
        }).filter(pkg => pkg !== null);


        user.packages = packages;


        if (user.avatar) {
            user.avatar = getFullAvatarUrl(user.avatar);
        }

        return res.status(200).json({
            user: user,
            message: 'Lấy thông tin người dùng thành công'
        });
    } catch (error) {
        console.error('Lỗi trong getUser:', error);
        return res.status(500).json({
            error: 'Có lỗi xảy ra: ' + error.message
        });
    }
};


exports.getRatingByMovie = async (req, res) => {
    try {
        const userId = req.user.id;
        const { movieId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ message: 'Movie ID không hợp lệ' });
        }


        const rating = await Rating.findOne({
            user: userId,
            movie: movieId
        });

        if (!rating) {
            return res.status(404).json({ message: 'Không tìm thấy đánh giá cho phim này' });
        }

        return res.status(200).json({
            rating: rating.rating_value,
            message: 'Lấy thông tin đánh giá thành công'
        });
    } catch (error) {
        console.error('Lỗi trong getRatingByMovie:', error);
        return res.status(500).json({
            error: 'Có lỗi xảy ra: ' + error.message
        });
    }
};


exports.getUserWithSubscription = async (req, res) => {
    try {
        const userId = req.user.id;


        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }


        const subscription = await Subscription.findOne({
            user: userId,
            end_date: { $gte: new Date() },
            status: 'active'
        }).populate('package', 'name price _id').sort({ end_date: -1 });

        if (!subscription) {
            return res.status(404).json({ message: 'Không tìm thấy gói cước cho người dùng này' });
        }


        if (user.avatar) {
            user.avatar = getFullAvatarUrl(user.avatar);
        }

        return res.status(200).json({
            user: user,
            subscription: subscription,
            message: 'Lấy thông tin người dùng và gói cước thành công'
        });
    } catch (error) {
        console.error('Lỗi trong getUserWithSubscription:', error);
        return res.status(500).json({
            error: 'Có lỗi xảy ra: ' + error.message
        });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.id;


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }


        const { username, full_name } = req.body;
        const updateData = {};


        if (username !== undefined) {
            if (!username || typeof username !== 'string' || username.length > 255) {
                return res.status(422).json({
                    message: 'Tên đăng nhập không hợp lệ (phải là chuỗi, tối đa 255 ký tự, không rỗng)'
                });
            }


            if (username !== user.username) {
                const existingUser = await User.findOne({
                    username: username,
                    _id: { $ne: userId }
                });

                if (existingUser) {
                    return res.status(422).json({ message: 'Tên đăng nhập đã tồn tại' });
                }

                updateData.username = username;
            }
        }


        if (full_name !== undefined) {
            if (!full_name || typeof full_name !== 'string' || full_name.length > 255) {
                return res.status(422).json({
                    message: 'Tên đầy đủ không hợp lệ (phải là chuỗi, tối đa 255 ký tự, không rỗng)'
                });
            }

            if (full_name !== user.full_name) {
                updateData.full_name = full_name;
            }
        }


        if (req.file) {
            const folder = 'avatars';
            const folderPath = path.join(__dirname, '../../public', folder);


            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }


            const fileName = `${Date.now()}_${req.file.originalname}`;
            const newAvatarPath = `/${folder}/${fileName}`;


            if (user.avatar && !user.avatar.startsWith('http')) {
                const oldAvatarPath = path.join(__dirname, '../../public', user.avatar);
                if (fs.existsSync(oldAvatarPath) && user.avatar.includes('/')) {
                    fs.unlinkSync(oldAvatarPath);
                }
            }


            const newPath = path.join(folderPath, fileName);
            fs.renameSync(req.file.path, newPath);

            updateData.avatar = newAvatarPath;
        }


        if (Object.keys(updateData).length > 0) {
            await User.updateOne({ _id: userId }, { $set: updateData });
        }


        const updatedUser = await User.findById(userId).select('-password');


        if (updatedUser.avatar) {
            updatedUser.avatar = getFullAvatarUrl(updatedUser.avatar);
        }

        return res.status(200).json({
            message: 'Cập nhật thông tin thành công!',
            user: updatedUser
        });
    } catch (error) {
        console.error('Lỗi trong updateUser:', error);
        return res.status(500).json({
            message: 'Cập nhật thất bại: ' + error.message
        });
    }
};
