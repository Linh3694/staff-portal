from datetime import datetime, timedelta
import pytz
import random
import string
import requests
from requests.auth import HTTPDigestAuth
import logging
import time

# Set up logging to print to console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class AcsEventRequester:
    def __init__(self, device_index=2):
        self.credentials = self.credentials_list[device_index]
        self.base_url = f"http://{self.credentials['DEVICE_IP']}"
        self.auth = HTTPDigestAuth(self.credentials['USERNAME'], self.credentials['PASSWORD'])
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        self.tracker_id = self.credentials['TRACKER_ID']
        logging.info(f"Initialized AcsEventRequester for tracker {self.tracker_id}")

    credentials_list = [
        {
            'DEVICE_IP': '10.1.4.95',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_001',
            'START_TIME': '2024-12-09',
            'END_TIME': '2024-12-10'
        },
        {
            'DEVICE_IP': '10.1.4.96',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_002',
            'START_TIME': '2024-12-09',
            'END_TIME': '2024-12-10'
        },
        {
            'DEVICE_IP': '10.1.4.12',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_003',
            'START_TIME': '2024-12-09',
            'END_TIME': '2024-12-10'
        },
        {
            'DEVICE_IP': '10.1.4.13',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_004',
            'START_TIME': '2024-12-09',
            'END_TIME': '2024-12-10'
        },
        {
            'DEVICE_IP': '10.1.4.15',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_005',
            'START_TIME': '2024-12-09',
            'END_TIME': '2024-12-10'
        },
        {
            'DEVICE_IP': '10.1.4.16',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_005',
            'START_TIME': '2024-12-09',
            'END_TIME': '2024-12-10'
        },
        {
            'DEVICE_IP': '10.1.4.17',
            'USERNAME': 'admin',
            'PASSWORD': 'Wellspring#2024',
            'TRACKER_ID': 'tracker_006',
            'START_TIME': '2024-12-09',
            'END_TIME': '2024-12-10'
        },
    ]

    def _generate_search_id(self):
        return ''.join(random.choices(string.ascii_letters + string.digits, k=10))

    def _get_default_times(self):
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
        all_records = []
        search_result_position = 0

        while True:
            data = {
                "AcsEventCond": {
                    "searchID": search_id,
                    "searchResultPosition": search_result_position,
                    "maxResults": 30,  # Reduce maxResults to avoid rate limiting
                    "major": 5,  # Major type for access control
                    "minor": 75, # Minor type for specific events
                    "startTime": start_time,
                    "endTime": end_time
                }
            }

            logging.info(f"Sending request to {url} with data: {data}")
            response = requests.post(url, json=data, headers=self.headers, auth=self.auth)
            logging.info(f"Response status code: {response.status_code}")
            logging.info(f"Response content: {response.content.decode('utf-8')}")

            if response.status_code == 200:
                try:
                    json_data = response.json()
                    info_list = json_data.get("AcsEvent", {}).get("InfoList", [])
                    
                    if not info_list:
                        logging.info("No more data to fetch.")
                        break  # Stop when no more data

                    all_records.extend(info_list)
                    logging.info(f"Fetched {len(info_list)} records, Total: {len(all_records)}")

                    # Check if there is more data to fetch
                    if json_data["AcsEvent"].get("responseStatusStrg") != "MORE":
                        break

                    # Increase search result position for the next request
                    search_result_position += len(info_list)

                    # Add a delay between requests to avoid rate limiting
                    time.sleep(1)
                except ValueError as e:
                    logging.error(f"Error parsing JSON: {response.content} -> {e}")
                    break
            else:
                logging.error(f"Error fetching data: {response.status_code}, {response.content.decode('utf-8')}")
                break

        return all_records

    def upload_attendance_to_backend(self, attendance_data):
        url = 'http://localhost:5001/api/users/attendance'
        headers = {
            'Content-Type': 'application/json'
        }

        formatted_data = [
            {
                "employeeCode": event["employeeNoString"],
                "dateTime": event["time"]
            }
            for event in attendance_data
            if event.get("employeeNoString") and event.get("time")
        ]

        logging.info(f"Filtered data to send: {formatted_data}")

        successful_uploads = 0

        try:
            for record in formatted_data:
                response = requests.post(url, headers=headers, json=record)
                logging.info(f"Response status code: {response.status_code}")
                logging.info(f"Response content: {response.text}")
                if response.status_code == 200:
                    logging.info("Attendance uploaded successfully.")
                    successful_uploads += 1
                else:
                    logging.error(f"Failed to upload attendance: {response.json()}")
        except Exception as e:
            logging.error("Error uploading attendance data:", e)

        return successful_uploads

    def run(self):
        try:
            logging.info("Fetching data from Hikvision...")
            data = self.fetch_data_from_hikvision()
            logging.info(f"Total records fetched: {len(data)}")

            logging.info("Uploading data to backend...")
            successful_uploads = self.upload_attendance_to_backend(data)
            logging.info(f"Sync completed successfully for tracker {self.tracker_id}. Total users synchronized: {successful_uploads}")
        except Exception as e:
            logging.error(f"Error during execution: {e}")

if __name__ == "__main__":
    for i in range(len(AcsEventRequester.credentials_list)):
        acs_event_requester = AcsEventRequester(device_index=i)
        acs_event_requester.run()