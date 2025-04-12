const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const movieSchema = new Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    origin_name: {
        type: String,
        required: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    genres: [{
        type: String,
        required: true,
        trim: true,
    }],
    country: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    view: {
        type: Number,
        default: 0,
    },
    actor: [{
        type: String,
        trim: true,
    }],
    director: [{
        type: String,
        trim: true,
    }],
    year: {
        type: Number,
        required: true,
    },
    poster_url: {
        type: String,
        default: null,
    },
    type: {
        type: String,
        enum: ['movie', 'series'],
        default: 'movie',
    },
    thumbnail_url: {
        type: String,
        default: null,
    },
    trailer_url: {
        type: String,
        default: null,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    packages: [{
        type: Schema.Types.ObjectId,
        ref: 'Package',
        default: [],
    }]
}, {
    timestamps: true,
});

movieSchema.index({
    name: 'text',
    origin_name: 'text',
    description: 'text',
    genres: 'text',
    actor: 'text',
    director: 'text',
    country: 'text',
}, {
    weights: {
        name: 10,
        origin_name: 8,
        description: 4,
        genres: 6,
        actor: 3,
        director: 3,
        country: 5,
    },
    name: 'MovieSearchIndex',
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
