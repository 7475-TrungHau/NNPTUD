import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { postData } from "@services/apiAdminServer";
import { useToast } from "@context/ToastContext";

const UserModal = ({ user, mode, onClose, onSave, onRefresh }) => {
    const [userData, setUserData] = useState({
        username: "",
        email: "",
        full_name: "",
        role: "user",
        password: "",
        password_confirmation: ""
    });
    const [errors, setErrors] = useState({});
    const { error } = useToast();

    useEffect(() => {
        if (user) {
            setUserData({
                ...userData,
                ...user,
                password: "",
                password_confirmation: ""
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData({ ...userData, [name]: value });

        // Clear error for this field when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (mode === "create" || (mode === "edit" && userData.email)) {
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (userData.email && !emailRegex.test(userData.email)) {
                newErrors.email = "Định dạng email không hợp lệ";
            }
        }

        if (mode === "create") {
            if (!userData.username) newErrors.username = "Tên đăng nhập là bắt buộc";
            if (!userData.email) newErrors.email = "Email là bắt buộc";
            if (!userData.password) newErrors.password = "Mật khẩu là bắt buộc";
            if (userData.password !== userData.password_confirmation) {
                newErrors.password_confirmation = "Mật khẩu xác nhận không khớp";
            }
        }

        if (mode === "edit") {
            if (userData.password && userData.password !== userData.password_confirmation) {
                newErrors.password_confirmation = "Mật khẩu xác nhận không khớp";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (mode === "create") {
            try {
                await postData("users", userData);
                onRefresh();
                onClose();
            } catch (err) {
                console.error("Error creating user:", err);
                error(err.response?.data?.message || "Không thể tạo người dùng");

                // Set field errors if returned from API
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                }
            }
        } else if (mode === "edit") {
            // Remove password fields if empty
            const dataToSend = { ...userData };
            if (!dataToSend.password) {
                delete dataToSend.password;
                delete dataToSend.password_confirmation;
            }

            onSave(dataToSend);
        }
    };

    const modalTitle = {
        view: "Thông tin người dùng",
        edit: "Chỉnh sửa người dùng",
        create: "Thêm người dùng mới"
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-lg font-medium">{modalTitle[mode]}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={userData.username || ""}
                                onChange={handleChange}
                                disabled={mode === "view" || mode === "edit"} // Username cannot be changed in edit mode
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${mode === "view" || mode === "edit" ? "bg-gray-100" : ""
                                    }`}
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={userData.email || ""}
                                onChange={handleChange}
                                disabled={mode === "view"}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${mode === "view" ? "bg-gray-100" : ""
                                    }`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={userData.full_name || ""}
                                onChange={handleChange}
                                disabled={mode === "view"}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${mode === "view" ? "bg-gray-100" : ""
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Vai trò
                            </label>
                            <select
                                name="role"
                                value={userData.role || "user"}
                                onChange={handleChange}
                                disabled={mode === "view"}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${mode === "view" ? "bg-gray-100" : ""
                                    }`}
                            >
                                <option value="user">user</option>
                                <option value="editor">editor </option>
                                <option value="admin">admin (test)</option>
                            </select>
                        </div>

                        {mode !== "view" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {mode === "create" ? "Mật khẩu" : "Mật khẩu mới (để trống nếu không thay đổi)"}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={userData.password || ""}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Xác nhận mật khẩu
                                    </label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        value={userData.password_confirmation || ""}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.password_confirmation}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {mode === "view" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Ngày tạo
                                </label>
                                <input
                                    type="text"
                                    value={
                                        userData.createdAt
                                            ? new Date(userData.createdAt).toLocaleString("vi-VN")
                                            : ""
                                    }
                                    disabled
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {mode === "view" ? "Đóng" : "Hủy"}
                        </button>

                        {mode !== "view" && (
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                {mode === "create" ? "Tạo" : "Lưu thay đổi"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;