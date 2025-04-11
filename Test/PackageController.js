const Package = require('../../models/Package');
const Movie = require('../../models/Movie');
const mongoose = require('mongoose');

// @desc    Get all packages
// @route   GET /api/admin/packages
// @access  Private/Admin
exports.getAllPackages = async (req, res, next) => {
    try {
        const packages = await Package.find().populate('movies', 'name slug'); // Populate movie names/slugs for display
        res.status(200).json({ success: true, count: packages.length, data: packages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single package
// @route   GET /api/admin/packages/:id
// @access  Private/Admin
exports.getPackageById = async (req, res, next) => {
    try {
        const package = await Package.findById(req.params.id).populate('movies', 'name slug');
        if (!package) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        res.status(200).json({ success: true, data: package });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new package
// @route   POST /api/admin/packages
// @access  Private/Admin
exports.createPackage = async (req, res, next) => {
    const { name, description, price, duration_days, features, is_active, movies } = req.body;

    // Basic validation
    if (!name || !price || !duration_days) {
        return res.status(400).json({ success: false, message: 'Please provide name, price, and duration' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validate movie IDs if provided
        let validMovieIds = [];
        if (movies && Array.isArray(movies) && movies.length > 0) {
            const foundMovies = await Movie.find({ '_id': { $in: movies } }).select('_id').session(session);
            validMovieIds = foundMovies.map(m => m._id);
            if (validMovieIds.length !== movies.length) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ success: false, message: 'One or more movie IDs are invalid' });
            }
        }

        // Create package
        const newPackage = await Package.create([{
            name,
            description,
            price,
            duration_days,
            features: features || [],
            is_active: is_active !== undefined ? is_active : true,
            movies: validMovieIds
        }], { session });

        // Update movies to include this package
        if (validMovieIds.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: validMovieIds } },
                { $addToSet: { packages: newPackage[0]._id } }, // Use $addToSet to avoid duplicates
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, data: newPackage[0] });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        // Handle potential duplicate key error for name if you add a unique index
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update package
// @route   PUT /api/admin/packages/:id
// @access  Private/Admin
exports.updatePackage = async (req, res, next) => {
    const { name, description, price, duration_days, features, is_active, movies } = req.body;
    const packageId = req.params.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const packageToUpdate = await Package.findById(packageId).session(session);
        if (!packageToUpdate) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        const oldMovieIds = packageToUpdate.movies.map(id => id.toString());

        // Validate new movie IDs if provided
        let newMovieIds = [];
        if (movies && Array.isArray(movies)) { // Allow empty array to remove all movies
            if (movies.length > 0) {
                const foundMovies = await Movie.find({ '_id': { $in: movies } }).select('_id').session(session);
                newMovieIds = foundMovies.map(m => m._id.toString());
                if (newMovieIds.length !== movies.length) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ success: false, message: 'One or more movie IDs are invalid' });
                }
            }
        } else {
            // If movies field is not present in the request, keep the existing ones
            newMovieIds = oldMovieIds;
        }

        // Update package fields
        packageToUpdate.name = name || packageToUpdate.name;
        packageToUpdate.description = description !== undefined ? description : packageToUpdate.description;
        packageToUpdate.price = price !== undefined ? price : packageToUpdate.price;
        packageToUpdate.duration_days = duration_days !== undefined ? duration_days : packageToUpdate.duration_days;
        packageToUpdate.features = features !== undefined ? features : packageToUpdate.features;
        packageToUpdate.is_active = is_active !== undefined ? is_active : packageToUpdate.is_active;
        packageToUpdate.movies = newMovieIds; // Update movie list

        const updatedPackage = await packageToUpdate.save({ session });

        // Determine movies to add/remove package reference from
        const moviesToAddPackage = newMovieIds.filter(id => !oldMovieIds.includes(id));
        const moviesToRemovePackage = oldMovieIds.filter(id => !newMovieIds.includes(id));

        // Add package reference to newly associated movies
        if (moviesToAddPackage.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: moviesToAddPackage } },
                { $addToSet: { packages: packageId } },
                { session }
            );
        }

        // Remove package reference from movies no longer associated
        if (moviesToRemovePackage.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: moviesToRemovePackage } },
                { $pull: { packages: packageId } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, data: updatedPackage });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete package
// @route   DELETE /api/admin/packages/:id
// @access  Private/Admin
exports.deletePackage = async (req, res, next) => {
    const packageId = req.params.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const packageToDelete = await Package.findById(packageId).session(session);
        if (!packageToDelete) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        const movieIds = packageToDelete.movies.map(id => id.toString());

        // Remove package reference from associated movies
        if (movieIds.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: movieIds } },
                { $pull: { packages: packageId } },
                { session }
            );
        }

        // Delete the package
        await Package.deleteOne({ _id: packageId }, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, message: 'Package deleted successfully' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Helper function/route to get all movies for selection in frontend (optional)
// @desc    Get all movies (for selection)
// @route   GET /api/admin/packages/movies-for-selection
// @access  Private/Admin
exports.getMoviesForSelection = async (req, res, next) => {
    try {
        const movies = await Movie.find().select('name slug _id'); // Select only necessary fields
        res.status(200).json({ success: true, count: movies.length, data: movies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
