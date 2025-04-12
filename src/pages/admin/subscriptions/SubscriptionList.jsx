import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaPlus } from "react-icons/fa";
import { getData, deleteData } from "@/services/apiAdminServer";
import { useToast } from "@/context/ToastContext";

const SubscriptionList = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 10
    });
    const { success, error } = useToast();

    useEffect(() => {
        fetchSubscriptions();
    }, [pagination.currentPage]);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await getData(`subscriptions?page=${pagination.currentPage}&limit=${pagination.limit}`);
            if (response.data.success) {
                setSubscriptions(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            error(err.response?.data?.message || "Failed to load subscriptions " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, userName) => {
        if (window.confirm(`Are you sure you want to delete subscription for "${userName}"?`)) {
            try {
                const response = await deleteData(`subscriptions/${id}`);
                if (response.data.success) {
                    success("Subscription deleted successfully");
                    fetchSubscriptions();
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
            day: '2-digit'
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

    const handlePageChange = (page) => {
        setPagination({
            ...pagination,
            currentPage: page
        });
    };

    if (loading && subscriptions.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Subscription Management</h2>
                <Link
                    to="/admin/subscriptions/create"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                >
                    <FaPlus className="mr-2" /> Add New Subscription
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {subscriptions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No subscriptions found</p>
                        <Link
                            to="/admin/subscriptions/create"
                            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                            Create your first subscription
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Package
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        End Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {subscriptions.map((subscription) => (
                                    <tr key={subscription._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {subscription.user?.username || "Unknown User"}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {subscription.user?.email || "No email"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {subscription.package?.name || "Unknown Package"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {subscription.package?.price ? `${subscription.package.price.toLocaleString('vi-VN')}đ` : ""}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(subscription.start_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(subscription.end_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(subscription.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    to={`/admin/subscriptions/${subscription._id}`}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <Link
                                                    to={`/admin/subscriptions/edit/${subscription._id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(subscription._id, subscription.user?.username || "this user")}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.currentPage === 1}
                            className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === 1
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-gray-200 hover:bg-gray-300"
                                }`}
                        >
                            First
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === 1
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-gray-200 hover:bg-gray-300"
                                }`}
                        >
                            Prev
                        </button>

                        {/* Page numbers */}
                        {[...Array(pagination.totalPages).keys()].map((page) => (
                            <button
                                key={page + 1}
                                onClick={() => handlePageChange(page + 1)}
                                className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === page + 1
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300"
                                    }`}
                            >
                                {page + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === pagination.totalPages
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-gray-200 hover:bg-gray-300"
                                }`}
                        >
                            Next
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === pagination.totalPages
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-gray-200 hover:bg-gray-300"
                                }`}
                        >
                            Last
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionList;