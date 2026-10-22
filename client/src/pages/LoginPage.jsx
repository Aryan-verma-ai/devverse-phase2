/**
 * DEVVERSE — Sign In Page
 *
 * Grounded in Phase 1 login.html.
 * Authenticates user credentials via AuthContext and real server session.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import StatusMessage from '../components/ui/StatusMessage';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/explore';

  const [form, setForm] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // If already logged in, redirect immediately
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  function validate() {
    const errs = {};
    if (!form.emailOrUsername.trim()) {
      errs.emailOrUsername = 'Please enter your username or email address.';
    }
    if (!form.password) {
      errs.password = 'Please enter your password.';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await login({
        emailOrUsername: form.emailOrUsername.trim(),
        password: form.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 20px 80px' }}>
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg, 0 16px 40px rgba(0,0,0,0.3))',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--accent)',
              marginBottom: '6px',
            }}
          >
            Welcome Back
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
              margin: '0 0 8px',
            }}
          >
            Sign in to <span style={{ color: 'var(--accent)' }}>DevVerse</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Enter your credentials to continue building and collaborating.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div style={{ marginBottom: '20px' }}>
            <StatusMessage
              type="error"
              message={serverError}
              onDismiss={() => setServerError(null)}
            />
          </div>
        )}

        {/* Redirect Notice if routed from a protected page */}
        {location.state?.from && (
          <div style={{ marginBottom: '20px' }}>
            <StatusMessage
              type="info"
              message="Please sign in to access that page."
            />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="login-identifier"
            label="Username or Email"
            required
            error={errors.emailOrUsername}
          >
            <input
              id="login-identifier"
              type="text"
              className={`field-input ${errors.emailOrUsername ? 'has-error' : ''}`}
              placeholder="e.g. alex_dev or alex@example.com"
              autoComplete="username"
              value={form.emailOrUsername}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, emailOrUsername: e.target.value }));
                if (errors.emailOrUsername) setErrors((prev) => ({ ...prev, emailOrUsername: null }));
              }}
            />
          </FormField>

          <FormField
            id="login-password"
            label="Password"
            required
            error={errors.password}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`field-input ${errors.password ? 'has-error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, password: e.target.value }));
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </FormField>

          <div style={{ marginTop: '28px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Footer Links */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
            fontSize: '13.5px',
            color: 'var(--text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            state={location.state}
            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
