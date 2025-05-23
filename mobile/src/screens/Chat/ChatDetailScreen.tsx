import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, SafeAreaView, Linking, Alert, ActionSheetIOS, ScrollView, Dimensions, Modal, StatusBar, PanResponder, GestureResponderEvent, Keyboard, ImageBackground, Animated, Pressable, Clipboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
// Enable LayoutAnimation on Android

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
import { ROUTES } from '../../constants/routes';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MessageReactionModal from './Component/MessageReactionModal';
import PinnedMessageBanner from './Component/PinnedMessageBanner';
import NotificationModal from '../../components/NotificationModal';
import { Message, Chat } from '../../types/message';
import { NotificationType, ChatDetailParams } from '../../types/chat';
import { CustomEmoji } from './Hook/useEmojis';
import ImageGrid from './Component/ImageGrid';
import MessageBubble from './Component/MessageBubble';
import ImageViewerModal from './Component/ImageViewerModal';
import ForwardMessageSheet from './Component/ForwardMessageSheet';
import { formatMessageTime, formatMessageDate, getAvatar, isDifferentDay } from '../../utils/messageUtils';
import MessageStatus from './Component/MessageStatus';
import { getMessageGroupPosition } from '../../utils/messageGroupUtils';
import EmojiPicker from './Component/EmojiPicker';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


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

type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

// Thêm hàm kiểm tra một chuỗi có phải là một emoji duy nhất không
const isSingleEmoji = (str: string): boolean => {
    // Regex đơn giản kiểm tra chuỗi kí tự đơn
    return str.length <= 2;
};

