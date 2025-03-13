import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

/**
 * Component hiển thị danh hiệu dành cho LỚP (thay vì học sinh).
 * Dữ liệu đọc từ AwardRecord, trong đó ta dùng mảng awardClasses thay cho students.
 */
const ClassHonorContent = ({
  categoryId,
  recordIdParam,
  classIdParam,
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
  const [selectedGradeRange, setSelectedGradeRange] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");
  const [openLevel, setOpenLevel] = useState(null);

  // Ảnh lớp
  const [classPhotos, setClassPhotos] = useState({});

  // --- States cho Modal (khi click vào 1 lớp) ---
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);
  const [modalClass, setModalClass] = useState(null); // Thông tin lớp trong record

  // Lấy thông tin chi tiết của danh mục hiện tại
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};

  // --------------------------------------------------
  // 1) Lấy dữ liệu từ server
  // --------------------------------------------------
  useEffect(() => {
    fetchCategories();
    fetchRecords();
    fetchSchoolYears();
    fetchClassPhotos();
  }, []);

  // 1) Tự động mở modal nếu URL có
  useEffect(() => {
    if (!recordIdParam || !classIdParam || !records.length) return;
    const foundRecord = records.find((r) => r._id === recordIdParam);
    if (!foundRecord) return;

    const foundClass = foundRecord.awardClasses.find(
      (c) => c.classInfo?._id === classIdParam
    );
    if (!foundClass) return;

    setModalRecord(foundRecord);
    setModalClass(foundClass);
    setShowModal(true);
  }, [recordIdParam, classIdParam, records]);

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

  const fetchClassPhotos = async () => {
    try {
      const res = await axios.get(`${API_URL}/photos`);
      const data = res.data;
      const map = {};
      data.forEach((p) => {
        // p.class có dạng { _id, className }, ta lấy p.class._id làm key
        if (p.class && p.class._id) {
          map[p.class._id] = p.photoUrl;
        }
      });
      setClassPhotos(map);
    } catch (err) {
      console.error("Error fetchClassPhotos:", err);
    }
  };

  // --------------------------------------------------
  // 2) Khi category thay đổi => set view mặc định
  // --------------------------------------------------
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

  // --------------------------------------------------
  // 3) Tính toán các danh sách dùng cho filter
  // --------------------------------------------------
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

  // --------------------------------------------------
  // 4) Lọc record theo các tiêu chí => DÙNG awardClasses
  // --------------------------------------------------
  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function normalize(str) {
    return removeDiacritics(str)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  const filteredRecords = records
    // Bước 1: Lọc theo danh mục, subAward, schoolYear, ...
    .filter((r) => {
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
      // --- Sửa phần lọc theo khối ---
      if (selectedGradeRange) {
        const [minG, maxG] =
          selectedGradeRange === "primary"
            ? [1, 5]
            : selectedGradeRange === "secondary"
            ? [6, 9]
            : [10, 12];

        const matchAnyClassInRange = r.awardClasses.some((cls) => {
          const matched = cls.classInfo?.className?.match(/\d+/);
          if (!matched) return false;
          const classNumber = parseInt(matched[0], 10);
          return classNumber >= minG && classNumber <= maxG;
        });
        if (!matchAnyClassInRange) return false;
      }

      // --- Sửa phần lọc theo tên lớp ---
      if (selectedClass.trim()) {
        const matchExact = r.awardClasses.some(
          (cls) => cls.classInfo?.className === selectedClass.trim()
        );
        if (!matchExact) return false;
      }

      return true;
    })
    // Bước 2: Nếu có searchName => chỉ giữ lớp match, ngược lại giữ nguyên
    .map((record) => {
      if (!searchName.trim()) {
        return record;
      }
      const searchTerm = normalize(searchName.trim());
      const matchedClasses = record.awardClasses.filter((cls) => {
        const normName = normalize(cls.classInfo?.className || "");
        return normName.includes(searchTerm);
      });
      if (matchedClasses.length === 0) {
        return null;
      }
      return { ...record, awardClasses: matchedClasses };
    })
    .filter(Boolean);

  // --------------------------------------------------
  // 5) Phân chia record theo cấp học (nếu muốn)
  // --------------------------------------------------
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
        const classesInRange = record.awardClasses.filter((cls) => {
          if (!cls?.classInfo?.className) return false;
          const matched = cls.classInfo.className.match(/\d+/);
          if (!matched) return false;
          const classNumber = parseInt(matched[0], 10);
          return classNumber >= minClass && classNumber <= maxClass;
        });

        return {
          ...record,
          awardClasses: classesInRange,
        };
      })
      .filter((r) => r.awardClasses.length > 0);
  };

  // --------------------------------------------------
  // 6) Modal hiển thị chi tiết khi click 1 lớp
  // --------------------------------------------------
  const handleOpenModalClass = (record, cls) => {
    setModalRecord(record);
    setModalClass(cls);
    setShowModal(true);
    if (setSearchParams) {
      setSearchParams({
        recordId: record._id,
        classId: cls.classInfo?._id,
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalClass(null);
    if (setSearchParams) {
      setSearchParams({});
    }
  };

  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    // Ví dụ hiển thị "2024-2025" hay "Khóa 2024-2025"
    return syDoc?.code || syDoc?.name || "";
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

  // Lấy text từ DB (hoặc i18n)
  const rawText =
    i18n.language === "vi"
      ? currentCategory.name || t("award", "Danh hiệu")
      : currentCategory.nameEng || t("award", "Award");

  // Nếu DB lưu nhầm thành \\n, bạn có thể replace:
  const normalizedText = rawText.replace(/\\n/g, "\n");

  // Tách thành mảng theo ký tự xuống dòng
  const lines = normalizedText.split("\n");
  // --------------------------------------------------
  // 7) Giao diện
  // --------------------------------------------------
  return (
    <div className="lg:p-6 px-3 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề, mô tả và ảnh cover */}
      <div>
        <div className="flex flex-col shimmer-text-title text-center items-center justify-center uppercase leading-tight">
          {lines.map((line, idx) => {
            const textSize =
              idx === 0
                ? "text-[60px] font-[Metropolis]"
                : "text-[70px] font-black font-[Metropolis]";

            return (
              <div key={idx} className={textSize}>
                {line}
              </div>
            );
          })}
          <img src={`/halloffame/vector.png`} alt="Cover" />
        </div>
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <p className="mb-4 text-[#002855] text-justify font-semibold md:text-[18px] text-[15px]">
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
            <option value="">{t("selectSemester", "Chọn học kì")}</option>
            {distinctSemesters.map((num) => (
              <option key={num} value={num}>
                {t("semester", "Học kì")} {num}
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
            <option value="">{t("selectMonth", "Chọn tháng")}</option>
            {distinctMonths.map((m) => (
              <option key={m} value={m}>
                {t("month", "Tháng")} {m}
              </option>
            ))}
          </select>
        )}

        {/* Tìm kiếm (theo tên lớp) */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên lớp")}
            className="lg:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button
            onClick={() => console.log("Searching:", searchName)}
            className="absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full flex items-center justify-center hover:bg-[#001F3F] transition"
          >
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {/* Nếu đang gõ searchName => hiển thị flat, else => group theo khối */}
      {searchName.trim() ? (
        // ------------ 1) Hiển thị phẳng ------------
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords
            .flatMap((rec) =>
              rec.awardClasses.map((cls) => ({ record: rec, cls }))
            )
            .map((item, idx) => {
              const { record, cls } = item;
              return (
                <div
                  key={idx}
                  className="border  rounded-2xl p-5 shadow-sm bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => handleOpenModalClass(record, cls)}
                >
                  {classPhotos[cls.classInfo?._id] ? (
                    <img
                      src={`${BASE_URL}/${classPhotos[cls.classInfo?._id]}`}
                      alt={`Ảnh lớp ${cls.classInfo?.className}`}
                      className="mt-2 w-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="text-xs italic text-[#f9d16f]">
                      Chưa có ảnh
                    </div>
                  )}
                  <div className="text-[#f9d16f] shimmer-text text-[20px] font-bold">
                    {t("classLabel", "Lớp")} {cls.classInfo?.className}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        // ------------ 2) Hiển thị theo khối ------------
        <div className="space-y-6">
          {educationLevels.map((level) => {
            // Lọc records theo level (tiểu học, THCS, THPT)
            const levelRecords = filterRecordsByLevel(
              filteredRecords,
              level.minClass,
              level.maxClass
            );

            // Gom thành mảng classCards
            const classCards = [];
            levelRecords.forEach((rec) => {
              rec.awardClasses.forEach((cls) => {
                classCards.push({ record: rec, cls });
              });
            });

            // Nếu không có lớp nào => ẩn khối này
            if (classCards.length === 0) return null;

            return (
              <div
                key={level.id}
                className="w-full border-b border-gray-200 pb-4"
              >
                <div
                  className=" w-full flex justify-between items-center cursor-pointer py-4 text-[#002855] text-[22px] font-semibold"
                  onClick={() =>
                    setOpenLevel(openLevel === level.id ? null : level.id)
                  }
                >
                  <span>{level.name}</span>
                  <span className="text-gray-500 text-lg">
                    {openLevel === level.id ? (
                      <FaAngleDown />
                    ) : (
                      <FaAngleRight />
                    )}
                  </span>
                </div>
                {openLevel === level.id && (
                  <div className="p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {classCards.map((item, idx) => {
                        const { record, cls } = item;
                        return (
                          <div
                            key={idx}
                            className="border rounded-2xl shadow-sm p-5 bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                            onClick={() => handleOpenModalClass(record, cls)}
                          >
                            {classPhotos[cls.classInfo?._id] ? (
                              <img
                                src={`${BASE_URL}/${
                                  classPhotos[cls.classInfo?._id]
                                }`}
                                alt={`Ảnh lớp ${cls.classInfo?.className}`}
                                className="mt-2 w-full object-contain rounded-2xl"
                              />
                            ) : (
                              <div className="text-xs italic text-[#f9d16f]">
                                Chưa có ảnh
                              </div>
                            )}
                            <div className="text-[#f9d16f] shimmer-text text-[20px] font-bold">
                              {t("classLabel", "Lớp")}{" "}
                              {cls.classInfo?.className}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------- Modal hiển thị khi click 1 lớp ----------------- */}
      {showModal && modalClass && modalRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className="lg:w-[1200px] md:w-[80%] w-[95%] h-auto rounded-lg lg:py-16 lg:px-16 p-8 relative shadow-lg"
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
            {/* Nội dung modal */}
            <div className="w-full flex flex-col lg:flex-row gap-4">
              {/* Ảnh lớp */}
              <div className="w-full relative flex items-center justify-center">
                {classPhotos[modalClass.classInfo?._id] ? (
                  <img
                    src={`${BASE_URL}/${
                      classPhotos[modalClass.classInfo?._id]
                    }`}
                    alt="Class"
                    className="relative z-10 w-full h-auto object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="relative z-10 w-[518px] h-[377px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                    <span className="text-xs text-gray-400">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Thông tin lớp */}
              <div className="w-full lg:w-[670px] xl:w-[700px] flex flex-col">
                <h2 className="w-full lg:text-[24px] md:text-[20px] text-[16px] font-bold text-[#F9D16F] mb-2">
                  {t("classLabel", "Lớp")} {modalClass.classInfo?.className}
                </h2>

                <hr className="w-full border-t border-gray-100 my-2 lg:my-4" />

                <p className=" w-full mb-2 font-semibold text-white  text-[13px] md:text-[15px] lg:text-[18px]">
                  {getSubAwardLabel(modalRecord)}
                </p>

                <div className="w-full h-auto overflow-y-auto border-b-2 pb-4">
                  {(i18n.language === "vi"
                    ? modalClass.note
                    : modalClass.noteEng) && (
                    <p className=" text-white  my-auto text-justify lg:text-left text-[13px] md:text-[15px]">
                      {i18n.language === "vi"
                        ? modalClass.note
                        : modalClass.noteEng}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nút đóng */}
            <div className="flex w-full mx-auto items-center justify-center pt-5">
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
      {/* ----------------- End modal ----------------- */}
    </div>
  );
};

export default ClassHonorContent;
