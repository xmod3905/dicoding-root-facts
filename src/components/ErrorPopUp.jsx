import React, { memo, useEffect } from 'react';

const ErrorPopUp = memo(({ message, onClose }) => {

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h3 className="popup-title">Terjadi Kesalahan</h3>
        <p className="popup-message">{message}</p>

        <button className="popup-button" onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  );
});

ErrorPopUp.displayName = 'ErrorPopUp';
export default ErrorPopUp;