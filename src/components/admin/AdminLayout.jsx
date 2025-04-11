import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilm,
  faUsers,
  faDollarSign,
  faChartLine,
  faCog,
  faBell,
  faSignOutAlt,
  faBars,
  faTimes,
  faHome,
  faTicketAlt,
  faComments,
  faLayerGroup
} from "@fortawesome/free-solid-svg-icons";
import SidebarLink from "@components/admin/layouts/SidebarLink";
import NotificationItem from "@components/admin/NotificationItem";
import { getUserInfo } from "@services/authService";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("token: ", localStorage.getItem("token"));

    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await getUserInfo();
          if (res.status === 200) {
            let user = {
              username: res.data.user.username,
              fullname: res.data.user.fullname,
              email: res.data.user.email,
              id: res.data.user._id,
              packages: res.data.user.packages ?? [],
              role: res.data.user.role || "user"
            };

            localStorage.setItem("user", JSON.stringify(user));
            console.log("User: ", user);
            setUser(user);

            // Only authenticate if user has admin role
            if (user.role === "admin") {
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
            }
          }
        }
        catch (error) {
          console.log("error: ", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/error" />;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red-500">Play</span>
              <span className="text-2xl font-bold text-white">Film</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-red-500 mx-auto">P</span>
          )}
          <button onClick={toggleSidebar} className="text-gray-300 hover:text-white">
            <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
          </button>
        </div>

        <nav className="mt-5 px-2">
          <SidebarLink icon={faHome} to="/admin" label="Dashboard" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faFilm} to="/admin/movies" label="Phim" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faLayerGroup} to="/admin/categories" label="Thể loại" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faUsers} to="/admin/users" label="Người dùng" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faTicketAlt} to="/admin/subscriptions" label="Gói đăng ký" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faDollarSign} to="/admin/payments" label="Thanh toán" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faChartLine} to="/admin/statistics" label="Thống kê" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faFilm} to="/admin/packages" label="Gói Phim" sidebarOpen={sidebarOpen} />
          <SidebarLink icon={faCog} to="/admin/settings" label="Cài đặt" sidebarOpen={sidebarOpen} />
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-gray-700 p-4">
          <button
            className={`flex items-center ${sidebarOpen ? 'justify-start' : 'justify-center'} text-red-400 hover:text-red-300 w-full`}
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            {sidebarOpen && <span className="ml-3">Đăng xuất</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faBell} />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-20 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-700">Thông báo</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <NotificationItem
                        title="Người dùng mới đăng ký"
                        time="5 phút trước"
                      />
                      <NotificationItem
                        title="Thanh toán mới"
                        time="30 phút trước"
                      />
                      <NotificationItem
                        title="Bình luận mới cần duyệt"
                        time="1 giờ trước"
                      />
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <button className="text-sm text-blue-500 hover:text-blue-700">
                        Xem tất cả
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img
                    src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
                    alt="Admin"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="text-gray-700">{user?.username ?? "Admin"}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 animate-fade-in">
                    <Link
                      to="/admin/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/admin/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cài đặt
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        window.location.href = "/login";
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;