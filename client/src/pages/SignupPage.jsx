/**
 * DEVVERSE — Registration Page
 *
 * Grounded in Phase 1 signup.html.
 * Registers a new user account via AuthContext and real server session.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import StatusMessage from '../components/ui/StatusMessage';

const USERNAME_REGEX = /^[a-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/explore';

  const [form, setForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    bio: '',
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
    const trimmedUsername = form.username.trim().toLowerCase();
    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedDisplayName = form.displayName.trim();

    if (!trimmedUsername) {
      errs.username = 'Username is required.';
    } else if (trimmedUsername.length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    } else if (trimmedUsername.length > 30) {
      errs.username = 'Username cannot exceed 30 characters.';
    } else if (!USERNAME_REGEX.test(trimmedUsername)) {
      errs.username = 'Only lowercase letters, numbers, underscores, and hyphens.';
    }

    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!trimmedDisplayName) {
      errs.displayName = 'Display name is required.';
    } else if (trimmedDisplayName.length > 60) {
      errs.displayName = 'Display name cannot exceed 60 characters.';
    }

    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 7) {
      errs.password = 'Password must be at least 7 characters long.';
    } else {
      const hasUpper = /[A-Z]/.test(form.password);
      const hasNum = /[0-9]/.test(form.password);
      const hasSpecial = /[^A-Za-z0-9]/.test(form.password);
      if (!hasUpper || !hasNum || !hasSpecial) {
        errs.password = 'Must contain uppercase, number, and special character.';
      }
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
      await signup({
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        password: form.password,
        bio: form.bio.trim(),
      });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 20px 80px' }}>
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
            Start Your Journey
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
            Join <span style={{ color: 'var(--accent)' }}>DevVerse</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Create an account to showcase projects, participate in hackathons, and collaborate.
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

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="signup-username"
            label="Username"
            required
            hint="Lowercase letters, numbers, hyphens, and underscores."
            error={errors.username}
          >
            <input
              id="signup-username"
              type="text"
              className={`field-input ${errors.username ? 'has-error' : ''}`}
              placeholder="e.g. sarah_connor"
              autoComplete="username"
              value={form.username}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, username: e.target.value }));
                if (errors.username) setErrors((prev) => ({ ...prev, username: null }));
              }}
            />
          </FormField>

          <FormField
            id="signup-email"
            label="Email Address"
            required
            error={errors.email}
          >
            <input
              id="signup-email"
              type="email"
              className={`field-input ${errors.email ? 'has-error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
            />
          </FormField>

          <FormField
            id="signup-displayName"
            label="Display Name"
            required
            error={errors.displayName}
          >
            <input
              id="signup-displayName"
              type="text"
              className={`field-input ${errors.displayName ? 'has-error' : ''}`}
              placeholder="e.g. Sarah Connor"
              value={form.displayName}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, displayName: e.target.value }));
                if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: null }));
              }}
            />
          </FormField>

          <FormField
            id="signup-password"
            label="Password"
            required
            hint="At least 7 characters with 1 uppercase, 1 number, and 1 symbol."
            error={errors.password}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className={`field-input ${errors.password ? 'has-error' : ''}`}
                placeholder="Choose a strong password"
                autoComplete="new-password"
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

          <FormField
            id="signup-bio"
            label="Brief Bio"
            hint="Optional short description of what you love building."
          >
            <textarea
              id="signup-bio"
              className="field-textarea"
              placeholder="e.g. Distributed systems engineer building open-source developer tooling."
              rows={2}
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </FormField>

          <div style={{ marginTop: '28px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Create Account
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
          Already have an account?{' '}
          <Link
            to="/login"
            state={location.state}
            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
