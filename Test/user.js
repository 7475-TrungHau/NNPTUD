const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/UserController');
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');

// All user management routes require authentication and admin role
router.use(auth); // Ensure user is logged in
router.use(authorize('admin')); // Ensure user is an admin

// GET /api/admin/users - Get all users (with pagination and search)
router.get('/', userController.getAllUsers);

// GET /api/admin/users/:id - Get a specific user by ID
router.get('/:id', userController.getUserById);

// PUT /api/admin/users/:id - Update user details (e.g., role)
router.put('/:id', userController.updateUser);

// DELETE /api/admin/users/:id - Delete a user
router.delete('/:id', userController.deleteUser);

module.exports = router;
