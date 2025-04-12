const Movie = require('../../models/Movie');
const Category = require('../../models/Category');
const Episode = require('../../models/Episode');
const fs = require('fs');
const path = require('path');

class MovieController {
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            let query = Movie.find().populate('category');

            if (req.query.search) {
                query = query.find(
                    { $text: { $search: req.query.search } },
                    { score: { $meta: "textScore" } }
                ).sort({ score: { $meta: "textScore" } });
            }

            const sortBy = req.query.sort_by || 'createdAt';
            const sortDirection = req.query.sort_direction === 'asc' ? 1 : -1;

            if (!req.query.search) {
                const sortOptions = {};
                sortOptions[sortBy] = sortDirection;
                query = query.sort(sortOptions);
            }

            const movies = await query.skip(skip).limit(limit);

            const totalMovies = await Movie.countDocuments(query.getQuery());
            const totalPages = Math.ceil(totalMovies / limit);

            const moviesWithEpisodeCounts = await Promise.all(
                movies.map(async (movie) => {
                    const episodeCount = await Episode.countDocuments({ movie: movie._id });
                    const movieObj = movie.toObject();
                    movieObj.episode_count = episodeCount;
                    return movieObj;
                })
            );

            return res.json({
                movies: moviesWithEpisodeCounts,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalMovies,
                    limit
                }
            });
        } catch (error) {
            console.error('Lỗi lấy danh sách phim:', error);
            return res.status(500).json({
                message: 'Lỗi tải danh sách phim',
                error: error.message
            });
        }

    }

    async getMovieById(req, res) {
        try {
            const movie = await Movie.findById(req.params.id).populate('category');
            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy phim'
                });
            }
            const episodeCount = await Episode.countDocuments({ movie: movie._id });
            const movieObj = movie.toObject();
            movieObj.episode_count = episodeCount;
            return res.json({
                success: true,
                movie: movieObj
            });
        } catch (error) {
            console.error('Lỗi lấy phim theo ID:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi tải phim: ' + error.message,
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const categories = await Category.find();
            return res.json({ categories });
        } catch (error) {
            console.error('Lỗi form tạo phim:', error);
            return res.status(500).json({
                message: 'Lỗi tải form tạo phim',
                error: error.message
            });
        }
    }

    async handleFileUpload(req, fieldName, folder, existingUrl = null) {
        try {
            const publicBasePath = path.join(__dirname, '../../public');
            const targetFolder = path.join(publicBasePath, folder);


            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }


            if (req.files && req.files[fieldName] && req.files[fieldName][0]) {

                if (existingUrl && !existingUrl.startsWith('http')) {
                    const oldFilePath = path.join(publicBasePath, existingUrl);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }

                const file = req.files[fieldName][0];
                const fileName = `${Date.now()}_${file.originalname}`;
                const filePath = path.join(targetFolder, fileName);


                fs.renameSync(file.path, filePath);
                return `/${folder}/${fileName}`;

            } else if (req.body[`${fieldName}_url`] && req.body[`${fieldName}_url`] !== existingUrl) {

                if (existingUrl && !existingUrl.startsWith('http')) {
                    const oldFilePath = path.join(publicBasePath, existingUrl);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }
                return req.body[`${fieldName}_url`];
            }


            return existingUrl;
        } catch (error) {
            console.error(`Lỗi xử lý tải lên file cho ${fieldName}:`, error);
            throw error;
        }
    }

    async store(req, res) {
        try {
            if (!req.body.name || !req.body.slug || !req.body.type || !req.body.category) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu các trường bắt buộc'
                });
            }

            const existingMovie = await Movie.findOne({ slug: req.body.slug });
            if (existingMovie) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug phải là duy nhất'
                });
            }

            const posterUrl = await this.handleFileUpload(req, 'poster', 'posters');
            const trailerUrl = await this.handleFileUpload(req, 'trailer', 'trailers');
            const thumbnailUrl = await this.handleFileUpload(req, 'thumbnail', 'thumbnails');

            const movie = await Movie.create({
                ...req.body,
                origin_name: req.body.origin_name || req.body.name,
                description: req.body.description || '',
                actor: req.body.actor?.split(',').map(a => a.trim()) || [],
                director: req.body.director?.split(',').map(d => d.trim()) || [],
                year: req.body.year ? parseInt(req.body.year) : new Date().getFullYear(),
                genres: req.body.genres?.split(',').map(g => g.trim()) || [],
                country: req.body.country || 'Không xác định',
                poster_url: posterUrl,
                thumbnail_url: thumbnailUrl,
                trailer_url: trailerUrl,
            });

            return res.status(201).json({
                success: true,
                message: 'Tạo phim thành công',
                data: movie
            });

        } catch (error) {
            console.error('Lỗi tạo phim:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server nội bộ: ' + error.message,
                error: error.message
            });
        }
    }

    async edit(req, res) {
        try {
            const movie = await Movie.findById(req.params.id);
            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy phim',
                    error: 'Phim không tồn tại với ID đã cho'
                })
            }

            const categories = await Category.find();
            return res.json({ movie, categories });
        } catch (error) {
            console.error('Lỗi form chỉnh sửa phim:', error);
            return res.status(500).json({
                message: 'Lỗi tải form chỉnh sửa',
                error: { status: 500, stack: error.stack }
            });
        }
    }

    async update(req, res) {
        try {
            const movie = await Movie.findById(req.params.id);
            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy phim'
                });
            }

            if (!req.body.name || !req.body.slug || !req.body.type || !req.body.category) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu các trường bắt buộc'
                });
            }


            if (req.body.slug !== movie.slug) {
                const existingMovie = await Movie.findOne({
                    slug: req.body.slug,
                    _id: { $ne: req.params.id }
                });

                if (existingMovie) {
                    return res.status(400).json({
                        success: false,
                        message: 'Slug phải là duy nhất'
                    });
                }
            }


            const posterUrl = await this.handleFileUpload(req, 'poster', 'posters', movie.poster_url);
            const trailerUrl = await this.handleFileUpload(req, 'trailer', 'trailers', movie.trailer_url);
            const thumbnailUrl = await this.handleFileUpload(req, 'thumbnail', 'thumbnails', movie.thumbnail_url);


            movie.slug = req.body.slug;
            movie.name = req.body.name;
            movie.origin_name = req.body.origin_name || req.body.name;
            movie.description = req.body.description || '';
            movie.actor = req.body.actor?.split(',').map(a => a.trim()) || [];
            movie.director = req.body.director?.split(',').map(d => d.trim()) || [];
            movie.year = req.body.year ? parseInt(req.body.year) : movie.year;
            movie.type = req.body.type;
            movie.genres = req.body.genres?.split(',').map(g => g.trim()) || [];
            movie.country = req.body.country || movie.country;
            movie.category = req.body.category;
            movie.poster_url = posterUrl;
            movie.thumbnail_url = thumbnailUrl;
            movie.trailer_url = trailerUrl;

            await movie.save();

            return res.json({
                success: true,
                message: 'Cập nhật phim thành công',
                data: movie
            });
        } catch (error) {
            console.error('Lỗi cập nhật phim:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi cập nhật phim: ' + error.message,
                error: error.message
            });
        }
    }

    async destroy(req, res) {
        try {
            const movie = await Movie.findById(req.params.id);
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy phim' });
            }

            if (movie.poster_url && fs.existsSync(path.join(__dirname, '../../public', movie.poster_url))) {
                fs.unlinkSync(path.join(__dirname, '../../public', movie.poster_url));
            }

            if (movie.thumbnail_url && fs.existsSync(path.join(__dirname, '../../public', movie.thumbnail_url))) {
                fs.unlinkSync(path.join(__dirname, '../../public', movie.thumbnail_url));
            }

            await Episode.deleteMany({ movie: movie._id });

            await movie.deleteOne();

            return res.status(201).json({
                success: true,
                message: 'Xóa phim thành công'
            });
        } catch (error) {
            console.error('Lỗi xóa phim:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi xóa phim: ' + error.message
            });
        }
    }
}

module.exports = new MovieController();
