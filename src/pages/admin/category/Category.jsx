import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faSave, faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";
import { getData, postData, putData, deleteData } from "@services/apiAdminServer";


const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: ""
    });
    const [currentCategoryId, setCurrentCategoryId] = useState(null);
    const { success, error } = useToast();

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
        success("Token: ", localStorage.getItem("token") ?? "Token ko ton tai");
    }, []);
    console.log("token: ", localStorage.getItem("token"));

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getData("category");
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (err) {
            error(err.response?.data?.message || "Không thể tải danh mục");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Auto-generate slug from name if in create mode
        if (name === "name" && !editMode) {
            const slug = value
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-");
            setFormData((prev) => ({ ...prev, slug }));
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            description: ""
        });
        setEditMode(false);
        setCurrentCategoryId(null);
        setShowForm(false);
    };

    const handleAddNew = () => {
        resetForm();
        setShowForm(true);
        setEditMode(false);
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || ""
        });
        setCurrentCategoryId(category._id);
        setShowForm(true);
        setEditMode(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

        try {
            const response = await deleteData(`category/${id}`);
            if (response.data.success) {
                success("Xóa danh mục thành công");
                setCategories(categories.filter(cat => cat._id !== id));
            }
        } catch (err) {
            error(err.response?.data?.message || "Không thể xóa danh mục");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let response;
            if (editMode) {
                response = await putData(`category/${currentCategoryId}`, formData);
                if (response.data.success) {
                    success("Cập nhật danh mục thành công");
                    setCategories(
                        categories.map(cat =>
                            cat._id === currentCategoryId ? response.data.data : cat
                        )
                    );
                }
            } else {
                response = await postData("category", formData);
                if (response.data.success) {
                    success("Thêm danh mục thành công");
                    setCategories([response.data.data, ...categories]);
                }
            }
            resetForm();
        } catch (err) {
            error(err.response?.data?.message || "Không thể lưu danh mục");
        }
    };

    // Filter categories based on search term
    const filteredCategories = categories.filter(
        category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục</h1>
                <button
                    onClick={handleAddNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Thêm danh mục mới
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                </div>
            </div>

            {/* Form for adding/editing */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            {editMode ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                        </h2>
                        <button
                            onClick={resetForm}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên danh mục <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            >
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                {editMode ? "Cập nhật" : "Lưu"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                            <div
                                key={category._id}
                                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                            {category.name}
                                        </h3>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-blue-500 hover:text-blue-700"
                                                title="Chỉnh sửa"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category._id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Xóa"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">Slug: {category.slug}</p>
                                    {category.description && (
                                        <p className="text-sm text-gray-600 mt-2">{category.description}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10">
                            <p className="text-gray-500">Không tìm thấy danh mục nào</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Category;