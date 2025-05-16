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
    StyleSheet,
    StatusBar,
    Alert
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { API_BASE_URL } from '../../config/constants';
import TicketInformation from './components/TicketInformation';
import TicketProcessing from './components/TicketProcessing';
import TicketChat from './components/TicketChat';
import TicketHistory from './components/TicketHistory';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type Props = NativeStackScreenProps<RootStackParamList, 'TicketDetail'>;

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
        email: string;
    };
    assignedTo: {
        _id: string;
        fullname: string;
        email: string;
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

const TicketDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { ticketId } = route.params;
    const [activeTab, setActiveTab] = useState('information');
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

        if (ticketId) {
            fetchTicketDetails(ticketId);
        }
    }, [ticketId]);

    const fetchTicketDetails = async (ticketId: string) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.log('Không có token, sử dụng mock data');
                setTicket({
                    _id: ticketId,
                    ticketCode: 'Ticket-001',
                    title: 'Máy tính số 25 ở phòng ICT bị hỏng',
                    description: 'Máy tính khởi động chậm và thường xuyên bị đơ màn hình. Cần hỗ trợ kiểm tra và khắc phục sự cố.',
                    status: 'Processing',
                    priority: 'High',
                    creator: {
                        _id: '123',
                        fullname: 'Nguyễn Văn A',
                        email: 'nguyenvana@example.com'
                    },
                    assignedTo: {
                        _id: '456',
                        fullname: 'Hoàng Thị Thu Hiền',
                        email: 'hoangthithuien@example.com'
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: [],
                    history: [],
                    attachments: []
                });
                return;
            }

            try {
                console.log('Gọi API với URL:', `${API_BASE_URL}/api/tickets/${ticketId}`);

                const res = await axios.get(`${API_BASE_URL}/api/tickets/${ticketId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.success) {
                    console.log('API thành công, nhận được dữ liệu ticket');
                    setTicket({
                        ...res.data.ticket,
                        messages: res.data.ticket.messages || [],
                        history: res.data.ticket.history || [],
                        attachments: res.data.ticket.attachments || []
                    });
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
                            fullname: 'Nguyễn Văn A',
                            email: 'nguyenvana@example.com'
                        },
                        assignedTo: {
                            _id: '456',
                            fullname: 'Hoàng Thị Thu Hiền',
                            email: 'hoangthithuien@example.com'
                        },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        messages: [],
                        history: [],
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
                        fullname: 'Nguyễn Văn A',
                        email: 'nguyenvana@example.com'
                    },
                    assignedTo: {
                        _id: '456',
                        fullname: 'Hoàng Thị Thu Hiền',
                        email: 'hoangthithuien@example.com'
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: [],
                    history: [],
                    attachments: []
                });
            }
        } catch (error) {
            console.error('Lỗi:', error);
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
                console.log('Gửi tin nhắn đến API:', `${API_BASE_URL}/api/tickets/${ticket._id}/messages`);

                const res = await axios.post(
                    `${API_BASE_URL}/api/tickets/${ticket._id}/messages`,
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

    // Xác định màu sắc nút trạng thái theo trạng thái ticket
    const getStatusButton = () => {
        if (!ticket) return null;
        switch (ticket.status) {
            case 'Assigned':
                return (
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-[#002855] items-center justify-center">
                        <Ionicons name="checkmark" size={24} color="white" />
                    </TouchableOpacity>
                );
            case 'Processing':
                return (
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-[#F59E0B] items-center justify-center">
                        <Ionicons name="refresh" size={24} color="white" />
                    </TouchableOpacity>
                );
            case 'Done':
                return (
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-[#BED232] items-center justify-center">
                        <Ionicons name="pause" size={24} color="white" />
                    </TouchableOpacity>
                );
            case 'Cancelled':
                return (
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-[#F05023] items-center justify-center">
                        <Ionicons name="square" size={20} color="white" />
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            if (!ticket) return;

            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.log('Không có token, không thể cập nhật trạng thái');
                return;
            }

            const response = await axios.put(
                `${API_BASE_URL}/api/tickets/${ticketId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                fetchTicketDetails(ticketId);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
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

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            {ticket && (
                <>
                    <View className="flex-row items-center justify-between px-4 pt-2 pb-4 border-b border-gray-200">
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                className="mr-3"
                            >
                                <Ionicons name="chevron-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <View>
                                <Text className="text-xl font-bold">{ticket.ticketCode}</Text>
                                <Text className="text-red-500">{ticket.title}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center space-x-4 py-2 px-4">
                        {getStatusButton()}
                        <TouchableOpacity
                            className="w-10 h-10 rounded-full bg-[#009483] items-center justify-center"
                            onPress={() => handleStatusChange('Processing')}
                            disabled={ticket.status === 'Cancelled' || ticket.status === 'Done'}
                        >
                            <Ionicons name="refresh" size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-10 h-10 rounded-full bg-[#F59E0B] items-center justify-center"
                            onPress={() => handleStatusChange('Done')}
                            disabled={ticket.status === 'Cancelled'}
                        >
                            <Ionicons name="checkmark" size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-10 h-10 rounded-full bg-[#F05023] items-center justify-center"
                            onPress={() => {
                                Alert.alert(
                                    'Xác nhận hủy',
                                    'Bạn có chắc chắn muốn hủy ticket này không?',
                                    [
                                        { text: 'Hủy bỏ', style: 'cancel' },
                                        { text: 'Xác nhận', onPress: () => handleStatusChange('Cancelled') }
                                    ]
                                );
                            }}
                            disabled={ticket.status === 'Cancelled'}
                        >
                            <Ionicons name="square" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row border-b border-gray-200">
                        <TouchableOpacity
                            onPress={() => setActiveTab('information')}
                            className={`flex-1 py-3 px-2 ${activeTab === 'information' ? 'border-b-2 border-[#002855]' : ''}`}
                        >
                            <Text
                                className={`text-center ${activeTab === 'information' ? 'text-[#002855] font-semibold' : 'text-gray-500'}`}
                            >
                                Thông tin
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('progress')}
                            className={`flex-1 py-3 px-2 ${activeTab === 'progress' ? 'border-b-2 border-[#002855]' : ''}`}
                        >
                            <Text
                                className={`text-center ${activeTab === 'progress' ? 'text-[#002855] font-semibold' : 'text-gray-500'}`}
                            >
                                Tiến trình
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('chat')}
                            className={`flex-1 py-3 px-2 ${activeTab === 'chat' ? 'border-b-2 border-[#002855]' : ''}`}
                        >
                            <Text
                                className={`text-center ${activeTab === 'chat' ? 'text-[#002855] font-semibold' : 'text-gray-500'}`}
                            >
                                Trao đổi
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('history')}
                            className={`flex-1 py-3 px-2 ${activeTab === 'history' ? 'border-b-2 border-[#002855]' : ''}`}
                        >
                            <Text
                                className={`text-center ${activeTab === 'history' ? 'text-[#002855] font-semibold' : 'text-gray-500'}`}
                            >
                                Lịch sử
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1">
                        {activeTab === 'information' && <TicketInformation ticketId={ticketId} />}
                        {activeTab === 'progress' && <TicketProcessing ticketId={ticketId} onRefresh={() => fetchTicketDetails(ticketId)} />}
                        {activeTab === 'chat' && <TicketChat ticketId={ticketId} onRefresh={() => fetchTicketDetails(ticketId)} />}
                        {activeTab === 'history' && <TicketHistory ticketId={ticketId} />}
                    </View>

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
                </>
            )}
        </SafeAreaView>
    );
};

export default TicketDetailScreen; 