import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {  
      "category": "Category",
      "homepage": "Homepage",
      "hallhonor": "Hall of Honor",
      "award": "Award",
      "schoolYear": "School Year",
      "semester": "Semester",
      "month": "Month",
      "language": "Language",
      "back_home": "Back to HomePage",
      "studenthonor": "Distinguished Student",
      "student_feedback": "Student Testimonials",
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
          author: "William Butler Yeats"
        }
      },
      principal2: {
        name: "Ms. Hoàng Thị Minh",
        title: "Middle School Principal",
        message:
          "Dear Wellspring Secondary Students,\n\n We always deeply appreciate and take pride in every effort and achievement you make. Scholarships and awards are not just recognition but also motivation for you to keep exploring, growing, and conquering new goals. Whether big or small, every accomplishment and experience is a valuable part of your journey to maturity. Let’s create unforgettable memories together and build a bright future ahead, WISers! We are committed to creating an energetic, loving, and creative educational environment where every student can reach their full potential."
      },
      principal3: {
        name: "Ms. Lê Thuý Ngà",
        title: "Elementary School Principal",
        message:
          "Every day, my heart is warmed by your joyful, kind, and respectful arrival at school, each moment a step in your growth. These admirable qualities will be recognized and rewarded by your teachers, who are dedicated to guiding you towards even brighter achievements. Each acknowledgment from your teachers is a cherished encouragement, meant to inspire and motivate you as they observe and ensure fairness in all rewards. I wish for each of you to continuously feel celebrated, upholding the pride of your teachers and parents"
      },
      "starStudents": [
        {
          "name": {
            "vi": "Phan Thế Việt",
            "en": "Phan The Viet"
          },
          "year": {
            "vi": "Cựu học sinh khóa 2023-2024",
            "en": "Alumni of 2023-2024"
          },
          "quoteVi": "Với mình, giá trị tiền tệ của học bổng hàng năm Wellspring trao cho con chỉ là một phần của lí do con luôn đăng ký mỗi năm. Con luôn trân trọng sự công nhận của nhà trường đối với những cố gắng, thành tích và cống hiến của mình đối với nhà trường. Điều này đã luôn tạo cho con động lực để tiếp tục nỗ lực hơn nữa. Ở Wellspring, mỗi học sinh là một cá nhân với những tài năng và cống hiến riêng - những tâm hồn rực rỡ đầy sắc màu, và quỹ học bổng tài năng Wellspring đã luôn tồn tại để ghi nhận và động viên các WISers. Lời khuyên của con dành cho các WISers mong muốn ứng tuyển là hãy tìm một thứ bạn đam mê và thấy ý nghĩa, hãy theo đuổi hết mình và cống hiến, và bạn sẽ thành công.",
          "quoteEn": "For me, the monetary value of the Wellspring Talent Scholarship was always only one side of why I applied again and again every year. I always saw the scholarship as the school’s recognition of my efforts, achievements, and contributions to the Wellspring community. This recognition gave me the motivation to continue giving my all and always strive for better. At Wellspring, each student has their own talents and contribution – the soul with beautifully unique shades. For my juniors who are pursuing a scholarship, my only advice is to find something you are passionate about, and put your all in it, and you will be successful.",
          "image": "/halloffame/student4.png",        
        },
        {
          "name": {
            "vi": "Vũ Hoàng Quân",
            "en": "Vu Hoang Quan"
          },
          "year": {
            "vi": "Học sinh lớp 12ADN3",
            "en": "Alumni of 2020 - 2022"
          },
          "quoteVi": "Con đã tham gia bốn kỳ thi học bổng của Wellspring – một chương trình ý nghĩa giúp con rèn luyện tư duy logic, sáng tạo và khám phá bản thân. Mỗi năm, nhà trường mang đến những chủ đề và hình thức thi mới. Con ấn tượng nhất với phần thi video cá nhân về 'hạnh phúc' - năm 2024, nơi con thể hiện dấu ấn riêng qua cách kể chuyện sáng tạo, chia sẻ niềm vui từ tiết học, hoạt động ngoại khóa và khoảnh khắc bên bạn bè. Con khuyên các bạn ứng tuyển hãy tự tin, sáng tạo và thể hiện rõ cá tính của mình.",
          "quoteEn": "I have participated in four Wellspring scholarship competitions—an inspiring program that has helped me develop logical thinking, creativity, and self-discovery. Each year, the school introduces new themes and testing formats. In 2024, I was most impressed by the individual video competition on 'happiness', where I expressed my unique perspective through creative storytelling, sharing the joy of engaging lessons, extracurricular activities, and moments with friends. My advice for future applicants is to be confident, think outside the box, and showcase their individuality.",
          "image": "/halloffame/student2.png",
        },
        {
          "name": {
            "vi": "Trần Minh Hoàng",
            "en": "Tran Minh Hoang"
          },
          "year": {
            "vi": "Cựu học sinh khoá 2019 - 2021",
            "en": "Alumni of 2019 - 2021"
          },
          "quoteVi": "Trong suốt quá trình học tại Wellspring, chương trình học, hoạt động ngoại khóa, cuộc thi và học bổng đã là nguồn động lực lớn giúp con không ngừng phát triển, và con rất biết ơn vì điều đó. Bài học quan trọng nhất mà con rút ra từ hành trình của mình là hãy luôn giữ vững niềm tin rằng mình có thể chinh phục mọi thử thách. Chúc các bạn học sinh luôn tích cực tham gia các hoạt động ngoại khóa, luôn trau dồi kỹ năng, giữ một tinh thần tích cực và sáng tạo không ngừng.",
          "quoteEn": "Throughout my time at Wellspring, the curriculum, extracurricular activities, competitions, and scholarships have been a great source of motivation, helping me continuously grow, and I am truly grateful for that. The most important lesson I have learned from my journey is to always believe that I can overcome any challenge. I encourage you all to actively participate in extracurricular activities, continuously develop your skills, maintain a positive mindset, and always be creative.",
          "image": "/halloffame/student3.png",
        },
        {
          "name": {
            "vi": "Phạm Thảo My",
            "en": "Pham Thao My"
          },
          "year": {
            "vi": "Cựu học sinh khoá 2018 - 2020",
            "en": "Alumni of 2018 - 2020"
          },
          "quoteVi": "Trong thời gian học ở trường Wellspring, con cảm thấy vui, thú vị, phù hợp với độ tuổi của con. Con được trải nghiệm rất nhiều kiến thức, kĩ năng bổ ích thông qua các tiết học như: Toán, thể thao, khoa học. Con luôn cảm ơn bố mẹ đã tạo điều kiện cho con học tập tại một ngôi trường tốt như Wellspring. Để đạt được học bổng thì con đặt lên hàng đầu sự chỉn chu trong làm bài; trả lời, thuyết trình lưu loát và sáng tạo không ngừng. Ngoài ra, bố mẹ là người giúp đỡ cho con, làm thầy cô hoặc ban giám khảo để con tập luyện thuyết trình. Từ đó, con trở nên tự tin, mạnh mẽ hơn khi khó khăn.",
          "quoteEn": "During my time studying at Wellspring School, I felt happy, engaged, and well-suited to my age. I gained a lot of valuable knowledge and skills through subjects like Math, Sports, and Science. I am always grateful to my parents for providing me with the opportunity to study at such a great school like Wellspring. In order to achieve the scholarship, I prioritize meticulousness in my work; I strive to respond, present fluently, and continuously think creatively. Additionally, my parents are the ones who support me, acting as teachers or judges to help me practice presenting. As a result, I have become more confident and resilient when faced with challenges.",
          "image": "/halloffame/student4.png",
        }
      ]
    }
  },
  vi: {
    translation: {
      "category": "Danh mục",
      "homepage": "Trang chủ",
      "hallhonor": "Bảng vinh danh",
      "award": "Danh hiệu",
      "schoolYear": "Năm học",
      "semester": "Học kì",
      "month": "Tháng",
      "language": "Ngôn ngữ",
      "back_home": "Quay lại trang chủ",
      "studenthonor": "Học sinh tiêu biểu",
      "student_feedback": "CẢM NHẬN CỦA HỌC SINH",   
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
          author: "William Butler Yeats"
        }
      },
      principal2: {
        name: "Cô Hoàng Thị Minh",
        title: "Hiệu trưởng khối Trung Học",
        message:
          "Các con học sinh Trung học thân yêu,\n\nThầy, Cô và Nhà trường luôn trân trọng và tự hào về từng nỗ lực và thành tích mà các con đạt được. Học bổng và khen thưởng không chỉ là sự ghi nhận, mà còn là động lực để các con tiếp tục khám phá, phát triển bản thân và chinh phục những mục tiêu mới. Dù lớn hay nhỏ, mỗi thành tích hay trải nghiệm đều là một phần quan trọng trong hành trình trưởng thành. Hãy cùng nhau tạo nên những kỷ niệm đáng nhớ và xây dựng một tương lai rực rỡ nhé, các Wisers Trung học!"
      },
      principal3: {
        name: "Cô Lê Thuý Ngà ",
        title: "Hiệu trưởng khối Tiểu Học",
        message:
          "Các con Tiểu học thân yêu,\n\n Cô rất ấm lòng khi mỗi ngày tới trường thấy các con hạnh phúc, biết yêu thương, ngoan ngoãn và trưởng thành! Tất cả những điều đó cần được Thầy Cô ghi nhận và khen thưởng giúp định hướng con đường phát triển, truyền cảm hứng phát huy mạnh mẽ, rực rỡ hơn những điều tốt đẹp mà các con đang hướng tới! Mỗi sự ghi nhận của Thầy Cô chắc chắn sẽ là những định hướng, những lời chỉ bảo giá trị mà các con yêu thích, luôn mong muốn nhận được. Thầy Cô sẽ luôn sát sao để ghi nhận, khen thưởng kịp thời, khách quan và toàn diện nhất trao đến các con. Cô chúc và mong tất cả các con sẽ luôn được ghi nhận, vinh danh -  luôn là niềm tự hào của Thầy Cô, Cha Mẹ!"
      },
      "starStudents": [
        {
          "name": {
            "vi": "Phan Thế Việt",
            "en": "Phan The Viet"
          },
          "year": {
            "vi": "Cựu học sinh khóa 2023-2024",
            "en": "Alumni of 2023-2024"
          },
          "quoteVi": "Với mình, giá trị tiền tệ của học bổng hàng năm Wellspring trao cho con chỉ là một phần của lí do con luôn đăng ký mỗi năm. Con luôn trân trọng sự công nhận của nhà trường đối với những cố gắng, thành tích và cống hiến của mình đối với nhà trường. Điều này đã luôn tạo cho con động lực để tiếp tục nỗ lực hơn nữa. Ở Wellspring, mỗi học sinh là một cá nhân với những tài năng và cống hiến riêng - những tâm hồn rực rỡ đầy sắc màu, và quỹ học bổng tài năng Wellspring đã luôn tồn tại để ghi nhận và động viên các WISers. Lời khuyên của con dành cho các WISers mong muốn ứng tuyển là hãy tìm một thứ bạn đam mê và thấy ý nghĩa, hãy theo đuổi hết mình và cống hiến, và bạn sẽ thành công.",
          "quoteEn": "For me, the monetary value of the Wellspring Talent Scholarship was always only one side of why I applied again and again every year. I always saw the scholarship as the school’s recognition of my efforts, achievements, and contributions to the Wellspring community. This recognition gave me the motivation to continue giving my all and always strive for better. At Wellspring, each student has their own talents and contribution – the soul with beautifully unique shades. For my juniors who are pursuing a scholarship, my only advice is to find something you are passionate about, and put your all in it, and you will be successful.",
          "image": "/halloffame/student4.png",        
        },
        {
          "name": {
            "vi": "Vũ Hoàng Quân",
            "en": "Vu Hoang Quan"
          },
          "year": {
            "vi": "Học sinh lớp 12ADN3",
            "en": "Alumni of 2020 - 2022"
          },
          "quoteVi": "Con đã tham gia bốn kỳ thi học bổng của Wellspring – một chương trình ý nghĩa giúp con rèn luyện tư duy logic, sáng tạo và khám phá bản thân. Mỗi năm, nhà trường mang đến những chủ đề và hình thức thi mới. Con ấn tượng nhất với phần thi video cá nhân về 'hạnh phúc' - năm 2024, nơi con thể hiện dấu ấn riêng qua cách kể chuyện sáng tạo, chia sẻ niềm vui từ tiết học, hoạt động ngoại khóa và khoảnh khắc bên bạn bè. Con khuyên các bạn ứng tuyển hãy tự tin, sáng tạo và thể hiện rõ cá tính của mình.",
          "quoteEn": "I have participated in four Wellspring scholarship competitions—an inspiring program that has helped me develop logical thinking, creativity, and self-discovery. Each year, the school introduces new themes and testing formats. In 2024, I was most impressed by the individual video competition on 'happiness', where I expressed my unique perspective through creative storytelling, sharing the joy of engaging lessons, extracurricular activities, and moments with friends. My advice for future applicants is to be confident, think outside the box, and showcase their individuality.",
          "image": "/halloffame/student2.png",
        },
        {
          "name": {
            "vi": "Trần Minh Hoàng",
            "en": "Tran Minh Hoang"
          },
          "year": {
            "vi": "Cựu học sinh khoá 2019 - 2021",
            "en": "Alumni of 2019 - 2021"
          },
          "quoteVi": "Trong suốt quá trình học tại Wellspring, chương trình học, hoạt động ngoại khóa, cuộc thi và học bổng đã là nguồn động lực lớn giúp con không ngừng phát triển, và con rất biết ơn vì điều đó. Bài học quan trọng nhất mà con rút ra từ hành trình của mình là hãy luôn giữ vững niềm tin rằng mình có thể chinh phục mọi thử thách. Chúc các bạn học sinh luôn tích cực tham gia các hoạt động ngoại khóa, luôn trau dồi kỹ năng, giữ một tinh thần tích cực và sáng tạo không ngừng.",
          "quoteEn": "Throughout my time at Wellspring, the curriculum, extracurricular activities, competitions, and scholarships have been a great source of motivation, helping me continuously grow, and I am truly grateful for that. The most important lesson I have learned from my journey is to always believe that I can overcome any challenge. I encourage you all to actively participate in extracurricular activities, continuously develop your skills, maintain a positive mindset, and always be creative.",
          "image": "/halloffame/student3.png",
        },
        {
          "name": {
            "vi": "Phạm Thảo My",
            "en": "Pham Thao My"
          },
          "year": {
            "vi": "Cựu học sinh khoá 2018 - 2020",
            "en": "Alumni of 2018 - 2020"
          },
          "quoteVi": "Trong thời gian học ở trường Wellspring, con cảm thấy vui, thú vị, phù hợp với độ tuổi của con. Con được trải nghiệm rất nhiều kiến thức, kĩ năng bổ ích thông qua các tiết học như: Toán, thể thao, khoa học. Con luôn cảm ơn bố mẹ đã tạo điều kiện cho con học tập tại một ngôi trường tốt như Wellspring. Để đạt được học bổng thì con đặt lên hàng đầu sự chỉn chu trong làm bài; trả lời, thuyết trình lưu loát và sáng tạo không ngừng. Ngoài ra, bố mẹ là người giúp đỡ cho con, làm thầy cô hoặc ban giám khảo để con tập luyện thuyết trình. Từ đó, con trở nên tự tin, mạnh mẽ hơn khi khó khăn.",
          "quoteEn": "During my time studying at Wellspring School, I felt happy, engaged, and well-suited to my age. I gained a lot of valuable knowledge and skills through subjects like Math, Sports, and Science. I am always grateful to my parents for providing me with the opportunity to study at such a great school like Wellspring. In order to achieve the scholarship, I prioritize meticulousness in my work; I strive to respond, present fluently, and continuously think creatively. Additionally, my parents are the ones who support me, acting as teachers or judges to help me practice presenting. As a result, I have become more confident and resilient when faced with challenges.",
          "image": "/halloffame/student4.png",
        }
      ]
    }
  }
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