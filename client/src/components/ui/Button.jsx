import React from 'react';

/**
 * Reusable Button component with accessible states, variants, and sizes.
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.loading=false] - When true, displays spinner and marks aria-busy
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.icon] - Leading icon element
 * @param {React.ReactNode} [props.iconRight] - Trailing icon element
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {React.ElementType} [props.as='button']
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  type = 'button',
  as: Component = 'button',
  className = '',
  children,
  ...rest
}) {
  const isButtonElement = Component === 'button';
  const isDisabled = disabled || loading;

  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const combinedClassName = ['btn', variantClass, sizeClass, className].filter(Boolean).join(' ');

  const elementProps = {
    className: combinedClassName,
    'aria-busy': loading ? 'true' : undefined,
    'aria-disabled': isDisabled ? 'true' : undefined,
    ...(isButtonElement
      ? { type, disabled: isDisabled }
      : { tabIndex: isDisabled ? -1 : 0, role: 'button' }),
    ...rest,
  };

  return (
    <Component {...elementProps}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {!loading && icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      {children}
      {!loading && iconRight && <span className="btn-icon-right" aria-hidden="true">{iconRight}</span>}
    </Component>
  );
}
