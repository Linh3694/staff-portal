// controllers/familyController.js
const Family = require("../models/Family");

exports.createFamily = async (req, res) => {
  try {
    const newFamily = await Family.create(req.body);
    return res.status(201).json(newFamily);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllFamilies = async (req, res) => {
  try {
    const families = await Family.find().populate("students"); 
    return res.json(families);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getFamilyById = async (req, res) => {
  try {
    const { id } = req.params;
    const family = await Family.findById(id).populate("students");
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }
    return res.json(family);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.updateFamily = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Family.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Family not found" });
    }
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteFamily = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Family.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Family not found" });
    }
    return res.json({ message: "Family deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};