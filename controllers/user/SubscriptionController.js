const Subscription = require('../../models/Subscription');
const Package = require('../../models/Package');
const User = require('../../models/User');
const Payment = require('../../models/Payment'); // Assuming you have a Payment model
const mongoose = require('mongoose');

// Function to create a new subscription
exports.createSubscription = async (req, res) => {
    const session = await mongoose.startSession(); // Use transactions for atomicity
    session.startTransaction();
    try {
        const userId = req.user.id;
        const { packageId } = req.body;

        if (!packageId || !mongoose.Types.ObjectId.isValid(packageId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Valid Package ID is required.' });
        }

        // Find the package
        const selectedPackage = await Package.findById(packageId).session(session);
        if (!selectedPackage || !selectedPackage.is_active) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Package not found or is inactive.' });
        }

        // --- Payment Simulation/Placeholder ---
        // In a real application, integrate with a payment gateway here.
        // For now, we assume payment is successful if this endpoint is reached.
        // You might create a Payment record here as well.
        console.log(`Simulating successful payment for package ${selectedPackage.name} by user ${userId}`);
        // const paymentRecord = new Payment({ ... payment details ... });
        // await paymentRecord.save({ session });
        // --- End Payment Simulation ---

        // Calculate start and end dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + selectedPackage.duration_days);

        // Create the subscription
        const newSubscription = new Subscription({
            user: userId,
            package: packageId,
            start_date: startDate,
            end_date: endDate,
            status: 'active' // Default status
        });

        await newSubscription.save({ session });

        // Optionally: Update user role or status if needed based on subscription
        // await User.findByIdAndUpdate(userId, { $set: { isPremium: true } }, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'Subscription created successfully!', subscription: newSubscription });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating subscription:', error);
        res.status(500).json({ message: 'Error creating subscription', error: error.message });
    }
};

// Function to get the current user's subscription status
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is available from auth middleware

        const activeSubscription = await Subscription.findOne({
            user: userId,
            status: 'active',
            end_date: { $gt: new Date() } // Ensure the subscription hasn't expired
        }).populate('package');

        if (!activeSubscription) {
            return res.status(404).json({ message: 'No active subscription found.' });
        }

        res.status(200).json({ subscription: activeSubscription });

    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({ message: 'Error fetching subscription status', error: error.message });
    }
};

// Function to get subscription history for the current user
exports.getSubscriptionHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const subscriptions = await Subscription.find({ user: userId })
            .populate('package')
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        res.status(200).json({ history: subscriptions });

    } catch (error) {
        console.error('Error fetching subscription history:', error);
        res.status(500).json({ message: 'Error fetching subscription history', error: error.message });
    }
};

// Add other potential functions like cancelSubscription, etc. later
