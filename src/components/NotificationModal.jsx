import React, { memo, useEffect } from 'react';


const VARIANT_CONFIG = {
  error: {
    title: 'Terjadi Kesalahan',
    buttonClass: 'popup-button-error',
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  },
  warning: {
    title: 'Peringatan',
    buttonClass: 'popup-button-warning',
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  },
  info: {
    title: 'Informasi',
    buttonClass: 'popup-button-info',
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    )
  }
};

const NotificationModal = memo(({ 
  message, 
  onClose, 
  title, 
  variant = 'error',
  buttonText = 'Tutup' 
}) => {

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!message) return null;


  const currentConfig = VARIANT_CONFIG[variant] || VARIANT_CONFIG.error;
  const modalTitle = title || currentConfig.title;

  return (
    <div className="popup-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className={`popup-icon popup-icon-${variant}`}>
          {currentConfig.icon}
        </div>

        <h3 className="popup-title">{modalTitle}</h3>
        <p className="popup-message">{message}</p>

        <button 
          className={`popup-button ${currentConfig.buttonClass}`} 
          onClick={onClose}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
});

NotificationModal.displayName = 'NotificationModal';
export default NotificationModal;