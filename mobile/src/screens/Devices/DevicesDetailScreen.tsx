import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    SafeAreaView, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert,
    RefreshControl 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ROUTES } from '../../constants/routes';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Device, DeviceType } from '../../types/devices';
// import deviceService from '../../services/deviceService';

type DeviceDetailScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.SCREENS.DEVICE_DETAIL>;
type DeviceDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, typeof ROUTES.SCREENS.DEVICE_DETAIL>;

interface DeviceLog {
    _id: string;
    type: 'maintenance' | 'software' | 'assignment' | 'general';
    title: string;
    description: string;
    date: string;
    user: {
        fullname: string;
        department: string;
    };
    status?: 'completed' | 'pending' | 'in_progress';
}

const DevicesDetailScreen = () => {
    const navigation = useNavigation<DeviceDetailScreenNavigationProp>();
    const route = useRoute<DeviceDetailScreenRouteProp>();
    const { deviceId, deviceType } = route.params;

    const [device, setDevice] = useState<Device | null>(null);
    const [logs, setLogs] = useState<DeviceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLogTab, setSelectedLogTab] = useState<'all' | 'maintenance' | 'software'>('all');

    useEffect(() => {
        fetchDeviceDetail();
        fetchDeviceLogs();
    }, [deviceId]);

    const fetchDeviceDetail = async () => {
        try {
            setLoading(true);
            // TODO: Implement deviceService.getDeviceById(deviceId)
            // const response = await deviceService.getDeviceById(deviceId);
            // setDevice(response.device);
            
            // Mock data for now
            const mockDevice: Device = {
                _id: deviceId,
                name: 'HP Pavilion 14-ce3026TU',
                manufacturer: 'HP',
                serial: 'HP123456789',
                releaseYear: 2020,
                status: 'Active',
                type: deviceType === 'laptop' ? 'Laptop' : 'Desktop',
                specs: {
                    processor: 'Core i5-1035G1',
                    ram: '8GB',
                    storage: '240GB SSD',
                    display: '14 inch'
                },
                assigned: [{
                    _id: '1',
                    fullname: 'Hà Văn Cường',
                    department: 'Phòng Công Nghệ Thông Tin',
                    jobTitle: 'Nhân viên'
                }],
                assignmentHistory: [],
                room: {
                    _id: '1',
                    name: 'Phòng IT',
                    location: ['Tầng 3', 'Tòa A']
                },
                createdAt: '2024-01-01',
                updatedAt: '2024-12-20'
            } as Device;
            
            setDevice(mockDevice);
        } catch (error) {
            console.error('Error fetching device detail:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin thiết bị');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeviceLogs = async () => {
        try {
            // TODO: Implement deviceService.getDeviceLogs(deviceId)
            // const response = await deviceService.getDeviceLogs(deviceId);
            // setLogs(response.logs);

            // Mock data for now
            const mockLogs: DeviceLog[] = [
                {
                    _id: '1',
                    type: 'maintenance',
                    title: 'Cập nhật Windows',
                    description: 'Máy giật lag, cài lại Win cho mượt',
                    date: '2024-12-20T11:37:16.000Z',
                    user: {
                        fullname: 'Hà Văn Cường',
                        department: 'IT'
                    },
                    status: 'completed'
                },
                {
                    _id: '2',
                    type: 'maintenance',
                    title: 'Cập nhật Windows',
                    description: 'Máy giật lag, cài lại Win cho mượt',
                    date: '2024-12-20T11:37:16.000Z',
                    user: {
                        fullname: 'Hà Văn Cường',
                        department: 'IT'
                    },
                    status: 'completed'
                },
                {
                    _id: '3',
                    type: 'software',
                    title: 'Cài đặt phần mềm',
                    description: 'Cài đặt Office 365 và các phần mềm cần thiết',
                    date: '2024-12-15T09:30:00.000Z',
                    user: {
                        fullname: 'Hà Văn Cường',
                        department: 'IT'
                    },
                    status: 'completed'
                }
            ];
            
            setLogs(mockLogs);
        } catch (error) {
            console.error('Error fetching device logs:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchDeviceDetail(), fetchDeviceLogs()]);
        setRefreshing(false);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return '#3DB838';
            case 'Standby': return '#F59E0B';
            case 'Broken': return '#EF4444';
            case 'PendingDocumentation': return '#EAA300';
            default: return '#6B7280';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Active': return 'Đang sử dụng';
            case 'Standby': return 'Sẵn sàng';
            case 'Broken': return 'Hỏng';
            case 'PendingDocumentation': return 'Chờ xử lý';
            default: return 'Không xác định';
        }
    };

    const getDeviceIcon = (deviceType: DeviceType) => {
        switch (deviceType) {
            case 'laptop': return 'laptop';
            case 'monitor': return 'monitor';
            case 'printer': return 'printer';
            case 'projector': return 'projector';
            case 'tool': return 'tools';
            default: return 'laptop';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        const dateStr = formatDate(dateString);
        return `${time} ${dateStr}`;
    };

    const getFilteredLogs = () => {
        if (selectedLogTab === 'all') return logs;
        return logs.filter(log => log.type === selectedLogTab);
    };

    const renderSpecCard = (icon: string, label: string, value: string, color: string = '#F05023') => (
        <View className="bg-white rounded-xl p-4 items-center flex-1 mx-1">
            <View 
                className="w-8 h-8 rounded-lg items-center justify-center mb-2"
                style={{ backgroundColor: color }}
            >
                <MaterialCommunityIcons name={icon as any} size={16} color="white" />
            </View>
            <Text className="text-xs text-gray-500 text-center mb-1">{label}</Text>
            <Text className="text-sm font-semibold text-gray-800 text-center">{value}</Text>
        </View>
    );

    const renderLogItem = (log: DeviceLog) => (
        <View key={log._id} className="bg-[#f8f8f8] rounded-xl p-4 mb-3">
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-base font-semibold text-gray-800 flex-1 mr-2">
                    {log.title}
                </Text>
                <View className="bg-[#FF6B35] px-3 py-1 rounded-full">
                    <Text className="text-xs text-white font-medium">
                        {log.status === 'completed' ? 'Sửa chữa' : 'Đang xử lý'}
                    </Text>
                </View>
            </View>
            
            <Text className="text-sm text-gray-600 mb-3">
                {log.description}
            </Text>
            
            <View className="flex-row justify-between items-center">
                <Text className="text-xs text-gray-500">
                    {formatDateTime(log.date)}
                </Text>
                <Text className="text-xs text-gray-600 font-medium">
                    {log.user.fullname}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#002855" />
                    <Text className="text-base text-[#002855] mt-3">Đang tải thông tin thiết bị...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!device) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center">
                    <MaterialCommunityIcons name="alert-circle" size={60} color="#EF4444" />
                    <Text className="text-base text-gray-600 mt-3 text-center">
                        Không tìm thấy thông tin thiết bị
                    </Text>
                    <TouchableOpacity
                        onPress={handleGoBack}
                        className="bg-primary px-6 py-3 rounded-lg mt-4"
                    >
                        <Text className="text-white font-semibold">Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={handleGoBack} className="p-1">
                    <Ionicons name="arrow-back" size={24} color="#002855" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-primary" numberOfLines={1}>
                    {device.name}
                </Text>
                <TouchableOpacity className="p-1">
                    <Ionicons name="ellipsis-horizontal" size={24} color="#002855" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#002855']}
                        tintColor="#002855"
                    />
                }
            >
                {/* Status */}
                <View className="px-5 py-4">
                    <View className="flex-row items-center">
                        <View 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getStatusColor(device.status) }}
                        />
                        <Text className="text-base font-medium" style={{ color: getStatusColor(device.status) }}>
                            {getStatusLabel(device.status)}
                        </Text>
                    </View>
                </View>

                {/* Device Icon */}
                <View className="px-5 mb-4">
                    <View className="flex-row items-center">
                        <View className="bg-[#F05023] p-3 rounded-full mr-4">
                            <MaterialCommunityIcons 
                                name={getDeviceIcon(deviceType)} 
                                size={24} 
                                color="white" 
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-gray-800">
                                {device.name}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                {device.manufacturer} {device.releaseYear && `• ${device.releaseYear}`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Specs */}
                <View className="px-5 mb-6">
                    <View className="flex-row -mx-1">
                        {device.specs.processor && renderSpecCard('cpu-64-bit', 'RAM', device.specs.processor)}
                        {device.specs.ram && renderSpecCard('memory', 'Bộ nhớ', device.specs.ram)}
                        {device.specs.storage && renderSpecCard('harddisk', 'Màn hình', device.specs.storage)}
                        {device.specs.display && renderSpecCard('monitor', 'Network', device.specs.display)}
                    </View>
                </View>

                {/* Assignment Info */}
                <View className="px-5 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-semibold text-gray-800">Thông tin bàn giao</Text>
                        <TouchableOpacity>
                            <Text className="text-[#F05023] font-medium">Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View className="bg-[#002855] rounded-xl p-4">
                        <View className="flex-row items-center mb-3">
                            <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 items-center justify-center">
                                <Text className="text-lg font-bold text-gray-600">
                                    {device.assigned[0]?.fullname.charAt(0) || '?'}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold text-base">
                                    {device.assigned[0]?.fullname || 'Chưa phân công'}
                                </Text>
                                <Text className="text-gray-300 text-sm">
                                    {device.assigned[0]?.department || 'Không xác định'}
                                </Text>
                            </View>
                            <TouchableOpacity className="p-2">
                                <MaterialCommunityIcons name="file-document-outline" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                        
                        <View className="border-t border-gray-600 pt-3">
                            <Text className="text-gray-300 text-sm">
                                Người bàn giao: {device.assigned[0]?.fullname || 'Hà Văn Cường'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Device Logs */}
                <View className="px-5 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-semibold text-gray-800">Nhật ký</Text>
                        <TouchableOpacity>
                            <Text className="text-[#F05023] font-medium">Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Log Tabs */}
                    <View className="flex-row mb-4 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'Tất cả' },
                            { key: 'maintenance', label: 'Sửa chữa' },
                            { key: 'software', label: 'Phần mềm' }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => setSelectedLogTab(tab.key as any)}
                                className={`flex-1 py-2 px-4 rounded-lg ${
                                    selectedLogTab === tab.key 
                                        ? 'bg-[#002855]' 
                                        : 'bg-transparent'
                                }`}
                            >
                                <Text className={`text-sm font-medium text-center ${
                                    selectedLogTab === tab.key 
                                        ? 'text-white' 
                                        : 'text-gray-600'
                                }`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Log List */}
                    {getFilteredLogs().length > 0 ? (
                        getFilteredLogs().map(renderLogItem)
                    ) : (
                        <View className="items-center py-8">
                            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#ccc" />
                            <Text className="text-gray-500 mt-2">Chưa có nhật ký nào</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-[#F05023] items-center justify-center shadow-lg">
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default DevicesDetailScreen; 