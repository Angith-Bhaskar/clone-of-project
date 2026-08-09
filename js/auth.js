/* ==========================================================================
   auth.js
   Shared across login, signup, forgot-password.
   Currently implements: Login page (tab switching, phone/email/password
   validation, password visibility toggle). All validation is client-side
   only — there is no real authentication backend.
   ========================================================================== */

/* ---- Validation helpers -------------------------------------------------- */

/** 10-digit Indian mobile number, no leading zero. */
function isValidPhone(value) {
  return /^[6-9]\d{9}$/.test(value.trim());
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Shows/clears an inline error message under a field. */
function setFieldError(errorEl, inputEl, message) {
  errorEl.textContent = message;
  inputEl.classList.toggle("invalid", Boolean(message));
}

/* ---- Login page ----------------------------------------------------------- */

function setupLoginTabs() {
  const phoneTabBtn = document.getElementById("phoneTabBtn");
  const emailTabBtn = document.getElementById("emailTabBtn");
  const phoneForm = document.getElementById("phoneLoginForm");
  const emailForm = document.getElementById("emailLoginForm");
  if (!phoneTabBtn || !emailTabBtn) return;

  function activate(tab) {
    const showPhone = tab === "phone";
    phoneTabBtn.classList.toggle("active", showPhone);
    emailTabBtn.classList.toggle("active", !showPhone);
    phoneTabBtn.setAttribute("aria-selected", showPhone);
    emailTabBtn.setAttribute("aria-selected", !showPhone);
    phoneForm.hidden = !showPhone;
    emailForm.hidden = showPhone;
  }

  phoneTabBtn.addEventListener("click", () => activate("phone"));
  emailTabBtn.addEventListener("click", () => activate("email"));
}

function setupPhoneLoginForm() {
  const form = document.getElementById("phoneLoginForm");
  if (!form) return;

  const phoneInput = document.getElementById("phoneInput");
  const phoneError = document.getElementById("phoneError");

  // Keep the field numeric-only as the user types.
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!isValidPhone(phoneInput.value)) {
      setFieldError(phoneError, phoneInput, "Enter a valid 10-digit mobile number.");
      return;
    }

    setFieldError(phoneError, phoneInput, "");
    alert("Demo only: an OTP would be sent to +91 " + phoneInput.value + ".");
  });
}

function setupEmailLoginForm() {
  const form = document.getElementById("emailLoginForm");
  if (!form) return;

  const emailInput = document.getElementById("emailInput");
  const emailError = document.getElementById("emailError");
  const passwordInput = document.getElementById("passwordInput");
  const passwordError = document.getElementById("passwordError");
  const toggleBtn = document.getElementById("togglePassword");

  toggleBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!isValidEmail(emailInput.value)) {
      setFieldError(emailError, emailInput, "Enter a valid email address.");
      valid = false;
    } else {
      setFieldError(emailError, emailInput, "");
    }

    if (passwordInput.value.length < 6) {
      setFieldError(passwordError, passwordInput, "Password must be at least 6 characters.");
      valid = false;
    } else {
      setFieldError(passwordError, passwordInput, "");
    }

    if (valid) {
      alert("Demo only: no real authentication is performed.");
    }
  });
}

function setupGoogleLoginButton() {
  const btn = document.getElementById("googleLoginBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    alert("Demo only: Google sign-in is not integrated.");
  });
}

/* ---- Sign Up page ---------------------------------------------------------- */

/** Wires a show/hide toggle button to the password input next to it. */
function setupPasswordToggle(toggleId, inputId) {
  const toggleBtn = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if (!toggleBtn || !input) return;

  toggleBtn.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
}

function setupSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const nameInput = document.getElementById("nameInput");
  const nameError = document.getElementById("nameError");
  const emailInput = document.getElementById("signupEmailInput");
  const emailError = document.getElementById("signupEmailError");
  const phoneInput = document.getElementById("signupPhoneInput");
  const phoneError = document.getElementById("signupPhoneError");
  const passwordInput = document.getElementById("signupPasswordInput");
  const passwordError = document.getElementById("signupPasswordError");
  const confirmInput = document.getElementById("confirmPasswordInput");
  const confirmError = document.getElementById("confirmPasswordError");

  // Keep the phone field numeric-only as the user types.
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (nameInput.value.trim().length < 2) {
      setFieldError(nameError, nameInput, "Enter your full name.");
      valid = false;
    } else {
      setFieldError(nameError, nameInput, "");
    }

    if (!isValidEmail(emailInput.value)) {
      setFieldError(emailError, emailInput, "Enter a valid email address.");
      valid = false;
    } else {
      setFieldError(emailError, emailInput, "");
    }

    if (!isValidPhone(phoneInput.value)) {
      setFieldError(phoneError, phoneInput, "Enter a valid 10-digit mobile number.");
      valid = false;
    } else {
      setFieldError(phoneError, phoneInput, "");
    }

    if (passwordInput.value.length < 6) {
      setFieldError(passwordError, passwordInput, "Password must be at least 6 characters.");
      valid = false;
    } else {
      setFieldError(passwordError, passwordInput, "");
    }

    if (confirmInput.value !== passwordInput.value || confirmInput.value === "") {
      setFieldError(confirmError, confirmInput, "Passwords do not match.");
      valid = false;
    } else {
      setFieldError(confirmError, confirmInput, "");
    }

    if (valid) {
      alert("Demo only: no account is actually created.");
    }
  });
}

function setupGoogleSignupButton() {
  const btn = document.getElementById("googleSignupBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    alert("Demo only: Google sign-in is not integrated.");
  });
}

/* ---- Forgot Password page --------------------------------------------------- */

function setupForgotPasswordForm() {
  const form = document.getElementById("forgotPasswordForm");
  if (!form) return;

  const emailInput = document.getElementById("forgotEmailInput");
  const emailError = document.getElementById("forgotEmailError");
  const successMessage = document.getElementById("forgotSuccessMessage");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!isValidEmail(emailInput.value)) {
      setFieldError(emailError, emailInput, "Enter a valid email address.");
      successMessage.hidden = true;
      return;
    }

    setFieldError(emailError, emailInput, "");
    successMessage.hidden = false;
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLoginTabs();
  setupPhoneLoginForm();
  setupEmailLoginForm();
  setupGoogleLoginButton();

  setupSignupForm();
  setupGoogleSignupButton();
  setupPasswordToggle("toggleSignupPassword", "signupPasswordInput");
  setupPasswordToggle("toggleConfirmPassword", "confirmPasswordInput");

  setupForgotPasswordForm();
});
