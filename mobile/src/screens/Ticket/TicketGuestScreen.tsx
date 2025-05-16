import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

type TicketScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Ticket'>;

interface Ticket {
    _id: string;
    ticketCode: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    assignedTo?: {
        fullname: string;
    };
    creator?: {
        _id: string;
        fullname: string;
    };
}

const TicketGuestScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchUserTickets();
    }, [filterStatus]);

    const fetchUserTickets = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const userId = await AsyncStorage.getItem('userId');

            console.log('Thông tin người dùng:', { token, userId });

            // Kiểm tra token để quyết định sử dụng API hay mock data
            if (!token || !userId) {
                console.log('Sử dụng mock data vì token hoặc userId không tồn tại');
                await getMockTickets();
                return;
            }

            try {
                // Xây dựng URL với các tham số lọc
                let url = `${API_BASE_URL}/api/tickets`;

                // Thêm userId vào URL để lọc chỉ lấy ticket do user tạo ngay từ API
                url += `?creator=${userId}`;

                // Thêm các tham số lọc khác
                if (filterStatus) {
                    url += `&status=${filterStatus}`;
                }
                if (searchTerm) {
                    url += `&search=${searchTerm}`;
                }

                console.log('Gọi API với URL:', url);
                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.success) {
                    console.log('API thành công, nhận được', res.data.tickets?.length || 0, 'tickets');

                    // Đảm bảo chỉ lấy những ticket mà user là người tạo (lọc thêm ở phía client)
                    const userTickets = res.data.tickets.filter((ticket: any) => {
                        // Kiểm tra cả trường hợp creator là object hoặc string
                        if (ticket.creator?._id) {
                            return ticket.creator._id === userId;
                        } else if (typeof ticket.creator === 'string') {
                            return ticket.creator === userId;
                        }
                        return false; // Nếu không có thông tin creator, không hiển thị
                    });

                    console.log('Sau khi lọc còn', userTickets.length, 'tickets do user tạo');

                    // Lọc theo từ khóa tìm kiếm nếu có
                    let filteredTickets = userTickets;
                    if (searchTerm) {
                        filteredTickets = userTickets.filter((ticket: Ticket) =>
                            ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    }

                    setTickets(filteredTickets || []);
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

    // Tạo dữ liệu mẫu cải tiến
    const getMockTickets = async () => {
        try {
            // Lấy thông tin người dùng từ AsyncStorage để tạo dữ liệu mẫu chính xác hơn
            const userId = await AsyncStorage.getItem('userId') || 'user_mock';
            const userFullname = await AsyncStorage.getItem('userFullname') || 'Người dùng';

            const mockTickets = [
                {
                    _id: '1',
                    ticketCode: 'Ticket-001',
                    title: 'Đề xuất hỗ trợ setup cơ sở vật chất cho buổi đào tạo',
                    status: 'Open',
                    priority: 'High',
                    createdAt: new Date().toISOString(),
                    creator: {
                        _id: userId,
                        fullname: userFullname
                    },
                    assignedTo: {
                        fullname: 'Hoàng Thị Thu Hiền'
                    }
                },
                {
                    _id: '2',
                    ticketCode: 'Ticket-002',
                    title: 'Yêu cầu sửa chữa máy tính văn phòng',
                    status: 'Processing',
                    priority: 'Medium',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    creator: {
                        _id: userId,
                        fullname: userFullname
                    },
                    assignedTo: {
                        fullname: 'Hà Văn Cường'
                    }
                },
                {
                    _id: '3',
                    ticketCode: 'Ticket-003',
                    title: 'Đề xuất trang bị phần mềm Adobe cho phòng Marcom',
                    status: 'Waiting for Customer',
                    priority: 'Low',
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    creator: {
                        _id: userId,
                        fullname: userFullname
                    },
                    assignedTo: {
                        fullname: 'Nguyễn Văn Tuấn'
                    }
                },
                {
                    _id: '4',
                    ticketCode: 'Ticket-004',
                    title: 'Yêu cầu hỗ trợ mạng wifi cho phòng họp',
                    status: 'Closed',
                    priority: 'High',
                    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    creator: {
                        _id: userId,
                        fullname: userFullname
                    },
                    assignedTo: {
                        fullname: 'Trần Minh Đức'
                    }
                }
            ];

            // Lọc tickets theo trạng thái nếu có
            let filteredTickets = mockTickets;
            if (filterStatus) {
                filteredTickets = mockTickets.filter(ticket => ticket.status === filterStatus);
            }

            // Lọc theo từ khóa tìm kiếm nếu có
            if (searchTerm) {
                filteredTickets = filteredTickets.filter(ticket =>
                    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setTickets(filteredTickets);
        } catch (error) {
            console.error('Lỗi khi tạo dữ liệu mẫu:', error);
            // Fallback khi không lấy được userId
            setTickets([
                {
                    _id: '1',
                    ticketCode: 'Ticket-001',
                    title: 'Đề xuất hỗ trợ setup cơ sở vật chất cho buổi đào tạo',
                    status: 'Open',
                    priority: 'High',
                    createdAt: new Date().toISOString(),
                    creator: {
                        _id: 'user_mock',
                        fullname: 'Người dùng'
                    },
                    assignedTo: {
                        fullname: 'Hoàng Thị Thu Hiền'
                    }
                }
            ]);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Assigned':
                return 'bg-[#002855]';
            case 'Processing':
                return 'bg-[#F59E0B]';
            case 'Done':
                return 'bg-[#BED232]';
            case 'Closed':
                return 'bg-[#009483]';
            case 'Cancelled':
                return 'bg-[#F05023]';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Assigned':
                return 'Đã tiếp nhận';
            case 'processing':
                return 'Đang xử lý';
            case 'Done':
                return 'Đã xử lý';
            case 'Closed':
                return 'Đã đóng';
            case 'Cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const handleViewTicketDetail = (ticketId: string) => {
        navigation.navigate('TicketDetail', { ticketId });
    };

    const handleSearch = () => {
        fetchUserTickets();
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const applyFilter = (status: string) => {
        setFilterStatus(status);
        setShowFilters(false);
    };

    const renderItem = ({ item }: { item: Ticket }) => (
        <TouchableOpacity
            className="bg-[#F8F8F8] rounded-xl p-4 mb-3"
            onPress={() => handleViewTicketDetail(item._id)}
        >
            <View>
                <Text className="text-[#E84A37] font-semibold text-lg">{item.title}</Text>
                <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-gray-500 text-sm font-semibold mt-1">{item.ticketCode || `Ticket-${item._id.padStart(3, '0')}`}</Text>
                    <View>
                        <Text className="text-[#757575] text-base font-medium text-right">
                            {item.assignedTo?.fullname || 'Chưa phân công'}
                        </Text>
                    </View>
                </View>
                <View className="flex-row justify-between items-center mt-2">
                    <View>
                        <Text className="text-primary text-lg font-semibold">
                            {item.creator?.fullname || 'Không xác định'}
                        </Text>
                    </View>
                    <View className={`${getStatusColor(item.status)} rounded-lg px-3 py-1`}>
                        <Text className="text-white text-base font-semibold">{getStatusLabel(item.status)}</Text>
                    </View>

                </View>


            </View>
        </TouchableOpacity>
    );

    const handleCreateTicket = () => {
        // Điều hướng đến màn hình tạo ticket
        navigation.navigate('TicketCreate');
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="w-full flex-1 pb-16">
                {/* Header với tiêu đề và nút back */}
                <View className="w-full flex-row items-center px-4 py-4">
                    <TouchableOpacity onPress={handleGoBack} className="mr-3">
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
                                className={`mr-2 px-3 py-1 rounded-full ${filterStatus === 'Open' ? 'bg-blue-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('Open')}
                            >
                                <Text className={filterStatus === 'Open' ? 'text-white' : 'text-gray-700'}>Chưa nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterStatus === 'Processing' ? 'bg-yellow-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('Processing')}
                            >
                                <Text className={filterStatus === 'Processing' ? 'text-white' : 'text-gray-700'}>Đang xử lý</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterStatus === 'Waiting for Customer' ? 'bg-orange-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('Waiting for Customer')}
                            >
                                <Text className={filterStatus === 'Waiting for Customer' ? 'text-white' : 'text-gray-700'}>Chờ phản hồi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`mr-2 px-3 py-1 rounded-full ${filterStatus === 'Closed' ? 'bg-green-500' : 'bg-gray-200'}`}
                                onPress={() => applyFilter('Closed')}
                            >
                                <Text className={filterStatus === 'Closed' ? 'text-white' : 'text-gray-700'}>Đã xử lý</Text>
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
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16 }}
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

export default TicketGuestScreen;
