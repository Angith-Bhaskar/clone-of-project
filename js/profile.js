/* ==========================================================================
   profile.js
   Used by the profile page. (Booking History is now React: react-app/src/booking-history.)
   Profile loads/saves through GET/PUT /auth/me; booking history through
   a logged-in user.
   ========================================================================== */

/* ---- My Profile page ------------------------------------------------------- */

/** Loads the logged-in user's details (GET /auth/me) into the form, then wires edit/save/cancel (PUT /auth/me). */
async function setupProfileEditMode() {
  const form = document.getElementById("profileForm");
  if (!form) return;

  const inputs = form.querySelectorAll("input");
  const nameInput = document.getElementById("profileName");
  const emailInput = document.getElementById("profileEmail");
  const phoneInput = document.getElementById("profilePhone");
  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const changePhotoBtn = document.getElementById("changePhotoBtn");
  const saveNote = document.getElementById("profileSaveNote");

  // Show the details we already have from login straight away, then confirm with the server.
  function fillForm(user) {
    nameInput.value = user.name || "";
    emailInput.value = user.email || "";
    phoneInput.value = user.phone || "";
  }

  function showNote(message, isError) {
    saveNote.textContent = message;
    saveNote.style.color = isError ? "var(--color-primary)" : "";
    saveNote.hidden = false;
  }

  const cached = getCurrentUser();
  if (cached) fillForm(cached);
  editBtn.disabled = true;

  try {
    const user = await apiGet("/auth/me");
    saveCurrentUser(user);
    fillForm(user);
    editBtn.disabled = false;
  } catch (err) {
    console.error(err);
    showNote("Couldn't load your profile. Please refresh.", true);
    return;
  }

  let previousValues = [];

  function enterEditMode() {
    previousValues = [...inputs].map((input) => input.value);
    inputs.forEach((input) => (input.disabled = false));
    editBtn.hidden = true;
    saveBtn.hidden = false;
    cancelBtn.hidden = false;
    changePhotoBtn.hidden = false;
    saveNote.hidden = true;
  }

  function exitEditMode() {
    inputs.forEach((input) => (input.disabled = true));
    editBtn.hidden = false;
    saveBtn.hidden = true;
    cancelBtn.hidden = true;
    changePhotoBtn.hidden = true;
  }

  editBtn.addEventListener("click", enterEditMode);

  cancelBtn.addEventListener("click", () => {
    inputs.forEach((input, i) => (input.value = previousValues[i]));
    exitEditMode();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    try {
      const user = await apiPut("/auth/me", {
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
      });
      saveCurrentUser(user);
      fillForm(user);
      exitEditMode();
      showNote("Profile updated.", false);
    } catch (err) {
      // Stay in edit mode so the user can fix the problem (bad phone, email already used, ...).
      showNote(err.message, true);
    } finally {
      saveBtn.disabled = false;
    }
  });

  changePhotoBtn.addEventListener("click", () => {
    alert("Demo only: photo upload is not wired up to a backend.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Profile and booking history both belong to a logged-in user.
  if (!requireLogin()) return;

  setupProfileEditMode();
});
