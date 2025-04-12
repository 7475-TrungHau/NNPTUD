const { Movie, Episode, Rating, Category, Package, History, User } = require('../../models');
const mongoose = require('mongoose');
const slugify = require('slugify');


const buildBaseQuery = () => {

    return Movie.find();
};


const index = async (req, res) => {
    try {
        let queryFilters = {};

        if (req.query.category) {
            const categorySlug = req.query.category;
            const category = await Category.findOne({ slug: categorySlug }).select('_id');
            if (category) {
                queryFilters.category = category._id;
            } else {

                return res.json({
                    data: [],
                    currentPage: 1,
                    totalPages: 0,
                    totalMovies: 0,
                    perPage: parseInt(req.query.per_page) || 15
                });
            }
        }


        if (req.query.genre) {
            const genreSlug = req.query.genre;

            queryFilters.genres = { $regex: new RegExp(genreSlug.replace(/-/g, '.*'), 'i') };
        }


        let query = Movie.find(queryFilters)
            .populate('category', 'name slug')
            .populate({
                path: 'packages',
                match: { is_active: true },
                select: 'name price'
            });


        const sortBy = req.query.sort_by || 'createdAt';
        const sortDir = (req.query.sort_dir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
        const allowedSorts = ['createdAt', 'view', 'name', 'rating', 'year'];

        if (allowedSorts.includes(sortBy)) {
            query = query.sort({ [sortBy]: sortDir });
        } else {
            query = query.sort({ createdAt: -1 });
        }

        let movies;
        let totalMovies = 0;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 15;
        const limit = parseInt(req.query.limit);


        if (!isNaN(limit) && limit > 0) {

            movies = await query.limit(limit).lean().exec();


            movies = await Promise.all(movies.map(async (movie) => {
                const episodeCount = await Episode.countDocuments({ movie: movie._id });
                const ratingCount = await Rating.countDocuments({ movie: movie._id });
                const packages = await Package.find({ _id: { $in: movie.packages || [] }, is_active: true }).select('_id name price').lean();
                movie.episodes_count = episodeCount;
                movie.ratings_count = ratingCount;
                movie.packages = packages;

                return movie;
            }));
            return res.json({ data: movies });

        } else {

            totalMovies = await Movie.countDocuments(queryFilters);

            movies = await query.skip((page - 1) * perPage).limit(perPage).lean().exec();


            movies = await Promise.all(movies.map(async (movie) => {
                const episodeCount = await Episode.countDocuments({ movie: movie._id });
                const ratingCount = await Rating.countDocuments({ movie: movie._id });
                const packages = await Package.find({ _id: { $in: movie.packages || [] }, is_active: true }).select('_id name price').lean();
                movie.episodes_count = episodeCount;
                movie.ratings_count = ratingCount;
                movie.packages = packages;
                return movie;
            }));

            return res.json({
                data: movies,
                currentPage: page,
                totalPages: Math.ceil(totalMovies / perPage),
                totalMovies: totalMovies,
                perPage: perPage
            });
        }

    } catch (err) {
        console.error('Lỗi lấy danh sách phim:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách phim.', error: err.message });
    }
};



const show = async (req, res) => {
    try {
        const { identifier } = req.params;
        let movie;


        const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
        const findCriteria = isObjectId ? { _id: identifier } : { slug: identifier };


        movie = await Movie.findOne(findCriteria)
            .populate('category', 'name slug')
            .populate({
                path: 'packages',
                match: { is_active: true },
                select: 'name price'
            })
            .lean()
            .exec();

        if (!movie) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phim.' });
        }


        await Movie.updateOne({ _id: movie._id }, { $inc: { view: 1 } });
        movie.view = (movie.view || 0) + 1;



        const episodeCount = await Episode.countDocuments({ movie: movie._id });
        const ratingCount = await Rating.countDocuments({ movie: movie._id });
        movie.episodes_count = episodeCount;
        movie.ratings_count = ratingCount;


        if (!movie.episodes) {
            movie.episodes = await Episode.find({ movie: movie._id })
                .sort({ episode_number: 1 })
                .lean()
                .exec();
        }


        res.json({ success: true, data: movie });

    } catch (err) {
        console.error(`Lỗi lấy phim ${req.params.identifier}:`, err);
        if (err.name === 'CastError' && !mongoose.Types.ObjectId.isValid(req.params.identifier)) {

            return res.status(404).json({ success: false, message: 'Không tìm thấy phim với slug hoặc ID này.' });
        }
        if (err.name === 'CastError') {

            return res.status(404).json({ success: false, message: 'Không tìm thấy phim với ID này.' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin phim: ' + err.message });
    }
};



const rateMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { rating } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ success: false, message: 'Movie ID không hợp lệ.' });
        }


        const ratingValue = Number(rating);
        if (isNaN(ratingValue) || ratingValue < 0.5 || ratingValue > 5) {

            return res.status(400).json({ success: false, message: 'Giá trị đánh giá không hợp lệ (phải từ 0.5 đến 5).' });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phim.' });
        }


        await Rating.findOneAndUpdate(
            { user: userId, movie: movieId },
            { rating_value: ratingValue },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );


        const avgRatingResult = await Rating.aggregate([
            { $match: { movie: mongoose.Types.ObjectId.createFromHexString(movieId) } },
            { $group: { _id: "$movie", averageRating: { $avg: "$rating_value" } } }
        ]);


        const newAverageRating = avgRatingResult.length > 0 ? avgRatingResult[0].averageRating : ratingValue;


        movie.rating = parseFloat(newAverageRating.toFixed(1));
        await movie.save();

        const totalRatings = await Rating.countDocuments({ movie: movieId });

        res.json({
            success: true,
            message: 'Cảm ơn bạn đã đánh giá phim!',
            rating: movie.rating,
            total_ratings: totalRatings
        });

    } catch (err) {
        console.error(`Lỗi đánh giá phim ${req.params.movieId}:`, err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đánh giá phim.', error: err.message });
    }
};


const setHistory = async (req, res) => {
    try {
        const { episodeId } = req.params;
        const { progress } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(episodeId)) {
            return res.status(400).json({ success: false, message: 'Episode ID không hợp lệ.' });
        }


        const progressValue = progress !== undefined ? Number(progress) : 0;
        if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
            return res.status(400).json({ success: false, message: 'Giá trị progress không hợp lệ (phải từ 0 đến 100).' });
        }


        const episode = await Episode.findById(episodeId);
        if (!episode) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tập phim.' });
        }


        await History.findOneAndUpdate(
            { user: userId, episode: episodeId },
            { progress: progressValue, last_watched_at: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, message: 'Đã cập nhật lịch sử xem.' });

    } catch (err) {
        console.error(`Lỗi cập nhật lịch sử xem cho tập ${req.params.episodeId}:`, err);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật lịch sử xem.', error: err.message });
    }
};


const getEpisodes = async (req, res) => {
    try {
        const { movieId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ success: false, message: 'Movie ID không hợp lệ.' });
        }


        const movieExists = await Movie.findById(movieId).select('_id');
        if (!movieExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phim.' });
        }


        const episodes = await Episode.find({ movie: movieId })
            .sort({ episode_number: 1 })
            .select('-video_url')
            .lean();

        res.json({ success: true, data: episodes });
    } catch (err) {
        console.error(`Lỗi lấy danh sách tập phim cho phim ${req.params.movieId}:`, err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách tập phim.', error: err.message });
    }
};


module.exports = {
    index,
    show,
    rateMovie,
    setHistory,
    getEpisodes,

};
