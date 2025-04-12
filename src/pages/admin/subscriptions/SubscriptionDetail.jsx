import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaEdit, FaArrowLeft, FaTrash } from "react-icons/fa";
import { getData, deleteData } from "@/services/apiAdminServer";
import { useToast } from "@/context/ToastContext";

const SubscriptionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptionDetails();
    }, [id]);

    const fetchSubscriptionDetails = async () => {
        try {
            setLoading(true);
            const response = await getData(`subscriptions/${id}`);
            if (response.data.success) {
                setSubscription(response.data.data);
            }
        } catch (err) {
            error(err.response?.data?.message || "Failed to load subscription details");
            navigate("/admin/subscriptions");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete this subscription?`)) {
            try {
                const response = await deleteData(`subscriptions/${id}`);
                if (response.data.success) {
                    success("Subscription deleted successfully");
                    navigate("/admin/subscriptions");
                }
            } catch (err) {
                error(err.response?.data?.message || "Failed to delete subscription");
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: "bg-green-100 text-green-800",
            expired: "bg-red-100 text-red-800",
            cancelled: "bg-gray-100 text-gray-800",
            pending: "bg-yellow-100 text-yellow-800"
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || "bg-gray-100 text-gray-800"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Subscription not found</p>
                <Link
                    to="/admin/subscriptions"
                    className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    Back to Subscriptions
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Subscription Details</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate("/admin/subscriptions")}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaArrowLeft className="mr-2" /> Back to List
                    </button>
                    <Link
                        to={`/admin/subscriptions/edit/${id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaEdit className="mr-2" /> Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaTrash className="mr-2" /> Delete
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Information</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status</p>
                                <p className="mt-1">{getStatusBadge(subscription.status)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Start Date</p>
                                <p className="mt-1">{formatDate(subscription.start_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">End Date</p>
                                <p className="mt-1">{formatDate(subscription.end_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Created At</p>
                                <p className="mt-1">{formatDate(subscription.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                                <p className="mt-1">{formatDate(subscription.updatedAt)}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                        {subscription.user ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Username</p>
                                    <p className="mt-1">{subscription.user.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="mt-1">{subscription.user.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p className="mt-1">{subscription.user.full_name || "Not provided"}</p>
                                </div>
                                <div>
                                    <Link
                                        to={`/admin/users/${subscription.user._id}`}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        View User Profile
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">User information not available</p>
                        )}

                        <h3 className="text-lg font-medium text-gray-900 mt-8 mb-4">Package Information</h3>
                        {subscription.package ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Package Name</p>
                                    <p className="mt-1">{subscription.package.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Price</p>
                                    <p className="mt-1">{subscription.package.price.toLocaleString('vi-VN')}đ</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Duration</p>
                                    <p className="mt-1">{subscription.package.duration_days} days</p>
                                </div>
                                <div>
                                    <Link
                                        to={`/admin/packages/${subscription.package._id}`}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        View Package Details
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Package information not available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionDetail;