const express = require('express');
const router = express.Router();
const subscriptionController = require('../../controllers/user/SubscriptionController');
const auth = require('../../middlewares/auth'); // Middleware to ensure user is logged in

// Route to create a new subscription (will require payment logic later)
// POST /api/user/subscriptions
router.post('/', auth, subscriptionController.createSubscription);

// Route to get the current user's active subscription status
// GET /api/user/subscriptions/status
router.get('/status', auth, subscriptionController.getSubscriptionStatus);

// Route to get the current user's subscription history
// GET /api/user/subscriptions/history
router.get('/history', auth, subscriptionController.getSubscriptionHistory);

// Add other routes like cancel subscription later

module.exports = router;
