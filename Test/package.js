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
const protect = require('../../middlewares/auth'); // Corrected: Import auth middleware
const authorize = require('../../middlewares/authorize'); // Corrected: Import authorize middleware from correct file
const { ADMIN } = require('../../utils/constants'); // Assuming role constants

// Protect all routes below and authorize only admins
router.use(protect); // Corrected: Use the imported auth middleware
router.use(authorize('admin')); // This line should now work correctly

// Route to get movies for selection (should be before :id route)
router.get('/movies-for-selection', getMoviesForSelection);

router.route('/')
    .get(getAllPackages)
    .post(createPackage);

router.route('/:id')
    .get(getPackageById)
    .put(updatePackage)
    .delete(deletePackage);

module.exports = router;
