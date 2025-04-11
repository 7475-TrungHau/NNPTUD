const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    package: {
        type: Schema.Types.ObjectId,
        ref: 'Package',
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'canceled'],
        default: 'active',
        index: true
    }
}, {
    timestamps: true
});

subscriptionSchema.index({ user: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;