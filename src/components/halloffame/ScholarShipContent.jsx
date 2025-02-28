import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaQuoteLeft,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { BiSolidQuoteLeft } from "react-icons/bi";

const ScholarShipContent = ({ categoryId }) => {
  const { t, i18n } = useTranslation();

  // --- States cho dữ liệu API ---
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);

  // --- States cho giao diện lọc ---
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSubAwardLabel, setSelectedSubAwardLabel] = useState("");
  const [searchName, setSearchName] = useState("");

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null); // record được chọn
  const [modalStudent, setModalStudent] = useState(null); // student được chọn

  // Lấy thông tin chi tiết của danh mục hiện tại từ API
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
  // 2) Thiết lập mặc định view cho danh mục theo subAward custom
  // -----------------------------

  useEffect(() => {
    if (currentCategory.subAwards?.length > 0) {
      // Lấy subAward đầu tiên có type "custom" làm mặc định
      const defaultSubAward = currentCategory.subAwards.find(
        (sub) => sub.type === "custom"
      );
      if (defaultSubAward) {
        setSelectedSubAwardLabel(defaultSubAward.label);
      }
    }
  }, [currentCategory]);

  // Cập nhật selectedSubAwardLabel khi selectedSchoolYearId thay đổi
  useEffect(() => {
    const filteredSubAwards = currentCategory.subAwards?.filter(
      (sub) =>
        sub.type === "custom" &&
        selectedSchoolYearId &&
        String(sub.schoolYear) === selectedSchoolYearId
    );
    if (filteredSubAwards && filteredSubAwards.length > 0) {
      // Nếu selectedSubAwardLabel không nằm trong danh sách subAward lọc được, chuyển sang nút đầu tiên
      if (
        !filteredSubAwards.some((sub) => sub.label === selectedSubAwardLabel)
      ) {
        setSelectedSubAwardLabel(filteredSubAwards[0].label);
      }
    } else {
      setSelectedSubAwardLabel("");
    }
  }, [selectedSchoolYearId, currentCategory.subAwards]);

  // -----------------------------
  // 3) Tính toán danh sách năm học liên quan dựa trên record có subAward type "custom"
  // -----------------------------
  const distinctSchoolYearIds = [
    ...new Set(
      (currentCategory.subAwards || [])
        .filter((sub) => sub.type === "custom" && sub.schoolYear)
        .map((sub) => String(sub.schoolYear))
    ),
  ];
  const relevantSchoolYears = schoolYears.filter((sy) =>
    distinctSchoolYearIds.includes(String(sy._id))
  );

  // -----------------------------
  // 4) Lọc record theo subAward custom, năm học và tên học sinh
  // -----------------------------
  const filteredBaseRecords = records.filter((r) => {
    return (
      r.awardCategory?._id === categoryId &&
      r.subAward?.type === "custom" &&
      r.subAward?.label === selectedSubAwardLabel &&
      String(r.subAward.schoolYear) === selectedSchoolYearId
    );
  });

  // Hàm normalize để tìm kiếm không phân biệt dấu và chữ hoa thường
  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalize(str) {
    return removeDiacritics(str)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  const filteredSearchRecords = !searchName.trim()
    ? filteredBaseRecords
    : filteredBaseRecords.reduce((acc, record) => {
        const searchTerm = normalize(searchName.trim());
        const filteredStudents = record.students.filter((stu) =>
          normalize(stu.student?.name || "").includes(searchTerm)
        );
        if (filteredStudents.length > 0) {
          acc.push({ ...record, students: filteredStudents });
        }
        return acc;
      }, []);

  // -----------------------------
  // 5) Các hàm xử lý mở/đóng Modal và hiển thị thông tin
  // -----------------------------
  const handleOpenModal = (record, student) => {
    setModalRecord(record);
    setModalStudent(student);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalStudent(null);
  };

  // Hàm trả về label của danh hiệu (subAward custom)
  const getSubAwardLabel = (record) => {
    if (!record?.subAward) return "";
    if (record.subAward.type === "custom") {
      return record.subAward.label;
    }
    return "";
  };

  // Hàm lấy tên (hoặc code) năm học
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    return syDoc?.code || syDoc?.name || "";
  };

  useEffect(() => {
    if (relevantSchoolYears.length > 0 && !selectedSchoolYearId) {
      setSelectedSchoolYearId(String(relevantSchoolYears[0]._id));
    }
  }, [relevantSchoolYears, selectedSchoolYearId]);

  return (
    <div className="p-6 min-w-[960px] mx-auto pt-[40px] overflow-y-auto">
      {/* Tiêu đề, mô tả và ảnh cover */}
      <div>
        <h2 className="text-[40px] text-[#F05023] text-center font-bold mb-2">
          {i18n.language === "vi"
            ? currentCategory.name || t("award", "Danh hiệu")
            : currentCategory.nameEng || t("award", "Award")}
        </h2>
        <div className="md:w-[900px] w-full mx-auto text-left mt-4 mb-4">
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

      {/* Các nút chọn subAward (custom) */}
      <div className="flex items-center justify-center mx-auto my-10 w-[1000px] gap-x-4">
        <button className="w-[36px] h-[36px] bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition">
          <FaChevronLeft className="text-white" />
        </button>
        <div className="grid grid-cols-3 gap-x-2 gap-y-8 flex-1 my-2">
          {currentCategory.subAwards
            ?.filter(
              (sub) =>
                sub.type === "custom" &&
                selectedSchoolYearId &&
                String(sub.schoolYear) === selectedSchoolYearId
            )
            .map((sub) => (
              <button
                key={sub.label}
                className={`text-center  ${
                  selectedSubAwardLabel === sub.label
                    ? "text-[#002855] text-[28px]  underline"
                    : "text-[#757575] text-[20px]"
                }`}
                onClick={() => setSelectedSubAwardLabel(sub.label)}
              >
                {sub.label}
              </button>
            ))}
        </div>
        <button className="w-[36px] h-[36px] bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition">
          <FaChevronRight className="text-white" />
        </button>
      </div>

      {/* Phần chọn năm học và tìm kiếm tên học sinh */}
      <div className="flex items-center space-x-4 my-4 justify-center">
        <select
          value={selectedSchoolYearId}
          onChange={(e) => setSelectedSchoolYearId(e.target.value)}
          className="w-[250px] py-2 border-none bg-[#F8F8F8] text-[#757575] rounded-2xl"
        >
          <option value="">{t("selectSchoolYear", "Chọn năm học")}</option>
          {relevantSchoolYears.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {t("schoolYear")} {findSchoolYearLabel(sy._id)}
            </option>
          ))}
        </select>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên")}
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

      {/* Hiển thị các record */}
      <div className="grid grid-cols-3 gap-x-4">
        {/* Cột thứ nhất */}
        <div className="space-y-4">
          {filteredSearchRecords
            .flatMap((record) =>
              record.students.map((student) => ({ record, student }))
            )
            .filter((_, idx) => idx % 3 === 0)
            .map((item, idx) => {
              const { record, student } = item;
              return (
                <div
                  key={`col1-${idx}`}
                  className="h-[300px] flex flex-row rounded-lg p-3 items-center justify-center bg-[#F9F9F9] cursor-pointer"
                  onClick={() => handleOpenModal(record, student)}
                >
                  {student.photo?.photoUrl ? (
                    <img
                      src={`${BASE_URL}/${student.photo.photoUrl}`}
                      alt="Student"
                      className="w-[180px] h-[260px] object-cover rounded items-center justify-center"
                    />
                  ) : (
                    <div className="text-xs italic text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </div>
                  )}
                  <div className="flex flex-col ml-3 justify-center">
                    <BiSolidQuoteLeft className="text-5xl text-gray-300" />
                    {(i18n.language === "vi"
                      ? student.note
                      : student.noteEng) && (
                      <>
                        <p className=" text-[#002855] line-clamp-5 text-[16px]">
                          {i18n.language === "vi"
                            ? student.note
                            : student.noteEng}
                        </p>
                        {(i18n.language === "vi"
                          ? student.note
                          : student.noteEng
                        ).length > 250 && (
                          <button
                            className="text-sm text-[#002855] font-semibold underline mt-1 text-left"
                            onClick={() => handleOpenModal(record, student)}
                          >
                            {t("readMore", "Xem toàn bộ")}
                          </button>
                        )}
                      </>
                    )}
                    <div className="text-[#F05023] text-[20px] font-bold text-left mt-2">
                      {student.student?.name}
                    </div>
                    <div className="text-sm text-[#757575] font-semibold text-left gap-4">
                      <span className="font-semibold mr-2">
                        {t("classLabel", "Lớp")}{" "}
                        {student.currentClass?.name ||
                          student.currentClass?.className ||
                          t("noClass", "Chưa cập nhật lớp")}
                      </span>
                      <span className="font-semibold">
                        {t("schoolYearLabel", "Khóa")}{" "}
                        {findSchoolYearLabel(record.subAward?.schoolYear)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Cột thứ hai - lùi xuống 1 chút */}
        <div className="space-y-4 mt-8">
          {filteredSearchRecords
            .flatMap((record) =>
              record.students.map((student) => ({ record, student }))
            )
            .filter((_, idx) => idx % 3 === 1)
            .map((item, idx) => {
              const { record, student } = item;
              return (
                <div
                  key={`col2-${idx}`}
                  className="h-[300px] flex flex-row rounded-lg p-3 items-center justify-center bg-[#F9F9F9] cursor-pointer"
                  onClick={() => handleOpenModal(record, student)}
                >
                  {student.photo?.photoUrl ? (
                    <img
                      src={`${BASE_URL}/${student.photo.photoUrl}`}
                      alt="Student"
                      className="w-[180px] h-[260px] object-cover rounded items-center justify-center"
                    />
                  ) : (
                    <div className="text-xs italic text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </div>
                  )}
                  <div className="flex flex-col ml-3 justify-center">
                    <BiSolidQuoteLeft className="text-5xl text-gray-300" />
                    {(i18n.language === "vi"
                      ? student.note
                      : student.noteEng) && (
                      <>
                        <p className=" text-[#002855] line-clamp-5 text-[16px]">
                          {i18n.language === "vi"
                            ? student.note
                            : student.noteEng}
                        </p>
                        {(i18n.language === "vi"
                          ? student.note
                          : student.noteEng
                        ).length > 250 && (
                          <button
                            className="text-sm text-[#002855] font-semibold underline mt-1 text-left"
                            onClick={() => handleOpenModal(record, student)}
                          >
                            {t("readMore", "Xem toàn bộ")}
                          </button>
                        )}
                      </>
                    )}
                    <div className="text-[#F05023] text-[20px] font-bold text-left mt-2">
                      {student.student?.name}
                    </div>
                    <div className="text-sm text-[#757575] font-semibold text-left gap-4">
                      <span className="font-semibold mr-2">
                        {t("classLabel", "Lớp")}{" "}
                        {student.currentClass?.name ||
                          student.currentClass?.className ||
                          t("noClass", "Chưa cập nhật lớp")}
                      </span>
                      <span className="font-semibold">
                        {t("schoolYearLabel", "Khóa")}{" "}
                        {findSchoolYearLabel(record.subAward?.schoolYear)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Cột thứ ba (giống cột 1) */}
        <div className="space-y-4">
          {filteredSearchRecords
            .flatMap((record) =>
              record.students.map((student) => ({ record, student }))
            )
            .filter((_, idx) => idx % 3 === 2)
            .map((item, idx) => {
              const { record, student } = item;
              return (
                <div
                  key={`col3-${idx}`}
                  className="h-[300px] flex flex-row rounded-lg p-3 items-center justify-center bg-[#F9F9F9] cursor-pointer"
                  onClick={() => handleOpenModal(record, student)}
                >
                  {student.photo?.photoUrl ? (
                    <img
                      src={`${BASE_URL}/${student.photo.photoUrl}`}
                      alt="Student"
                      className="w-[180px] h-[260px] object-cover rounded items-center justify-center"
                    />
                  ) : (
                    <div className="text-xs italic text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </div>
                  )}
                  <div className="flex flex-col ml-3 justify-center">
                    <BiSolidQuoteLeft className="text-5xl text-gray-300" />
                    {(i18n.language === "vi"
                      ? student.note
                      : student.noteEng) && (
                      <>
                        <p className=" text-[#002855] line-clamp-5 text-[16px]">
                          {i18n.language === "vi"
                            ? student.note
                            : student.noteEng}
                        </p>
                        {(i18n.language === "vi"
                          ? student.note
                          : student.noteEng
                        ).length > 250 && (
                          <button
                            className="text-sm text-[#002855] font-semibold underline mt-1 text-left"
                            onClick={() => handleOpenModal(record, student)}
                          >
                            {t("readMore", "Xem toàn bộ")}
                          </button>
                        )}
                      </>
                    )}
                    <div className="text-[#F05023] text-[20px] font-bold text-left mt-2">
                      {student.student?.name}
                    </div>
                    <div className="text-sm text-[#757575] font-semibold text-left gap-4">
                      <span className="font-semibold mr-2">
                        {t("classLabel", "Lớp")}{" "}
                        {student.currentClass?.name ||
                          student.currentClass?.className ||
                          t("noClass", "Chưa cập nhật lớp")}
                      </span>
                      <span className="font-semibold">
                        {t("schoolYearLabel", "Khóa")}{" "}
                        {findSchoolYearLabel(record.subAward?.schoolYear)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modal hiển thị chi tiết học sinh */}
      {showModal && modalStudent && modalRecord && (
        <div className="fixed inset-0  flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className=" w-[930px] bg-white rounded-lg pt-10 px-10 pb-5 relative shadow-lg">
            {/* Bố cục chia làm 2 phần: Ảnh bên trái - Thông tin bên phải */}
            <div className="flex space-x-6">
              {/* Khung ảnh với nền lệch */}
              <div className="relative">
                {/* Nền phía sau ảnh */}
                <div className="absolute -top-4 -left-4 w-[322px] h-[428px] bg-[#E6EEF6] rounded-lg shadow-lg"></div>

                {/* Ảnh chính */}
                {modalStudent.photo?.photoUrl ? (
                  <img
                    src={`${BASE_URL}/${modalStudent.photo.photoUrl}`}
                    alt="Student"
                    className="relative z-10 w-[3000px] h-[428px] object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="relative z-10 w-[342px] h-[428px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                    <span className="text-xs text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </span>
                  </div>
                )}
              </div>

              {/* Phần thông tin học sinh */}
              <div className="flex flex-col items-start justify-start">
                <div className="w-[500px] flex flex-col">
                  <h2 className="text-[24px] font-bold text-[#F05023]">
                    {modalStudent.student?.name}
                  </h2>
                  <div className="flex justify-start gap-6 mt-1 text-[#757575] text-[14px]">
                    <span className="font-semibold">
                      {t("classLabel", "Lớp")}{" "}
                      {modalStudent.currentClass?.name ||
                        modalStudent.currentClass?.className ||
                        t("noClass", "Chưa cập nhật lớp")}
                    </span>
                    <span className="font-semibold">
                      {t("schoolYearLabel", "Khóa")}{" "}
                      {findSchoolYearLabel(modalRecord.subAward?.schoolYear)}
                    </span>
                  </div>
                  <hr className="border-t border-gray-100 my-3 w-full" />
                </div>

                {/* Danh hiệu */}
                <p className="text-[#002855] font-semibold text-[18px]">
                  {getSubAwardLabel(modalRecord)}
                </p>

                {/* Nội dung lời nhắn */}
                {(i18n.language === "vi"
                  ? modalStudent.note
                  : modalStudent.noteEng) && (
                  <p className="italic text-[#002855] mt-2">
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

export default ScholarShipContent;
