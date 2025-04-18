import React, { useState, useEffect } from 'react';
import { FaTrashCan } from 'react-icons/fa6';
import axios from 'axios';

const RecordModal = ({
  showRecordModal,
  setShowRecordModal,
  editingCategory,
  selectedSubAward,
  onSubAwardSelect,
  handleExcelUpload: originalHandleExcelUpload,
  handleExcelClassUpload: originalHandleExcelClassUpload,
  anyRecordChanged,
  handleSaveAllChanges,
  selectedSubAwardRecords,
  handleDeleteAllRecords,
  excelRecordCount,
  excelClassCount,
  setExcelStudents,
  setExcelClasses,
  setExcelRecordCount,
  setExcelClassCount,
  handleRecordSubmit,
  handleAddNewRecord,
  handleAddNewClassRecord,
  classesList,
  setSelectedSubAwardRecords,
  API_URL,
  categories,
  schoolYears,
  studentsList
}) => {
  const [selectedCategory, setSelectedCategory] = useState(editingCategory || "");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubAwardLocal, setSelectedSubAwardLocal] = useState("");
  const [availableSubAwards, setAvailableSubAwards] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  // --- Local UI state (moved from parent) ---
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [tempKeyword, setTempKeyword] = useState("");
  const [tempKeywordEng, setTempKeywordEng] = useState("");
  const [tempActivity, setTempActivity] = useState("");
  const [tempActivityEng, setTempActivityEng] = useState("");
  const [tempNote, setTempNote] = useState("");
  const [tempNoteEng, setTempNoteEng] = useState("");

  const [classInput, setClassInput] = useState("");
  const [tempClassNote, setTempClassNote] = useState("");
  const [tempClassNoteEng, setTempClassNoteEng] = useState("");
  useEffect(() => {
    console.log('Current values:', {
      editingCategory,
      selectedCategory,
      selectedYear,
      selectedSubAwardLocal,
      availableSubAwards: availableSubAwards.length
    });
  }, [editingCategory, selectedCategory, selectedYear, selectedSubAwardLocal, availableSubAwards]);

  useEffect(() => {
    if (selectedCategory && selectedYear && categories && categories.length > 0) {
      const category = categories.find(cat => cat._id === selectedCategory);
      if (category) {
        console.log('Updating availableSubAwards for category:', category.name);
        const subAwards = category.subAwards
          .filter(sa => sa.schoolYear === selectedYear)
          .map(sa => ({
            ...sa,
            _id: sa._id || `${sa.type}-${sa.label}-${sa.schoolYear}-${sa.semester || ''}-${sa.month || ''}`
          }));
        setAvailableSubAwards(subAwards);
      }
    } else {
      console.log('Clearing availableSubAwards due to missing dependencies');
      setAvailableSubAwards([]);
    }
  }, [selectedCategory, selectedYear, categories]);

  useEffect(() => {
    if (editingCategory) {
      setSelectedCategory(editingCategory);
      const category = categories?.find(cat => cat._id === editingCategory);
      if (category) {
        console.log('Found category:', category);
      }
    }
  }, [editingCategory, categories]);
  
  // --- Auto‑fetch records for the selected sub‑award ---
  useEffect(() => {
    const fetchRecordsForSubAward = async () => {
      if (!selectedCategory || !selectedSubAwardLocal) return;
      
      // Xác định sub‑award từ danh sách hiện có
      const subAward = availableSubAwards.find(
        (sa) => sa._id === selectedSubAwardLocal
      );
      if (!subAward) return;
      
      try {
        // Lấy tất cả records rồi lọc phía client (API hiện chưa hỗ trợ filter)
        const res = await axios.get(`${API_URL}/award-records`);
        const filtered = res.data
          .filter(
            (record) =>
              record.awardCategory &&
              record.awardCategory._id === selectedCategory &&
              record.subAward &&
              record.subAward.label === subAward.label &&
              record.subAward.type === subAward.type &&
              String(record.subAward.schoolYear) === String(subAward.schoolYear) &&
              (record.subAward.semester || 0) === (subAward.semester || 0) &&
              (record.subAward.month || 0) === (subAward.month || 0)
          )
          .map((record) => {
            // Bổ sung thông tin lớp (nếu có) để hiển thị đẹp hơn
            if (record.awardClasses && record.awardClasses.length > 0) {
              return {
                ...record,
                awardClasses: record.awardClasses.map((ac) => ({
                  ...ac,
                  class:
                    classesList.find((c) => c._id === ac.class) || ac.class,
                })),
              };
            }
            return record;
          });
      
        // Cập nhật danh sách record ở parent (nếu setter được truyền)
        if (setSelectedSubAwardRecords) {
          setSelectedSubAwardRecords(filtered);
        }
      } catch (error) {
        console.error("Error fetching records for sub‑award:", error);
        if (setSelectedSubAwardRecords) setSelectedSubAwardRecords([]);
      }
    };
    
    fetchRecordsForSubAward();
  }, [
    selectedCategory,
    selectedSubAwardLocal,
    availableSubAwards,
    classesList,
    setSelectedSubAwardRecords,
    API_URL,
  ]);

  const handleSubAwardChange = (subAwardId) => {
    console.log('handleSubAwardChange called with:', subAwardId);
    setSelectedSubAwardLocal(subAwardId);
    
    const subAward = availableSubAwards.find(sa => sa._id === subAwardId);
    if (subAward) {
      console.log('Found subAward:', subAward);
      const category = categories.find(cat => 
        cat.subAwards.some(sa => 
          sa.type === subAward.type && 
          sa.label === subAward.label && 
          sa.schoolYear === subAward.schoolYear
        )
      );
      if (category) {
        console.log('Setting category to:', category._id);
        setSelectedCategory(category._id);
      }
    }
    if (onSubAwardSelect && subAward) {
      onSubAwardSelect(subAward);
    }
  };

  const handleExcelUpload = async (e) => {
    // Kiểm tra điều kiện trước khi upload
    if (!editingCategory) {
      alert("Vui lòng chọn loại vinh danh trước khi tải file");
      if (e.target) e.target.value = null;
      return;
    }

    // Lấy giá trị trực tiếp từ DOM thay vì dựa vào state
    const yearSelect = document.querySelector('select[name="schoolYear"]');
    const subAwardSelect = document.querySelector('select[name="subAward"]');
    
    if (!yearSelect || !subAwardSelect || !yearSelect.value || !subAwardSelect.value) {
      alert("Vui lòng chọn đầy đủ Năm học và Loại vinh danh con trước khi tải file");
      if (e.target) e.target.value = null;
      return;
    }
    
    const selectedYearValue = yearSelect.value;
    const selectedSubAwardValue = subAwardSelect.value;
    
    if (!selectedYearValue || !selectedSubAwardValue) {
      alert("Vui lòng chọn đầy đủ Năm học và Loại vinh danh con trước khi tải file");
      if (e.target) e.target.value = null;
      return;
    }

    // Tìm loại vinh danh con đã chọn
    const selectedSubAwardOption = subAwardSelect.options[subAwardSelect.selectedIndex];
    const subAwardLabel = selectedSubAwardOption ? selectedSubAwardOption.text : '';
    
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Lấy danh sách học sinh hiện có trong subAward này
      const existingRecords = await axios.get(`${API_URL}/award-records`, {
        params: {
          awardCategory: editingCategory,
          subAwardLabel: subAwardLabel,
          subAwardType: selectedSubAwardValue.split('-')[0],
          subAwardSchoolYear: selectedYearValue,
          subAwardSemester: selectedSubAwardValue.split('-')[3] || 0,
          subAwardMonth: selectedSubAwardValue.split('-')[4] || 0,
        }
      });

      const existingStudentIds = new Set();
      existingRecords.data.forEach(record => {
        record.students?.forEach(student => {
          if (student.student) {
            existingStudentIds.add(typeof student.student === 'object' ? student.student._id : student.student);
          }
        });
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("awardCategory", editingCategory);
      formData.append("subAwardId", selectedSubAwardValue);
      formData.append("schoolYear", selectedYearValue);
      formData.append("subAwardLabel", subAwardLabel);

      const response = await axios.post(`${API_URL}/award-records/upload-excel`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.students) {
        /* ---------- Validate records strictly so preview == submit ---------- */
        const fileStudentIds = new Set();      // chống trùng ngay trong file
        const validStudents = [];
 
        response.data.students.forEach((stu) => {
          const studentId =
            typeof stu.student === "object" ? stu.student._id : stu.student;
 
          // Bỏ qua nếu ID trống, đã tồn tại trong DB, hoặc bị lặp trong file
          if (
            !studentId ||
            existingStudentIds.has(studentId) ||
            fileStudentIds.has(studentId)
          ) {
            return;
          }
 
          // Bỏ qua nếu thiếu ghi chú (giống logic trong handleRecordSubmit)
          if (!stu.note || String(stu.note).trim() === "") return;
 
          fileStudentIds.add(studentId);
          validStudents.push(stu);
        });
 
        // Thêm thông tin category vào mỗi student
        const studentsWithCategory = validStudents.map((stu) => ({
          ...stu,
          awardCategory: editingCategory,
        }));
 
        setExcelStudents(studentsWithCategory);
        setExcelRecordCount(studentsWithCategory.length);
 
        setPreviewData({
          count: studentsWithCategory.length,
          totalInFile: response.data.students.length,
          duplicates: response.data.students.length - studentsWithCategory.length,
          type: "students",
        });
 
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Excel upload (students) error:", error.response || error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tải file. Vui lòng thử lại!");
      if (e.target) e.target.value = null;
      setShowPreview(false);
      setPreviewData(null);
    }
  };

  const handleExcelClassUpload = async (e) => {
    // Kiểm tra điều kiện trước khi upload
    if (!editingCategory) {
      alert("Vui lòng chọn loại vinh danh trước khi tải file");
      if (e.target) e.target.value = null;
      return;
    }

    // Lấy giá trị trực tiếp từ DOM thay vì dựa vào state
    const yearSelect = document.querySelector('select[name="schoolYear"]');
    const subAwardSelect = document.querySelector('select[name="subAward"]');
    
    if (!yearSelect || !subAwardSelect || !yearSelect.value || !subAwardSelect.value) {
      alert("Vui lòng chọn đầy đủ Năm học và Loại vinh danh con trước khi tải file");
      if (e.target) e.target.value = null;
      return;
    }
    
    const selectedYearValue = yearSelect.value;
    const selectedSubAwardValue = subAwardSelect.value;
    
    if (!selectedYearValue || !selectedSubAwardValue) {
      alert("Vui lòng chọn đầy đủ Năm học và Loại vinh danh con trước khi tải file");
      if (e.target) e.target.value = null;
      return;
    }

    // Tìm loại vinh danh con đã chọn
    const selectedSubAwardOption = subAwardSelect.options[subAwardSelect.selectedIndex];
    const subAwardLabel = selectedSubAwardOption ? selectedSubAwardOption.text : '';
    
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("awardCategory", editingCategory);
      formData.append("subAwardId", selectedSubAwardValue);
      formData.append("schoolYear", selectedYearValue);
      formData.append("subAwardLabel", subAwardLabel);

      const response = await axios.post(`${API_URL}/award-records/upload-excel-classes`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.classes) {
        // Lấy danh sách lớp hiện có trong subAward này
        const existingRecords = await axios.get(`${API_URL}/award-records`, {
          params: {
            awardCategory: editingCategory,
            subAwardLabel: subAwardLabel,
            subAwardType: selectedSubAwardValue.split('-')[0],
            subAwardSchoolYear: selectedYearValue,
            subAwardSemester: selectedSubAwardValue.split('-')[3] || 0,
            subAwardMonth: selectedSubAwardValue.split('-')[4] || 0,
          }
        });

        const existingClassIds = new Set();
        existingRecords.data.forEach(record => {
          record.awardClasses?.forEach(awardClass => {
            if (awardClass.class) {
              existingClassIds.add(typeof awardClass.class === 'object' ? awardClass.class._id : awardClass.class);
            }
          });
        });

        // Lọc trùng
        const uniqueClasses = response.data.classes.filter((cls) => {
          const classId = typeof cls.class === 'object' ? cls.class._id : cls.class;
          return !existingClassIds.has(classId);
        });

        // Thêm thông tin category vào mỗi class
        const classesWithCategory = uniqueClasses.map((cls) => ({
          ...cls,
          awardCategory: editingCategory,
        }));

        setExcelClasses(classesWithCategory);
        setExcelClassCount(classesWithCategory.length);
        setPreviewData({
          count: classesWithCategory.length,
          totalInFile: response.data.classes.length,
          duplicates: response.data.classes.length - classesWithCategory.length,
          type: 'classes',
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tải file. Vui lòng thử lại!");
      if (e.target) e.target.value = null;
      setShowPreview(false);
      setPreviewData(null);
    }
  };

  if (!showRecordModal) return null;

  if (!categories || categories.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="bg-white p-6 rounded-lg relative">
          <div className="text-red-500">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  // --- Local helpers ---
const handleSearchChange = (e) => {
  const value = e.target.value;
  setSearchInput(value);

  if (!value.trim()) {
    setFilteredStudents([]);
    setShowSuggestions(false);
    return;
  }

  const filtered = studentsList.filter(
    (s) =>
      s.studentCode.toLowerCase().includes(value.toLowerCase()) ||
      s.name.toLowerCase().includes(value.toLowerCase())
  );
  setFilteredStudents(filtered);
  setShowSuggestions(true);
};

const handleSelectStudent = (student) => {
  console.log("Selecting student:", student);
  // Đảm bảo student có _id hợp lệ
  if (student && student._id) {
    // Kiểm tra nếu _id có định dạng đúng (24 ký tự hexa)
    if (typeof student._id === 'string' && /^[0-9a-fA-F]{24}$/.test(student._id)) {
      setSelectedStudent(student);
      setSearchInput(student.studentCode);
      setFilteredStudents([]);
      setShowSuggestions(false);
    } else {
      console.error("Invalid student ID format:", student._id);
      alert(`ID học sinh không hợp lệ: ${student._id}`);
    }
  } else {
    console.error("Student object missing _id:", student);
    alert("Thông tin học sinh không hợp lệ");
  }
};

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowRecordModal(false)}></div>
      <div className="bg-white max-w-[90%] p-6 rounded-lg relative max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Năm học
            </label>
            <select
              name="schoolYear"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedSubAwardLocal("");
              }}
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#002855]"
            >
              <option value="">Chọn năm học</option>
              {schoolYears.map((year) => (
                <option key={year._id} value={year._id}>
                  {year.code || year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại vinh danh con
            </label>
            <select
              name="subAward"
              value={selectedSubAwardLocal}
              onChange={(e) => handleSubAwardChange(e.target.value)}
              className=" border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#002855]"
              disabled={!selectedYear}
            >
              <option value="">Chọn loại vinh danh con</option>
              {availableSubAwards.map((subAward) => (
                <option key={subAward._id} value={subAward._id}>
                  {subAward.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full pl-4 overflow-y-hidden hover:overflow-y-auto" style={{ maxHeight: "80vh" }}>
          {!selectedCategory ? (
            <div className="text-red-500">Vui lòng chọn loại vinh danh</div>
          ) : !selectedYear ? (
            <div className="text-red-500">Vui lòng chọn năm học</div>
          ) : !selectedSubAwardLocal ? (
            <div className="text-red-500">Vui lòng chọn loại vinh danh con</div>
          ) : (
            <div className="mb-4">
              <div className="p-3 rounded-t">
                <div className="flex justify-end items-center">
                  <div className="space-x-2">
                    <a
                      href="/record-sample.xlsx"
                      download
                      className="bg-[#002855] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                    >
                      Tải file mẫu
                    </a>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                      id="excel-students"
                    />
                    <label
                      htmlFor="excel-students"
                      className="bg-[#002855] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                    >
                      Thêm học sinh
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        console.log("Class file upload triggered");
                        handleExcelClassUpload(e);
                      }}
                      className="hidden"
                      id="excel-classes"
                    />
                    <label
                      htmlFor="excel-classes"
                      className="bg-[#002855] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                      onClick={() => console.log("Upload class button clicked")}
                    >
                      Thêm lớp
                    </label>
                    {anyRecordChanged && (
                      <button
                        onClick={handleSaveAllChanges}
                        className="bg-[#009483] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                      >
                        Cập nhật tất cả
                      </button>
                    )}
                    {selectedSubAwardRecords.length > 0 && (
                      <button
                        onClick={handleDeleteAllRecords}
                        className="bg-[#DC0909] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                      >
                        Xóa tất cả dữ liệu
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showPreview && previewData && (
                <div className="mt-4 flex items-center justify-end space-x-4">
                  <div className="bg-green-50 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium text-green-700">
                      {previewData.type === 'students' ? (
                        <>
                          Trong file có {previewData.totalInFile} học sinh, có thể thêm {previewData.count}{' '}
                          học sinh mới{previewData.duplicates > 0 && <> ({previewData.duplicates} trùng)</>}
                        </>
                      ) : (
                        <>
                          Trong file có {previewData.totalInFile} lớp, có thể thêm {previewData.count}{' '}
                          lớp mới{previewData.duplicates > 0 && <> ({previewData.duplicates} trùng)</>}
                        </>
                      )}
                    </span>
                  </div>
                  {previewData.count > 0 && (
                    <button
                      onClick={handleRecordSubmit}
                      className="bg-[#009483] hover:bg-[#008577] text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                    >
                      <span>Xác nhận thêm</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                        {previewData.count} {previewData.type === 'students' ? 'học sinh mới' : 'lớp mới'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="rounded-b">
                <table className="min-w-full">
                  <thead>
                    <tr className="!border-px !border-gray-400">
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">Mã học sinh/ Lớp</p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">3 Keywords</p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">3 Keywords (EN)</p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">5 Activities</p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">5 Activities (EN)</p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">Ghi chú</p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">Ghi chú (EN)</p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">Hành động</p>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="border-b">
                      <td className="py-3 pr-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchInput}
                            onChange={handleSearchChange}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="Nhập mã hoặc tên học sinh..."
                            className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                          />
                          {showSuggestions && filteredStudents.length > 0 && !selectedStudent && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredStudents.map((student) => (
                                <div
                                  key={student._id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleSelectStudent(student)}
                                >
                                  <div className="text-sm font-bold">
                                    {student.studentCode} - {student.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempKeyword}
                          onChange={(e) => setTempKeyword(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập keyword (cách dấu ',')"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempKeywordEng}
                          onChange={(e) => setTempKeywordEng(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập keyword tiếng Anh"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempActivity}
                          onChange={(e) => setTempActivity(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập activity (cách dấu ',')"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempActivityEng}
                          onChange={(e) => setTempActivityEng(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập activity tiếng Anh"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập ghi chú"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempNoteEng}
                          onChange={(e) => setTempNoteEng(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập ghi chú tiếng Anh"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              console.log("Selected student:", selectedStudent);
                              
                              // Xử lý student ID trước khi gửi
                              let finalStudentId = null;
                              if (selectedStudent) {
                                if (typeof selectedStudent === 'object' && selectedStudent._id) {
                                  finalStudentId = selectedStudent._id;
                                } else {
                                  finalStudentId = selectedStudent;
                                }
                              }
                              
                              if (!finalStudentId) {
                                alert("Vui lòng chọn học sinh");
                                return;
                              }
                              
                              handleAddNewRecord({
                                selectedStudent: finalStudentId,
                                tempNote,
                                tempNoteEng,
                                tempKeyword,
                                tempKeywordEng,
                                tempActivity,
                                tempActivityEng,
                                selectedCategory,
                                selectedSubAwardLocal,
                                availableSubAwards
                              });
                            }}
                            className="text-white bg-[#002855] p-1 rounded-[8px]"
                            title="Thêm mới"
                            disabled={!selectedStudent}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {selectedStudent && (
                            <button
                              onClick={() => {
                                setSelectedStudent(null);
                                setSearchInput("");
                                setTempNote("");
                                setTempNoteEng("");
                                setTempKeyword("");
                                setTempKeywordEng("");
                                setTempActivity("");
                                setTempActivityEng("");
                              }}
                              className="text-red-500 hover:text-red-600 p-1 rounded-[8px] hover:bg-red-50"
                              title="Hủy"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 pr-4">
                        <select
                          value={classInput}
                          onChange={(e) => setClassInput(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                        >
                          <option value="">Chọn lớp...</option>
                          {classesList.map((cls) => (
                            <option key={cls._id} value={cls._id}>
                              {cls.className}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td colSpan="5" className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempClassNote}
                          onChange={(e) => setTempClassNote(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập ghi chú cho lớp"
                          disabled={!classInput}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempClassNoteEng}
                          onChange={(e) => setTempClassNoteEng(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập ghi chú tiếng Anh"
                          disabled={!classInput}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={handleAddNewClassRecord}
                            className="text-white bg-[#002855] p-1 rounded-[8px]"
                            title="Thêm mới"
                            disabled={!classInput}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {classInput && (
                            <button
                              onClick={() => {
                                setClassInput("");
                                setTempClassNote("");
                                setTempClassNoteEng("");
                              }}
                              className="text-red-500 hover:text-red-600 p-1 rounded-[8px] hover:bg-red-50"
                              title="Hủy"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {selectedSubAwardRecords.map((record, index) => (
                      <React.Fragment key={record._id}>
                        {record.students?.map((student, studentIndex) => (
                          <tr key={`student-${studentIndex}`}>
                            <td className="py-3 pr-4">
                              <input
                                type="text"
                                value={student.student?.studentCode || ""}
                                readOnly
                                className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.keyword ? student.keyword.join(", ") : ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                  placeholder="Nhập keyword (cách dấu ',')"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={student.keyword ? student.keyword.join(", ") : ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents = rec.students.map((stu, sIdx) => {
                                          if (sIdx !== studentIndex) return stu;
                                          return {
                                            ...stu,
                                            keyword: newValue.split(",").map((item) => item.trim()).filter(Boolean),
                                          };
                                        });
                                        return { ...rec, isChanged: true, students: updatedStudents };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                  placeholder="Nhập keyword (cách dấu ',')"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.keywordEng ? student.keywordEng.join(", ") : ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                  placeholder="Nhập keyword tiếng Anh (cách dấu ',')"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={student.keywordEng ? student.keywordEng.join(", ") : ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents = rec.students.map((stu, sIdx) => {
                                          if (sIdx !== studentIndex) return stu;
                                          return {
                                            ...stu,
                                            keywordEng: newValue.split(",").map((item) => item.trim()).filter(Boolean),
                                          };
                                        });
                                        return { ...rec, isChanged: true, students: updatedStudents };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                  placeholder="Nhập keyword tiếng Anh (cách dấu ',')"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.activity ? student.activity.join(", ") : ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                  placeholder="Nhập activity (cách dấu ',')"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={student.activity ? student.activity.join(", ") : ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents = rec.students.map((stu, sIdx) => {
                                          if (sIdx !== studentIndex) return stu;
                                          return {
                                            ...stu,
                                            activity: newValue.split(",").map((item) => item.trim()).filter(Boolean),
                                          };
                                        });
                                        return { ...rec, isChanged: true, students: updatedStudents };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                  placeholder="Nhập activity (cách dấu ',')"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.activityEng ? student.activityEng.join(", ") : ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                  placeholder="Nhập activity tiếng Anh (cách dấu ',')"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={student.activityEng ? student.activityEng.join(", ") : ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents = rec.students.map((stu, sIdx) => {
                                          if (sIdx !== studentIndex) return stu;
                                          return {
                                            ...stu,
                                            activityEng: newValue.split(",").map((item) => item.trim()).filter(Boolean),
                                          };
                                        });
                                        return { ...rec, isChanged: true, students: updatedStudents };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                  placeholder="Nhập activity tiếng Anh (cách dấu ',')"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.note || ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={student.note || ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents = rec.students.map((stu, sIdx) => {
                                          if (sIdx !== studentIndex) return stu;
                                          return { ...stu, note: newValue };
                                        });
                                        return { ...rec, isChanged: true, students: updatedStudents };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.noteEng || ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={student.noteEng || ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents = rec.students.map((stu, sIdx) => {
                                          if (sIdx !== studentIndex) return stu;
                                          return { ...stu, noteEng: newValue };
                                        });
                                        return { ...rec, isChanged: true, students: updatedStudents };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm("Bạn có chắc muốn xóa record này?")) return;
                                    try {
                                      await axios.delete(`${API_URL}/award-records/${record._id}`);
                                      setSelectedSubAwardRecords((prev) =>
                                        prev.filter((_, fIdx) => fIdx !== index)
                                      );
                                      alert("Đã xóa thành công!");
                                    } catch (err) {
                                      console.error(err);
                                      alert("Xóa thất bại!");
                                    }
                                  }}
                                  className="text-[#DC0909] hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                  title="Xóa record"
                                >
                                  <FaTrashCan size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {record.awardClasses?.map((awardClass, classIndex) => (
                          <tr key={`class-${classIndex}`}>
                            <td className="py-3 pr-4">
                              <input
                                type="text"
                                value={awardClass.class?.className || ""}
                                readOnly
                                className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={awardClass.note || ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={awardClass.note || ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedClasses = rec.awardClasses.map((ac, cIdx) => {
                                          if (cIdx !== classIndex) return ac;
                                          return { ...ac, note: newValue };
                                        });
                                        return { ...rec, isChanged: true, awardClasses: updatedClasses };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={awardClass.noteEng || ""}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display = "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  onChange={() => {}}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                />
                                <textarea
                                  rows={3}
                                  style={{ display: "none" }}
                                  value={awardClass.noteEng || ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSelectedSubAwardRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedClasses = rec.awardClasses.map((ac, cIdx) => {
                                          if (cIdx !== classIndex) return ac;
                                          return { ...ac, noteEng: newValue };
                                        });
                                        return { ...rec, isChanged: true, awardClasses: updatedClasses };
                                      })
                                    );
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display = "block";
                                  }}
                                  className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm("Bạn có chắc muốn xóa record này?")) return;
                                    try {
                                      await axios.delete(`${API_URL}/award-records/${record._id}`);
                                      setSelectedSubAwardRecords((prev) =>
                                        prev.filter((_, fIdx) => fIdx !== index)
                                      );
                                      alert("Đã xóa thành công!");
                                    } catch (err) {
                                      console.error(err);
                                      alert("Xóa thất bại!");
                                    }
                                  }}
                                  className="text-[#DC0909] hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                  title="Xóa record"
                                >
                                  <FaTrashCan size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordModal;