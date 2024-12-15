from datetime import datetime, timedelta
import pytz
import random
import string
import requests
from requests.auth import HTTPDigestAuth

class AcsEventRequester:
    def __init__(self):
        # Thông tin cấu hình được khai báo trực tiếp
        self.credentials = {
            'DEVICE_IP': '10.1.4.95',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_001',
            'START_TIME': '2024-12-10',
            'END_TIME': '2024-12-10'
        }
        self.base_url = f"http://{self.credentials['DEVICE_IP']}"
        self.auth = HTTPDigestAuth(self.credentials['USERNAME'], self.credentials['PASSWORD'])
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        self.tracker_id = self.credentials['TRACKER_ID']

    def _generate_search_id(self):
        """Tạo search ID ngẫu nhiên."""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=10))

    def _get_default_times(self):
        """Xác định thời gian bắt đầu và kết thúc."""
        tz = pytz.timezone("Asia/Bangkok")
        now = datetime.now(tz)

        start_time = datetime.strptime(self.credentials['START_TIME'], "%Y-%m-%d")
        start_time = tz.localize(start_time.replace(hour=0, minute=0, second=0, microsecond=0)).isoformat()

        end_time = datetime.strptime(self.credentials['END_TIME'], "%Y-%m-%d")
        end_time = tz.localize(end_time.replace(hour=23, minute=59, second=59, microsecond=0)).isoformat()

        return start_time, end_time

    def fetch_data_from_hikvision(self):
        search_id = self._generate_search_id()
        start_time, end_time = self._get_default_times()
        url = f"{self.base_url}/ISAPI/AccessControl/AcsEvent?format=json"
        data = {
            "AcsEventCond": {
                "searchID": search_id,
                "searchResultPosition": 0,
                "maxResults": 1000,
                "major": 5,  # Major type for access control
                "minor": 75, # Minor type for specific events
                "startTime": start_time,
                "endTime": end_time
            }
        }

        print(f"Sending request to {url} with data: {data}")
        response = requests.post(url, json=data, headers=self.headers, auth=self.auth)
        print(f"Response status code: {response.status_code}")
        print(f"Response content: {response.content.decode('utf-8')}")

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error fetching data: {response.status_code}, {response.content.decode('utf-8')}")

    def upload_attendance_to_backend(self, attendance_data):
        url = 'http://localhost:5001/api/attendances/save'
        headers = {
            'Content-Type': 'application/json'
        }
        print(f"Raw attendance data: {attendance_data}")

        # Định dạng lại dữ liệu để chỉ giữ các trường cần thiết
        formatted_data = []
        for event in attendance_data.get("InfoList", []):
            print("Processing event:", event)  # Log từng event để kiểm tra
            # Chỉ cần thêm vào formatted_data mà không kiểm tra các trường 'name' và 'time'
            formatted_data.append(event)
            print(f"Raw response from Hikvision: {attendance_data}")
        print(f"Filtered data to send: {formatted_data}")  # Log dữ liệu sau khi lọc
        print(f"Payload sent to backend: {formatted_data}")  # Debug payload

        try:
            for record in formatted_data:
                response = requests.post(url, headers=headers, json=record)
                print(f"Response status code: {response.status_code}")
                print(f"Response content: {response.text}")
                if response.status_code == 200:
                    print("Attendance uploaded successfully.")
                else:
                    print(f"Failed to upload attendance: {response.json()}")
        except Exception as e:
            print("Error uploading attendance data:", e)

    def run(self):
        """Chạy toàn bộ quy trình."""
        try:
            print("Fetching data from Hikvision...")
            data = self.fetch_data_from_hikvision()
            print(f"Fetched {len(data.get('AcsEvent', {}).get('InfoList', []))} records.")

            print("Uploading data to backend...")
            self.upload_attendance_to_backend(data)
            print("Sync completed successfully.")
        except Exception as e:
            print(f"Error during sync: {e}")

if __name__ == "__main__":
    acs_event_requester = AcsEventRequester()
    acs_event_requester.run()