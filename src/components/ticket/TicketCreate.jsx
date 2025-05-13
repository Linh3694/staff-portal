import React from "react";
import { FaRegCircle, FaRegCircleDot } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { API_URL } from "../../config";

const ProgressIndicator = ({ step }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {/* Step 2 */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
          {step === 2 ? (
            <FaRegCircleDot
              size={28}
              className="text-[#FF5733] drop-shadow-md"
            />
          ) : step > 2 ? (
            <FaCheckCircle
              size={28}
              className="text-[#FF5733] bg-white rounded-full"
            />
          ) : (
            <FaRegCircle className="bg-[#FF5733] text-2xl rounded-full" />
          )}
        </div>
        <div
          className={`w-24 h-[2px] transition-all duration-300 ${
            step >= 3 ? "bg-gray-300" : "bg-gray-300"
          }`}
        ></div>
      </div>
      {/* Step 3 */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
          {step === 3 ? (
            <FaRegCircleDot
              size={28}
              className="text-[#FF5733] drop-shadow-md"
            />
          ) : step > 3 ? (
            <FaCheckCircle
              size={28}
              className="text-[#FF5733] bg-white rounded-full"
            />
          ) : (
            <FaRegCircle className="text-[#FF5733] text-2xl" />
          )}
        </div>
        <div
          className={`w-24 h-[2px] transition-all duration-300 ${
            step >= 4 ? "bg-gray-300" : "bg-gray-300"
          }`}
        ></div>
      </div>
      {/* Step 4 */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
        {step === 4 ? (
          <FaRegCircleDot size={28} className="text-[#FF5733] drop-shadow-md" />
        ) : step > 4 ? (
          <FaCheckCircle className="bg-[#FF5733] text-2xl" />
        ) : (
          <FaRegCircle className="text-[#FF5733] text-2xl" />
        )}
      </div>
    </div>
  );
};

const TicketCreate = ({
  currentUser,
  step,
  setStep,
  ticketData,
  setTicketData,
  selectedOption,
  setSelectedOption,
  submitTicket,
  ticketCreatedId,
}) => {
  return (
    <div className="w-full h-full p-6 bg-white rounded-2xl shadow-lg relative">
      {/* Icon trang trí */}
      <img
        src="/ticket/icon3.png"
        alt="WSHN Logo"
        className="absolute bottom-0 right-0 w-[240px]"
      />
      <img
        src="/ticket/icon1.png"
        alt="Corner Right"
        className="absolute top-0 right-0 w-[120px]"
      />
      <img
        src="/ticket/icon2.png"
        alt="Corner Left"
        className="absolute bottom-16 left-0 w-[120px]"
      />

      {/* Nội dung chính */}
      <div className="w-full h-full p-6">
        <div className="w-full h-full flex flex-col items-center justify-between pt-5">
          {/* Bước 1 */}
          {step === 1 && (
            <div className="w-full h-full flex flex-col items-center justify-center pb-[20%]">
              <div>
                <h1 className="text-center text-2xl font-bold text-gray-800 mb-5">
                  Xin chào WISer{" "}
                  <span className="text-[#FF5733] font-semibold">
                    {currentUser?.fullname}
                  </span>
                  , bạn cần chúng tớ{" "}
                  <span className="text-[#002147] font-semibold">hỗ trợ</span>{" "}
                  gì ạ ^^
                </h1>
                <h1 className="text-center text-[#FF5733] text-md font-bold underline">
                  Hướng dẫn tạo ticket trên 360° WISers
                </h1>
              </div>
              {/* Các lựa chọn */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
                {[
                  {
                    type: "device",
                    label: "Hỗ trợ chung",
                    image: "/ticket/overall.png",
                    description:
                      "“Hỗ trợ chung” áp dụng cho các yêu cầu hỗ trợ kỹ thuật và vận hành hàng ngày...",
                  },
                  {
                    type: "event",
                    label: "Hỗ trợ sự kiện",
                    image: "/ticket/event.png",
                    description:
                      "“Hỗ trợ sự kiện” áp dụng cho các yêu cầu hỗ trợ kỹ thuật...",
                  },
                  {
                    type: "hrorder",
                    label: "Order Nhân sự",
                    image: "/ticket/hrorder.png",
                    description:
                      "“Order nhân sự” áp dụng cho các yêu cầu bổ sung nhân sự...",
                  },
                ].map(({ type, label, image, description }) => (
                  <div
                    key={type}
                    onClick={() => {
                      setTicketData((prev) => ({ ...prev, type }));
                      setSelectedOption(description);
                    }}
                    className={`relative w-[240px] h-[200px] flex flex-col items-center justify-end text-lg font-semibold rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                      ticketData.type === type
                        ? " bg-[#E6EEF6] shadow-lg"
                        : " border-transparent bg-gray-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={label}
                      className="absolute top-[-30px] w-[180px] h-[180px] object-contain"
                    />
                    <div className="pb-4">{label}</div>
                  </div>
                ))}
              </div>
              {selectedOption && (
                <div className="mt-6 p-4 border border-dashed rounded-lg text-[#002147] font-semibold text-center max-w-2xl mx-auto">
                  {selectedOption}
                </div>
              )}
            </div>
          )}

          {/* Bước 2 */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center">
              {ticketData.type === "event" ? (
                // Giao diện riêng cho sự kiện
                <div className="w-full max-w-2xl">
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                    Bạn hãy nhập nội dung và mô tả chi tiết
                  </h1>
                  <ProgressIndicator step={step} />
                  <div className="w-full flex flex-col gap-4">
                    <div>
                      <label className="text-lg font-semibold text-[#002147]">
                        Tên sự kiện
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập nội dung"
                        value={ticketData.title}
                        onChange={(e) =>
                          setTicketData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                      />
                      <p className="text-gray-500 text-sm mt-1">
                        Ngắn gọn, tối đa XX kí tự
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-lg font-semibold text-[#002147]">
                          Ngày bắt đầu
                        </label>
                        <input
                          type="date"
                          value={ticketData.startDate || ""}
                          onChange={(e) =>
                            setTicketData((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-lg font-semibold text-[#002147]">
                          Ngày kết thúc
                        </label>
                        <input
                          type="date"
                          value={ticketData.endDate || ""}
                          onChange={(e) =>
                            setTicketData((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] text-gray-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-lg font-semibold text-[#002147]">
                        Mô tả
                      </label>
                      <textarea
                        className="w-full h-[100px] mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                        rows={5}
                        placeholder="Nhập mô tả"
                        value={ticketData.description}
                        onChange={(e) =>
                          setTicketData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Giao diện chung
                <div className="w-[80%] flex flex-col items-center">
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                    Bạn hãy nhập nội dung và mô tả chi tiết
                  </h1>
                  <ProgressIndicator step={step} />

                  <div className="w-[80%]">
                    <label className="text-lg font-semibold text-[#002147]">
                      Nội dung
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập nội dung"
                      value={ticketData.title}
                      onChange={(e) =>
                        setTicketData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                    />
                    <p className="text-gray-500 text-sm mt-1">
                      Ngắn gọn, tối đa XX kí tự
                    </p>

                    <label className="text-lg font-semibold text-[#002147] mt-6 block">
                      Mô tả
                    </label>
                    <textarea
                      className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                      rows={5}
                      placeholder="Nhập mô tả"
                      value={ticketData.description}
                      onChange={(e) =>
                        setTicketData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bước 3 */}
          {step === 3 && (
            <div>
              <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                Bạn hãy cung cấp hình ảnh nếu có
              </h1>
              <ProgressIndicator step={step} />
              <div
                className="w-full border-dashed border-2 border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 mt-6 cursor-pointer"
                onClick={() => document.getElementById("fileUpload").click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  setTicketData((prev) => ({
                    ...prev,
                    images: [...prev.images, ...files],
                  }));
                }}
              >
                <img
                  src="/ticket/upload.png"
                  alt="Upload Icon"
                  className="w-16 h-16 mb-4"
                />
                <p className="text-md font-medium">
                  Kéo thả hoặc chọn tệp từ máy tính
                </p>
                <input
                  id="fileUpload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setTicketData((prev) => ({
                      ...prev,
                      images: [...prev.images, ...files],
                    }));
                  }}
                />
              </div>
              <div className="w-full flex justify-between items-center italic">
                <p className="text-sm text-gray-400">
                  Định dạng hỗ trợ: png, jpg, jpeg, heic
                </p>
                <p className="text-sm text-gray-400">
                  Dung lượng tối đa: XX MB
                </p>
              </div>
              {ticketData.images.length > 0 && (
                <div className="w-[70%] mt-6">
                  <h2 className="text-xl font-semibold text-[#002147] mb-2">
                    Ảnh đã tải lên
                  </h2>
                  <div className="flex gap-3 overflow-x-auto whitespace-nowrap py-2">
                    {ticketData.images.map((file, index) => (
                      <div
                        key={index}
                        className="relative w-[100px] h-[100px] inline-block flex-shrink-0"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Uploaded Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          className="absolute top-1 right-1 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          onClick={() => {
                            setTicketData((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bước 4 */}
          {step === 4 && (
            <div>
              <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                Note lại cho chúng tớ những điều cần thiết
              </h1>
              <ProgressIndicator step={step} />
              <div>
                <span className="font-semibold text-lg">Ghi chú</span>
                <textarea
                  className="w-full h-[150px] mt-3 p-3 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                  rows={3}
                  placeholder="Nhập ghi chú..."
                  value={ticketData.notes}
                  onChange={(e) =>
                    setTicketData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}

          {/* Bước 5 */}
          {step === 5 && (
            <div className="w-full flex flex-col items-center text-center pt-12">
              <img
                src="/ticket/final.png"
                className="w-48 h-64 mb-4"
                alt="Success Icon"
              />
              <h1 className="text-2xl font-bold text-gray-800">
                Cám ơn WISer {currentUser?.fullname}!
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Yêu cầu của bạn đã được ghi nhận...
              </p>
              {ticketCreatedId && (
                <p className="mt-4 text-xl font-semibold text-blue-600">
                  Mã Ticket của bạn:{" "}
                  <span className="font-bold">{ticketCreatedId}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Nút điều hướng chung */}
        <div className="absolute bottom-[10%] left-0 right-0 flex justify-center gap-4">
          {step > 1 && (
            <button
              className="px-6 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
              onClick={() => {
                if (step === 5) {
                  // Quay về bước 1 để tạo ticket mới
                  setTicketData({
                    type: "",
                    title: "",
                    description: "",
                    images: [],
                    notes: "",
                    priority: "Medium",
                  });
                  setSelectedOption(null);
                  setStep(1);
                } else {
                  setStep(step - 1);
                }
              }}
            >
              {step === 5 ? "Trang chính" : "Quay lại"}
            </button>
          )}

          {step < 5 && (
            <button
              className="px-6 py-2 bg-[#FF5733] text-white rounded-md hover:bg-[#E44D26] transition disabled:opacity-50"
              disabled={
                (step === 1 && !ticketData.type) ||
                (step === 2 &&
                  (!ticketData.title || !ticketData.description))
              }
              onClick={() => {
                if (step === 4) {
                  submitTicket();
                } else {
                  setStep(step + 1);
                }
              }}
            >
              {step === 4 ? "Hoàn tất" : "Tiếp tục"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCreate;
