import { useState } from 'react';
import PasswordField from './PasswordField';
import { apiPost, getQueryParam, saveSession } from '../lib/toolkit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // 10-digit Indian mobile number, no leading zero

/** Browser-side checks for fast feedback. The server validates everything again. */
function validate(tab, identifier, password) {
  const errors = {};
  if (tab === 'phone') {
    if (!PHONE_RE.test(identifier.trim())) errors.identifier = 'Enter a valid 10-digit mobile number.';
  } else if (!EMAIL_RE.test(identifier.trim())) {
    errors.identifier = 'Enter a valid email address.';
  }
  if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  return errors;
}

/**
 * Where to go after logging in: the ?next= page (set by requireLogin) or the home page.
 * Only plain same-site page names are allowed, so a crafted link can't bounce someone
 * to another website.
 */
function getPostLoginDestination() {
  const next = getQueryParam('next');
  return /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(next) ? next : 'index.html';
}

export default function LoginPage() {
  // Every piece of the form lives in state, so the screen is always a picture of this data.
  const [tab, setTab] = useState('phone'); // 'phone' | 'email'
  const [identifier, setIdentifier] = useState(''); // the phone number or the email, depending on the tab
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // { identifier?, password? }: messages under each field
  const [formError, setFormError] = useState(''); // message from the server, e.g. wrong password
  const [submitting, setSubmitting] = useState(false);

  function switchTab(nextTab) {
    if (nextTab === tab) return;
    setTab(nextTab);
    setIdentifier(''); // a phone number makes no sense as an email, and vice versa
    setErrors({});
    setFormError('');
  }

  function handleIdentifierChange(value) {
    // Keep the phone field numeric-only as the user types.
    setIdentifier(tab === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value);
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's own form submit / page reload; React handles it

    const found = validate(tab, identifier, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setFormError('');
    setSubmitting(true);
    try {
      const data = await apiPost('/auth/login', { identifier: identifier.trim(), password });
      saveSession(data.token, data.user);
      window.location.href = getPostLoginDestination();
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const isPhone = tab === 'phone';

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">Book tickets for movies, events, plays and more.</p>

        {/* Google sign-in (UI only, no real OAuth) */}
        <button
          type="button"
          className="btn btn-outline btn-block google-btn"
          onClick={() => alert('Demo only: Google sign-in is not integrated.')}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="" width="18" height="18" />
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* Tabs to switch between phone / email login */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab${isPhone ? ' active' : ''}`}
            role="tab"
            aria-selected={isPhone}
            onClick={() => switchTab('phone')}
          >
            Phone
          </button>
          <button
            type="button"
            className={`auth-tab${!isPhone ? ' active' : ''}`}
            role="tab"
            aria-selected={!isPhone}
            onClick={() => switchTab('email')}
          >
            Email
          </button>
        </div>

        <form className="auth-form" id="loginForm" onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="identifierInput">
            {isPhone ? 'Phone Number' : 'Email Address'}
          </label>

          {isPhone ? (
            <div className="phone-input-group">
              <span className="phone-prefix">+91</span>
              <input
                type="tel"
                id="identifierInput"
                className={errors.identifier ? 'invalid' : ''}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                value={identifier}
                onChange={(e) => handleIdentifierChange(e.target.value)}
              />
            </div>
          ) : (
            <input
              type="email"
              id="identifierInput"
              className={errors.identifier ? 'invalid' : ''}
              placeholder="you@example.com"
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
            />
          )}
          <p className="field-error">{errors.identifier}</p>

          <PasswordField id="passwordInput" label="Password" value={password} onChange={setPassword} error={errors.password} />

          <a href="forgot-password.html" className="auth-link forgot-link">Forgot Password?</a>

          <p className="field-error" id="loginFormError">{formError}</p>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        <p className="auth-footer-text">
          New to BookMyShow? <a href="signup.html" className="auth-link">Sign Up</a>
        </p>
      </div>
    </main>
  );
}
