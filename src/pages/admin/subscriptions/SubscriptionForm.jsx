import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getData, postData, putData } from "@/services/apiAdminServer";
import { useToast } from "@/context/ToastContext";

const SubscriptionForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [packages, setPackages] = useState([]);
    const [formData, setFormData] = useState({
        user_id: "",
        package_id: "",
        status: "active",
        start_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
        end_date: "", // Will be calculated based on package duration
    });

    const isEditMode = !!id;

    useEffect(() => {
        // Fetch users and packages for dropdowns
        const fetchData = async () => {
            try {
                setLoading(true);
                const [usersResponse, packagesResponse] = await Promise.all([
                    getData("users?limit=100"), // Get all users for dropdown
                    getData("packages?limit=100"), // Get all packages for dropdown
                ]);

                setUsers(usersResponse.data.users || []);
                setPackages(packagesResponse.data.data || []);

                if (isEditMode) {
                    await fetchSubscriptionDetails();
                }
            } catch (err) {
                error(err.response?.data?.message || "Failed to load form data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const fetchSubscriptionDetails = async () => {
        try {
            const response = await getData(`subscriptions/${id}`);
            if (response.data.success) {
                const subscription = response.data.data;
                setFormData({
                    user_id: subscription.user?._id || "",
                    package_id: subscription.package?._id || "",
                    status: subscription.status || "active",
                    start_date: new Date(subscription.start_date).toISOString().split("T")[0],
                    end_date: new Date(subscription.end_date).toISOString().split("T")[0],
                });
            }
        } catch (err) {
            error(err.response?.data?.message || "Failed to load subscription details");
            navigate("/admin/subscriptions");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // If package changes, calculate end date based on package duration
        if (name === "package_id" && value) {
            const selectedPackage = packages.find(pkg => pkg._id === value);
            if (selectedPackage && formData.start_date) {
                const startDate = new Date(formData.start_date);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + selectedPackage.duration_days);

                setFormData(prev => ({
                    ...prev,
                    end_date: endDate.toISOString().split("T")[0]
                }));
            }
        }

        // If start date changes, recalculate end date if package is selected
        if (name === "start_date" && formData.package_id) {
            const selectedPackage = packages.find(pkg => pkg._id === formData.package_id);
            if (selectedPackage && value) {
                const startDate = new Date(value);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + selectedPackage.duration_days);

                setFormData(prev => ({
                    ...prev,
                    end_date: endDate.toISOString().split("T")[0]
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode) {
                const response = await putData(`subscriptions/${id}`, formData);
                if (response.data.success) {
                    success("Subscription updated successfully");
                    navigate("/admin/subscriptions");
                }
            } else {
                const response = await postData("subscriptions", formData);
                if (response.data.success) {
                    success("Subscription created successfully");
                    navigate("/admin/subscriptions");
                }
            }
        } catch (err) {
            error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} subscription`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !users.length && !packages.length) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    {isEditMode ? "Edit Subscription" : "Create New Subscription"}
                </h2>
                <button
                    onClick={() => navigate("/admin/subscriptions")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                >
                    <FaArrowLeft className="mr-2" /> Back to List
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Selection */}
                    <div>
                        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                            User
                        </label>
                        <select
                            id="user_id"
                            name="user_id"
                            value={formData.user_id}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">Select a user</option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                    {user.username} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Package Selection */}
                    <div>
                        <label htmlFor="package_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Package
                        </label>
                        <select
                            id="package_id"
                            name="package_id"
                            value={formData.package_id}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">Select a package</option>
                            {packages.map((pkg) => (
                                <option key={pkg._id} value={pkg._id}>
                                    {pkg.name} - {pkg.price.toLocaleString('vi-VN')}đ ({pkg.duration_days} days)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            End date is automatically calculated based on package duration, but can be manually adjusted.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                        >
                            {loading ? (
                                <span className="inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <FaSave className="mr-2" />
                            )}
                            {isEditMode ? "Update Subscription" : "Create Subscription"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriptionForm;