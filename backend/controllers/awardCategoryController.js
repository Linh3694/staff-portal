// backend/controllers/awardCategoryController.js
const AwardCategory = require("../models/AwardCategory");

// Tạo mới AwardCategory
exports.createCategory = async (req, res) => {
  try {
    const { name, description, coverImage, subAwards } = req.body;
    const newCategory = await AwardCategory.create({
      name,
      description,
      coverImage,
      subAwards,
    });
    return res.status(201).json(newCategory);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Lấy tất cả AwardCategory
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await AwardCategory.find();
    return res.json(categories);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Lấy 1 AwardCategory theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await AwardCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Không tìm thấy AwardCategory" });
    return res.json(category);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Cập nhật AwardCategory
exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await AwardCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCategory) return res.status(404).json({ message: "Không tìm thấy AwardCategory" });
    return res.json(updatedCategory);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Xoá AwardCategory
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await AwardCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy AwardCategory" });
    return res.json({ message: "Xoá AwardCategory thành công" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};