const DailyTrip = require("../models/DailyTrip");
const SchoolYear = require("../models/SchoolYear");

// GET /daily-trips?date=YYYY-MM-DD
exports.getDailyTrips = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Date query parameter is required" });
    }
    // Xác định khoảng thời gian trong ngày
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the current school year
    const currentDate = new Date();
    const currentSchoolYear = await SchoolYear.findOne({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).select("_id");
    const schoolYearId = currentSchoolYear ? currentSchoolYear._id : null;

    // Use aggregation instead of .find() + populate()
    const dailyTrips = await DailyTrip.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      // Lookup route
      {
        $lookup: {
          from: "routes",
          localField: "route",
          foreignField: "_id",
          as: "route",
        },
      },
      { $unwind: "$route" },
      // Lookup vehicle
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      { $unwind: "$vehicle" },
      // Lookup staff
      {
        $lookup: {
          from: "users",
          localField: "staff",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: "$staff" },
      // Lookup students
      {
        $lookup: {
          from: "students",
          localField: "students.studentId",
          foreignField: "_id",
          as: "populatedStudents",
        },
      },
      // Lookup photos for the current school year
      {
        $lookup: {
          from: "photos",
          let: { studentIds: "$students.studentId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$student", "$$studentIds"] },
                    { $eq: ["$schoolYear", schoolYearId] },
                  ],
                },
              },
            },
          ],
          as: "photos",
        },
      },
      // Lookup student enrollments for the current school year
      {
        $lookup: {
          from: "studentclassenrollments",
          let: { studentIds: "$students.studentId", schoolYear: { $literal: schoolYearId } },
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
      // Merge each student's .student, .photo, and .currentClass
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
                            cond: { $eq: ["$$stu.studentId", "$$ps._id"] },
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
                            cond: { $eq: ["$$stu.studentId", "$$ph.student"] },
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
                                  cond: {
                                    $eq: ["$$stu.studentId", "$$se.student"],
                                  },
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
    ]);

    res.json(dailyTrips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /daily-trips
exports.createDailyTrip = async (req, res) => {
  try {
    const {
      date,
      tripTemplate,
      route,
      vehicle,
      staff,
      students,
      departureTime,
      arrivalTime,
      status,
      vehicleStatus,
      notes,
    } = req.body;

    const dailyTrip = new DailyTrip({
      date: new Date(date),
      tripTemplate,
      route,
      vehicle,
      staff,
      students, // Mảng điểm danh (nếu có)
      departureTime: departureTime ? new Date(departureTime) : undefined,
      arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
      status,
      vehicleStatus,
      notes,
    });
    
    await dailyTrip.save();
    res.status(201).json(dailyTrip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /daily-trips/:id
exports.updateDailyTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Nếu cập nhật các trường dạng ngày/thời gian thì chuyển đổi về Date
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    if (updateData.departureTime) {
      updateData.departureTime = new Date(updateData.departureTime);
    }
    if (updateData.arrivalTime) {
      updateData.arrivalTime = new Date(updateData.arrivalTime);
    }

    const updatedDailyTrip = await DailyTrip.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedDailyTrip) {
      return res.status(404).json({ error: "Daily trip not found" });
    }
    res.json(updatedDailyTrip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /daily-trips/:id
exports.deleteDailyTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DailyTrip.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Daily trip not found" });
    }
    res.json({ message: "Daily trip deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};