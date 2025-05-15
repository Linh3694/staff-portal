import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, SafeAreaView, Linking, Alert, ActionSheetIOS, ScrollView, Dimensions, Modal, StatusBar, PanResponder, GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { User } from '../../navigation/AppNavigator'; // or wherever User is now defined
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { Video, ResizeMode } from 'expo-av';
import ImageViewing from 'react-native-image-viewing';
import { AppState, AppStateStatus } from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

type Message = {
    _id: string;
    sender: User;
    content: string;
    chat: string;
    readBy: string[];
    createdAt: string;
    type: string;
    fileUrl?: string;
    fileUrls?: string[];
};

type Chat = {
    _id: string;
    participants: User[];
};

const getAvatar = (user: User) => {
    if (user.avatarUrl) {
        return `${apiUrl}/uploads/Avatar/${user.avatarUrl}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}`;
};

type ChatDetailParams = { user: User; chatId?: string };
type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const TypingIndicator = () => {
    const [dots, setDots] = useState('.');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => {
                if (prev === '...') return '.';
                if (prev === '..') return '...';
                if (prev === '.') return '..';
                return '.';
            });
        }, 300);

        return () => clearInterval(interval);
    }, []);

    return (
        <Text style={{ color: '#4A4A4A', fontSize: 12, fontStyle: 'italic' }}>đang soạn tin {dots} </Text>
    );
};

