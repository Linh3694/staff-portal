// File: models/LibraryModel.js
const mongoose = require('mongoose');

const DocumentTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
});
const DocumentType = mongoose.model("DocumentType", DocumentTypeSchema);

const SeriesNameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
});
const SeriesName = mongoose.model("SeriesName", SeriesNameSchema);

const SpecialCodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
});
const SpecialCode = mongoose.model("SpecialCode", SpecialCodeSchema);


const IntroductionSchema = new mongoose.Schema(
  {
    youtubeLink: {
      type: String,
      default: '',
    },
    fmVoizLink: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
  },
  { _id: false } // Không cần _id riêng cho sub-schema
);

// Sub-schema chứa thông tin của từng "Sách"
const BookDetailSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      default: '',
    },
    documentIdentifier: {
      // Định danh tài liệu
      type: String,
      default: '',
    },
    bookTitle: {
      // Tên Sách
      type: String,
      default: '',
    },
    classificationSign: {
      // Ký hiệu phân loại tài liệu
      type: String,
      default: '',
    },
    publisherPlaceName: {
      // Tên nơi xuất bản
      type: String,
      default: '',
    },
    publisherName: {
      // Tên nhà xuất bản
      type: String,
      default: '',
    },
    publishYear: {
      // Năm xuất bản
      type: Number,
      default: null,
    },
    pages: {
      // Số trang
      type: Number,
      default: null,
    },
    attachments: {
      // Tài liệu đính kèm (nếu có), có thể để dạng mảng
      type: [String],
      default: [],
    },
    documentType: {
      // Loại tài liệu
      type: String,
      default: '',
    },
    coverPrice: {
      // Giá bìa
      type: Number,
      default: null,
    },
    language: {
      // Ngôn ngữ
      type: String,
      default: '',
    },
    catalogingAgency: {
      // Cơ quan Biên mục
      type: String,
      default: '',
    },
    storageLocation: {
      // Kho lưu giữ tài liệu
      type: String,
      default: '',
    },
    seriesName: {
      // Tên Tùng thư
      type: String,
      default: '',
    },
    specialCode: {
      // Đăng ký cá biệt
      type: String,
      default: '',
      unique: true,
    },

  },
  { _id: false } // Không tạo _id riêng cho mỗi BookDetail
);

// Schema chính
const LibrarySchema = new mongoose.Schema(
  {
    authors: {
      // Tác giả (có thể có nhiều)
      type: [String],
      default: [],
    },
    title: {
      // Tên Sách (chung cho đầu sách)
      type: String,
      required: true,
    },
    coverImage: {
      // Ảnh bìa
      type: String,
      default: '',
    },
    category: {
      // Thể loại
      type: String,
      default: '',
    },
    language: {
      // Ngôn ngữ (tổng quát)
      type: String,
      default: '',
    },
    description: {
      // Mô tả sách
      type: String,
      default: '',
    },

    // Giới thiệu sách thường
    normalIntroduction: {
      type: IntroductionSchema,
      default: {},
    },

    // Giới thiệu sách nói
    audioIntroduction: {
      type: IntroductionSchema,
      default: {},
    },

    // Danh sách các bản "Sách" chi tiết
    books: {
      type: [BookDetailSchema],
      default: [],
    },
  },
  {
    timestamps: true, // Tuỳ chọn, tự động thêm createdAt, updatedAt
  }
);

module.exports = {
  DocumentType,
  SeriesName,
  SpecialCode,
  Library: mongoose.model('Library', LibrarySchema),
};