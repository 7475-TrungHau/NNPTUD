import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faHome, faSignInAlt } from "@fortawesome/free-solid-svg-icons";

const Error = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-red-600 p-6 text-center">
                    <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="text-white text-6xl mb-4"
                    />
                    <h1 className="text-white text-2xl font-bold">Truy cập bị từ chối</h1>
                </div>

                <div className="p-6">
                    <p className="text-gray-700 mb-6 text-center">
                        Bạn không có quyền truy cập vào trang quản trị. Vui lòng đăng nhập với tài khoản có quyền quản trị hoặc quay lại trang chủ.
                    </p>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <Link
                            to="/"
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded flex items-center justify-center transition duration-300"
                        >
                            <FontAwesomeIcon icon={faHome} className="mr-2" />
                            Trang chủ
                        </Link>

                        <Link
                            to="/login"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center transition duration-300"
                        >
                            <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Error;