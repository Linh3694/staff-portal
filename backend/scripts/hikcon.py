from datetime import datetime, timedelta
import pytz
import random
import string
import requests
from requests.auth import HTTPDigestAuth
import json
import os


class AcsEventRequester:
    def __init__(self, credentials_file):
        self.credentials = self._load_credentials(credentials_file)
        self.base_url = f"http://{self.credentials['DEVICE_IP']}"
        self.auth = HTTPDigestAuth(self.credentials['USERNAME'], self.credentials['PASSWORD'])
    
    def _load_credentials(self, filepath):
        credentials = {}
        with open(filepath, 'r') as file:
            for line in file:
                key, value = line.strip().split('=')
                credentials[key] = value
        return credentials
    
    def _generate_search_id(self):
        return ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    
    def _get_times_for_day(self, day_offset):
        """
        Trả về start_time và end_time cho một ngày cụ thể.
        day_offset: số ngày lùi lại từ ngày hiện tại.
        """
        tz = pytz.timezone("Asia/Bangkok")
        target_day = datetime.now(tz) - timedelta(days=day_offset)
        start_time = target_day.replace(hour=0, minute=0, second=0).strftime("%Y-%m-%dT%H:%M:%S")
        end_time = target_day.replace(hour=23, minute=59, second=59).strftime("%Y-%m-%dT%H:%M:%S")
        return start_time, end_time
    
    def make_request(self, days=7):
        """
        Lặp qua nhiều ngày để lấy dữ liệu.
        days: số ngày cần lấy dữ liệu (mặc định 7 ngày)
        """
        formatted_data = []  # Danh sách lưu dữ liệu đã được định dạng

        for day_offset in range(days):
            start_time, end_time = self._get_times_for_day(day_offset)
            search_result_position = 0
            url = f"{self.base_url}/ISAPI/AccessControl/AcsEvent?format=json"

            while True:
                payload = {
                    "AcsEventCond": {
                        "searchID": self._generate_search_id(),
                        "searchResultPosition": search_result_position,
                        "maxResults": 30,
                        "startTime": start_time,
                        "endTime": end_time,
                        "major": 0,
                        "minor": 0
                    }
                }

                response = requests.post(url, json=payload, auth=self.auth, headers={"Content-Type": "application/json"})

                if response.status_code == 401:
                    print("Lỗi 401 - Xác thực thất bại. Thử xác thực lại...")
                    self.auth = HTTPDigestAuth(self.credentials['USERNAME'], self.credentials['PASSWORD'])
                    continue  # Gửi lại yêu cầu

                if response.status_code != 200:
                    print(f"Lỗi: {response.status_code} khi lấy dữ liệu cho ngày {start_time}.")
                    break

                result = response.json()
                info_list = result.get("AcsEvent", {}).get("InfoList", [])
                if not info_list:
                    break

                # Lọc và định dạng dữ liệu
                for item in info_list:
                    if "employeeNoString" in item and "time" in item:
                        formatted_data.append({
                            "time": item["time"],
                            "name": item.get("name", "N/A"),
                            "employeeCode": item["employeeNoString"],
                        })

                search_result_position += len(info_list)
                if result["AcsEvent"].get("responseStatusStrg") != "MORE":
                    break

        return formatted_data
    
    def upload_to_backend(self, data):
        url = "https://staff-portal.wellspring.edu.vn/api/users/attendance"  # API backend
        headers = {"Content-Type": "application/json"}
        successful_uploads = 0
        failed_uploads = 0

        for record in data:
            payload = {
                "employeeCode": record["employeeCode"],
                "attendanceLog": [
                    {
                        "time": record["time"]
                    }
                ]
            }
            try:
                response = requests.put(url, json=payload, headers=headers, timeout=10)  # Dùng PUT để cập nhật
                if response.status_code in [200, 201]:
                    successful_uploads += 1
                else:
                    failed_uploads += 1
            except Exception:
                failed_uploads += 1

        print(f"--> Upload hoàn tất: Thành công: {successful_uploads}, Thất bại: {failed_uploads}")
        return successful_uploads, failed_uploads


if __name__ == "__main__":
    credentials_dir = "./"  # Thư mục chứa các file credentials
    credentials_files = [f for f in os.listdir(credentials_dir) if f.startswith("credentials") and f.endswith(".txt")]

    days = 2

    for credentials_file in credentials_files:
        print(f"\n[Đang đồng bộ từ file: {credentials_file}]")
        requester = AcsEventRequester(os.path.join(credentials_dir, credentials_file))
        data = requester.make_request(days=days)

        if data:
            print(f"--> Số bản ghi đã lấy được: {len(data)}")
            successful, failed = requester.upload_to_backend(data)
        else:
            print(f"Không có dữ liệu được tìm thấy cho {credentials_file}.")