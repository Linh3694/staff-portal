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
      "hallmark_of_fame": "HALLMARK OF HONOR",
      "hallmark_of_fame_02": "HALLMARK OF HONOR",
      "achievement_description": "The Hall of Honor is a place to recognize and honor the achievements of students and classes at Wellspring Hanoi. The achievements are divided into categories such as Class Honor, Student Honor, Top Graduates, Scholarship Talent, WISers Excellent, WISers Inspiration, WISers Honor, WISers Effort, Standardized Test Achievements, and Competition & Tournament Achievements.",
      "noClass": "Not updated",
      "achievement": "Achievement",
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
        name: "Mr. Nguyen Vinh Son",
        title: "Principal of Wellspring Hanoi",
        message:
          "Every student deserves to be embraced, recognized, and acknowledged for their noble qualities, positive values, achievements, and the results of their efforts. Kind acts, admirable behaviors, progress, exceptional efforts, or maturity in their thoughts and actions - all must be encouraged, supported, and honored.",
        quote: {
          text: "Education is not the filling of a pail, but the lighting of a fire.",
          author: "William Butler Yeats"
        }
      },
      principal2: {
        name: "Ms. Hoang Thi Minh",
        title: "Middle School Principal",
        message:
          "We always deeply appreciate and take pride in every effort and achievement you make. Scholarships and awards are not just recognition but also motivation for you to keep exploring, growing, and conquering new goals. Whether big or small, every accomplishment and experience is a valuable part of your journey to maturity. Let’s create unforgettable memories together and build a bright future ahead, WISers! We are committed to creating an energetic, loving, and creative educational environment where every student can reach their full potential."
      },
      principal3: {
        name: "Ms. Le Thuy Nga",
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
          "archivement": {
            "vi": "Học bổng Tài năng (50%-100%) trong 07 năm học liên tiếp (kể từ năm học 2017-2018). \n\nSinh viên ngành Sociology, Rutgers University–New Brunswick (New Jersey), Hoa Kỳ",
            "en": "50%-100% Talent Scholarship for 07 school year (2017-2024). \n\nCurrently a Sociology student at Rutgers University–New Brunswick (New Jersey, USA)"
          },
          "image": "/halloffame/student1.jpg",        
        },
        {
          "name": {
            "vi": "Hà Thị Thuỳ Dương",
            "en": "Ha Thi Thuy Duong"
          },
          "year": {
            "vi": "Học sinh lớp 12ADN3",
            "en": "Student of Class 12ADN3"
          },
          "quoteVi": "Suốt 7 năm đồng hành cùng chương trình Học bổng Tài năng, con đã có những trải nghiệm vô cùng đáng nhớ và ý nghĩa. Đây không chỉ là một chương trình hỗ trợ học tập mà còn là một hành trình phát triển bản thân, giúp con trưởng thành hơn qua từng năm tháng; đồng thời mở ra nhiều cơ hội để con tiếp tục vương xa hơn.",
          "quoteEn": "Over the past seven years, being a part of the Talent Scholarship Program has been an unforgettable and meaningful journey. This program is not just a source of academic support but also a path of personal growth that has shaped me year after year, opening up many opportunities for me to reach even further.",
          "archivement": {
            "vi": "Học bổng Tài năng (50%) trong 07 năm học liên tiếp (kể từ năm học 2018-2019)",
            "en": "50% Talent Scholarship for 07 school years (from 2018 to 2025)"
          },
          "image": "/halloffame/student5.jpg",
        },
        {
          "name": {
            "vi": "Vũ Hoàng Quân",
            "en": "Vu Hoang Quan"
          },
          "year": {
            "vi": "Học sinh lớp 12ADN3",
            "en": "Student of Class 12ADN3"
          },
          "quoteVi": "Con đã tham gia bốn kỳ thi học bổng của Wellspring – một chương trình ý nghĩa giúp con rèn luyện tư duy logic, sáng tạo và khám phá bản thân. Mỗi năm, nhà trường mang đến những chủ đề và hình thức thi mới. Con ấn tượng nhất với phần thi video cá nhân về 'hạnh phúc' - năm 2024, nơi con thể hiện dấu ấn riêng qua cách kể chuyện sáng tạo, chia sẻ niềm vui từ tiết học, hoạt động ngoại khóa và khoảnh khắc bên bạn bè. Con khuyên các bạn ứng tuyển hãy tự tin, sáng tạo và thể hiện rõ cá tính của mình.",
          "quoteEn": "I have participated in four Wellspring scholarship competitions—an inspiring program that has helped me develop logical thinking, creativity, and self-discovery. Each year, the school introduces new themes and testing formats. In 2024, I was most impressed by the individual video competition on 'happiness', where I expressed my unique perspective through creative storytelling, sharing the joy of engaging lessons, extracurricular activities, and moments with friends. My advice for future applicants is to be confident, think outside the box, and showcase their individuality.",
          "archivement": {
            "vi": "Học bổng Tài năng (25%-50%) trong 03 năm học liên tiếp (kể từ năm học 2022-2023)",
            "en": "25%-50% Talent Scholarship for 03 school years (from 2022 to 2025)"
          },
          "image": "/halloffame/student2.jpg",
        },
         {
          "name": {
            "vi": "Nguyễn Ngân Hà",
            "en": "Nguyen Ngan Ha"
          },
          "year": {
            "vi": "Học sinh lớp 6MT1",
            "en": "Student of Class 6MT1"
          },
          "quoteVi": "Con tự hào về bản thân và biết ơn bố mẹ vô cùng. Ban đầu, con không đặt quá nhiều kỳ vọng, nhưng khi nhận kết quả, con đã thực sự bất ngờ và hạnh phúc. Điều này tiếp thêm cho con động lực để không ngừng cố gắng, chinh phục những cột mốc mới trong tương lai.",
          "quoteEn": "I am incredibly proud of myself and deeply grateful to my parents. At first, I didn’t set high expectations, but when I saw the results, I was truly surprised and overjoyed. This has given me even more motivation to keep striving and conquer new milestones in the future.",
          "archivement": {
            "vi": "FCE 186/190, học sinh danh dự HKI",
            "en": "Achieved 186/190 on the FCE Exam \n\nHonor Student of the Semester"
          },
          "image": "/halloffame/student6.jpg",
        },
        {
          "name": {
            "vi": "Nguyễn Khải Anh",
            "en": "Nguyen Khai Anh"
          },
          "year": {
            "vi": "Học sinh lớp 9AD",
            "en": "Student of Class 9AD"
          },
          "quoteVi": "Trong suốt quá trình học tại Wellspring, chương trình học, hoạt động ngoại khóa, cuộc thi và học bổng đã là nguồn động lực lớn giúp con không ngừng phát triển, và con rất biết ơn vì điều đó. Bài học quan trọng nhất mà con rút ra từ hành trình của mình là hãy luôn giữ vững niềm tin rằng mình có thể chinh phục mọi thử thách. Chúc các bạn học sinh luôn tích cực tham gia các hoạt động ngoại khóa, luôn trau dồi kỹ năng, giữ một tinh thần tích cực và sáng tạo không ngừng.",
          "quoteEn": "Throughout my time at Wellspring, the curriculum, extracurricular activities, competitions, and scholarships have been a great source of motivation, helping me continuously grow, and I am truly grateful for that. The most important lesson I have learned from my journey is to always believe that I can overcome any challenge. I encourage you all to actively participate in extracurricular activities, continuously develop your skills, maintain a positive mindset, and always be creative.",
          "archivement": {
            "vi": "Học bổng Tài năng 50% (năm học 2024-2025)",
            "en": "The 50% Talent Scholarship (SY 2024-2025)"
          },
          "image": "/halloffame/student3.jpg",
        },
        {
          "name": {
            "vi": "Nguyễn Anh Thư",
            "en": "Nguyen Anh Thu"
          },
          "year": {
            "vi": "Học sinh lớp 7MT2",
            "en": "Student of Class 7MT2"
          },
          "quoteVi": "Trong suốt quá trình tham gia Học bổng Tài năng, con cảm thấy nhiều cảm xúc khác nhau. Lúc đầu, con chỉ coi cuộc thi này là một trải nghiệm thôi. Tuy nhiên, sau một thời gian, mình cảm thấy rất thích thu, tự hào khi gia thi học bổng này. Bí kíp chính của con là hãy là chính mình. Hãy thể hiện sự cá tính và bày tỏ quan điểm cá nhân.",
          "quoteEn": "Participating in the Talent Scholarship journey has been a rollercoaster of emotions. At first, I saw it as just another experience, but over time, I grew to love it and felt incredibly proud to be part of it. My biggest tip? Be yourself! Show your personality and express your unique perspective with confidence.",
          "archivement": {
            "vi": "Học bổng Tài năng (25%-50%) trong 02 năm học liên tiếp (kể từ năm học 2023-2024)",
            "en": "25%-50% Talent Scholarship for 02 school years (from 2023 to 2025)"
          },
          "image": "/halloffame/student7.jpg",
        },
        {
          "name": {
            "vi": "Phạm Quang Anh",
            "en": "Pham Quang Anh"
          },
          "year": {
            "vi": "Học sinh lớp 5A6",
            "en": "Student of Class 5A6"
          },
          "quoteVi": "Trong thời gian học ở trường Wellspring, con cảm thấy vui, thú vị, phù hợp với độ tuổi của con. Con được trải nghiệm rất nhiều kiến thức, kĩ năng bổ ích thông qua các tiết học như: Toán, thể thao, khoa học. Con luôn cảm ơn bố mẹ đã tạo điều kiện cho con học tập tại một ngôi trường tốt như Wellspring. Để đạt được học bổng thì con đặt lên hàng đầu sự chỉn chu trong làm bài; trả lời, thuyết trình lưu loát và sáng tạo không ngừng. Ngoài ra, bố mẹ là người giúp đỡ cho con, làm thầy cô hoặc ban giám khảo để con tập luyện thuyết trình. Từ đó, con trở nên tự tin, mạnh mẽ hơn khi khó khăn.",
          "quoteEn": "During my time studying at Wellspring School, I felt happy, engaged, and well-suited to my age. I gained a lot of valuable knowledge and skills through subjects like Math, Sports, and Science. I am always grateful to my parents for providing me with the opportunity to study at such a great school like Wellspring. In order to achieve the scholarship, I prioritize meticulousness in my work; I strive to respond, present fluently, and continuously think creatively. Additionally, my parents are the ones who support me, acting as teachers or judges to help me practice presenting. As a result, I have become more confident and resilient when faced with challenges.",
          "archivement": {
            "vi": "Học bổng Tài năng 50% (năm học 2024-2025)",
            "en": "The 50% Talent Scholarship (SY 2024-2025)"
          },
          "image": "/halloffame/student4.jpg",
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
      "achievement": "Thành tích",
      "noInterface": "Chưa có giao diện cho danh mục này.",
      "selectSchoolYear": "Chọn năm học",
      "selectSemester": "Chọn học kì",
      "selectMonth": "Chọn tháng",
      "hallmark_of_fame": "Dấu ấn danh vọng",
      "searchNamePlaceholder": "Tìm kiếm tên",
      "schoolYearText": "Năm học",
      "noMatchingRecords": "Không có record nào phù hợp...",
      "close": "Đóng",
      "class_honor": "Lớp Danh dự",
      "student_honor": "Học sinh Danh dự",
      "top_graduates": "Thủ khoa Tốt nghiệp",
      "scholarship_talent": "Học bổng Tài năng",
      "achievement_description": "Bảng vinh danh là nơi ghi nhận và vinh danh những thành tích của học sinh và lớp học tại Wellspring Hà Nội. Các thành tích được chia thành các danh mục như Lớp Danh dự, Học sinh Danh dự, Thủ khoa Tốt nghiệp, Học bổng Tài năng, WISers Ưu tú, WISers Truyền cảm hứng, WISers Danh dự, WISers Nỗ lực, Thành tích các bài thi chuẩn hóa, Thành tích trong các cuộc thi và giải đấu.",
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
          "Thầy, Cô và Nhà trường luôn trân trọng và tự hào về từng nỗ lực và thành tích mà các con đạt được. Học bổng và khen thưởng không chỉ là sự ghi nhận, mà còn là động lực để các con tiếp tục khám phá, phát triển bản thân và chinh phục những mục tiêu mới. Dù lớn hay nhỏ, mỗi thành tích hay trải nghiệm đều là một phần quan trọng trong hành trình trưởng thành. Hãy cùng nhau tạo nên những kỷ niệm đáng nhớ và xây dựng một tương lai rực rỡ nhé, các Wisers Trung học!"
      },
      principal3: {
        name: "Cô Lê Thuý Ngà ",
        title: "Hiệu trưởng khối Tiểu Học",
        message:
          "Cô rất ấm lòng khi mỗi ngày tới trường thấy các con hạnh phúc, biết yêu thương, ngoan ngoãn và trưởng thành! Tất cả những điều đó cần được Thầy Cô ghi nhận và khen thưởng giúp định hướng con đường phát triển, truyền cảm hứng phát huy mạnh mẽ, rực rỡ hơn những điều tốt đẹp mà các con đang hướng tới! Mỗi sự ghi nhận của Thầy Cô chắc chắn sẽ là những định hướng, những lời chỉ bảo giá trị mà các con yêu thích, luôn mong muốn nhận được. Thầy Cô sẽ luôn sát sao để ghi nhận, khen thưởng kịp thời, khách quan và toàn diện nhất trao đến các con. Cô chúc và mong tất cả các con sẽ luôn được ghi nhận, vinh danh -  luôn là niềm tự hào của Thầy Cô, Cha Mẹ!"
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
          "archivement": {
            "vi": "Học bổng Tài năng (50%-100%) trong 07 năm học liên tiếp (kể từ năm học 2017-2018). \nSinh viên ngành Sociology, Rutgers University–New Brunswick (New Jersey), Hoa Kỳ",
            "en": "50%-100% Talent Scholarship for 07 school year (2017-2024). \nCurrently a Sociology student at Rutgers University–New Brunswick (New Jersey, USA)"
          },
          "image": "/halloffame/student1.jpg",        
        },
        {
          "name": {
            "vi": "Hà Thị Thuỳ Dương",
            "en": "Ha Thi Thuy Duong"
          },
          "year": {
            "vi": "Học sinh lớp 12ADN3",
            "en": "Student of Class 12ADN3"
          },
          "quoteVi": "Suốt 7 năm đồng hành cùng chương trình Học bổng Tài năng, con đã có những trải nghiệm vô cùng đáng nhớ và ý nghĩa. Đây không chỉ là một chương trình hỗ trợ học tập mà còn là một hành trình phát triển bản thân, giúp con trưởng thành hơn qua từng năm tháng; đồng thời mở ra nhiều cơ hội để con tiếp tục vương xa hơn.",
          "quoteEn": "Over the past seven years, being a part of the Talent Scholarship Program has been an unforgettable and meaningful journey. This program is not just a source of academic support but also a path of personal growth that has shaped me year after year, opening up many opportunities for me to reach even further.",
          "archivement": {
            "vi": "Học bổng Tài năng (50%) trong 07 năm học liên tiếp (kể từ năm học 2018-2019)",
            "en": "50% Talent Scholarship for 07 school years (from 2018 to 2025)"
          },
          "image": "/halloffame/student5.jpg",
        },
        {
          "name": {
            "vi": "Vũ Hoàng Quân",
            "en": "Vu Hoang Quan"
          },
          "year": {
            "vi": "Học sinh lớp 12ADN3",
            "en": "Student of Class 12ADN3"
          },
          "quoteVi": "Con đã tham gia bốn kỳ thi học bổng của Wellspring – một chương trình ý nghĩa giúp con rèn luyện tư duy logic, sáng tạo và khám phá bản thân. Mỗi năm, nhà trường mang đến những chủ đề và hình thức thi mới. Con ấn tượng nhất với phần thi video cá nhân về 'hạnh phúc' - năm 2024, nơi con thể hiện dấu ấn riêng qua cách kể chuyện sáng tạo, chia sẻ niềm vui từ tiết học, hoạt động ngoại khóa và khoảnh khắc bên bạn bè. Con khuyên các bạn ứng tuyển hãy tự tin, sáng tạo và thể hiện rõ cá tính của mình.",
          "quoteEn": "I have participated in four Wellspring scholarship competitions—an inspiring program that has helped me develop logical thinking, creativity, and self-discovery. Each year, the school introduces new themes and testing formats. In 2024, I was most impressed by the individual video competition on 'happiness', where I expressed my unique perspective through creative storytelling, sharing the joy of engaging lessons, extracurricular activities, and moments with friends. My advice for future applicants is to be confident, think outside the box, and showcase their individuality.",
          "archivement": {
            "vi": "Học bổng Tài năng (25%-50%) trong 03 năm học liên tiếp (kể từ năm học 2022-2023)",
            "en": "25%-50% Talent Scholarship for 03 school years (from 2022 to 2025)"
          },
          "image": "/halloffame/student2.jpg",
        },
         {
          "name": {
            "vi": "Nguyễn Ngân Hà",
            "en": "Nguyen Ngan Ha"
          },
          "year": {
            "vi": "Học sinh lớp 6MT1",
            "en": "Student of Class 6MT1"
          },
          "quoteVi": "Con tự hào về bản thân và biết ơn bố mẹ vô cùng. Ban đầu, con không đặt quá nhiều kỳ vọng, nhưng khi nhận kết quả, con đã thực sự bất ngờ và hạnh phúc. Điều này tiếp thêm cho con động lực để không ngừng cố gắng, chinh phục những cột mốc mới trong tương lai.",
          "quoteEn": "I am incredibly proud of myself and deeply grateful to my parents. At first, I didn’t set high expectations, but when I saw the results, I was truly surprised and overjoyed. This has given me even more motivation to keep striving and conquer new milestones in the future.",
          "archivement": {
            "vi": "FCE 186/190, học sinh danh dự HKI",
            "en": "Achieved 186/190 on the FCE Exam \nHonor Student of the Semester"
          },
          "image": "/halloffame/student6.jpg",
        },
        {
          "name": {
            "vi": "Nguyễn Khải Anh",
            "en": "Nguyen Khai Anh"
          },
          "year": {
            "vi": "Học sinh lớp 9AD",
            "en": "Student of Class 9AD"
          },
          "quoteVi": "Trong suốt quá trình học tại Wellspring, chương trình học, hoạt động ngoại khóa, cuộc thi và học bổng đã là nguồn động lực lớn giúp con không ngừng phát triển, và con rất biết ơn vì điều đó. Bài học quan trọng nhất mà con rút ra từ hành trình của mình là hãy luôn giữ vững niềm tin rằng mình có thể chinh phục mọi thử thách. Chúc các bạn học sinh luôn tích cực tham gia các hoạt động ngoại khóa, luôn trau dồi kỹ năng, giữ một tinh thần tích cực và sáng tạo không ngừng.",
          "quoteEn": "Throughout my time at Wellspring, the curriculum, extracurricular activities, competitions, and scholarships have been a great source of motivation, helping me continuously grow, and I am truly grateful for that. The most important lesson I have learned from my journey is to always believe that I can overcome any challenge. I encourage you all to actively participate in extracurricular activities, continuously develop your skills, maintain a positive mindset, and always be creative.",
          "archivement": {
            "vi": "Học bổng Tài năng 50% (năm học 2024-2025)",
            "en": "The 50% Talent Scholarship (SY 2024-2025)"
          },
          "image": "/halloffame/student3.jpg",
        },
        {
          "name": {
            "vi": "Nguyễn Anh Thư",
            "en": "Nguyen Anh Thu"
          },
          "year": {
            "vi": "Học sinh lớp 7MT2",
            "en": "Student of Class 7MT2"
          },
          "quoteVi": "Trong suốt quá trình tham gia Học bổng Tài năng, con cảm thấy nhiều cảm xúc khác nhau. Lúc đầu, con chỉ coi cuộc thi này là một trải nghiệm thôi. Tuy nhiên, sau một thời gian, mình cảm thấy rất thích thu, tự hào khi gia thi học bổng này. Bí kíp chính của con là hãy là chính mình. Hãy thể hiện sự cá tính và bày tỏ quan điểm cá nhân.",
          "quoteEn": "Participating in the Talent Scholarship journey has been a rollercoaster of emotions. At first, I saw it as just another experience, but over time, I grew to love it and felt incredibly proud to be part of it. My biggest tip? Be yourself! Show your personality and express your unique perspective with confidence.",
          "archivement": {
            "vi": "Học bổng Tài năng (25%-50%) trong 02 năm học liên tiếp (kể từ năm học 2023-2024)",
            "en": "25%-50% Talent Scholarship for 02 school years (from 2023 to 2025)"
          },
          "image": "/halloffame/student7.jpg",
        },
        {
          "name": {
            "vi": "Phạm Quang Anh",
            "en": "Pham Quang Anh"
          },
          "year": {
            "vi": "Học sinh lớp 5A6",
            "en": "Student of Class 5A6"
          },
          "quoteVi": "Trong thời gian học ở trường Wellspring, con cảm thấy vui, thú vị, phù hợp với độ tuổi của con. Con được trải nghiệm rất nhiều kiến thức, kĩ năng bổ ích thông qua các tiết học như: Toán, thể thao, khoa học. Con luôn cảm ơn bố mẹ đã tạo điều kiện cho con học tập tại một ngôi trường tốt như Wellspring. Để đạt được học bổng thì con đặt lên hàng đầu sự chỉn chu trong làm bài; trả lời, thuyết trình lưu loát và sáng tạo không ngừng. Ngoài ra, bố mẹ là người giúp đỡ cho con, làm thầy cô hoặc ban giám khảo để con tập luyện thuyết trình. Từ đó, con trở nên tự tin, mạnh mẽ hơn khi khó khăn.",
          "quoteEn": "During my time studying at Wellspring School, I felt happy, engaged, and well-suited to my age. I gained a lot of valuable knowledge and skills through subjects like Math, Sports, and Science. I am always grateful to my parents for providing me with the opportunity to study at such a great school like Wellspring. In order to achieve the scholarship, I prioritize meticulousness in my work; I strive to respond, present fluently, and continuously think creatively. Additionally, my parents are the ones who support me, acting as teachers or judges to help me practice presenting. As a result, I have become more confident and resilient when faced with challenges.",
          "archivement": {
            "vi": "Học bổng Tài năng 50% (năm học 2024-2025)",
            "en": "The 50% Talent Scholarship (SY 2024-2025)"
          },
          "image": "/halloffame/student4.jpg",
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