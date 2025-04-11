const User = require('../../models/User');

// Get all users with pagination and search
exports.getAllUsers = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = parseInt(limit);

    try {
        const searchCriteria = search
            ? {
                $or: [
                    { username: { $regex: search, $options: 'i' } }, // Case-insensitive search
                    { email: { $regex: search, $options: 'i' } },
                    { full_name: { $regex: search, $options: 'i' } }
                ],
            }
            : {};

        const users = await User.find(searchCriteria)
            .select('-password') // Exclude password from results
            .sort({ createdAt: -1 }) // Sort by creation date descending
            .skip(skip)
            .limit(queryLimit);

        const totalUsers = await User.countDocuments(searchCriteria);

        res.status(200).json({
            totalUsers: totalUsers,
            totalPages: Math.ceil(totalUsers / queryLimit),
            currentPage: parseInt(page),
            users: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        // Handle potential CastError if ID format is invalid
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
};

// Update user details (e.g., role, full_name)
exports.updateUser = async (req, res) => {
    const { role, full_name, email } = req.body;
    const userId = req.params.id;
    const updateData = {};

    // Only include fields in updateData if they are provided in the request
    if (role !== undefined) {
        // Validate role against the schema enum
        const allowedRoles = User.schema.path('role').enumValues;
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role specified. Allowed roles are: ${allowedRoles.join(', ')}` });
        }
        updateData.role = role;
    }
    if (full_name !== undefined) {
        updateData.full_name = full_name;
    }
    if (email !== undefined) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        updateData.email = email;
    }
    // Add other updatable fields here if needed

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided.' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData }, // Use $set to update only specified fields
            { new: true, runValidators: true } // Return the updated document and run schema validators
        ).select('-password'); // Exclude password from the returned object

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error' + error.message, errors: error.errors });
        }
        res.status(500).json({ message: 'Error updating user' + error.message, error: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        if (user._id.toString() === req.user.id) {

            return res.status(400).json({ message: "Cannot delete your own account." });
        }

        res.status(200).json({ message: 'User deleted successfully', userId: user._id });
    } catch (error) {
        console.error('Error deleting user:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(500).json({ message: 'Error deleting user' + error.message, error: error.message });
    }
};
