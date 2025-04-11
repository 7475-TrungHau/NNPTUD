import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500"
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <div className={`${colorClasses[color]} rounded-full p-3 mr-4`}>
        <FontAwesomeIcon icon={icon} className="text-white text-xl" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;