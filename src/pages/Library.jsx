import { useEffect, useState } from "react";
import { API_URL, BASE_URL } from "../config";
import { HiMiniArrowUpRight } from "react-icons/hi2";

const Library = () => {
  const [libraries, setLibraries] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/libraries/full-libraries`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLibraries(data.slice(0, 4)); // Show latest 4
      });
  }, []);

  return (
    <div className=" bg-white">
      {/* Header */}
      <header className="w-full bg-white fixed justify-between items-center px-20 py-6 z-50">
        <div className="w-full flex flex-row justify-between items-center">
          <div className="w-full flex items-center gap-4">
            <img
              src="/library/wellspring-logo.png"
              alt="Wellspring logo"
              className="h-16 mr-16"
            />
            <nav className="flex gap-12 text-sm font-medium">
              <a href="#">Trang chủ</a>
              <a href="#">Thư viện sách</a>
              <a href="#">Hoạt động</a>
              <a href="#">Mượn - Trả sách</a>
              <a href="#">Tìm kiếm sách</a>
            </nav>
          </div>
          <div className="w-1/3 flex items-center gap-4 text-sm">
            <span>
              Chào mừng WISer{" "}
              <strong className="text-[#002855]">Nguyễn Hải Linh</strong>
            </span>
            <span className="text-xl">🇻🇳</span>
            <span className="text-xl">🔔</span>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center">
        <div className="absolute right-[3%] top-[30%]">
          <img
            src="/library/hero-image-2.jpg"
            alt="Books left"
            className="w-96 h-96 object-cover rounded-full -translate-y-32"
          />
        </div>
        <div className="relative flex flex-row justify-between items-center w-full px-20">
          {/* Left Image */}

          {/* Center Text */}
          <div className="flex flex-col items-center gap-16 z-10">
            <h1 className="text-9xl font-black text-orange-red z-10 -translate-x-40">
              THƯ VIỆN
            </h1>
            <img
              src="/library/moses.svg"
              alt="Library hero"
              className="w-full"
            />
            <h1 className="text-9xl font-black text-[#002855] z-10 translate-x-40">
              WELLSPRING
            </h1>
          </div>
        </div>
        {/* Right Image */}
        <div className="absolute left-[3%] bottom-[30%]">
          <img
            src="/library/hero-image-2.jpg"
            alt="Books right"
            className="w-96 h-96 object-cover rounded-full translate-y-32"
          />
        </div>
        <div className="absolute bottom-[10%]">
          <button className="flex items-center gap-2 bg-orange-red text-white px-6 py-3 rounded-full text-base font-bold hover:bg-orange-600">
            Mở tủ sách
            <HiMiniArrowUpRight className="font-bold w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Section: Sách Mới */}
      <section className="w-full h-screen py-16 pl-20 bg-white">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
          <h2 className="text-4xl font-extrabold text-[#002855]">SÁCH MỚI</h2>
        </div>
        <div className="border-l-2 border-y-2 border-[#DDDDDD] rounded-l-full py-10 pl-20 flex justify-center gap-6 overflow-x-hidden">
          {libraries.map((lib) => (
            <div
              key={lib._id}
              className="w-1/3 flex flex-col items-center text-center border-r-2 border-[#DDDDDD] group relative"
            >
              <div className="relative w-[200px] h-[266px] min-h-[266px] flex items-center justify-center">
                {lib.coverImage ? (
                  <img
                    src={`${BASE_URL}/${lib.coverImage}`}
                    alt={lib.title}
                    className="object-contain w-auto h-full"
                  />
                ) : (
                  <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                    <span className="text-sm text-gray-500">No Image</span>
                  </div>
                )}
                <div className="absolute -top-2 -right-10 bg-[#f6f6f6] rounded-full p-2 shadow text-gray-500">
                  <HiMiniArrowUpRight className="font-semibold w-5 h-5" />
                </div>
              </div>
              <div className="w-full text-center">
                <p className="text-sm font-bold uppercase text-[#002855] mt-2">
                  {lib.title}
                </p>
                <div className="mt-12">
                  <p className="text-sm font-semibold text-[#757575]">
                    {lib.authors?.join(", ") || "Chưa có tác giả"}
                  </p>
                  <p className="text-sm font-semibold text-[#757575]">
                    {lib.category || "Chưa rõ thể loại"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Library;
