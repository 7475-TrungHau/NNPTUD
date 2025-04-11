const { Episode, Movie } = require('../../models');
const { default: slugify } = require('slugify');

// Helper function to generate unique slug
const generateUniqueSlug = async (title, movieId, episodeNumber) => {
    let baseSlug = slugify(`${title}-${episodeNumber}`, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    // Check if slug already exists for any episode
    while (await Episode.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    return slug;
};


// GET /admin/episodes - Lấy danh sách tất cả tập phim (có thể phân trang)
const getAllEpisodes = async (req, res) => {
    try {
        const { page = 1, limit = 10, movieId, search } = req.query;
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { createdAt: -1 }, // Sắp xếp theo ngày tạo mới nhất
            populate: { path: 'movie', select: 'name slug' } // Lấy thông tin phim liên quan
        };

        let query = {};
        if (movieId) {
            query.movie = movieId;
        }
        if (search) {
            // Tìm kiếm theo tiêu đề hoặc slug tập phim
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }


        const episodes = await Episode.paginate(query, options); // Sử dụng mongoose-paginate-v2 nếu có

        // Nếu không dùng paginate, bạn có thể làm thủ công:
        // const episodes = await Episode.find(query)
        //     .populate('movie', 'name slug')
        //     .sort({ createdAt: -1 })
        //     .skip((options.page - 1) * options.limit)
        //     .limit(options.limit);
        // const totalEpisodes = await Episode.countDocuments(query);
        // const totalPages = Math.ceil(totalEpisodes / options.limit);

        res.json({
            success: true,
            data: episodes.docs, // episodes nếu không dùng paginate
            pagination: { // Bỏ qua nếu không dùng paginate
                totalDocs: episodes.totalDocs,
                limit: episodes.limit,
                totalPages: episodes.totalPages,
                page: episodes.page,
                pagingCounter: episodes.pagingCounter,
                hasPrevPage: episodes.hasPrevPage,
                hasNextPage: episodes.hasNextPage,
                prevPage: episodes.prevPage,
                nextPage: episodes.nextPage
            }
            // pagination: { // Nếu làm thủ công
            //     currentPage: options.page,
            //     totalPages: totalPages,
            //     totalItems: totalEpisodes
            // }
        });
    } catch (err) {
        console.error('Get all episodes error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// GET /admin/episodes/:id - Lấy thông tin chi tiết một tập phim
const getEpisodeById = async (req, res) => {
    try {
        const episode = await Episode.findById(req.params.id).populate('movie', 'name slug');
        if (!episode) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tập phim' });
        }
        res.json({ success: true, data: episode });
    } catch (err) {
        console.error('Get episode by id error:', err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'ID tập phim không hợp lệ' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

const fs = require('fs'); // Required for file system operations like deleting old files
const path = require('path'); // Required for path manipulation

// POST /admin/episodes - Tạo tập phim mới
const createEpisode = async (req, res) => {
    try {
        // Destructure body and files
        const { movie, title, description, release_date, episode_number, video_url, thumbnail_url } = req.body;
        const thumbnailFile = req.files?.thumbnailFile?.[0];
        const videoFile = req.files?.videoFile?.[0];

        // Validate input - Need either a video file or video_url
        if (!movie || !title || !episode_number || (!videoFile && !video_url)) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (movie, title, episode_number, và videoFile hoặc video_url)' });
        }

        // Determine thumbnail and video paths/URLs
        let finalThumbnailUrl = thumbnail_url; // Use URL from body by default
        if (thumbnailFile) {
            // Construct URL from uploaded file path (adjust base path as needed)
            finalThumbnailUrl = `/thumbnails/episodes/${thumbnailFile.filename}`;
        }

        let finalVideoUrl = video_url; // Use URL from body by default
        if (videoFile) {
            // Construct URL from uploaded file path
            finalVideoUrl = `/videos/${videoFile.filename}`;
        }

        // Kiểm tra movie có tồn tại không
        const movieExists = await Movie.findById(movie);
        if (!movieExists) {
            return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
        }

        // Kiểm tra episode_number đã tồn tại cho phim này chưa
        const existingEpisode = await Episode.findOne({ movie: movie, episode_number: episode_number });
        if (existingEpisode) {
            return res.status(400).json({ success: false, message: `Tập ${episode_number} đã tồn tại cho phim này` });
        }

        // Tạo slug duy nhất
        const slug = await generateUniqueSlug(title, movie, episode_number);

        const newEpisode = new Episode({
            movie,
            title,
            slug,
            description,
            release_date,
            episode_number,
            video_url: finalVideoUrl, // Use determined video URL
            thumbnail_url: finalThumbnailUrl // Use determined thumbnail URL
        });

        await newEpisode.save();
        res.status(201).json({ success: true, message: 'Tạo tập phim thành công', data: newEpisode });
    } catch (err) {
        console.error('Create episode error:', err);
        if (err.code === 11000) { // Lỗi duplicate key (có thể do slug hoặc index unique khác)
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp dữ liệu (slug hoặc số tập)' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// Helper function to delete file safely
const deleteFile = (filePath) => {
    // Construct full path relative to project root (adjust if needed)
    const fullPath = path.join(__dirname, '..', 'public', filePath);
    if (filePath && fs.existsSync(fullPath)) {
        try {
            fs.unlinkSync(fullPath);
            console.log(`Deleted old file: ${fullPath}`);
        } catch (err) {
            console.error(`Error deleting file ${fullPath}:`, err);
        }
    }
};


// PUT /admin/episodes/:id - Cập nhật thông tin tập phim
const updateEpisode = async (req, res) => {
    try {
        const { id } = req.params;
        const { movie, title, description, release_date, episode_number, video_url, thumbnail_url } = req.body;
        const thumbnailFile = req.files?.thumbnailFile?.[0];
        const videoFile = req.files?.videoFile?.[0];

        // Find the existing episode
        const episodeToUpdate = await Episode.findById(id);
        if (!episodeToUpdate) {
            // If files were uploaded but episode not found, delete them
            if (thumbnailFile) deleteFile(`/thumbnails/episodes/${thumbnailFile.filename}`);
            if (videoFile) deleteFile(`/videos/${videoFile.filename}`);
            return res.status(404).json({ success: false, message: 'Không tìm thấy tập phim' });
        }

        // Store old paths for potential deletion
        const oldThumbnailPath = episodeToUpdate.thumbnail_url?.startsWith('/') ? episodeToUpdate.thumbnail_url : null;
        const oldVideoPath = episodeToUpdate.video_url?.startsWith('/') ? episodeToUpdate.video_url : null;


        // Validate input - Need at least one field or file to update
        if (!movie && !title && !description && !release_date && !episode_number && !video_url && !thumbnail_url && !thumbnailFile && !videoFile) {
            return res.status(400).json({ success: false, message: 'Không có thông tin nào được cung cấp để cập nhật' });
        }


        // --- Update Logic ---

        // Update movie if provided and different
        if (movie && movie.toString() !== episodeToUpdate.movie.toString()) {
            const movieExists = await Movie.findById(movie);
            if (!movieExists) {
                return res.status(404).json({ success: false, message: 'Phim mới không tồn tại' });
            }
            episodeToUpdate.movie = movie;
        }

        // Kiểm tra nếu episode_number thay đổi, nó có bị trùng với tập khác của cùng phim không
        if (episode_number && episode_number !== episodeToUpdate.episode_number) {
            const targetMovieId = movie || episodeToUpdate.movie; // Lấy movie id mới hoặc cũ
            const existingEpisode = await Episode.findOne({
                movie: targetMovieId,
                episode_number: episode_number,
                _id: { $ne: id } // Loại trừ chính tập đang cập nhật
            });
            if (existingEpisode) {
                return res.status(400).json({ success: false, message: `Tập ${episode_number} đã tồn tại cho phim này` });
            }
            episodeToUpdate.episode_number = episode_number;
        }

        // Update other fields from body
        if (title) episodeToUpdate.title = title;
        if (description) episodeToUpdate.description = description;
        if (release_date) episodeToUpdate.release_date = release_date;

        // Update thumbnail: Use new file > new URL > keep old
        if (thumbnailFile) {
            episodeToUpdate.thumbnail_url = `/thumbnails/episodes/${thumbnailFile.filename}`;
            if (oldThumbnailPath) deleteFile(oldThumbnailPath); // Delete old file if new one uploaded
        } else if (thumbnail_url !== undefined) { // Check if thumbnail_url was explicitly provided in body
            episodeToUpdate.thumbnail_url = thumbnail_url; // Allow setting URL (or null/empty)
            if (oldThumbnailPath && thumbnail_url !== oldThumbnailPath) deleteFile(oldThumbnailPath); // Delete old file if URL changed
        }

        // Update video: Use new file > new URL > keep old
        if (videoFile) {
            episodeToUpdate.video_url = `/videos/${videoFile.filename}`;
            if (!episodeToUpdate.video_url) { // Ensure video_url is not null before proceeding
                return res.status(400).json({ success: false, message: 'Video URL is required.' });
            }
            if (oldVideoPath) deleteFile(oldVideoPath); // Delete old file if new one uploaded
        } else if (video_url !== undefined) {
            episodeToUpdate.video_url = video_url;
            if (!episodeToUpdate.video_url) { // Ensure video_url is not null before proceeding
                return res.status(400).json({ success: false, message: 'Video URL is required.' });
            }
            if (oldVideoPath && video_url !== oldVideoPath) deleteFile(oldVideoPath);
        }

        // Ensure video_url is present after potential updates
        if (!episodeToUpdate.video_url) {
            // If files were uploaded, clean them up before erroring
            if (thumbnailFile) deleteFile(`/thumbnails/episodes/${thumbnailFile.filename}`);
            if (videoFile) deleteFile(`/videos/${videoFile.filename}`);
            return res.status(400).json({ success: false, message: 'Video URL không được để trống sau khi cập nhật.' });
        }


        // Regenerate slug if title or episode number changed
        let slugChanged = false;
        if (title && title !== episodeToUpdate.title) slugChanged = true;
        if (episode_number && episode_number !== episodeToUpdate.episode_number) slugChanged = true;

        if (slugChanged) {
            const newSlugBaseTitle = title || episodeToUpdate.title;
            const newSlugEpisodeNumber = episode_number || episodeToUpdate.episode_number;
            episodeToUpdate.slug = await generateUniqueSlug(newSlugBaseTitle, episodeToUpdate.movie, newSlugEpisodeNumber);
        }


        const updatedEpisode = await episodeToUpdate.save();
        res.json({ success: true, message: 'Cập nhật tập phim thành công', data: updatedEpisode });

    } catch (err) {
        // If error occurs after files uploaded, attempt to delete them
        if (req.files?.thumbnailFile?.[0]) deleteFile(`/thumbnails/episodes/${req.files.thumbnailFile[0].filename}`);
        if (req.files?.videoFile?.[0]) deleteFile(`/videos/${req.files.videoFile[0].filename}`);

        console.error('Update episode error:', err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'ID tập phim không hợp lệ' });
        }
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp dữ liệu (slug hoặc số tập)' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// DELETE /admin/episodes/:id - Xóa tập phim
const deleteEpisode = async (req, res) => {
    try {
        const { id } = req.params;
        const episodeToDelete = await Episode.findById(id); // Find first to get file paths

        if (!episodeToDelete) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tập phim để xóa' });
        }

        // Get file paths before deleting DB record
        const thumbnailPath = episodeToDelete.thumbnail_url?.startsWith('/') ? episodeToDelete.thumbnail_url : null;
        const videoPath = episodeToDelete.video_url?.startsWith('/') ? episodeToDelete.video_url : null;

        // Delete the database record
        await Episode.findByIdAndDelete(id);

        // Delete associated files if they exist locally
        if (thumbnailPath) deleteFile(thumbnailPath);
        if (videoPath) deleteFile(videoPath);


        // TODO: Consider deleting related data (History, Comments) if necessary
        // await History.deleteMany({ episode: id });
        // await Comment.deleteMany({ episode: id });

        res.json({ success: true, message: 'Xóa tập phim thành công', data: { id: episodeToDelete._id } });
    } catch (err) {
        console.error('Delete episode error:', err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'ID tập phim không hợp lệ' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

module.exports = {
    getAllEpisodes,
    getEpisodeById,
    createEpisode,
    updateEpisode,
    deleteEpisode,
};
