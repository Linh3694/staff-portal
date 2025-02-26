const AwardRecord = require("../models/AwardRecord");

// awardRecordController.js
exports.createAwardRecord = async (req, res) => {
  try {
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
          localField: "awardClasses",
          foreignField: "_id",
          as: "awardClasses",
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
      // (7) Loại bỏ các trường tạm thời
      {
        $project: {
          populatedStudents: 0,
          studentEnrollments: 0,
          photos: 0,
        },
      },
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