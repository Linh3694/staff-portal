import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { API_URL, BASE_URL, CDN_URL } from "../../config";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AiOutlineDownCircle, AiOutlineLeftCircle } from "react-icons/ai";



const StudentHonorContent = ({
  categoryId,
  categoryName,
  setSearchParams,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // --- States cho dữ liệu API ---
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  // --- States cho giao diện lọc (filter) ---
  const [activeTab, setActiveTab] = useState("year");
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [searchName, setSearchName] = useState("");

  // State cho subAward được chọn
  const [selectedSubAwardLabel, setSelectedSubAwardLabel] = useState("");

  // 1. Thêm biến flag
  const [didSetDefaultSubAward, setDidSetDefaultSubAward] = useState(false);

  // Thêm state quản lý open/close cho từng openLevel
  const [openLevels, setOpenLevels] = useState({});

  // Lấy thông tin chi tiết của danh mục hiện tại từ dữ liệu API
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};

  // Lấy danh sách subAward (giả sử là loại 'year' hoặc tất cả đều cần hiển thị)
  const subAwards = (currentCategory.subAwards || []).slice(0, 7);

  // Chia 2 hàng: 3 trên, 4 dưới
  const subAwardsRow1 = subAwards.slice(0, 3);
  const subAwardsRow2 = subAwards.slice(3, 7);

  // Lấy subAward đang chọn
  const selectedSubAward = subAwards.find(sub => sub.label === selectedSubAwardLabel);

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
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const res = await axios.get(`${API_URL}/award-records`);
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setIsLoadingRecords(false);
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
    (r) => r.awardCategory?._id === categoryId && r.subAward?.type === "year"
  );

  const distinctSchoolYearIds = [
    ...new Set(
      recordsSameCatAndType.map((r) => String(r.subAward?.schoolYear))
    ),
  ].filter(Boolean);

  const recordsCatTypeYear = recordsSameCatAndType.filter(
    (r) => String(r.subAward?.schoolYear) === selectedSchoolYearId
  );

  // Lọc record theo subAward đã chọn
  const recordsOfSelectedSubAward = records.filter(
    (r) =>
      r.awardCategory?._id === categoryId &&
      r.subAward?.label === selectedSubAwardLabel
  );

  // Lấy danh sách schoolYearId từ các record này
  const schoolYearIdsOfSubAward = [
    ...new Set(recordsOfSelectedSubAward.map((r) => String(r.subAward?.schoolYear)))
  ].filter(Boolean);

  const relevantSchoolYears = schoolYears.filter((sy) =>
    schoolYearIdsOfSubAward.includes(String(sy._id))
  );

  // 2. Chỉ set subAward mặc định 1 lần khi dữ liệu đã sẵn sàng
  useEffect(() => {
    if (didSetDefaultSubAward) return;
    if (!schoolYears.length || !subAwards.length) return;
    const today = new Date();
    const currentSy = schoolYears.find((sy) => {
      const start = new Date(sy.startDate);
      const end = new Date(sy.endDate);
      return today >= start && today <= end;
    });
    let defaultLabel = "";
    if (currentSy) {
      const found = subAwards.find(sub => String(sub.schoolYear) === String(currentSy._id));
      if (found) defaultLabel = found.label;
    }
    if (!defaultLabel && subAwards.length > 0) defaultLabel = subAwards[0].label;
    setSelectedSubAwardLabel(defaultLabel);
    setDidSetDefaultSubAward(true);
  }, [schoolYears, subAwards, didSetDefaultSubAward]);

  // 3. Khi đổi subAward, chỉ set lại năm học, không set lại subAward
  useEffect(() => {
    if (!relevantSchoolYears.length) return;
    const today = new Date();
    const currentSy = relevantSchoolYears.find(sy => {
      const start = new Date(sy.startDate);
      const end = new Date(sy.endDate);
      return today >= start && today <= end;
    });
    if (currentSy) setSelectedSchoolYearId(currentSy._id);
    else setSelectedSchoolYearId(relevantSchoolYears[0]._id);
  }, [selectedSubAwardLabel, relevantSchoolYears]);

  // Lọc record theo cả subAward và schoolYear
  const filteredBaseRecords = records.filter((r) => {
    if (r.awardCategory?._id !== categoryId) return false;
    if (r.subAward?.label !== selectedSubAwardLabel) return false;
    if (!selectedSchoolYearId) return false;
    if (String(r.subAward?.schoolYear) !== selectedSchoolYearId) return false;
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

  // Thêm các hàm xử lý mới
  const processRecordsByType = (records) => {
    if (!selectedSubAward) return [];

    const subAwardType = selectedSubAward.label;
    
    // Xử lý cho AP, IELTS, YLE
    if (['AP', 'IELTS', 'YLE'].includes(subAwardType)) {
      const scoreGroups = {};
      records.forEach(record => {
        record.students.forEach(student => {
          const score = student.score || student.result || '';
          if (!scoreGroups[score]) {
            scoreGroups[score] = [];
          }
          scoreGroups[score].push({ record, student });
        });
      });
      
      // Chuyển thành mảng và sắp xếp theo điểm từ thấp đến cao
      return Object.entries(scoreGroups)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([score, items]) => ({
          title: score,
          items
        }));
    }
    
    // Xử lý cho KET-PET-FCE, TOEFL
    if (['KET-PET-FCE', 'TOEFL'].includes(subAwardType)) {
      const testGroups = {};
      records.forEach(record => {
        record.students.forEach(student => {
          const testName = student.testName || student.examName || student.exam || '';
          if (!testGroups[testName]) {
            testGroups[testName] = [];
          }
          testGroups[testName].push({ record, student });
        });
      });
      
      // Chuyển thành mảng và sắp xếp theo tên bài thi
      return Object.entries(testGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([testName, items]) => ({
          title: testName,
          items
        }));
    }
    
    // Xử lý cho SAT, PSAT
    if (['SAT', 'PSAT'].includes(subAwardType)) {
      const allStudents = records.flatMap(record => 
        record.students.map(student => ({ record, student }))
      );
      
      // Sắp xếp theo điểm từ cao đến thấp
      return [{
        title: '',
        items: allStudents.sort((a, b) => 
          (Number(b.student.score) || 0) - (Number(a.student.score) || 0)
        )
      }];
    }
    
    // Mặc định trả về tất cả record không phân nhóm
    return [{
      title: '',
      items: records.flatMap(record => 
        record.students.map(student => ({ record, student }))
      )
    }];
  };

  // Lấy danh sách đã xử lý
  const processedRecords = useMemo(() => {
    const groups = processRecordsByType(filteredSearchRecords);
    // Nếu là số thì sort giảm dần, nếu không thì sort alphabet giảm dần
    return groups.sort((a, b) => {
      const aNum = Number(a.title);
      const bNum = Number(b.title);
      if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
      return String(b.title).localeCompare(String(a.title));
    });
  }, [filteredSearchRecords, selectedSubAward]);

  // Khi processedRecords thay đổi, chỉ reset openLevels khi số lượng group thay đổi
  const prevGroupCount = useRef(0);
  useEffect(() => {
    if (processedRecords.length > 0 && processedRecords.length !== prevGroupCount.current) {
      const newOpen = {};
      processedRecords.forEach((g, idx) => {
        newOpen[g.title] = idx === 0; // chỉ mở level đầu tiên
      });
      setOpenLevels(newOpen);
      prevGroupCount.current = processedRecords.length;
    }
  }, [processedRecords]);

  // Hàm toggle openLevel
  const toggleLevel = (title) => {
    setOpenLevels((prev) => ({ ...prev, [title]: !prev[title] }));
  };

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
          <img src={`${CDN_URL}/HallOfFame/vector.png`} alt="Cover" />
        </div>
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <div className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </div>
        </div>
        {currentCategory.coverImage && (
          <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
            {/* Lớp dưới cùng: ảnh coverImage */}
            <img
              src={`${BASE_URL}/${currentCategory.coverImage}`}
              alt="Cover"
              className="w-full max-h-[470px] object-cover"
            />
            {/* Lớp giữa: khung frame-cover.png đè lên */}
            <img
              src={`${CDN_URL}/HallOfFame/frame-cover.png`}
              alt="Frame Cover"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            {/* Lớp trên cùng: text ở góc trên bên phải căn giữa theo chiều dọc */}
            <div className="absolute top-0 right-0 h-full flex items-center justify-center pr-4">
              <div className="text-[#f9d16f] text-right lg:mr-8 lg:mt-12 leading-tight ">
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thay tiêu đề Năm học bằng 2 hàng nút subAward, style giống ảnh */}
      <div className="flex flex-col items-center justify-center mb-10 mt-10 w-full">
        <div className="flex w-full max-w-4xl justify-center gap-x-48 mb-4">
          {subAwardsRow1.map((sub) => (
            <button
              key={sub.label}
              className={`min-w-[180px] max-w-[250px] px-4 py-2 text-xl font-semibold uppercase transition-all duration-200 bg-transparent
                ${selectedSubAwardLabel === sub.label ? "text-[#002855] underline underline-offset-4" : "text-gray-600"}`}
              onClick={() => setSelectedSubAwardLabel(sub.label)}
            >
              {sub.label}
            </button>
          ))}
        </div>
        <div className="flex w-full max-w-4xl justify-center gap-x-52">
          {subAwardsRow2.map((sub) => (
            <button
              key={sub.label}
              className={`min-w-[180px] max-w-[250px] px-4 py-2 text-xl font-semibold uppercase transition-all duration-200 bg-transparent
                ${selectedSubAwardLabel === sub.label ? "text-[#002855] underline underline-offset-4" : "text-gray-600"}`}
              onClick={() => setSelectedSubAwardLabel(sub.label)}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 my-12">
        <select
          className="lg:w-[300px] py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
          value={selectedSchoolYearId}
          onChange={(e) => {
            setSelectedSchoolYearId(e.target.value);
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

        <div className="relative flex items-center justify-items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên")}
            className="lg:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className="hidden absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full lg:flex items-center justify-center hover:bg-[#001F3F] transition">
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {/* Thông tin subAward theo ngôn ngữ hiện tại */}
      {selectedSubAward && (
        <div className="w-full mx-auto mb-8">
          <div className="text-[#002855] font-bold text-3xl mb-4">
            {i18n.language === 'vi'
              ? selectedSubAward.label
              : selectedSubAward.labelEng || selectedSubAward.label}
          </div>
          {(i18n.language === 'vi'
            ? selectedSubAward.description
            : selectedSubAward.descriptionEng || selectedSubAward.description) && (
            <div className="text-black text-lg mb-2">
              {i18n.language === 'vi'
                ? selectedSubAward.description
                : selectedSubAward.descriptionEng || selectedSubAward.description}
            </div>
          )}
        </div>
      )}

      {/* Phần hiển thị record mới */}
      <div className="space-y-8">
        {processedRecords.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            {group.title && (
              <div
                className="flex items-center border-b border-gray-300 pb-5 justify-between cursor-pointer select-none text-[#002855] font-bold text-2xl mb-4"
                onClick={() => toggleLevel(group.title)}
              >
                <span>{group.title}</span>
                <span className="ml-2">
                  {openLevels[group.title] ? (
                    <AiOutlineDownCircle size={32} />
                  ) : (
                    <AiOutlineLeftCircle size={32} />
                  )}
                </span>
              </div>
            )}
            {openLevels[group.title] !== false && (
              <div className="grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px]">
                {group.items.map((item, idx) => {
                  const { record, student } = item;
                  // Lấy tên lớp
                  const className = student.currentClass?.name || student.currentClass?.className || t("noClass", "Chưa cập nhật lớp");
                  // Lấy năm học
                  const schoolYearLabel = record.subAward?.schoolYear ? findSchoolYearLabel(record.subAward.schoolYear) : "";
                  // Lấy điểm
                  const score = student.score || student.result || "";
                  // Lấy tên bài thi
                  const testName = student.testName || student.examName || student.exam || "";
                  return (
                    <div
                      key={idx}
                      className="lg:h-[400px] lg:w-[250px] w-[180px] h-[350px] border rounded-[30px] shadow-sm lg:py-[30px] lg:px-[25px] px-[15px] py-[20px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-4"
                    >
                      {student.photo?.photoUrl ? (
                        <img
                          src={`${BASE_URL}/${student.photo.photoUrl}`}
                          alt="Student"
                          className="h-[150px] w-[150px] object-cover object-top rounded-full border-4 border-white shadow-md mb-2"
                        />
                      ) : (
                        <div className="h-[150px] w-[150px] flex items-center justify-center rounded-full bg-gray-200 text-xs italic text-gray-400 mb-2">
                          {t("noPhoto", "Chưa có ảnh")}
                        </div>
                      )}
                      <div className="text-white text-[22px] font-bold text-center">
                        {student.student?.name}
                      </div>
                      <div className="text-white text-[18px] font-semibold text-center">
                        Lớp: {className}{schoolYearLabel ? ` - ${schoolYearLabel}` : ""}
                      </div>
                      {score && (
                        <div className="text-white text-[48px] font-bold text-center">
                          {score}
                        </div>
                      )}
                      {testName && (
                        <div className="text-white text-[16px] text-center">
                          {testName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentHonorContent;

