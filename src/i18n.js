import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      wellcome_title: "Wellcome Wiser",
      welcome: "Welcome to Tet 2025",
      participate_event: "Participate in the event and share your joy!",
      upload_photo: "Upload Photo & Wish",
      top_10_photos: "Top 10 Most Loved Photos",
      photo_gallery: "Photo Gallery",
      event_name: "Event Name",
      upload_placeholder: "Enter your wish...",
      upload_button: "Upload",
      switch_language: "Switch Language",
      upload_photo_for: "Upload photo for",
      photo_upload: "Upload photo",
      message: "Message",
      cancel: "Cancel",
      upload_placeholder: "Write your message here...",
      upload_button: "Upload",
      "upload_success": "Photo uploaded successfully!",
      "upload_failed": "Failed to upload photo.",
      "upload_error": "Please select a photo and enter a message."
    },
  },
  vi: {
    translation: {
      wellcome_title: "Chào mừng WISER",
      welcome: "Chào mừng Tết 2025",
      participate_event: "Tham gia sự kiện và chia sẻ niềm vui!",
      upload_photo: "Tải Ảnh & Lời Chúc",
      top_10_photos: "Top 10 Ảnh Được Yêu Thích",
      photo_gallery: "Thư Viện Ảnh",
      event_name: "Tên Sự Kiện",
      upload_placeholder: "Nhập lời chúc của bạn...",
      upload_button: "Tải lên",
      switch_language: "Chuyển Ngôn Ngữ",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "vi", // Mặc định tiếng Việt
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;