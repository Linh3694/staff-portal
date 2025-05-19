import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, SafeAreaView, Linking, Alert, ActionSheetIOS, ScrollView, Dimensions, Modal, StatusBar, PanResponder, GestureResponderEvent, Keyboard, ImageBackground, Animated, Pressable, Clipboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { User } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { Video, ResizeMode } from 'expo-av';
import ImageViewing from 'react-native-image-viewing';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from '../../config/constants';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MessageReactionModal from './Component/MessageReactionModal';
import PinnedMessageBanner from './Component/PinnedMessageBanner';
import NotificationModal from '../../components/NotificationModal';
import { Message, Chat, CustomEmoji, ChatDetailParams, MessageReaction, NotificationType } from '../../types/chat';
import ImageGrid from './Component/ImageGrid';
import MessageBubble from './Component/MessageBubble';

const getAvatar = (user: User) => {
    if (user.avatarUrl) {
        return `${API_BASE_URL}/uploads/Avatar/${user.avatarUrl}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}`;
};

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

const formatMessageTime = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    // Format giờ (HH:MM)
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const formatMessageDate = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    const now = new Date();

    // Format ngày tháng
    const day = messageDate.getDate().toString().padStart(2, '0');
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');

    if (messageDate.toDateString() === now.toDateString()) {
        return `Hôm nay, ${day} tháng ${month}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
        return `Hôm qua, ${day} tháng ${month}`;
    }

    const diff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `${days[messageDate.getDay()]}, ${day} tháng ${month}`;
    }

    // Hiển thị ngày đầy đủ
    return `Thứ ${messageDate.getDay() + 1}, ${day} tháng ${month}`;
};

// Kiểm tra 2 tin nhắn có khác ngày không
const isDifferentDay = (timestamp1: string, timestamp2: string): boolean => {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return date1.toDateString() !== date2.toDateString();
};

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
        return <MaterialCommunityIcons name="check" size={12} color="#757575" />;
    }

    // Lấy danh sách người tham gia trừ người gửi
    const otherParticipants = chat.participants
        .filter(user => user._id !== currentUserId)
        .map(user => user._id);

    console.log('Other participants:', otherParticipants);

    // Nếu không có người tham gia khác
    if (otherParticipants.length === 0) {
        return <MaterialCommunityIcons name="check" size={14} color="#757575" />;
    }

    // Đảm bảo readBy là một mảng
    const readByArray = Array.isArray(message.readBy) ? [...message.readBy] : [];

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
        return <MaterialCommunityIcons name="check-all" size={14} color="#757575" fontWeight="bold" />;
    }

    // Nếu có người đã đọc nhưng không phải tất cả - hiển thị tick xanh nhạt
    if (readByOthers.length > 0) {
        return <MaterialCommunityIcons name="check-all" size={14} color="#757575" />;
    }

    // Mặc định là đã gửi - hiển thị một tick xám
    return <MaterialCommunityIcons name="check" size={14} color="#757575" />;
};

// Thêm hàm kiểm tra một chuỗi có phải là một emoji duy nhất không
const isSingleEmoji = (str: string): boolean => {
    // Regex đơn giản kiểm tra chuỗi kí tự đơn
    return str.length <= 2;
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
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showReactionModal, setShowReactionModal] = useState(false);
    const [reactionModalPosition, setReactionModalPosition] = useState<{ x: number, y: number } | null>(null);
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messageScaleAnim = useRef(new Animated.Value(1)).current;
    const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    // Thêm state cho tính năng ghim tin nhắn
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{
        visible: boolean;
        type: 'success' | 'error';
        message: string;
    }>({
        visible: false,
        type: 'success',
        message: ''
    });

    // Focus & blur handlers for tracking when screen is active/inactive
    useEffect(() => {
        const unsubscribeFocus = navigation.addListener('focus', () => {
            console.log('ChatDetail screen focused');
            setIsScreenActive(true);

            // Mark messages as read when screen comes into focus
            if (currentUserId && chatIdRef.current) {
                const fetchToken = async () => {
                    const token = await AsyncStorage.getItem('authToken');
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
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    const userId = decoded._id || decoded.id;
                    if (userId) {
                        setCurrentUserId(userId);
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
        if (!currentUserId) return; // Chưa có userId thì không fetch
        const fetchData = async () => {
            setLoading(true);
            const authToken = await AsyncStorage.getItem('authToken');
            if (!authToken) {
                setLoading(false);
                return;
            }

            try {
                // Hàm lấy tin nhắn đã ghim
                const fetchPinnedMessages = async (chatId: string) => {
                    try {
                        const pinnedRes = await fetch(`${API_BASE_URL}/api/chats/${chatId}/pinned-messages`, {
                            headers: { Authorization: `Bearer ${authToken}` },
                        });
                        const pinnedData = await pinnedRes.json();
                        if (Array.isArray(pinnedData)) {
                            setPinnedMessages(pinnedData);
                        }
                    } catch (error) {
                        console.error('Lỗi khi lấy tin nhắn đã ghim:', error);
                    }
                };

                if (!authToken) return;

                if (routeChatId) {
                    // Nếu đã có chatId, lấy thông tin chat và tin nhắn
                    const chatRes = await fetch(`${API_BASE_URL}/api/chats/${routeChatId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    const chatData = await chatRes.json();
                    setChat(chatData);

                    // Lưu chatId vào ref
                    chatIdRef.current = routeChatId;

                    // Lấy tin nhắn đã ghim
                    await fetchPinnedMessages(routeChatId);

                    // Lấy tin nhắn
                    const msgRes = await fetch(`${API_BASE_URL}/api/chats/messages/${routeChatId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
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
                            markMessagesAsRead(routeChatId, currentUserId, authToken);
                        }
                    }

                    // Thiết lập Socket.IO
                    setupSocket(authToken, routeChatId);
                } else {
                    // Tạo chat mới nếu không có sẵn chatId
                    const res = await fetch(`${API_BASE_URL}/api/chats/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${authToken}`,
                        },
                        body: JSON.stringify({ participantId: user._id }),
                    });
                    const chatData = await res.json();
                    setChat(chatData);

                    // Lưu chatId vào ref
                    chatIdRef.current = chatData._id;

                    // Lấy tin nhắn đã ghim
                    await fetchPinnedMessages(chatData._id);

                    // Lấy tin nhắn
                    const msgRes = await fetch(`${API_BASE_URL}/api/chats/messages/${chatData._id}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
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
                            markMessagesAsRead(chatData._id, currentUserId, authToken);
                        }
                    }

                    // Thiết lập Socket.IO
                    setupSocket(authToken, chatData._id);
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
            const response = await fetch(`${API_BASE_URL}/api/chats/read-all/${chatId}`, {
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

    const setupSocket = async (authToken: string | null, chatId: string) => {
        if (!authToken) return;

        // Dọn dẹp socket cũ nếu có
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Kết nối Socket.IO với token
        socketRef.current = io(API_BASE_URL, {
            query: { token: authToken },
            transports: ['websocket']
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected');

            // Tham gia phòng chat
            socketRef.current.emit('joinChat', chatId);

            // Đánh dấu tin nhắn là đã đọc khi kết nối thành công
            if (currentUserId) {
                markMessagesAsRead(chatId, currentUserId, authToken);
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
                    markMessagesAsRead(chatId, currentUserId, authToken);
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
                            const token = await AsyncStorage.getItem('authToken');
                            if (!token) return;

                            const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
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


    // Component bảng chọn emoji
    const EmojiPicker = () => {
        // Nhóm emoji theo category
        const groupedEmojis = customEmojis.reduce((acc: Record<string, CustomEmoji[]>, emoji) => {
            if (!acc[emoji.category]) {
                acc[emoji.category] = [];
            }
            acc[emoji.category].push(emoji);
            return acc;
        }, {});

        return (
            <View style={{
                height: 250,
                borderTopWidth: 1,
                borderTopColor: '#E0E0E0',
                width: '100%'
            }}>

                <ScrollView>
                    {Object.entries(groupedEmojis).map(([category, emojis]) => (
                        <View key={category} style={{ marginBottom: 10 }}>
                            <Text style={{
                                padding: 10,
                                fontWeight: 'bold',
                                color: '#666'
                            }}>
                                Emoji hiện có
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                paddingHorizontal: 5
                            }}>
                                {emojis.map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji._id}
                                        style={{
                                            width: 60,
                                            height: 60,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            margin: 5
                                        }}
                                        onPress={() => {
                                            console.log('Đã chọn emoji:', emoji.name, 'code:', emoji.code, 'type:', emoji.type);
                                            // Gửi emoji này dưới dạng sticker
                                            handleSendEmoji(emoji);
                                            // Đóng bảng emoji sau khi chọn
                                            setShowEmojiPicker(false);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: `${API_BASE_URL}${emoji.url}` }}
                                            style={{ width: 48, height: 48 }}
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    // Sửa hàm send message để phát hiện tin nhắn chỉ có emoji duy nhất
    const sendMessage = async () => {
        if (!input.trim() || !chat) return;
        const token = await AsyncStorage.getItem('authToken');

        // Xử lý nội dung tin nhắn, thay thế mã emoji tùy chỉnh nếu có
        let content = input.trim();
        const emojiPattern = /\[(.*?)\]/g;
        const matches = content.match(emojiPattern);

        if (matches) {
            matches.forEach(match => {
                const emojiName = match.slice(1, -1); // Loại bỏ dấu [ và ]
                const emoji = customEmojis.find(e => e.name === emojiName);
                if (emoji) {
                    content = content.replace(match, emoji.code);
                }
            });
        }

        // Kiểm tra xem đây có phải là một emoji duy nhất không
        const isEmojiOnly = isSingleEmoji(content);

        // Xóa input trước để UI phản hồi nhanh hơn
        setInput('');

        // Xóa replyTo sau khi gửi
        const replyToMessage = replyTo;
        setReplyTo(null);

        try {
            // Nếu là tin nhắn reply, sử dụng API khác
            let url = `${API_BASE_URL}/api/chats/message`;
            let body: any = {
                chatId: chat._id,
                content,
                type: 'text',
                isEmoji: isEmojiOnly,
            };

            // Nếu đang reply tin nhắn
            if (replyToMessage) {
                url = `${API_BASE_URL}/api/chats/message/reply`;
                body = {
                    ...body,
                    replyToId: replyToMessage._id
                };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
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
            // Khôi phục replyTo nếu bị lỗi
            setReplyTo(replyToMessage);
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
        const token = await AsyncStorage.getItem('authToken');
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
            const res = await fetch(`${API_BASE_URL}/api/chats/upload-attachment`, {
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
                    // Chụp ảnh - kiểm tra quyền trước
                    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                    if (cameraStatus !== 'granted') {
                        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera để chụp ảnh.');
                        return;
                    }

                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 1,
                        allowsEditing: true,
                    });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                        setImagesToSend(prev => [...prev, ...result.assets]);
                    }
                } else if (buttonIndex === 1) {
                    // Chọn từ thư viện - kiểm tra quyền trước
                    const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (libStatus !== 'granted') {
                        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
                        return;
                    }

                    // Chọn từ thư viện (cho phép nhiều ảnh)
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsMultipleSelection: true,
                        quality: 1,
                        allowsEditing: false,
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
        const token = await AsyncStorage.getItem('authToken');

        try {
            console.log('Preparing to upload multiple images:', images.length);
            const formData = new FormData();
            formData.append('chatId', chat._id);
            formData.append('type', 'multiple-images'); // Thêm type để server biết đây là tin nhắn nhiều ảnh

            // Thêm nhiều file vào formData
            images.forEach((img, index) => {
                const fileInfo = {
                    uri: img.uri,
                    name: img.fileName || img.name || `image_${index}.jpg`,
                    type: img.mimeType || img.type || 'image/jpeg',
                };
                console.log(`Adding image ${index} to formData:`, fileInfo);
                formData.append('files', fileInfo as any);
            });

            console.log('Sending request to upload-multiple endpoint');
            const res = await fetch(`${API_BASE_URL}/api/chats/upload-multiple`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const newMessage = await res.json();
            console.log('Server response for multiple images upload:', newMessage);

            if (newMessage && newMessage._id) {
                console.log('New multiple images message has ID:', newMessage._id);
                console.log('Message type:', newMessage.type);
                console.log('FileUrls:', newMessage.fileUrls);

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });
            }
        } catch (err) {
            console.error("Error uploading multiple images:", err);
            Alert.alert('Lỗi', 'Không thể gửi nhiều ảnh cùng lúc.');
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
                        const token = await AsyncStorage.getItem('authToken');
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
                const token = await AsyncStorage.getItem('authToken');
                if (!token) return;

                // Lấy thông tin đầy đủ của chat bao gồm participants
                const response = await fetch(`${API_BASE_URL}/api/chats/${chat._id}`, {
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

    // Listen for keyboard events
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        
        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    // Hàm xử lý khi bắt đầu nhấn giữ tin nhắn
    const handleMessageLongPressIn = (message: Message, event: GestureResponderEvent) => {
        // Bắt đầu đếm thời gian nhấn giữ
        longPressTimeoutRef.current = setTimeout(() => {
            setSelectedMessage(message);
            // Lưu vị trí để hiển thị modal
            setReactionModalPosition({
                x: event.nativeEvent.pageX,
                y: event.nativeEvent.pageY
            });

            // Hiệu ứng phóng to tin nhắn
            Animated.sequence([
                Animated.timing(messageScaleAnim, {
                    toValue: 1.05,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(messageScaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true
                })
            ]).start();

            // Hiển thị modal reaction
            setShowReactionModal(true);
        }, 500); // Thời gian nhấn giữ (500ms = 0.5 giây)
    };

    // Hàm xử lý khi kết thúc nhấn giữ tin nhắn
    const handleMessageLongPressOut = () => {
        // Xóa timeout nếu người dùng nhả tay ra trước khi đủ thời gian
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    };

    // Thêm hàm refreshMessages
    const refreshMessages = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!chat?._id || !token) return;

            const msgRes = await fetch(`${API_BASE_URL}/api/chats/messages/${chat._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const msgData = await msgRes.json();
            if (Array.isArray(msgData)) {
                const sortedMessages = [...msgData].sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                setMessages(sortedMessages);
            }
        } catch (error) {
            console.error('Lỗi khi refresh tin nhắn:', error);
        }
    };

    // Sửa lại hàm handleReactionSelect
    const handleReactionSelect = async (reaction: { code: string; isCustom: boolean }) => {
        if (!selectedMessage) return false;

        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/chats/message/${selectedMessage._id}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    emojiCode: reaction.code,
                    isCustom: reaction.isCustom
                })
            });

            if (response.ok) {
                console.log('Đã thêm reaction thành công');
                return true;
            } else {
                console.error('Lỗi khi thêm reaction');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi gửi reaction:', error);
            return false;
        }
    };

    // Đóng modal reaction
    const closeReactionModal = () => {
        setShowReactionModal(false);
        setSelectedMessage(null);
        setReactionModalPosition(null);
    };

    // Trong component Message hiển thị tin nhắn và reaction
    const renderReaction = (reaction: { emojiCode: string, isCustom: boolean }) => {
        if (!reaction.isCustom) {
            // Unicode emoji (nếu còn dùng)
            return <Text>{reaction.emojiCode}</Text>;
        } else {
            // Custom emoji/GIF từ URL
            const emoji = customEmojis.find(e => e.code === reaction.emojiCode);
            if (!emoji) return null;

            return (
                <Image
                    source={{ uri: `${API_BASE_URL}${emoji.url}` }}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                />
            );
        }
    };

    // Thêm useEffect để lấy danh sách emoji
    useEffect(() => {
        const fetchEmojis = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/emoji/list`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                console.log('Đã lấy được', data.length, 'emoji từ server');

                // Log một số emoji đầu tiên để kiểm tra
                if (data.length > 0) {
                    const sampleEmojis = data.slice(0, 3).map((emoji: CustomEmoji) => ({
                        code: emoji.code,
                        name: emoji.name,
                        type: emoji.type
                    }));
                    console.log('Mẫu emoji:', sampleEmojis);
                }

                setCustomEmojis(data);
            } catch (error) {
                console.error('Lỗi khi lấy emoji:', error);
            }
        };

        fetchEmojis();

        // Lấy lại danh sách emoji sau mỗi 5 phút
        const refreshInterval = setInterval(fetchEmojis, 300000);

        return () => clearInterval(refreshInterval);
    }, []);

    // Sửa lại hàm xử lý action
    const handleActionSelect = (action: string) => {
        if (!selectedMessage) return;

        switch (action) {
            case 'reply':
                setReplyTo(selectedMessage);
                break;
            case 'copy':
                Clipboard.setString(selectedMessage.content);
                setNotification({
                    visible: true,
                    type: 'success',
                    message: 'Đã sao chép nội dung tin nhắn'
                });
                break;
            case 'pin':
                handlePinMessage(selectedMessage._id);
                break;
            case 'unpin':
                handleUnpinMessage(selectedMessage._id);
                break;
            default:
                console.log('Action chưa được xử lý:', action);
                break;
        }
    };

    // Thêm hàm để gửi emoji được chọn từ danh sách emoji
    const handleSendEmoji = async (emoji: CustomEmoji) => {
        if (!chat) return;
        const token = await AsyncStorage.getItem('authToken');

        try {
            console.log('Gửi emoji với thông tin:', {
                code: emoji.code,
                name: emoji.name,
                emojiType: emoji.type,
                url: emoji.url
            });

            const res = await fetch(`${API_BASE_URL}/api/chats/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    chatId: chat._id,
                    content: emoji.code,
                    type: 'text', // Phải sử dụng type hợp lệ theo schema tin nhắn
                    isEmoji: true, // Thêm trường để đánh dấu đây là emoji
                    emojiId: emoji._id,
                    emojiType: emoji.type, // Lưu type của emoji (gif) vào trường riêng
                    emojiName: emoji.name, // Thêm tên emoji
                    emojiUrl: emoji.url // Thêm URL của emoji
                }),
            });

            const newMessage = await res.json();
            console.log('Gửi emoji sticker:', newMessage);

            // Thêm tin nhắn vào state
            if (newMessage && newMessage._id) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    // Kiểm tra tin nhắn đã tồn tại chưa
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });
            }
        } catch (error) {
            console.error('Error sending emoji:', error);
        }
    };

    // Thêm hàm xử lý tin nhắn ghim
    const handlePinMessage = async (messageId: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/chats/message/${messageId}/pin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const pinnedMessage = await response.json();
                console.log('Đã ghim tin nhắn:', pinnedMessage);

                // Lấy lại toàn bộ danh sách tin nhắn đã ghim
                if (chatIdRef.current) {
                    const pinnedRes = await fetch(`${API_BASE_URL}/api/chats/${chatIdRef.current}/pinned-messages`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const pinnedData = await pinnedRes.json();
                    if (Array.isArray(pinnedData)) {
                        setPinnedMessages(pinnedData);
                    }
                }

                // Cập nhật trạng thái isPinned trong danh sách tin nhắn
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId ? { ...msg, isPinned: true, pinnedBy: currentUserId || undefined } : msg
                ));

                setNotification({
                    visible: true,
                    type: 'success',
                    message: 'Đã ghim tin nhắn'
                });
            } else {
                const error = await response.json();
                if (error.pinnedCount >= 3) {
                    setNotification({
                        visible: true,
                        type: 'error',
                        message: 'Đã đạt giới hạn tin nhắn ghim (tối đa 3 tin nhắn)'
                    });
                } else {
                    setNotification({
                        visible: true,
                        type: 'error',
                        message: error.message || 'Không thể ghim tin nhắn'
                    });
                }
            }
        } catch (error) {
            console.error('Lỗi khi ghim tin nhắn:', error);
            setNotification({
                visible: true,
                type: 'error',
                message: 'Không thể ghim tin nhắn'
            });
        }
    };

    // Hàm xử lý bỏ ghim tin nhắn
    const handleUnpinMessage = async (messageId: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/chats/message/${messageId}/pin`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                console.log('Đã bỏ ghim tin nhắn:', messageId);

                // Cập nhật trạng thái isPinned trong danh sách tin nhắn
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId ? { ...msg, isPinned: false, pinnedBy: undefined } : msg
                ));

                // Reload toàn bộ dữ liệu chat
                if (chatIdRef.current) {
                    try {
                        // Lấy lại danh sách tin nhắn đã ghim
                        const pinnedRes = await fetch(`${API_BASE_URL}/api/chats/${chatIdRef.current}/pinned-messages`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const pinnedData = await pinnedRes.json();
                        if (Array.isArray(pinnedData)) {
                            setPinnedMessages(pinnedData);
                        }

                        // Lấy lại toàn bộ tin nhắn
                        const msgRes = await fetch(`${API_BASE_URL}/api/chats/messages/${chatIdRef.current}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const msgData = await msgRes.json();
                        if (Array.isArray(msgData)) {
                            // Sắp xếp tin nhắn từ cũ đến mới
                            const sortedMessages = [...msgData].sort((a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            );
                            setMessages(sortedMessages);
                        }
                    } catch (reloadError) {
                        console.error('Lỗi khi reload dữ liệu sau khi bỏ ghim:', reloadError);
                    }
                }

                setNotification({
                    visible: true,
                    type: 'success',
                    message: 'Đã bỏ ghim tin nhắn'
                });
            } else {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: 'Không thể bỏ ghim tin nhắn'
                });
            }
        } catch (error) {
            console.error('Lỗi khi bỏ ghim tin nhắn:', error);
            setNotification({
                visible: true,
                type: 'error',
                message: 'Không thể bỏ ghim tin nhắn'
            });
        }
    };

    // Thêm component ReplyPreview để hiển thị preview tin nhắn đang trả lời
    const ReplyPreview = ({ message, onCancel }: { message: Message | null, onCancel: () => void }) => {
        if (!message) return null;

        const isImage = message.type === 'image' || message.type === 'multiple-images';
        const isFile = message.type === 'file';

        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 10,
                paddingHorizontal: 16,
                marginBottom: -8,
                overflow: 'hidden', // Thêm overflow hidden để BlurView không tràn ra ngoài
                position: 'relative' // Thêm position relative để BlurView có thể absolute bên trong
            }}>
                {/* Thêm BlurView */}
                <BlurView
                    intensity={8}
                    tint="default"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                    }}
                />

                <View style={{
                    width: 3,
                    height: 40,
                    marginRight: 8,
                    borderRadius: 3
                }} />

                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#3F4246', fontFamily: 'Mulish-SemiBold', fontSize: 14 }}>
                        Trả lời {message.sender.fullname}
                    </Text>

                    {isImage && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="image-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#666', fontSize: 14, fontFamily: 'Mulish-Regular' }} numberOfLines={1}>
                                Hình ảnh
                            </Text>
                        </View>
                    )}

                    {isFile && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="document-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#666', fontSize: 14, fontFamily: 'Mulish-Regular' }} numberOfLines={1}>
                                Tệp đính kèm
                            </Text>
                        </View>
                    )}

                    {!isImage && !isFile && (
                        <Text style={{ color: '#666', fontSize: 14, fontFamily: 'Mulish-Regular' }} numberOfLines={1}>
                            {message.content}
                        </Text>
                    )}
                </View>

                <TouchableOpacity onPress={onCancel} style={{ padding: 5 }}>
                    <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
            </View>
        );
    };

    // Component PinnedMessageBanner đã được chuyển vào file riêng

    // Thêm hàm xử lý nhấp vào tin nhắn ghim
    const handlePinnedMessagePress = (message: Message) => {
        // Tìm index của tin nhắn trong danh sách
        const messageIndex = messages.findIndex(msg => msg._id === message._id);
        if (messageIndex !== -1) {
            // Cuộn đến tin nhắn và highlight
            setHighlightedMessageId(message._id);

            // Cuộn đến vị trí tin nhắn (lưu ý FlatList đã bị đảo ngược)
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                    index: messages.length - 1 - messageIndex,
                    animated: true,
                    viewPosition: 0.5
                });
            }

            // Tắt highlight sau 2 giây
            setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2000);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require('../../assets/chat-background.png')}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior="padding"
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                        enabled
                    >
                        <View className="flex-row items-center p-3 border-gray-200">
                            <TouchableOpacity onPress={() => navigationProp.goBack()} className="mr-2">
                                <MaterialIcons name="arrow-back-ios" size={32} color="#009483" />
                            </TouchableOpacity>
                            <View style={{ position: 'relative', marginRight: 12 }}>
                                <Image
                                    source={{ uri: getAvatar(user) }}
                                    style={{ width: 48, height: 48, borderRadius: 24 }}
                                />
                                <View
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: 14,
                                        height: 14,
                                        borderRadius: 9999,
                                        backgroundColor: isUserOnline(user._id) ? 'green' : '#bbb',
                                        borderWidth: 2,
                                        borderColor: 'white',
                                    }}
                                />
                            </View>
                            <View style={{ justifyContent: 'center' }}>
                                <Text className="font-bold text-lg" style={{ marginBottom: 0 }}>{user.fullname}</Text>
                                <Text style={{ fontSize: 12, color: '#444', fontFamily: 'Inter', fontWeight: 'medium' }}>
                                    {isUserOnline(user._id) ? 'Đang hoạt động' : getFormattedLastSeen(user._id)}
                                </Text>
                            </View>
                        </View>

                        {/* Hiển thị banner tin nhắn ghim */}
                        {pinnedMessages.length > 0 && (
                            <PinnedMessageBanner
                                pinnedMessages={pinnedMessages}
                                onPress={handlePinnedMessagePress}
                                onUnpin={handleUnpinMessage}
                            />
                        )}

                        <View style={{ flex: 1 }}>
                            {loading ? (
                                <View className="flex-1 items-center justify-center">
                                    <Text style={{ fontFamily: 'Inter', fontWeight: 'medium' }}>Đang tải tin nhắn...</Text>
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
                                            <View className="flex-row justify-start items-end mx-2 mt-4 mb-1">
                                                <View className="relative mr-1.5">
                                                    <Image
                                                        source={{ uri: getAvatar(user) }}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                </View>
                                                <View className="bg-[#F5F5ED] rounded-2xl py-2 px-4 flex-row items-center">
                                                    <TypingIndicator />
                                                </View>
                                            </View>
                                        ) : null
                                    )}
                                    style={{ flex: 1 }}
                                    renderItem={({ item, index }) => {
                                        // Nếu là ảnh đang preview (chưa gửi), không render bubble
                                        if (!item._id) return null;

                                        const isMe = currentUserId && item.sender._id === currentUserId;
                                        const prevMsg = messages[messages.length - index] || {};
                                        const nextMsg = messages[messages.length - 1 - (index + 1)] || {};

                                        // Cùng người gửi?
                                        const isPrevSameSender = prevMsg?.sender?._id === item.sender._id;
                                        const isNextSameSender = nextMsg?.sender?._id === item.sender._id;

                                        // isFirst: trên cùng chuỗi (không cùng sender với tin nhắn phía trên)
                                        const isFirst = !isPrevSameSender;
                                        // isLast: dưới cùng chuỗi (không cùng sender với tin nhắn phía dưới)
                                        const isLast = !isNextSameSender;

                                        // Avatar chỉ hiện ở isFirst của chuỗi người nhận
                                        const showAvatar = !isMe && isFirst;

                                        return (
                                            <MessageBubble
                                                message={item}
                                                currentUserId={currentUserId}
                                                customEmojis={customEmojis}
                                                isFirst={isFirst}
                                                isLast={isLast}
                                                showAvatar={showAvatar}
                                                onLongPressIn={handleMessageLongPressIn}
                                                onLongPressOut={handleMessageLongPressOut}
                                                onImagePress={(images, index) => {
                                                    setViewerImages(images.map(uri => ({ uri })));
                                                    setViewerInitialIndex(index);
                                                    setViewerVisible(true);
                                                }}
                                                messageScaleAnim={messageScaleAnim}
                                                formatMessageTime={formatMessageTime}
                                                getAvatar={getAvatar}
                                                isLatestMessage={item._id === messages[messages.length - 1]?._id}
                                            />
                                        );
                                    }}
                                    contentContainerStyle={{
                                        paddingVertical: 10,
                                        paddingBottom: keyboardVisible ? 10 : (insets.bottom + 50),
                                    }}
                            />
                        )}
                    </View>

                    {/* Input chat */}
                    <View
                        style={{
                            borderRadius: 32,
                                paddingHorizontal: 6,
                            paddingVertical: 6,
                                backgroundColor: 'transparent',
                                width: '90%',
                                alignSelf: 'center',
                            minHeight: 40,
                            paddingBottom: Platform.OS === 'ios' ? 2 : (keyboardVisible ? 2 : insets.bottom),
                                marginBottom: 5,
                                overflow: 'hidden',
                        }}
                    >
                            {/* Màu nền tiêu chuẩn - hiển thị khi không có ảnh preview và không có reply */}
                            {!imagesToSend.length && !replyTo && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(245, 245, 237, 1)',
                                        borderRadius: 32,
                                        zIndex: 0,
                                    }}
                                />
                            )}

                            {/* BlurView - hiển thị khi có ảnh preview hoặc có reply */}
                            {(imagesToSend.length > 0 || replyTo) && (
                                <BlurView
                                    intensity={8}
                                    tint="default"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        borderRadius: 32,
                                        zIndex: 0,
                                    }}
                                />
                            )}

                            {/* Preview tin nhắn đang trả lời */}
                            {replyTo && (
                                <ReplyPreview message={replyTo} onCancel={() => setReplyTo(null)} />
                            )}

                        {/* Dòng preview ảnh (nếu có) */}
                        {imagesToSend.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{
                                    alignItems: 'center',
                                    marginBottom: 8,
                                    paddingVertical: 4
                                }}
                                    style={{ maxHeight: 64, zIndex: 2 }}
                            >
                                {imagesToSend.map((img, idx) => (
                                    <View key={idx} style={{ position: 'relative', marginRight: 8 }}>
                                        <Image source={{ uri: img.uri }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                                        <TouchableOpacity
                                            onPress={() => removeImage(idx)}
                                            style={{
                                                position: 'absolute',
                                                top: -5,
                                                right: -5,
                                                backgroundColor: '#fff',
                                                borderRadius: 10,
                                                padding: 2,
                                                zIndex: 3
                                            }}
                                        >
                                            <MaterialIcons name="close" size={16} color="#002855" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* Dòng chứa TextInput và các nút */}
                        <View style={{
                            flexDirection: 'row',
                                alignItems: 'center',
                            width: '100%',
                            minHeight: 44,
                                zIndex: 2,
                        }}>
                                {/* Nút camera (chụp ảnh) */}
                                <TouchableOpacity
                                    style={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: '#F05023',
                                        borderRadius: 20,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 10
                                    }}
                                    onPress={async () => {
                                        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                                        if (cameraStatus !== 'granted') {
                                            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera để chụp ảnh.');
                                            return;
                                        }

                                        const result = await ImagePicker.launchCameraAsync({
                                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                            quality: 1,
                                            allowsEditing: true,
                                        });
                                        if (!result.canceled && result.assets && result.assets.length > 0) {
                                            setImagesToSend(prev => [...prev, ...result.assets]);
                                        }
                                    }}
                                >
                                    <Ionicons name="camera" size={22} color="#fff" />
                            </TouchableOpacity>

                                {/* Input tin nhắn */}
                            <TextInput
                                value={input}
                                onChangeText={handleInputChange}
                                    placeholder="Nhập tin nhắn"
                                style={{
                                    flex: 1,
                                    fontSize: 16,
                                    color: '#002855',
                                    paddingVertical: 8,
                                    minHeight: 24,
                                    backgroundColor: 'transparent',
                                    fontFamily: 'Mulish-Regular',
                                }}
                                multiline={false}
                                autoFocus={false}
                                    onFocus={() => setShowEmojiPicker(false)}
                            />

                                {/* Container cho các nút bên phải */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {/* Các nút chỉ hiển thị khi không nhập text */}
                            {!input.trim() && (
                                <>
                                            {/* Nút emoji */}
                                            <TouchableOpacity
                                                style={{ marginHorizontal: 8 }}
                                                onPress={() => {
                                                    Keyboard.dismiss();
                                                    setShowEmojiPicker(prev => !prev);
                                                }}
                                            >
                                                <FontAwesome
                                                    name={showEmojiPicker ? "keyboard-o" : "smile-o"}
                                                    size={22}
                                                    color="#00687F"
                                                />
                                            </TouchableOpacity>

                                            {/* Nút chọn ảnh từ thư viện */}
                                            <TouchableOpacity
                                                style={{ marginHorizontal: 8 }}
                                                onPress={async () => {
                                                    const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                                                    if (libStatus !== 'granted') {
                                                        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
                                                        return;
                                                    }

                                                    // Chọn từ thư viện (cho phép nhiều ảnh)
                                                    const result = await ImagePicker.launchImageLibraryAsync({
                                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                        allowsMultipleSelection: true,
                                                        quality: 1,
                                                        allowsEditing: false,
                                                    });
                                                    if (!result.canceled && result.assets && result.assets.length > 0) {
                                                        setImagesToSend(prev => [...prev, ...result.assets]);
                                                    }
                                                }}
                                            >
                                                <Ionicons name="image-outline" size={24} color="#00687F" />
                                    </TouchableOpacity>

                                            {/* Nút đính kèm file */}
                                            <TouchableOpacity style={{ marginHorizontal: 8 }} onPress={handlePickFile}>
                                                <MaterialIcons name="attach-file" size={24} color="#00687F" />
                                    </TouchableOpacity>
                                </>
                            )}

                                    {/* Nút gửi chỉ hiển thị khi có text hoặc hình ảnh để gửi */}
                            {(input.trim() !== '' || imagesToSend.length > 0) && (
                                        <TouchableOpacity onPress={handleSend} style={{ marginLeft: 8 }}>
                                    <Ionicons name="send" size={24} color="#F05023" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                        </View>

                        {/* Emoji Picker */}
                        {showEmojiPicker && <EmojiPicker />}

                    </KeyboardAvoidingView >

            {/* Thêm component ImageViewer vào render */}
                    < ImageViewing
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
                            <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Inter', fontWeight: 'medium' }}>✕</Text>
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Inter', fontWeight: 'medium' }}>{imageIndex + 1}/{viewerImages.length}</Text>
                    </View>
                )}
            />

                    {/* Message Reaction Modal */}
                    <MessageReactionModal
                        visibleReactionBar={showReactionModal}
                        visibleActionBar={showReactionModal}
                        onCloseReactionBar={closeReactionModal}
                        onCloseActionBar={closeReactionModal}
                        position={reactionModalPosition}
                        onReactionSelect={handleReactionSelect}
                        onActionSelect={handleActionSelect}
                        selectedMessage={selectedMessage}
                        onSuccess={refreshMessages}
                    />


                </SafeAreaView >
            </ImageBackground >
            <NotificationModal
                visible={notification.visible}
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

export default ChatDetailScreen;