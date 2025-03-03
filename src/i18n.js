import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {  
      "category": "Category",
      "award": "Award",
      "schoolYear": "School Year",
      "semester": "Semester",
      "month": "Month",
      "language": "Language",
      "back_home": "Back to HomePage",
      "noPhoto": "No photo",
      "classLabel": "Class",
      "schoolYearLabel": "Label",
      "noClass": "Not updated",
      "noInterface": "No interface for this category yet.",
      "selectSchoolYear": "Select school year",
      "selectSemester": "Select semester",
      "selectMonth": "Select month",
      "searchNamePlaceholder": "Search by name",
      "schoolYearText": "School Year",
      "noMatchingRecords": "No matching records found...",
      "close": "Close",
      "class_honor": "Class Honor",
      "student_honor": "Student Honor",
      "top_graduates": "Top Graduates",
      "scholarship_talent": "Scholarship Talent",
      "wiser_excellent": "WISers Excellent",
      "wiser_inspiration": "WISers Inspiration",
      "wiser_honor": "WISers Honor",
      "wiser_effort": "WISers Effort",
      "standardized_test": "Standardized Test Achievements",
      "competition": "Competition & Tournament Achievements",
      "searchClassPlaceholder": "Search class...",
      "primary": "Primary",
      "secondary": "Secondary",
      "highschool": "Highschool",
      "category_67b5a7864c93fbb31475ad44": "Student Honor",
      "category_67b5a98b4c93fbb31475ad56": "Effort Award",
      "category_67b5a7c84c93fbb31475ad47": "Class Honor",
      "principalMessageHeader": "Principal's Message",

      principal1: {
        name: "Mr. Nguyễn Vĩnh Sơn",
        title: "Principal of Wellspring Hanoi",
        message:
          "Mỗi con học sinh đều xứng đáng được đón nhận, ghi nhận và công nhận về những phẩm chất cao quý, những giá trị tốt đẹp, những thành tích, kết quả nỗ lực của bản thân. Những việc làm tốt, những hành động đẹp, những tiến bộ, nỗ lực vượt trội hay sự trưởng thành trong suy nghĩ, hành động của các con - tất cả đều cần được khích lệ, động viên và vinh danh.",
        quote: {
          text: "Education is not the filling of a pail, but the lighting of a fire.",
          author: "William Butler Yeats",
        },
      },
      principal2: {
        name: "Ms. Hoàng Thị Minh",
        title: "Middle School Principal",
        message:
          "Dear Wellspring Secondary Students,\n\n We always deeply appreciate and take pride in every effort and achievement you make. Scholarships and awards are not just recognition but also motivation for you to keep exploring, growing, and conquering new goals. Whether big or small, every accomplishment and experience is a valuable part of your journey to maturity. Let’s create unforgettable memories together and build a bright future ahead, WISers!We are committed to creating an energetic, loving, and creative educational environment where every student can reach their full potential.",
      },
      principal3: {
        name: "Ms. Lê Thuý Ngà", 
        title: "Elementary School Principal",
        message:
          "Every day, my heart is warmed by your joyful, kind, and respectful arrival at school, each moment a step in your growth. These admirable qualities will be recognized and rewarded by your teachers, who are dedicated to guiding you towards even brighter achievements. Each acknowledgment from your teachers is a cherished encouragement, meant to inspire and motivate you as they observe and ensure fairness in all rewards. I wish for each of you to continuously feel celebrated, upholding the pride of your teachers and parents",
      },
    },
  },
  vi: {
    translation: {
      "category": "Danh mục",
      "award": "Danh hiệu",
      "schoolYear": "Năm học",
      "semester": "Học kì",
      "month": "Tháng",
      "language": "Ngôn ngữ",
      "back_home": "Quay lại trang chủ",
      "noPhoto": "Chưa có ảnh",
      "classLabel": "Lớp",
      "schoolYearLabel": "Khoá",
      "noClass": "Chưa cập nhật lớp",
      "noInterface": "Chưa có giao diện cho danh mục này.",
      "selectSchoolYear": "Chọn năm học",
      "selectSemester": "Chọn học kì",
      "selectMonth": "Chọn tháng",
      "searchNamePlaceholder": "Tìm kiếm tên",
      "schoolYearText": "Năm học",
      "noMatchingRecords": "Không có record nào phù hợp...",
      "close": "Đóng",
      "class_honor": "Lớp Danh dự",
      "student_honor": "Học sinh Danh dự",
      "top_graduates": "Thủ khoa Tốt nghiệp",
      "scholarship_talent": "Học bổng Tài năng",
      "wiser_excellent": "WISers Ưu tú",
      "wiser_inspiration": "WISers Truyền cảm hứng",
      "wiser_honor": "WISers Danh dự",
      "wiser_effort": "WISers Nỗ lực",
      "standardized_test": "Thành tích các bài thi chuẩn hóa",
      "competition": "Thành tích trong các cuộc thi và giải đấu",
      "searchClassPlaceholder": "Tìm tên lớp...",
      "primary": "Tiểu Học",
      "secondary": "Trung học Cơ sở",
      "highschool": "Trung học Phổ thông",
      "category_67b5a7864c93fbb31475ad44": "Học sinh Danh dự",
      "category_67b5a98b4c93fbb31475ad56": "Học sinh Nỗ lực",
      "category_67b5a7c84c93fbb31475ad47": "Lớp Danh dự",
      "principalMessageHeader": "Thông điệp từ Hiệu trưởng",
      principal1: {
        name: "TS. Nguyễn Vĩnh Sơn",
        title: "Tổng Hiệu trưởng Wellspring Hanoi",
        message:
          "Mỗi con học sinh đều xứng đáng được đón nhận, ghi nhận và công nhận về những phẩm chất cao quý, những giá trị tốt đẹp, những thành tích, kết quả nỗ lực của bản thân. Những việc làm tốt, những hành động đẹp, những tiến bộ, nỗ lực vượt trội hay sự trưởng thành trong suy nghĩ, hành động của các con - tất cả đều cần được khích lệ, động viên và vinh danh.",
        quote: {
          text: "Giáo dục không phải là làm đầy một chiếc bình, mà là thắp sáng một ngọn lửa.",
          author: "William Butler Yeats",
        },
      },
      principal2: {
        name: "Cô Hoàng Thị Minh",
        title: "Hiệu trưởng khối Trung Học",
        message:
          "Các con học sinh Trung học thân mến,\n\nThầy, Cô và Nhà trường luôn trân trọng và tự hào về từng nỗ lực và thành tích mà các con đạt được. Học bổng và khen thưởng không chỉ là sự ghi nhận, mà còn là động lực để các con tiếp tục khám phá, phát triển bản thân và chinh phục những mục tiêu mới. Dù lớn hay nhỏ, mỗi thành tích hay trải nghiệm đều là một phần quan trọng trong hành trình trưởng thành. Hãy cùng nhau tạo nên những kỷ niệm đáng nhớ và xây dựng một tương lai rực rỡ nhé, các Wisers Trung học!",
        },
      principal3: {
        name: "Cô Lê Thuý Ngà ",
        title: "Hiệu trưởng khối Tiểu Học",
        message:
          "Các con Tiểu học thân yêu,\n\n Cô rất ấm lòng khi mỗi ngày tới trường thấy các con hạnh phúc, biết yêu thương, ngoan ngoãn và trưởng thành! Tất cả những điều đó cần được Thầy Cô ghi nhận và khen thưởng giúp định hướng con đường phát triển, truyền cảm hứng phát huy mạnh mẽ, rực rỡ hơn những điều tốt đẹp mà các con đang hướng tới! Mỗi sự ghi nhận của Thầy Cô chắc chắn sẽ là những định hướng, những lời chỉ bảo giá trị mà các con yêu thích, luôn mong muốn nhận được. Thầy Cô sẽ luôn sát sao để ghi nhận, khen thưởng kịp thời, khách quan và toàn diện nhất trao đến các con. Cô chúc và mong tất cả các con sẽ luôn được ghi nhận, vinh danh -  luôn là niềm tự hào của Thầy Cô, Cha Mẹ! ",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "vi",       // Ngôn ngữ mặc định (tiếng Việt)
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;