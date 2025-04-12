const express = require('express');
const router = express.Router();

const UserController = require('../../controllers/api/UserController');
const auth = require('../../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {

        const uploadPath = path.join(__dirname, '../../public/avatars');

        fs.mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) {
                console.error("Failed to create avatar directory:", err);
                return cb(err);
            }
            cb(null, uploadPath);
        });
    },
    filename: function (req, file, cb) {

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + extension);
    }
});

const avatarFileFilter = (req, file, cb) => {

    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {

        req.fileValidationError = 'Chỉ cho phép tải lên file ảnh (JPG, JPEG, PNG, GIF)!';
        cb(null, false);
    }
};

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('avatar');
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(422).json({ message: 'File ảnh quá lớn (tối đa 5MB).' });
        }

        return res.status(422).json({ message: `Lỗi tải file: ${err.message}` });
    } else if (err) {
        console.error("Unknown upload error:", err);
        return res.status(500).json({ message: 'Lỗi không xác định khi tải file lên.' });
    }
    if (req.fileValidationError) {
        return res.status(422).json({ message: req.fileValidationError });
    }


    next();
};

router.get('/', auth, UserController.getUser);


router.get('/rating/:movieId', auth, UserController.getRatingByMovie);


router.get('/subscription', auth, UserController.getUserWithSubscription);


router.put(
    '/update',
    auth,
    (req, res, next) => {
        uploadAvatar(req, res, (err) => {

            handleUploadErrors(err, req, res, next);

        });
    },
    UserController.updateUser
);


module.exports = router;
