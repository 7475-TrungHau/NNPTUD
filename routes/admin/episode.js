const express = require('express');
const router = express.Router();
const EpisodeController = require('../../controllers/admin/EpisodeController');
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const uploadEpisodeFiles = require('../../middlewares/uploadEpisode'); // Import the upload middleware

// Middleware to ensure only admins can access these routes
router.use(auth);
router.use(authorize('admin')); // Only admins can manage episodes

// GET /admin/episodes - Lấy danh sách tất cả tập phim
router.get('/', EpisodeController.getAllEpisodes);

// POST /admin/episodes - Tạo tập phim mới (handle file uploads)
router.post('/', uploadEpisodeFiles, EpisodeController.createEpisode);

// GET /admin/episodes/:id - Lấy thông tin chi tiết một tập phim
router.get('/:id', EpisodeController.getEpisodeById);

// PUT /admin/episodes/:id - Cập nhật thông tin tập phim (handle file uploads)
router.put('/:id', uploadEpisodeFiles, EpisodeController.updateEpisode);

// DELETE /admin/episodes/:id - Xóa tập phim
router.delete('/:id', EpisodeController.deleteEpisode);

module.exports = router;
