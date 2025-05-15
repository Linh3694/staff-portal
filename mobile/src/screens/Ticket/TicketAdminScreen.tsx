import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type TicketScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Ticket'>;

interface Ticket {
    id: string;
    _id?: string;
    ticketCode?: string;
    title: string;
    description: string;
    status: string;
    date: string;
    priority: string;
    requester: string;
    creator?: {
        _id: string;
        fullname: string;
    };
    assignedTo?: {
        _id?: string;
        fullname: string;
    };
}

const TicketAdminScreen = () => {
    const navigation = useNavigation<TicketScreenNavigationProp>();
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRole, setFilterRole] = useState(''); // 'assigned', 'created', hoặc ''
    const [showFilters, setShowFilters] = useState(false);
    const [showRoleFilters, setShowRoleFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const loadUserId = async () => {
            const id = await AsyncStorage.getItem('userId');
            setUserId(id);
        };
        loadUserId();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [filterStatus, filterRole]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const userId = await AsyncStorage.getItem('userId');

            if (!token) {
                console.log('Sử dụng mock data vì token không tồn tại');
                await getMockTickets();
                return;
            }

            try {
                // Xây dựng URL với các tham số lọc
                const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
                let url = `${apiUrl}/api/tickets`;

                // Thêm các tham số lọc
                const params = new URLSearchParams();
                if (filterStatus) {
                    params.append('status', filterStatus);
                }
                if (searchTerm) {
                    params.append('search', searchTerm);
                }

                // Thêm tham số lọc theo vai trò
                if (userId && filterRole === 'created') {
                    params.append('creator', userId);
                } else if (userId && filterRole === 'assigned') {
                    params.append('assignedTo', userId);
                }

                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                console.log('Gọi API với URL:', url);
                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.success) {
                    console.log('API thành công, nhận được', res.data.tickets?.length || 0, 'tickets');

                    // Chuyển đổi dữ liệu API để phù hợp với cấu trúc hiện tại
                    const formattedTickets = res.data.tickets.map((ticket: any) => ({
                        id: ticket._id,
                        _id: ticket._id,
                        ticketCode: ticket.ticketCode || `Ticket-${ticket._id.substring(0, 3)}`,
                        title: ticket.title,
                        description: ticket.description || '',
                        status: ticket.status.toLowerCase(),
                        date: new Date(ticket.createdAt).toLocaleDateString('vi-VN'),
                        priority: ticket.priority.toLowerCase(),
                        requester: ticket.creator?.fullname || 'Không xác định',
                        creator: ticket.creator,
                        assignedTo: ticket.assignedTo
                    }));

                    setTickets(formattedTickets);
                } else {
                    console.error('Lỗi khi lấy danh sách ticket:', res.data.message);
                    await getMockTickets();
                }
            } catch (apiError) {
                console.error('Lỗi khi gọi API:', apiError);
                await getMockTickets();
            }
        } catch (error) {
            console.error('Lỗi tổng thể:', error);
            await getMockTickets();
        } finally {
            setLoading(false);
        }
    };

    const getMockTickets = async () => {
        const userId = await AsyncStorage.getItem('userId') || 'mock_user_id';
        const mockTickets = [
            {
                id: '1',
                _id: '1',
                ticketCode: 'Ticket-001',
                title: 'Máy tính số 25 ở phòng ICT bị hỏng',
                description: 'Máy tính của tôi không thể khởi động sau khi cập nhật Windows',
                status: 'open',
                date: '10/05/2023',
                priority: 'high',
                requester: 'Nguyễn Văn A',
                creator: {
                    _id: 'user1',
                    fullname: 'Nguyễn Văn A'
                },
                assignedTo: {
                    _id: userId,
                    fullname: 'Hoàng Thị Thu Hiền'
                }
            },
            {
                id: '2',
                _id: '2',
                ticketCode: 'Ticket-002',
                title: 'Không thể kết nối máy in',
                description: 'Không thể kết nối với máy in trong mạng văn phòng',
                status: 'inProgress',
                date: '05/05/2023',
                priority: 'medium',
                requester: 'Trần Thị B',
                creator: {
                    _id: userId,
                    fullname: 'Trần Thị B'
                },
                assignedTo: {
                    _id: 'user2',
                    fullname: 'Hà Văn Cường'
                }
            },
            {
                id: '3',
                _id: '3',
                ticketCode: 'Ticket-003',
                title: 'Yêu cầu cài đặt phần mềm',
                description: 'Cần cài đặt phần mềm Adobe Photoshop cho dự án mới',
                status: 'resolved',
                date: '01/05/2023',
                priority: 'low',
                requester: 'Lê Văn C',
                creator: {
                    _id: 'user3',
                    fullname: 'Lê Văn C'
                },
                assignedTo: {
                    _id: userId,
                    fullname: 'Đỗ Minh Tuấn'
                }
            }
        ];

        // Lọc theo trạng thái
        let filteredTickets = mockTickets;
        if (filterStatus) {
            filteredTickets = filteredTickets.filter(ticket => ticket.status === filterStatus);
        }

        // Lọc theo vai trò (creator hoặc assignedTo)
        if (filterRole === 'created') {
            filteredTickets = filteredTickets.filter(ticket => ticket.creator?._id === userId);
        } else if (filterRole === 'assigned') {
            filteredTickets = filteredTickets.filter(ticket => ticket.assignedTo?._id === userId);
        }

        // Lọc theo từ khóa tìm kiếm
        if (searchTerm) {
            filteredTickets = filteredTickets.filter(ticket =>
                ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setTickets(filteredTickets);
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-500';
            case 'inProgress':
                return 'bg-yellow-500';
            case 'resolved':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'open':
                return 'Chưa nhận';
            case 'inProgress':
                return 'Đang xử lý';
            case 'resolved':
                return 'Đã xử lý';
            default:
                return status;
        }
    };

    const priorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const priorityLabel = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'Cao';
            case 'medium':
                return 'Trung bình';
            case 'low':
                return 'Thấp';
            default:
                return priority;
        }
    };

    const handleSearch = () => {
        fetchTickets();
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
        setShowRoleFilters(false);
    };

    const toggleRoleFilters = () => {
        setShowRoleFilters(!showRoleFilters);
        setShowFilters(false);
    };

    const applyFilter = (status: string) => {
        setFilterStatus(status);
        setShowFilters(false);
    };

    const applyRoleFilter = (role: string) => {
        setFilterRole(role);
        setShowRoleFilters(false);
    };

    const handleViewTicketDetail = (ticketId: string) => {
        navigation.navigate('TicketDetail', { ticketId });
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleCreateTicket = () => {
        navigation.navigate('TicketCreate');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="w-full flex-1 pb-16">
                {/* Header với tiêu đề và nút back */}
                <View className="w-full flex-row items-center px-4 py-4">
                    <TouchableOpacity onPress={handleGoBack} >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-xl font-bold">Ticket</Text>
                    </View>
                </View>

                {/* Ô tìm kiếm cải tiến với nút lọc */}
                <View className="px-4 py-2">
                    <View className="flex-row items-center">
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 py-2 flex-1">
                            <Ionicons name="search" size={20} color="#666" />
                            <TextInput
                                placeholder="Tìm kiếm ticket..."
                                className="flex-1 ml-2 text-base"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />
                            {searchTerm ? (
                                <TouchableOpacity onPress={() => {
                                    setSearchTerm('');
                                    handleSearch();
                                }}>
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <TouchableOpacity
                            className="ml-2 bg-gray-100 rounded-full w-10 h-10 items-center justify-center"
                            onPress={toggleFilters}
                        >
                            <MaterialIcons name="filter-list" size={24} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="ml-2 bg-gray-100 rounded-full w-10 h-10 items-center justify-center"
                            onPress={toggleRoleFilters}
                        >
                            <Ionicons name="person" size={20} color={filterRole ? "#FF5733" : "#666"} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bộ lọc trạng thái */}
                {showFilters && (
                    <View className="px-4 mb-2">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterStatus === '' ? 'bg-blue-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('')}
                            >
                                <Text className={filterStatus === '' ? 'text-white' : 'text-gray-700'}>Tất cả</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterStatus === 'open' ? 'bg-blue-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('open')}
                            >
                                <Text className={filterStatus === 'open' ? 'text-white' : 'text-gray-700'}>Chưa nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterStatus === 'inProgress' ? 'bg-yellow-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('inProgress')}
                            >
                                <Text className={filterStatus === 'inProgress' ? 'text-white' : 'text-gray-700'}>Đang xử lý</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`px-3 py-1 rounded-full ${filterStatus === 'resolved' ? 'bg-green-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('resolved')}
                            >
                                <Text className={filterStatus === 'resolved' ? 'text-white' : 'text-gray-700'}>Đã xử lý</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {/* Bộ lọc vai trò */}
                {showRoleFilters && (
                    <View className="px-4 mb-2">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterRole === '' ? 'bg-[#FF5733]' : 'bg-gray-200'}`}
                                onPress={() => applyRoleFilter('')}
                            >
                                <Text className={filterRole === '' ? 'text-white' : 'text-gray-700'}>Tất cả Ticket</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterRole === 'assigned' ? 'bg-[#FF5733]' : 'bg-gray-200'}`}
                                onPress={() => applyRoleFilter('assigned')}
                            >
                                <Text className={filterRole === 'assigned' ? 'text-white' : 'text-gray-700'}>Ticket được giao</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`px-3 py-1 rounded-full ${filterRole === 'created' ? 'bg-[#FF5733]' : 'bg-gray-200'}`}
                                onPress={() => applyRoleFilter('created')}
                            >
                                <Text className={filterRole === 'created' ? 'text-white' : 'text-gray-700'}>Ticket của tôi</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {/* Danh sách ticket */}
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#F05023" />
                    </View>
                ) : tickets.length > 0 ? (
                    <FlatList
                        data={tickets}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="bg-gray-50 rounded-xl p-4 shadow-sm mb-3"
                                onPress={() => handleViewTicketDetail(item.id)}
                            >
                                <View>
                                    <Text className="text-[#E84A37] font-semibold text-base">{item.title}</Text>
                                    <Text className="text-gray-500 text-xs mt-1">{item.ticketCode || `Ticket-${item.id.padStart(3, '0')}`}</Text>

                                    {/* Hiển thị tag creator/assignedTo nếu đang lọc theo tất cả */}
                                    {filterRole === '' && userId && (
                                        <View className="mt-2">
                                            {item.creator?._id === userId && (
                                                <View className="bg-gray-200 rounded-md px-2 py-0.5 inline-block mr-2">
                                                    <Text className="text-gray-700 text-xs">Tạo bởi tôi</Text>
                                                </View>
                                            )}
                                            {item.assignedTo?._id === userId && (
                                                <View className="bg-[#FFE5D9] rounded-md px-2 py-0.5 inline-block">
                                                    <Text className="text-[#FF5733] text-xs">Được giao cho tôi</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    <View className="flex-row justify-between items-center mt-3">
                                        <Text className="text-gray-600 text-sm font-medium">
                                            {item.requester}
                                        </Text>
                                        {item.status === 'open' ? (
                                            <Text className="text-gray-600 font-medium">Chưa nhận</Text>
                                        ) : (
                                            <View className={`${statusColor(item.status)} rounded-lg px-3 py-1`}>
                                                <Text className="text-white text-xs font-semibold">{statusLabel(item.status)}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center p-4">
                        <Text className="text-gray-500 text-center">Không tìm thấy ticket nào.</Text>
                    </View>
                )}

                {/* Nút thêm mới ở dưới cùng */}
                <TouchableOpacity
                    className="absolute bottom-5 right-5 bg-orange-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
                    onPress={handleCreateTicket}
                >
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default TicketAdminScreen;
