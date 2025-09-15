// server.js
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");
const { User, UserLand } = require("./models"); // renamed mongodb.js -> models.js

const app = express();
const PORT = 3000;

// ✅ Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/hackathon", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ✅ Session middleware
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // static files: CSS, JS, imgs

// ✅ Views (Handlebars)
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "templates"));

// --- 🔐 Middleware ---
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

// --- 🌐 Routes ---
app.get("/", (req, res) => res.redirect("/login"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));
app.get("/home", requireLogin, async (req, res) => {   // ✅ unified to /home
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login");
    const lands = await UserLand.find({ userId: user._id });
    res.render("home", { user, lands });
  } catch (err) {
    console.error("❌ Home page error:", err);
    res.status(500).send("Server error");
  }
});

// --- Signup ---
app.post("/signup", async (req, res) => {
  try {
    const { name, phonenumber, dob, aadhar, password, cpassword } = req.body;

    if (!/^\d{10}$/.test(phonenumber)) {
      return res.status(400).render("signup", { error: "❌ Mobile number must be 10 digits" });
    }
    if (!/^\d{12}$/.test(aadhar)) {
      return res.status(400).render("signup", { error: "❌ Aadhar number must be 12 digits" });
    }
    if (password.length < 6) {
      return res.status(400).render("signup", { error: "❌ Password must be at least 6 characters" });
    }
    if (password !== cpassword) {
      return res.status(400).render("signup", { error: "❌ Passwords do not match" });
    }

    const newUser = new User({
      name,
      phonenumber,
      dob: new Date(dob),
      aadhar,
      password,
    });

    await newUser.save();
    req.session.userId = newUser._id;
    res.status(201).redirect("/home");   // ✅ matches corrected route
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(400).render("signup", { error: "⚠️ Something went wrong" });
  }
});

// --- Login ---
app.post("/login", async (req, res) => {
  try {
    const { phonenumber, password } = req.body;
    const user = await User.findOne({ phonenumber });

    if (!user) {
      return res.status(400).render("login", { error: "❌ User not found" });
    }
    if (user.password !== password) {
      return res.status(400).render("login", { error: "❌ Invalid password" });
    }

    req.session.userId = user._id;
    res.redirect("/home");   // ✅ matches corrected route
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(400).render("login", { error: "⚠️ Something went wrong" });
  }
});

// --- Land Profile ---
app.get("/land-profile", requireLogin, (req, res) => res.render("land-profile"));
app.post("/land-profile", requireLogin, async (req, res) => {
  try {
    const { landLocation, landSize, landType, waterSource, cropDetails } = req.body;
    if (!landLocation || landLocation.trim().length < 2) {
      return res.status(400).render("land-profile", { error: "❌ Land location required" });
    }
    if (!landSize || isNaN(landSize) || landSize <= 0) {
      return res.status(400).render("land-profile", { error: "❌ Land size invalid" });
    }
    if (!landType) {
      return res.status(400).render("land-profile", { error: "❌ Land type required" });
    }

    const newLand = new UserLand({
      userId: req.session.userId,
      landLocation,
      landSize,
      landType,
      waterSource,
      cropDetails,
    });

    await newLand.save();
    res.status(201).redirect("/home");   // ✅ matches corrected route
  } catch (err) {
    console.error("❌ Land error:", err);
    res.status(400).render("land-profile", { error: "⚠️ Something went wrong" });
  }
});

// --- Profile ---
app.get("/profile/:id", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const landDetails = await UserLand.find({ userId: req.params.id });
    if (!user) return res.status(404).send("User not found");
    res.render("profile", { user, landDetails });
  } catch (err) {
    console.error("❌ Profile error:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Fallback: /profile → own profile
app.get("/profile", requireLogin, (req, res) => {
  res.redirect(`/profile/${req.session.userId}`);
});

// --- Logout ---
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// --- 🌐 Static Frontend Pages (market, weather, chatbot, etc.) ---
const pages = [
  "chatbot",
  "aboutus",
  "reminder",
  "settings",
  "crop-details",
  "farmer-profile",
  "schemes",
  "activity-tracker",
  "market",
  "weather",
  "land-profile",
];

pages.forEach((p) => {
  app.get("/" + p.replace(".html", ""), (req, res) => {
    res.render(p);   // ✅ render .hbs instead of sending .html
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
