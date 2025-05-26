import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants';

interface AttendanceRecord {
    _id: string;
    employeeCode: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    totalCheckIns: number;
    status: string;
    user?: {
        fullname: string;
        email: string;
        employeeCode: string;
    };
}

interface AttendanceResponse {
    status: string;
    data: {
        records: AttendanceRecord[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalRecords: number;
            hasMore: boolean;
        };
    };
}

class AttendanceService {
    private async getAuthHeaders() {
        const token = await AsyncStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    // Lấy dữ liệu chấm công của nhân viên hiện tại cho ngày hôm nay
    async getTodayAttendance(employeeCode: string): Promise<AttendanceRecord | null> {
        try {
            const headers = await this.getAuthHeaders();
            // Compute ISO range for the full local day to match stored UTC dates
            const now = new Date();
            const startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                0, 0, 0, 0
            ).toISOString();
            const endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                23, 59, 59, 999
            ).toISOString();

            console.log('Getting attendance for employee:', employeeCode);
            console.log(
                'API URL:',
                `${API_BASE_URL}/api/attendance/employee/${employeeCode}` +
                `?startDate=${startDate}&endDate=${endDate}`
            );

            const response = await fetch(
                `${API_BASE_URL}/api/attendance/employee/${employeeCode}` +
                `?startDate=${encodeURIComponent(startDate)}` +
                `&endDate=${encodeURIComponent(endDate)}`,
                { headers }
            );

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`Failed to fetch today attendance: ${response.status}`);
            }

            const data = await response.json();
            console.log('Attendance API response:', JSON.stringify(data, null, 2));

            // Trả về record đầu tiên (ngày hôm nay) hoặc null nếu không có
            const record = data.data?.records?.[0] || null;
            console.log('Today attendance record:', record);
            return record;
        } catch (error) {
            console.error('Error fetching today attendance:', error);
            return null;
        }
    }

    // Lấy dữ liệu chấm công theo khoảng thời gian
    async getAttendanceRecords(
        startDate?: string,
        endDate?: string,
        employeeCode?: string,
        page: number = 1,
        limit: number = 100
    ): Promise<AttendanceResponse | null> {
        try {
            const headers = await this.getAuthHeaders();

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy: 'date',
                sortOrder: 'desc'
            });

            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (employeeCode) params.append('employeeCode', employeeCode);

            const response = await fetch(
                `${API_BASE_URL}/api/attendance/records?${params.toString()}`,
                { headers }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch attendance records');
            }

            const data: AttendanceResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching attendance records:', error);
            return null;
        }
    }

    // Format thời gian hiển thị (từ ISO string thành HH:MM)
    formatTime(timeString?: string): string {
        if (!timeString) return '--:--';

        try {
            const date = new Date(timeString);
            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            return '--:--';
        }
    }
}

export default new AttendanceService(); 