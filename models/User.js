const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email_verified_at: {
        type: Date,
        default: null,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'editor'],
        default: 'user',
    },
    full_name: {
        type: String,
        required: false,
        trim: true,
    },
    avatar: {
        type: String,
        default: null,
    },
    favorites: [{
        type: Schema.Types.ObjectId,
        ref: 'Movie',
    }]
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;