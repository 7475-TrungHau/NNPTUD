const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/UserController');
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');

// const { body } = require('express-validator');
router.use(auth);
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);


router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);


router.delete('/:id', userController.deleteUser);

module.exports = router;
