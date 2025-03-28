// controllers/libraryController.js
const { Library, DocumentType, SeriesName, SpecialCode } = require("../models/LibraryModel");

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

exports.updateDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDocType = await DocumentType.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedDocType) {
      return res.status(404).json({ error: "Document Type not found" });
    }
    return res.status(200).json(updatedDocType);
  } catch (error) {
    console.error("Error updating document type:", error);
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
// SeriesName Controllers

exports.getAllSeriesNames = async (req, res) => {
  try {
    const seriesNames = await SeriesName.find();
    return res.status(200).json(seriesNames);
  } catch (error) {
    console.error("Error fetching series names:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createSeriesName = async (req, res) => {
  try {
    const { name, code } = req.body;
    // Kiểm tra trùng mã
    const existing = await SeriesName.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: "Mã này đã tồn tại." });
    }
    const newSeries = new SeriesName({ name, code });
    await newSeries.save();
    return res.status(201).json(newSeries);
  } catch (error) {
    console.error("Error creating series name:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateSeriesName = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSeries = await SeriesName.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedSeries) {
      return res.status(404).json({ error: "Series not found" });
    }
    return res.status(200).json(updatedSeries);
  } catch (error) {
    console.error("Error updating series name:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteSeriesName = async (req, res) => {
  try {
    const { id } = req.params;
    await SeriesName.findByIdAndDelete(id);
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting series name:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// -------------------- Special Code Controllers -------------------- //

exports.getAllSpecialCodes = async (req, res) => {
  try {
    const codes = await SpecialCode.find();
    return res.status(200).json(codes);
  } catch (error) {
    console.error("Error fetching special codes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createSpecialCode = async (req, res) => {
  try {
    const { code, name } = req.body;
    const existing = await SpecialCode.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: "Mã này đã tồn tại." });
    }
    const newCode = new SpecialCode({ code, name });
    await newCode.save();
    return res.status(201).json(newCode);
  } catch (error) {
    console.error("Error creating special code:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.updateSpecialCode = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCode = await SpecialCode.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCode) {
      return res.status(404).json({ error: "Special Code not found" });
    }
    return res.status(200).json(updatedCode);
  } catch (error) {
    console.error("Error updating special code:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteSpecialCode = async (req, res) => {
  try {
    const { id } = req.params;
    await SpecialCode.findByIdAndDelete(id);
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting special code:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// POST /libraries/:libraryId/books
exports.addBookToLibrary = async (req, res) => {
  try {
    const { libraryId } = req.params;
    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // Đẩy book detail mới vào mảng books
    library.books.push(req.body);
    await library.save();

    return res.status(200).json(library);
  } catch (error) {
    console.error('Error adding book to library:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /libraries/:libraryId/books/:bookIndex
exports.updateBookInLibrary = async (req, res) => {
  try {
    const { libraryId, bookIndex } = req.params;
    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    if (!library.books[bookIndex]) {
      return res.status(404).json({ error: 'Book detail not found in this library' });
    }

    // Gộp thuộc tính cũ và mới
    library.books[bookIndex] = {
      ...library.books[bookIndex]._doc, 
      ...req.body,
    };

    await library.save();
    return res.status(200).json(library);
  } catch (error) {
    console.error('Error updating book in library:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /libraries/:libraryId/books/:bookIndex
exports.deleteBookFromLibrary = async (req, res) => {
  try {
    const { libraryId, bookIndex } = req.params;
    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    if (!library.books[bookIndex]) {
      return res.status(404).json({ error: 'Book detail not found in this library' });
    }

    library.books.splice(bookIndex, 1);
    await library.save();

    return res.status(200).json(library);
  } catch (error) {
    console.error('Error deleting book from library:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};