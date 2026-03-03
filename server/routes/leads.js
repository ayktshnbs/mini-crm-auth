const express = require("express");
const Lead = require("../models/LeadTemp");
const auth = require("../middleware/auth");

const router = express.Router();

// Tüm leads endpoint’lerini koru
router.use(auth);

// GET /leads  -> sadece kendi lead’leri
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find({ owner: req.user.userId }).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: "Leads getirilemedi" });
  }
});

// POST /leads -> lead oluştur (owner otomatik)
router.post("/", async (req, res) => {
  try {
    const name = (req.body?.name ?? "").trim();
    const email = (req.body?.email ?? "").trim();

    if (!name || !email) {
      return res.status(400).json({ message: "name ve email gerekli" });
    }

    const newLead = await Lead.create({ name, email, owner: req.user.userId });
    res.status(201).json(newLead);
  } catch (err) {
    res.status(500).json({ message: "Lead oluşturulamadı" });
  }
});

// PUT /leads/:id -> sadece kendi lead’ini güncelle
router.put("/:id", async (req, res) => {
  try {
    const status = req.body?.status;

    const updated = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { ...(status !== undefined ? { status } : {}) },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Lead bulunamadı" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Lead güncellenemedi" });
  }
});

// DELETE /
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Lead.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    if (!deleted) return res.status(404).json({ message: "Lead bulunamadı" });
    res.json({ message: "Silindi" });
  } catch (err) {
    res.status(500).json({ message: "Lead silinemedi" });
  }
});

module.exports = router;