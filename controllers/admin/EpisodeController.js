const mongoose = require('mongoose');
const { Episode, Movie } = require('../../models');
const { default: slugify } = require('slugify');


const generateUniqueSlug = async (title, movieId, episodeNumber) => {
    let baseSlug = slugify(`${title}-${episodeNumber}`, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await Episode.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    return slug;
};



const getAllEpisodes = async (req, res) => {
    try {
        const { page = 1, limit = 10, movieId, search } = req.query;
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { createdAt: -1 },
            populate: { path: 'movie', select: 'name slug' }
        };

        let query = {};
        if (movieId) {
            query.movie = movieId;
        }
        if (search) {

            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }


        const episodes = await Episode.paginate(query, options);


        res.json({
            success: true,
            data: episodes.docs,
            pagination: {
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

        });
    } catch (err) {
        console.error('Lỗi lấy danh sách tập phim:', err);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};


const getEpisodeById = async (req, res) => {
    try {
        const episode = await Episode.findById(req.params.id).populate('movie', 'name slug');
        if (!episode) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tập phim' });
        }
        res.json({ success: true, data: episode });
    } catch (err) {
        console.error('Lỗi lấy tập phim theo ID:', err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'ID tập phim không hợp lệ' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

const fs = require('fs');
const path = require('path');


const createEpisode = async (req, res) => {
    try {

        const { title, description, release_date, episode_number, video_url, thumbnail_url } = req.body;
        let movieData = req.body.movie;
        const thumbnailFile = req.files?.thumbnailFile?.[0];
        const videoFile = req.files?.videoFile?.[0];


        let movieId = null;
        if (typeof movieData === 'object' && movieData !== null && movieData._id) {
            movieId = movieData._id.toString();
        } else if (typeof movieData === 'string' && movieData.toLowerCase() !== '[object object]' && mongoose.Types.ObjectId.isValid(movieData)) {

            movieId = movieData;
        }


        if (!movieId) {

            return res.status(400).json({ success: false, message: 'ID phim không hợp lệ hoặc bị thiếu.' });
        }



        if (!title || !episode_number || (!videoFile && !video_url)) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (tiêu đề, số tập, và file video hoặc URL video)' });
        }



        let finalThumbnailUrl = thumbnail_url;
        if (thumbnailFile) {

            finalThumbnailUrl = `/thumbnails/episodes/${thumbnailFile.filename}`;
        }

        let finalVideoUrl = video_url;
        if (videoFile) {

            finalVideoUrl = `/videos/${videoFile.filename}`;
        }


        const movieExists = await Movie.findById(movieId);
        if (!movieExists) {
            return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
        }


        const existingEpisode = await Episode.findOne({ movie: movieId, episode_number: episode_number });
        if (existingEpisode) {
            return res.status(400).json({ success: false, message: `Tập ${episode_number} đã tồn tại cho phim này` });
        }


        const slug = await generateUniqueSlug(title, movieId, episode_number);

        const newEpisode = new Episode({
            movie: movieId,
            title,
            slug,
            description,
            release_date,
            episode_number,
            video_url: finalVideoUrl,
            thumbnail_url: finalThumbnailUrl
        });

        await newEpisode.save();
        res.status(201).json({ success: true, message: 'Tạo tập phim thành công', data: newEpisode });
    } catch (err) {
        console.error('Lỗi tạo tập phim:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp dữ liệu (slug hoặc số tập)' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};


const deleteFile = (filePath) => {

    const fullPath = path.join(__dirname, '..', '..', 'public', filePath); // Adjusted path
    if (filePath && fs.existsSync(fullPath)) {
        try {
            fs.unlinkSync(fullPath);
            console.log(`Đã xóa file cũ: ${fullPath}`);
        } catch (err) {
            console.error(`Lỗi xóa file ${fullPath}:`, err);
        }
    }
};



const updateEpisode = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, release_date, episode_number, video_url, thumbnail_url } = req.body;
        let movieData = req.body.movie;
        const thumbnailFile = req.files?.thumbnailFile?.[0];
        const videoFile = req.files?.videoFile?.[0];


        let newMovieId = null;
        if (movieData) {
            if (typeof movieData === 'object' && movieData._id && mongoose.isValidObjectId(movieData._id)) {
                newMovieId = movieData._id;
            } else if (typeof movieData === 'string' && mongoose.isValidObjectId(movieData)) {
                newMovieId = movieData;
            }
        }

        if (movieData && !newMovieId) {
            console.log('Định dạng ID phim không hợp lệ:', movieData);
            return res.status(400).json({
                success: false,
                message: 'Định dạng ID phim không hợp lệ. Vui lòng cung cấp ID đúng định dạng MongoDB.',
                receivedValue: movieData
            });
        }


        if (typeof movieData !== 'undefined' && !newMovieId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu hoặc sai định dạng ID phim',
                expectedFormat: 'MongoDB ObjectId string hoặc object chứa trường _id'
            });
        }



        const episodeToUpdate = await Episode.findById(id);
        if (!episodeToUpdate) {

            if (thumbnailFile) deleteFile(`/thumbnails/episodes/${thumbnailFile.filename}`);
            if (videoFile) deleteFile(`/videos/${videoFile.filename}`);
            return res.status(404).json({ success: false, message: 'Không tìm thấy tập phim' });
        }


        const oldThumbnailPath = episodeToUpdate.thumbnail_url?.startsWith('/') ? episodeToUpdate.thumbnail_url : null;
        const oldVideoPath = episodeToUpdate.video_url?.startsWith('/') ? episodeToUpdate.video_url : null;



        if (!newMovieId && !title && !description && !release_date && !episode_number && !video_url && !thumbnail_url && !thumbnailFile && !videoFile) {
            return res.status(400).json({ success: false, message: 'Không có thông tin nào được cung cấp để cập nhật' });
        }




        if (newMovieId && newMovieId.toString() !== episodeToUpdate.movie.toString()) {
            const movieExists = await Movie.findById(newMovieId);
            if (!movieExists) {

                if (thumbnailFile) deleteFile(`/thumbnails/episodes/${thumbnailFile.filename}`);
                if (videoFile) deleteFile(`/videos/${videoFile.filename}`);
                return res.status(404).json({ success: false, message: 'Phim mới không tồn tại' });
            }
            episodeToUpdate.movie = newMovieId;
        }


        if (episode_number && episode_number !== episodeToUpdate.episode_number) {
            const targetMovieId = newMovieId || episodeToUpdate.movie;
            const existingEpisode = await Episode.findOne({
                movie: targetMovieId,
                episode_number: episode_number,
                _id: { $ne: id }
            });
            if (existingEpisode) {
                return res.status(400).json({ success: false, message: `Tập ${episode_number} đã tồn tại cho phim này` });
            }
            episodeToUpdate.episode_number = episode_number;
        }


        if (title) episodeToUpdate.title = title;
        if (description) episodeToUpdate.description = description;
        if (release_date) episodeToUpdate.release_date = release_date;


        if (thumbnailFile) {
            episodeToUpdate.thumbnail_url = `/thumbnails/episodes/${thumbnailFile.filename}`;
            if (oldThumbnailPath) deleteFile(oldThumbnailPath);
        } else if (thumbnail_url !== undefined) {
            episodeToUpdate.thumbnail_url = thumbnail_url;
            if (oldThumbnailPath && thumbnail_url !== oldThumbnailPath) deleteFile(oldThumbnailPath);
        }


        if (videoFile) {
            episodeToUpdate.video_url = `/videos/${videoFile.filename}`;
            if (!episodeToUpdate.video_url) {
                return res.status(400).json({ success: false, message: 'URL video là bắt buộc.' });
            }
            if (oldVideoPath) deleteFile(oldVideoPath);
        } else if (video_url !== undefined) {
            episodeToUpdate.video_url = video_url;
            if (!episodeToUpdate.video_url) {
                return res.status(400).json({ success: false, message: 'URL video là bắt buộc.' });
            }
            if (oldVideoPath && video_url !== oldVideoPath) deleteFile(oldVideoPath);
        }


        if (!episodeToUpdate.video_url) {

            if (thumbnailFile) deleteFile(`/thumbnails/episodes/${thumbnailFile.filename}`);
            if (videoFile) deleteFile(`/videos/${videoFile.filename}`);
            return res.status(400).json({ success: false, message: 'URL video không được để trống sau khi cập nhật.' });
        }



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

        if (req.files?.thumbnailFile?.[0]) deleteFile(`/thumbnails/episodes/${req.files.thumbnailFile[0].filename}`);
        if (req.files?.videoFile?.[0]) deleteFile(`/videos/${req.files.videoFile[0].filename}`);

        console.error('Lỗi cập nhật tập phim:', err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'ID tập phim không hợp lệ: ' + err.message });
        }
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp dữ liệu (slug hoặc số tập)' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};


const deleteEpisode = async (req, res) => {
    try {
        const { id } = req.params;
        const episodeToDelete = await Episode.findById(id);

        if (!episodeToDelete) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tập phim để xóa' });
        }


        const thumbnailPath = episodeToDelete.thumbnail_url?.startsWith('/') ? episodeToDelete.thumbnail_url : null;
        const videoPath = episodeToDelete.video_url?.startsWith('/') ? episodeToDelete.video_url : null;


        await Episode.findByIdAndDelete(id);


        if (thumbnailPath) deleteFile(thumbnailPath);
        if (videoPath) deleteFile(videoPath);




        res.json({ success: true, message: 'Xóa tập phim thành công', data: { id: episodeToDelete._id } });
    } catch (err) {
        console.error('Lỗi xóa tập phim:', err);
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
