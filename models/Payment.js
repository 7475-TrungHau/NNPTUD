const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    subscription: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        default: null,
        index: true
    },
    package: {
        type: Schema.Types.ObjectId,
        ref: 'Package',
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'VND'
    },
    payment_method: {
        type: String,
        required: true
    },
    transaction_id: {
        type: String,
        index: true,
        unique: true,
        sparse: true
    },
    payment_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'pending', 'failed', 'refunded'],
        default: 'pending',
        required: true,
        index: true
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
