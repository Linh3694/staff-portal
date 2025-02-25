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
const ClassHonorContent = ({ categoryId }) => {
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
      // Lọc khối
      if (selectedGradeRange) {
        const [minG, maxG] =
          selectedGradeRange === "primary"
            ? [1, 5]
            : selectedGradeRange === "secondary"
            ? [6, 9]
            : [10, 12];

        const matchAnyClassInRange = r.awardClasses.some((cls) => {
          const matched = cls.className?.match(/\d+/);
          if (!matched) return false;
          const classNumber = parseInt(matched[0], 10);
          return classNumber >= minG && classNumber <= maxG;
        });
        if (!matchAnyClassInRange) return false;
      }

      // Lọc theo "selectedClass" (nếu bạn có)
      if (selectedClass.trim()) {
        const matchExact = r.awardClasses.some(
          (cls) => cls.className === selectedClass.trim()
        );
        if (!matchExact) return false;
      }

      return true;
    })
    // Bước 2: Nếu có searchName => chỉ giữ lớp match, ngược lại giữ nguyên
    .map((record) => {
      if (!searchName.trim()) {
        // Không search => giữ nguyên
        return record;
      }

      const searchTerm = normalize(searchName.trim());
      // Lọc các lớp khớp với từ khoá
      const matchedClasses = record.awardClasses.filter((cls) => {
        const normName = normalize(cls.className || "");
        return normName.includes(searchTerm);
      });
      if (matchedClasses.length === 0) {
        // Record này không có lớp nào match => loại
        return null;
      }
      // Giữ record, nhưng chỉ với các lớp match
      return { ...record, awardClasses: matchedClasses };
    })
    // Bỏ qua record null (không có lớp match)
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
        // Lọc bớt classes không nằm trong range
        const classesInRange = record.awardClasses.filter((cls) => {
          if (!cls?.className) return false;
          const matched = cls.className.match(/\d+/);
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
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalClass(null);
  };

  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    // Ví dụ hiển thị "2024-2025" hay "Khóa 2024-2025"
    return syDoc?.code || syDoc?.name || "";
  };

  // (Tuỳ nhu cầu) Hàm này trả về text hiển thị cho danh hiệu
  const getSubAwardLabel = (rec) => {
    if (!rec?.subAward) return "";
    const { type, month, semester, schoolYear } = rec.subAward;
    let label = currentCategory.name || "Danh hiệu";
    if (type === "year") {
      // Tìm code SY
      const syDoc = schoolYears.find(
        (sy) => String(sy._id) === String(schoolYear)
      );
      const syCode = syDoc?.code || "";
      label += ` - Năm học ${syCode}`;
    } else if (type === "semester") {
      label += ` - Học kì ${semester}`;
    } else if (type === "month") {
      label += ` - Tháng ${month}`;
    }
    return label;
  };

  // --------------------------------------------------
  // 7) Giao diện
  // --------------------------------------------------
  return (
    <div className="p-10 min-w-[960px] mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề, mô tả và ảnh cover */}
      <div>
        <h2 className="text-[40px] text-[#F05023] text-center font-bold mb-2">
          {currentCategory.name || "Danh hiệu"}
        </h2>
        <div className="w-[900px] mx-auto text-left mt-4 mb-4">
          <p className="mb-4 text-[#002855] font-semibold text-[18px]">
            {currentCategory.description || ""}
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
                ? "text-[#002855] font-semibold text-[32px] border-b-2 border-[#002855]"
                : "text-[#757575] text-[24px]"
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
            className="w-[300px] py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
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
            className="w-[400px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
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
        <div className="grid grid-cols-3 gap-4">
          {filteredRecords
            .flatMap((rec) =>
              // Gom tất cả các lớp vào mảng
              rec.awardClasses.map((cls) => ({ record: rec, cls }))
            )
            .map((item, idx) => {
              const { record, cls } = item;
              return (
                <div
                  key={idx}
                  className="border rounded-lg p-3 shadow-sm bg-[#E6EEF6] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => handleOpenModalClass(record, cls)}
                >
                  {/* Ảnh lớp */}
                  {classPhotos[cls._id] ? (
                    <img
                      src={`${BASE_URL}/${classPhotos[cls._id]}`}
                      alt={`Ảnh lớp ${cls.className}`}
                      className="mt-2 w-[320px] h-[156px] object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-xs italic text-gray-400">
                      Chưa có ảnh
                    </div>
                  )}
                  {/* Tên lớp */}
                  <div className="text-[#F05023] text-[20px] font-bold mt-2">
                    {t("classLabel", "Lớp")} {cls.className}
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
              <div key={level.id} className="border-b border-gray-200 pb-4">
                <div
                  className="flex justify-between items-center cursor-pointer py-4 text-[#002855] text-[22px] font-semibold"
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
                    <div className="grid grid-cols-2 gap-6">
                      {classCards.map((item, idx) => {
                        const { record, cls } = item;
                        return (
                          <div
                            key={idx}
                            className="border rounded-2xl p-3 shadow-sm bg-[#E6EEF6] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                            onClick={() => handleOpenModalClass(record, cls)}
                          >
                            {classPhotos[cls._id] ? (
                              <img
                                src={`${BASE_URL}/${classPhotos[cls._id]}`}
                                alt={`Ảnh lớp ${cls.className}`}
                                className="mt-2 w-[640px] h-[312px] object-cover rounded-2xl"
                              />
                            ) : (
                              <div className="text-xs italic text-gray-400">
                                Chưa có ảnh
                              </div>
                            )}
                            <div className="text-[#F05023] text-[20px] font-bold mt-2">
                              {t("classLabel", "Lớp")} {cls.className}
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
          <div className="bg-white w-[980px] h-[569px] p-12 rounded-lg relative">
            {/* Nội dung modal */}
            <div className="flex gap-6">
              {/* Ảnh lớp */}
              <div className="relative items-center justify-center ">
                <div className="absolute -top-6 -left-4 w-[342px] h-[428px] bg-[#E6EEF6] rounded-lg shadow-lg"></div>
                {classPhotos[modalClass._id] ? (
                  <img
                    src={`${BASE_URL}/${classPhotos[modalClass._id]}`}
                    alt="Class"
                    className="relative z-10 w-[518px] h-[377px] object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="relative z-10 w-[518px] h-[377px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                    <span className="text-xs text-gray-400">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Thông tin lớp */}
              <div className="flex flex-col">
                <h2 className="text-[24px] font-bold text-[#F05023] mb-2">
                  {t("classLabel", "Lớp")} {modalClass.className}
                </h2>
                <span className="text-[#757575] text-[14px] font-semibold">
                  {t("schoolYearLabel", "Khóa")}{" "}
                  {findSchoolYearLabel(modalRecord.subAward?.schoolYear)}
                </span>

                <hr className="border-t border-gray-100 my-4 w-full" />

                <p className="mb-2 font-semibold text-[#002855] text-[18px]">
                  {getSubAwardLabel(modalRecord)}
                </p>

                {/* Tuỳ ý hiển thị thêm GVCN, mô tả, v.v.  */}
                {(i18n.language === "vi"
                  ? modalClass.note
                  : modalClass.noteEng) && (
                  <p className="italic text-[#002855] mt-2">
                    “
                    {i18n.language === "vi"
                      ? modalClass.note
                      : modalClass.noteEng}
                    ”
                  </p>
                )}
              </div>
            </div>

            <hr className="border-t-2 border-gray-100 mt-12 mb-5" />

            {/* Nút đóng */}
            <div className=" flex justify-center">
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
      {/* ----------------- End modal ----------------- */}
    </div>
  );
};

export default ClassHonorContent;
