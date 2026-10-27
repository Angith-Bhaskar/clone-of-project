import { useState } from 'react';

// A labelled password input with its own show/hide toggle and error line.
// The typed value is owned by the parent (controlled input); only "is it visible?"
// is local state, because nobody outside this field cares about it.
export default function PasswordField({ id, label, value, onChange, error }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="password-input-group">
        <input
          type={visible ? 'text' : 'password'}
          id={id}
          className={error ? 'invalid' : ''}
          placeholder="Enter your password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="toggle-password"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
        >
          &#128065;
        </button>
      </div>
      <p className="field-error">{error}</p>
    </>
  );
}
