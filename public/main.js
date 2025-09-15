// public/main.js

// --- Mobile menu toggle ---
const menuBtn = document.getElementById("menu-btn");
const nav = document.getElementById("nav");

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

// --- Auto-hide alerts ---
document.querySelectorAll(".alert").forEach((alert) => {
  setTimeout(() => {
    alert.style.display = "none";
  }, 4000);
});

// --- Password visibility toggle ---
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.querySelector(btn.dataset.target);
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "🙈";
    } else {
      input.type = "password";
      btn.textContent = "👁";
    }
  });
});
