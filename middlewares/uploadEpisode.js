const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pipeline } = require('stream/promises');


const thumbnailDir = path.join(__dirname, '../public/thumbnails/episodes');
const videoDir = path.join(__dirname, '../public/videos');

if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}


const thumbnailStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, thumbnailDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});


const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, videoDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});


const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file hình ảnh!'), false);
    }
};


const videoFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file video!'), false);
    }
};


const uploadEpisodeFiles = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === 'thumbnailFile') {
                cb(null, thumbnailDir);
            } else if (file.fieldname === 'videoFile') {
                cb(null, videoDir);
            } else {
                cb(new Error('Trường file không hợp lệ'), false);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'thumbnailFile') {
            imageFileFilter(req, file, cb);
        } else if (file.fieldname === 'videoFile') {
            videoFileFilter(req, file, cb);
        } else {
            cb(new Error('Trường file không hợp lệ'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024,
        files: 2
    }
}).fields([
    { name: 'thumbnailFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 }
]);


const handleUploads = (req, res, next) => {
    uploadEpisodeFiles(req, res, (err) => {
        if (err instanceof multer.MulterError) {

            return res.status(400).json({ success: false, message: `Lỗi Multer: ${err.message}` });
        } else if (err) {

            return res.status(400).json({ success: false, message: `Lỗi tải file: ${err.message}` });
        }

        next();
    });
};

module.exports = handleUploads;
