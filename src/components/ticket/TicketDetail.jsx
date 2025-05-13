import React, { useState, useEffect, useRef } from "react";
import { FaStar } from "react-icons/fa";
import { BASE_URL } from "../../config";
import Modal from "react-modal";
import TechnicalRating from "./TechnicalRating";
import { FaCommentDots } from "react-icons/fa6";
import TicketChat from "./TicketChat";

export default function TicketDetail(props) {
  const {
    selectedTicket,
    currentUser,
    rating,
    setRating,
    review,
    setReview,
    handleFeedback,
    selectedBadges,
    setSelectedBadges,
    handleReopenTicket,
    handleFeedbackAndClose,
    handleCancelTicket,
    handleUrgent,
    setShowCancelModal,
    fetchTicketById,
  } = props;
  console.log("selectedTicket", selectedTicket);
  const [detailTab, setDetailTab] = useState("request");

  useEffect(() => {
    if (selectedTicket?._id) {
      setRating(selectedTicket.feedback?.rating || 0);
      setReview(selectedTicket.feedback?.comment || "");
    }
  }, [selectedTicket?._id]);

  return (
    <div className="bg-white w-full h-full rounded-xl shadow-xl p-6 flex gap-4">
      {/* CỘT TRÁI - HIỂN THỊ TAB */}
      <div className="flex flex-col w-3/4 h-full">
        <h1 className="text-start text-2xl font-bold text-[#002147] mb-3">
          {selectedTicket.title || "Chưa có tiêu đề"}
        </h1>
        {/* Thanh Tab */}
        <div className="flex gap-6 border-b">
          <button
            className={`pb-2 ${
              detailTab === "request"
                ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                : "text-[#757575]"
            }`}
            onClick={() => setDetailTab("request")}
          >
            Yêu cầu
          </button>
          <button
            className={`pb-2 ${
              detailTab === "progress"
                ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                : "text-[#757575]"
            }`}
            onClick={() => setDetailTab("progress")}
          >
            Tiến trình
          </button>
          <button
            className={`pb-2 ${
              detailTab === "discussion"
                ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                : "text-[#757575]"
            }`}
            onClick={() => setDetailTab("discussion")}
          >
            Trao đổi
          </button>
        </div>
        {/* Nội dung Tab (chiếm toàn bộ không gian còn lại) */}
        <div className="flex-1 overflow-hidden mt-3">
          <div className="h-full max-h-full overflow-y-hidden hover:overflow-y-auto">
            {detailTab === "request" && (
              <RequestTab selectedTicket={selectedTicket} />
            )}
            {detailTab === "progress" && (
              <ProgressTab
                selectedTicket={selectedTicket}
                rating={rating}
                setRating={setRating}
                review={review}
                setReview={setReview}
                handleFeedback={handleFeedback}
                selectedBadges={selectedBadges}
                setSelectedBadges={setSelectedBadges}
                handleReopenTicket={handleReopenTicket}
                handleFeedbackAndClose={handleFeedbackAndClose}
                handleCancelTicket={handleCancelTicket}
                handleUrgent={handleUrgent}
                setShowCancelModal={setShowCancelModal}
              />
            )}
            {detailTab === "discussion" && (
              <TicketChat
                ticket={selectedTicket}
                currentUser={currentUser}
                fetchTicketById={fetchTicketById}
              />
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI - THÔNG TIN TICKET (CỐ ĐỊNH) */}
      <div className="w-1/4 max-h-fit overflow-y-hidden hover:overflow-y-auto flex-shrink-0 border rounded-2xl p-4">
        <div className="p-2 text-[#002147] space-y-4 flex flex-col">
          <div className="h-full space-y-4">
            <div className="flex-row flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-[#757575]">Mã yêu cầu</p>
                <p className="text-base font-semibold">
                  {selectedTicket.ticketCode || "N/A"}
                </p>
              </div>
              <button
                className="flex px-4 py-2 bg-orange-red text-white text-sm font-semibold rounded-lg"
                onClick={handleUrgent}
              >
                Báo Gấp
              </button>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Loại yêu cầu</p>
              <p className="text-base font-semibold">
                {selectedTicket.type || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Trạng thái</p>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                  selectedTicket.status === "Processing"
                    ? "bg-[#F5AA1E] text-white"
                    : selectedTicket.status === "Closed"
                    ? "bg-[#3DB838] text-white"
                    : selectedTicket.status === "Assigned"
                    ? "bg-[#002855] text-white"
                    : selectedTicket.status === "Done"
                    ? "bg-[#3DB838] text-white"
                    : selectedTicket.status === "Cancelled"
                    ? "bg-orange-red text-white"
                    : "bg-[#b63737] text-white"
                }`}
              >
                {selectedTicket.status === "Open"
                  ? "Chưa nhận"
                  : selectedTicket.status === "Processing"
                  ? "Đang xử lý"
                  : selectedTicket.status === "Assigned"
                  ? "Đã nhận"
                  : selectedTicket.status === "Waiting for Customer"
                  ? "Chờ phản hồi"
                  : selectedTicket.status === "Closed"
                  ? "Đóng"
                  : selectedTicket.status === "Cancelled"
                  ? "Đã huỷ"
                  : selectedTicket.status || "N/A"}
              </span>
            </div>

            <div>
              <p className="text-sm text-[#757575]">Ngày yêu cầu</p>
              <p className="text-base font-semibold">
                {selectedTicket.createdAt
                  ? new Date(selectedTicket.createdAt).toLocaleDateString(
                      "vi-VN"
                    )
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Ngày hoàn thành dự kiến</p>
              <p className="text-base font-semibold">
                {new Date(selectedTicket.sla).toLocaleString()}
              </p>
            </div>

            <div className="pb-2">
              <p className="text-sm text-[#757575]">Người thực hiện</p>
              {/* Avatar + Tên + Chức vụ */}
              <div className="flex items-center gap-2 mt-3">
                <img
                  src={`${BASE_URL}/uploads/Avatar/${selectedTicket.assignedTo?.avatarUrl}`}
                  alt="Avatar"
                  className="w-20 h-20 rounded-xl object-cover object-top border"
                />
                <div>
                  <div className="w-full flex flex-row gap-4 items-center justify-start">
                    <p className="text-base font-semibold">
                      {selectedTicket.assignedTo?.fullname || "Chưa có"}
                    </p>
                    <button
                      className="flex px-2 py-2 bg-[#002855] text-white text-sm font-semibold rounded-lg"
                      onClick={() => setDetailTab("discussion")}
                    >
                      <FaCommentDots />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {/* Hiển thị role, ví dụ: 'Kỹ thuật viên' */}
                    {selectedTicket.assignedTo?.jobTitle === "technical"
                      ? "Kỹ thuật viên"
                      : selectedTicket.assignedTo?.jobTitle || ""}
                  </p>
                  <TechnicalRating
                    technicalId={selectedTicket.assignedTo?._id}
                  />
                </div>
              </div>
            </div>
            {(selectedTicket.status === "Assigned" ||
              selectedTicket.status === "Processing" ||
              selectedTicket.status === "Done") && (
              <div className="flex flex-row items-center gap-6">
                <div className="w-full">
                  <button
                    className="w-full flex-1 px-4 py-2 bg-orange-red hover:bg-red-600 text-white text-sm font-semibold rounded-lg"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Huỷ Ticket
                  </button>
                </div>{" "}
              </div>
            )}
          </div>

          {/* Đánh giá */}
          {(selectedTicket.status === "Closed" ||
            selectedTicket.status === "Cancelled") && (
            <div className="border-t pt-3 space-y-4">
              {/* Nếu đã đánh giá (đã có rating) => hiển thị đánh giá dưới dạng chỉ đọc */}
              {selectedTicket.feedback?.rating ? (
                <div>
                  {/* Hiển thị số sao (chỉ đọc) */}
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-3xl mx-1 ${
                          i < props.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment (chỉ đọc) */}
                  <textarea
                    placeholder="Hãy viết nhận xét của bạn..."
                    value={props.review}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  />

                  {/* Huy hiệu (chỉ xem) */}
                  <div className="flex flex-wrap gap-2 my-2">
                    {[
                      "Nhiệt Huyết",
                      "Chu Đáo",
                      "Vui Vẻ",
                      "Tận Tình",
                      "Chuyên Nghiệp",
                    ].map((badge) => {
                      const isSelected = props.selectedBadges?.includes(badge);
                      return (
                        <span
                          key={badge}
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            isSelected
                              ? "bg-[#002855] text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>

                  {/* Nút "Đã đánh giá" (chỉ đọc) */}
                  <div className="flex items-center justify-center">
                    <button
                      disabled
                      className="mt-2 px-3 py-1 bg-gray-300 text-white text-sm font-semibold rounded-lg transition w-full cursor-not-allowed"
                    >
                      Đã đánh giá
                    </button>
                  </div>
                </div>
              ) : (
                /* Chưa đánh giá => cho phép người dùng đánh giá */
                <div>
                  {/* Dải sao (clickable) */}
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        onClick={() => props.setRating(i + 1)} // Cho phép click để setRating
                        className={`cursor-pointer text-3xl mx-1 ${
                          i < props.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Textarea nhập nhận xét (có thể chỉnh sửa) */}
                  <textarea
                    placeholder="Hãy viết nhận xét của bạn..."
                    value={props.review}
                    onChange={(e) => props.setReview(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />

                  {/* Chọn huy hiệu */}
                  <div className="flex flex-wrap gap-2 my-2">
                    {[
                      "Nhiệt Huyết",
                      "Chu Đáo",
                      "Vui Vẻ",
                      "Tận Tình",
                      "Chuyên Nghiệp",
                    ].map((badge) => {
                      const isSelected = props.selectedBadges?.includes(badge);
                      return (
                        <span
                          key={badge}
                          onClick={() => {
                            if (isSelected) {
                              props.setSelectedBadges((prev) =>
                                prev.filter((b) => b !== badge)
                              );
                            } else {
                              props.setSelectedBadges((prev) => [
                                ...prev,
                                badge,
                              ]);
                            }
                          }}
                          className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-full ${
                            isSelected
                              ? "bg-[#002855] text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>

                  {/* Nút Gửi đánh giá */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={props.handleFeedback}
                      className="mt-2 px-3 py-1 bg-[#002855] text-white text-sm font-semibold rounded-lg transition w-full"
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestTab({ selectedTicket }) {
  const [previewImage, setPreviewImage] = useState(null);
  return (
    <div className="w-full h-full p-4 flex flex-col gap-3">
      {/* Tiêu đề */}
      <div className="overflow-y-hidden hover:overflow-y-auto pb-4">
        <p className="font-semibold text-[#002147]">Tiêu đề</p>
        <p className="text-gray-500">
          {selectedTicket.title || "Chưa có tiêu đề"}
        </p>
      </div>

      {/* Mô tả chi tiết */}
      <div className="h-1/4 overflow-y-hidden hover:overflow-y-auto  pb-4">
        <p className="font-semibold text-[#002147]">Mô tả chi tiết</p>
        <p className="text-gray-500 text-sm leading-relaxed">
          {selectedTicket.description || "Không có mô tả chi tiết."}
        </p>
      </div>

      {/* Ảnh đính kèm */}
      <div className="h-1/4 overflow-y-hidden hover:overflow-y-auto pb-4 mb-4">
        <p className="font-semibold text-[#002147] mb-2">Ảnh đính kèm</p>
        {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto">
            {selectedTicket.attachments.map((item, index) => (
              <img
                key={index}
                src={`${BASE_URL}/uploads/Tickets/${item.url}`}
                alt={item.filename || `attachment-${index}`}
                onClick={() =>
                  setPreviewImage(`${BASE_URL}/uploads/Tickets/${item.url}`)
                }
                className="w-[120px] h-[120px] object-cover rounded-lg border shadow-sm cursor-pointer hover:opacity-80 transition"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Không có ảnh đính kèm.</p>
        )}
      </div>
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onRequestClose={() => setPreviewImage(null)}
          className="flex items-center justify-center p-4"
          overlayClassName="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        >
          <div className="relative max-w-3xl max-h-[80vh] ">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </Modal>
      )}

      {/* Ghi chú */}
      <div className="h-1/4 overflow-y-hidden hover:overflow-y-auto">
        <p className="font-semibold text-[#002147]">* Ghi chú</p>
        <p className="text-gray-500 text-sm leading-relaxed">
          {selectedTicket.notes || "Không có ghi chú."}
        </p>
      </div>
    </div>
  );
}

function ProgressTab({
  selectedTicket,
  rating,
  setRating,
  review,
  setReview,
  handleFeedback,
  selectedBadges,
  setSelectedBadges,
  handleReopenTicket,
  handleFeedbackAndClose,
  handleCancelTicket,
  handleUrgent,
}) {
  const statuses = [
    { key: "Assigned", label: "Đã tiếp nhận", icon: "/ticket/tickets.svg" },
    { key: "Processing", label: "Xử lý", icon: "/ticket/processing.svg" },
    { key: "Done", label: "Hoàn thành", icon: "/ticket/done.svg" },
    { key: "Cancelled", label: "Hủy", icon: "/ticket/cancelled.svg" },
  ];
  const [doneOption, setDoneOption] = useState(null);

  return (
    <div className="bg-white w-full p-4 flex gap-6">
      {/* Cột trái: danh sách trạng thái */}
      <div className="flex flex-col gap-4 w-1/4">
        {statuses.map((s, index) => {
          const currentIndex = statuses.findIndex(
            (item) => item.key === selectedTicket.status
          );

          let bg = "bg-[#757575]";
          let textColor = "text-gray-400";

          // Nếu ticket đang ở trạng thái Huỷ và phần tử hiện tại chính là phần Huỷ, đặt màu đỏ.
          if (selectedTicket.status === "Cancelled" && s.key === "Cancelled") {
            bg = "bg-orange-red";
            textColor = "text-red-500";
          } else if (index < currentIndex) {
            bg = "bg-[#3DB838]";
            textColor = "text-green-700";
          } else if (index === currentIndex) {
            // Nếu trạng thái hiện tại không phải Huỷ, dùng màu vàng như cũ
            bg = "bg-[#F5AA1E]";
            textColor = "text-[#F5AA1E]";
          }

          return (
            <div
              key={s.key}
              className={`flex items-center gap-2 py-4 px-4 rounded-xl shadow-sm font-bold text-base cursor-default ${bg} ${textColor} bg-opacity-10`}
            >
              <img
                src={s.icon}
                alt={s.label}
                className={`w-6 h-6 ${
                  selectedTicket.status === "Cancelled" && s.key === "Cancelled"
                    ? "filter-red"
                    : textColor === "text-green-700"
                    ? "filter-green"
                    : textColor === "text-[#F5AA1E]"
                    ? "filter-yellow"
                    : "filter-gray"
                }`}
              />
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Cột phải: hiển thị khác nhau theo status */}
      <div className="w-full p-6 border rounded-xl space-y-2 h-fit">
        {selectedTicket.status === "Assigned" && (
          <div>
            <p className="text-sm text-[#757575] mb-2">Người tiếp nhận</p>
            <div className="flex items-center gap-4">
              <img
                src={`${BASE_URL}/uploads/Avatar/${selectedTicket.assignedTo?.avatarUrl}`}
                alt="Avatar"
                className="w-16 h-16 rounded-xl object-cover border"
              />
              <div className="flex flex-col">
                <p className="text-base font-semibold text-[#002147]">
                  {selectedTicket.assignedTo?.fullname || "Chưa có"}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedTicket.assignedTo?.jobTitle === "technical"
                    ? "Kỹ thuật viên"
                    : selectedTicket.assignedTo?.jobTitle || ""}
                </p>
                <TechnicalRating technicalId={selectedTicket.assignedTo?._id} />
              </div>
            </div>

            {/* Hiển thị huy hiệu và số lượng */}
            {selectedTicket.assignedTo?.badges &&
              Object.keys(selectedTicket.assignedTo.badges).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-[#757575] mb-1 font-semibold">
                    Huy hiệu được đánh giá
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedTicket.assignedTo.badges).map(
                      ([badge, count]) => (
                        <span
                          key={badge}
                          className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium"
                        >
                          {badge} ({count})
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {selectedTicket.status === "Processing" && (
          <>
            {selectedTicket.subTasks && selectedTicket.subTasks.length > 0 ? (
              <>
                <p className="text-sm text-[#757575] mb-2 font-bold">
                  Ticket đang được xử lý. Vui lòng chờ kĩ thuật viên hoàn thành
                  các hạng mục sau
                </p>
                {selectedTicket.subTasks.map((task, i) => {
                  const isCompleted = task.status === "Completed";
                  const isCancelled = task.status === "Cancelled";

                  let displayStatus = task.status;
                  let bg = "";
                  let textColor = "";

                  if (isCompleted) {
                    bg = "bg-[#E4EFE6]";
                    textColor = "text-[#009483]";
                    displayStatus = "Hoàn thành";
                  } else if (isCancelled) {
                    bg = "bg-[#EBEBEB] line-through";
                    textColor = "text-[#757575]";
                    displayStatus = "Hủy";
                  } else {
                    if (
                      selectedTicket.subTasks.filter(
                        (t) =>
                          t.status !== "Completed" && t.status !== "Cancelled"
                      )[0]?._id === task._id
                    ) {
                      bg = "bg-[#E6EEF6]";
                      textColor = "text-[#002855]";
                      displayStatus = "Đang làm";
                    } else {
                      bg = "bg-[#EBEBEB]";
                      textColor = "text-[#757575]";
                      displayStatus = "Huỷ";
                    }
                  }

                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-4 py-3 rounded-lg mb-2 text-sm font-bold ${bg} ${textColor}`}
                    >
                      <span>{task.title}</span>
                      <span>{displayStatus}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-[#757575] mb-2 font-bold">
                Ticket đang được xử lý, vui lòng chờ.
              </p>
            )}
          </>
        )}

        {/* Phần hiển thị khi ticket bị huỷ */}
        {selectedTicket.status === "Cancelled" && (
          <div className="space-y-4">
            <div className="bg-orange-red bg-opacity-10 p-4 rounded-xl">
              <p className="text-red-500 font-bold mb-2">Lý do huỷ ticket:</p>
              <p className="text-red-500">
                {selectedTicket.cancellationReason}
              </p>
            </div>
          </div>
        )}

        {/* Phần Done */}
        {selectedTicket.status === "Done" && (
          <div className="space-y-4">
            <p className="text-sm text-[#757575] font-semibold">
              Yêu cầu đã được xử lý xong. Vui lòng nhận kết quả và kiểm tra chất
              lượng phục vụ
            </p>

            {/* Chọn kết quả */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doneOption"
                  value="accepted"
                  checked={doneOption === "accepted"}
                  onChange={(e) => setDoneOption(e.target.value)}
                  className="form-radio text-[#002855]"
                />
                <span className="text-base font-semibold text-[#002855]">
                  Chấp nhận kết quả
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doneOption"
                  value="rejected"
                  checked={doneOption === "rejected"}
                  onChange={(e) => setDoneOption(e.target.value)}
                  className="form-radio text-[#002855]"
                />
                <span className="text-base font-semibold text-[#757575]">
                  Chưa đạt yêu cầu, cần xử lý lại
                </span>
              </label>
            </div>

            {/* Nếu chọn "Chấp nhận kết quả" thì hiển thị bảng feedback */}
            {doneOption === "accepted" && (
              <div className="w-[50%] mx-auto pt-5 space-y-4">
                {/* Dải sao */}
                <div className="flex items-center justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`cursor-pointer text-3xl mx-1 ${
                        i < rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                      onClick={() => setRating(i + 1)}
                    />
                  ))}
                </div>

                {/* Textarea review */}
                <textarea
                  placeholder="Hãy viết nhận xét của bạn"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows={4}
                />

                {/* Chọn huy hiệu */}
                <div className="flex flex-wrap gap-2 my-2">
                  {[
                    "Nhiệt Huyết",
                    "Chu Đáo",
                    "Vui Vẻ",
                    "Tận Tình",
                    "Chuyên Nghiệp",
                  ].map((badge) => {
                    const isSelected = selectedBadges?.includes(badge);
                    return (
                      <span
                        key={badge}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBadges((prev) =>
                              prev.filter((b) => b !== badge)
                            );
                          } else {
                            setSelectedBadges((prev) => [...prev, badge]);
                          }
                        }}
                        className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-full ${
                          isSelected
                            ? "bg-[#002855] text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {badge}
                      </span>
                    );
                  })}
                </div>

                {/* Nút gửi feedback */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleFeedbackAndClose}
                    className="mt-2 px-6 py-2 bg-[#FF5733] text-white rounded-lg text-sm font-semibold"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            )}

            {/* Nếu chọn "Chưa đạt yêu cầu, cần xử lý lại" thì hiển thị nút mở lại ticket */}
            {doneOption === "rejected" && (
              <div className="flex items-center justify-center pt-5">
                <button
                  onClick={handleReopenTicket}
                  className="px-6 py-2 bg-[#FF5733] text-white rounded-lg text-sm font-semibold"
                >
                  Mở lại ticket
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
