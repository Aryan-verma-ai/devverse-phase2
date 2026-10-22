import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

/**
 * EmptyState component for zero-result states, initial empty lists, or filtered outcomes.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Visual icon or illustration
 * @param {string} [props.title='No items found']
 * @param {string} [props.description] - Helpful guidance or explanation
 * @param {string} [props.actionLabel] - CTA button text
 * @param {function} [props.onAction] - CTA button click handler
 * @param {string} [props.actionLink] - Target route if CTA is a navigation link
 * @param {React.ReactNode} [props.children] - Custom extra controls
 * @param {string} [props.className='']
 */
export default function EmptyState({
  icon,
  title = 'No items found',
  description,
  actionLabel,
  onAction,
  actionLink,
  children,
  className = '',
}) {
  const defaultIcon = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );

  return (
    <div className={`empty-state glass ${className}`.trim()} role="region" aria-label={title}>
      <div className="empty-state-icon">
        {icon || defaultIcon}
      </div>

      <h3 className="empty-state-title">{title}</h3>

      {description && <p className="empty-state-desc">{description}</p>}

      {actionLabel && actionLink && (
        <Link to={actionLink} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}

      {actionLabel && !actionLink && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      {children}
    </div>
  );
}
