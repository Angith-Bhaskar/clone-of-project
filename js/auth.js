/* ==========================================================================
   auth.js
   Shared across login, signup, forgot-password.
   Each form validates its fields in the browser first (fast feedback), then
   calls the real API (POST /auth/login, /auth/register, /auth/forgot-password,
   /auth/reset-password). The server validates everything again; the browser
   checks are only a convenience. Loaded after js/api.js.
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
  if (inputEl) inputEl.classList.toggle("invalid", Boolean(message));
}

/* ---- Shared login/signup plumbing ------------------------------------------ */

/**
 * Where to go after logging in: the ?next= page (set by requireLogin) or the
 * home page. Only plain same-site page names are allowed, so a crafted link
 * can't bounce someone to another website.
 */
function getPostLoginDestination() {
  const next = getQueryParam("next");
  return /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(next) ? next : "index.html";
}

/** Stores the token + user the server returned, then moves on. */
function finishLogin(data) {
  saveSession(data.token, data.user);
  window.location.href = getPostLoginDestination();
}

/** Runs an async submit action with the button disabled and any server error shown under the form. */
async function submitWithFeedback(form, errorEl, action) {
  const button = form.querySelector('button[type="submit"]');
  const originalLabel = button.textContent;
  errorEl.textContent = "";
  button.disabled = true;
  button.textContent = "Please wait…";
  try {
    await action();
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong. Please try again.";
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

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
  const passwordInput = document.getElementById("phonePasswordInput");
  const passwordError = document.getElementById("phonePasswordError");
  const formError = document.getElementById("phoneFormError");

  // Keep the field numeric-only as the user types.
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!isValidPhone(phoneInput.value)) {
      setFieldError(phoneError, phoneInput, "Enter a valid 10-digit mobile number.");
      valid = false;
    } else {
      setFieldError(phoneError, phoneInput, "");
    }

    if (!passwordInput.value) {
      setFieldError(passwordError, passwordInput, "Enter your password.");
      valid = false;
    } else {
      setFieldError(passwordError, passwordInput, "");
    }

    if (!valid) return;

    submitWithFeedback(form, formError, async () => {
      finishLogin(await apiPost("/auth/login", {
        identifier: phoneInput.value.trim(),
        password: passwordInput.value,
      }));
    });
  });
}

function setupEmailLoginForm() {
  const form = document.getElementById("emailLoginForm");
  if (!form) return;

  const emailInput = document.getElementById("emailInput");
  const emailError = document.getElementById("emailError");
  const passwordInput = document.getElementById("passwordInput");
  const passwordError = document.getElementById("passwordError");
  const formError = document.getElementById("emailFormError");

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

    if (!valid) return;

    submitWithFeedback(form, formError, async () => {
      finishLogin(await apiPost("/auth/login", {
        identifier: emailInput.value.trim(),
        password: passwordInput.value,
      }));
    });
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
  const formError = document.getElementById("signupFormError");

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

    if (!valid) return;

    submitWithFeedback(form, formError, async () => {
      // Registering also logs the new user in (the server returns a token).
      finishLogin(await apiPost("/auth/register", {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        password: passwordInput.value,
      }));
    });
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

/**
 * Step 1: ask the server for a reset token for this email.
 * Step 2: show the "new password" form and send token + new password.
 * A real site would email the token as a link; with no email service here, the
 * server returns it directly (demo mode).
 */
function setupForgotPasswordForm() {
  const form = document.getElementById("forgotPasswordForm");
  if (!form) return;

  const emailInput = document.getElementById("forgotEmailInput");
  const emailError = document.getElementById("forgotEmailError");
  const successMessage = document.getElementById("forgotSuccessMessage");
  const resetForm = document.getElementById("resetPasswordForm");
  const resetInput = document.getElementById("resetPasswordInput");
  const resetError = document.getElementById("resetPasswordError");

  let resetToken = null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!isValidEmail(emailInput.value)) {
      setFieldError(emailError, emailInput, "Enter a valid email address.");
      successMessage.hidden = true;
      return;
    }

    setFieldError(emailError, emailInput, "");
    submitWithFeedback(form, emailError, async () => {
      const data = await apiPost("/auth/forgot-password", { email: emailInput.value.trim() });
      successMessage.textContent = data.message;
      successMessage.hidden = false;
      form.querySelector('button[type="submit"]').disabled = false;
      form.querySelector('button[type="submit"]').textContent = "Send Reset Link";

      if (data.resetToken) {
        resetToken = data.resetToken;
        form.hidden = true;
        resetForm.hidden = false;
      }
    });
  });

  resetForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (resetInput.value.length < 6) {
      setFieldError(resetError, resetInput, "Password must be at least 6 characters.");
      return;
    }

    setFieldError(resetError, resetInput, "");
    submitWithFeedback(resetForm, resetError, async () => {
      const data = await apiPost("/auth/reset-password", { token: resetToken, password: resetInput.value });
      successMessage.textContent = `${data.message} Redirecting to sign in…`;
      successMessage.hidden = false;
      resetForm.hidden = true;
      setTimeout(() => { window.location.href = "login.html"; }, 1500);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLoginTabs();
  setupPhoneLoginForm();
  setupEmailLoginForm();
  setupGoogleLoginButton();
  setupPasswordToggle("togglePassword", "passwordInput");
  setupPasswordToggle("togglePhonePassword", "phonePasswordInput");

  setupSignupForm();
  setupGoogleSignupButton();
  setupPasswordToggle("toggleSignupPassword", "signupPasswordInput");
  setupPasswordToggle("toggleConfirmPassword", "confirmPasswordInput");

  setupForgotPasswordForm();
});
