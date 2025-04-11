const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    episode: {
        type: Schema.Types.ObjectId,
        ref: 'Episode',
        required: true
    },
    progress: {
        type: Number,
        required: true,
        default: 0
    },
    last_watched_at: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: false
});

// Khóa chính kết hợp logic
historySchema.index({ user: 1, episode: 1 }, { unique: true });
// Index để lấy lịch sử xem gần nhất
historySchema.index({ user: 1, last_watched_at: -1 });


const History = mongoose.model('History', historySchema);

module.exports = History;