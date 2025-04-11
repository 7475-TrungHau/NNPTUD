import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/common/Toast/ToastContainer";
import "./Admin.css";
import Login from "./pages/user/Login";

// Import Admin Layout
import AdminLayout from "@components/admin/AdminLayout";

// Import Admin Pages
import AdminDashboard from "./pages/admin/dashboard/AdminDashboard";
import AdminMovies from "./pages/admin/movies/AdminMovies";
import AdminUsers from "./pages/admin/users/AdminUsers";
import Category from "./pages/admin/category/Category";
import CreateMovie from "./pages/admin/movies/CreateMovie";
import EditMovie from "./pages/admin/movies/EditMovie";
import EpisodeList from "./pages/admin/episodes/EpisodeList";
import EpisodeForm from "./pages/admin/episodes/EpisodeForm";
import PackageList from "./pages/admin/packages/PackageList";
import PackageForm from "./pages/admin/packages/PackageForm";
import PackageDetail from "./pages/admin/packages/PackageDetail";
import Error from "./pages/Error";

// Placeholder imports - create these files as needed
const AdminPayments = () => <div className="text-2xl font-bold">Quản lý Thanh toán</div>;
const AdminStatistics = () => <div className="text-2xl font-bold">Thống kê</div>;
const AdminSettings = () => <div className="text-2xl font-bold">Cài đặt</div>;
const AdminCategories = () => <div className="text-2xl font-bold">Quản lý Thể loại</div>;
const AdminSubscriptions = () => <div className="text-2xl font-bold">Quản lý Gói đăng ký</div>;
const AdminComments = () => <div className="text-2xl font-bold">Quản lý Bình luận</div>;

const AdminApp = () => {
    return (
        <ToastProvider>
            <Router>
                <Routes>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="movies" element={<AdminMovies />} />
                        <Route path="movies/create" element={<CreateMovie />} />
                        <Route path="/admin/movies/:id/edit" element={<EditMovie />} />
                        <Route path="/admin/packages" element={<PackageList />} />
                        <Route path="/admin/packages/create" element={<PackageForm />} />
                        <Route path="/admin/packages/edit/:id" element={<PackageForm />} />
                        <Route path="/admin/packages/:id" element={<PackageDetail />} />

                        <Route path="/admin/movies/:movieId/episodes" element={<EpisodeList />} />
                        <Route path="/admin/movies/:movieId/episodes/create" element={<EpisodeForm />} />
                        <Route path="/admin/movies/:movieId/episodes/:episodeId/edit" element={<EpisodeForm />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="payments" element={<AdminPayments />} />
                        <Route path="statistics" element={<AdminStatistics />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="categories" element={<Category />} />
                        <Route path="subscriptions" element={<AdminSubscriptions />} />
                        <Route path="comments" element={<AdminComments />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/error" element={<Error />} />
                </Routes>
                <ToastContainer />
            </Router>
        </ToastProvider>
    );
};

export default AdminApp;
