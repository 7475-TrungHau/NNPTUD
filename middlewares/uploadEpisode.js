const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pipeline } = require('stream/promises');

// Ensure directories exist
const thumbnailDir = path.join(__dirname, '../public/thumbnails/episodes');
const videoDir = path.join(__dirname, '../public/videos'); // Assuming videos are stored here

if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

// Configure storage for thumbnails
const thumbnailStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, thumbnailDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure storage for videos
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, videoDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Use original filename for videos if preferred, or generate unique names
        // cb(null, file.originalname); // Example: using original name
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Example: unique name
    }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file hình ảnh!'), false);
    }
};

// File filter for videos
const videoFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file video!'), false);
    }
};

// Create multer instance to handle both fields
const uploadEpisodeFiles = multer({
    storage: multer.diskStorage({ // Use separate storage logic within fields if needed, or a common one
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
        fileSize: 5 * 1024 * 1024 * 1024, // Max size for any file (adjust video limit here)
        files: 2 // Allow max 2 files (one thumbnail, one video)
    }
}).fields([
    { name: 'thumbnailFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 }
]);

// Middleware function to use in routes
const handleUploads = (req, res, next) => {
    uploadEpisodeFiles(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ success: false, message: `Lỗi Multer: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ success: false, message: `Lỗi tải file: ${err.message}` });
        }
        // Everything went fine.
        next();
    });
};

module.exports = handleUploads;
