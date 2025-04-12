const express = require('express');
const router = express.Router();
const subscriptionController = require('../../controllers/user/SubscriptionController');
const auth = require('../../middlewares/auth');


router.post('/', auth, subscriptionController.createSubscription);


router.get('/status', auth, subscriptionController.getSubscriptionStatus);

router.get('/history', auth, subscriptionController.getSubscriptionHistory);


module.exports = router;
