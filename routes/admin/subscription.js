const express = require('express');
const router = express.Router();
const SubscriptionController = require('../../controllers/admin/SubscriptionController');
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');


router.use(auth);
router.use(authorize('admin'));


router.get('/', SubscriptionController.index);
// router.get('/create', SubscriptionController.create);

router.post('/', SubscriptionController.store);
router.get('/:id', SubscriptionController.show);
router.put('/:id', SubscriptionController.update);

router.delete('/:id', SubscriptionController.destroy);

module.exports = router;