const ChatDetailScreen = ({ route, navigation }: Props) => {
    const { user: chatPartner, chatId: routeChatId } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [page, setPage] = useState(1);
    const [isOnline, setIsOnline] = useState(false);
    const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
    const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
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
    const [showReactionModal, setShowReactionModal] = useState(false);
    const [reactionModalPosition, setReactionModalPosition] = useState<{ x: number, y: number } | null>(null);
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messageScaleAnim = useRef(new Animated.Value(1)).current;
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    // Thêm state cho tính năng ghim tin nhắn
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
    const [showForwardSheet, setShowForwardSheet] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Hàm lưu tin nhắn vào AsyncStorage
    const saveMessagesToStorage = async (chatId: string, messages: Message[]) => {
        try {
            const key = `chat_messages_${chatId}`;
            await AsyncStorage.setItem(key, JSON.stringify(messages));
            console.log('Saved messages to storage:', messages.length); // Thêm log
        } catch (error) {
            console.error('Error saving messages to storage:', error);
        }
    };

    // Hàm lấy tin nhắn từ AsyncStorage
    const loadMessagesFromStorage = async (chatId: string) => {
        try {
            const key = `chat_messages_${chatId}`;
            const stored = await AsyncStorage.getItem(key);
            console.log('Loading from storage, found data:', !!stored); // Thêm log
            if (stored) {
                const messages = JSON.parse(stored) as Message[];
                console.log('Loaded messages from storage:', messages.length); // Thêm log
                return messages;
            }
        } catch (error) {
            console.error('Error loading messages from storage:', error);
        }
        return [];
    };

    // Hàm load tin nhắn từ server
    const loadMessages = async (chatId: string, pageNum: number = 1, append: boolean = false) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            setIsLoadingMore(true);
            console.log('Loading messages for chat:', chatId);

            const response = await fetch(
                `${API_BASE_URL}/api/chats/messages/${chatId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);

                if (!Array.isArray(data)) {
                    console.error('Invalid response format:', data);
                    return;
                }

                // Sắp xếp tin nhắn theo thời gian
                const sortedMessages = data.sort(
                    (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                console.log('Sorted messages:', sortedMessages.length);

                setMessages(sortedMessages);
                setHasMoreMessages(false); // Tạm thời tắt load more

                // Lưu vào storage
                await saveMessagesToStorage(chatId, sortedMessages);
            } else {
                const errorText = await response.text();
                console.error('API Error:', errorText);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Xử lý load more khi scroll lên trên
    const handleLoadMore = () => {
        if (!isLoadingMore && hasMoreMessages && chat?._id) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadMessages(chat._id, nextPage, true);
        }
    };

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

                    // Lấy thông tin đầy đủ của current user từ API
                    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setCurrentUser(userData);
                        setCurrentUserId(userId);
                    }
                } catch (err) {
                    console.log('Error fetching current user:', err);
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
        if (!currentUserId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                if (!authToken) {
                    setLoading(false);
                    return;
                }

                if (routeChatId) {
                    console.log('Fetching chat data for:', routeChatId);

                    // Lấy thông tin chat
                    const chatRes = await fetch(`${API_BASE_URL}/api/chats/${routeChatId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });

                    if (!chatRes.ok) {
                        throw new Error('Failed to fetch chat data');
                    }

                    const chatData = await chatRes.json();
                    console.log('Chat data received:', chatData);
                    setChat(chatData);
                    chatIdRef.current = routeChatId;

                    // Load tin nhắn từ server
                    console.log('Loading messages from server');
                    await loadMessages(routeChatId);

                    // Lấy tin nhắn đã ghim
                    await fetchPinnedMessages(routeChatId);

                    // Thiết lập Socket.IO
                    setupSocket(authToken, routeChatId);
                }
            } catch (err) {
                console.error('Error in fetchData:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [chatPartner._id, routeChatId, currentUserId]);

    const markMessagesAsRead = async (chatId: string | null, userId: string, token: string) => {
        if (!chatId) return;

        try {
            const timestamp = new Date().toISOString();

            // Sử dụng API mới để đánh dấu tất cả tin nhắn đã đọc
            const response = await fetch(`${API_BASE_URL}/api/chats/read-all/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ timestamp })
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
                        chatId: chatId,
                        timestamp: timestamp
                    });
                }
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    // Socket.IO setup
    const setupSocket = async (authToken: string | null, chatId: string) => {
        if (!authToken) return;

        try {
            // Kết nối socket
            const socket = io(API_BASE_URL, {
                query: { token: authToken },
                transports: ['websocket']
            });

            socketRef.current = socket;

            // Join vào phòng chat
            socket.emit('joinChat', chatId);

            // Lắng nghe tin nhắn mới
            socket.on('receiveMessage', (newMessage: Message) => {
                console.log('Received new message:', newMessage);
                setMessages(prev => {
                    // Kiểm tra tin nhắn đã tồn tại chưa
                    const exists = prev.some(msg => msg._id === newMessage._id);
                    if (exists) return prev;

                    // Thêm tin nhắn mới và sắp xếp lại
                    const updatedMessages = [...prev, newMessage].sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );

                    // Lưu vào storage
                    saveMessagesToStorage(chatId, updatedMessages);
                    return updatedMessages;
                });
            });

            // Lắng nghe trạng thái đã đọc
            socket.on('messageRead', ({ userId, chatId: updatedChatId }) => {
                if (updatedChatId === chatId) {
                    setMessages(prev => prev.map(msg => ({
                        ...msg,
                        readBy: msg.readBy?.includes(userId) ? msg.readBy : [...(msg.readBy || []), userId]
                    })));
                }
            });

            // Lắng nghe trạng thái online/offline
            socket.on('userOnline', ({ userId }) => {
                if (chatPartner._id === userId) {
                    setIsOnline(true);
                }
            });

            socket.on('userOffline', ({ userId }) => {
                if (chatPartner._id === userId) {
                    setIsOnline(false);
                }
            });

            // Ping để duy trì kết nối
            const pingInterval = setInterval(() => {
                if (socket.connected) {
                    socket.emit('ping', { userId: currentUserId });
                }
            }, 30000);

            return () => {
                clearInterval(pingInterval);
                socket.disconnect();
            };
        } catch (error) {
            console.error('Socket setup error:', error);
        }
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
            console.log('User online event received:', userId, 'comparing with:', chatPartner._id);
            if (userId === chatPartner._id) {
                console.log('Setting other user to online');
            }
        };

        // Hàm xử lý sự kiện người dùng offline
        const handleUserOffline = ({ userId }: { userId: string }) => {
            console.log('User offline event received:', userId, 'comparing with:', chatPartner._id);
            if (userId === chatPartner._id) {
                console.log('Setting other user to offline');
                // Khi người dùng offline, đảm bảo trạng thái typing cũng bị reset
                setOtherTyping(false);
            }
        };

        // Xử lý sự kiện userStatus từ server
        const handleUserStatus = ({ userId, status }: { userId: string, status: string }) => {
            console.log('User status received:', userId, status, 'comparing with:', chatPartner._id);
            if (userId === chatPartner._id) {
                console.log('Setting other user status to:', status);
                // Khi người dùng offline, đảm bảo trạng thái typing cũng bị reset
                if (status === 'offline') {
                    setOtherTyping(false);
                }
            }
        };

        // Kiểm tra trạng thái online ngay khi kết nối
        console.log('Checking online status for user:', chatPartner._id);
        socketRef.current.emit('checkUserStatus', { userId: chatPartner._id });

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
                socketRef.current.emit('checkUserStatus', { userId: chatPartner._id });
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
    }, [chatPartner._id, currentUserId, chat?._id, socketRef.current]);

    useEffect(() => {
        if (!socketRef.current || !chat?._id) return;

        // Hàm xử lý sự kiện người dùng đang nhập
        const handleTyping = ({ userId }: { userId: string }) => {
            console.log('User typing event received:', userId, 'comparing with:', chatPartner._id);
            if (userId === chatPartner._id) {
                console.log('Setting typing indicator to true');
                setOtherTyping(true);
            }
        };

        // Hàm xử lý sự kiện người dùng ngừng nhập
        const handleStopTyping = ({ userId }: { userId: string }) => {
            console.log('User stop typing event received:', userId, 'comparing with:', chatPartner._id);
            if (userId === chatPartner._id) {
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
    }, [chatPartner._id, chat?._id, socketRef.current]);

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
                        quality: 0.7, // Giảm chất lượng xuống 70%
                        allowsEditing: false, // Bỏ tính năng crop
                        exif: true, // Giữ thông tin EXIF
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
                        quality: 0.7, // Giảm chất lượng xuống 70%
                        allowsEditing: false, // Bỏ tính năng crop
                        exif: true, // Giữ thông tin EXIF
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

    const forwardSingleMessage = async (toUserId: string) => {
        if (!forwardMessage) return;                 // forwardMessage đã lưu tin gốc
        const token = await AsyncStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_BASE_URL}/api/chats/message/forward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    messageId: forwardMessage._id,
                    toUserId
                })
            });
            const data = await res.json();

            // nếu forward tới chính phòng đang mở → chèn ngay vào UI
            if (data && chat && data.chat === chat._id) {
                setMessages(prev => [...prev, data]);
            }
        } catch (err) {
            console.error('Error forwarding message:', err);
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
            formData.append('type', 'multiple-images');

            // Chuyển đổi và thêm các ảnh vào formData
            await Promise.all(images.map(async (img, index) => {
                try {
                    // Chuyển đổi ảnh sang WebP
                    const webpUri = await convertToWebP(img.uri);

                    const fileInfo = {
                        uri: webpUri,
                        name: `image_${index}.webp`, // Đổi phần mở rộng thành .webp
                        type: 'image/webp', // Đổi kiểu MIME thành image/webp
                    };
                    console.log(`Adding WebP image ${index} to formData:`, fileInfo);
                    formData.append('files', fileInfo as any);
                } catch (error) {
                    console.error(`Error processing image ${index}:`, error);
                    // Nếu có lỗi, sử dụng ảnh gốc
                    const fileInfo = {
                        uri: img.uri,
                        name: img.fileName || img.name || `image_${index}.jpg`,
                        type: img.mimeType || img.type || 'image/jpeg',
                    };
                    formData.append('files', fileInfo as any);
                }
            }));

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
            const res = await fetch(
                `${API_BASE_URL}/api/chats/message/${selectedMessage._id}/react`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        emojiCode: reaction.code,
                        isCustom: reaction.isCustom,
                    }),
                }
            );
            if (!res.ok) {
                console.error('Failed to add reaction:', res.status);
                return false;
            }
            // Get updated message from server
            const updatedMessage: Message = await res.json();
            // Update local state to include new reactions
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                )
            );
            // Close the reaction modal
            closeReactionModal();
            return true;
        } catch (error) {
            console.error('Error sending reaction:', error);
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
        if (!selectedMessage?._id) return;

        switch (action) {
            case 'forward':
                setForwardMessage(selectedMessage);
                setShowForwardSheet(true);
                closeReactionModal();
                break;
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

        const isImage = message.type === 'image';
        const isMultipleImages = message.type === 'multiple-images';
        const isFile = message.type === 'file';
        const imageUrl = isImage ? (message.fileUrl?.startsWith('http') ? message.fileUrl : `${API_BASE_URL}${message.fileUrl}`) :
            isMultipleImages && message.fileUrls && message.fileUrls.length > 0 ? (message.fileUrls[0].startsWith('http') ? message.fileUrls[0] : `${API_BASE_URL}${message.fileUrls[0]}`) : null;

        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 10,
                paddingHorizontal: 16,
                marginBottom: -8,
                overflow: 'hidden',
                position: 'relative'
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

                {/* Thumbnail ảnh nếu là ảnh hoặc nhiều ảnh */}
                {(isImage || isMultipleImages) && imageUrl && (
                    <Image
                        source={{ uri: imageUrl }}
                        style={{ width: 36, height: 36, borderRadius: 8, marginRight: 8 }}
                        resizeMode="cover"
                    />
                )}

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
                    {isMultipleImages && message.fileUrls && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="images-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#666', fontSize: 14, fontFamily: 'Mulish-Regular' }} numberOfLines={1}>
                                {message.fileUrls.length} hình ảnh
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
                    {!isImage && !isMultipleImages && !isFile && (
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

    // Tạo mảng mới có cả message và time separator
    const messagesWithTime: any[] = [];
    for (let i = 0; i < messages.length; i++) {
        const item = messages[i];
        const prevMsg = messages[i - 1];
        const isPrevSameSender = prevMsg?.sender?._id === item.sender._id;
        const isDifferentDay = prevMsg?.createdAt && (new Date(item.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString());
        const timeGap = prevMsg?.createdAt ? (new Date(item.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) : null;
        const showTime = !prevMsg?.createdAt || isDifferentDay || (!!timeGap && timeGap > 10 * 60 * 1000);
        if (showTime) {
            messagesWithTime.push({
                type: 'time',
                time: item.createdAt,
                _id: `time-${item.createdAt}-${item._id}` // Thêm message ID vào key để đảm bảo unique
            });
        }
        messagesWithTime.push(item);
    }

    // FlatList sẽ hiển thị mảng đảo ngược (mới → cũ)
    const dataForFlatList = [...messagesWithTime].reverse();

    // Stable key extractor
    const keyExtractor = useCallback((item: Message | any) => {
        if (item.type === 'time') {
            return item._id;
        }
        return item._id;
    }, []);

    // Thêm hàm xử lý chuyển tiếp tin nhắn
    const handleForwardMessage = async (userId: string) => {
        if (!selectedMessage?._id) return; // Thêm check null/undefined

        try {
            const response = await fetch(`${API_BASE_URL}/api/messages/forward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    messageId: selectedMessage._id,
                    toUserId: userId,
                    fromUserId: currentUser?._id
                })
            });

            if (!response.ok) {
                throw new Error('Không thể chuyển tiếp tin nhắn');
            }

            return await response.json();
        } catch (error) {
            console.error('Lỗi khi chuyển tiếp tin nhắn:', error);
            throw error;
        }
    };

    const handleForwardToUser = async (userId: string) => {
        try {
            if (!selectedMessage || !currentUserId) return;

            const response = await fetch(`${API_BASE_URL}/api/messages/forward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    messageId: selectedMessage._id,
                    toUserId: userId,
                    fromUserId: currentUserId
                })
            });

            if (!response.ok) {
                throw new Error('Không thể chuyển tiếp tin nhắn');
            }

            setNotification({
                visible: true,
                type: 'success',
                message: 'Đã chuyển tiếp tin nhắn thành công'
            });
            setShowForwardSheet(false);
            setSelectedMessage(null);
        } catch (error) {
            console.error('Lỗi khi chuyển tiếp tin nhắn:', error);
            setNotification({
                visible: true,
                type: 'error',
                message: 'Không thể chuyển tiếp tin nhắn'
            });
        }
    };

    // Thêm hàm chuyển đổi ảnh sang WebP
    const convertToWebP = async (uri: string): Promise<string> => {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [], // Không thay đổi kích thước hoặc xoay ảnh
                {
                    compress: 0.7, // Nén ảnh với chất lượng 70%
                    format: ImageManipulator.SaveFormat.WEBP,
                }
            );
            return result.uri;
        } catch (error) {
            console.error('Lỗi khi chuyển đổi ảnh sang WebP:', error);
            return uri; // Trả về URI gốc nếu có lỗi
        }
    };

    // Hàm xử lý khi nhấn vào ảnh
    const handleImagePress = (images: string[], index: number) => {
        const processedImages = images.map(url => ({
            uri: url.startsWith('http') ? url : `${API_BASE_URL}${url}`
        }));
        setViewerImages(processedImages);
        setViewerInitialIndex(index);
        setViewerVisible(true);
    };

    // Memoized renderItem để FlatList không phải tái tạo hàm mỗi lần
    const renderItem = useCallback(
        ({ item, index }: { item: Message | any; index: number }) => {
            if (item.type === 'time') {
                // Giữ nguyên logic render time separator hiện tại
                const d = new Date(item.time);
                const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                const dayStr = days[d.getDay()];
                const dateStr = `${d.getDate()} Tháng ${d.getMonth() + 1}`;
                const hour = d.getHours().toString().padStart(2, '0');
                const min = d.getMinutes().toString().padStart(2, '0');
                return (
                    <View style={{ alignItems: 'center', marginVertical: 16 }}>
                        <Text style={{ color: '#BEBEBE', fontSize: 14, fontFamily: 'Mulish-Semibold' }}>
                            {`${dayStr}, ${dateStr}, lúc ${hour}:${min}`}
                        </Text>
                    </View>
                );
            }
            // Logic position grouping
            const { isFirst, isLast } = getMessageGroupPosition(dataForFlatList, index, isDifferentDay);
            const isMe = currentUserId && item.sender._id === currentUserId;
            const showAvatar = !isMe && isFirst;
            return (
                <MessageBubble
                    chat={chat}
                    message={item}
                    currentUserId={currentUserId}
                    customEmojis={customEmojis}
                    isFirst={isFirst}
                    isLast={isLast}
                    showAvatar={showAvatar}
                    onLongPressIn={handleMessageLongPressIn}
                    onLongPressOut={handleMessageLongPressOut}
                    onImagePress={handleImagePress}
                    messageScaleAnim={messageScaleAnim}
                    formatMessageTime={formatMessageTime}
                    getAvatar={getAvatar}
                    isLatestMessage={item._id === messages[messages.length - 1]?._id}
                />
            );
        },
        [
            chat, currentUserId, customEmojis, dataForFlatList,
            handleMessageLongPressIn, handleMessageLongPressOut,
            handleImagePress, messageScaleAnim, messages,
            formatMessageTime, getAvatar, isDifferentDay,
        ]
    );

    // Hàm lấy tin nhắn đã ghim
    const fetchPinnedMessages = async (chatId: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const pinnedRes = await fetch(`${API_BASE_URL}/api/chats/${chatId}/pinned-messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const pinnedData = await pinnedRes.json();
            if (Array.isArray(pinnedData)) {
                setPinnedMessages(pinnedData);
            }
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn đã ghim:', error);
        }
    };

    useEffect(() => {
        if (!currentUserId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                if (!authToken) {
                    setLoading(false);
                    return;
                }

                if (routeChatId) {
                    console.log('Fetching chat data for:', routeChatId);

                    // Lấy thông tin chat
                    const chatRes = await fetch(`${API_BASE_URL}/api/chats/${routeChatId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });

                    if (!chatRes.ok) {
                        throw new Error('Failed to fetch chat data');
                    }

                    const chatData = await chatRes.json();
                    console.log('Chat data received:', chatData);
                    setChat(chatData);
                    chatIdRef.current = routeChatId;

                    // Load tin nhắn từ server
                    console.log('Loading messages from server');
                    await loadMessages(routeChatId);

                    // Lấy tin nhắn đã ghim
                    await fetchPinnedMessages(routeChatId);

                    // Thiết lập Socket.IO
                    setupSocket(authToken, routeChatId);
                }
            } catch (err) {
                console.error('Error in fetchData:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [chatPartner._id, routeChatId, currentUserId]);

    return (
        <View style={{
            flex: 1,

        }}>

            <ImageBackground
                source={require('../../assets/chat-background.png')}
                style={{
                    flex: 1,
                    paddingTop: Platform.OS === 'android' ? insets.top : 0,
                }}

            >

                <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
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
                                    source={{ uri: getAvatar(chatPartner) }}
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
                                        backgroundColor: isUserOnline(chatPartner._id) ? 'green' : '#bbb',
                                        borderWidth: 2,
                                        borderColor: 'white',
                                    }}
                                />
                            </View>
                            <View style={{ justifyContent: 'center' }}>
                                <Text className="font-bold text-lg" style={{ marginBottom: 0 }}>{chatPartner.fullname}</Text>
                                <Text style={{ fontSize: 12, color: '#444', fontFamily: 'Inter', fontWeight: 'medium' }}>
                                    {isUserOnline(chatPartner._id) ? 'Đang hoạt động' : getFormattedLastSeen(chatPartner._id)}
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
                            ) : messages.length === 0 ? (
                                <View className="flex-1 items-center justify-center">
                                    <Text style={{ fontFamily: 'Inter', fontWeight: 'medium' }}>Chưa có tin nhắn nào</Text>
                                </View>
                            ) : (
                                <FlatList
                                    ref={flatListRef}
                                            data={dataForFlatList}
                                            inverted
                                            keyExtractor={keyExtractor}
                                            ListHeaderComponent={() => (
                                                otherTyping ? (
                                            <View className="flex-row justify-start items-end mx-2 mt-4 mb-1">
                                                <View className="relative mr-1.5">
                                                    <Image
                                                        source={{ uri: getAvatar(chatPartner) }}
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
                                            renderItem={renderItem}
                                            contentContainerStyle={{
                                        paddingVertical: 10,
                                        paddingBottom: keyboardVisible ? 10 : (insets.bottom + 50),
                                    }}
                                            removeClippedSubviews={true}
                                            maxToRenderPerBatch={10}
                                            windowSize={10}
                                            updateCellsBatchingPeriod={50}
                                            initialNumToRender={15}
                                            onEndReachedThreshold={0.5}
                                            onEndReached={handleLoadMore}
                                            maintainVisibleContentPosition={{
                                                minIndexForVisible: 0,
                                                autoscrollToTopThreshold: 10
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
                                            quality: 0.7, // Giảm chất lượng xuống 70%
                                            allowsEditing: false, // Bỏ tính năng crop
                                            exif: true, // Giữ thông tin EXIF
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
                                                        quality: 0.7, // Giảm chất lượng xuống 70%
                                                        allowsEditing: false, // Bỏ tính năng crop
                                                        exif: true, // Giữ thông tin EXIF
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
                        {showEmojiPicker && (
                            <EmojiPicker
                                customEmojis={customEmojis}
                                handleSendEmoji={handleSendEmoji}
                                setShowEmojiPicker={setShowEmojiPicker}
                            />
                        )}

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

                    {/* Thêm component ImageViewerModal vào render */}
                    <ImageViewerModal
                        images={viewerImages}
                        imageIndex={viewerInitialIndex}
                        visible={viewerVisible}
                        onRequestClose={() => setViewerVisible(false)}
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

                    {forwardMessage && currentUserId && currentUser && (
                        <ForwardMessageSheet
                            visible={showForwardSheet}
                            onClose={() => {
                                setShowForwardSheet(false);
                                setForwardMessage(null);
                            }}
                            message={forwardMessage}
                            currentUser={currentUser} // Sửa: Truyền đúng currentUser
                            onForward={forwardSingleMessage}
                        />
                    )}

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