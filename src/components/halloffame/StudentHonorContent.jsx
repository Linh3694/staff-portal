import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const StudentHonorContent = ({ categoryId }) => {
  const { t, i18n } = useTranslation();

  // --- States cho dữ liệu API ---
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);

  // --- States cho giao diện lọc (filter) ---
  const [activeTab, setActiveTab] = useState("year");
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedGradeRange, setSelectedGradeRange] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");
  const [openLevel, setOpenLevel] = useState(null);

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null); // record được chọn
  const [modalStudent, setModalStudent] = useState(null); // student được chọn

  // Lấy thông tin chi tiết của danh mục hiện tại từ dữ liệu API
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};

  // -----------------------------
  // 1) Lấy dữ liệu từ server
  // -----------------------------
  useEffect(() => {
    fetchCategories();
    fetchRecords();
    fetchSchoolYears();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/award-categories`);
      setCategories(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API_URL}/award-records`);
      setRecords(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const res = await axios.get(`${API_URL}/schoolyears`);
      setSchoolYears(res.data);
    } catch (err) {
      console.error("Error fetching schoolYears:", err);
    }
  };

  // -----------------------------
  // 2) Thiết lập mặc định view cho danh mục được chọn
  // -----------------------------
  useEffect(() => {
    if (categoryId && records.length && schoolYears.length) {
      setDefaultViewForCategory(categoryId);
    }
  }, [categoryId, records, schoolYears]);

  const setDefaultViewForCategory = (catId) => {
    const catRecords = records.filter((r) => r.awardCategory?._id === catId);
    if (!catRecords.length) return;

    const yearRecs = catRecords.filter((r) => r.subAward?.type === "year");
    const semesterRecs = catRecords.filter(
      (r) => r.subAward?.type === "semester"
    );
    const monthRecs = catRecords.filter((r) => r.subAward?.type === "month");

    // 1) Nếu có record type "year"
    if (yearRecs.length > 0) {
      const currentSyId = getCurrentSchoolYearId();
      if (currentSyId) {
        const recordsInCurrentSy = yearRecs.filter(
          (r) => String(r.subAward?.schoolYear) === currentSyId
        );
        if (recordsInCurrentSy.length > 0) {
          setActiveTab("year");
          setSelectedSchoolYearId(currentSyId);
          return;
        }
      }
      const bySchoolYear = groupRecordsBySchoolYear(yearRecs);
      const newestSyId = findNewestSchoolYearId(Object.keys(bySchoolYear));
      setActiveTab("year");
      setSelectedSchoolYearId(newestSyId || "");
      return;
    }

    // 2) Nếu có record type "semester"
    if (semesterRecs.length > 0) {
      const currentSyId = getCurrentSchoolYearId();
      if (currentSyId) {
        const recordsInCurrentSy = semesterRecs.filter(
          (r) => String(r.subAward?.schoolYear) === currentSyId
        );
        if (recordsInCurrentSy.length > 0) {
          let listSem = recordsInCurrentSy
            .map((r) => r.subAward?.semester)
            .filter(Boolean)
            .map(String)
            .sort((a, b) => Number(a) - Number(b));
          let chosenSemester = listSem.length > 0 ? listSem[0] : "";
          setActiveTab("semester");
          setSelectedSchoolYearId(currentSyId);
          setSelectedSemester(chosenSemester);
          return;
        }
      }
      const bySchoolYear = groupRecordsBySchoolYear(semesterRecs);
      const newestSyId = findNewestSchoolYearId(Object.keys(bySchoolYear));
      const recsOfNewest = semesterRecs.filter(
        (r) => String(r.subAward?.schoolYear) === newestSyId
      );
      let chosenSemester = "1";
      const listSem = recsOfNewest
        .map((r) => r.subAward?.semester)
        .filter(Boolean)
        .map(String);
      if (!listSem.includes("1")) {
        const sorted = listSem.sort((a, b) => Number(a) - Number(b));
        if (sorted.length > 0) chosenSemester = sorted[0];
      }
      setActiveTab("semester");
      setSelectedSchoolYearId(newestSyId || "");
      setSelectedSemester(chosenSemester);
      return;
    }

    // 3) Nếu có record type "month"
    if (monthRecs.length > 0) {
      const currentSyId = getCurrentSchoolYearId();
      if (currentSyId) {
        const recordsInCurrentSy = monthRecs.filter(
          (r) => String(r.subAward?.schoolYear) === currentSyId
        );
        if (recordsInCurrentSy.length > 0) {
          const currentMonth = new Date().getMonth() + 1;
          const listMonth = recordsInCurrentSy
            .map((r) => r.subAward?.month)
            .filter(Boolean)
            .map(String);
          let chosenMonth = String(currentMonth);
          if (!listMonth.includes(chosenMonth)) {
            const sorted = listMonth.sort((a, b) => Number(a) - Number(b));
            if (sorted.length > 0) chosenMonth = sorted[0];
          }
          setActiveTab("month");
          setSelectedSchoolYearId(currentSyId);
          setSelectedMonth(chosenMonth);
          return;
        }
      }
      const bySchoolYear = groupRecordsBySchoolYear(monthRecs);
      const newestSyId = findNewestSchoolYearId(Object.keys(bySchoolYear));
      const recsOfNewest = monthRecs.filter(
        (r) => String(r.subAward?.schoolYear) === newestSyId
      );
      const currentMonth = new Date().getMonth() + 1;
      const listMonth = recsOfNewest
        .map((r) => r.subAward?.month)
        .filter(Boolean)
        .map(String);
      let chosenMonth = String(currentMonth);
      if (!listMonth.includes(chosenMonth)) {
        const sorted = listMonth.sort((a, b) => Number(a) - Number(b));
        if (sorted.length > 0) chosenMonth = sorted[0];
      }
      setActiveTab("month");
      setSelectedSchoolYearId(newestSyId || "");
      setSelectedMonth(chosenMonth);
      return;
    }
  };

  const groupRecordsBySchoolYear = (arr) => {
    const map = {};
    arr.forEach((r) => {
      const sy = String(r.subAward?.schoolYear);
      if (!map[sy]) map[sy] = [];
      map[sy].push(r);
    });
    return map;
  };

  const findNewestSchoolYearId = (syIds) => {
    let bestId = "";
    let bestCode = "";
    syIds.forEach((id) => {
      const syDoc = schoolYears.find((sy) => String(sy._id) === id);
      if (!syDoc) return;
      const codeStr = syDoc.code || "";
      if (codeStr > bestCode) {
        bestCode = codeStr;
        bestId = id;
      }
    });
    return bestId;
  };

  const getCurrentSchoolYearId = () => {
    const today = new Date();
    const currentSy = schoolYears.find((sy) => {
      const start = new Date(sy.startDate);
      const end = new Date(sy.endDate);
      return today >= start && today <= end;
    });
    return currentSy ? currentSy._id : "";
  };

  // -----------------------------
  // 3) Tính toán các danh sách dùng cho filter
  // -----------------------------
  const recordsSameCatAndType = records.filter(
    (r) => r.awardCategory?._id === categoryId && r.subAward?.type === activeTab
  );

  const distinctSchoolYearIds = [
    ...new Set(
      recordsSameCatAndType.map((r) => String(r.subAward?.schoolYear))
    ),
  ].filter(Boolean);

  const relevantSchoolYears = schoolYears.filter((sy) =>
    distinctSchoolYearIds.includes(String(sy._id))
  );

  const recordsCatTypeYear = recordsSameCatAndType.filter(
    (r) => String(r.subAward?.schoolYear) === selectedSchoolYearId
  );

  const distinctSemesters = [
    ...new Set(
      recordsCatTypeYear.map((r) => r.subAward?.semester).filter(Boolean)
    ),
  ].sort((a, b) => a - b);

  const distinctMonths = [
    ...new Set(
      recordsCatTypeYear.map((r) => r.subAward?.month).filter(Boolean)
    ),
  ].sort((a, b) => a - b);

  // -----------------------------
  // 4) Lọc record theo các tiêu chí
  // -----------------------------
  const filteredBaseRecords = records.filter((r) => {
    if (r.awardCategory?._id !== categoryId) return false;
    if (r.subAward?.type !== activeTab) return false;
    if (!selectedSchoolYearId) return false;
    if (String(r.subAward?.schoolYear) !== selectedSchoolYearId) return false;
    if (activeTab === "semester") {
      if (!selectedSemester) return false;
      if (String(r.subAward?.semester) !== selectedSemester) return false;
    }
    if (activeTab === "month") {
      if (!selectedMonth) return false;
      if (String(r.subAward?.month) !== selectedMonth) return false;
    }
    return true;
  });

  // Hàm normalize: loại bỏ ký tự không phải chữ và số, chuyển về chữ thường
  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalize(str) {
    // Ví dụ: vừa remove diacritics, vừa bỏ hết ký tự không phải chữ-số, vừa toLowerCase
    return removeDiacritics(str)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  const filteredSearchRecords = !searchName.trim()
    ? filteredBaseRecords
    : filteredBaseRecords.reduce((acc, record) => {
        // Lấy searchTerm
        const searchTerm = normalize(searchName.trim());
        const isNumeric = /^\d+$/.test(searchName.trim());

        // Lọc students của record
        const filteredStudents = record.students.filter((stu) => {
          // 1) Normalize tên
          const normalizedStuName = normalize(stu.student?.name || "");

          // 2) Normalize lớp
          const classNameRaw =
            stu.currentClass?.name || stu.currentClass?.className || "";
          const normalizedClassName = normalize(classNameRaw);

          // A) So sánh tên học sinh (đã normalize)
          if (normalizedStuName.includes(searchTerm)) {
            return true;
          }

          // B) So sánh khối/lớp
          if (isNumeric) {
            // Nếu người dùng nhập số (VD: "10"), ta so sánh với số lớp
            const gradeMatch = normalizedClassName.match(/^\d+/);
            if (gradeMatch && gradeMatch[0] === searchTerm) {
              return true;
            }
          } else {
            // Nếu nhập chữ (VD: "10a1"), so sánh full normalized
            if (normalizedClassName.includes(searchTerm)) {
              return true;
            }
          }

          return false;
        });

        if (filteredStudents.length > 0) {
          acc.push({ ...record, students: filteredStudents });
        }
        return acc;
      }, []);

  // -----------------------------
  // 5) Phân chia record theo cấp học (Tiểu học, THCS, THPT)
  // -----------------------------
  const educationLevels = [
    { id: "primary", name: t("primary", "Tiểu học"), minClass: 1, maxClass: 5 },
    { id: "secondary", name: t("secondary", "THCS"), minClass: 6, maxClass: 9 },
    {
      id: "highschool",
      name: t("highschool", "THPT"),
      minClass: 10,
      maxClass: 12,
    },
  ];

  const filterRecordsByLevel = (recordsArr, minClass, maxClass) => {
    return recordsArr
      .map((record) => {
        const studentsInRange = record.students.filter((stu) => {
          const className =
            stu.currentClass?.name || stu.currentClass?.className || "";
          const classNumber = parseInt(className.match(/\d+/)?.[0], 10);
          if (!classNumber) return false;
          return classNumber >= minClass && classNumber <= maxClass;
        });
        return {
          ...record,
          students: studentsInRange,
        };
      })
      .filter((r) => r.students.length > 0);
  };

  /////// Modal

  // Hàm mở modal khi click vào 1 học sinh
  const handleOpenModal = (record, student) => {
    setModalRecord(record);
    setModalStudent(student);
    setShowModal(true);
  };

  // Hàm đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalStudent(null);
  };

  // Hàm phụ: trả về text cho danh hiệu (VD: "Học sinh Danh dự - Tháng 8")
  const getSubAwardLabel = (record) => {
    if (!record?.subAward) return "";
    const { type, month, semester, schoolYear } = record.subAward;
    const categoryName = t(`category_${categoryId}`, t("award", "Danh hiệu"));
    if (type === "month") {
      return `${categoryName} - ${t("month", "Tháng")} ${month || "?"}`;
    } else if (type === "semester") {
      return `${categoryName} - ${t("semester", "Học kì")} ${semester || "?"}`;
    } else if (type === "year") {
      return `${categoryName} - ${t(
        "schoolYear",
        "Năm học"
      )} ${findSchoolYearLabel(schoolYear)}`;
    }
    return categoryName;
  };

  // Hàm lấy tên năm học (hoặc code) từ schoolYears
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    // Ví dụ hiển thị "2024-2025" hay "Khóa 2024-2025"
    return syDoc?.code || syDoc?.name || "";
  };

  return (
    <div className="lg:p-6 px-3 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề, mô tả và ảnh cover */}
      <div>
        <h2 className="text-[40px] text-[#F05023] text-center font-bold mb-2">
          {i18n.language === "vi"
            ? currentCategory.name || t("award", "Danh hiệu")
            : currentCategory.nameEng || t("award", "Award")}
        </h2>
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <p className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </p>
        </div>
        {currentCategory.coverImage && (
          <div className="mb-4 mt-8">
            <img
              src={`${BASE_URL}/${currentCategory.coverImage}`}
              alt="Cover"
              className="max-h-[470px] w-full h-auto object-cover"
            />
          </div>
        )}
      </div>

      {/* Tabs: Năm học / Học kì / Tháng */}
      <div className="flex space-x-12 text-lg items-center justify-center font-medium mb-10 mt-10">
        {["year", "semester", "month"].map((tab) => (
          <button
            key={tab}
            className={`pb-1 ${
              activeTab === tab
                ? "text-[#002855] font-semibold lg:text-[32px] text-[24px] border-b-2 border-[#002855]"
                : "text-[#757575] lg:text-[24px] text-[18px]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "year"
              ? t("schoolYear", "Năm học")
              : tab === "semester"
              ? t("semester", "Học kì")
              : t("month", "Tháng")}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {(activeTab === "year" ||
          activeTab === "semester" ||
          activeTab === "month") && (
          <select
            className="lg:w-[300px] py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={selectedSchoolYearId}
            onChange={(e) => {
              setSelectedSchoolYearId(e.target.value);
              setSelectedSemester("");
              setSelectedMonth("");
            }}
          >
            <option value="">
              {t("selectSchoolYear", "--Chọn năm học--")}
            </option>
            {relevantSchoolYears.map((sy) => (
              <option key={sy._id} value={sy._id}>
                {t("schoolYearText", "Năm học")} {sy.code || sy.name}
              </option>
            ))}
          </select>
        )}

        {activeTab === "semester" && selectedSchoolYearId && (
          <select
            className="py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">{t("selectSemester")}</option>
            {distinctSemesters.map((num) => (
              <option key={num} value={num}>
                {t("semester")} {num}
              </option>
            ))}
          </select>
        )}

        {activeTab === "month" && selectedSchoolYearId && (
          <select
            className="py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">{t("selectMonth")}</option>
            {distinctMonths.map((m) => (
              <option key={m} value={m}>
                {t("month")} {m}
              </option>
            ))}
          </select>
        )}

        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên")}
            className="lg:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button
            onClick={() => console.log("Searching:", searchName)} // Thay bằng logic tìm kiếm của bạn
            className="absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full flex items-center justify-center hover:bg-[#001F3F] transition"
          >
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {searchName.trim() ? (
        // Render kết quả tìm kiếm flat (tất cả kết quả không nhóm)
        <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-4">
          {filteredSearchRecords
            .flatMap((record) =>
              record.students.map((student) => ({ record, student }))
            )
            .map((item, idx) => {
              const { record, student } = item;
              return (
                <div
                  key={idx}
                  className="border rounded-lg p-3 shadow-sm bg-[#E6EEF6] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => handleOpenModal(record, student)}
                >
                  {student.photo?.photoUrl ? (
                    <img
                      src={`${BASE_URL}/${student.photo.photoUrl}`}
                      alt="Student"
                      className="lg:h-[260px] h-[160px] lg:w-[208px] w-[208px] object-cover mt-2"
                    />
                  ) : (
                    <div className="text-xs italic text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </div>
                  )}
                  <div className="text-[#F05023] text-[20px] font-bold text-center items-center justify-center w-full break-words">
                    {student.student?.name}
                  </div>
                  <div className="text-sm font-semibold">
                    {t("classLabel", "Lớp")}{" "}
                    {student.currentClass?.name ||
                      student.currentClass?.className ||
                      t("noClass", "Chưa cập nhật lớp")}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        // Render theo nhóm (educationLevels)
        educationLevels.map((level) => {
          const levelRecords = filterRecordsByLevel(
            filteredSearchRecords,
            level.minClass,
            level.maxClass
          );
          if (levelRecords.length === 0) return null;
          const studentCards = [];
          levelRecords.forEach((rec) => {
            rec.students.forEach((stu) => {
              studentCards.push({ record: rec, student: stu });
            });
          });
          return (
            <div key={level.id} className="border-b border-gray-200 pb-4">
              <div
                className="flex justify-between items-center cursor-pointer py-4 text-[#002855] text-[22px] font-semibold"
                onClick={() =>
                  setOpenLevel(openLevel === level.id ? null : level.id)
                }
              >
                <span>{level.name}</span>
                <span className="text-gray-500 text-lg">
                  {openLevel === level.id ? <FaAngleDown /> : <FaAngleRight />}
                </span>
              </div>
              {openLevel === level.id && (
                <div className="px-[4px] rounded-lg">
                  {studentCards.length === 0 ? (
                    <div className="text-gray-500 italic">
                      {t("noMatchingRecords", "Không có record nào phù hợp...")}
                    </div>
                  ) : (
                    <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-4">
                      {studentCards.map((item, idx) => {
                        const { record, student } = item;
                        return (
                          <div
                            key={idx}
                            className="lg:h-[375px] h-[250px] border rounded-lg p-3 shadow-sm bg-[#E6EEF6] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                            onClick={() => handleOpenModal(record, student)}
                          >
                            {student.photo?.photoUrl ? (
                              <img
                                src={`${BASE_URL}/${student.photo.photoUrl}`}
                                alt="Student"
                                className="lg:h-[260px] h-[160px] lg:w-[208px] w-[208px] object-cover mt-2 rounded-lg"
                              />
                            ) : (
                              <div className="text-xs italic text-gray-400">
                                {t("noPhoto", "Chưa có ảnh")}
                              </div>
                            )}
                            <div className="text-[#F05023] lg:text-[20px] text-[15px] font-bold text-center">
                              {student.student?.name}
                            </div>
                            <div className="lg:text-sm text-xs font-semibold">
                              {t("classLabel", "Lớp")}{" "}
                              {student.currentClass?.name ||
                                student.currentClass?.className ||
                                t("noClass", "Chưa cập nhật lớp")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      {/* Modal hiển thị chi tiết khi click vào 1 học sinh */}
      {showModal && modalStudent && modalRecord && (
        <div className="fixed inset-0  flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="lg:w-[930px] md:w-[80%] w-[95%] h-auto bg-white rounded-lg lg:pt-10 lg:px-12 px-0 pt-[15px] pb-5 relative shadow-lg">
            {/* Bố cục chia làm 2 phần: Ảnh bên trái - Thông tin bên phải */}
            <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0 ">
              {/* Khung ảnh với nền lệch */}
              <div className="relative flex-shrink-0 px-[20px] lg:px-0">
                {/* Nền phía sau ảnh */}
                <div className="absolute -top-5 -left-5 lg:w-[322px] lg:h-[428px] w-full h-auto bg-[#E6EEF6] rounded-lg shadow-lg"></div>
                {/* Ảnh chính */}
                {modalStudent.photo?.photoUrl ? (
                  <img
                    src={`${BASE_URL}/${modalStudent.photo.photoUrl}`}
                    alt="Student"
                    className="relative z-10 lg:w-[322px] lg:h-[428px] w-full h-[200px] items-center object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="relative z-10 lg:w-[322px] lg:h-[428px] w-[150px] h-[200px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                    <span className="text-xs text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </span>
                  </div>
                )}
              </div>

              {/* Phần thông tin học sinh */}
              <div className="flex flex-col items-start justify-start lg:px-[10px] px-[20px] ">
                <div className="lg:w-[500px] w-full flex flex-col">
                  <h2 className="lg:text-[24px] text-[16px] font-bold text-[#F05023]">
                    {modalStudent.student?.name}
                  </h2>
                  <div className="flex justify-start gap-6 mt-1 text-[#757575] text-[14px]">
                    <span className="font-semibold lg:text-[16px] text-[12px]">
                      {t("classLabel", "Lớp")}{" "}
                      {modalStudent.currentClass?.name ||
                        modalStudent.currentClass?.className ||
                        t("noClass", "Chưa cập nhật lớp")}
                    </span>
                    <span className="font-semibold lg:text-[16px] text-[12px]">
                      {t("schoolYearLabel", "Khóa")}{" "}
                      {findSchoolYearLabel(modalRecord.subAward?.schoolYear)}
                    </span>
                  </div>
                  <hr className="border-t border-gray-100 my-3 w-full" />
                </div>

                {/* Danh hiệu */}
                <p className="text-[#002855] font-semibold lg:text-[18px] text-[14px]">
                  {getSubAwardLabel(modalRecord)}
                </p>

                {/* Nội dung lời nhắn */}
                {(i18n.language === "vi"
                  ? modalStudent.note
                  : modalStudent.noteEng) && (
                  <p className="italic text-[#002855] mt-2 text-justify">
                    “
                    {i18n.language === "vi"
                      ? modalStudent.note
                      : modalStudent.noteEng}
                    ”
                  </p>
                )}
              </div>
            </div>

            <hr className="border-t-2 border-gray-100 mt-4" />

            {/* Nút đóng */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 px-4 py-2 rounded-md text-gray-800 font-semibold hover:bg-gray-400"
              >
                {t("close", "Đóng")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHonorContent;