// Thêm component hiển thị nhiều ảnh
const ImageGrid = ({ images, onPress }: { images: string[], onPress: (index: number) => void }) => {
    const screenWidth = Dimensions.get('window').width;
    const maxWidth = screenWidth * 0.7; // Chiếm khoảng 70% chiều rộng màn hình
    const gap = 2; // Khoảng cách giữa các ảnh

    // Logic sắp xếp ảnh dựa vào số lượng
    if (images.length === 1) {
        // Một ảnh: hiển thị toàn bộ
        return (
            <TouchableOpacity onPress={() => onPress(0)}>
                <Image
                    source={{ uri: images[0] }}
                    style={{ width: maxWidth, height: maxWidth * 0.75, borderRadius: 12 }}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    } else if (images.length === 2) {
        // Hai ảnh: hiển thị cạnh nhau
        return (
            <View style={{ flexDirection: 'row', width: maxWidth }}>
                <TouchableOpacity onPress={() => onPress(0)} style={{ flex: 1, marginRight: gap / 2 }}>
                    <Image
                        source={{ uri: images[0] }}
                        style={{ width: '100%', height: maxWidth / 2, borderRadius: 12 }}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onPress(1)} style={{ flex: 1, marginLeft: gap / 2 }}>
                    <Image
                        source={{ uri: images[1] }}
                        style={{ width: '100%', height: maxWidth / 2, borderRadius: 12 }}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            </View>
        );
    } else if (images.length === 3) {
        // Ba ảnh: 1 lớn bên trái, 2 nhỏ bên phải xếp dọc
        return (
            <View style={{ flexDirection: 'row', width: maxWidth }}>
                <TouchableOpacity onPress={() => onPress(0)} style={{ width: maxWidth / 2 - gap / 2, marginRight: gap / 2 }}>
                    <Image
                        source={{ uri: images[0] }}
                        style={{ width: '100%', height: maxWidth / 2, borderRadius: 12 }}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
                <View style={{ flexDirection: 'column', width: maxWidth / 2 - gap / 2, marginLeft: gap / 2 }}>
                    <TouchableOpacity onPress={() => onPress(1)} style={{ marginBottom: gap / 2 }}>
                        <Image
                            source={{ uri: images[1] }}
                            style={{ width: '100%', height: maxWidth / 4 - gap / 2, borderRadius: 12 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onPress(2)} style={{ marginTop: gap / 2 }}>
                        <Image
                            source={{ uri: images[2] }}
                            style={{ width: '100%', height: maxWidth / 4 - gap / 2, borderRadius: 12 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    } else if (images.length === 4) {
        // Bốn ảnh: lưới 2x2
        return (
            <View style={{ width: maxWidth }}>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => onPress(0)} style={{ width: maxWidth / 2 - gap / 2, marginRight: gap / 2, marginBottom: gap / 2 }}>
                        <Image
                            source={{ uri: images[0] }}
                            style={{ width: '100%', height: maxWidth / 2 - gap / 2, borderRadius: 12 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onPress(1)} style={{ width: maxWidth / 2 - gap / 2, marginLeft: gap / 2, marginBottom: gap / 2 }}>
                        <Image
                            source={{ uri: images[1] }}
                            style={{ width: '100%', height: maxWidth / 2 - gap / 2, borderRadius: 12 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => onPress(2)} style={{ width: maxWidth / 2 - gap / 2, marginRight: gap / 2, marginTop: gap / 2 }}>
                        <Image
                            source={{ uri: images[2] }}
                            style={{ width: '100%', height: maxWidth / 2 - gap / 2, borderRadius: 12 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onPress(3)} style={{ width: maxWidth / 2 - gap / 2, marginLeft: gap / 2, marginTop: gap / 2 }}>
                        <Image
                            source={{ uri: images[3] }}
                            style={{ width: '100%', height: maxWidth / 2 - gap / 2, borderRadius: 12 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    } else {
        // 5+ ảnh: luôn hiển thị dạng lưới 3x2 cố định
        const displayImages = images.slice(0, Math.min(6, images.length));
        // Mỗi hàng có 3 ảnh
        const itemWidth = maxWidth / 3 - (gap * 2 / 3);
        const itemHeight = (maxWidth / 3) * 0.8; // Tỉ lệ 4:3 cho ảnh

        return (
            <View style={{ width: maxWidth }}>
                {/* Hàng đầu tiên: 3 ảnh */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: gap }}>
                    {[0, 1, 2].map(idx => {
                        if (idx < displayImages.length) {
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => onPress(idx)}
                                    style={{ width: itemWidth, height: itemHeight }}
                                >
                                    <Image
                                        source={{ uri: displayImages[idx] }}
                                        style={{ width: '100%', height: '100%', borderRadius: 8 }}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            );
                        }
                        return <View key={idx} style={{ width: itemWidth, height: itemHeight }} />;
                    })}
                </View>

                {/* Hàng thứ hai: 3 ảnh còn lại nếu có */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[3, 4, 5].map(idx => {
                        if (idx < displayImages.length) {
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => onPress(idx)}
                                    style={{ width: itemWidth, height: itemHeight }}
                                >
                                    <Image
                                        source={{ uri: displayImages[idx] }}
                                        style={{ width: '100%', height: '100%', borderRadius: 8 }}
                                        resizeMode="cover"
                                    />
                                    {idx === 5 && images.length > 6 && (
                                        <View style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                            borderRadius: 8,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                                                +{images.length - 6}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        }
                        return <View key={idx} style={{ width: itemWidth, height: itemHeight }} />;
                    })}
                </View>
            </View>
        );
    }
};

// Hàm format thời gian
const formatMessageTime = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    const now = new Date();

    // Format giờ (HH:MM)
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    // Kiểm tra xem có phải là ngày hôm nay không
    if (messageDate.toDateString() === now.toDateString()) {
        return timeString;
    }

    // Kiểm tra xem có phải là ngày hôm qua không
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
        return `Hôm qua ${timeString}`;
    }

    // Trong tuần này (hiển thị tên thứ)
    const diff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `${days[messageDate.getDay()]} ${timeString}`;
    }

    // Ngày khác trong năm nay
    if (messageDate.getFullYear() === now.getFullYear()) {
        const day = messageDate.getDate().toString().padStart(2, '0');
        const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month} ${timeString}`;
    }

    // Ngày ở năm khác
    return `${messageDate.getDate().toString().padStart(2, '0')}/${(messageDate.getMonth() + 1).toString().padStart(2, '0')}/${messageDate.getFullYear()} ${timeString}`;
};

// Component hiển thị trạng thái tin nhắn
const MessageStatus = ({ message, currentUserId, chat }: { message: Message, currentUserId: string | null, chat: Chat | null }) => {
    // Chỉ hiển thị status cho tin nhắn của mình
    if (!currentUserId || message.sender._id !== currentUserId) {
        return null;
    }

    // Log thông tin debug để phân tích lỗi
    console.log(`Status check for message ${message._id?.substring(0, 5)}... | readBy:`, message.readBy,
        '| chat participants:', chat?.participants?.map(p => p._id));

    // Nếu chưa gửi hoặc đang gửi (không có _id)
    if (!message._id) {
        return <MaterialCommunityIcons name="clock-outline" size={12} color="#8aa0bc" />;
    }

    // Không có chat hoặc không có người tham gia
    if (!chat || !Array.isArray(chat.participants) || chat.participants.length === 0) {
        console.log('No chat or no participants');
        return <MaterialCommunityIcons name="check" size={12} color="#8aa0bc" />;
    }

    // Lấy danh sách người tham gia trừ người gửi
    const otherParticipants = chat.participants
        .filter(user => user._id !== currentUserId)
        .map(user => user._id);

    console.log('Other participants:', otherParticipants);

    // Nếu không có người tham gia khác
    if (otherParticipants.length === 0) {
        return <MaterialCommunityIcons name="check" size={14} color="#ffffff" />;
    }

    // Đảm bảo readBy là một mảng
    const readByArray = Array.isArray(message.readBy) ? message.readBy : [];

    // Lọc ra ID của người đã đọc, không tính người gửi
    const readByOthers = readByArray.filter(id =>
        id !== currentUserId && otherParticipants.includes(id)
    );

    console.log(`Message ${message._id?.substring(0, 5)}... | readByOthers:`, readByOthers);

    // Kiểm tra xem tất cả người tham gia khác đã đọc chưa
    const allParticipantsRead = otherParticipants.length > 0 &&
        otherParticipants.every(participantId => readByArray.includes(participantId));

    // Log kết quả cuối cùng
    console.log(`Message ${message._id?.substring(0, 5)}... | allParticipantsRead:`, allParticipantsRead);

    // Nếu tất cả đã đọc - hiển thị tick xanh đậm
    if (allParticipantsRead) {
        return <MaterialCommunityIcons name="check-all" size={14} color="#ffffff" fontWeight="bold" />;
    }

    // Nếu có người đã đọc nhưng không phải tất cả - hiển thị tick xanh nhạt
    if (readByOthers.length > 0) {
        return <MaterialCommunityIcons name="check-all" size={14} color="#ffffff" />;
    }

    // Mặc định là đã gửi - hiển thị một tick xám
    return <MaterialCommunityIcons name="check" size={14} color="#ffffff" />;
};

const ChatDetailScreen = ({ route, navigation }: Props) => {
    const { user, chatId: routeChatId } = route.params;
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigationProp = useNavigation<NativeStackNavigationProp<{ ChatDetail: ChatDetailParams }, 'ChatDetail'>>();
    const socketRef = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    const { isUserOnline, getFormattedLastSeen } = useOnlineStatus();
    const [otherTyping, setOtherTyping] = useState(false);
    let typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const [imagesToSend, setImagesToSend] = useState<any[]>([]);
    const bottomSheetHeight = 60 + (insets.bottom || 10);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
    const [isScreenActive, setIsScreenActive] = useState(true);
    const chatIdRef = useRef<string | null>(null);

    // Focus & blur handlers for tracking when screen is active/inactive
    useEffect(() => {
        const unsubscribeFocus = navigation.addListener('focus', () => {
            console.log('ChatDetail screen focused');
            setIsScreenActive(true);

            // Mark messages as read when screen comes into focus
            if (currentUserId && chatIdRef.current) {
                const fetchToken = async () => {
                    const token = await AsyncStorage.getItem('token');
                    if (token) {
                        markMessagesAsRead(chatIdRef.current, currentUserId, token);
                    }
                };
                fetchToken();
            }
        });

        const unsubscribeBlur = navigation.addListener('blur', () => {
            console.log('ChatDetail screen blurred');
            setIsScreenActive(false);
        });

        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [navigation, currentUserId]);

    useEffect(() => {
        // Lấy currentUserId từ token
        const fetchCurrentUser = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                try {
                    const decoded: { id?: string, _id?: string } = jwtDecode(token) as any;
                    if (decoded && (decoded._id || decoded.id)) {
                        const userId = decoded._id || decoded.id;
                        if (userId) {
                            setCurrentUserId(userId);
                        }
                    }
                } catch (err) {
                    console.log('Token decode error:', err);
                }
            }
        };
        fetchCurrentUser();
    }, []);

    useLayoutEffect(() => {
        const parent = navigation.getParent?.();
        parent?.setOptions({ tabBarStyle: { display: 'none' } });
        return () => {
            parent?.setOptions({ tabBarStyle: undefined });
        };
    }, [navigation]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Nếu có sẵn chatId từ route.params, sử dụng nó
                if (routeChatId) {
                    // Lưu chatId vào ref
                    chatIdRef.current = routeChatId;

                    // Lấy thông tin chat
                    setChat({ _id: routeChatId, participants: [] as User[] });

                    // Lấy tin nhắn
                    const msgRes = await fetch(`${apiUrl}/api/chats/messages/${routeChatId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const msgData = await msgRes.json();
                    if (Array.isArray(msgData)) {
                        // Sắp xếp tin nhắn từ cũ đến mới
                        const sortedMessages = [...msgData].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );
                        setMessages(sortedMessages);

                        // Đánh dấu tin nhắn là đã đọc nếu có currentUserId
                        if (currentUserId && msgData.length > 0) {
                            markMessagesAsRead(routeChatId, currentUserId, token);
                        }
                    }

                    // Thiết lập Socket.IO
                    setupSocket(token, routeChatId);
                } else {
                    // Tạo chat mới nếu không có sẵn chatId
                    const res = await fetch(`${apiUrl}/api/chats/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ participantId: user._id }),
                    });
                    const chatData = await res.json();
                    setChat(chatData);

                    // Lưu chatId vào ref
                    chatIdRef.current = chatData._id;

                    // Lấy tin nhắn
                    const msgRes = await fetch(`${apiUrl}/api/chats/messages/${chatData._id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const msgData = await msgRes.json();
                    if (Array.isArray(msgData)) {
                        // Sắp xếp tin nhắn từ cũ đến mới
                        const sortedMessages = [...msgData].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );
                        setMessages(sortedMessages);

                        // Đánh dấu tin nhắn là đã đọc nếu có currentUserId
                        if (currentUserId && msgData.length > 0) {
                            markMessagesAsRead(chatData._id, currentUserId, token);
                        }
                    }

                    // Thiết lập Socket.IO
                    setupSocket(token, chatData._id);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) {
            fetchData();
        }

        return () => {
            // Dọn dẹp socket khi component unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user, routeChatId, currentUserId]);

    const markMessagesAsRead = async (chatId: string | null, userId: string, token: string) => {
        if (!chatId) return;

        try {
            // Sử dụng API mới để đánh dấu tất cả tin nhắn đã đọc
            const response = await fetch(`${apiUrl}/api/chats/read-all/${chatId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                // Cập nhật state tin nhắn
                setMessages(prevMessages =>
                    prevMessages.map(msg => {
                        if (msg.sender._id !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
                            return {
                                ...msg,
                                readBy: [...(msg.readBy || []), userId]
                            };
                        }
                        return msg;
                    })
                );

                // Gửi thông báo qua socket rằng tin nhắn đã được đọc
                if (socketRef.current && socketRef.current.connected) {
                    console.log('Emitting messageRead event for chat:', chatId);
                    socketRef.current.emit('messageRead', {
                        userId: userId,
                        chatId: chatId
                    });
                }
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const setupSocket = async (token: string | null, chatId: string) => {
        if (!token) return;

        // Dọn dẹp socket cũ nếu có
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Kết nối Socket.IO với token
        socketRef.current = io(apiUrl, {
            query: { token },
            transports: ['websocket']
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected');

            // Tham gia phòng chat
            socketRef.current.emit('joinChat', chatId);

            // Đánh dấu tin nhắn là đã đọc khi kết nối thành công
            if (currentUserId) {
                markMessagesAsRead(chatId, currentUserId, token);
            }
        });

        // Lắng nghe tin nhắn mới
        socketRef.current.on('receiveMessage', (newMessage: Message) => {
            console.log('Nhận tin nhắn mới:', newMessage);
            if (newMessage.chat === chatId) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    // Nếu tin nhắn đã tồn tại (_id trùng) thì bỏ qua
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });

                // Đánh dấu tin nhắn mới là đã đọc nếu bạn không phải người gửi và đang ở trong màn hình chat
                if (currentUserId && newMessage.sender._id !== currentUserId && isScreenActive) {
                    markMessagesAsRead(chatId, currentUserId, token);
                }
            }
        });

        // Lắng nghe sự kiện messageRead để cập nhật trạng thái đã đọc của tin nhắn
        socketRef.current.on('messageRead', ({ userId, chatId: updatedChatId, timestamp }: { userId: string, chatId: string, timestamp?: string }) => {
            console.log('Message read event received:', userId, updatedChatId, timestamp);

            // Chỉ xử lý nếu sự kiện thuộc về chat hiện tại
            if (updatedChatId === chatId) {
                setMessages(prevMessages => {
                    console.log('Updating messages readBy status for user:', userId);
                    return prevMessages.map(msg => {
                        // Đảm bảo readBy luôn là mảng
                        const readBy = Array.isArray(msg.readBy) ? [...msg.readBy] : [];

                        // Chỉ cập nhật tin nhắn chưa được đọc bởi người dùng này
                        if (!readBy.includes(userId)) {
                            console.log(`Adding ${userId} to readBy for message ${msg._id?.substring(0, 5)}...`);
                            return {
                                ...msg,
                                readBy: [...readBy, userId]
                            };
                        }
                        return msg;
                    });
                });

                // Cập nhật lại thông tin chat từ server để đảm bảo participants được cập nhật
                if (currentUserId) {
                    const fetchFullChatInfo = async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            if (!token) return;

                            const response = await fetch(`${apiUrl}/api/chats/${chatId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            if (response.ok) {
                                const fullChatData = await response.json();
                                setChat(fullChatData);
                            }
                        } catch (error) {
                            console.error('Error fetching updated chat info:', error);
                        }
                    };

                    fetchFullChatInfo();
                }
            }
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socketRef.current.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
        });
    };

    const sendMessage = async () => {
        if (!input.trim() || !chat) return;
        const token = await AsyncStorage.getItem('token');
        const content = input.trim();

        // Xóa input trước để UI phản hồi nhanh hơn
        setInput('');

        try {
            const res = await fetch(`${apiUrl}/api/chats/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId: chat._id, content }),
            });

            const newMessage = await res.json();
            console.log('Gửi tin nhắn mới:', newMessage);

            // Thêm tin nhắn vào state trước khi nhận từ socket để hiển thị ngay lập tức
            if (newMessage && newMessage._id) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    // Kiểm tra tin nhắn đã tồn tại chưa
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Nếu có lỗi, hiển thị lại input
            setInput(content);
        }
    };

    useEffect(() => {
        if (!socketRef.current || !chat?._id) return;

        // Hàm xử lý sự kiện người dùng online
        const handleUserOnline = ({ userId }: { userId: string }) => {
            console.log('User online event received:', userId, 'comparing with:', user._id);
            if (userId === user._id) {
                console.log('Setting other user to online');
            }
        };

        // Hàm xử lý sự kiện người dùng offline
        const handleUserOffline = ({ userId }: { userId: string }) => {
            console.log('User offline event received:', userId, 'comparing with:', user._id);
            if (userId === user._id) {
                console.log('Setting other user to offline');
                // Khi người dùng offline, đảm bảo trạng thái typing cũng bị reset
                setOtherTyping(false);
            }
        };

        // Xử lý sự kiện userStatus từ server
        const handleUserStatus = ({ userId, status }: { userId: string, status: string }) => {
            console.log('User status received:', userId, status, 'comparing with:', user._id);
            if (userId === user._id) {
                console.log('Setting other user status to:', status);
                // Khi người dùng offline, đảm bảo trạng thái typing cũng bị reset
                if (status === 'offline') {
                    setOtherTyping(false);
                }
            }
        };

        // Kiểm tra trạng thái online ngay khi kết nối
        console.log('Checking online status for user:', user._id);
        socketRef.current.emit('checkUserStatus', { userId: user._id });

        // Thiết lập các listeners
        socketRef.current.on('userOnline', handleUserOnline);
        socketRef.current.on('userOffline', handleUserOffline);
        socketRef.current.on('userStatus', handleUserStatus);

        // Thông báo mình online
        if (currentUserId) {
            console.log('Emitting userOnline for', currentUserId, 'in chat', chat._id);
            socketRef.current.emit('userOnline', { userId: currentUserId, chatId: chat._id });
        }

        // Kiểm tra trạng thái online mỗi 20 giây
        const statusCheckInterval = setInterval(() => {
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('checkUserStatus', { userId: user._id });
                // Đồng thời cập nhật trạng thái online của mình
                if (currentUserId) {
                    socketRef.current.emit('userOnline', { userId: currentUserId, chatId: chat._id });
                }
            }
        }, 20000);

        return () => {
            socketRef.current.off('userOnline', handleUserOnline);
            socketRef.current.off('userOffline', handleUserOffline);
            socketRef.current.off('userStatus', handleUserStatus);
            clearInterval(statusCheckInterval);
        };
    }, [user._id, currentUserId, chat?._id, socketRef.current]);

    useEffect(() => {
        if (!socketRef.current || !chat?._id) return;

        // Hàm xử lý sự kiện người dùng đang nhập
        const handleTyping = ({ userId }: { userId: string }) => {
            console.log('User typing event received:', userId, 'comparing with:', user._id);
            if (userId === user._id) {
                console.log('Setting typing indicator to true');
                setOtherTyping(true);
            }
        };

        // Hàm xử lý sự kiện người dùng ngừng nhập
        const handleStopTyping = ({ userId }: { userId: string }) => {
            console.log('User stop typing event received:', userId, 'comparing with:', user._id);
            if (userId === user._id) {
                console.log('Setting typing indicator to false');
                setOtherTyping(false);
            }
        };

        // Thiết lập các listeners
        socketRef.current.on('userTyping', handleTyping);
        socketRef.current.on('userStopTyping', handleStopTyping);

        return () => {
            socketRef.current.off('userTyping', handleTyping);
            socketRef.current.off('userStopTyping', handleStopTyping);
        };
    }, [user._id, chat?._id, socketRef.current]);

    const handleInputChange = (text: string) => {
        setInput(text);
        // Chỉ gửi typing event khi thực sự đang nhập (text không rỗng)
        if (socketRef.current && chat && chat._id && currentUserId && text.trim() !== '') {
            console.log('Emitting typing event for user', currentUserId, 'in chat', chat._id);
            socketRef.current.emit('typing', { chatId: chat._id, userId: currentUserId });

            // Thiết lập timeout để gửi sự kiện stopTyping
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }

            typingTimeout.current = setTimeout(() => {
                if (socketRef.current && chat && chat._id && currentUserId) {
                    console.log('Emitting stop typing event for user', currentUserId);
                    socketRef.current.emit('stopTyping', { chatId: chat._id, userId: currentUserId });
                }
            }, 3000); // Tăng thời gian lên 3 giây để giảm số lượng event và tránh hiệu ứng nhấp nháy
        }
        // Nếu input rỗng thì ngừng typing ngay lập tức
        else if (socketRef.current && chat && chat._id && currentUserId && text.trim() === '') {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            socketRef.current.emit('stopTyping', { chatId: chat._id, userId: currentUserId });
        }
    };

    // Hàm upload file/ảnh lên server
    const uploadAttachment = async (file: any, type: 'image' | 'file') => {
        if (!chat) return;
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();
        formData.append('chatId', chat._id);
        if (type === 'image') {
            formData.append('file', {
                uri: file.uri,
                name: file.fileName || file.name || 'image.jpg',
                type: file.mimeType || file.type || 'image/jpeg',
            } as any);
        } else {
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            } as any);
        }
        try {
            const res = await fetch(`${apiUrl}/api/chats/upload-attachment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });
            const newMessage = await res.json();
            if (newMessage && newMessage._id) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể gửi file/ảnh.');
        }
    };

    // Hàm chọn/chụp ảnh với ActionSheet
    const handleImageAction = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Chụp ảnh', 'Chọn từ thư viện', 'Hủy'],
                cancelButtonIndex: 2,
            },
            async (buttonIndex) => {
                if (buttonIndex === 0) {
                    // Chụp ảnh
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 1,
                    });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                        setImagesToSend(prev => [...prev, ...result.assets]);
                    }
                } else if (buttonIndex === 1) {
                    // Chọn từ thư viện (cho phép nhiều ảnh)
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsMultipleSelection: true,
                        quality: 1,
                    });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                        setImagesToSend(prev => [...prev, ...result.assets]);
                    }
                }
            }
        );
    };
    // Xóa ảnh khỏi preview
    const removeImage = (idx: number) => {
        setImagesToSend(prev => prev.filter((_, i) => i !== idx));
    };
    // Sửa hàm gửi ảnh để gửi nhiều ảnh cùng lúc
    const handleSend = async () => {
        if (imagesToSend.length > 0) {
            // Nếu có nhiều hơn 6 ảnh, chia thành nhiều nhóm mỗi nhóm 6 ảnh
            if (imagesToSend.length > 6) {
                // Chia nhỏ mảng ảnh thành các nhóm 6 ảnh
                const imageGroups = [];
                for (let i = 0; i < imagesToSend.length; i += 6) {
                    imageGroups.push(imagesToSend.slice(i, i + 6));
                }

                // Gửi từng nhóm ảnh
                for (const group of imageGroups) {
                    if (group.length === 1) {
                        await uploadAttachment(group[0], 'image');
                    } else {
                        await uploadMultipleImages(group);
                    }
                }
            } else {
                // Số ảnh <= 6, xử lý như trước
                if (imagesToSend.length === 1) {
                    await uploadAttachment(imagesToSend[0], 'image');
                } else {
                    await uploadMultipleImages(imagesToSend);
                }
            }
            setImagesToSend([]);
        }

        if (input.trim() && chat) {
            await sendMessage();
        }
    };

    // Thêm hàm mới để upload nhiều ảnh
    const uploadMultipleImages = async (images: any[]) => {
        if (!chat) return;
        const token = await AsyncStorage.getItem('token');

        try {
            // Chuẩn bị form data với nhiều ảnh
            const formData = new FormData();
            formData.append('chatId', chat._id);

            // Thêm nhiều file vào formData
            images.forEach((img, index) => {
                formData.append('files', {
                    uri: img.uri,
                    name: img.fileName || img.name || `image_${index}.jpg`,
                    type: img.mimeType || img.type || 'image/jpeg',
                } as any);
            });

            // Gửi request đến API mới (cần tạo ở backend)
            const res = await fetch(`${apiUrl}/api/chats/upload-multiple`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const newMessage = await res.json();
            if (newMessage && newMessage._id) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });
            }
        } catch (err) {
            console.error("Error uploading multiple images:", err);
            Alert.alert('Lỗi', 'Không thể gửi nhiều ảnh cùng lúc.');

            // Fallback: Nếu API mới không hoạt động, gửi từng ảnh một
            for (const img of images) {
                try {
                    await uploadAttachment(img, 'image');
                } catch (e) {
                    console.error("Error uploading single image in fallback:", e);
                }
            }
        }
    };

    // Hàm chọn file
    const handlePickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (!result.canceled) {
            await uploadAttachment(result, 'file');
        }
    };

    // Xử lý khi app chuyển từ background sang foreground
    useEffect(() => {
        let subscription: any;

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
                if (nextAppState === 'active' && isScreenActive && currentUserId && chat?._id) {
                    console.log('App has come to the foreground while in ChatDetail!');

                    // Đánh dấu tin nhắn là đã đọc khi quay lại từ background
                    const markAsRead = async () => {
                        const token = await AsyncStorage.getItem('token');
                        if (token) {
                            markMessagesAsRead(chat._id, currentUserId, token);
                        }
                    };
                    markAsRead();
                }
            });
        }

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [isScreenActive, currentUserId, chat?._id]);

    // Kiểm tra và cập nhật thông tin đầy đủ của chat
    useEffect(() => {
        const fetchFullChatInfo = async () => {
            if (!chat?._id || !currentUserId) return;

            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                // Lấy thông tin đầy đủ của chat bao gồm participants
                const response = await fetch(`${apiUrl}/api/chats/${chat._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const fullChatData = await response.json();
                    // Cập nhật thông tin chat với danh sách participants đầy đủ
                    setChat(fullChatData);
                    console.log('Fetched full chat info with participants:', fullChatData.participants);
                }
            } catch (error) {
                console.error('Error fetching full chat info:', error);
            }
        };

        fetchFullChatInfo();
    }, [chat?._id, currentUserId]);

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-[#f8f8f8]"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <SafeAreaView style={{ flex: 0 }}>
                <View className="flex-row items-center p-3 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigationProp.goBack()} className="mr-3">
                        <Text className="text-3xl text-primary">{'‹'}</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: getAvatar(user) }} className="w-12 h-12 rounded-full mr-3" />
                    <View>
                        <Text className="font-bold text-lg">{user.fullname}</Text>
                        <View className="flex-row items-center mt-1">
                            <View
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: isUserOnline(user._id) ? 'green' : '#bbb',
                                    marginRight: 4
                                }}
                            />
                            <Text
                                className={`text-xs ${isUserOnline(user._id) ? 'text-green-600' : 'text-gray-400'}`}
                            >
                                {isUserOnline(user._id) ? 'Đang hoạt động' : getFormattedLastSeen(user._id)}
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <Text>Đang tải tin nhắn...</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                            data={[...messages].reverse()}
                            inverted
                            keyExtractor={(item, index) => item._id || `message-${index}`}
                            ListHeaderComponent={() => (
                                // Hiển thị typing indicator như một tin nhắn đặc biệt
                                // Vì FlatList đã bị đảo ngược nên ListHeaderComponent thực tế ở dưới cùng
                                otherTyping ? (
                                    <View className="flex-row justify-start items-end mx-2 mt-4 mb-6">
                                        <View className="relative mr-1.5">
                                            <Image
                                                source={{ uri: getAvatar(user) }}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        </View>
                                        <View className="bg-gray-200 rounded-2xl py-2 px-4 flex-row items-center">
                                            <TypingIndicator />
                                        </View>
                                    </View>
                                ) : null
                            )}
                            style={{ flex: 1, marginBottom: bottomSheetHeight }}
                            renderItem={({ item, index }) => {
                                const isMe = currentUserId && item.sender._id === currentUserId;

                                // Xác định nếu tin nhắn tiếp theo cùng người gửi hay không
                                const nextIndex = index + 1;
                                const isNextSameSender = nextIndex < messages.length &&
                                    messages[messages.length - 1 - nextIndex]?.sender._id === item.sender._id;

                                // Hiển thị avatar của người **khác** chỉ ở tin nhắn đầu tiên trong chuỗi liên tiếp
                                // Lưu ý: Vì inverted nên cách xác định isLast thay đổi
                                let showAvatar = false;
                                if (!isMe) {
                                    // Với FlatList đảo ngược, tin nhắn cuối cùng trong một chuỗi
                                    // bây giờ sẽ là tin nhắn đầu tiên khi hiển thị
                                    const isLast = 
                                        index === 0 ||
                                        (index < messages.length - 1 && messages[messages.length - 1 - (index + 1)].sender._id !== item.sender._id);
                                    showAvatar = isLast;
                                }

                                // Hiển thị nội dung tin nhắn
                                let messageContent = null;
                                let isMediaContent = false;

                                if (item.fileUrls && item.fileUrls.length > 0) {
                                    // Đây là tin nhắn hình ảnh nhiều ảnh
                                    isMediaContent = true;
                                    const imageUrls = item.fileUrls.map((url: string) => ({ uri: apiUrl + url }));
                                    messageContent = (
                                        <ImageGrid
                                            images={imageUrls.map((img: { uri: string }) => img.uri)}
                                            onPress={(index) => {
                                                setViewerImages(imageUrls);
                                                setViewerInitialIndex(index);
                                                setViewerVisible(true);
                                            }}
                                        />
                                    );
                                } else if (item.type === 'image' && item.fileUrl) {
                                    // Đây là tin nhắn hình ảnh một ảnh
                                    isMediaContent = true;
                                    messageContent = (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setViewerImages([{ uri: apiUrl + item.fileUrl }]);
                                                setViewerInitialIndex(0);
                                                setViewerVisible(true);
                                            }}
                                        >
                                            <Image
                                                source={{ uri: apiUrl + item.fileUrl }}
                                                style={{ width: 180, height: 180, borderRadius: 12 }}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    );
                                } else if (item.type === 'file' && item.fileUrl) {
                                    messageContent = (
                                        <TouchableOpacity onPress={() => Linking.openURL(apiUrl + item.fileUrl)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name="attach-file" size={22} color="#002855" />
                                            <Text style={{ color: '#002855', textDecorationLine: 'underline', marginLeft: 4 }} numberOfLines={1}>{item.content}</Text>
                                        </TouchableOpacity>
                                    );
                                } else {
                                    messageContent = (
                                        <Text className={`${isMe ? 'text-white' : 'text-gray-800'} text-base`}>
                                            {item.content}
                                        </Text>
                                    );
                                }

                                return (
                                    <View
                                        key={`msg-${item._id || index}`}
                                        className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} items-end mx-2`}
                                        style={{
                                            marginTop: 2,
                                            marginBottom: isNextSameSender ? 2 : 8
                                        }}
                                    >
                                        {/* Avatar (only for other user) → show on first bubble in a sequence when using inverted FlatList,
                                otherwise render placeholder to keep left indent constant */}
                                        {!isMe && (
                                            showAvatar ? (
                                                <View className="relative mr-1.5">
                                                    <Image
                                                        source={{ uri: getAvatar(item.sender) }}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                </View>
                                            ) : (
                                                // placeholder so earlier bubbles align with avatar space
                                                <View className="w-8 mr-1.5" />
                                            )
                                        )}

                                        <View style={{ maxWidth: '75%' }}>
                                            {isMediaContent ? (
                                                <View>
                                                    {messageContent}
                                                    {/* Timestamp và status bên dưới ảnh */}
                                                    <View style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                        marginTop: 4,
                                                        opacity: 0.8
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 10,
                                                            color: '#666666',
                                                            marginRight: isMe ? 4 : 0
                                                        }}>
                                                            {formatMessageTime(item.createdAt)}
                                                        </Text>

                                                        {isMe && <MessageStatus message={item} currentUserId={currentUserId} chat={chat} />}
                                                    </View>
                                                </View>
                                            ) : (
                                                    <View
                                                        className={`${isMe ? 'bg-[#002855]' : 'bg-gray-200'} rounded-2xl py-2 px-3.5`}
                                                    >
                                                        {messageContent}

                                                    {/* Timestamp và status bên trong bubble */}
                                                    <View style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-end',
                                                        marginTop: 4,
                                                        opacity: 0.8
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 10,
                                                            color: isMe ? '#ffffff' : '#666666',
                                                            marginRight: isMe ? 4 : 0
                                                        }}>
                                                            {formatMessageTime(item.createdAt)}
                                                        </Text>

                                                        {isMe && <MessageStatus message={item} currentUserId={currentUserId} chat={chat} />}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                        {isMe && <View className="w-8" />}
                                    </View>
                                );
                            }}
                        contentContainerStyle={{
                            paddingVertical: 10,
                            paddingBottom: 10
                        }}
                    />
                )}
            </View>

            {/* Bottom chat input container */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderColor: '#e5e5e5',
                    zIndex: 100,
                    paddingHorizontal: 12,
                    paddingTop: 8,
                    height: imagesToSend.length > 0 ? bottomSheetHeight + 80 : bottomSheetHeight
                }}
            >
                {/* Preview ảnh đã chọn */}
                {imagesToSend.length > 0 && (
                    <View style={{ height: 70, marginBottom: 10 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ alignItems: 'center' }}
                        >
                            {imagesToSend.map((img, idx) => (
                                <View key={idx} style={{ position: 'relative', marginRight: 8 }}>
                                    <Image source={{ uri: img.uri }} style={{ width: 56, height: 56, borderRadius: 8 }} />
                                    <TouchableOpacity
                                        onPress={() => removeImage(idx)}
                                        style={{
                                            position: 'absolute',
                                            top: -5,
                                            right: -5,
                                            backgroundColor: '#fff',
                                            borderRadius: 10,
                                            padding: 2,
                                            elevation: 2,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 1
                                        }}
                                    >
                                        <MaterialIcons name="close" size={16} color="#002855" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    minHeight: 44,
                }}>
                    <TouchableOpacity style={{ marginRight: 10 }}>
                        <FontAwesome name="smile-o" size={22} color="#002855" />
                    </TouchableOpacity>

                    <TextInput
                        value={input}
                        onChangeText={handleInputChange}
                        placeholder="Nhập tin nhắn..."
                        style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#002855',
                            paddingVertical: 0,
                            minHeight: 24
                        }}
                        multiline={false}
                        autoFocus={false}
                    />

                    {/* Hiển thị nút chọn hình ảnh và file chỉ khi không đang typing */}
                    {!input.trim() && (
                        <>
                            <TouchableOpacity style={{ marginHorizontal: 10 }} onPress={handleImageAction}>
                                <Ionicons name="image-outline" size={24} color="#002855" />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: 4 }} onPress={handlePickFile}>
                                <MaterialIcons name="attach-file" size={24} color="#002855" />
                            </TouchableOpacity>
                        </>
                    )}

                    {(input.trim() !== '' || imagesToSend.length > 0) && (
                        <TouchableOpacity onPress={handleSend} style={{ marginLeft: 12 }}>
                            <Ionicons name="send" size={24} color="#002855" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Thêm component ImageViewer vào render */}
            <ImageViewing
                images={viewerImages}
                imageIndex={viewerInitialIndex}
                visible={viewerVisible}
                onRequestClose={() => setViewerVisible(false)}
                swipeToCloseEnabled={true}
                doubleTapToZoomEnabled={true}
                presentationStyle="fullScreen"
                animationType="fade"
                backgroundColor="rgba(0, 0, 0, 0.95)"
                HeaderComponent={({ imageIndex }) => (
                    <View style={{
                        padding: 16,
                        paddingTop: Platform.OS === 'ios' ? 50 : 16,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}>
                        <TouchableOpacity onPress={() => setViewerVisible(false)} style={{ padding: 8 }}>
                            <Text style={{ color: 'white', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 16 }}>{imageIndex + 1}/{viewerImages.length}</Text>
                    </View>
                )}
            />
        </KeyboardAvoidingView>
    );
};

export default ChatDetailScreen;