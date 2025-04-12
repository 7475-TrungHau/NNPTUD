const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    movie: {
        type: Schema.Types.ObjectId,
        ref: 'Movie',
        required: true,
        index: true
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    root: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true
    }
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
