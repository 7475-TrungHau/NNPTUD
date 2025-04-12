const Package = require('../../models/Package');
const Movie = require('../../models/Movie');
const mongoose = require('mongoose');


exports.getAllPackages = async (req, res, next) => {
    try {
        const packages = await Package.find().populate('movies', 'name slug');
        res.status(200).json({ success: true, count: packages.length, data: packages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
};


exports.getPackageById = async (req, res, next) => {
    try {
        const package = await Package.findById(req.params.id).populate('movies', 'name slug poster_url');
        if (!package) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
        }
        res.status(200).json({ success: true, data: package });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
        }
        res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
};


exports.createPackage = async (req, res, next) => {
    const { name, description, price, duration_days, features, is_active, movies } = req.body;


    if (!name || !duration_days) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên và thời hạn' });
    }

    try {

        let validMovieIds = [];
        if (movies && Array.isArray(movies) && movies.length > 0) {
            const foundMovies = await Movie.find({ '_id': { $in: movies } }).select('_id');
            validMovieIds = foundMovies.map(m => m._id);
            if (validMovieIds.length !== movies.length) {
                return res.status(400).json({ success: false, message: 'Một hoặc nhiều ID phim không hợp lệ' });
            }
        }


        const newPackage = await Package.create({
            name,
            description,
            price,
            duration_days,
            features: features || [],
            is_active: is_active !== undefined ? is_active : true,
            movies: validMovieIds
        });


        if (validMovieIds.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: validMovieIds } },
                { $addToSet: { packages: newPackage._id } }
            );
        }

        res.status(201).json({ success: true, data: newPackage });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi Server: ' + error.message });
    }
};


exports.updatePackage = async (req, res, next) => {
    const { name, description, price, duration_days, features, is_active, movies } = req.body;
    const packageId = req.params.id;

    try {
        const packageToUpdate = await Package.findById(packageId);
        if (!packageToUpdate) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
        }

        const oldMovieIds = packageToUpdate.movies.map(id => id.toString());

        let newMovieIds = [];
        if (movies && Array.isArray(movies)) {
            if (movies.length > 0) {
                const foundMovies = await Movie.find({ '_id': { $in: movies } }).select('_id');
                newMovieIds = foundMovies.map(m => m._id.toString());
                if (newMovieIds.length !== movies.length) {
                    return res.status(400).json({ success: false, message: 'Một hoặc nhiều ID phim không hợp lệ' });
                }
            }
        } else {

            newMovieIds = oldMovieIds;
        }


        packageToUpdate.name = name || packageToUpdate.name;
        packageToUpdate.description = description !== undefined ? description : packageToUpdate.description;
        packageToUpdate.price = price !== undefined ? price : packageToUpdate.price;
        packageToUpdate.duration_days = duration_days !== undefined ? duration_days : packageToUpdate.duration_days;
        packageToUpdate.features = features !== undefined ? features : packageToUpdate.features;
        packageToUpdate.is_active = is_active !== undefined ? is_active : packageToUpdate.is_active;
        packageToUpdate.movies = newMovieIds;

        const updatedPackage = await packageToUpdate.save();


        const moviesToAddPackage = newMovieIds.filter(id => !oldMovieIds.includes(id));
        const moviesToRemovePackage = oldMovieIds.filter(id => !newMovieIds.includes(id));


        if (moviesToAddPackage.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: moviesToAddPackage } },
                { $addToSet: { packages: packageId } }
            );
        }


        if (moviesToRemovePackage.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: moviesToRemovePackage } },
                { $pull: { packages: packageId } }
            );
        }

        res.status(200).json({ success: true, data: updatedPackage });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
        }
        res.status(500).json({ success: false, message: 'Lỗi Server: ' + error.message });
    }
};


exports.deletePackage = async (req, res, next) => {
    const packageId = req.params.id;

    try {

        const packageToDelete = await Package.findById(packageId);
        if (!packageToDelete) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
        }

        const movieIds = packageToDelete.movies.map(id => id.toString());


        if (movieIds.length > 0) {
            await Movie.updateMany(
                { '_id': { $in: movieIds } },
                { $pull: { packages: packageId } }
            );
        }


        await Package.deleteOne({ _id: packageId });

        res.status(200).json({ success: true, message: 'Xóa gói thành công' });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gói' });
        }
        res.status(500).json({ success: false, message: 'Lỗi Server: ' + error.message });
    }
};



exports.getMoviesForSelection = async (req, res, next) => {
    try {
        const movies = await Movie.find().select('name slug _id year poster_url');
        res.status(200).json({ success: true, count: movies.length, data: movies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
};
