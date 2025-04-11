import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { faFilm, faUsers, faDollarSign, faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-lg">
                <div className="p-4 text-2xl font-bold border-b border-gray-700">
                    <span className="text-red-500">PlayFilm</span> Admin
                </div>
                <nav className="p-4 space-y-2">
                    <Link
                        to="/admin"
                        className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon icon={faFilm} className="w-5 h-5" />
                        <span>Movies</span>
                    </Link>
                    <Link
                        to="/admin/users"
                        className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
                        <span>Users</span>
                    </Link>
                    <Link
                        to="/admin/revenue"
                        className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon icon={faDollarSign} className="w-5 h-5" />
                        <span>Revenue</span>
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon icon={faCog} className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;