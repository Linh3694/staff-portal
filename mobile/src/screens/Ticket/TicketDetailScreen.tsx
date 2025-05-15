import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Image,
    StyleSheet
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { RootStackParamList } from '../../navigation/AppNavigator';

type TicketDetailScreenRouteProp = RouteProp<RootStackParamList, 'TicketDetail'>;

interface Message {
    _id: string;
    text: string;
    sender: {
        _id: string;
        fullname: string;
        avatarUrl?: string;
    };
    timestamp: string;
    type: 'text' | 'image';
}

interface Ticket {
    _id: string;
    ticketCode: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    creator: {
        _id: string;
        fullname: string;
    };
    assignedTo?: {
        _id: string;
        fullname: string;
        avatarUrl?: string;
    };
    createdAt: string;
    updatedAt: string;
    messages: Message[];
    history: {
        timestamp: string;
        action: string;
    }[];
    attachments: {
        filename: string;
        url: string;
    }[];
    feedback?: {
        rating: number;
        comment: string;
        badges?: string[];
    };
}

const TicketDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<TicketDetailScreenRouteProp>();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('userId');
                console.log('Lấy userId từ AsyncStorage:', storedUserId);
                setUserId(storedUserId || 'unknown_user');
            } catch (error) {
                console.error('Lỗi khi lấy userId:', error);
                setUserId('unknown_user');
            }
        };
        getUser();

        if (route.params?.ticketId) {
            fetchTicketDetails(route.params.ticketId);
        }
    }, [route.params?.ticketId]);

    const fetchTicketDetails = async (ticketId: string) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');

            console.log('Thông tin token:', token, 'TicketId:', ticketId);

            if (!token) {
                console.log('Sử dụng mock data vì token không tồn tại');
                // Mock data khi không có token
                setTicket({
                    _id: ticketId,
                    ticketCode: 'Ticket-001',
                    title: 'Máy tính số 25 ở phòng ICT bị hỏng',
                    description: 'Máy tính khởi động chậm và thường xuyên bị đơ màn hình. Cần hỗ trợ kiểm tra và khắc phục sự cố.',
                    status: 'Processing',
                    priority: 'High',
                    creator: {
                        _id: '123',
                        fullname: 'Nguyễn Văn A'
                    },
                    assignedTo: {
                        _id: '456',
                        fullname: 'Hoàng Thị Thu Hiền',
                        avatarUrl: ''
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: [
                        {
                            _id: '1',
                            text: 'Xin chào, tôi sẽ hỗ trợ vấn đề của bạn. Vui lòng cho biết chi tiết hơn về sự cố.',
                            sender: {
                                _id: '456',
                                fullname: 'Hoàng Thị Thu Hiền'
                            },
                            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                            type: 'text'
                        },
                        {
                            _id: '2',
                            text: 'Máy tính của tôi bị treo khi khởi động. Đã thử khởi động lại nhiều lần nhưng vẫn không được.',
                            sender: {
                                _id: '123',
                                fullname: 'Nguyễn Văn A'
                            },
                            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                            type: 'text'
                        }
                    ],
                    history: [
                        {
                            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                            action: 'Ticket đã được tạo'
                        },
                        {
                            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                            action: 'Ticket đã được gán cho Hoàng Thị Thu Hiền'
                        }
                    ],
                    attachments: []
                });
                setLoading(false);
                return;
            }

            try {
                const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
                console.log('Gọi API với URL:', `${apiUrl}/api/tickets/${ticketId}`);

                const res = await axios.get(`${apiUrl}/api/tickets/${ticketId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.success) {
                    console.log('API thành công, nhận được dữ liệu ticket');
                    setTicket(res.data.ticket);
                } else {
                    console.error('Lỗi khi lấy chi tiết ticket:', res.data.message);
                    // Sử dụng mock data nếu API thất bại
                    setTicket({
                        _id: ticketId,
                        ticketCode: 'Ticket-001',
                        title: 'Máy tính số 25 ở phòng ICT bị hỏng',
                        description: 'Máy tính khởi động chậm và thường xuyên bị đơ màn hình. Cần hỗ trợ kiểm tra và khắc phục sự cố.',
                        status: 'Processing',
                        priority: 'High',
                        creator: {
                            _id: '123',
                            fullname: 'Nguyễn Văn A'
                        },
                        assignedTo: {
                            _id: '456',
                            fullname: 'Hoàng Thị Thu Hiền',
                            avatarUrl: ''
                        },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        messages: [
                            {
                                _id: '1',
                                text: 'Xin chào, tôi sẽ hỗ trợ vấn đề của bạn. Vui lòng cho biết chi tiết hơn về sự cố.',
                                sender: {
                                    _id: '456',
                                    fullname: 'Hoàng Thị Thu Hiền'
                                },
                                timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                                type: 'text'
                            },
                            {
                                _id: '2',
                                text: 'Máy tính của tôi bị treo khi khởi động. Đã thử khởi động lại nhiều lần nhưng vẫn không được.',
                                sender: {
                                    _id: '123',
                                    fullname: 'Nguyễn Văn A'
                                },
                                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                                type: 'text'
                            }
                        ],
                        history: [
                            {
                                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                                action: 'Ticket đã được tạo'
                            },
                            {
                                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                                action: 'Ticket đã được gán cho Hoàng Thị Thu Hiền'
                            }
                        ],
                        attachments: []
                    });
                }
            } catch (apiError) {
                console.error('Lỗi khi gọi API:', apiError);
                // Sử dụng mock data nếu API thất bại
                setTicket({
                    _id: ticketId,
                    ticketCode: 'Ticket-001',
                    title: 'Máy tính số 25 ở phòng ICT bị hỏng',
                    description: 'Máy tính khởi động chậm và thường xuyên bị đơ màn hình. Cần hỗ trợ kiểm tra và khắc phục sự cố.',
                    status: 'Processing',
                    priority: 'High',
                    creator: {
                        _id: '123',
                        fullname: 'Nguyễn Văn A'
                    },
                    assignedTo: {
                        _id: '456',
                        fullname: 'Hoàng Thị Thu Hiền',
                        avatarUrl: ''
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: [
                        {
                            _id: '1',
                            text: 'Xin chào, tôi sẽ hỗ trợ vấn đề của bạn. Vui lòng cho biết chi tiết hơn về sự cố.',
                            sender: {
                                _id: '456',
                                fullname: 'Hoàng Thị Thu Hiền'
                            },
                            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                            type: 'text'
                        },
                        {
                            _id: '2',
                            text: 'Máy tính của tôi bị treo khi khởi động. Đã thử khởi động lại nhiều lần nhưng vẫn không được.',
                            sender: {
                                _id: '123',
                                fullname: 'Nguyễn Văn A'
                            },
                            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                            type: 'text'
                        }
                    ],
                    history: [
                        {
                            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                            action: 'Ticket đã được tạo'
                        },
                        {
                            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                            action: 'Ticket đã được gán cho Hoàng Thị Thu Hiền'
                        }
                    ],
                    attachments: []
                });
            }
        } catch (error) {
            console.error('Lỗi tổng thể:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !ticket?._id) return;

        try {
            const token = await AsyncStorage.getItem('authToken');

            if (!token) {
                console.log('Không có token, sử dụng mock data để gửi tin nhắn');
                // Xử lý gửi tin nhắn giả
                const newMsg: Message = {
                    _id: `mock-${Date.now()}`,
                    text: newMessage,
                    sender: {
                        _id: userId || 'user-mock',
                        fullname: 'Bạn'
                    },
                    timestamp: new Date().toISOString(),
                    type: 'text'
                };

                // Cập nhật ticket với tin nhắn mới
                if (ticket) {
                    setTicket({
                        ...ticket,
                        messages: [...ticket.messages, newMsg]
                    });
                }

                setNewMessage('');
                return;
            }

            try {
                const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
                console.log('Gửi tin nhắn đến API:', `${apiUrl}/api/tickets/${ticket._id}/messages`);

                const res = await axios.post(
                    `${apiUrl}/api/tickets/${ticket._id}/messages`,
                    { text: newMessage },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data.success) {
                    console.log('Gửi tin nhắn thành công');
                    setNewMessage('');
                    fetchTicketDetails(ticket._id);
                } else {
                    console.error('Lỗi khi gửi tin nhắn:', res.data.message);
                    // Xử lý gửi tin nhắn giả khi API thất bại
                    const newMsg: Message = {
                        _id: `mock-${Date.now()}`,
                        text: newMessage,
                        sender: {
                            _id: userId || 'user-mock',
                            fullname: 'Bạn'
                        },
                        timestamp: new Date().toISOString(),
                        type: 'text'
                    };

                    if (ticket) {
                        setTicket({
                            ...ticket,
                            messages: [...ticket.messages, newMsg]
                        });
                    }

                    setNewMessage('');
                }
            } catch (apiError) {
                console.error('Lỗi khi gọi API gửi tin nhắn:', apiError);
                // Xử lý gửi tin nhắn giả khi API lỗi
                const newMsg: Message = {
                    _id: `mock-${Date.now()}`,
                    text: newMessage,
                    sender: {
                        _id: userId || 'user-mock',
                        fullname: 'Bạn'
                    },
                    timestamp: new Date().toISOString(),
                    type: 'text'
                };

                if (ticket) {
                    setTicket({
                        ...ticket,
                        messages: [...ticket.messages, newMsg]
                    });
                }

                setNewMessage('');
            }
        } catch (error) {
            console.error('Lỗi tổng thể khi gửi tin nhắn:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#F05023" />
            </SafeAreaView>
        );
    }

    if (!ticket) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <Text className="text-gray-500">Không tìm thấy thông tin ticket</Text>
            </SafeAreaView>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open':
                return 'bg-blue-500';
            case 'Processing':
                return 'bg-yellow-500';
            case 'Waiting for Customer':
                return 'bg-orange-500';
            case 'Closed':
                return 'bg-green-500';
            case 'Cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Open':
                return 'Chưa nhận';
            case 'Processing':
                return 'Đang xử lý';
            case 'Waiting for Customer':
                return 'Chờ phản hồi';
            case 'Closed':
                return 'Đã xử lý';
            case 'Cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High':
                return 'text-red-700';
            case 'Medium':
                return 'text-yellow-700';
            case 'Low':
                return 'text-green-700';
            default:
                return 'text-gray-700';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="px-4 py-4 border-b border-gray-200">
                    <Text className="text-xl font-bold text-[#E84A37]">{ticket.title}</Text>
                    <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-gray-500">Ticket #{ticket.ticketCode}</Text>
                        {ticket.status === 'Open' ? (
                            <Text className="text-gray-600 font-medium">Chưa nhận</Text>
                        ) : (
                            <View className={`${getStatusColor(ticket.status)} rounded-lg px-3 py-1`}>
                                <Text className="text-white text-xs font-semibold">{getStatusLabel(ticket.status)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Thông tin ticket */}
                <View className="px-4 py-4 border-b border-gray-200">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-500">Người tạo:</Text>
                        <Text className="font-medium">{ticket.creator?.fullname || 'Không xác định'}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-500">Người xử lý:</Text>
                        <Text className="font-medium">{ticket.assignedTo?.fullname || 'Chưa phân công'}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-500">Ngày tạo:</Text>
                        <Text className="font-medium">{formatTimestamp(ticket.createdAt)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-500">Độ ưu tiên:</Text>
                        <Text className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                        </Text>
                    </View>
                </View>

                {/* Mô tả */}
                <View className="px-4 py-4 border-b border-gray-200">
                    <Text className="font-semibold mb-2 text-[#E84A37]">Mô tả:</Text>
                    <Text className="text-gray-700">{ticket.description}</Text>
                </View>

                {/* Tin nhắn */}
                <View className="px-4 py-4">
                    <Text className="font-semibold mb-4 text-[#E84A37]">Tin nhắn trao đổi:</Text>
                    {ticket.messages && ticket.messages.length > 0 ? (
                        ticket.messages.map((message) => (
                            <View
                                key={message._id}
                                className={`mb-4 ${message.sender._id === userId ? 'items-end' : 'items-start'} flex`}
                            >
                                <View className={`max-w-[80%] rounded-lg p-3 ${message.sender._id === userId ? 'bg-blue-100 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}`}>
                                    {message.type === 'text' ? (
                                        <Text>{message.text}</Text>
                                    ) : (
                                        <Image
                                            source={{ uri: message.text }}
                                            style={{ width: 200, height: 150, borderRadius: 8 }}
                                            resizeMode="cover"
                                        />
                                    )}
                                    <Text className="text-xs text-gray-500 mt-1">
                                        {message.sender.fullname} - {formatTimestamp(message.timestamp)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text className="text-gray-500 italic">Chưa có tin nhắn nào</Text>
                    )}
                </View>
            </ScrollView>

            {/* Footer - Nhập tin nhắn */}
            {ticket.status !== 'Closed' && ticket.status !== 'Cancelled' && (
                <View className="p-2 border-t border-gray-200 bg-white">
                    <View className="flex-row items-center">
                        <TextInput
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
                            placeholder="Nhập tin nhắn..."
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity
                            className="bg-orange-500 w-10 h-10 rounded-full items-center justify-center"
                            onPress={handleSendMessage}
                        >
                            <Ionicons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default TicketDetailScreen; 