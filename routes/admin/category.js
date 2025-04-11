const express = require('express');
const router = express.Router();
const CategoryController = require('../../controllers/admin/CategoryController');
const { body } = require('express-validator');
const authorize = require('../../middlewares/authorize');

router.get('/', authorize('admin'), CategoryController.index);
router.get('/create', authorize('admin'), CategoryController.create);
router.post(
    '/',
    authorize('admin'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('slug').notEmpty().withMessage('Slug is required')
    ],
    CategoryController.store
);
router.get('/:id/edit', authorize('admin'), CategoryController.edit);
router.put(
    '/:id',
    authorize('admin'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('slug').notEmpty().withMessage('Slug is required')
    ],
    CategoryController.update
);
router.delete('/:id', authorize('admin'), CategoryController.destroy);

module.exports = router;
