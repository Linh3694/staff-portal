import React from "react";
import { FiSearch, FiMoreHorizontal } from "react-icons/fi"; // Ví dụ icon
import { FaCircle } from "react-icons/fa";

const ChatPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Left */}
      <div className="w-80 bg-white border-r border-gray-200">
        {/* Categories + Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md">Categories</button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search message"
                className="border rounded-md py-2 px-3 text-sm w-48"
              />
              <FiSearch className="absolute right-2 top-2 text-gray-400" />
            </div>
          </div>
        </div>
        {/* List Message */}
        <div className="p-4">
          {/* Demo 1 item message */}
          <div className="flex items-center justify-between mb-4 hover:bg-gray-100 p-2 rounded-md cursor-pointer">
            <div className="flex items-center">
              <img
                src={`https://i.pravatar.cc/100?img=6`}
                alt="user"
                className="w-10 h-10 rounded-full object-cover mr-2"
              />
              <div>
                <div className="font-semibold">Moise Kean</div>
                <div className="text-sm text-gray-500">Is this item still available?</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">04:44 AM</div>
          </div>

          {/* Tạo thêm item khác cho giống UI */}
          <div className="flex items-center justify-between mb-4 hover:bg-gray-100 p-2 rounded-md cursor-pointer">
            <div className="flex items-center">
              <img
                src={`https://i.pravatar.cc/100?img=12`}
                alt="user"
                className="w-10 h-10 rounded-full object-cover mr-2"
              />
              <div>
                <div className="font-semibold">Undertaker</div>
                <div className="text-sm text-gray-500">How much does this cost?</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">04:44 AM</div>
          </div>

          {/* ... Bạn có thể thêm nhiều item hơn */}
        </div>
      </div>

      {/* Middle: Chat Detail */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-white border-b border-gray-200 p-4">
          <div>
            <h1 className="text-xl font-semibold">Message Detail</h1>
            <p className="text-sm text-gray-500">Moise Kean | Last Seen Recently</p>
          </div>
          <div className="flex space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-md">📞</button>
            <button className="p-2 hover:bg-gray-100 rounded-md">📹</button>
            <button className="p-2 hover:bg-gray-100 rounded-md">⚙</button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
          {/* Ngày */}
          <div className="text-center my-2 text-sm text-gray-500">
            27 December 2024
          </div>

          {/* Tin nhắn */}
          <div className="flex flex-col space-y-3">
            {/* 1 tin nhắn từ user A */}
            <div className="flex items-start w-full">
              <div className="bg-black text-white px-4 py-2 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-sm">
                Wow, it so nice so how much these items?
              </div>
            </div>

            {/* Gửi hình ảnh */}
            <div className="flex items-start">
              {/* Demo 2 ảnh */}
              <img
                src="https://via.placeholder.com/100x100?text=Black+Bottle"
                alt="img1"
                className="rounded-md mr-2"
              />
              <img
                src="https://via.placeholder.com/100x100?text=White+Bottle"
                alt="img2"
                className="rounded-md"
              />
            </div>

            {/* 1 tin nhắn bên phải (của mình) */}
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-tl-lg rounded-bl-lg rounded-br-lg max-w-sm">
                Today there is a promo for you
              </div>
            </div>
          </div>
        </div>

        {/* Input Chat */}
        <div className="bg-white p-4 border-t border-gray-200 flex items-center">
          <input
            type="text"
            placeholder="Your Message"
            className="flex-1 border rounded-md px-3 py-2 text-sm mr-2"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md">Send</button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        {/* Thông tin user */}
        <div className="flex flex-col items-center mb-4">
          <img
            src="https://i.pravatar.cc/100?img=6"
            alt="Moise Kean"
            className="w-16 h-16 rounded-full object-cover"
          />
          <h2 className="text-lg font-semibold mt-2">Moise Kean</h2>
          <p className="text-sm text-gray-400">Last Seen Recently</p>
          <div className="flex space-x-3 mt-2 text-gray-500">
            <a href="#facebook">Fb</a>
            <a href="#twitter">Tw</a>
            <a href="#instagram">Ig</a>
          </div>
        </div>

        {/* Media */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Media (4444)</h3>
          <div className="grid grid-cols-3 gap-2">
            {/* 6 ảnh mẫu */}
            {[1,2,3,4,5,6].map((item) => (
              <img
                key={item}
                src={`https://via.placeholder.com/60?text=Img${item}`}
                alt={`media${item}`}
                className="rounded-md"
              />
            ))}
          </div>
          <button className="mt-2 text-blue-500 text-sm">Load More Image</button>
        </div>

        {/* Category Label */}
        <div>
          <h3 className="font-semibold mb-2">Category Label</h3>
          <div className="flex flex-col space-y-2 text-sm">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-blue-500" />
              <span>Important</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-blue-500" />
              <span>Customer</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-blue-500" />
              <span>Friends</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-blue-500" />
              <span>Family</span>
            </label>
          </div>
          <button className="mt-2 text-blue-500 text-sm">Add Category Label</button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;