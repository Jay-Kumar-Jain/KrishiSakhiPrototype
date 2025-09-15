// public/form-validation.js

function validateSignupForm() {
  const phone = document.getElementById("phonenumber").value.trim();
  const aadhar = document.getElementById("aadhar").value.trim();
  const password = document.getElementById("password").value.trim();
  const cpassword = document.getElementById("cpassword").value.trim();

  if (!/^\d{10}$/.test(phone)) {
    alert("❌ Phone number must be 10 digits");
    return false;
  }
  if (!/^\d{12}$/.test(aadhar)) {
    alert("❌ Aadhar number must be 12 digits");
    return false;
  }
  if (password.length < 6) {
    alert("❌ Password must be at least 6 characters");
    return false;
  }
  if (password !== cpassword) {
    alert("❌ Passwords do not match");
    return false;
  }
  return true;
}
