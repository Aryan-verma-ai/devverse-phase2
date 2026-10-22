import React from 'react';

/**
 * Accessible LoadingState supporting both spinners and skeleton card place-holders.
 *
 * @param {Object} props
 * @param {string} [props.label='Loading...']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.skeleton=false] - When true, renders animated skeleton cards
 * @param {number} [props.count=3] - Number of skeleton cards to render
 * @param {string} [props.className='']
 */
export default function LoadingState({
  label = 'Loading...',
  size = 'md',
  skeleton = false,
  count = 3,
  className = '',
}) {
  if (skeleton) {
    return (
      <div
        className={`grid grid-3 ${className}`.trim()}
        role="status"
        aria-label={label}
        aria-live="polite"
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" aria-hidden="true" />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  const spinnerSizeClass = size !== 'md' ? `loading-spinner-${size}` : '';

  return (
    <div
      className={`loading-state ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className={`loading-spinner ${spinnerSizeClass}`.trim()} aria-hidden="true" />
      {label && <span className="loading-label">{label}</span>}
    </div>
  );
}
