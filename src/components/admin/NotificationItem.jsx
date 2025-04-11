import React from "react";

const NotificationItem = ({ title, time }) => (
  <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
    <p className="text-sm font-medium text-gray-800">{title}</p>
    <p className="text-xs text-gray-500">{time}</p>
  </div>
);

export default NotificationItem;