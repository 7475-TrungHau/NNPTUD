import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaEdit, FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { getData } from "@/services/apiAdminServer";
import { useToast } from "../../../context/ToastContext";
import { BASE_IMAGE_URL } from "../../../constants";

const PackageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { error } = useToast();
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPackageDetails();
    }, [id]);

    const fetchPackageDetails = async () => {
        try {
            setLoading(true);
            const response = await getData(`packages/${id}`);
            if (response.data.success) {
                setPackageData(response.data.data);
            }
        } catch (err) {
            error(err.response?.data?.message || "Failed to load package details");
            navigate("/admin/packages");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!packageData) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Package not found</p>
                <button
                    onClick={() => navigate("/admin/packages")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    Back to Packages
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Package Details</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate("/admin/packages")}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Packages
                    </button>
                    <Link
                        to={`/admin/packages/edit/${id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaEdit className="mr-2" /> Edit Package
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{packageData.name}</h3>
                            <div className="mt-1 flex items-center">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${packageData.is_active
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}>
                                    {packageData.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{packageData.price.toLocaleString()} đ</p>
                            <p className="text-sm text-gray-500">{packageData.duration_days} days</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900">Description</h4>
                        <p className="mt-2 text-gray-600">
                            {packageData.description || "No description provided."}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900">Features</h4>
                        {packageData.features && packageData.features.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                                {packageData.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <FaCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-gray-500">No features specified.</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900">
                            Movies ({packageData.movies?.length || 0})
                        </h4>
                        {packageData.movies && packageData.movies.length > 0 ? (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {packageData.movies.map((movie) => (
                                    <div key={movie._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="h-40 bg-gray-200 relative">
                                            {movie.poster_url ? (
                                                <img
                                                    src={movie.poster_url.startsWith('http') ? movie.poster_url : BASE_IMAGE_URL + movie.poster_url}
                                                    alt={movie.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h5 className="font-medium text-gray-900 truncate" title={movie.name}>
                                                {movie.name}
                                            </h5>
                                            <p className="text-sm text-gray-500">
                                                {movie.type === "movie" ? "Movie" : "Series"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-gray-500">No movies associated with this package.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageDetail;