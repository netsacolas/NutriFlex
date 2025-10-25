import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-card-bg rounded-xl w-full max-w-md border border-border-color shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚠️</span>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-primary mb-4">{message}</p>

          {itemName && (
            <div className="bg-secondary-bg border border-border-color rounded-lg p-3 mb-4">
              <p className="text-text-bright font-semibold text-center">"{itemName}"</p>
            </div>
          )}

          <div className="bg-error/10 border border-error/30 rounded-lg p-3 mb-6">
            <p className="text-sm text-error flex items-center gap-2">
              <span>⚠️</span>
              <span>Esta ação não pode ser desfeita!</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 bg-secondary-bg text-text-primary font-semibold px-4 py-3 rounded-lg border border-border-color hover:bg-hover-bg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold px-4 py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  <span>Excluir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
