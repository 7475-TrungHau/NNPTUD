const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const packageSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: null
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration_days: {
        type: Number,
        required: true,
        min: 1
    },
    features: [{
        type: String,
        trim: true
    }],
    is_active: {
        type: Boolean,
        default: true
    },
    movies: [{ // Added movies field for many-to-many relationship
        type: Schema.Types.ObjectId,
        ref: 'Movie',
        default: []
    }]
}, {
    timestamps: true
});

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
