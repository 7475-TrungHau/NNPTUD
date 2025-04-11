import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getData, postFormDataApi, putFormDataApi } from "@/services/apiAdminServer";
import { BASE_IMAGE_URL } from "../../../constants";

const EpisodeForm = () => {
    const { movieId, episodeId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [movie, setMovie] = useState(null);
    const [isEditMode, setIsEditMode] = useState(!!episodeId);

    const [formData, setFormData] = useState({
        movie: movieId,
        title: "",
        description: "",
        episode_number: "",
        release_date: new Date().toISOString().split('T')[0],
        video_url: "",
        thumbnail_url: ""
    });

    const [files, setFiles] = useState({
        thumbnailFile: null,
        videoFile: null
    });

    const [previews, setPreviews] = useState({
        thumbnail: "",
        video: ""
    });

    const [useUrls, setUseUrls] = useState({
        thumbnail: false,
        video: false
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch movie details
                const movieResponse = await getData(`movies/${movieId}`);
                setMovie(movieResponse.data.movie);

                // If editing, fetch episode details
                if (isEditMode) {
                    const episodeResponse = await getData(`episodes/${episodeId}`);
                    const episode = episodeResponse.data.data;

                    setFormData({
                        movie: episode.movie._id,
                        title: episode.title || "",
                        description: episode.description || "",
                        episode_number: episode.episode_number || "",
                        release_date: episode.release_date
                            ? new Date(episode.release_date).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0],
                        video_url: episode.video_url || "",
                        thumbnail_url: episode.thumbnail_url || ""
                    });

                    // Set previews if URLs exist
                    setPreviews({
                        thumbnail: episode.thumbnail_url || "",
                        video: episode.video_url || ""
                    });

                    // If URLs exist, set useUrls to true
                    setUseUrls({
                        thumbnail: !!episode.thumbnail_url,
                        video: !!episode.video_url
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Có lỗi xảy ra khi tải dữ liệu");
            }
        };

        fetchData();
    }, [movieId, episodeId, isEditMode]);

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
            const previewField = name === 'thumbnailFile' ? 'thumbnail' : 'video';
            setPreviews(prev => ({ ...prev, [previewField]: previewUrl }));
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
                const fileField = field === 'thumbnail' ? 'thumbnailFile' : 'videoFile';
                setFiles(prev => ({ ...prev, [fileField]: null }));
            } else {
                setFormData(prev => ({ ...prev, [`${field}_url`]: "" }));
                setPreviews(prev => ({ ...prev, [field]: "" }));
            }

            return newState;
        });
    };

    // Add this state near your other state declarations
    const [uploadProgress, setUploadProgress] = useState(0);

    // Then modify the handleSubmit function to include the progress tracking
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress(0); // Reset progress when starting a new upload

        try {
            const episodeFormData = new FormData();

            // Append all text fields
            Object.keys(formData).forEach(key => {
                if (formData[key] !== "") {
                    episodeFormData.append(key, formData[key]);
                }
            });

            // Append files if not using URLs
            if (!useUrls.thumbnail && files.thumbnailFile) {
                episodeFormData.append("thumbnailFile", files.thumbnailFile);
            }

            if (!useUrls.video && files.videoFile) {
                episodeFormData.append("videoFile", files.videoFile);
            }
            // Log FormData entries for debugging
            console.log("FormData entries:");
            for (let pair of episodeFormData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            // Check if FormData is empty
            if ([...episodeFormData.entries()].length === 0) {
                console.error("FormData is empty - please check form inputs");
                throw new Error("No data to submit");
            }

            // Add progress tracking configuration
            const config = {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
            };

            let response;
            if (isEditMode) {
                response = await putFormDataApi(`episodes/${episodeId}`, episodeFormData, config);
            } else {
                response = await postFormDataApi("episodes", episodeFormData, config);
            }

            if (response.data.success) {
                navigate(`/admin/movies/${movieId}/episodes`);
            }
        } catch (error) {
            console.error("Error saving episode:", error.message);
            alert("Có lỗi xảy ra khi lưu tập phim: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!movie) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">
                        {isEditMode ? "Chỉnh sửa tập phim" : "Thêm tập phim mới"}
                    </h2>
                    <p className="text-gray-600">Phim: {movie.name}</p>
                </div>
                <button
                    onClick={() => navigate(`/admin/movies/${movieId}/episodes`)}
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
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="episode_number">
                                    Số tập *
                                </label>
                                <input
                                    type="number"
                                    id="episode_number"
                                    name="episode_number"
                                    value={formData.episode_number}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                                    Tiêu đề tập *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="release_date">
                                    Ngày phát hành
                                </label>
                                <input
                                    type="date"
                                    id="release_date"
                                    name="release_date"
                                    value={formData.release_date}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

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
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Video & Thumbnail</h3>

                            {/* Thumbnail */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-gray-700 text-sm font-bold" htmlFor="thumbnailFile">
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
                                        id="thumbnailFile"
                                        name="thumbnailFile"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                )}

                                {previews.thumbnail && (
                                    <div className="mt-2 border rounded p-2">
                                        <p className="text-sm font-semibold mb-1">Xem trước:</p>
                                        <img
                                            src={previews.thumbnail.startsWith('http')
                                                ? previews.thumbnail
                                                : previews.thumbnail.startsWith('/')
                                                    ? BASE_IMAGE_URL + previews.thumbnail
                                                    : previews.thumbnail}
                                            alt="Thumbnail preview"
                                            className="max-h-40 mx-auto"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Video */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-gray-700 text-sm font-bold" htmlFor="videoFile">
                                        Video *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => toggleUrlMode("video")}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        {useUrls.video ? "Tải file lên" : "Dùng URL"}
                                    </button>
                                </div>

                                {useUrls.video ? (
                                    <input
                                        type={formData.video_url.startsWith('http') ? "url" : "text"}
                                        id="video_url"
                                        name="video_url"
                                        value={formData.video_url}
                                        onChange={handleUrlChange}
                                        placeholder="https://example.com/video.mp4"
                                        required={useUrls.video}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                ) : (
                                    <input
                                        type="file"
                                        id="videoFile"
                                        name="videoFile"
                                        accept="video/*"
                                        onChange={handleFileChange}
                                        required={!isEditMode && !useUrls.video}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                )}

                                {previews.video && (
                                    <div className="mt-2 border rounded p-2">
                                        <p className="text-sm font-semibold mb-1">Xem trước:</p>
                                        <video
                                            src={previews.video.startsWith('http')
                                                ? previews.video
                                                : previews.video.startsWith('/')
                                                    ? BASE_IMAGE_URL + previews.video
                                                    : previews.video}
                                            controls
                                            className="max-h-40 w-full"
                                        ></video>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        {/* Show progress bar when uploading */}
                        {loading && uploadProgress > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    Đang tải lên: {uploadProgress}%
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/movies/${movieId}/episodes`)}
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
                                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="mr-2" />
                                        {isEditMode ? "Cập nhật" : "Lưu"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EpisodeForm;