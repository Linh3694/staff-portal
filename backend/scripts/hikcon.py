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
    
    def _get_default_times(self):
        tz = pytz.timezone("Asia/Bangkok")
        start_time = datetime.strptime(self.credentials['START_TIME'], "%Y-%m-%d").replace(tzinfo=tz).isoformat()
        end_time = datetime.strptime(self.credentials['END_TIME'], "%Y-%m-%d").replace(hour=23, minute=59, tzinfo=tz).isoformat()
        return start_time, end_time
    
    def make_request(self):
        start_time, end_time = self._get_default_times()
        search_result_position = 0
        url = f"{self.base_url}/ISAPI/AccessControl/AcsEvent?format=json"
        formatted_data = []  # Danh sách lưu dữ liệu đã được định dạng

        while True:
            payload = {
                "AcsEventCond": {
                    "searchID": self._generate_search_id(),
                    "searchResultPosition": search_result_position,
                    "maxResults": 30,
                    "startTime": start_time,
                    "endTime": end_time,
                    "major": 0,  # Thêm trường major
                    "minor": 0   # Thêm trường minor
                }
            }

            response = requests.post(url, json=payload, auth=self.auth, headers={"Content-Type": "application/json"})
            if response.status_code != 200:
                print(f"Error: {response.status_code} - {response.text}")
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
                        "pictureURL": item.get("pictureURL", "N/A")
                    })

            search_result_position += len(info_list)
            if result["AcsEvent"].get("responseStatusStrg") != "MORE":
                break

        return formatted_data
    def upload_to_backend(self, data):
        url = "https://staff-portal.wellspring.edu.vn/api/users/attendance"  # API backend
        headers = {"Content-Type": "application/json"}
        successful_uploads = 0

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
                    print(f"Failed to upload record: {record}, Status Code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                print(f"Error uploading record {record}: {e}")

        print(f"Total successful uploads: {successful_uploads}")

if __name__ == "__main__":
    credentials_dir = "./"  # Thư mục chứa các file credentials
    credentials_files = [f for f in os.listdir(credentials_dir) if f.startswith("credentials") and f.endswith(".txt")]

    for credentials_file in credentials_files:
        print(f"Running sync for: {credentials_file}")
        requester = AcsEventRequester(os.path.join(credentials_dir, credentials_file))
        data = requester.make_request()

        if data:
            print(f"Uploading data from: {credentials_file}")
            requester.upload_to_backend(data)
        else:
            print(f"No data found for: {credentials_file}")