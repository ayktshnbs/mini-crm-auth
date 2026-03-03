const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const name = (req.body?.name ?? "").trim();
  const email = (req.body?.email ?? "").trim().toLowerCase();
  const password = req.body?.password ?? "";

  if (!name || !email || password.length < 6) {
    return res.status(400).json({ message: "name/email gerekli, password en az 6 karakter" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Bu email zaten kayıtlı" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  const token = jwt.sign(
    { userId: user._id.toString(), email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

router.post("/login", async (req, res) => {
  const email = (req.body?.email ?? "").trim().toLowerCase();
  const password = req.body?.password ?? "";

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Email veya şifre hatalı" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Email veya şifre hatalı" });

  const token = jwt.sign(
    { userId: user._id.toString(), email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

module.exports = router;