from datetime import datetime, timedelta
import pytz
import random
import string
import requests
from requests.auth import HTTPDigestAuth

class AcsEventRequester:
    credentials_list = [
             {
        'DEVICE_IP': '10.1.4.95',
        'USERNAME': 'admin',
        'PASSWORD': 'Wellspring#2024',
        'TRACKER_ID': 'tracker_001',
        'START_TIME': '2024-12-01',
        'END_TIME': '2024-12-16'
            },
            {
        'DEVICE_IP': '10.1.4.96',
        'USERNAME': 'admin',
        'PASSWORD': 'Wellspring#2024',
        'TRACKER_ID': 'tracker_002',
        'START_TIME': '2024-12-01',
        'END_TIME': '2024-12-16'
            },
            {
        'DEVICE_IP': '10.1.4.12',
        'USERNAME': 'admin',
        'PASSWORD': 'Wellspring#2024',
        'TRACKER_ID': 'tracker_003',
        'START_TIME': '2024-12-01',
        'END_TIME': '2024-12-16'
            },
            {
        'DEVICE_IP': '10.1.4.13',
        'USERNAME': 'admin',
        'PASSWORD': 'Wellspring#2024',
        'TRACKER_ID': 'tracker_004',
        'START_TIME': '2024-12-01',
        'END_TIME': '2024-12-16'
            },
            {
        'DEVICE_IP': '10.1.4.15',
        'USERNAME': 'admin',
        'PASSWORD': 'Wellspring#2024',
        'TRACKER_ID': 'tracker_005',
        'START_TIME': '2024-12-01',
        'END_TIME': '2024-12-16'
            },
            {
        'DEVICE_IP': '10.1.4.16',
        'USERNAME': 'admin',
        'PASSWORD': 'Wellspring#2024',
        'TRACKER_ID': 'tracker_006',
        'START_TIME': '2024-12-01',
        'END_TIME': '2024-12-16'
            },
            {
        'DEVICE_IP': '10.1.4.17',
        'USERNAME': 'admin',
        'PASSWORD': 'Wellspring#2024',
        'TRACKER_ID': 'tracker_007',
        'START_TIME': '2024-12-01',
        'END_TIME': '2024-12-16'
            },
        ]
    def __init__(self, device_index=4):
        self.credentials = self.credentials_list[device_index]
        self.base_url = f"http://{self.credentials['DEVICE_IP']}"
        self.auth = HTTPDigestAuth(self.credentials['USERNAME'], self.credentials['PASSWORD'])
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        self.tracker_id = self.credentials['TRACKER_ID']

    def _generate_search_id(self):
        return ''.join(random.choices(string.ascii_letters + string.digits, k=10))

    def _get_default_times(self):
        tz = pytz.timezone("Asia/Bangkok")
        now = datetime.now(tz)

        start_time = datetime.strptime(self.credentials['START_TIME'], "%Y-%m-%d")
        start_time = tz.localize(start_time.replace(hour=0, minute=0, second=0, microsecond=0)).isoformat()

        end_time = datetime.strptime(self.credentials['END_TIME'], "%Y-%m-%d")
        end_time = tz.localize(end_time.replace(hour=23, minute=59, second=59, microsecond=0)).isoformat()

        print(f"Start time: {start_time}, End time: {end_time}")
        return start_time, end_time

    def fetch_data_from_hikvision(self):
        search_id = self._generate_search_id()
        start_time, end_time = self._get_default_times()
        url = f"{self.base_url}/ISAPI/AccessControl/AcsEvent?format=json"
        search_result_position = 0
        all_results = []

        while True:
            data = {
                "AcsEventCond": {
                    "searchID": search_id,
                    "searchResultPosition": search_result_position,  # Tăng search position
                    "maxResults": 1000,
                    "major": 5,
                    "minor": 75,
                    "startTime": start_time,
                    "endTime": end_time
                }
            }
            print(f"Sending request to {url} with data: {data}")
            response = requests.post(url, json=data, headers=self.headers, auth=self.auth)

            if response.status_code != 200:
                raise Exception(f"Error fetching data: {response.status_code}, {response.content}")

            result = response.json()
            events = result.get("AcsEvent", {}).get("InfoList", [])

            if not events:
                break  # Dừng nếu không còn dữ liệu mới

            all_results.extend(events)
            search_result_position += len(events)  # Cập nhật vị trí tìm kiếm

        print(f"Fetched {len(all_results)} records.")
        return {"AcsEvent": {"InfoList": all_results}}

    def upload_attendance_to_backend(self, attendance_data):
        url = 'http://localhost:5001/api/users/attendance'
        headers = {
            'Content-Type': 'application/json'
        }

        formatted_data = []
        for event in attendance_data.get("AcsEvent", {}).get("InfoList", []):
            raw_time = event.get("time")
            try:
                parsed_time = datetime.fromisoformat(raw_time).astimezone(pytz.UTC)
                event["time"] = parsed_time.strftime('%Y-%m-%dT%H:%M:%SZ')
            except ValueError as e:
                print(f"Invalid raw_time format: {raw_time} -> Error: {e}")
                continue

            formatted_data.append({
                "employeeCode": event["employeeNoString"],
                "dateTime": event["time"]
            })

        print(f"Filtered data to send: {formatted_data}")

        try:
            for record in formatted_data:
                response = requests.post(url, headers=headers, json=record)
                if response.status_code == 200:
                    print("Attendance uploaded successfully.")
                else:
                    print(f"Failed to upload attendance: {response.json()}")
        except Exception as e:
            print("Error uploading attendance data:", e)

    def run(self):
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
    for i in range(len(AcsEventRequester.credentials_list)):
        acs_event_requester = AcsEventRequester(device_index=i)
        acs_event_requester.run()