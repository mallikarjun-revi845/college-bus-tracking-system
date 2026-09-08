import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

function Alert({ type = 'info', title, message, onClose }) {
  const bgColor = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  }[type];

  const textColor = {
    info: 'text-blue-800',
    success: 'text-green-800',
    warning: 'text-yellow-800',
    error: 'text-red-800',
  }[type];

  const Icon = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
  }[type];

  return (
    <div className={`${bgColor} border rounded-lg p-4 flex gap-3 items-start`}>
      <Icon className={`${textColor} flex-shrink-0`} size={20} />
      <div className="flex-1">
        {title && <h3 className={`${textColor} font-semibold`}>{title}</h3>}
        {message && <p className={`${textColor} text-sm mt-1`}>{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-75 flex-shrink-0`}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;
