const express = require('express');
const router = express.Router();
const EpisodeController = require('../../controllers/admin/EpisodeController');
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const uploadEpisodeFiles = require('../../middlewares/uploadEpisode');


router.use(auth);
router.use(authorize('admin'));


router.get('/', EpisodeController.getAllEpisodes);


router.post('/', uploadEpisodeFiles, EpisodeController.createEpisode);


router.get('/:id', EpisodeController.getEpisodeById);


router.put('/:id', uploadEpisodeFiles, EpisodeController.updateEpisode);


router.delete('/:id', EpisodeController.deleteEpisode);

module.exports = router;
