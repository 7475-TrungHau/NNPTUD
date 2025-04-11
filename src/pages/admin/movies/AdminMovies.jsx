import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaListUl } from "react-icons/fa";
import { getData, postData, deleteData } from "@/services/apiAdminServer";
import { BASE_IMAGE_URL } from "../../../constants";

const AdminMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalMovies: 0,
        limit: 10
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");

    const fetchMovies = async (page = 1, search = searchTerm) => {
        try {
            setLoading(true);
            const response = await getData('movies', {
                page,
                search,
                sort_by: sortBy,
                sort_direction: sortDirection
            });
            setMovies(response.data.movies);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Error fetching movies:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, [sortBy, sortDirection]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMovies(1, searchTerm);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa phim "${name}"?`)) {
            try {
                await deleteData(`movies/${id}`);
                fetchMovies(pagination.currentPage);
            } catch (error) {
                console.error("Error deleting movie:", error);
            }
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("desc");
        }
    };

    const renderSortIcon = (field) => {
        if (sortBy !== field) return null;
        return sortDirection === "asc" ? " ▲" : " ▼";
    };

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => fetchMovies(i)}
                    className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === i
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                        }`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="flex justify-center mt-6">
                <button
                    onClick={() => fetchMovies(1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                    ≪
                </button>
                <button
                    onClick={() => fetchMovies(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                    ‹
                </button>
                {pages}
                <button
                    onClick={() => fetchMovies(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                    ›
                </button>
                <button
                    onClick={() => fetchMovies(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                    ≫
                </button>
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Quản lý Phim</h2>
                <Link
                    to="/admin/movies/create"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                >
                    <FaPlus className="mr-2" /> Thêm Phim Mới
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <form onSubmit={handleSearch} className="flex mb-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Tìm kiếm phim..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="absolute right-0 top-0 h-full px-4 bg-blue-600 text-white rounded-r hover:bg-blue-700"
                        >
                            <FaSearch />
                        </button>
                    </div>
                </form>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hình ảnh
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort("name")}
                                        >
                                            Tên phim {renderSortIcon("name")}
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort("type")}
                                        >
                                            Loại {renderSortIcon("type")}
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort("year")}
                                        >
                                            Năm {renderSortIcon("year")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tập phim
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            Ngày tạo {renderSortIcon("createdAt")}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {movies && movies?.length > 0 ? (
                                        movies.map((movie) => (
                                            <tr key={movie._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <img
                                                        src={movie.thumbnail_url.startsWith('http') ? movie.thumbnail_url : BASE_IMAGE_URL + movie.thumbnail_url}
                                                        alt={movie.name}
                                                        className="h-16 w-auto object-cover rounded"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{movie.name}</div>
                                                    <div className="text-sm text-gray-500">{movie.origin_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${movie.type === 'movie' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {movie.type === 'movie' ? 'Phim lẻ' : 'Phim bộ'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {movie.year}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {movie.episode_count || 0} tập
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(movie.createdAt).toLocaleDateString('vi-VN')}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link
                                                        to={`/admin/movies/${movie._id}/episodes`}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                        title="Quản lý tập phim"
                                                    >
                                                        <FaListUl className="inline" /> Tập phim
                                                    </Link>
                                                    <Link
                                                        to={`/admin/movies/${movie._id}/edit`}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <FaEdit className="inline" /> Sửa
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(movie._id, movie.name)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FaTrash className="inline" /> Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                                Không tìm thấy phim nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.totalPages > 1 && renderPagination()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminMovies;