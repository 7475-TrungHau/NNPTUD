import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SidebarLink = ({ icon, to, label, sidebarOpen }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={`flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${isActive
        ? 'bg-red-500 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
      <FontAwesomeIcon icon={icon} className={`${sidebarOpen ? '' : 'mx-auto'}`} />
      {sidebarOpen && <span className="ml-3">{label}</span>}
    </Link>
  );
};

export default SidebarLink;