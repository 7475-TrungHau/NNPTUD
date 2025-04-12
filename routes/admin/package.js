const express = require('express');
const router = express.Router();
const {
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    getMoviesForSelection
} = require('../../controllers/admin/PackageController');
const protect = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ADMIN } = require('../../utils/constants');


router.use(protect);
router.use(authorize('admin'));


router.get('/movies-for-selection', getMoviesForSelection);

router.route('/')
    .get(getAllPackages)
    .post(createPackage);

router.route('/:id')
    .get(getPackageById)
    .put(updatePackage)
    .delete(deletePackage);

module.exports = router;
