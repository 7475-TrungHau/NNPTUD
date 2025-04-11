const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const passwordResetTokenSchema = new Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 3600
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});




const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

module.exports = PasswordResetToken;
