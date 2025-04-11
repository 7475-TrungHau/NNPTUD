import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getData, putFormDataApi } from "@services/apiAdminServer";
import { BASE_IMAGE_URL } from "../../../constants";
import { putData } from "../../../services/apiAdminServer";

const EditMovie = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        origin_name: "",
        slug: "",
        description: "",
        type: "movie",
        category: "",
        year: new Date().getFullYear(),
        country: "",
        genres: "",
        actor: "",
        director: "",
        poster_url: "",
        thumbnail_url: "",
        trailer_url: "",
    });

    const [files, setFiles] = useState({
        poster: null,
        thumbnail: null,
    });

    const [previews, setPreviews] = useState({
        poster: "",
        thumbnail: "",
        trailer: "",
    });

    const [useUrls, setUseUrls] = useState({
        poster: true,
        thumbnail: true,
    });

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setFetchLoading(true);
                const response = await getData(`movies/${id}/edit`);
                const { movie, categories } = response.data;

                setCategories(categories);

                // Convert arrays to comma-separated strings
                const movieData = {
                    ...movie,
                    genres: movie.genres?.join(", ") || "",
                    actor: movie.actor?.join(", ") || "",
                    director: movie.director?.join(", ") || "",
                };

                setFormData(movieData);

                // Set previews
                setPreviews({
                    poster: movie.poster_url || "",
                    thumbnail: movie.thumbnail_url || "",
                    trailer: movie.trailer_url || "",
                });

                // Determine if using URLs
                setUseUrls({
                    poster: !!movie.poster_url,
                    thumbnail: !!movie.thumbnail_url,
                });
            } catch (error) {
                console.error("Error fetching movie:", error);
                alert("Không thể tải thông tin phim: " + (error.response?.data?.message || error.message));
            } finally {
                setFetchLoading(false);
            }
        };

        fetchMovie();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles.length > 0) {
            const file = selectedFiles[0];
            setFiles(prev => ({ ...prev, [name]: file }));

            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, [name]: previewUrl }));
        }
    };

    const handleUrlChange = (e) => {
        const { name, value } = e.target;
        const fieldName = name.replace("_url", "");
        setFormData(prev => ({ ...prev, [name]: value }));
        setPreviews(prev => ({ ...prev, [fieldName]: value }));
    };

    const toggleUrlMode = (field) => {
        setUseUrls(prev => {
            const newState = { ...prev, [field]: !prev[field] };

            // Clear file or URL when switching modes
            if (newState[field]) {
                setFiles(prev => ({ ...prev, [field]: null }));
            } else {
                setFormData(prev => ({ ...prev, [`${field}_url`]: "" }));
                setPreviews(prev => ({ ...prev, [field]: "" }));
            }

            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const movieFormData = new FormData();

            // Append all text fields
            Object.keys(formData).forEach(key => {
                if (formData[key] !== "") {
                    movieFormData.append(key, formData[key]);
                }
            });

            // Append files if not using URLs
            if (!useUrls.poster && files.poster) {
                movieFormData.append("poster", files.poster);
            }

            if (!useUrls.thumbnail && files.thumbnail) {
                movieFormData.append("thumbnail", files.thumbnail);
            }

            const response = await putFormDataApi(`movies/${id}`, movieFormData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                navigate("/admin/movies");
            }
        } catch (error) {
            console.error("Error updating movie:", error);
            alert("Có lỗi xảy ra khi cập nhật phim: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Chỉnh Sửa Phim: {formData.name}</h2>
                <button
                    onClick={() => navigate("/admin/movies")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                >
                    <FaArrowLeft className="mr-2" /> Quay lại
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Thông tin cơ bản</h3>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Tên phim *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="origin_name">
                                    Tên gốc
                                </label>
                                <input
                                    type="text"
                                    id="origin_name"
                                    name="origin_name"
                                    value={formData.origin_name}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="slug">
                                    Slug *
                                </label>
                                <input
                                    type="text"
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                                    Loại phim *
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    <option value="movie">Movie</option>
                                    <option value="series">Series</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                                    Danh mục *
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="year">
                                    Năm sản xuất
                                </label>
                                <input
                                    type="number"
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                                    Quốc gia
                                </label>
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Thông tin chi tiết</h3>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                    Mô tả
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                ></textarea>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="genres">
                                    Thể loại
                                </label>
                                <input
                                    type="text"
                                    id="genres"
                                    name="genres"
                                    value={formData.genres}
                                    onChange={handleChange}
                                    placeholder="Hành động, Phiêu lưu, ..."
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Các thể loại cách nhau bởi dấu phẩy
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="actor">
                                    Diễn viên
                                </label>
                                <input
                                    type="text"
                                    id="actor"
                                    name="actor"
                                    value={formData.actor}
                                    onChange={handleChange}
                                    placeholder="Tom Cruise, Brad Pitt, ..."
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Các diễn viên cách nhau bởi dấu phẩy
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="director">
                                    Đạo diễn
                                </label>
                                <input
                                    type="text"
                                    id="director"
                                    name="director"
                                    value={formData.director}
                                    onChange={handleChange}
                                    placeholder="Christopher Nolan, ..."
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Các đạo diễn cách nhau bởi dấu phẩy
                                </p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mt-6 mb-4 border-b pb-2">Hình ảnh & Video</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Poster */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-gray-700 text-sm font-bold" htmlFor="poster">
                                    Poster
                                </label>
                                <button
                                    type="button"
                                    onClick={() => toggleUrlMode("poster")}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    {useUrls.poster ? "Tải file lên" : "Dùng URL"}
                                </button>
                            </div>

                            {useUrls.poster ? (
                                <input
                                    type={formData.poster_url.startsWith('http') ? "url" : "text"}
                                    id="poster_url"
                                    name="poster_url"
                                    value={formData.poster_url}
                                    onChange={handleUrlChange}
                                    placeholder="https://example.com/poster.jpg"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                            ) : (
                                <input
                                    type="file"
                                    id="poster"
                                    name="poster"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                            )}

                            {previews.poster && (
                                <div className="mt-2 border rounded p-2">
                                    <p className="text-sm font-semibold mb-1">Xem trước:</p>
                                    <img
                                        src={previews.poster.startsWith('http') ? previews.poster : previews.poster.startsWith('/') ? BASE_IMAGE_URL + previews.poster : previews.poster}
                                        alt="Poster preview"
                                        className="max-h-40 mx-auto"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-gray-700 text-sm font-bold" htmlFor="thumbnail">
                                    Thumbnail
                                </label>
                                <button
                                    type="button"
                                    onClick={() => toggleUrlMode("thumbnail")}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    {useUrls.thumbnail ? "Tải file lên" : "Dùng URL"}
                                </button>
                            </div>

                            {useUrls.thumbnail ? (
                                <input
                                    type={formData.thumbnail_url.startsWith('http') ? "url" : "text"}
                                    id="thumbnail_url"
                                    name="thumbnail_url"
                                    value={formData.thumbnail_url}
                                    onChange={handleUrlChange}
                                    placeholder="https://example.com/thumbnail.jpg"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                            ) : (
                                <input
                                    type="file"
                                    id="thumbnail"
                                    name="thumbnail"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                            )}

                            {previews.thumbnail && (
                                <div className="mt-2 border rounded p-2">
                                    <p className="text-sm font-semibold mb-1">Xem trước:</p>
                                    <img
                                        src={previews.thumbnail.startsWith('http') ? previews.thumbnail : previews.thumbnail.startsWith('/') ? BASE_IMAGE_URL + previews.thumbnail : previews.thumbnail}
                                        alt="Thumbnail preview"
                                        className="max-h-40 mx-auto"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Trailer */}
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="trailer_url">
                                Trailer URL
                            </label>
                            <input
                                type="url"
                                id="trailer_url"
                                name="trailer_url"
                                value={formData.trailer_url}
                                onChange={handleUrlChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                            />

                            {previews.trailer && (
                                <div className="mt-2 border rounded p-2">
                                    <p className="text-sm font-semibold mb-1">Xem trước:</p>
                                    {formData.trailer_url.includes('youtube.com') || formData.trailer_url.includes('youtu.be') ? (
                                        <iframe
                                            width="100%"
                                            height="150"
                                            src={formData.trailer_url.replace('watch?v=', 'embed/')}
                                            title="Trailer preview"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <video
                                            src={formData.trailer_url}
                                            controls
                                            className="max-h-40 mx-auto"
                                        ></video>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/movies")}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <FaSave className="mr-2" /> Cập nhật phim
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMovie;