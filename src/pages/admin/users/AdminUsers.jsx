import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faUserPlus, faSearch, faEye } from "@fortawesome/free-solid-svg-icons";
import { getData, putData, deleteData } from "@services/apiAdminServer";
import { useToast } from "@context/ToastContext";
import UserModal from "./UserModal";
import ConfirmModal from "@components/common/ConfirmModal";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("view"); // view, edit
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const { success, error } = useToast();

    // Fetch users on component mount and when page or search changes
    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await getData(`users?page=${currentPage}&limit=10&search=${searchTerm}`);
            setUsers(response.data.users);
            setTotalPages(response.data.totalPages);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching users:", err);
            error("Không thể tải danh sách người dùng");
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setModalMode("view");
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setModalMode("edit");
        setIsModalOpen(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteData(`users/${userToDelete._id}`);
            success("Xóa người dùng thành công");
            fetchUsers();
            setIsConfirmModalOpen(false);
        } catch (err) {
            console.error("Error deleting user:", err);
            error(err.response?.data?.message || "Không thể xóa người dùng");
        }
    };

    const handleUpdateUser = async (userData) => {
        try {
            await putData(`users/${userData._id}`, userData);
            success("Cập nhật người dùng thành công");
            fetchUsers();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Error updating user:", err);
            error(err.response?.data?.message || "Không thể cập nhật người dùng");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    // Generate pagination buttons
    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-1 rounded ${currentPage === i
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                        }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Quản lý Người dùng</h2>

            {/* Search and filters */}
            <div className="mb-6 flex justify-between items-center">
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-3 text-gray-400"
                    />
                </div>
                <button
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
                    onClick={() => {
                        setSelectedUser({});
                        setModalMode("create");
                        setIsModalOpen(true);
                    }}
                >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Thêm người dùng (Redirect Register)
                </button>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên người dùng
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vai trò
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ngày tạo
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center">
                                    Không tìm thấy người dùng nào
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                {user.username?.charAt(0).toUpperCase() || "U"}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.username}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.full_name || "Chưa cập nhật"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleViewUser(user)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(user)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-center">
                {renderPagination()}
            </div>

            {/* User Modal for View/Edit */}
            {isModalOpen && (
                <UserModal
                    user={selectedUser}
                    mode={modalMode}
                    onClose={closeModal}
                    onSave={handleUpdateUser}
                    onRefresh={fetchUsers}
                />
            )}

            {/* Confirm Delete Modal */}
            {isConfirmModalOpen && (
                <ConfirmModal
                    title="Xác nhận xóa người dùng"
                    message={`Bạn có chắc chắn muốn xóa người dùng ${userToDelete?.username}? Hành động này không thể hoàn tác.`}
                    confirmText="Xóa"
                    cancelText="Hủy"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setIsConfirmModalOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminUsers;