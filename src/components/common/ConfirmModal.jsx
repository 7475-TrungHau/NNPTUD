import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const ConfirmModal = ({
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    onConfirm,
    onCancel
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-lg font-medium flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mr-2" />
                        {title}
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-700">{message}</p>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;