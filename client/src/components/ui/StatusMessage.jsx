import React from 'react';

const ICONS = {
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

/**
 * Accessible inline alert for feedback messages (errors, success notices, warnings).
 *
 * @param {Object} props
 * @param {'error' | 'success' | 'warning' | 'info'} [props.type='info']
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.message]
 * @param {function} [props.onDismiss] - Optional callback to render dismiss button
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className='']
 */
export default function StatusMessage({
  type = 'info',
  title,
  message,
  onDismiss,
  children,
  className = '',
}) {
  const isUrgent = type === 'error' || type === 'warning';
  const role = isUrgent ? 'alert' : 'status';

  return (
    <div
      className={`status-msg status-msg-${type} ${className}`.trim()}
      role={role}
      aria-live={isUrgent ? 'assertive' : 'polite'}
    >
      <div className="status-msg-icon">
        {ICONS[type] || ICONS.info}
      </div>

      <div className="status-msg-content">
        {title && <div className="status-msg-title">{title}</div>}
        {message && <div>{message}</div>}
        {children}
      </div>

      {onDismiss && (
        <button
          type="button"
          className="status-msg-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          title="Dismiss"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Convenient alias specifically for validation and network errors.
 */
export function ErrorMessage({ title, message, ...rest }) {
  return <StatusMessage type="error" title={title} message={message} {...rest} />;
}
