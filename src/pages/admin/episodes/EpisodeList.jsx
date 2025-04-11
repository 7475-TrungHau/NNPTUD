import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus, FaArrowLeft } from "react-icons/fa";
import { getData, deleteData } from "@/services/apiAdminServer";
import { BASE_IMAGE_URL } from "../../../constants";

const EpisodeList = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const [episodes, setEpisodes] = useState([]);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [movieId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch movie details
            const movieResponse = await getData(`movies/${movieId}`);
            console.log(" Data: ", movieResponse.data.movie);

            setMovie(movieResponse.data.movie);

            // Fetch episodes for this movie
            const episodesResponse = await getData('episodes', { movieId });
            setEpisodes(episodesResponse.data.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, title) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tập "${title}"?`)) {
            try {
                await deleteData(`episodes/${id}`);
                // Refresh the episode list
                fetchData();
            } catch (error) {
                console.error("Error deleting episode:", error);
                alert("Có lỗi xảy ra khi xóa tập phim");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Không tìm thấy thông tin phim</p>
                <button
                    onClick={() => navigate("/admin/movies")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    Quay lại danh sách phim
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Quản lý tập phim</h2>
                    <p className="text-gray-600">Phim: {movie.name}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate("/admin/movies")}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaArrowLeft className="mr-2" /> Quay lại
                    </button>
                    <Link
                        to={`/admin/movies/${movieId}/episodes/create`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaPlus className="mr-2" /> Thêm tập mới
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {episodes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Chưa có tập phim nào</p>
                        <Link
                            to={`/admin/movies/${movieId}/episodes/create`}
                            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                            Thêm tập đầu tiên
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thumbnail
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tập
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiêu đề
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày phát hành
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {episodes.map((episode) => (
                                    <tr key={episode._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {episode.thumbnail_url ? (
                                                <img
                                                    src={episode.thumbnail_url.startsWith('http')
                                                        ? episode.thumbnail_url
                                                        : BASE_IMAGE_URL + episode.thumbnail_url}
                                                    alt={`Thumbnail for episode ${episode.episode_number}`}
                                                    className="h-16 w-auto object-cover rounded"
                                                />
                                            ) : (
                                                <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">No image</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                Tập {episode.episode_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{episode.title}</div>
                                            <div className="text-xs text-gray-500">{episode.slug}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {episode.release_date
                                                ? new Date(episode.release_date).toLocaleDateString('vi-VN')
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/admin/movies/${movieId}/episodes/${episode._id}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <FaEdit className="inline" /> Sửa
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(episode._id, episode.title)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <FaTrash className="inline" /> Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EpisodeList;