import React, { useId } from 'react';

/**
 * Accessible FormField supporting labels, inputs, textareas, selects,
 * validation errors, helper descriptions, and busy states.
 *
 * @param {Object} props
 * @param {string} [props.id] - Element ID (auto-generated if omitted)
 * @param {string} [props.label] - Field label text
 * @param {boolean} [props.required=false]
 * @param {React.ReactNode} [props.helperText] - Supporting guidance under field
 * @param {React.ReactNode} [props.error] - Validation error message
 * @param {boolean} [props.busy=false] - Inline validation/loading indicator
 * @param {'input' | 'textarea' | 'select'} [props.as='input']
 * @param {string} [props.className='']
 * @param {React.ReactNode} [props.children] - Custom input or select options
 */
export default function FormField({
  id: explicitId,
  label,
  required = false,
  helperText,
  error,
  busy = false,
  as: Component = 'input',
  className = '',
  children,
  ...inputProps
}) {
  const generatedId = useId();
  const fieldId = explicitId || generatedId;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const hasError = Boolean(error);
  const describedBy = [
    helperText ? helperId : null,
    hasError ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  const controlClass = [
    Component === 'textarea' ? 'field-textarea' : Component === 'select' ? 'field-select' : 'field-input',
    hasError ? 'has-error' : '',
    inputProps.className || '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label htmlFor={fieldId} className="field-label">
          <span>
            {label}
            {required && <span className="field-required" aria-hidden="true">*</span>}
          </span>
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}

      <div className="field-control-wrap">
        {children && typeof children !== 'function' && Component === 'input' && !inputProps.type ? (
          children
        ) : (
          <Component
            id={fieldId}
            aria-required={required ? 'true' : undefined}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={describedBy}
            className={controlClass}
            {...inputProps}
          >
            {children}
          </Component>
        )}

        {busy && <span className="field-busy-indicator" aria-label="Validating field" />}
      </div>

      {helperText && !hasError && (
        <div id={helperId} className="field-helper">
          {helperText}
        </div>
      )}

      {hasError && (
        <div id={errorId} className="field-error-msg" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
