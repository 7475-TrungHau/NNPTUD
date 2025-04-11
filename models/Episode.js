const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2'); // Import the plugin

const episodeSchema = new Schema({
    movie: {
        type: Schema.Types.ObjectId,
        ref: 'Movie',
        required: true,
        index: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: true,
        trim: true,
    },
    release_date: {
        type: Date,
        default: null,
    },
    episode_number: {
        type: Number,
        required: true,
        min: 1,
    },
    thumbnail_url: {
        type: String,
        default: null,
    },
    video_url: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
});

episodeSchema.index({ movie: 1, episode_number: 1 }, { unique: true });

episodeSchema.plugin(mongoosePaginate); // Apply the plugin to the schema

const Episode = mongoose.model('Episode', episodeSchema);

module.exports = Episode;
