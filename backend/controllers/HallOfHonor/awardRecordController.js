const AwardRecord = require("../../models/AwardRecord");
const AwardCategory = require("../../models/AwardCategory");
const xlsx = require('xlsx');

// awardRecordController.js
exports.createAwardRecord = async (req, res) => {
  try {
    // If custom subAward, inherit priority and labelEng from its category definition
    if (req.body.subAward?.type === "custom") {
      const cat = await AwardCategory.findById(req.body.awardCategory);
      const catSub = cat?.subAwards.find(
        (s) => s.type === "custom" && s.label === req.body.subAward.label
      );
      if (catSub) {
        if (catSub.priority != null) {
          req.body.subAward.priority = catSub.priority;
        }
        if (catSub.labelEng) {
          req.body.subAward.labelEng = catSub.labelEng;
        }
      }
    }
    const newRecord = await AwardRecord.create(req.body);
    return res.status(201).json(newRecord);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// awardRecordController.js
exports.getAllAwardRecords = async (req, res) => {
  try {
    const records = await AwardRecord.aggregate([
      // (1) Lookup thông tin Student
      {
        $lookup: {
          from: "students",
          localField: "students.student",
          foreignField: "_id",
          as: "populatedStudents",
        },
      },
      // (2) Lookup ảnh Photo (dựa theo danh sách student và schoolYear)
      {
        $lookup: {
          from: "photos",
          let: {
            studentIds: "$students.student",
            yearId: "$subAward.schoolYear",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$student", "$$studentIds"] },
                    { $eq: ["$schoolYear", "$$yearId"] },
                  ],
                },
              },
            },
          ],
          as: "photos",
        },
      },
      // (3) Lookup AwardCategory
      {
        $lookup: {
          from: "awardcategories",
          localField: "awardCategory",
          foreignField: "_id",
          as: "awardCategory",
        },
      },
      { $unwind: { path: "$awardCategory", preserveNullAndEmptyArrays: true } },
      // (4) Lookup AwardClasses
      {
        $lookup: {
          from: "classes",
          localField: "awardClasses.class",
          foreignField: "_id",
          as: "awardClassesInfo",
        },
      },
      // (5) Lookup StudentClassEnrollment và join với thông tin Class
      {
        $lookup: {
          from: "studentclassenrollments",
          let: { studentIds: "$students.student", schoolYear: "$subAward.schoolYear" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$student", "$$studentIds"] },
                    { $eq: ["$schoolYear", "$$schoolYear"] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "classes",
                localField: "class",
                foreignField: "_id",
                as: "classInfo",
              },
            },
            { $unwind: "$classInfo" },
            {
              $project: {
                student: 1,
                currentClass: "$classInfo",
              },
            },
          ],
          as: "studentEnrollments",
        },
      },
      // (6) Merge thông tin student, photo và currentClass vào mảng students
      {
        $addFields: {
          students: {
            $map: {
              input: "$students",
              as: "stu",
              in: {
                $mergeObjects: [
                  "$$stu",
                  {
                    student: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$populatedStudents",
                            as: "ps",
                            cond: { $eq: ["$$stu.student", "$$ps._id"] },
                          },
                        },
                        0,
                      ],
                    },
                    photo: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$photos",
                            as: "ph",
                            cond: { $eq: ["$$stu.student", "$$ph.student"] },
                          },
                        },
                        0,
                      ],
                    },
                    currentClass: {
                      $let: {
                        vars: {
                          enrollment: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$studentEnrollments",
                                  as: "se",
                                  cond: { $eq: ["$$se.student", "$$stu.student"] },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: "$$enrollment.currentClass",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          awardClasses: {
            $map: {
              input: "$awardClasses",
              as: "ac",
              in: {
                $mergeObjects: [
                  "$$ac",
                  {
                    classInfo: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$awardClassesInfo",
                            as: "info",
                            cond: { $eq: ["$$info._id", "$$ac.class"] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      // (7) Loại bỏ các trường tạm thời
      {
        $project: {
          populatedStudents: 0,
          studentEnrollments: 0,
          photos: 0,
          awardClassesInfo: 0
        },
      },
      {
        $addFields: {
          subAward: {
            $cond: {
              if: { $eq: ["$subAward.type", "custom"] },
              then: {
                $mergeObjects: [
                  "$subAward",
                  { priority: { $ifNull: ["$subAward.priority", 0] } }
                ]
              },
              else: "$subAward"
            }
          }
        }
      },
      {
        $sort: {
          "subAward.priority": 1
        }
      }
    ]);

    res.json(records);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Lấy 1 AwardRecord theo ID
exports.getAwardRecordById = async (req, res) => {
  try {
    const record = await AwardRecord.findById(req.params.id)
      .populate({
        path: "students",
        populate: { path: "student", model: "Student" },
      })
      .populate("awardCategory");
    if (!record) return res.status(404).json({ message: "Không tìm thấy AwardRecord" });
    return res.json(record);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Cập nhật AwardRecord
exports.updateAwardRecord = async (req, res) => {
  try {
    // If custom subAward, inherit priority and labelEng from its category definition
    if (req.body.subAward?.type === "custom") {
      const cat = await AwardCategory.findById(req.body.awardCategory);
      const catSub = cat?.subAwards.find(
        (s) => s.type === "custom" && s.label === req.body.subAward.label
      );
      if (catSub) {
        if (catSub.priority != null) {
          req.body.subAward.priority = catSub.priority;
        }
        if (catSub.labelEng) {
          req.body.subAward.labelEng = catSub.labelEng;
        }
      }
    }
    const updatedRecord = await AwardRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRecord) return res.status(404).json({ message: "Không tìm thấy AwardRecord" });
    return res.json(updatedRecord);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Xoá AwardRecord
exports.deleteAwardRecord = async (req, res) => {
  try {
    const deleted = await AwardRecord.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy AwardRecord" });
    return res.json({ message: "Xoá AwardRecord thành công" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Xử lý upload file Excel cho học sinh
exports.uploadExcelStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên file Excel" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "File Excel không có dữ liệu" });
    }

    const students = data.map(row => ({
      student: row['StudentCode'],
      keyword: (row['Keyword'] || '').split(',').map(k => k.trim()).filter(Boolean),
      keywordEng: (row['KeywordEng'] || '').split(',').map(k => k.trim()).filter(Boolean),
      activity: (row['Activity'] || '').split(',').map(a => a.trim()).filter(Boolean),
      activityEng: (row['ActivityEng'] || '').split(',').map(a => a.trim()).filter(Boolean),
      note: row['Note'] || '',
      noteEng: row['NoteEng'] || ''
    }));

    // Validate dữ liệu
    const invalidStudents = students.filter(s => !s.student);
    if (invalidStudents.length > 0) {
      return res.status(400).json({
        message: `Có ${invalidStudents.length} học sinh không có mã học sinh`,
        invalidRows: invalidStudents
      });
    }

    return res.status(200).json({
      message: "Đọc file thành công",
      students: students,
      totalStudents: students.length
    });

  } catch (error) {
    console.error("Error processing Excel file:", error);
    return res.status(400).json({
      message: "Có lỗi xảy ra khi xử lý file Excel",
      error: error.message
    });
  }
};

// Xử lý upload file Excel cho lớp
exports.uploadExcelClasses = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên file Excel" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "File Excel không có dữ liệu" });
    }

    const classes = data.map(row => ({
      class: row['Mã lớp'] || row['ID'],
      note: row['Ghi chú'] || '',
      noteEng: row['Note (EN)'] || ''
    }));

    // Validate dữ liệu
    if (classes.some(c => !c.class)) {
      return res.status(400).json({ message: "Một số dòng thiếu mã lớp" });
    }

    return res.status(200).json({
      message: "Đọc file thành công",
      classes: classes
    });

  } catch (error) {
    console.error("Error processing Excel file:", error);
    return res.status(400).json({
      message: "Có lỗi xảy ra khi xử lý file Excel",
      error: error.message
    });
  }
};