const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/api/PaymentController');
const auth = require('../../middlewares/auth');


router.get('/packages', PaymentController.getPackages);

router.get('/create_vnpay_url/:package_id', auth, PaymentController.createVnpayPayment);

// GET /api/payment/vnpay_return - Handle VNPay return callback (Public, handled by VNPay redirect)
router.get('/vnpay_return', PaymentController.vnpayReturn);

// GET /api/payment/details/:paymentId - Get details of a specific payment (Authenticated)
router.get('/details/:paymentId', auth, PaymentController.getPaymentDetails);


// --- Optional: IPN Route (Instant Payment Notification) ---
// VNPay might also send an IPN request to confirm the transaction status independently.
// It's good practice to implement this for robustness, though the return URL handles the primary flow.
// router.get('/vnpay_ipn', PaymentController.vnpayIpn); // You would need to implement vnpayIpn in the controller

module.exports = router;
