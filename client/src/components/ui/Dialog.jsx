import React, { useEffect, useId, useRef } from 'react';

/**
 * Accessible Dialog / Modal component with backdrop, keyboard escape dismiss,
 * and semantic ARIA labeling.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {function} props.onClose - Callback triggered on escape or close button click
 * @param {string} props.title - Dialog title (used for aria-labelledby)
 * @param {string} [props.description] - Dialog subtitle or description
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {React.ReactNode} [props.footer] - Action buttons rendered in dialog footer
 * @param {React.ReactNode} props.children - Modal content
 */
export default function Dialog({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
}) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descId = `${generatedId}-desc`;
  const panelRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose();
    }
  };

  const sizeClass = size !== 'md' ? `dialog-panel-${size}` : '';

  return (
    <div
      className="dialog-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        className={`dialog-panel ${sizeClass}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <h2 id={titleId} className="dialog-title">
              {title}
            </h2>
            {description && (
              <p id={descId} className="dialog-desc">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="dialog-body">{children}</div>

        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}
