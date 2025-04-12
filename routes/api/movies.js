const express = require('express');
const router = express.Router();
const MovieController = require('../../controllers/api/MovieController');
const auth = require('../../middlewares/auth'); // Middleware for protected routes

router.get('/', MovieController.index);
router.get('/:identifier', MovieController.show);

// GET /api/movies/:movieId/episodes
router.get('/:movieId/episodes', MovieController.getEpisodes);
router.post('/:movieId/rating', auth, MovieController.rateMovie);


router.post('/episodes/:episodeId/history', auth, MovieController.setHistory);


module.exports = router;
