const Application = require("../models/Application");

exports.submitApplication = async (req, res) => {
  try {
    const { fullname, birthdate, phone, email, graduationSchools, major, highestDegree, workExperience, englishLevel, expectedSalary, appliedJob } = req.body;
    const cvFile = req.file ? `/uploads/CV/${req.file.filename}` : null;

    if (!cvFile) {
      return res.status(400).json({ message: "CV file is required" });
    }

    const newApplication = new Application({
      fullname,
      birthdate,
      phone,
      email,
      graduationSchools,
      major,
      highestDegree,
      workExperience,
      englishLevel,
      expectedSalary,
      cvFile,
      appliedJob,
    });

    await newApplication.save();
    res.status(201).json({ message: "Application submitted successfully", application: newApplication });
  } catch (error) {
    res.status(500).json({ message: "Error submitting application", error });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find().populate("appliedJob");
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications", error });
  }
};

exports.getApplicationsByJob = async (req, res) => {
  try {
    const applications = await Application.find({ appliedJob: req.params.jobId });
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications", error });
  }
};