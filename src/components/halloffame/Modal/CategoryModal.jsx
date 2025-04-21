import React from 'react';
import { BASE_URL } from '../../../config';

const CategoryModal = ({
  showCategoryModal,
  resetModalState,
  editingCategory,
  categoryFormData,
  setCategoryFormData,
  handleCoverImageChange,
  handleCategorySubmit,
  subAwardMode,
  setSubAwardMode,
  newCustomSubAward,
  setNewCustomSubAward,
  newCustomSubAwardSchoolYear,
  setNewCustomSubAwardSchoolYear,
  newCustomSubAwardPriority,
  setNewCustomSubAwardPriority,
  customSubAwards,
  setCustomSubAwards,
  schoolYears,
  handleDeleteCustomSubAward,
  selectedSchoolYears,
  setSelectedSchoolYears,
  setSubAwardStep,
  newCustomSubAwardEng,
  setNewCustomSubAwardEng,
}) => {
  if (!showCategoryModal) return null;

  const handleUpdate = async () => {
    try {
      await handleCategorySubmit();
      setSubAwardStep(3);
      resetModalState(); // Đóng modal ngay sau khi cập nhật
    } catch (error) {
      console.error('Lưu thất bại:', error); // Chỉ log lỗi cho debug
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20 transition-opacity duration-300">
      <div className="bg-white rounded-[20px] shadow-lg w-[90vw] h-[90vh] relative flex flex-col transform transition-transform duration-300 scale-100">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-[#002855] rounded-t-xl flex items-center justify-between px-10">
          <h2 className="text-xl font-semibold text-white">
            {editingCategory ? 'Cập nhật Loại Vinh Danh' : 'Tạo mới Loại Vinh Danh'}
          </h2>
          <button
            onClick={resetModalState}
            className="text-sm px-4 py-2 font-bold text-[#002855] bg-white rounded-l hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
        </div>

        {/* Main content - Split screen */}
        <div className="flex h-[calc(90vh-4rem)] mt-16">
          {/* Left side - Category Info */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <div className="space-y-4">
              {/* Cover Image */}
              <div className="relative group">
                {categoryFormData.coverImage ? (
                  <img
                    src={`${BASE_URL}/${categoryFormData.coverImage}`}
                    alt="Cover"
                    className="w-full h-48 rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => document.getElementById('coverImageUpload').click()}
                  />
                ) : (
                  <div
                    className="w-full h-48 rounded-2xl bg-gray-100 flex items-center justify-center cursor-pointer border border-dashed border-gray-300 hover:bg-gray-200 transition"
                    onClick={() => document.getElementById('coverImageUpload').click()}
                  >
                    <span className="text-gray-500">Chọn ảnh bìa</span>
                  </div>
                )}
                <input
                  type="file"
                  id="coverImageUpload"
                  onChange={handleCoverImageChange}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-1/3 text-base font-medium text-gray-700">Tên:</label>
                  <input
                    className="w-2/3 border border-gray-200 rounded-lg p-2 text-[#282828] focus:ring-2 focus:ring-[#002855]"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-1/3 text-base font-medium text-gray-700">Tên (Tiếng Anh):</label>
                  <input
                    className="w-2/3 border border-gray-200 rounded-lg p-2 text-[#282828] focus:ring-2 focus:ring-[#002855]"
                    value={categoryFormData.nameEng}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, nameEng: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <label className="w-1/3 text-base font-medium text-gray-700 pt-2">Mô tả:</label>
                  <textarea
                    className="w-2/3 h-28 border border-gray-200 rounded-lg p-2 text-[#282828] focus:ring-2 focus:ring-[#002855]"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <label className="w-1/3 text-base font-medium text-gray-700 pt-2">Mô tả (Tiếng Anh):</label>
                  <textarea
                    className="w-2/3 h-28 border border-gray-200 rounded-lg p-2 text-[#282828] focus:ring-2 focus:ring-[#002855]"
                    value={categoryFormData.descriptionEng}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, descriptionEng: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Sub Awards */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              <h4 className="font-medium text-lg border-b pb-2">Thiết lập loại Vinh danh</h4>

              {/* Custom Sub Awards */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-[#002855] rounded-[4px]"
                    checked={subAwardMode.custom}
                    onChange={(e) => setSubAwardMode({ ...subAwardMode, custom: e.target.checked })}
                  />
                  <span>
                    Vinh danh tùy chọn
                    <p className="text-sm text-gray-500">
                      Chọn mode này khi bạn muốn tạo các loại vinh danh nhỏ hơn không có thời gian định kỳ năm, tháng, học kì.
                    </p>
                  </span>
                </div>

                {subAwardMode.custom && (
                  <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#002855]"
                        value={newCustomSubAward}
                        onChange={(e) => setNewCustomSubAward(e.target.value)}
                        placeholder="Nhập tên vinh danh"
                      />
                      <input
                        type="text"
                        className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#002855]"
                        value={newCustomSubAwardEng}
                        onChange={(e) => setNewCustomSubAwardEng(e.target.value)}
                        placeholder="Enter award name in English"
                      />
                      <select
                        className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#002855]"
                        value={newCustomSubAwardSchoolYear}
                        onChange={(e) => setNewCustomSubAwardSchoolYear(e.target.value)}
                      >
                        <option value="">--Chọn năm học--</option>
                        {(schoolYears || []).map((sy) => (
                          <option key={sy._id} value={sy._id}>
                            {sy.code || sy.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="w-20 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#002855]"
                        value={newCustomSubAwardPriority}
                        onChange={(e) => setNewCustomSubAwardPriority(parseInt(e.target.value) || 1)}
                        min="1"
                        placeholder="Ưu tiên"
                      />
                      <button
                        type="button"
                        className="bg-[#009483] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#008577] transition-colors"
                        onClick={() => {
                          if (newCustomSubAward.trim() !== '' && newCustomSubAwardSchoolYear !== '') {
                            const newSubAward = {
                              type: 'custom',
                              label: newCustomSubAward,
                              labelEng: newCustomSubAwardEng,
                              schoolYear: newCustomSubAwardSchoolYear,
                              priority: newCustomSubAwardPriority,
                              awardCount: 0,
                            };
                            setCustomSubAwards([...customSubAwards, newSubAward]);
                            setCategoryFormData((prev) => ({
                              ...prev,
                              subAwards: [...prev.subAwards, newSubAward],
                            }));
                            setNewCustomSubAward('');
                            setNewCustomSubAwardEng('');
                            setNewCustomSubAwardSchoolYear('');
                            setNewCustomSubAwardPriority(1);
                          }
                        }}
                      >
                        Thêm
                      </button>
                    </div>

                    {/* List of custom sub awards */}
                    <div className="space-y-2">
                      {customSubAwards.map((sub, index) => {
                        const schoolYear = schoolYears.find((sy) => sy._id === sub.schoolYear);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div>
                              <span className="font-medium">{sub.label}</span>
                              {sub.labelEng && (
                                <span className="text-sm text-gray-500 ml-2">
                                  ({sub.labelEng})
                                </span>
                              )}
                              <span className="text-sm text-gray-500 ml-2">
                                ({schoolYear ? `Năm học ${schoolYear.code}` : sub.schoolYear})
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                className="w-16 border rounded-lg p-1 text-sm focus:ring-2 focus:ring-[#002855]"
                                min="1"
                                value={sub.priority}
                                onChange={(e) => {
                                  const newPrio = Number(e.target.value) || 1;
                                  setCustomSubAwards((prev) =>
                                    prev.map((s, i) => (i === index ? { ...s, priority: newPrio } : s))
                                  );
                                }}
                              />
                              <button
                                onClick={() => handleDeleteCustomSubAward(index)}
                                className="text-white bg-[#C81E1E] p-2 rounded-full hover:bg-[#b81c1c] transition-colors"
                                title="Xóa"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Regular Sub Awards */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-[#002855] rounded-[4px]"
                    checked={subAwardMode.schoolYear}
                    onChange={(e) => setSubAwardMode({ ...subAwardMode, schoolYear: e.target.checked })}
                  />
                  <span>
                    Vinh danh định kỳ
                    <p className="text-sm text-gray-500">
                      Chọn mode này khi bạn muốn tạo các loại vinh danh có thời gian định kỳ năm, tháng, học kỳ.
                    </p>
                  </span>
                </div>

                {subAwardMode.schoolYear && (
                  <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                    <label className="text-sm font-medium">Chọn Năm học:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {schoolYears.map((sy) => (
                        <label
                          key={sy._id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-[#002855] rounded-[4px]"
                            value={sy._id}
                            checked={selectedSchoolYears.includes(sy._id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedSchoolYears((prev) =>
                                checked ? [...prev, sy._id] : prev.filter((id) => id !== sy._id)
                              );
                            }}
                          />
                          <span>{sy.code || sy.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with update button */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-50 rounded-b-xl flex items-center justify-end px-10">
          <button
            type="button"
            className="bg-[#009483] text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-[#008577] transition-colors"
            onClick={handleUpdate}
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;