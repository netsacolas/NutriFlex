import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon = '✅',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fadeIn">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{icon}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
