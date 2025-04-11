import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getData, postData, putData } from "@/services/apiAdminServer";
import { useToast } from "../../../context/ToastContext";
import { BASE_IMAGE_URL } from "../../../constants";

const PackageForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [movies, setMovies] = useState([]);
    const [selectedMovies, setSelectedMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: 0,
        duration_days: 30,
        features: "",
        is_active: true,
    });

    const isEditMode = !!id;

    useEffect(() => {
        const fetchMoviesForSelection = async () => {
            try {
                const response = await getData("packages/movies-for-selection");
                setMovies(response.data.data);

            } catch (err) {
                error(err.response?.data?.message || "Failed to load movies");
            }
        };

        fetchMoviesForSelection();

        if (isEditMode) {
            fetchPackageDetails();
        }
    }, [id]);

    const fetchPackageDetails = async () => {
        try {
            setLoading(true);
            const response = await getData(`packages/${id}`);
            if (response.data.success) {
                const packageData = response.data.data;
                setFormData({
                    name: packageData.name,
                    description: packageData.description || "",
                    price: packageData.price,
                    duration_days: packageData.duration_days,
                    features: packageData.features?.join("\n") || "",
                    is_active: packageData.is_active,
                });

                // Set selected movies
                if (packageData.movies && packageData.movies.length > 0) {
                    setSelectedMovies(packageData.movies.map(movie => movie._id));
                }


            }
        } catch (err) {
            error(err.response?.data?.message || "Failed to load package details");
            navigate("/admin/packages");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleMovieSelection = (movieId) => {
        setSelectedMovies(prev => {
            if (prev.includes(movieId)) {
                return prev.filter(id => id !== movieId);
            } else {
                return [...prev, movieId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedMovies.length === filteredMovies.length) {
            setSelectedMovies([]);
        } else {
            setSelectedMovies(filteredMovies.map(movie => movie._id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare data for submission
            const packageData = {
                ...formData,
                price: Number(formData.price),
                duration_days: Number(formData.duration_days),
                features: formData.features.split("\n").filter(feature => feature.trim() !== ""),
                movies: selectedMovies,
            };

            let response;
            if (isEditMode) {
                response = await putData(`packages/${id}`, packageData);
                if (response.data.success) {
                    success("Package updated successfully");
                }
            } else {
                console.log("Package data: ", packageData);

                response = await postData("packages", packageData);
                if (response.data.success) {
                    success("Package created successfully");
                }
            }

            navigate("/admin/packages");
        } catch (err) {
            error(err.response?.data?.message || "Failed to save package");
        } finally {
            setLoading(false);
        }
    };

    // Filter movies based on search term
    const filteredMovies = movies.filter(movie =>
        movie.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && isEditMode) {
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
                    {isEditMode ? "Edit Package" : "Create New Package"}
                </h2>
                <button
                    onClick={() => navigate("/admin/packages")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                >
                    <FaArrowLeft className="mr-2" /> Back to Packages
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Package Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (VND) *
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (Days) *
                            </label>
                            <input
                                type="number"
                                name="duration_days"
                                value={formData.duration_days}
                                onChange={handleChange}
                                required
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <div className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Active</span>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            ></textarea>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Features (One per line)
                            </label>
                            <textarea
                                name="features"
                                value={formData.features}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Enter features, one per line"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            ></textarea>
                            <p className="mt-1 text-sm text-gray-500">
                                Each line will be displayed as a separate feature
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Movies
                            </label>
                            <div className="border border-gray-300 rounded-md p-3">
                                <div className="flex justify-between mb-3">
                                    <input
                                        type="text"
                                        placeholder="Search movies..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                                    >
                                        {selectedMovies.length === filteredMovies.length ? "Deselect All" : "Select All"}
                                    </button>
                                </div>

                                <div className="max-h-60 overflow-y-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="w-12 px-3 py-2"></th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poster</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredMovies.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="px-3 py-4 text-center text-gray-500">
                                                        No movies found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMovies.map((movie) => (
                                                    <tr
                                                        key={movie._id}
                                                        className={`hover:bg-gray-50 cursor-pointer ${selectedMovies.includes(movie._id) ? "bg-blue-50" : ""
                                                            }`}
                                                        onClick={() => handleMovieSelection(movie._id)}
                                                    >
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMovies.includes(movie._id)}
                                                                onChange={() => { }} // Handled by row click
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <img
                                                                src={movie.poster_url?.startsWith('http') ? movie.poster_url : BASE_IMAGE_URL + movie.poster_url}
                                                                alt={movie.name}
                                                                className="h-16 w-12 object-cover rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">
                                                                {movie.year}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {movie.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">
                                                                {movie.type === "movie" ? "Movie" : "Series"}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-2 text-sm text-gray-500">
                                    {selectedMovies.length} movies selected
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/packages")}
                            className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <FaSave className={`${loading ? "hidden" : "mr-2"}`} />
                            {isEditMode ? "Update Package" : "Create Package"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PackageForm;