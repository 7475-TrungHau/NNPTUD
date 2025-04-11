import React from "react";
import { faUsers, faFilm, faDollarSign, faChartLine } from "@fortawesome/free-solid-svg-icons";
import StatCard from "@components/admin/layouts/StatCard";

const AdminDashboard = () => (
    <div>
        <h2 className="text-2xl font-bold mb-6">Tổng quan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Tổng người dùng" value="2" icon={faUsers} color="blue" />
            <StatCard title="Phim đã đăng" value="2" icon={faFilm} color="green" />
            <StatCard title="Doanh thu tháng" value="678,000đ" icon={faDollarSign} color="yellow" />
            <StatCard title="Lượt xem hôm nay" value="32" icon={faChartLine} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Thống kê người dùng</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Biểu đồ người dùng</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Biểu đồ doanh thu </p>
                </div>
            </div>
        </div>
    </div>
);

export default AdminDashboard;