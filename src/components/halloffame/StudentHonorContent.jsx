import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const StudentHonorContent = ({
  categoryId,
  recordIdParam,
  studentIdParam,
  setSearchParams,
}) => {
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

  useEffect(() => {
    if (!recordIdParam || !studentIdParam || !records.length) return;

    // Tìm record
    const foundRecord = records.find((r) => r._id === recordIdParam);
    if (!foundRecord) return;

    // Tìm student
    let foundStudent = null;
    for (const stu of foundRecord.students) {
      if (stu.student?._id === studentIdParam) {
        foundStudent = stu;
        break;
      }
    }
    if (!foundStudent) return;

    // Nếu tìm thấy -> mở modal
    setModalRecord(foundRecord);
    setModalStudent(foundStudent);
    setShowModal(true);
  }, [recordIdParam, studentIdParam, records]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/award-categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API_URL}/award-records`);
      setRecords(res.data);
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
    {
      id: "elementary",
      name: t("elementary", "Tiểu học"),
      minClass: 1,
      maxClass: 5,
    },
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
    // Cập nhật URL
    if (setSearchParams) {
      setSearchParams({
        recordId: record._id,
        studentId: student.student?._id,
      });
    }
  };

  // Hàm đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalStudent(null);
    if (setSearchParams) {
      // Xóa hết param
      setSearchParams({});
    }
  };

  // Hàm phụ: trả về text cho danh hiệu (VD: "Học sinh Danh dự - Tháng 8")
  const getSubAwardLabel = (record) => {
    if (!record?.subAward) return "";
    const { type, month, semester, schoolYear } = record.subAward;
    const categoryName = t(`category_${categoryId}`, t("award", "Danh hiệu"));
    const schoolYearLabel = findSchoolYearLabel(schoolYear);

    if (type === "month") {
      return `${categoryName} - ${t("month", "Tháng")} ${month || "?"} - ${t(
        "schoolYear",
        "Năm học"
      )} ${schoolYearLabel}`;
    } else if (type === "semester") {
      return `${categoryName} - ${t("semester", "Học kì")} ${
        semester || "?"
      } - ${t("schoolYear", "Năm học")} ${schoolYearLabel}`;
    } else if (type === "year") {
      return `${categoryName} - ${t(
        "schoolYear",
        "Năm học"
      )} ${schoolYearLabel}`;
    }
    return categoryName;
  };

  // Hàm lấy tên năm học (hoặc code) từ schoolYears
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    // Ví dụ hiển thị "2024-2025" hay "Khóa 2024-2025"
    return syDoc?.code || syDoc?.name || "";
  };

  // Lấy text từ DB (hoặc i18n)
  const rawText =
    i18n.language === "vi"
      ? currentCategory.name || t("award", "Danh hiệu")
      : currentCategory.nameEng || t("award", "Award");

  // Nếu DB lưu nhầm thành \\n, bạn có thể replace:
  const normalizedText = rawText.replace(/\\n/g, "\n");

  // Tách thành mảng theo ký tự xuống dòng
  const lines = normalizedText.split("\n");

  return (
    <div className="lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề, mô tả và ảnh cover */}

      <div>
        <div className="flex flex-col shimmer-text-title text-center items-center justify-center uppercase leading-tight">
          {lines.map((line, idx) => {
            const textSize =
              i18n.language === "vi"
                ? idx === 0
                  ? "text-[50px] font-[Metropolis]"
                  : "text-[70px] font-black font-[Metropolis]"
                : idx === 0
                ? "text-[70px] font-black font-[Metropolis]"
                : "text-[50px] font-[Metropolis]";

            return (
              <div key={idx} className={textSize}>
                {line}
              </div>
            );
          })}
          <img src={`/halloffame/vector.png`} alt="Cover" />
        </div>
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <p className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </p>
        </div>
        {currentCategory.coverImage && (
          <div className="relative mb-4 mt-8 w-full lg:w-[1410px] max-h-[470px] mx-auto">
            {/* Lớp dưới cùng: ảnh coverImage */}
            <img
              src={`${BASE_URL}/${currentCategory.coverImage}`}
              alt="Cover"
              className="w-full h-auto object-cover"
            />
            {/* Lớp giữa: khung frame-cover.png đè lên */}
            <img
              src="/halloffame/frame-cover.png"
              alt="Frame Cover"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            {/* Lớp trên cùng: text ở góc trên bên phải căn giữa theo chiều dọc */}
            <div className="absolute top-0 right-0 h-full flex items-center justify-center pr-4">
              <p className="text-[#f9d16f] text-right lg:mr-8 lg:mt-12 leading-tight ">
                {lines.map((line, idx) => {
                  const textSize =
                    i18n.language === "vi"
                      ? idx === 0
                        ? "lg:text-[52px] text-[18px]"
                        : "lg:text-[70px] text-[20px] font-extrabold"
                      : idx === 0
                      ? "lg:text-[70px] text-[20px] font-extrabold"
                      : "lg:text-[52px] text-[18px] ";

                  return (
                    <div key={idx} className={textSize}>
                      {line}
                    </div>
                  );
                })}
              </p>
            </div>
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

        <div className="relative flex items-center justify-items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên")}
            className="lg:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button
            onClick={() => console.log("Searching:", searchName)} // Thay bằng logic tìm kiếm của bạn
            className="hidden absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full lg:flex items-center justify-center hover:bg-[#001F3F] transition"
          >
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {searchName.trim() ? (
        <div className="grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px]">
          {filteredSearchRecords
            .flatMap((record) =>
              record.students.map((student) => ({ record, student }))
            )
            .map((item, idx) => {
              const { record, student } = item;
              return (
                <div
                  key={idx}
                  className="lg:h-[400px] lg:w-[258px] w-[180px] h-[270px] border rounded-[20px] shadow-sm lg:py-[20px] lg:px-[25px] px-[15px] py-[15px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => handleOpenModal(record, student)}
                >
                  {student.photo?.photoUrl ? (
                    <img
                      src={`${BASE_URL}/${student.photo.photoUrl}`}
                      alt="Student"
                      className="lg:h-[260px] lg:w-[208px] w-[208px] h-[160px] object-cover object-top rounded-[15px]"
                    />
                  ) : (
                    <div className="text-xs italic text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </div>
                  )}
                  <div className="h-[20px] w-[208px] lg:text-[16px] text-xs lg:pt-[13px] lg:pb-[15px] pt-[8px] pb-[10px] font-semibold text-white py-2 text-center">
                    {t("classLabel", "Lớp")}{" "}
                    {student.currentClass?.name ||
                      student.currentClass?.className ||
                      t("noClass", "Chưa cập nhật lớp")}
                  </div>
                  <div className="h-[60px] lg:w-[208px] w-[150px] text-[#f9d16f] shimmer-text lg:text-[18px] text-[14px] font-bold text-center">
                    {student.student?.name}
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
            <div
              key={level.id}
              className="w-full lg:w-[1410px] border-b border-gray-200 pb-4 mx-auto"
            >
              <div
                className="w-full flex justify-between items-center cursor-pointer py-4 text-[#002855] text-[22px] font-semibold"
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
                <div className="">
                  {studentCards.length === 0 ? (
                    <div className="text-gray-500 italic">
                      {t("noMatchingRecords", "Không có record nào phù hợp...")}
                    </div>
                  ) : (
                    <div className="w-full grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[20px] lg:gap-x-[30px] lg:gap-y-[35px]">
                      {studentCards.map((item, idx) => {
                        const { record, student } = item;
                        return (
                          <div
                            key={idx}
                            className="lg:h-[400px] lg:w-[258px] w-[180px] h-[270px] border rounded-[20px] shadow-sm lg:py-[20px] lg:px-[25px] px-[15px] py-[15px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                            onClick={() => handleOpenModal(record, student)}
                          >
                            {student.photo?.photoUrl ? (
                              <img
                                src={`${BASE_URL}/${student.photo.photoUrl}`}
                                alt="Student"
                                className="lg:h-[260px] lg:w-[208px] w-[208px] h-[160px] object-cover object-top rounded-[15px]"
                              />
                            ) : (
                              <div className="text-xs italic text-gray-400">
                                {t("noPhoto", "Chưa có ảnh")}
                              </div>
                            )}
                            <div className="h-[20px] w-[208px] lg:text-[16px] text-xs lg:pt-[13px] lg:pb-[15px] pt-[8px] pb-[10px] font-semibold text-white py-2 text-center">
                              {t("classLabel", "Lớp")}{" "}
                              {student.currentClass?.name ||
                                student.currentClass?.className ||
                                t("noClass", "Chưa cập nhật lớp")}
                            </div>
                            <div className="h-[60px] lg:w-[208px] w-[150px] text-[#f9d16f] shimmer-text lg:text-[18px] text-[14px] font-bold text-center">
                              {student.student?.name}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className="lg:w-[980px] md:w-[80%] w-[95%] h-auto rounded-[20px] lg:py-20 lg:px-20 py-5 relative shadow-lg"
            style={{
              backgroundImage: `url(${
                window.innerWidth >= 1024
                  ? "/halloffame/studentcard-desktop.png"
                  : "/halloffame/studentcard-mobile.png"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Bố cục chia làm 2 phần: Ảnh bên trái - Thông tin bên phải */}
            <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0 ">
              {/* Khung ảnh với nền lệch */}
              <div className="relative flex-shrink-0 px-[25px] lg:px-0">
                {modalStudent.photo?.photoUrl ? (
                  <img
                    src={`${BASE_URL}/${modalStudent.photo.photoUrl}`}
                    alt="Student"
                    className="relative z-10 lg:w-[281px] lg:h-[352px] w-full h-[320px] items-center object-cover object-top rounded-[15px] shadow-md "
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
                  <h2 className="lg:text-[24px] text-[16px] font-bold text-[#F9D16F]">
                    {modalStudent.student?.name}
                  </h2>
                  <div className="flex justify-start gap-6 mt-1 text-[#F9D16F] text-[14px]">
                    <span className="font-semibold lg:text-[16px] text-[12px]">
                      {t("classLabel", "Lớp")}{" "}
                      {modalStudent.currentClass?.name ||
                        modalStudent.currentClass?.className ||
                        t("noClass", "Chưa cập nhật lớp")}
                    </span>
                  </div>
                  <hr className="border-t border-gray-100 my-3 w-full" />
                </div>

                {/* Danh hiệu */}
                <p className="w-full mb-2 font-semibold text-white text-[13px] md:text-[15px] lg:text-[18px]">
                  {getSubAwardLabel(modalRecord)}
                </p>
                <div className="border-b-2 pb-4">
                  {/* Nội dung lời nhắn */}
                  {(i18n.language === "vi"
                    ? modalStudent.note
                    : modalStudent.noteEng) && (
                    <p className=" text-white my-auto text-justify text-[13px] md:text-[16px]">
                      {i18n.language === "vi"
                        ? modalStudent.note
                        : modalStudent.noteEng}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nút đóng */}
            <div className="flex w-full mx-auto items-center justify-center mt-4">
              <button
                onClick={handleCloseModal}
                className="bg-[#F9D16F] lg:px-16 px-2 lg:py-1 py-1 rounded-md text-[#002855] text-[13px] lg:text-[16px] font-semibold hover:bg-gray-400"
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
