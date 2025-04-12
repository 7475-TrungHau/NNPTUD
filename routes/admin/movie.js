const express = require('express');
const router = express.Router();
const MovieController = require('../../controllers/admin/MovieController');
const { body } = require('express-validator');
const multer = require('multer');
const authorize = require('../../middlewares/authorize');


const upload = multer({
    dest: 'public/uploads/temp/',
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép file hình ảnh!'), false);
        }
    }
});



router.get('/', authorize('admin'), MovieController.index);
router.get('/create', authorize('admin'), MovieController.create);
router.get('/:id', authorize('admin'), MovieController.getMovieById);

router.post(
    '/',
    authorize('admin'),
    upload.fields([
        { name: 'poster', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
        { name: 'trailer', maxCount: 1 }
    ]),
    [
        body('slug').trim().notEmpty().withMessage('Slug là bắt buộc'),
        body('name').trim().notEmpty().withMessage('Tên là bắt buộc'),
        body('type')
            .trim()
            .isIn(['movie', 'series'])
            .withMessage('Loại phải là "movie" hoặc "series"'),
        body('category')
            .trim()
            .isMongoId()
            .withMessage('Danh mục phải là ID MongoDB hợp lệ')
    ],
    (req, res, next) => MovieController.store(req, res, next)
);
router.get('/:id/edit', authorize('admin'), MovieController.edit);
router.put(
    '/:id',
    authorize('admin'),
    upload.fields([
        { name: 'poster', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
        { name: 'trailer', maxCount: 1 }
    ]),
    [
        body('slug').notEmpty().withMessage('Slug là bắt buộc'),
        body('name').notEmpty().withMessage('Tên là bắt buộc'),
        body('type').isIn(['movie', 'series']).withMessage('Loại không hợp lệ'),
        body('category').isMongoId().withMessage('Danh mục không hợp lệ')
    ],
    (req, res, next) => MovieController.update(req, res, next)
);
router.delete('/:id', authorize('admin'), (req, res, next) => MovieController.destroy(req, res, next));

module.exports = router;
