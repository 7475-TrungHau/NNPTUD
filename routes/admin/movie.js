const express = require('express');
const router = express.Router();
const MovieController = require('../../controllers/admin/MovieController');
const { body } = require('express-validator');
const multer = require('multer');
const authorize = require('../../middlewares/authorize');

// Configure multer for file uploads
const upload = multer({
    dest: 'public/uploads/temp/', // Add destination for temporary files
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});


// CRUD Routes
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
        body('slug').trim().notEmpty().withMessage('Slug is required'),
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('type')
            .trim()
            .isIn(['movie', 'series'])
            .withMessage('Type must be either "movie" or "series"'),
        body('category')
            .trim()
            .isMongoId()
            .withMessage('Category must be a valid MongoDB ID')
    ],
    (req, res, next) => MovieController.store(req, res, next) // Pass next
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
        body('slug').notEmpty().withMessage('Slug is required'),
        body('name').notEmpty().withMessage('Name is required'),
        body('type').isIn(['movie', 'series']).withMessage('Invalid type'),
        body('category').isMongoId().withMessage('Invalid category')
    ],
    (req, res, next) => MovieController.update(req, res, next) // Wrap in arrow function and pass next
);
router.delete('/:id', authorize('admin'), (req, res, next) => MovieController.destroy(req, res, next)); // Wrap in arrow function and pass next

module.exports = router;
