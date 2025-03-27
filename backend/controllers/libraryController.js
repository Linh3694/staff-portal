// controllers/libraryController.js
const { Library, DocumentType } = require("../models/LibraryModel");

// CREATE - Tạo mới Library
exports.createLibrary = async (req, res) => {
  try {
    const newLibrary = new Library(req.body);
    const savedLibrary = await newLibrary.save();
    return res.status(201).json(savedLibrary);
  } catch (error) {
    console.error("Error creating library:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// READ - Lấy danh sách tất cả Library
exports.getAllLibraries = async (req, res) => {
  try {
    const libraries = await Library.find();
    return res.status(200).json(libraries);
  } catch (error) {
    console.error("Error getting libraries:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// READ - Lấy chi tiết 1 Library theo ID
exports.getLibraryById = async (req, res) => {
  try {
    const { id } = req.params;
    const library = await Library.findById(id);
    if (!library) {
      return res.status(404).json({ error: "Library not found" });
    }
    return res.status(200).json(library);
  } catch (error) {
    console.error("Error getting library by ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// UPDATE - Cập nhật Library theo ID
exports.updateLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLibrary = await Library.findByIdAndUpdate(id, req.body, {
      new: true, // trả về document đã được cập nhật
    });
    if (!updatedLibrary) {
      return res.status(404).json({ error: "Library not found" });
    }
    return res.status(200).json(updatedLibrary);
  } catch (error) {
    console.error("Error updating library:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE - Xóa Library theo ID
exports.deleteLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLibrary = await Library.findByIdAndDelete(id);
    if (!deletedLibrary) {
      return res.status(404).json({ error: "Library not found" });
    }
    return res.status(200).json({ message: "Library deleted successfully" });
  } catch (error) {
    console.error("Error deleting library:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// --------------------------------------------

// Document Type Controllers
exports.getAllDocumentTypes = async (req, res) => {
  try {
    const types = await DocumentType.find();
    return res.status(200).json(types);
  } catch (error) {
    console.error("Error fetching document types:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createDocumentType = async (req, res) => {
  try {
    const { name, code } = req.body;

    // Kiểm tra trùng mã trước khi tạo mới
    const existing = await DocumentType.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: "Mã này đã tồn tại." });
    }

    const newType = new DocumentType({ name, code });
    await newType.save();
    return res.status(201).json(newType);
  } catch (error) {
    console.error("Error creating document type:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    await DocumentType.findByIdAndDelete(id);
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting document type:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// --------------------------------------------
